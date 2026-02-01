import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/time-off")({
	component: TimeOffPage,
});

function TimeOffPage() {
	return (
		<div className="max-w-6xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-[28px] font-semibold text-white tracking-[-0.03em]">
						Time Off
					</h1>
					<p className="text-white/40 text-[14px] mt-1">
						Manage leave requests and balances
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<p className="text-[13px] text-white/40 mb-1">Annual Leave</p>
					<p className="text-[24px] font-semibold text-white">18 days</p>
				</div>
				<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<p className="text-[13px] text-white/40 mb-1">Sick Leave</p>
					<p className="text-[24px] font-semibold text-white">10 days</p>
				</div>
				<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<p className="text-[13px] text-white/40 mb-1">Used This Year</p>
					<p className="text-[24px] font-semibold text-white">5 days</p>
				</div>
			</div>
		</div>
	);
}
