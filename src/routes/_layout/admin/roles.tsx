import { createFileRoute } from "@tanstack/react-router";
import { RoleManagement } from "@/components/admin/RoleManagement";

export const Route = createFileRoute("/_layout/admin/roles")({
	component: RoleManagement,
});
