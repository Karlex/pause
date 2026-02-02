import { Check, Pencil, Plus, Trash, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Input } from "@/components/ui";
import { api } from "@/lib/api-client";

const PERMISSION_RESOURCES = [
	"users",
	"departments",
	"roles",
	"leave_requests",
	"leave_policies",
	"public_holidays",
	"tasks",
	"documents",
	"notifications",
	"timesheets",
	"invoices",
	"settings",
];

const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "approve"];

const ACTION_LABELS: Record<string, string> = {
	view: "View",
	create: "Create",
	edit: "Edit",
	delete: "Delete",
	approve: "Approve",
};

interface Permission {
	id: string;
	resource: string;
	action: string;
	conditions: Record<string, unknown> | null;
}

interface Role {
	id: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	isActive: boolean;
	permissions: Permission[];
}

interface RoleFormData {
	name: string;
	description: string;
	permissions: Array<{
		resource: string;
		action: string;
		conditions?: Record<string, unknown>;
	}>;
}

export function RoleManagement() {
	const queryClient = useQueryClient();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [deletingRole, setDeletingRole] = useState<Role | null>(null);

	const { data: rolesData, isLoading } = useQuery({
		queryKey: ["roles"],
		queryFn: async () => {
			const response = await api.api.rbac.roles.get();
			if (response.error) throw new Error("Failed to fetch roles");
			return response.data.roles as unknown as Role[];
		},
	});

	const createRoleMutation = useMutation({
		mutationFn: async (data: RoleFormData) => {
			const response = await api.api.rbac.roles.post(data);
			if (response.error) throw new Error("Failed to create role");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			setIsCreateModalOpen(false);
		},
	});

	const updateRoleMutation = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: RoleFormData }) => {
			const response = await api.api.rbac.roles[id].put(data);
			if (response.error) throw new Error("Failed to update role");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			setEditingRole(null);
		},
	});

	const deleteRoleMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await api.api.rbac.roles[id].delete();
			if (response.error) throw new Error("Failed to delete role");
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			setDeletingRole(null);
		},
	});

	const roles = rolesData || [];

	return (
		<div className="max-w-5xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-10">
				<h1 className="text-[24px] font-medium text-white tracking-[-0.02em]">
					Roles
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
							aria-label="Shield icon"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<span className="text-[13px] text-white/40">
						{isLoading ? "—" : roles.length}{" "}
						{roles.length === 1 ? "role" : "roles"}
					</span>
				</div>
			</div>

			{/* Roles List */}
			<div>
				{isLoading ? (
					<div className="space-y-[1px]">
						{[1, 2, 3, 4, 5].map((i) => (
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
				) : roles.length === 0 ? (
					<div className="py-16 text-center">
						<div className="w-11 h-11 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-5 h-5 text-white/30"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								role="img"
								aria-label="Shield icon"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							</svg>
						</div>
						<p className="text-white/50 text-[15px] mb-1">No roles yet</p>
						<p className="text-white/30 text-[13px]">
							Create your first role to get started
						</p>
					</div>
				) : (
					<div className="space-y-[1px]">
						{roles.map((role, index) => (
							<motion.div
								key={role.id}
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
										<svg
											className="w-4 h-4 text-white/40"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											role="img"
											aria-label="Shield icon"
										>
											<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
										</svg>
									</div>
									<div className="flex flex-col">
										<div className="flex items-center gap-2">
											<span className="text-[14px] text-white/90 group-hover:text-white transition-colors">
												{role.name}
											</span>
											{role.isSystem && (
												<span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50 text-[10px] font-medium">
													System
												</span>
											)}
											{!role.isActive && (
												<span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/40 text-[10px] font-medium">
													Inactive
												</span>
											)}
										</div>
										<span className="text-[13px] text-white/40">
											{role.description ||
												`${role.permissions.length} permissions`}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
									<motion.button
										type="button"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={(e) => {
											e.stopPropagation();
											setEditingRole(role);
										}}
										disabled={role.isSystem}
										className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
										title={
											role.isSystem ? "Cannot edit system roles" : "Edit role"
										}
									>
										<Pencil className="w-4 h-4" weight="light" />
									</motion.button>
									<motion.button
										type="button"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={(e) => {
											e.stopPropagation();
											setDeletingRole(role);
										}}
										disabled={role.isSystem}
										className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
										title={
											role.isSystem
												? "Cannot delete system roles"
												: "Delete role"
										}
									>
										<Trash className="w-4 h-4" weight="light" />
									</motion.button>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			{/* Create/Edit Modal */}
			<RoleModal
				isOpen={isCreateModalOpen || !!editingRole}
				onClose={() => {
					setIsCreateModalOpen(false);
					setEditingRole(null);
				}}
				role={editingRole}
				onSubmit={(data) => {
					if (editingRole) {
						updateRoleMutation.mutate({ id: editingRole.id, data });
					} else {
						createRoleMutation.mutate(data);
					}
				}}
				isSubmitting={
					createRoleMutation.isPending || updateRoleMutation.isPending
				}
			/>

			{/* Delete Confirmation */}
			<AnimatePresence>
				{deletingRole && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/50 z-50"
						onClick={() => setDeletingRole(null)}
					/>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{deletingRole && (
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
									Delete Role
								</h2>
								<motion.button
									type="button"
									onClick={() => setDeletingRole(null)}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
								>
									<X className="w-4 h-4" weight="light" />
								</motion.button>
							</div>
							<div className="px-5 py-5">
								<p className="text-[13px] text-white/60 leading-relaxed">
									Are you sure you want to delete{" "}
									<span className="text-white/90 font-medium">
										{deletingRole?.name}
									</span>
									? This action cannot be undone.
								</p>
							</div>
							<div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-end gap-4">
								<motion.button
									type="button"
									onClick={() => setDeletingRole(null)}
									whileHover={{ scale: 1.01 }}
									whileTap={{ scale: 0.98 }}
									className="px-2 py-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors"
								>
									Cancel
								</motion.button>
								<motion.button
									type="button"
									onClick={() =>
										deletingRole && deleteRoleMutation.mutate(deletingRole.id)
									}
									disabled={deleteRoleMutation.isPending}
									whileHover={{
										scale: deleteRoleMutation.isPending ? 1 : 1.01,
									}}
									whileTap={{
										scale: deleteRoleMutation.isPending ? 1 : 0.98,
									}}
									className="px-2 py-1.5 text-[13px] text-red-400/80 hover:text-red-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{deleteRoleMutation.isPending ? "Deleting..." : "Delete"}
								</motion.button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

interface RoleModalProps {
	isOpen: boolean;
	onClose: () => void;
	role: Role | null;
	onSubmit: (data: RoleFormData) => void;
	isSubmitting: boolean;
}

function RoleModal({
	isOpen,
	onClose,
	role,
	onSubmit,
	isSubmitting,
}: RoleModalProps) {
	const nameId = useId();
	const descId = useId();
	const [name, setName] = useState(role?.name || "");
	const [description, setDescription] = useState(role?.description || "");
	const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
		() => {
			if (!role) return new Set();
			return new Set(role.permissions.map((p) => `${p.resource}:${p.action}`));
		},
	);

	// Reset form when modal opens/closes or role changes
	useState(() => {
		setName(role?.name || "");
		setDescription(role?.description || "");
		setSelectedPermissions(
			role
				? new Set(role.permissions.map((p) => `${p.resource}:${p.action}`))
				: new Set(),
		);
	});

	const togglePermission = (resource: string, action: string) => {
		const key = `${resource}:${action}`;
		const newSet = new Set(selectedPermissions);
		if (newSet.has(key)) {
			newSet.delete(key);
		} else {
			newSet.add(key);
		}
		setSelectedPermissions(newSet);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const permissions = Array.from(selectedPermissions).map((key) => {
			const [resource, action] = key.split(":");
			return { resource, action };
		});
		onSubmit({ name, description, permissions });
	};

	if (!isOpen) return null;

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
						className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] max-h-[90vh] z-50"
					>
						<div className="bg-[#0a0a0a] rounded-xl border border-white/[0.06] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
							<div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
								<h2 className="text-[15px] font-medium text-white">
									{role ? "Edit Role" : "Create Role"}
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

							<form onSubmit={handleSubmit} className="flex flex-col h-full">
								<div className="flex-1 overflow-auto px-5 py-5 space-y-5">
									<div className="space-y-3">
										<Input
											id={nameId}
											label="Role Name"
											placeholder="e.g., Marketing Manager"
											value={name}
											onChange={(e) => setName(e.target.value)}
											required
										/>

										<Input
											id={descId}
											label="Description"
											placeholder="Brief description of this role's responsibilities"
											value={description}
											onChange={(e) => setDescription(e.target.value)}
										/>
									</div>

									<div>
										<div className="flex items-center justify-between mb-3">
											<span className="text-[13px] font-medium text-white/60">
												Permissions
											</span>
											<span className="text-[11px] text-white/30">
												{selectedPermissions.size} selected
											</span>
										</div>

										{/* Permission Matrix */}
										<div className="border border-white/[0.06] rounded-xl overflow-hidden">
											<table className="w-full">
												<thead>
													<tr className="bg-white/[0.03]">
														<th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">
															Resource
														</th>
														{PERMISSION_ACTIONS.map((action) => (
															<th
																key={action}
																className="px-3 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium text-center w-20"
																title={ACTION_LABELS[action]}
															>
																{action.charAt(0).toUpperCase()}
															</th>
														))}
													</tr>
												</thead>
												<tbody className="divide-y divide-white/[0.06]">
													{PERMISSION_RESOURCES.map((resource) => (
														<tr
															key={resource}
															className="hover:bg-white/[0.01]"
														>
															<td className="px-4 py-3 text-[13px] text-white/80 capitalize">
																{resource.replace("_", " ")}
															</td>
															{PERMISSION_ACTIONS.map((action) => {
																const key = `${resource}:${action}`;
																const isSelected = selectedPermissions.has(key);

																return (
																	<td key={action} className="p-0">
																		<button
																			type="button"
																			onClick={() =>
																				togglePermission(resource, action)
																			}
																			className={`w-full h-full py-3 flex items-center justify-center transition-all duration-150 ${
																				isSelected
																					? "bg-white/[0.08] text-white"
																					: "text-white/20 hover:text-white/40 hover:bg-white/[0.03]"
																			}`}
																			title={`${ACTION_LABELS[action]} ${resource.replace("_", " ")}`}
																		>
																			{isSelected && (
																				<Check
																					className="w-4 h-4"
																					weight="bold"
																				/>
																			)}
																		</button>
																	</td>
																);
															})}
														</tr>
													))}
												</tbody>
											</table>
										</div>

										{/* Legend */}
										<div className="flex items-center gap-4 mt-3 text-[11px] text-white/30">
											{PERMISSION_ACTIONS.map((action) => (
												<div key={action} className="flex items-center gap-1.5">
													<span className="w-4 h-4 rounded bg-white/[0.06] flex items-center justify-center text-[9px] text-white/40 font-medium">
														{action.charAt(0).toUpperCase()}
													</span>
													<span>{ACTION_LABELS[action]}</span>
												</div>
											))}
										</div>
									</div>
								</div>

								<div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-end gap-4 shrink-0">
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
										disabled={isSubmitting}
										whileHover={{
											scale: isSubmitting ? 1 : 1.01,
										}}
										whileTap={{
											scale: isSubmitting ? 1 : 0.98,
										}}
										className="px-2 py-1.5 text-[13px] text-white/80 hover:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{isSubmitting
											? "Saving..."
											: role
												? "Save Changes"
												: "Create Role"}
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
