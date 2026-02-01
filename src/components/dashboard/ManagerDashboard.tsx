import { CalendarBlank, Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api-client";

interface TeamMember {
	id: string;
	name: string;
	email: string;
	image?: string;
	role: string;
	balances: Array<{
		leaveTypeName: string;
		leaveTypeCode: string;
		allowance: number;
		used: number;
		remaining: number;
	}>;
	upcomingRequests: Array<{
		id: string;
		startDate: string;
		endDate: string;
		leaveTypeName: string;
		days: number;
	}>;
	isOnLeave: boolean;
}

export function ManagerDashboard() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["manager-team"],
		queryFn: async () => {
			const response = await api.api.manager.team.get();
			if (response.error) {
				throw new Error("Failed to fetch team data");
			}
			return response.data.team as TeamMember[];
		},
	});

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="max-w-6xl">
					<div className="flex items-center gap-3 mb-8">
						<div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
							<Users className="w-5 h-5 text-white/60" weight="light" />
						</div>
						<div>
							<h1 className="text-[28px] font-medium text-white tracking-[-0.02em]">
								Team Overview
							</h1>
							<p className="text-white/40 text-[14px]">
								Manage your team and view their status
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
							>
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 rounded-full bg-white/10"></div>
									<div className="flex-1">
										<div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
										<div className="h-3 w-32 bg-white/10 rounded"></div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</DashboardLayout>
		);
	}

	if (error) {
		return (
			<DashboardLayout>
				<div className="max-w-6xl">
					<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
						<p className="text-white/60">Failed to load team data</p>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const team = data || [];

	// Calculate summary stats
	const onLeaveCount = team.filter((m) => m.isOnLeave).length;
	const totalTeamSize = team.length;
	const upcomingLeaveCount = team.reduce(
		(sum, m) => sum + m.upcomingRequests.length,
		0,
	);

	return (
		<DashboardLayout>
			<div className="max-w-6xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
							<Users className="w-5 h-5 text-white/60" weight="light" />
						</div>
						<div>
							<h1 className="text-[28px] font-medium text-white tracking-[-0.02em]">
								Team Overview
							</h1>
							<p className="text-white/40 text-[14px]">
								Manage your team and view their status
							</p>
						</div>
					</div>
				</div>

				{/* Summary Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
						className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
					>
						<p className="text-white/40 text-[13px] mb-1">Total Team</p>
						<p className="text-[32px] font-medium text-white tracking-[-0.02em]">
							{totalTeamSize}
						</p>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							delay: 0.05,
							duration: 0.4,
							ease: [0.22, 1, 0.36, 1],
						}}
						className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
					>
						<p className="text-white/40 text-[13px] mb-1">On Leave</p>
						<p className="text-[32px] font-medium text-white tracking-[-0.02em]">
							{onLeaveCount}
						</p>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
						className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
					>
						<p className="text-white/40 text-[13px] mb-1">Upcoming</p>
						<p className="text-[32px] font-medium text-white tracking-[-0.02em]">
							{upcomingLeaveCount}
						</p>
					</motion.div>
				</div>

				{/* Team Members */}
				<div className="mb-4">
					<h2 className="text-[18px] font-medium text-white tracking-[-0.01em]">
						Team Members
					</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{team.map((member, index) => (
						<motion.div
							key={member.id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: index * 0.05,
								duration: 0.4,
								ease: [0.22, 1, 0.36, 1],
							}}
							className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
						>
							{/* Member Header */}
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="relative">
										<div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
											<span className="text-[14px] font-medium text-white/60">
												{member.name.charAt(0).toUpperCase()}
											</span>
										</div>
										{member.isOnLeave && (
											<div
												className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white/30 border-2 border-[#0a0a0a]"
												title="On leave"
											/>
										)}
									</div>
									<div>
										<p className="text-[15px] font-medium text-white">
											{member.name}
										</p>
										<p className="text-[13px] text-white/40">{member.email}</p>
									</div>
								</div>
								{member.isOnLeave && (
									<span className="px-2 py-1 rounded-full bg-white/[0.08] text-[11px] text-white/60">
										On Leave
									</span>
								)}
							</div>

							{/* Balances - Only show if there are balances with allowance */}
							{member.balances.length > 0 && (
								<div className="space-y-2 mb-4">
									{member.balances.slice(0, 3).map((balance) => (
										<div
											key={balance.leaveTypeCode}
											className="flex items-center justify-between text-[13px]"
										>
											<span className="text-white/50">
												{balance.leaveTypeName}
											</span>
											<span
												className={`${
													balance.remaining < 0
														? "text-red-400"
														: balance.remaining < 5
															? "text-amber-400"
															: "text-white/80"
												}`}
											>
												{balance.remaining} days
											</span>
										</div>
									))}
								</div>
							)}

							{/* Upcoming Requests */}
							{member.upcomingRequests.length > 0 && (
								<div className="pt-3 border-t border-white/[0.06]">
									<div className="flex items-center gap-2 mb-2">
										<CalendarBlank
											className="w-4 h-4 text-white/40"
											weight="light"
										/>
										<span className="text-[12px] text-white/40">Upcoming</span>
									</div>
									<div className="space-y-1">
										{member.upcomingRequests.slice(0, 2).map((req) => (
											<div
												key={req.id}
												className="flex items-center justify-between text-[12px]"
											>
												<span className="text-white/50">
													{format(parseISO(req.startDate), "MMM d")}
												</span>
												<span className="text-white/40">
													{req.leaveTypeName}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</motion.div>
					))}
					{team.length === 0 && (
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
							className="col-span-full p-8 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center"
						>
							<div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
								<Users className="w-6 h-6 text-white/40" weight="light" />
							</div>
							<p className="text-white/60 text-[15px] mb-1">No team members</p>
							<p className="text-white/40 text-[13px]">
								You don&apos;t have any direct reports yet
							</p>
						</motion.div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
