import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, pool } from "@/db";
import { leaveRequests, leaveTypes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { sanitizeInput } from "@/lib/encryption";
import { calculateWorkingDays } from "@/lib/holidays";
import { logger } from "@/lib/logger";

export const leaveRequestsRoutes = new Elysia({ prefix: "/leave-requests" })
	.onBeforeHandle(async ({ request, set }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			set.status = 401;
			return { error: "Unauthorized" };
		}
	})
	.get(
		"/",
		async ({ request }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			const requests = await db.query.leaveRequests.findMany({
				where: eq(leaveRequests.userId, session.user.id),
				with: {
					leaveType: true,
				},
				orderBy: sql`${leaveRequests.startDate} DESC`,
			});

			return { requests };
		},
		{
			response: {
				200: t.Object({
					requests: t.Array(
						t.Object({
							id: t.String(),
							startDate: t.String(),
							endDate: t.String(),
							status: t.String(),
							totalHours: t.Number(),
							leaveType: t.Object({
								id: t.String(),
								name: t.String(),
								code: t.String(),
							}),
						}),
					),
				}),
			},
		},
	)
	.post(
		"/",
		async ({ request, body, set }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			const client = await pool.connect();

			try {
				await client.query("BEGIN");

				const { startDate, endDate, leaveTypeId, note, halfDay } = body;

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
					[session.user.id, leaveTypeId, year],
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

				// Super admins bypass approval workflow for their own requests
				const isSuperAdmin = session.user.role === "super_admin";
				const isAutoApproved = isSuperAdmin;
				const requestId = crypto.randomUUID();
				await client.query(
					`INSERT INTO leave_requests (
						id, user_id, leave_type_id, start_date, end_date, 
						start_time, end_time, total_hours, working_hours, status,
						note, reviewer_id, reviewed_at, auto_approved, created_at, updated_at
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
					[
						requestId,
						session.user.id,
						leaveTypeId,
						startDate,
						endDate,
						halfDay ? "09:00" : "09:00",
						halfDay ? "13:00" : "17:00",
						totalHours,
						totalHours,
						isAutoApproved ? "approved" : "pending",
						sanitizeInput(note) || null,
						isAutoApproved ? session.user.id : null,
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

				logger.info(
					{
						requestId: newRequest?.id,
						userId: session.user.id,
						leaveType: leaveType.name,
						days: workingDays,
						autoApproved: isAutoApproved,
					},
					"Leave request created",
				);

				return { request: newRequest };
			} catch (error) {
				await client.query("ROLLBACK");
				logger.error(
					{ error, userId: session.user.id },
					"Failed to create leave request",
				);
				set.status = 500;
				return { error: "Failed to create leave request" };
			} finally {
				client.release();
			}
		},
		{
			body: t.Object({
				startDate: t.String(),
				endDate: t.String(),
				leaveTypeId: t.String(),
				note: t.Optional(t.String({ maxLength: 1000 })),
				halfDay: t.Optional(t.Boolean()),
			}),
			response: {
				200: t.Object({
					request: t.Object({
						id: t.String(),
						startDate: t.String(),
						endDate: t.String(),
						status: t.String(),
						totalHours: t.Number(),
						leaveType: t.Object({
							id: t.String(),
							name: t.String(),
							code: t.String(),
						}),
					}),
				}),
				400: t.Object({ error: t.String() }),
				401: t.Object({ error: t.String() }),
				500: t.Object({ error: t.String() }),
			},
		},
	);
