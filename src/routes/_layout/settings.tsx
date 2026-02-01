import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_layout/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { data: session } = authClient.useSession();

	return (
		<div className="max-w-2xl">
			<h1 className="text-[28px] font-semibold text-white tracking-[-0.03em] mb-6">
				Settings
			</h1>

			<div className="space-y-4">
				<div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<h2 className="text-[15px] font-medium text-white mb-1">Profile</h2>
					<p className="text-[13px] text-white/40">
						{session?.user?.name} • {session?.user?.email}
					</p>
				</div>
			</div>
		</div>
	);
}
