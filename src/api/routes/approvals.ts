import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leaveBalances, leaveRequests, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const approvalsRoutes = new Elysia({ prefix: "/approvals" })
	.onBeforeHandle(async ({ request, set }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		// Check if user has approval permissions (manager, hr_admin, super_admin)
		const userRole = session.user.role;
		if (!["manager", "hr_admin", "super_admin"].includes(userRole)) {
			set.status = 403;
			return { error: "Insufficient permissions" };
		}
	})
	.get(
		"/pending",
		async ({ request }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			// Get pending requests for users where this user is the manager
			// For super_admin, show all pending requests
			const isSuperAdmin = session.user.role === "super_admin";

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
			if (isSuperAdmin) {
				// Super admin sees all pending requests
				pendingRequests = await db.query.leaveRequests.findMany({
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
			} else {
				// Manager sees only their direct reports' requests
				pendingRequests = await db.query.leaveRequests.findMany({
					where: and(
						eq(leaveRequests.status, "pending"),
						eq(users.managerId, session.user.id),
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
			}

			logger.info(
				{ userId: session.user.id, count: pendingRequests.length },
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
	.post(
		"/:id/approve",
		async ({ request, params, body, set }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

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

				// Verify the requesting user is authorized to approve this request
				const isSuperAdmin = session.user.role === "super_admin";
				const isHRAdmin = session.user.role === "hr_admin";

				if (!isSuperAdmin && !isHRAdmin) {
					// For managers, verify they are the manager of the employee
					const employee = await db.query.users.findFirst({
						where: eq(users.id, leaveRequest.userId),
						columns: { managerId: true },
					});

					if (!employee || employee.managerId !== session.user.id) {
						set.status = 403;
						return { error: "Not authorized to approve this request" };
					}
				}

				// Update request status
				await db
					.update(leaveRequests)
					.set({
						status: "approved",
						reviewerId: session.user.id,
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
						approverId: session.user.id,
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
				404: t.Object({ error: t.String() }),
				500: t.Object({ error: t.String() }),
			},
		},
	)
	.post(
		"/:id/decline",
		async ({ request, params, body, set }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

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

				// Verify the requesting user is authorized to decline this request
				const isSuperAdmin = session.user.role === "super_admin";
				const isHRAdmin = session.user.role === "hr_admin";

				if (!isSuperAdmin && !isHRAdmin) {
					// For managers, verify they are the manager of the employee
					const employee = await db.query.users.findFirst({
						where: eq(users.id, leaveRequest.userId),
						columns: { managerId: true },
					});

					if (!employee || employee.managerId !== session.user.id) {
						set.status = 403;
						return { error: "Not authorized to decline this request" };
					}
				}

				// Update request status
				await db
					.update(leaveRequests)
					.set({
						status: "declined",
						reviewerId: session.user.id,
						reviewerNote: note || null,
						reviewedAt: new Date(),
					})
					.where(eq(leaveRequests.id, params.id));

				logger.info(
					{
						requestId: params.id,
						declinerId: session.user.id,
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
				404: t.Object({ error: t.String() }),
				500: t.Object({ error: t.String() }),
			},
		},
	);
