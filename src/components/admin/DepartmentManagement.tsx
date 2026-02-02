import { Building, Pencil, Plus, Trash, Users } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Button, Input } from "@/components/ui";
import { api } from "@/lib/api-client";

interface Department {
	id: string;
	name: string;
	description: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	manager: {
		id: string;
		name: string;
		email: string;
		image?: string;
	} | null;
}

interface User {
	id: string;
	name: string;
	email: string;
}

interface DepartmentFormData {
	name: string;
	description: string;
	managerId?: string;
}

export function DepartmentManagement() {
	const queryClient = useQueryClient();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingDepartment, setEditingDepartment] = useState<Department | null>(
		null,
	);
	const [deletingDepartment, setDeletingDepartment] =
		useState<Department | null>(null);

	const { data: departmentsData, isLoading } = useQuery({
		queryKey: ["departments"],
		queryFn: async () => {
			const response = await api.api.rbac.departments.get();
			if (response.error) throw new Error("Failed to fetch departments");
			return response.data.departments as unknown as Department[];
		},
	});

	const { data: managersData } = useQuery({
		queryKey: ["managers"],
		queryFn: async () => {
			const response = await api.api.employees.managers.get();
			if (response.error) throw new Error("Failed to fetch managers");
			return response.data.managers as User[];
		},
	});

	const createDepartmentMutation = useMutation({
		mutationFn: async (data: DepartmentFormData) => {
			const response = await api.api.rbac.departments.post(data);
			if (response.error) throw new Error("Failed to create department");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			setIsCreateModalOpen(false);
		},
	});

	const updateDepartmentMutation = useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: DepartmentFormData;
		}) => {
			const response = await api.api.rbac.departments[id].put(data);
			if (response.error) throw new Error("Failed to update department");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			setEditingDepartment(null);
		},
	});

	const deleteDepartmentMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await api.api.rbac.departments[id].delete();
			if (response.error) throw new Error("Failed to delete department");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			setDeletingDepartment(null);
		},
	});

	const departments = departmentsData || [];
	const managers = managersData || [];

	return (
		<div className="max-w-6xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-[28px] font-semibold text-white tracking-[-0.03em]">
						Departments
					</h1>
					<p className="text-white/40 text-[14px] mt-1">
						Manage company departments and their managers
					</p>
				</div>
				<Button
					onClick={() => setIsCreateModalOpen(true)}
					className="flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Create Department
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
						>
							<div className="h-6 w-48 bg-white/10 rounded mb-4" />
							<div className="h-4 w-96 bg-white/10 rounded" />
						</div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<AnimatePresence>
						{departments.map((department, index) => (
							<motion.div
								key={department.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: index * 0.05,
									duration: 0.4,
									ease: [0.22, 1, 0.36, 1],
								}}
								className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
										<Building
											className="w-6 h-6 text-white/60"
											weight="light"
										/>
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => setEditingDepartment(department)}
											className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
											title="Edit department"
										>
											<Pencil className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => setDeletingDepartment(department)}
											className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
											title="Delete department"
										>
											<Trash className="w-4 h-4" />
										</button>
									</div>
								</div>

								<h3 className="text-[18px] font-medium text-white mb-1">
									{department.name}
								</h3>
								<p className="text-white/40 text-[14px] mb-4">
									{department.description || "No description"}
								</p>

								{department.manager ? (
									<div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
										<div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center">
											<span className="text-[12px] font-medium text-white/60">
												{department.manager.name.charAt(0).toUpperCase()}
											</span>
										</div>
										<div>
											<p className="text-[13px] text-white/80">
												{department.manager.name}
											</p>
											<p className="text-[11px] text-white/40">Manager</p>
										</div>
									</div>
								) : (
									<div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
										<div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
											<Users className="w-4 h-4 text-white/30" />
										</div>
										<p className="text-[13px] text-white/40">
											No manager assigned
										</p>
									</div>
								)}
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			{/* Create/Edit Modal */}
			{(isCreateModalOpen || editingDepartment) && (
				<DepartmentModal
					isOpen={true}
					onClose={() => {
						setIsCreateModalOpen(false);
						setEditingDepartment(null);
					}}
					department={editingDepartment}
					managers={managers}
					onSubmit={(data) => {
						if (editingDepartment) {
							updateDepartmentMutation.mutate({
								id: editingDepartment.id,
								data,
							});
						} else {
							createDepartmentMutation.mutate(data);
						}
					}}
					isSubmitting={
						createDepartmentMutation.isPending ||
						updateDepartmentMutation.isPending
					}
				/>
			)}

			{/* Delete Confirmation */}
			{deletingDepartment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-md p-6 rounded-2xl bg-[#0a0a0a] border border-white/[0.06]">
						<h2 className="text-lg font-medium text-white mb-4">
							Delete Department
						</h2>
						<p className="text-white/70 text-[14px] mb-6">
							Are you sure you want to delete the department &quot;
							{deletingDepartment?.name}&quot;? This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="ghost"
								onClick={() => setDeletingDepartment(null)}
								disabled={deleteDepartmentMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() =>
									deletingDepartment &&
									deleteDepartmentMutation.mutate(deletingDepartment.id)
								}
								isLoading={deleteDepartmentMutation.isPending}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface DepartmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	department: Department | null;
	managers: User[];
	onSubmit: (data: DepartmentFormData) => void;
	isSubmitting: boolean;
}

function DepartmentModal({
	isOpen,
	onClose,
	department,
	managers,
	onSubmit,
	isSubmitting,
}: DepartmentModalProps) {
	const nameId = useId();
	const descId = useId();
	const managerIdId = useId();
	const [name, setName] = useState(department?.name || "");
	const [description, setDescription] = useState(department?.description || "");
	const [managerId, setManagerId] = useState(department?.manager?.id || "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			name,
			description,
			managerId: managerId || undefined,
		});
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="w-full max-w-lg p-6 rounded-2xl bg-[#0a0a0a] border border-white/[0.06]">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-medium text-white">
							{department ? "Edit Department" : "Create Department"}
						</h2>
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
						>
							<span className="sr-only">Close modal</span>
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<title>Close modal</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<div className="space-y-4">
						<div>
							<label
								htmlFor={nameId}
								className="block text-[13px] font-medium text-white/80 mb-1.5"
							>
								Department Name
							</label>
							<Input
								id={nameId}
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Engineering"
								required
							/>
						</div>

						<div>
							<label
								htmlFor={descId}
								className="block text-[13px] font-medium text-white/80 mb-1.5"
							>
								Description
							</label>
							<Input
								id={descId}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of this department"
							/>
						</div>

						<div>
							<label
								htmlFor={managerIdId}
								className="block text-[13px] font-medium text-white/80 mb-1.5"
							>
								Manager
							</label>
							<select
								id={managerIdId}
								value={managerId}
								onChange={(e) => setManagerId(e.target.value)}
								className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-white/10"
							>
								<option value="">Select a manager</option>
								{managers.map((manager) => (
									<option key={manager.id} value={manager.id}>
										{manager.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
						<Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" isLoading={isSubmitting}>
							{department ? "Save Changes" : "Create Department"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
