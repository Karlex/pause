import { and, eq, gte, lte, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leaveBalances, leaveRequests, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const managerRoutes = new Elysia({ prefix: "/manager" })
	.onBeforeHandle(async ({ request, set }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		// Check if user has manager permissions
		const userRole = (session.user as { role?: string }).role;
		if (!["manager", "hr_admin", "super_admin"].includes(userRole || "")) {
			set.status = 403;
			return { error: "Insufficient permissions" };
		}
	})
	.get(
		"/team",
		async ({ request }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			const isSuperAdmin =
				(session?.user as { role?: string })?.role === "super_admin";

			// Get team members
			let teamMembers: Awaited<ReturnType<typeof db.query.users.findMany>>;
			if (isSuperAdmin) {
				// Super admin sees all users
				teamMembers = await db.query.users.findMany({
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
						role: true,
					},
					orderBy: sql`${users.name} ASC`,
				});
			} else {
				// Manager sees only their direct reports
				teamMembers = await db.query.users.findMany({
					where: eq(users.managerId, session?.user?.id || ""),
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
						role: true,
					},
					orderBy: sql`${users.name} ASC`,
				});
			}

			// Get current year
			const currentYear = new Date().getFullYear();

			// For each team member, get their leave balances and upcoming requests
			const teamWithDetails = await Promise.all(
				teamMembers.map(async (member) => {
					// Get leave balances
					const balances = await db.query.leaveBalances.findMany({
						where: and(
							eq(leaveBalances.userId, member.id),
							eq(leaveBalances.year, currentYear),
						),
						with: {
							leaveType: true,
						},
					});

					// Get upcoming approved requests
					const today = new Date().toISOString().split("T")[0];
					const upcomingRequests = await db.query.leaveRequests.findMany({
						where: and(
							eq(leaveRequests.userId, member.id),
							eq(leaveRequests.status, "approved"),
							gte(leaveRequests.startDate, today),
						),
						with: {
							leaveType: true,
						},
						orderBy: sql`${leaveRequests.startDate} ASC`,
						limit: 3,
					});

					// Check if currently on leave
					const currentlyOnLeave = await db.query.leaveRequests.findFirst({
						where: and(
							eq(leaveRequests.userId, member.id),
							eq(leaveRequests.status, "approved"),
							lte(leaveRequests.startDate, today),
							gte(leaveRequests.endDate, today),
						),
					});

					return {
						id: member.id,
						name: member.name,
						email: member.email,
						image: member.image ?? undefined,
						role: member.role,
						balances: balances
							.filter((b) => ["annual", "sick"].includes(b.leaveType.code)) // Only show Annual and Sick leave
							.map((b) => ({
								leaveTypeName: b.leaveType.name,
								leaveTypeCode: b.leaveType.code,
								allowance: b.allowance / 8, // Convert hours to days
								used: b.used / 8,
								remaining: (b.allowance - b.used - b.scheduled) / 8,
							})),
						upcomingRequests: upcomingRequests.map((r) => ({
							id: r.id,
							startDate: r.startDate,
							endDate: r.endDate,
							leaveTypeName: r.leaveType.name,
							days: r.totalHours / 8,
						})),
						isOnLeave: !!currentlyOnLeave,
					};
				}),
			);

			logger.info(
				{ userId: session?.user?.id, teamSize: teamWithDetails.length },
				"Fetched team data for manager dashboard",
			);

			return { team: teamWithDetails };
		},
		{
			response: {
				200: t.Object({
					team: t.Array(
						t.Object({
							id: t.String(),
							name: t.String(),
							email: t.String(),
							image: t.Optional(t.String()),
							role: t.String(),
							balances: t.Array(
								t.Object({
									leaveTypeName: t.String(),
									leaveTypeCode: t.String(),
									allowance: t.Number(),
									used: t.Number(),
									remaining: t.Number(),
								}),
							),
							upcomingRequests: t.Array(
								t.Object({
									id: t.String(),
									startDate: t.String(),
									endDate: t.String(),
									leaveTypeName: t.String(),
									days: t.Number(),
								}),
							),
							isOnLeave: t.Boolean(),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	);
