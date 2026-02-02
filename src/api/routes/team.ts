import { and, eq, gte, lte, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leaveRequests, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Helper to safely extract single relation object
function getRelation<T>(relation: T | T[] | undefined): T | undefined {
	if (Array.isArray(relation)) {
		return relation[0];
	}
	return relation;
}

export const teamRoutes = new Elysia({ prefix: "/team" })
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
		"/whos-out",
		async ({ request, query }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			// Parse date range from query params, default to today + 7 days
			const today = new Date();
			const startDate = query.startDate || today.toISOString().split("T")[0];
			const endDate =
				query.endDate ||
				new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0];

			// Get approved leave requests within the date range
			// A request is "out" if it overlaps with the query date range
			const outRequests = await db.query.leaveRequests.findMany({
				where: and(
					eq(leaveRequests.status, "approved"),
					// Request overlaps with date range if:
					// request.startDate <= endDate AND request.endDate >= startDate
					lte(leaveRequests.startDate, endDate),
					gte(leaveRequests.endDate, startDate),
				),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					leaveType: true,
				},
				orderBy: sql`${leaveRequests.startDate} ASC`,
			});

			// Group by user for the response
			const userMap = new Map();
			for (const request of outRequests) {
				const user = getRelation(request.user);
				const leaveType = getRelation(request.leaveType);

				if (!user || !leaveType) continue;

				const userId = user.id;
				if (!userMap.has(userId)) {
					userMap.set(userId, {
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
							image: user.image ?? undefined,
						},
						absences: [],
					});
				}
				userMap.get(userId).absences.push({
					id: request.id,
					startDate: request.startDate,
					endDate: request.endDate,
					leaveType: {
						name: leaveType.name,
						code: leaveType.code,
						colour: leaveType.colour,
					},
					totalHours: request.totalHours,
					days: Math.ceil(request.totalHours / 8),
				});
			}

			const whosOut = Array.from(userMap.values());

			logger.info(
				{
					userId: session?.user?.id,
					startDate,
					endDate,
					count: whosOut.length,
				},
				"Fetched who's out data",
			);

			return {
				whosOut,
				dateRange: { startDate, endDate },
			};
		},
		{
			query: t.Object({
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					whosOut: t.Array(
						t.Object({
							user: t.Object({
								id: t.String(),
								name: t.String(),
								email: t.String(),
								image: t.Optional(t.String()),
							}),
							absences: t.Array(
								t.Object({
									id: t.String(),
									startDate: t.String(),
									endDate: t.String(),
									leaveType: t.Object({
										name: t.String(),
										code: t.String(),
										colour: t.String(),
									}),
									totalHours: t.Number(),
									days: t.Number(),
								}),
							),
						}),
					),
					dateRange: t.Object({
						startDate: t.String(),
						endDate: t.String(),
					}),
				}),
				401: t.Object({ error: t.String() }),
			},
		},
	)
	.get(
		"/calendar",
		async ({ request, query }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			// Parse month/year from query params, default to current month
			const now = new Date();
			const year = query.year ? parseInt(query.year, 10) : now.getFullYear();
			const month = query.month
				? parseInt(query.month, 10)
				: now.getMonth() + 1;

			// Calculate start and end of month
			const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
			const lastDay = new Date(year, month, 0).getDate();
			const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

			// Get all approved leave requests within the month
			const leaveEvents = await db.query.leaveRequests.findMany({
				where: and(
					eq(leaveRequests.status, "approved"),
					lte(leaveRequests.startDate, endDate),
					gte(leaveRequests.endDate, startDate),
				),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					leaveType: true,
				},
				orderBy: sql`${leaveRequests.startDate} ASC`,
			});

			// Format events for calendar
			const events = leaveEvents.map((request) => {
				const user = getRelation(request.user);
				const leaveType = getRelation(request.leaveType);

				return {
					id: request.id,
					userId: user?.id || "",
					userName: user?.name || "Unknown",
					userImage: user?.image ?? undefined,
					startDate: request.startDate,
					endDate: request.endDate,
					leaveType: {
						name: leaveType?.name || "Leave",
						code: leaveType?.code || "unknown",
						colour: leaveType?.colour || "#8b5cf6",
					},
					totalHours: request.totalHours,
					days: Math.ceil(request.totalHours / 8),
				};
			});

			logger.info(
				{
					userId: session?.user?.id,
					year,
					month,
					eventCount: events.length,
				},
				"Fetched team calendar data",
			);

			return {
				events,
				month,
				year,
			};
		},
		{
			query: t.Object({
				year: t.Optional(t.String()),
				month: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					events: t.Array(
						t.Object({
							id: t.String(),
							userId: t.String(),
							userName: t.String(),
							userImage: t.Optional(t.String()),
							startDate: t.String(),
							endDate: t.String(),
							leaveType: t.Object({
								name: t.String(),
								code: t.String(),
								colour: t.String(),
							}),
							totalHours: t.Number(),
							days: t.Number(),
						}),
					),
					month: t.Number(),
					year: t.Number(),
				}),
				401: t.Object({ error: t.String() }),
			},
		},
	)
	// Get all team members (employees)
	.get(
		"/members",
		async ({ request }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			// Get all users with their manager info
			const teamMembers = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
					location: true,
					timezone: true,
					startDate: true,
				},
				with: {
					manager: {
						columns: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: sql`${users.name} ASC`,
			});

			logger.info(
				{
					userId: session?.user?.id,
					count: teamMembers.length,
				},
				"Fetched team members",
			);

			return {
				members: teamMembers.map((member) => {
					const manager = getRelation(member.manager);
					return {
						id: member.id,
						name: member.name,
						email: member.email,
						image: member.image ?? undefined,
						role: member.role,
						location: member.location,
						timezone: member.timezone,
						startDate: member.startDate,
						manager: manager
							? {
									id: manager.id,
									name: manager.name,
									email: manager.email,
								}
							: undefined,
					};
				}),
			};
		},
		{
			response: {
				200: t.Object({
					members: t.Array(
						t.Object({
							id: t.String(),
							name: t.String(),
							email: t.String(),
							image: t.Optional(t.String()),
							role: t.String(),
							location: t.String(),
							timezone: t.String(),
							startDate: t.Optional(t.String()),
							manager: t.Optional(
								t.Object({
									id: t.String(),
									name: t.String(),
									email: t.String(),
								}),
							),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
			},
		},
	);
