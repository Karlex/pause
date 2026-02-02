import { useQuery } from "@tanstack/react-query";
import type { permissionActionEnum, permissionResourceEnum } from "@/db/schema";
import { api } from "@/lib/api-client";

type PermissionAction = (typeof permissionActionEnum.enumValues)[number];
type PermissionResource = (typeof permissionResourceEnum.enumValues)[number];

interface Permission {
	resource: PermissionResource;
	action: PermissionAction;
	conditions?: Record<string, unknown> | null;
}

export function usePermissions() {
	const { data: permissionsData } = useQuery({
		queryKey: ["user-permissions"],
		queryFn: async () => {
			const response = await api.api.rbac.permissions.get();
			if (response.error) throw new Error("Failed to fetch permissions");
			return response.data.permissions as Permission[];
		},
	});

	const permissions = permissionsData || [];

	const hasPermission = (
		resource: PermissionResource,
		action: PermissionAction,
	): boolean => {
		return permissions.some(
			(p) => p.resource === resource && p.action === action,
		);
	};

	const hasAnyPermission = (
		checks: Array<{ resource: PermissionResource; action: PermissionAction }>,
	): boolean => {
		return checks.some((check) => hasPermission(check.resource, check.action));
	};

	const hasAllPermissions = (
		checks: Array<{ resource: PermissionResource; action: PermissionAction }>,
	): boolean => {
		return checks.every((check) => hasPermission(check.resource, check.action));
	};

	return {
		permissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isLoading: false,
	};
}

export function useCanView(resource: PermissionResource): boolean {
	const { hasPermission } = usePermissions();
	return hasPermission(resource, "view");
}

export function useCanCreate(resource: PermissionResource): boolean {
	const { hasPermission } = usePermissions();
	return hasPermission(resource, "create");
}

export function useCanEdit(resource: PermissionResource): boolean {
	const { hasPermission } = usePermissions();
	return hasPermission(resource, "edit");
}

export function useCanDelete(resource: PermissionResource): boolean {
	const { hasPermission } = usePermissions();
	return hasPermission(resource, "delete");
}

export function useCanApprove(resource: PermissionResource): boolean {
	const { hasPermission } = usePermissions();
	return hasPermission(resource, "approve");
}
