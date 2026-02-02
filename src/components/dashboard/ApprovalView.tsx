import { CalendarBlank, CheckCircle, Clock, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api-client";

interface PendingRequest {
	id: string;
	startDate: string;
	endDate: string;
	status: string;
	totalHours: number;
	note?: string;
	createdAt: string;
	leaveType: {
		id: string;
		name: string;
		code: string;
	};
	user: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
}

export function ApprovalView() {
	const queryClient = useQueryClient();
	const [decliningRequest, setDecliningRequest] = useState<string | null>(null);
	const [declineReason, setDeclineReason] = useState("");

	const { data, isLoading, error } = useQuery({
		queryKey: ["pending-approvals"],
		queryFn: async () => {
			const response = await api.api.approvals.pending.get();
			if (response.error) {
				throw new Error("Failed to fetch pending approvals");
			}
			return response.data.requests as PendingRequest[];
		},
	});

	const approveMutation = useMutation({
		mutationFn: async (requestId: string) => {
			const response = await api.api.approvals[requestId].approve.post();
			if (response.error) {
				throw new Error("Failed to approve request");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
			queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
		},
	});

	const declineMutation = useMutation({
		mutationFn: async ({
			requestId,
			reason,
		}: {
			requestId: string;
			reason?: string;
		}) => {
			const response = await api.api.approvals[requestId].decline.post({
				note: reason,
			});
			if (response.error) {
				throw new Error("Failed to decline request");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
			setDecliningRequest(null);
			setDeclineReason("");
		},
	});

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="max-w-4xl">
					<div className="flex items-center gap-3 mb-8">
						<div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
							<Clock className="w-5 h-5 text-white/60" weight="light" />
						</div>
						<div>
							<h1 className="text-[28px] font-medium text-white tracking-[-0.02em]">
								Pending Approvals
							</h1>
							<p className="text-white/40 text-[14px]">
								Review and approve leave requests
							</p>
						</div>
					</div>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
							>
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 rounded-full bg-white/10"></div>
									<div className="flex-1">
										<div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
										<div className="h-3 w-48 bg-white/10 rounded"></div>
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
				<div className="max-w-4xl">
					<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
						<p className="text-white/60">Failed to load pending approvals</p>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const requests = data || [];

	return (
		<>
			<DashboardLayout>
				<div className="max-w-4xl">
					<div className="flex items-center gap-3 mb-8">
						<div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
							<Clock className="w-5 h-5 text-white/60" weight="light" />
						</div>
						<div>
							<h1 className="text-[28px] font-medium text-white tracking-[-0.02em]">
								Pending Approvals
							</h1>
							<p className="text-white/40 text-[14px]">
								{requests.length} request{requests.length !== 1 ? "s" : ""}{" "}
								awaiting review
							</p>
						</div>
					</div>

					{requests.length === 0 ? (
						<div className="p-8 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
							<div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="w-8 h-8 text-white/40" weight="light" />
							</div>
							<p className="text-white/60 text-[15px]">No pending approvals</p>
							<p className="text-white/30 text-[13px] mt-1">All caught up!</p>
						</div>
					) : (
						<div className="space-y-3">
							{requests.map((request, index) => (
								<motion.div
									key={request.id}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: index * 0.05,
										duration: 0.4,
										ease: [0.22, 1, 0.36, 1],
									}}
									className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
								>
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-4">
											<Avatar name={request.user.name} size={40} />
											<div>
												<p className="text-[15px] font-medium text-white">
													{request.user.name}
												</p>
												<div className="flex items-center gap-2 mt-1">
													<CalendarBlank
														className="w-4 h-4 text-white/40"
														weight="light"
													/>
													<p className="text-[13px] text-white/50">
														{format(parseISO(request.startDate), "MMM d")} -{" "}
														{format(parseISO(request.endDate), "MMM d, yyyy")}
													</p>
												</div>
												<p className="text-[13px] text-white/40 mt-1">
													{request.leaveType.name} • {request.totalHours / 8}{" "}
													days
												</p>
												{request.note && (
													<p className="text-[13px] text-white/30 mt-2 italic">
														"{request.note}"
													</p>
												)}
											</div>
										</div>

										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => approveMutation.mutate(request.id)}
												disabled={approveMutation.isPending}
												className="px-4 py-2 rounded-lg bg-white text-black text-[13px] font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
											>
												Approve
											</button>
											<button
												type="button"
												onClick={() => setDecliningRequest(request.id)}
												className="px-4 py-2 rounded-lg bg-white/[0.08] text-white text-[13px] font-medium hover:bg-white/[0.12] transition-colors"
											>
												Decline
											</button>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					)}
				</div>
			</DashboardLayout>

			<AnimatePresence>
				{decliningRequest && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
						onClick={() => setDecliningRequest(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 8 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 8 }}
							transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
							className="w-full max-w-md p-6 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] shadow-xl"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-start justify-between mb-4">
								<h2 className="text-[17px] font-medium text-white tracking-[-0.01em]">
									Decline Request
								</h2>
								<button
									type="button"
									onClick={() => setDecliningRequest(null)}
									className="p-1 rounded-lg hover:bg-white/[0.08] transition-colors"
								>
									<X className="w-5 h-5 text-white/60" weight="light" />
								</button>
							</div>

							<p className="text-[14px] text-white/50 mb-4">
								Please provide a reason for declining this request.
							</p>

							<textarea
								value={declineReason}
								onChange={(e) => setDeclineReason(e.target.value)}
								placeholder="Enter reason..."
								rows={4}
								className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2] transition-colors resize-none mb-4"
							/>

							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => {
										setDecliningRequest(null);
										setDeclineReason("");
									}}
									disabled={declineMutation.isPending}
									className="px-4 py-2 rounded-lg text-white/[0.7] text-[13px] font-medium hover:bg-white/[0.08] disabled:opacity-50 transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() =>
										decliningRequest &&
										declineMutation.mutate({
											requestId: decliningRequest,
											reason: declineReason,
										})
									}
									disabled={declineMutation.isPending}
									className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-[13px] font-medium hover:bg-red-500/30 disabled:opacity-50 transition-colors"
								>
									{declineMutation.isPending ? "Declining..." : "Decline"}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
