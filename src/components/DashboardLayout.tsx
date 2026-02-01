import { memo } from "react";
import { authClient } from "@/lib/auth-client";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

// Memoized sidebar that won't re-render when children change
const MemoizedSidebar = memo(Sidebar);

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const { data: session } = authClient.useSession();

	// Don't show sidebar if not logged in
	if (!session?.user) {
		return <>{children}</>;
	}

	return (
		<div className="min-h-screen bg-[#050505]">
			<MemoizedSidebar />
			<main className="ml-[240px] min-h-screen">
				<div className="max-w-6xl mx-auto px-10 py-10">{children}</div>
			</main>
		</div>
	);
}
