import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leaveBalances, leaveRequests, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { canAccessRecord, checkPermission } from "@/lib/permissions";

export const approvalsRoutes = new Elysia({ prefix: "/approvals" })
	// Middleware: Check authentication and attach user
	.derive(async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		return { user: session?.user || null };
	})

	// Get pending approvals
	.get(
		"/pending",
		async ({ user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			// Check permission to approve leave requests
			const result = await checkPermission({
				userId: user.id,
				resource: "leave_requests",
				action: "approve",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			let pendingRequests: Array<{
				id: string;
				startDate: string;
				endDate: string;
				status: string;
				totalHours: number;
				note: string | null;
				createdAt: Date;
				leaveType: { id: string; name: string; code: string };
				user: { id: string; name: string; email: string; image: string | null };
			}>;

			if (result.conditions?.direct_reports_only) {
				// Manager sees only their direct reports' requests
				const requests = await db.query.leaveRequests.findMany({
					where: and(
						eq(leaveRequests.status, "pending"),
						eq(users.managerId, user.id),
					),
					with: {
						leaveType: true,
						user: {
							columns: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
					},
					orderBy: desc(leaveRequests.createdAt),
				});
				pendingRequests = requests.map((r) => ({
					...r,
					leaveType: Array.isArray(r.leaveType) ? r.leaveType[0] : r.leaveType,
					user: Array.isArray(r.user) ? r.user[0] : r.user,
				}));
			} else {
				// Super admin/HR admin sees all pending requests
				const requests = await db.query.leaveRequests.findMany({
					where: eq(leaveRequests.status, "pending"),
					with: {
						leaveType: true,
						user: {
							columns: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
					},
					orderBy: desc(leaveRequests.createdAt),
				});
				pendingRequests = requests.map((r) => ({
					...r,
					leaveType: Array.isArray(r.leaveType) ? r.leaveType[0] : r.leaveType,
					user: Array.isArray(r.user) ? r.user[0] : r.user,
				}));
			}

			logger.info(
				{ userId: user.id, count: pendingRequests.length },
				"Fetched pending approvals",
			);

			// Transform null values to undefined for Elysia validation
			const transformedRequests = pendingRequests.map((req) => ({
				id: req.id,
				startDate: req.startDate,
				endDate: req.endDate,
				status: req.status,
				totalHours: req.totalHours,
				note: req.note ?? undefined,
				createdAt: req.createdAt.toISOString(),
				leaveType: req.leaveType,
				user: {
					id: req.user.id,
					name: req.user.name,
					email: req.user.email,
					image: req.user.image ?? undefined,
				},
			}));

			return { requests: transformedRequests };
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
							note: t.Optional(t.String()),
							createdAt: t.String(),
							leaveType: t.Object({
								id: t.String(),
								name: t.String(),
								code: t.String(),
							}),
							user: t.Object({
								id: t.String(),
								name: t.String(),
								email: t.String(),
								image: t.Optional(t.String()),
							}),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	)

	// Get pending count only
	.get(
		"/count",
		async ({ user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			// Check permission to approve leave requests
			const result = await checkPermission({
				userId: user.id,
				resource: "leave_requests",
				action: "approve",
			});

			if (!result.allowed) {
				return { count: 0 };
			}

			let count: number;

			if (result.conditions?.direct_reports_only) {
				// Manager counts only their direct reports' pending requests
				const requests = await db.query.leaveRequests.findMany({
					where: and(
						eq(leaveRequests.status, "pending"),
						eq(users.managerId, user.id),
					),
					with: { user: true },
				});
				count = requests.length;
			} else {
				// Super admin/HR admin counts all pending requests
				const requests = await db.query.leaveRequests.findMany({
					where: eq(leaveRequests.status, "pending"),
				});
				count = requests.length;
			}

			return { count };
		},
		{
			response: {
				200: t.Object({ count: t.Number() }),
				401: t.Object({ error: t.String() }),
			},
		},
	)

	// Approve a request
	.post(
		"/:id/approve",
		async ({ user, params, body, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			try {
				const { note } = body || {};

				// Get the request
				const leaveRequest = await db.query.leaveRequests.findFirst({
					where: eq(leaveRequests.id, params.id),
					with: {
						user: true,
						leaveType: true,
					},
				});

				if (!leaveRequest) {
					set.status = 404;
					return { error: "Request not found" };
				}

				if (leaveRequest.status !== "pending") {
					set.status = 400;
					return { error: "Request is not pending" };
				}

				// Check if user can approve this specific request
				const canApprove = await canAccessRecord({
					userId: user.id,
					resource: "leave_requests",
					action: "approve",
					recordUserId: leaveRequest.userId,
				});

				if (!canApprove) {
					set.status = 403;
					return { error: "Not authorized to approve this request" };
				}

				// Update request status
				await db
					.update(leaveRequests)
					.set({
						status: "approved",
						reviewerId: user.id,
						reviewerNote: note || null,
						reviewedAt: new Date(),
					})
					.where(eq(leaveRequests.id, params.id));

				// Update user balance
				const year = new Date(leaveRequest.startDate).getFullYear();
				const balance = await db.query.leaveBalances.findFirst({
					where: and(
						eq(leaveBalances.userId, leaveRequest.userId),
						eq(leaveBalances.leaveTypeId, leaveRequest.leaveTypeId),
						eq(leaveBalances.year, year),
					),
				});

				if (balance) {
					await db
						.update(leaveBalances)
						.set({
							used: balance.used + leaveRequest.totalHours,
							scheduled: balance.scheduled - leaveRequest.totalHours,
						})
						.where(eq(leaveBalances.id, balance.id));
				}

				logger.info(
					{
						requestId: params.id,
						approverId: user.id,
						userId: leaveRequest.userId,
					},
					"Leave request approved",
				);

				return { success: true };
			} catch (error) {
				logger.error(
					{ error, requestId: params.id },
					"Failed to approve request",
				);
				set.status = 500;
				return { error: "Failed to approve request" };
			}
		},
		{
			body: t.Optional(
				t.Object({
					note: t.Optional(t.String()),
				}),
			),
			response: {
				200: t.Object({ success: t.Boolean() }),
				400: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
				404: t.Object({ error: t.String() }),
				500: t.Object({ error: t.String() }),
			},
		},
	)

	// Decline a request
	.post(
		"/:id/decline",
		async ({ user, params, body, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			try {
				const { note } = body || {};

				// Get the request
				const leaveRequest = await db.query.leaveRequests.findFirst({
					where: eq(leaveRequests.id, params.id),
				});

				if (!leaveRequest) {
					set.status = 404;
					return { error: "Request not found" };
				}

				if (leaveRequest.status !== "pending") {
					set.status = 400;
					return { error: "Request is not pending" };
				}

				// Check if user can decline this specific request
				const canDecline = await canAccessRecord({
					userId: user.id,
					resource: "leave_requests",
					action: "approve", // Same permission as approve
					recordUserId: leaveRequest.userId,
				});

				if (!canDecline) {
					set.status = 403;
					return { error: "Not authorized to decline this request" };
				}

				// Restore the scheduled balance since request was declined
				const year = new Date(leaveRequest.startDate).getFullYear();
				const balance = await db.query.leaveBalances.findFirst({
					where: and(
						eq(leaveBalances.userId, leaveRequest.userId),
						eq(leaveBalances.leaveTypeId, leaveRequest.leaveTypeId),
						eq(leaveBalances.year, year),
					),
				});

				if (balance) {
					await db
						.update(leaveBalances)
						.set({
							scheduled: balance.scheduled - leaveRequest.totalHours,
						})
						.where(eq(leaveBalances.id, balance.id));
				}

				// Update request status
				await db
					.update(leaveRequests)
					.set({
						status: "declined",
						reviewerId: user.id,
						reviewerNote: note || null,
						reviewedAt: new Date(),
					})
					.where(eq(leaveRequests.id, params.id));

				logger.info(
					{
						requestId: params.id,
						declinerId: user.id,
						userId: leaveRequest.userId,
					},
					"Leave request declined",
				);

				return { success: true };
			} catch (error) {
				logger.error(
					{ error, requestId: params.id },
					"Failed to decline request",
				);
				set.status = 500;
				return { error: "Failed to decline request" };
			}
		},
		{
			body: t.Optional(
				t.Object({
					note: t.Optional(t.String()),
				}),
			),
			response: {
				200: t.Object({ success: t.Boolean() }),
				400: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
				404: t.Object({ error: t.String() }),
				500: t.Object({ error: t.String() }),
			},
		},
	);
