import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/team-calendar")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_layout/team-calendar"!</div>;
}
