import { createFileRoute } from "@tanstack/react-router";
import { TeamDirectory } from "@/components/team/TeamDirectory";

export const Route = createFileRoute("/_layout/team/")({
	component: TeamDirectory,
});
