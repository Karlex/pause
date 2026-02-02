import { createFileRoute } from "@tanstack/react-router";
import { CompanyPolicies } from "@/components/CompanyPolicies";

export const Route = createFileRoute("/_layout/policies")({
	component: PoliciesPage,
});

function PoliciesPage() {
	return <CompanyPolicies />;
}
