import { Crown, Pencil, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Input } from "@/components/ui";
import type { PolicyConfig } from "@/db/schema";
import { api } from "@/lib/api-client";

interface LeavePolicy {
	id: string;
	name: string;
	description: string | null;
	workingDays: number[];
	hoursPerDay: number;
	holidayRegion: string;
	config: PolicyConfig;
	isDefault: boolean;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface PolicyFormData {
	name: string;
	description: string;
	workingDays: number[];
	hoursPerDay: number;
	holidayRegion: string;
	config: PolicyConfig;
	isDefault: boolean;
	isActive: boolean;
}

const WEEKDAYS = [
	{ value: 0, label: "Sun" },
	{ value: 1, label: "Mon" },
	{ value: 2, label: "Tue" },
	{ value: 3, label: "Wed" },
	{ value: 4, label: "Thu" },
	{ value: 5, label: "Fri" },
	{ value: 6, label: "Sat" },
];

const REGIONS = [
	{ value: "UK", label: "United Kingdom" },
	{ value: "US", label: "United States" },
	{ value: "IN", label: "India" },
	{ value: "EU", label: "Europe" },
];

const defaultPolicyConfig: PolicyConfig = {
	leaveTypes: {
		annual: {
			enabled: true,
			defaultAllowanceHours: 160,
			accrual: { type: "upfront", proRataFirstYear: true },
			carryOver: { enabled: true, maxHours: 40, expiresAfterMonths: 3 },
			rules: {
				minNoticeHours: 168,
				maxConsecutiveHours: 80,
				autoApproveUpToHours: 0,
				requiresDocumentAfterHours: 0,
				requiresApproval: true,
			},
		},
		sick: {
			enabled: true,
			defaultAllowanceHours: 80,
			accrual: { type: "upfront", proRataFirstYear: false },
			carryOver: { enabled: false, maxHours: 0, expiresAfterMonths: 0 },
			rules: {
				minNoticeHours: 0,
				maxConsecutiveHours: 40,
				autoApproveUpToHours: 0,
				requiresDocumentAfterHours: 24,
				requiresApproval: true,
			},
		},
	},
};

export function LeavePolicyManagement() {
	const queryClient = useQueryClient();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
	const [deletingPolicy, setDeletingPolicy] = useState<LeavePolicy | null>(
		null,
	);

	const { data: policiesData, isLoading } = useQuery({
		queryKey: ["leave-policies"],
		queryFn: async () => {
			const response = await api.api["leave-policies"].get();
			if (response.error) throw new Error("Failed to fetch policies");
			return response.data.policies as unknown as LeavePolicy[];
		},
	});

	const createPolicyMutation = useMutation({
		mutationFn: async (data: PolicyFormData) => {
			const response = await api.api["leave-policies"].post(data);
			if (response.error) throw new Error("Failed to create policy");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["leave-policies"] });
			setIsCreateModalOpen(false);
		},
	});

	const updatePolicyMutation = useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: Partial<PolicyFormData>;
		}) => {
			const response = await api.api["leave-policies"][id].patch(data);
			if (response.error) throw new Error("Failed to update policy");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["leave-policies"] });
			setEditingPolicy(null);
		},
	});

	const deletePolicyMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await api.api["leave-policies"][id].delete();
			if (response.error) throw new Error("Failed to delete policy");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["leave-policies"] });
			setDeletingPolicy(null);
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: async (id: string) => {
			const response =
				await api.api["leave-policies"][id]["set-default"].post();
			if (response.error) throw new Error("Failed to set default policy");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["leave-policies"] });
		},
	});

	const policies = policiesData || [];

	return (
		<div className="max-w-5xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-10">
				<h1 className="text-[24px] font-medium text-white tracking-[-0.02em]">
					Leave Policies
				</h1>
				<motion.button
					onClick={() => setIsCreateModalOpen(true)}
					whileHover={{ scale: 1.01 }}
					whileTap={{ scale: 0.98 }}
					className="flex items-center gap-1.5 px-3 py-1.5 text-white/50 hover:text-white/80 text-[13px] font-medium transition-colors"
				>
					<Plus className="w-3.5 h-3.5" weight="bold" />
					Add
				</motion.button>
			</div>

			{/* Subtle Stats Row */}
			<div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/[0.04]">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
						<svg
							className="w-3.5 h-3.5 text-white/40"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							role="img"
							aria-label="Clipboard icon"
						>
							<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</div>
					<span className="text-[13px] text-white/40">
						{isLoading ? "—" : policies.length}{" "}
						{policies.length === 1 ? "policy" : "policies"}
					</span>
				</div>
			</div>

			{/* Policies List */}
			<div>
				{isLoading ? (
					<div className="space-y-[1px]">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] animate-pulse"
							>
								<div className="w-9 h-9 rounded-lg bg-white/10" />
								<div className="flex-1 space-y-2">
									<div className="h-3.5 w-28 bg-white/10 rounded" />
									<div className="h-3 w-48 bg-white/10 rounded" />
								</div>
							</div>
						))}
					</div>
				) : policies.length === 0 ? (
					<div className="py-16 text-center">
						<div className="w-11 h-11 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-5 h-5 text-white/30"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								role="img"
								aria-label="Clipboard icon"
							>
								<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
						<p className="text-white/50 text-[15px] mb-1">No policies yet</p>
						<p className="text-white/30 text-[13px]">
							Create your first leave policy to get started
						</p>
					</div>
				) : (
					<div className="space-y-[1px]">
						{policies.map((policy, index) => (
							<motion.div
								key={policy.id}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: index * 0.02,
									duration: 0.25,
									ease: [0.22, 1, 0.36, 1],
								}}
								className="group flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
							>
								<div className="flex items-center gap-4">
									<div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
										{policy.isDefault ? (
											<span title="Default Policy">
												<Crown
													className="w-4 h-4 text-amber-400/70"
													weight="fill"
												/>
											</span>
										) : (
											<svg
												className="w-4 h-4 text-white/40"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
											>
												<title>Policy</title>
												<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
											</svg>
										)}
									</div>
									<div className="flex flex-col">
										<div className="flex items-center gap-2">
											<span className="text-[14px] text-white/90 group-hover:text-white transition-colors">
												{policy.name}
											</span>
											{policy.isDefault && (
												<span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 text-[10px] font-medium">
													Default
												</span>
											)}
											{!policy.isActive && (
												<span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/40 text-[10px] font-medium">
													Inactive
												</span>
											)}
										</div>
										<span className="text-[13px] text-white/40">
											{policy.description ||
												`${policy.holidayRegion} • ${policy.hoursPerDay}h/day • ${policy.workingDays.length} working days`}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
									{!policy.isDefault && policy.isActive && (
										<motion.button
											type="button"
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={(e) => {
												e.stopPropagation();
												setDefaultMutation.mutate(policy.id);
											}}
											disabled={setDefaultMutation.isPending}
											className="p-2 rounded-lg text-white/30 hover:text-amber-400/70 hover:bg-white/[0.06] transition-colors"
											title="Set as default"
										>
											<Crown className="w-4 h-4" />
										</motion.button>
									)}
									<motion.button
										type="button"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={(e) => {
											e.stopPropagation();
											setEditingPolicy(policy);
										}}
										className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
									>
										<Pencil className="w-4 h-4" />
									</motion.button>
									{!policy.isDefault && (
										<motion.button
											type="button"
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={(e) => {
												e.stopPropagation();
												setDeletingPolicy(policy);
											}}
											className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
										>
											<Trash className="w-4 h-4" />
										</motion.button>
									)}
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			{/* Create Modal */}
			<AnimatePresence>
				{isCreateModalOpen && (
					<PolicyFormModal
						title="Create Leave Policy"
						onSubmit={(data) => createPolicyMutation.mutate(data)}
						onClose={() => setIsCreateModalOpen(false)}
						isSubmitting={createPolicyMutation.isPending}
					/>
				)}
			</AnimatePresence>

			{/* Edit Modal */}
			<AnimatePresence>
				{editingPolicy && (
					<PolicyFormModal
						title="Edit Leave Policy"
						policy={editingPolicy}
						onSubmit={(data) =>
							updatePolicyMutation.mutate({ id: editingPolicy.id, data })
						}
						onClose={() => setEditingPolicy(null)}
						isSubmitting={updatePolicyMutation.isPending}
					/>
				)}
			</AnimatePresence>

			{/* Delete Confirmation */}
			<AnimatePresence>
				{deletingPolicy && (
					<DeleteConfirmModal
						policy={deletingPolicy}
						onConfirm={() => deletePolicyMutation.mutate(deletingPolicy.id)}
						onClose={() => setDeletingPolicy(null)}
						isDeleting={deletePolicyMutation.isPending}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}

interface PolicyFormModalProps {
	title: string;
	policy?: LeavePolicy;
	onSubmit: (data: PolicyFormData) => void;
	onClose: () => void;
	isSubmitting: boolean;
}

function PolicyFormModal({
	title,
	policy,
	onSubmit,
	onClose,
	isSubmitting,
}: PolicyFormModalProps) {
	const nameId = useId();
	const descriptionId = useId();
	const regionId = useId();
	const hoursId = useId();
	const isActiveId = useId();

	const [formData, setFormData] = useState<PolicyFormData>({
		name: policy?.name || "",
		description: policy?.description || "",
		workingDays: policy?.workingDays || [1, 2, 3, 4, 5],
		hoursPerDay: policy?.hoursPerDay || 8,
		holidayRegion: policy?.holidayRegion || "UK",
		config: policy?.config || defaultPolicyConfig,
		isDefault: policy?.isDefault || false,
		isActive: policy?.isActive ?? true,
	});

	const toggleWorkingDay = (day: number) => {
		setFormData((prev) => ({
			...prev,
			workingDays: prev.workingDays.includes(day)
				? prev.workingDays.filter((d) => d !== day)
				: [...prev.workingDays, day].sort(),
		}));
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				className="bg-[#0a0a0a] rounded-xl border border-white/[0.06] shadow-2xl max-w-lg w-full"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
					<h3 className="text-[15px] font-medium text-white/90">{title}</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
					>
						<svg
							className="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-label="Close"
						>
							<title>Close</title>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Form */}
				<div className="p-5 space-y-5">
					<div>
						<label
							htmlFor={nameId}
							className="block text-[13px] text-white/50 mb-2"
						>
							Policy Name
						</label>
						<Input
							id={nameId}
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="e.g., UK Standard"
							className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-white/30"
						/>
					</div>

					<div>
						<label
							htmlFor={descriptionId}
							className="block text-[13px] text-white/50 mb-2"
						>
							Description
						</label>
						<Input
							id={descriptionId}
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Brief description of the policy"
							className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-white/30"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor={regionId}
								className="block text-[13px] text-white/50 mb-2"
							>
								Region
							</label>
							<select
								id={regionId}
								value={formData.holidayRegion}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										holidayRegion: e.target.value,
									}))
								}
								className="w-full h-10 px-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[14px] text-white/90 focus:outline-none focus:border-white/20"
							>
								{REGIONS.map((region) => (
									<option
										key={region.value}
										value={region.value}
										className="bg-[#0a0a0a]"
									>
										{region.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								htmlFor={hoursId}
								className="block text-[13px] text-white/50 mb-2"
							>
								Hours per Day
							</label>
							<Input
								id={hoursId}
								type="number"
								value={formData.hoursPerDay}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										hoursPerDay: Number(e.target.value),
									}))
								}
								min={1}
								max={24}
								className="bg-white/[0.03] border-white/[0.06] text-white/90"
							/>
						</div>
					</div>

					<div>
						<span className="block text-[13px] text-white/50 mb-2">
							Working Days
						</span>
						<div className="flex gap-1">
							{WEEKDAYS.map((day) => (
								<button
									key={day.value}
									type="button"
									onClick={() => toggleWorkingDay(day.value)}
									className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors ${
										formData.workingDays.includes(day.value)
											? "bg-white/10 text-white/90"
											: "bg-white/[0.03] text-white/40 hover:bg-white/[0.06]"
									}`}
								>
									{day.label}
								</button>
							))}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<input
							id={isActiveId}
							type="checkbox"
							checked={formData.isActive}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
							}
							className="w-4 h-4 rounded border-white/20 bg-white/[0.03] text-white/90 focus:ring-0 focus:ring-offset-0"
						/>
						<label
							htmlFor={isActiveId}
							className="text-[13px] text-white/60 cursor-pointer"
						>
							Active
						</label>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-[13px] text-white/50 hover:text-white/80 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => onSubmit(formData)}
						disabled={!formData.name || isSubmitting}
						className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/90 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting
							? "Saving..."
							: policy
								? "Save Changes"
								: "Create Policy"}
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
}

interface DeleteConfirmModalProps {
	policy: LeavePolicy;
	onConfirm: () => void;
	onClose: () => void;
	isDeleting: boolean;
}

function DeleteConfirmModal({
	policy,
	onConfirm,
	onClose,
	isDeleting,
}: DeleteConfirmModalProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				className="bg-[#0a0a0a] rounded-xl border border-white/[0.06] shadow-2xl max-w-md w-full p-5"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start gap-4">
					<div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
						<Trash className="w-5 h-5 text-red-400/70" />
					</div>
					<div className="flex-1">
						<h3 className="text-[15px] font-medium text-white/90 mb-1">
							Delete Policy
						</h3>
						<p className="text-[13px] text-white/50 leading-relaxed">
							Are you sure you want to delete{" "}
							<strong className="text-white/70">{policy.name}</strong>? This
							action cannot be undone.
						</p>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-[13px] text-white/50 hover:text-white/80 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isDeleting}
						className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400/90 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
					>
						{isDeleting ? "Deleting..." : "Delete Policy"}
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
}
