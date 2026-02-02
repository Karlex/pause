import { createFileRoute } from "@tanstack/react-router";
import { LeavePolicyManagement } from "@/components/admin/LeavePolicyManagement";

export const Route = createFileRoute("/_layout/admin/policies")({
	component: LeavePoliciesPage,
});

function LeavePoliciesPage() {
	return (
		<div className="space-y-6">
			<LeavePolicyManagement />
		</div>
	);
}
