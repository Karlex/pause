import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leaveBalances, leavePolicies, userRoles, users } from "@/db/schema";
import { logCreate } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";

export const employeesRoutes = new Elysia({ prefix: "/employees" })
	// Middleware: Check authentication and attach user
	.derive(async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		return { user: session?.user || null };
	})

	// Get all employees
	.get(
		"/",
		async ({ user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			// Check permission
			const result = await checkPermission({
				userId: user.id,
				resource: "users",
				action: "view",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// If own_records_only, return only self
			if (result.conditions?.own_records_only) {
				const self = await db.query.users.findFirst({
					where: eq(users.id, user.id),
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
						role: true,
						location: true,
						startDate: true,
						createdAt: true,
						managerId: true,
						policyId: true,
					},
				});

				return { employees: self ? [self] : [] };
			}

			const allUsers = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
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
				allUsers.map(async (userData) => {
					let managerName: string | undefined;
					if (userData.managerId) {
						const manager = await db.query.users.findFirst({
							where: eq(users.id, userData.managerId),
							columns: { name: true },
						});
						managerName = manager?.name ?? undefined;
					}
					return {
						...userData,
						managerName,
					};
				}),
			);

			logger.info(
				{ userId: user.id, count: allUsers.length },
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
							image: t.Nullable(t.String()),
							role: t.String(),
							location: t.String(),
							startDate: t.Nullable(t.String()),
							createdAt: t.Date(),
							managerId: t.Nullable(t.String()),
							managerName: t.Optional(t.String()),
							policyId: t.Nullable(t.String()),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	)

	// Create employee
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
				resource: "users",
				action: "create",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

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

			// Create user
			const userId = crypto.randomUUID();
			await db.insert(users).values({
				id: userId,
				email: body.email,
				emailVerified: true,
				name: body.name,
				role: body.role,
				location: body.location ?? "UK",
				timezone: body.timezone ?? "Europe/London",
				startDate: body.startDate,
				managerId: body.managerId,
				policyId: policyId,
			});

			// Assign default employee role in RBAC system
			await db.insert(userRoles).values({
				userId: userId,
				roleId: "role_employee",
				isPrimary: true,
			});

			// Initialize leave balances
			if (policyId) {
				const policy = await db.query.leavePolicies.findFirst({
					where: eq(leavePolicies.id, policyId),
				});

				if (policy) {
					const currentYear = new Date().getFullYear();
					const leaveTypesList = await db.query.leaveTypes.findMany();

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

			// Audit log
			await logCreate("users", userId, user.id, {
				name: body.name,
				email: body.email,
				role: body.role,
			});

			logger.info(
				{ userId: user.id, newUserId: userId },
				"Created new employee",
			);

			return {
				employee: {
					id: userId,
					name: body.name,
					email: body.email,
					role: body.role,
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
				name: t.String({ minLength: 1 }),
				role: t.Union([
					t.Literal("employee"),
					t.Literal("team_lead"),
					t.Literal("manager"),
					t.Literal("hr_admin"),
					t.Literal("super_admin"),
				]),
				location: t.Optional(t.String()),
				timezone: t.Optional(t.String()),
				startDate: t.Nullable(t.String()),
				managerId: t.Nullable(t.String()),
				policyId: t.Nullable(t.String()),
			}),
			response: {
				200: t.Object({
					employee: t.Object({
						id: t.String(),
						name: t.String(),
						email: t.String(),
						role: t.String(),
						location: t.String(),
						startDate: t.Nullable(t.String()),
						managerId: t.Nullable(t.String()),
						policyId: t.Nullable(t.String()),
					}),
				}),
				400: t.Object({ error: t.String() }),
				401: t.Object({ error: t.String() }),
				403: t.Object({ error: t.String() }),
			},
		},
	)

	// Get managers list
	.get(
		"/managers",
		async ({ user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			// Check permission - any user with 'view' on 'users' can see managers
			const result = await checkPermission({
				userId: user.id,
				resource: "users",
				action: "view",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

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
				{ userId: user.id, count: managers.length },
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
