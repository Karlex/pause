import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_layout")({
	component: LayoutComponent,
});

function LayoutComponent() {
	const { data: session } = authClient.useSession();

	// If not logged in, just render children without sidebar
	if (!session?.user) {
		return <Outlet />;
	}

	return (
		<div className="min-h-screen bg-[#050505]">
			<Sidebar />
			<main className="ml-[240px] min-h-screen">
				<div className="max-w-6xl mx-auto px-10 py-10">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
