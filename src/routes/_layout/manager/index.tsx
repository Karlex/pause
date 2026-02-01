import { createFileRoute } from "@tanstack/react-router";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";

export const Route = createFileRoute("/_layout/manager/")({
	component: ManagerDashboard,
});
