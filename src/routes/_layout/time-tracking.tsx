import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/time-tracking")({
	component: TimeTrackingPage,
});

function TimeTrackingPage() {
	return (
		<div className="max-w-6xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-[28px] font-semibold text-white tracking-[-0.03em]">
						Time Tracking
					</h1>
					<p className="text-white/40 text-[14px] mt-1">
						Track hours and attendance
					</p>
				</div>
			</div>

			<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
				<p className="text-white/60">Time tracking features coming soon...</p>
			</div>
		</div>
	);
}
