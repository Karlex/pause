import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import type { permissionActionEnum, permissionResourceEnum } from "@/db/schema";
import { departments, rolePermissions, roles, userRoles } from "@/db/schema";
import { logCreate, logDelete, logUpdate } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkPermission, getUserPermissions } from "@/lib/permissions";

type PermissionAction = (typeof permissionActionEnum.enumValues)[number];
type PermissionResource = (typeof permissionResourceEnum.enumValues)[number];

export const rbacRoutes = new Elysia({ prefix: "/rbac" })
	// Middleware: Check authentication and attach user
	.derive(async ({ request, set }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			set.status = 401;
			return { user: null };
		}
		return { user: session.user };
	})

	// ==================== ROLES ====================

	// Get all roles
	.get("/roles", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "roles",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const allRoles = await db.query.roles.findMany({
			with: {
				permissions: true,
			},
			orderBy: (roles, { desc }) => [desc(roles.isSystem), roles.name],
		});

		return { roles: allRoles };
	})

	// Get single role
	.get("/roles/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "roles",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const role = await db.query.roles.findFirst({
			where: eq(roles.id, params.id),
			with: {
				permissions: true,
			},
		});

		if (!role) {
			set.status = 404;
			return { error: "Role not found" };
		}

		return { role };
	})

	// Create role
	.post(
		"/roles",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "roles",
				action: "create",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// Create role
			const newRoles = await db
				.insert(roles)
				.values({
					name: body.name,
					description: body.description,
					isSystem: false,
				})
				.returning();

			const newRole = newRoles[0];

			// Create permissions
			if (body.permissions && body.permissions.length > 0) {
				const permissionValues = body.permissions.map((perm) => ({
					roleId: newRole.id,
					resource: perm.resource as PermissionResource,
					action: perm.action as PermissionAction,
					conditions: perm.conditions || null,
				}));
				await db.insert(rolePermissions).values(permissionValues);
			}

			// Audit log
			await logCreate("roles", newRole.id, user.id, {
				name: body.name,
				permissions: body.permissions,
			});

			return { role: newRole };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				permissions: t.Optional(
					t.Array(
						t.Object({
							resource: t.String(),
							action: t.String(),
							conditions: t.Optional(t.Record(t.String(), t.Unknown())),
						}),
					),
				),
			}),
		},
	)

	// Update role
	.put(
		"/roles/:id",
		async ({ params, body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "roles",
				action: "edit",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// Get existing role
			const existingRole = await db.query.roles.findFirst({
				where: eq(roles.id, params.id),
			});

			if (!existingRole) {
				set.status = 404;
				return { error: "Role not found" };
			}

			// Cannot edit system roles
			if (existingRole.isSystem) {
				set.status = 403;
				return { error: "Cannot modify system roles" };
			}

			// Update role
			const updatedRoles = await db
				.update(roles)
				.set({
					name: body.name,
					description: body.description,
					updatedAt: new Date(),
				})
				.where(eq(roles.id, params.id))
				.returning();

			const updatedRole = updatedRoles[0];

			// Update permissions if provided
			if (body.permissions) {
				// Delete existing permissions
				await db
					.delete(rolePermissions)
					.where(eq(rolePermissions.roleId, params.id));

				// Insert new permissions
				if (body.permissions.length > 0) {
					const permissionValues = body.permissions.map((perm) => ({
						roleId: params.id,
						resource: perm.resource as PermissionResource,
						action: perm.action as PermissionAction,
						conditions: perm.conditions || null,
					}));
					await db.insert(rolePermissions).values(permissionValues);
				}
			}

			// Audit log
			await logUpdate(
				"roles",
				params.id,
				user.id,
				{ name: existingRole.name, description: existingRole.description },
				{ name: body.name, description: body.description },
			);

			return { role: updatedRole };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				permissions: t.Optional(
					t.Array(
						t.Object({
							resource: t.String(),
							action: t.String(),
							conditions: t.Optional(t.Record(t.String(), t.Unknown())),
						}),
					),
				),
			}),
		},
	)

	// Delete role
	.delete("/roles/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "roles",
			action: "delete",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		// Get existing role
		const existingRole = await db.query.roles.findFirst({
			where: eq(roles.id, params.id),
		});

		if (!existingRole) {
			set.status = 404;
			return { error: "Role not found" };
		}

		// Cannot delete system roles
		if (existingRole.isSystem) {
			set.status = 403;
			return { error: "Cannot delete system roles" };
		}

		// Check if role is assigned to any users
		const userCountResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(userRoles)
			.where(eq(userRoles.roleId, params.id));

		const userCount = userCountResult[0]?.count || 0;

		if (userCount > 0) {
			set.status = 400;
			return { error: "Cannot delete role assigned to users" };
		}

		// Delete role (permissions will cascade)
		await db.delete(roles).where(eq(roles.id, params.id));

		// Audit log
		await logDelete("roles", params.id, user.id, existingRole);

		return { success: true };
	})

	// ==================== DEPARTMENTS ====================

	// Get all departments
	.get("/departments", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "departments",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const allDepartments = await db.query.departments.findMany({
			with: {
				manager: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
			orderBy: (departments, { asc }) => [asc(departments.name)],
		});

		return { departments: allDepartments };
	})

	// Get single department
	.get("/departments/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "departments",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const department = await db.query.departments.findFirst({
			where: eq(departments.id, params.id),
			with: {
				manager: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
		});

		if (!department) {
			set.status = 404;
			return { error: "Department not found" };
		}

		return { department };
	})

	// Create department
	.post(
		"/departments",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "departments",
				action: "create",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			const newDepartments = await db
				.insert(departments)
				.values({
					name: body.name,
					description: body.description,
					managerId: body.managerId || null,
				})
				.returning();

			const newDepartment = newDepartments[0];

			// Audit log
			await logCreate("departments", newDepartment.id, user.id, {
				name: body.name,
				managerId: body.managerId,
			});

			return { department: newDepartment };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				managerId: t.Optional(t.String()),
			}),
		},
	)

	// Update department
	.put(
		"/departments/:id",
		async ({ params, body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "departments",
				action: "edit",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			const existingDepartment = await db.query.departments.findFirst({
				where: eq(departments.id, params.id),
			});

			if (!existingDepartment) {
				set.status = 404;
				return { error: "Department not found" };
			}

			const updatedDepartments = await db
				.update(departments)
				.set({
					name: body.name,
					description: body.description,
					managerId: body.managerId || null,
					updatedAt: new Date(),
				})
				.where(eq(departments.id, params.id))
				.returning();

			const updatedDepartment = updatedDepartments[0];

			// Audit log
			await logUpdate(
				"departments",
				params.id,
				user.id,
				{
					name: existingDepartment.name,
					description: existingDepartment.description,
					managerId: existingDepartment.managerId,
				},
				{
					name: body.name,
					description: body.description,
					managerId: body.managerId,
				},
			);

			return { department: updatedDepartment };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				managerId: t.Optional(t.String()),
			}),
		},
	)

	// Delete department
	.delete("/departments/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "departments",
			action: "delete",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const existingDepartment = await db.query.departments.findFirst({
			where: eq(departments.id, params.id),
		});

		if (!existingDepartment) {
			set.status = 404;
			return { error: "Department not found" };
		}

		await db.delete(departments).where(eq(departments.id, params.id));

		// Audit log
		await logDelete("departments", params.id, user.id, existingDepartment);

		return { success: true };
	})

	// Get current user permissions
	.get("/permissions", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const permissions = await getUserPermissions(user.id);
		return { permissions };
	});
