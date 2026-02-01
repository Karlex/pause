import { createFileRoute } from "@tanstack/react-router";
import { ApprovalView } from "@/components/dashboard/ApprovalView";

export const Route = createFileRoute("/_layout/approvals/")({
	component: ApprovalView,
});
