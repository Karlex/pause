import type { ReactNode } from "react";
import type { permissionResourceEnum } from "@/db/schema";
import {
	useCanCreate,
	useCanDelete,
	useCanEdit,
	useCanView,
	usePermissions,
} from "@/hooks/usePermissions";

type PermissionResource = (typeof permissionResourceEnum.enumValues)[number];

interface PermissionGuardProps {
	resource: PermissionResource;
	action: "view" | "create" | "edit" | "delete" | "approve";
	children: ReactNode;
	fallback?: ReactNode;
}

export function PermissionGuard({
	resource,
	action,
	children,
	fallback = null,
}: PermissionGuardProps) {
	const { hasPermission } = usePermissions();

	if (!hasPermission(resource, action)) {
		return fallback;
	}

	return children;
}

interface CanViewProps {
	resource: PermissionResource;
	children: ReactNode;
	fallback?: ReactNode;
}

export function CanView({ resource, children, fallback = null }: CanViewProps) {
	const canView = useCanView(resource);

	if (!canView) {
		return fallback;
	}

	return children;
}

interface CanCreateProps {
	resource: PermissionResource;
	children: ReactNode;
	fallback?: ReactNode;
}

export function CanCreate({
	resource,
	children,
	fallback = null,
}: CanCreateProps) {
	const canCreate = useCanCreate(resource);

	if (!canCreate) {
		return fallback;
	}

	return children;
}

interface CanEditProps {
	resource: PermissionResource;
	children: ReactNode;
	fallback?: ReactNode;
}

export function CanEdit({ resource, children, fallback = null }: CanEditProps) {
	const canEdit = useCanEdit(resource);

	if (!canEdit) {
		return fallback;
	}

	return children;
}

interface CanDeleteProps {
	resource: PermissionResource;
	children: ReactNode;
	fallback?: ReactNode;
}

export function CanDelete({
	resource,
	children,
	fallback = null,
}: CanDeleteProps) {
	const canDelete = useCanDelete(resource);

	if (!canDelete) {
		return fallback;
	}

	return children;
}
