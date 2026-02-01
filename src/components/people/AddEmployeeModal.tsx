import { X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
	BaseDatePicker,
	BaseSelect,
	Input,
	type SelectOption,
} from "@/components/ui";
import { api } from "@/lib/api-client";

interface AddEmployeeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const ROLE_OPTIONS: SelectOption[] = [
	{ value: "employee", label: "Employee" },
	{ value: "team_lead", label: "Team Lead" },
	{ value: "manager", label: "Manager" },
	{ value: "hr_admin", label: "HR Admin" },
	{ value: "super_admin", label: "Super Admin" },
];

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		role: "employee",
		department: "",
		location: "UK",
		startDate: null as Date | null,
		managerId: "",
	});
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: "",
				email: "",
				role: "employee",
				department: "",
				location: "UK",
				startDate: null,
				managerId: "",
			});
			setError("");
		}
	}, [isOpen]);

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

	const managerOptions: SelectOption[] = managersData
		? [
				{ value: "", label: "None" },
				...managersData.map((m) => ({ value: m.id, label: m.name })),
			]
		: [{ value: "", label: "None" }];

	const createMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			const response = await api.api.employees.post({
				email: data.email,
				name: data.name,
				role: data.role as
					| "employee"
					| "team_lead"
					| "manager"
					| "hr_admin"
					| "super_admin",
				department: data.department || undefined,
				location: data.location,
				startDate: data.startDate
					? format(data.startDate, "yyyy-MM-dd")
					: undefined,
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

		if (!formData.name || !formData.email) {
			setError("Please fill in all required fields");
			return;
		}

		createMutation.mutate(formData);
	};

	const handleChange = (
		field: keyof typeof formData,
		value: string | Date | null,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/50 z-50"
						onClick={onClose}
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.97, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.97, y: 10 }}
						transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
						className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] z-50"
					>
						<div className="bg-[#0a0a0a] rounded-xl border border-white/[0.06] shadow-2xl overflow-hidden">
							<div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
								<h2 className="text-[15px] font-medium text-white">
									Add Employee
								</h2>
								<motion.button
									type="button"
									onClick={onClose}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
								>
									<X className="w-4 h-4" weight="light" />
								</motion.button>
							</div>

							<form onSubmit={handleSubmit}>
								<div className="px-5 py-5 space-y-4">
									<AnimatePresence>
										{error && (
											<motion.div
												initial={{ opacity: 0, y: -8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -8 }}
												className="p-3 rounded-lg bg-red-500/[0.06] border border-red-500/15"
											>
												<p className="text-[13px] text-red-400/80">{error}</p>
											</motion.div>
										)}
									</AnimatePresence>

									<div className="space-y-3">
										<Input
											label="Name"
											placeholder="Full name"
											value={formData.name}
											onChange={(e) => handleChange("name", e.target.value)}
											required
										/>

										<Input
											label="Email"
											type="email"
											placeholder="email@company.com"
											value={formData.email}
											onChange={(e) => handleChange("email", e.target.value)}
											required
										/>
									</div>

									<div className="pt-2">
										<BaseSelect
											label="Role"
											options={ROLE_OPTIONS}
											value={formData.role}
											onChange={(value) => handleChange("role", value)}
										/>
									</div>

									<div className="grid grid-cols-2 gap-3 pt-1">
										<Input
											label="Department"
											placeholder="Engineering"
											value={formData.department}
											onChange={(e) =>
												handleChange("department", e.target.value)
											}
										/>

										<Input
											label="Location"
											placeholder="London"
											value={formData.location}
											onChange={(e) => handleChange("location", e.target.value)}
										/>
									</div>

									<div className="grid grid-cols-2 gap-3 pt-1">
										<BaseDatePicker
											label="Start Date"
											value={formData.startDate}
											onChange={(date) => handleChange("startDate", date)}
											placeholder="Select"
										/>

										<BaseSelect
											label="Manager"
											options={managerOptions}
											value={formData.managerId}
											onChange={(value) => handleChange("managerId", value)}
										/>
									</div>
								</div>

								<div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-end gap-4">
									<motion.button
										type="button"
										onClick={onClose}
										whileHover={{ scale: 1.01 }}
										whileTap={{ scale: 0.98 }}
										className="px-2 py-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors"
									>
										Cancel
									</motion.button>

									<motion.button
										type="submit"
										disabled={createMutation.isPending}
										whileHover={{
											scale: createMutation.isPending ? 1 : 1.01,
										}}
										whileTap={{
											scale: createMutation.isPending ? 1 : 0.98,
										}}
										className="px-2 py-1.5 text-[13px] text-white/80 hover:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{createMutation.isPending ? "Creating..." : "Add Employee"}
									</motion.button>
								</div>
							</form>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
