import { Plus, Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useState } from "react";
import { AddEmployeeModal } from "@/components/people/AddEmployeeModal";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_layout/people")({
	component: PeoplePage,
});

interface Employee {
	id: string;
	name: string;
	email: string;
	image?: string;
	role: string;
	department?: string;
	location: string;
	startDate?: string;
	createdAt: Date;
	managerId?: string;
	managerName?: string;
	policyId?: string;
}

const ROLE_LABELS: Record<string, string> = {
	employee: "Employee",
	team_lead: "Team Lead",
	manager: "Manager",
	hr_admin: "HR Admin",
	super_admin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
	employee: "bg-white/[0.05] text-white/60",
	team_lead: "bg-blue-500/10 text-blue-400",
	manager: "bg-purple-500/10 text-purple-400",
	hr_admin: "bg-amber-500/10 text-amber-400",
	super_admin: "bg-red-500/10 text-red-400",
};

function PeoplePage() {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const { data: employeesData, isLoading } = useQuery<Employee[]>({
		queryKey: ["employees"],
		queryFn: async () => {
			const response = await api.api.employees.get();
			if (response.error) {
				throw new Error("Failed to fetch employees");
			}
			return response.data.employees;
		},
	});

	const employees = employeesData || [];

	return (
		<div className="max-w-6xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-[28px] font-semibold text-white tracking-[-0.03em]">
						People
					</h1>
					<p className="text-white/40 text-[14px] mt-1">
						Manage your team and organization
					</p>
				</div>
				<motion.button
					onClick={() => setIsAddModalOpen(true)}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-[14px] font-medium hover:bg-white/90 transition-colors"
				>
					<Plus className="w-4 h-4" weight="bold" />
					Add Employee
				</motion.button>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
				>
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
							<Users className="w-5 h-5 text-white/60" weight="light" />
						</div>
						<p className="text-white/40 text-[13px]">Total Employees</p>
					</div>
					<p className="text-[32px] font-medium text-white tracking-[-0.02em]">
						{isLoading ? "—" : employees.length}
					</p>
				</motion.div>
			</div>

			{/* Employees Table */}
			<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
				<div className="px-5 py-4 border-b border-white/[0.06]">
					<h2 className="text-[15px] font-medium text-white">Employees</h2>
				</div>

				{isLoading ? (
					<div className="p-8 space-y-4">
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] animate-pulse"
							>
								<div className="w-10 h-10 rounded-full bg-white/10" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-32 bg-white/10 rounded" />
									<div className="h-3 w-48 bg-white/10 rounded" />
								</div>
							</div>
						))}
					</div>
				) : employees.length === 0 ? (
					<div className="p-12 text-center">
						<div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
							<Users className="w-6 h-6 text-white/40" weight="light" />
						</div>
						<p className="text-white/60 text-[15px] mb-1">No employees yet</p>
						<p className="text-white/40 text-[13px]">
							Add your first employee to get started
						</p>
					</div>
				) : (
					<div className="divide-y divide-white/[0.06]">
						{employees.map((employee, index) => (
							<motion.div
								key={employee.id}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: index * 0.03,
									duration: 0.3,
									ease: [0.22, 1, 0.36, 1],
								}}
								className="px-5 py-4 hover:bg-white/[0.02] transition-colors"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
											<span className="text-[14px] font-medium text-white/60">
												{employee.name.charAt(0).toUpperCase()}
											</span>
										</div>
										<div>
											<p className="text-[15px] font-medium text-white">
												{employee.name}
											</p>
											<p className="text-[13px] text-white/40">
												{employee.email}
												{employee.department && (
													<span className="ml-2">· {employee.department}</span>
												)}
												{employee.managerName && (
													<span className="ml-2">→ {employee.managerName}</span>
												)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<span
											className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
												ROLE_COLORS[employee.role] || ROLE_COLORS.employee
											}`}
										>
											{ROLE_LABELS[employee.role] || employee.role}
										</span>
										{employee.startDate && (
											<span className="text-[12px] text-white/30">
												Started{" "}
												{format(new Date(employee.startDate), "MMM d, yyyy")}
											</span>
										)}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>

			<AddEmployeeModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>
		</div>
	);
}
