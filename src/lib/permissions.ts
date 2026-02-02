import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import type { permissionActionEnum, permissionResourceEnum } from "@/db/schema";
import { rolePermissions, userRoles, users } from "@/db/schema";

type PermissionAction = (typeof permissionActionEnum.enumValues)[number];
type PermissionResource = (typeof permissionResourceEnum.enumValues)[number];

export interface PermissionCheck {
	userId: string;
	resource: PermissionResource;
	action: PermissionAction;
	conditions?: Record<string, unknown>;
}

export interface PermissionResult {
	allowed: boolean;
	conditions?: Record<string, unknown>;
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission({
	userId,
	resource,
	action,
}: PermissionCheck): Promise<PermissionResult> {
	// Get all roles for the user
	const userRoleList = await db
		.select({
			roleId: userRoles.roleId,
		})
		.from(userRoles)
		.where(eq(userRoles.userId, userId));

	if (userRoleList.length === 0) {
		return { allowed: false };
	}

	const roleIds = userRoleList.map((ur) => ur.roleId);

	// Check if any role has the required permission
	const permissions = await db
		.select({
			conditions: rolePermissions.conditions,
		})
		.from(rolePermissions)
		.where(
			and(
				eq(rolePermissions.resource, resource),
				eq(rolePermissions.action, action),
				inArray(rolePermissions.roleId, roleIds),
			),
		);

	if (permissions.length === 0) {
		return { allowed: false };
	}

	// Return the most permissive conditions (or no conditions)
	const hasUnrestricted = permissions.some((p) => !p.conditions);

	if (hasUnrestricted) {
		return { allowed: true };
	}

	// Merge conditions from all roles
	const mergedConditions: Record<string, unknown> = {};
	for (const perm of permissions) {
		if (perm.conditions) {
			Object.assign(mergedConditions, perm.conditions);
		}
	}

	return {
		allowed: true,
		conditions:
			Object.keys(mergedConditions).length > 0 ? mergedConditions : undefined,
	};
}

/**
 * Check if user can access a specific record based on conditions
 */
export async function canAccessRecord({
	userId,
	resource,
	action,
	recordUserId,
}: PermissionCheck & { recordUserId?: string }): Promise<boolean> {
	const result = await checkPermission({ userId, resource, action });

	if (!result.allowed) {
		return false;
	}

	// If no conditions, access is granted
	if (!result.conditions) {
		return true;
	}

	// Check own_records_only condition
	if (result.conditions.own_records_only && recordUserId) {
		return userId === recordUserId;
	}

	// Check direct_reports_only condition
	if (result.conditions.direct_reports_only && recordUserId) {
		const isDirectReport = await checkIsDirectReport(userId, recordUserId);
		return isDirectReport;
	}

	return true;
}

/**
 * Check if a user is a direct report of a manager
 */
async function checkIsDirectReport(
	managerId: string,
	employeeId: string,
): Promise<boolean> {
	const employee = await db
		.select({ managerId: users.managerId })
		.from(users)
		.where(eq(users.id, employeeId))
		.limit(1);

	return employee.length > 0 && employee[0].managerId === managerId;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<
	Array<{
		resource: PermissionResource;
		action: PermissionAction;
		conditions?: Record<string, unknown> | null;
	}>
> {
	const userRoleList = await db
		.select({
			roleId: userRoles.roleId,
		})
		.from(userRoles)
		.where(eq(userRoles.userId, userId));

	if (userRoleList.length === 0) {
		return [];
	}

	const roleIds = userRoleList.map((ur) => ur.roleId);

	const permissions = await db
		.select({
			resource: rolePermissions.resource,
			action: rolePermissions.action,
			conditions: rolePermissions.conditions,
		})
		.from(rolePermissions)
		.where(inArray(rolePermissions.roleId, roleIds));

	return permissions.map((p) => ({
		resource: p.resource,
		action: p.action,
		conditions: p.conditions as Record<string, unknown> | null | undefined,
	}));
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
	userId: string,
	roleIds: string[],
): Promise<boolean> {
	const userRoleList = await db
		.select({ roleId: userRoles.roleId })
		.from(userRoles)
		.where(eq(userRoles.userId, userId));

	const userRoleIds = userRoleList.map((ur) => ur.roleId);
	return roleIds.some((roleId) => userRoleIds.includes(roleId));
}

/**
 * Middleware helper for Elysia to check permissions
 */
export function requirePermission(
	resource: PermissionResource,
	action: PermissionAction,
) {
	return async ({
		request,
		set,
	}: {
		request: Request;
		set: { status: number };
	}) => {
		// Get user from session (Better Auth)
		const authHeader = request.headers.get("authorization");
		if (!authHeader) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		// TODO: Extract userId from session
		// This will be implemented when we integrate with Better Auth session
		const userId = ""; // Placeholder

		const result = await checkPermission({ userId, resource, action });

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		return { userId, conditions: result.conditions };
	};
}
