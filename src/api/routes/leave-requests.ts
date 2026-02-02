import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, pool } from "@/db";
import { leaveRequests, leaveTypes, users } from "@/db/schema";
import { logCreate, logDelete } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { sanitizeInput } from "@/lib/encryption";
import { calculateWorkingDays } from "@/lib/holidays";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";

export const leaveRequestsRoutes = new Elysia({ prefix: "/leave-requests" })
	// Middleware: Check authentication and attach user
	.derive(async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		return { user: session?.user || null };
	})

	// Get all leave requests
	.get("/", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		// Check permission
		const result = await checkPermission({
			userId: user.id,
			resource: "leave_requests",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		// Build query based on permissions
		let whereClause:
			| ReturnType<typeof eq>
			| ReturnType<typeof inArray>
			| undefined;
		if (result.conditions?.own_records_only) {
			whereClause = eq(leaveRequests.userId, user.id);
		} else if (result.conditions?.direct_reports_only) {
			// Get direct reports
			const directReports = await db.query.users.findMany({
				where: eq(users.managerId, user.id),
				columns: { id: true },
			});
			const reportIds = directReports.map((r) => r.id);
			if (reportIds.length > 0) {
				whereClause = inArray(leaveRequests.userId, [...reportIds, user.id]);
			} else {
				whereClause = eq(leaveRequests.userId, user.id);
			}
		}

		const requests = await db.query.leaveRequests.findMany({
			where: whereClause,
			with: {
				leaveType: true,
				user: {
					columns: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: sql`${leaveRequests.startDate} DESC`,
		});

		return { requests };
	})

	// Create leave request
	.post(
		"/",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			// Check permission
			const result = await checkPermission({
				userId: user.id,
				resource: "leave_requests",
				action: "create",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			const client = await pool.connect();

			try {
				await client.query("BEGIN");

				const { startDate, endDate, leaveTypeId, note, halfDay } = body as {
					startDate: string;
					endDate: string;
					leaveTypeId: string;
					note?: string;
					halfDay?: boolean;
				};

				const leaveType = await db.query.leaveTypes.findFirst({
					where: eq(leaveTypes.id, leaveTypeId),
				});

				if (!leaveType) {
					await client.query("ROLLBACK");
					set.status = 400;
					return { error: "Invalid leave type" };
				}

				const workingDays = calculateWorkingDays(
					new Date(startDate),
					new Date(endDate),
				);

				if (workingDays === 0) {
					await client.query("ROLLBACK");
					set.status = 400;
					return { error: "Selected dates contain no working days" };
				}

				// Check for overlapping leave requests
				const overlappingRequests = await db.query.leaveRequests.findMany({
					where: and(
						eq(leaveRequests.userId, user.id),
						// Overlap condition: existing.start <= new.end AND existing.end >= new.start
						lte(leaveRequests.startDate, endDate),
						gte(leaveRequests.endDate, startDate),
					),
				});

				if (overlappingRequests.length > 0) {
					await client.query("ROLLBACK");
					set.status = 400;
					return {
						error: "You already have a leave request for these dates",
						details: `Overlapping with ${overlappingRequests.length} existing request(s)`,
					};
				}

				// Half days are 4 hours instead of the standard 8
				const hoursPerDay = halfDay ? 4 : 8;
				const totalHours = workingDays * hoursPerDay;

				const year = new Date(startDate).getFullYear();

				// Row-level locking prevents concurrent requests from overspending the same balance
				const balanceResult = await client.query(
					`SELECT id, allowance, used, scheduled 
         FROM leave_balances 
         WHERE user_id = $1 
           AND leave_type_id = $2 
           AND year = $3 
         FOR UPDATE`,
					[user.id, leaveTypeId, year],
				);

				const balance = balanceResult.rows[0];

				if (balance && balance.allowance > 0) {
					const available =
						Number(balance.allowance) -
						Number(balance.used) -
						Number(balance.scheduled);
					if (totalHours > available) {
						await client.query("ROLLBACK");
						set.status = 400;
						return { error: "Insufficient leave balance" };
					}
				}

				// Check if user can auto-approve (Super Admin or HR Admin)
				const canApproveResult = await checkPermission({
					userId: user.id,
					resource: "leave_requests",
					action: "approve",
				});

				const isAutoApproved = canApproveResult.allowed;
				const requestId = crypto.randomUUID();

				await client.query(
					`INSERT INTO leave_requests (
          id, user_id, leave_type_id, start_date, end_date, 
          start_time, end_time, total_hours, working_hours, status,
          note, reviewer_id, reviewed_at, auto_approved, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
					[
						requestId,
						user.id,
						leaveTypeId,
						startDate,
						endDate,
						halfDay ? "09:00" : "09:00",
						halfDay ? "13:00" : "17:00",
						totalHours,
						totalHours,
						isAutoApproved ? "approved" : "pending",
						sanitizeInput(note) || null,
						isAutoApproved ? user.id : null,
						isAutoApproved ? new Date() : null,
						isAutoApproved,
					],
				);

				if (isAutoApproved && balance) {
					await client.query(
						`UPDATE leave_balances 
           SET used = used + $1, updated_at = NOW()
           WHERE id = $2`,
						[totalHours, balance.id],
					);
				}

				await client.query("COMMIT");

				const newRequest = await db.query.leaveRequests.findFirst({
					where: eq(leaveRequests.id, requestId),
					with: { leaveType: true },
				});

				// Audit log
				await logCreate("leave_requests", requestId, user.id, {
					startDate,
					endDate,
					leaveTypeId,
					totalHours,
					status: isAutoApproved ? "approved" : "pending",
				});

				logger.info(
					{
						requestId: newRequest?.id,
						userId: user.id,
						leaveType: leaveType.name,
						days: workingDays,
						autoApproved: isAutoApproved,
					},
					"Leave request created",
				);

				return { request: newRequest };
			} catch (error) {
				await client.query("ROLLBACK");
				const errorDetails =
					error instanceof Error
						? { message: error.message, stack: error.stack, name: error.name }
						: { error: String(error) };
				logger.error(
					{ error: errorDetails, userId: user.id, body },
					"Failed to create leave request",
				);
				set.status = 500;
				return {
					error: "Failed to create leave request",
					details: errorDetails.message,
				};
			} finally {
				client.release();
			}
		},
		{
			body: t.Object({
				startDate: t.String(),
				endDate: t.String(),
				leaveTypeId: t.String(),
				note: t.Optional(t.String()),
				halfDay: t.Optional(t.Boolean()),
			}),
		},
	)

	// Delete leave request
	.delete("/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const { id } = params;

		// Fetch the leave request to check ownership and status
		const request = await db.query.leaveRequests.findFirst({
			where: eq(leaveRequests.id, id),
		});

		if (!request) {
			set.status = 404;
			return { error: "Leave request not found" };
		}

		// Check if user has delete permission
		const canDeleteResult = await checkPermission({
			userId: user.id,
			resource: "leave_requests",
			action: "delete",
		});

		// Allow delete if:
		// 1. User has unrestricted delete permission, OR
		// 2. User owns the record and has own_records_only permission, OR
		// 3. User owns the record and it's still pending (for employees)
		const isOwner = request.userId === user.id;
		const hasUnrestrictedDelete =
			canDeleteResult.allowed && !canDeleteResult.conditions;
		const hasOwnRecordDelete =
			canDeleteResult.allowed &&
			canDeleteResult.conditions?.own_records_only &&
			isOwner;

		if (
			!hasUnrestrictedDelete &&
			!hasOwnRecordDelete &&
			!(isOwner && request.status === "pending")
		) {
			set.status = 403;
			return { error: "Forbidden - you cannot delete this leave request" };
		}

		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			// If request was approved, restore the balance
			if (request.status === "approved") {
				const year = new Date(request.startDate).getFullYear();
				await client.query(
					`UPDATE leave_balances 
					 SET used = used - $1, updated_at = NOW()
					 WHERE user_id = $2 
					   AND leave_type_id = $3 
					   AND year = $4`,
					[request.totalHours, request.userId, request.leaveTypeId, year],
				);
			}

			// Delete the request
			await db.delete(leaveRequests).where(eq(leaveRequests.id, id));

			await client.query("COMMIT");

			// Audit log
			await logDelete("leave_requests", id, user.id, {
				startDate: request.startDate,
				endDate: request.endDate,
				leaveTypeId: request.leaveTypeId,
				status: request.status,
			});

			logger.info(
				{
					requestId: id,
					userId: user.id,
					deletedBy: isOwner ? "owner" : "admin",
				},
				"Leave request deleted",
			);

			return { success: true, message: "Leave request deleted" };
		} catch (error) {
			await client.query("ROLLBACK");
			const errorDetails =
				error instanceof Error
					? { message: error.message, stack: error.stack, name: error.name }
					: { error: String(error) };
			logger.error(
				{ error: errorDetails, userId: user.id, requestId: id },
				"Failed to delete leave request",
			);
			set.status = 500;
			return {
				error: "Failed to delete leave request",
				details: errorDetails.message,
			};
		} finally {
			client.release();
		}
	});
