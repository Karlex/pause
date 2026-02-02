import { createFileRoute } from "@tanstack/react-router";
import { DepartmentManagement } from "@/components/admin/DepartmentManagement";

export const Route = createFileRoute("/_layout/admin/departments")({
	component: DepartmentManagement,
});
