import { CaretDown, Plus, UserPlus, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api-client";

interface AddEmployeeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const ROLES = [
	{ value: "employee", label: "Employee", description: "Standard team member" },
	{ value: "team_lead", label: "Team Lead", description: "Leads a small team" },
	{
		value: "manager",
		label: "Manager",
		description: "Manages people and approves requests",
	},
	{
		value: "hr_admin",
		label: "HR Admin",
		description: "Full people management access",
	},
	{
		value: "super_admin",
		label: "Super Admin",
		description: "Complete system access",
	},
];

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
	const queryClient = useQueryClient();
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const roleId = useId();
	const deptId = useId();
	const locationId = useId();
	const startDateId = useId();
	const managerId = useId();

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		role: "employee",
		department: "",
		location: "UK",
		startDate: "",
		managerId: "",
	});
	const [error, setError] = useState("");
	const [focusedField, setFocusedField] = useState<string | null>(null);

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: "",
				email: "",
				password: "",
				role: "employee",
				department: "",
				location: "UK",
				startDate: "",
				managerId: "",
			});
			setError("");
			setFocusedField(null);
		}
	}, [isOpen]);

	// Fetch managers for dropdown
	const { data: managersData } = useQuery({
		queryKey: ["managers"],
		queryFn: async () => {
			const response = await api.api.employees.managers.get();
			if (response.error) {
				throw new Error("Failed to fetch managers");
			}
			return response.data.managers;
		},
		enabled: isOpen,
	});

	const createMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			const response = await api.api.employees.post({
				email: data.email,
				password: data.password,
				name: data.name,
				role: data.role as
					| "employee"
					| "team_lead"
					| "manager"
					| "hr_admin"
					| "super_admin",
				department: data.department || undefined,
				location: data.location,
				startDate: data.startDate || undefined,
				managerId: data.managerId || undefined,
			});
			if (response.error) {
				const errorValue = response.error;
				if (typeof errorValue === "string") {
					throw new Error(errorValue);
				}
				if (errorValue && typeof errorValue === "object") {
					const errorData = errorValue as { error?: string; message?: string };
					throw new Error(
						errorData.error || errorData.message || "Failed to create employee",
					);
				}
				throw new Error("Failed to create employee");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["employees"] });
			onClose();
		},
		onError: (err) => {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("An unexpected error occurred");
			}
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!formData.name || !formData.email || !formData.password) {
			setError("Please fill in all required fields");
			return;
		}

		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		createMutation.mutate(formData);
	};

	const handleChange = (field: keyof typeof formData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const selectedRole = ROLES.find((r) => r.value === formData.role);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50"
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
						className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[520px] max-h-[85vh] z-50"
					>
						<div className="bg-[#0f0f0f] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
							{/* Header */}
							<div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
										<UserPlus
											className="w-[18px] h-[18px] text-white/50"
											weight="light"
										/>
									</div>
									<div>
										<h2 className="text-[16px] font-semibold text-white tracking-[-0.01em]">
											Add Employee
										</h2>
										<p className="text-[13px] text-white/40 mt-0.5">
											Create a new team member account
										</p>
									</div>
								</div>
								<motion.button
									type="button"
									onClick={onClose}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
								>
									<X className="w-4 h-4" weight="light" />
								</motion.button>
							</div>

							{/* Form */}
							<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
								<div className="p-6 space-y-6">
									{/* Error Message */}
									<AnimatePresence>
										{error && (
											<motion.div
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												className="p-3 rounded-lg bg-red-500/[0.08] border border-red-500/20 flex items-start gap-2.5"
											>
												<div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
													<span className="text-red-400 text-[10px]">!</span>
												</div>
												<p className="text-[13px] text-red-400/90 leading-relaxed">
													{error}
												</p>
											</motion.div>
										)}
									</AnimatePresence>

									{/* Avatar Preview */}
									<div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
										<div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
											{formData.name ? (
												<span className="text-[16px] font-medium text-white/70">
													{getInitials(formData.name)}
												</span>
											) : (
												<UserPlus
													className="w-6 h-6 text-white/20"
													weight="light"
												/>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-[14px] font-medium text-white/80 truncate">
												{formData.name || "New Employee"}
											</p>
											<p className="text-[12px] text-white/40 truncate mt-0.5">
												{formData.email || "email@company.com"}
											</p>
										</div>
										{selectedRole && (
											<span className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.06] text-[11px] text-white/50 shrink-0">
												{selectedRole.label}
											</span>
										)}
									</div>

									{/* Section: Basic Info */}
									<div className="space-y-4">
										<h3 className="text-[12px] font-medium text-white/30 uppercase tracking-wider">
											Basic Information
										</h3>

										<div className="grid grid-cols-1 gap-4">
											<Input
												id={nameId}
												label="Full Name"
												placeholder="e.g., Sarah Johnson"
												value={formData.name}
												onChange={(e) => handleChange("name", e.target.value)}
												onFocus={() => setFocusedField("name")}
												onBlur={() => setFocusedField(null)}
												required
											/>

											<Input
												id={emailId}
												label="Email Address"
												type="email"
												placeholder="sarah@company.com"
												value={formData.email}
												onChange={(e) => handleChange("email", e.target.value)}
												onFocus={() => setFocusedField("email")}
												onBlur={() => setFocusedField(null)}
												required
											/>

											<div>
												<label
													htmlFor={passwordId}
													className="block text-[13px] font-medium text-white/70 mb-2"
												>
													Temporary Password
												</label>
												<div className="relative">
													<input
														id={passwordId}
														type="password"
														placeholder="Minimum 8 characters"
														value={formData.password}
														onChange={(e) =>
															handleChange("password", e.target.value)
														}
														onFocus={() => setFocusedField("password")}
														onBlur={() => setFocusedField(null)}
														className={`w-full px-3.5 py-2.5 bg-white/[0.02] text-white text-[14px] rounded-xl border outline-none transition-all duration-200 placeholder:text-white/20 ${
															focusedField === "password"
																? "border-white/20 bg-white/[0.03]"
																: "border-white/[0.06] hover:border-white/10"
														}`}
														required
													/>
												</div>
												{formData.password && formData.password.length < 8 && (
													<p className="text-[11px] text-amber-400/70 mt-1.5 ml-1">
														Must be at least 8 characters
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Divider */}
									<div className="h-px bg-white/[0.06]" />

									{/* Section: Role & Department */}
									<div className="space-y-4">
										<h3 className="text-[12px] font-medium text-white/30 uppercase tracking-wider">
											Role & Access
										</h3>

										<div className="space-y-4">
											{/* Role Select */}
											<div>
												<label
													htmlFor={roleId}
													className="block text-[13px] font-medium text-white/70 mb-2"
												>
													Role
												</label>
												<div className="relative">
													<select
														id={roleId}
														value={formData.role}
														onChange={(e) =>
															handleChange("role", e.target.value)
														}
														className="w-full px-3.5 py-2.5 bg-white/[0.02] text-white text-[14px] rounded-xl border border-white/[0.06] outline-none transition-all duration-200 hover:border-white/10 focus:border-white/20 focus:bg-white/[0.03] cursor-pointer appearance-none"
														required
													>
														{ROLES.map((role) => (
															<option
																key={role.value}
																value={role.value}
																className="bg-[#1a1a1a] text-white py-2"
															>
																{role.label}
															</option>
														))}
													</select>
													<CaretDown
														className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
														weight="bold"
													/>
												</div>
												{selectedRole && (
													<p className="text-[12px] text-white/40 mt-1.5 ml-1">
														{selectedRole.description}
													</p>
												)}
											</div>

											{/* Department & Location Row */}
											<div className="grid grid-cols-2 gap-4">
												<Input
													id={deptId}
													label="Department"
													placeholder="e.g., Engineering"
													value={formData.department}
													onChange={(e) =>
														handleChange("department", e.target.value)
													}
												/>

												<Input
													id={locationId}
													label="Location"
													placeholder="e.g., London"
													value={formData.location}
													onChange={(e) =>
														handleChange("location", e.target.value)
													}
												/>
											</div>
										</div>
									</div>

									{/* Divider */}
									<div className="h-px bg-white/[0.06]" />

									{/* Section: Employment Details */}
									<div className="space-y-4">
										<h3 className="text-[12px] font-medium text-white/30 uppercase tracking-wider">
											Employment Details
										</h3>

										<div className="grid grid-cols-2 gap-4">
											{/* Start Date */}
											<div>
												<label
													htmlFor={startDateId}
													className="block text-[13px] font-medium text-white/70 mb-2"
												>
													Start Date
												</label>
												<input
													id={startDateId}
													type="date"
													value={formData.startDate}
													onChange={(e) =>
														handleChange("startDate", e.target.value)
													}
													className="w-full px-3.5 py-2.5 bg-white/[0.02] text-white text-[14px] rounded-xl border border-white/[0.06] outline-none transition-all duration-200 hover:border-white/10 focus:border-white/20 focus:bg-white/[0.03] cursor-pointer"
													style={{ colorScheme: "dark" }}
												/>
											</div>

											{/* Manager Select */}
											<div>
												<label
													htmlFor={managerId}
													className="block text-[13px] font-medium text-white/70 mb-2"
												>
													Manager
												</label>
												<div className="relative">
													<select
														id={managerId}
														value={formData.managerId}
														onChange={(e) =>
															handleChange("managerId", e.target.value)
														}
														className="w-full px-3.5 py-2.5 bg-white/[0.02] text-white text-[14px] rounded-xl border border-white/[0.06] outline-none transition-all duration-200 hover:border-white/10 focus:border-white/20 focus:bg-white/[0.03] cursor-pointer appearance-none"
													>
														<option value="">None</option>
														{managersData?.map((manager) => (
															<option
																key={manager.id}
																value={manager.id}
																className="bg-[#1a1a1a] text-white"
															>
																{manager.name}
															</option>
														))}
													</select>
													<CaretDown
														className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
														weight="bold"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Footer Actions */}
								<div className="px-6 py-5 border-t border-white/[0.06] bg-white/[0.01] shrink-0">
									<div className="flex items-center gap-3">
										<motion.button
											type="button"
											onClick={onClose}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/70 text-[14px] font-medium hover:bg-white/[0.05] hover:text-white transition-all"
										>
											Cancel
										</motion.button>
										<motion.button
											type="submit"
											disabled={createMutation.isPending}
											whileHover={{
												scale: createMutation.isPending ? 1 : 1.02,
											}}
											whileTap={{
												scale: createMutation.isPending ? 1 : 0.98,
											}}
											className="flex-[2] py-2.5 px-4 rounded-xl bg-white text-black text-[14px] font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
										>
											{createMutation.isPending ? (
												<>
													<motion.div
														className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full"
														animate={{ rotate: 360 }}
														transition={{
															duration: 0.8,
															repeat: Infinity,
															ease: "linear",
														}}
													/>
													<span>Creating...</span>
												</>
											) : (
												<>
													<Plus className="w-4 h-4" weight="bold" />
													<span>Add Employee</span>
												</>
											)}
										</motion.button>
									</div>
								</div>
							</form>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
