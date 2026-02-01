import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leaveBalances, leavePolicies, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const employeesRoutes = new Elysia({ prefix: "/employees" })
	.onBeforeHandle(async ({ request, set }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		// Check if user has admin permissions
		const userRole = (session.user as { role?: string }).role;
		if (!["hr_admin", "super_admin"].includes(userRole || "")) {
			set.status = 403;
			return { error: "Insufficient permissions" };
		}
	})
	.get(
		"/",
		async ({ request }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			const allUsers = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
					department: true,
					location: true,
					startDate: true,
					createdAt: true,
					managerId: true,
					policyId: true,
				},
				orderBy: sql`${users.name} ASC`,
			});

			// Get manager names for each user
			const employeesWithManagers = await Promise.all(
				allUsers.map(async (user) => {
					let managerName: string | undefined;
					if (user.managerId) {
						const manager = await db.query.users.findFirst({
							where: eq(users.id, user.managerId),
							columns: { name: true },
						});
						managerName = manager?.name ?? undefined;
					}
					return {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image ?? undefined,
						role: user.role,
						department: user.department ?? undefined,
						location: user.location,
						startDate: user.startDate ?? undefined,
						createdAt: user.createdAt,
						managerId: user.managerId ?? undefined,
						managerName,
						policyId: user.policyId ?? undefined,
					};
				}),
			);

			logger.info(
				{ userId: session?.user?.id, count: allUsers.length },
				"Fetched all employees",
			);

			return { employees: employeesWithManagers };
		},
		{
			response: {
				200: t.Object({
					employees: t.Array(
						t.Object({
							id: t.String(),
							name: t.String(),
							email: t.String(),
							image: t.Optional(t.String()),
							role: t.String(),
							department: t.Optional(t.String()),
							location: t.String(),
							startDate: t.Optional(t.String()),
							createdAt: t.Date(),
							managerId: t.Optional(t.String()),
							managerName: t.Optional(t.String()),
							policyId: t.Optional(t.String()),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	)
	.post(
		"/",
		async ({ request, body, set }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			// Check if email already exists
			const existingUser = await db.query.users.findFirst({
				where: eq(users.email, body.email),
			});

			if (existingUser) {
				set.status = 400;
				return { error: "Email already exists" };
			}

			// Get default policy if none specified
			let policyId = body.policyId;
			if (!policyId) {
				const defaultPolicy = await db.query.leavePolicies.findFirst({
					where: eq(leavePolicies.isDefault, true),
				});
				if (defaultPolicy) {
					policyId = defaultPolicy.id;
				}
			}

			// Create user directly in database
			// Note: In a real implementation, we'd need to hash the password
			// For now, we'll use a placeholder that Better Auth can recognize
			const userId = crypto.randomUUID();
			await db.insert(users).values({
				id: userId,
				email: body.email,
				emailVerified: true, // Auto-verify for admin-created users
				name: body.name,
				role: body.role,
				department: body.department,
				location: body.location ?? "UK",
				timezone: body.timezone ?? "Europe/London",
				startDate: body.startDate,
				managerId: body.managerId,
				policyId: policyId,
			});

			// Initialize leave balances for the new user
			if (policyId) {
				const policy = await db.query.leavePolicies.findFirst({
					where: eq(leavePolicies.id, policyId),
				});

				if (policy) {
					const currentYear = new Date().getFullYear();
					const leaveTypesList = await db.query.leaveTypes.findMany();

					// Create balances for each leave type in the policy
					for (const leaveType of leaveTypesList) {
						const typeConfig = policy.config.leaveTypes[leaveType.code];
						if (typeConfig?.enabled) {
							await db.insert(leaveBalances).values({
								userId: userId,
								leaveTypeId: leaveType.id,
								year: currentYear,
								allowance: typeConfig.defaultAllowanceHours,
								used: 0,
								scheduled: 0,
								carriedOver: 0,
								adjustment: 0,
							});
						}
					}
				}
			}

			logger.info(
				{ userId: session?.user?.id, newUserId: userId },
				"Created new employee",
			);

			return {
				employee: {
					id: userId,
					name: body.name,
					email: body.email,
					role: body.role,
					department: body.department,
					location: body.location ?? "UK",
					startDate: body.startDate,
					managerId: body.managerId,
					policyId: policyId,
				},
			};
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 8 }),
				name: t.String({ minLength: 1 }),
				role: t.Union([
					t.Literal("employee"),
					t.Literal("team_lead"),
					t.Literal("manager"),
					t.Literal("hr_admin"),
					t.Literal("super_admin"),
				]),
				department: t.Optional(t.String()),
				location: t.Optional(t.String()),
				timezone: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				managerId: t.Optional(t.String()),
				policyId: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					employee: t.Object({
						id: t.String(),
						name: t.String(),
						email: t.String(),
						role: t.String(),
						department: t.Optional(t.String()),
						location: t.String(),
						startDate: t.Optional(t.String()),
						managerId: t.Optional(t.String()),
						policyId: t.Optional(t.String()),
					}),
				}),
				400: t.Object({ error: t.String() }),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	)
	.get(
		"/managers",
		async ({ request }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			const managers = await db.query.users.findMany({
				where: sql`${users.role} IN ('manager', 'hr_admin', 'super_admin')`,
				columns: {
					id: true,
					name: true,
					email: true,
				},
				orderBy: sql`${users.name} ASC`,
			});

			logger.info(
				{ userId: session?.user?.id, count: managers.length },
				"Fetched managers list",
			);

			return { managers };
		},
		{
			response: {
				200: t.Object({
					managers: t.Array(
						t.Object({
							id: t.String(),
							name: t.String(),
							email: t.String(),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	);
