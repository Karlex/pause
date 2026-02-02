import { Plus, Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { AddEmployeeModal } from "@/components/people/AddEmployeeModal";
import { useCanCreate } from "@/hooks/usePermissions";
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
	employee: "bg-white/[0.04] text-white/50",
	team_lead: "bg-blue-500/[0.08] text-blue-400/80",
	manager: "bg-purple-500/[0.08] text-purple-400/80",
	hr_admin: "bg-amber-500/[0.08] text-amber-400/80",
	super_admin: "bg-red-500/[0.08] text-red-400/80",
};

// People page is admin-only - requires users:create permission
function PeoplePage() {
	const canCreateUsers = useCanCreate("users");

	// Redirect to team page if user doesn't have permission
	if (!canCreateUsers) {
		return <Navigate to="/manager" />;
	}

	return <PeoplePageContent />;
}

function PeoplePageContent() {
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
		<div className="max-w-5xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-10">
				<h1 className="text-[24px] font-medium text-white tracking-[-0.02em]">
					People
				</h1>
				<motion.button
					onClick={() => setIsAddModalOpen(true)}
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
						<Users className="w-3.5 h-3.5 text-white/40" weight="light" />
					</div>
					<span className="text-[13px] text-white/40">
						{isLoading ? "—" : employees.length}{" "}
						{employees.length === 1 ? "person" : "people"}
					</span>
				</div>
			</div>

			{/* Employees List */}
			<div>
				{isLoading ? (
					<div className="space-y-1">
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] animate-pulse"
							>
								<div className="w-9 h-9 rounded-full bg-white/10" />
								<div className="flex-1 space-y-2">
									<div className="h-3.5 w-28 bg-white/10 rounded" />
									<div className="h-3 w-40 bg-white/10 rounded" />
								</div>
							</div>
						))}
					</div>
				) : employees.length === 0 ? (
					<div className="py-16 text-center">
						<div className="w-11 h-11 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
							<Users className="w-5 h-5 text-white/30" weight="light" />
						</div>
						<p className="text-white/50 text-[15px] mb-1">No employees yet</p>
						<p className="text-white/30 text-[13px]">
							Add your first employee to get started
						</p>
					</div>
				) : (
					<div className="space-y-[1px]">
						{employees.map((employee, index) => (
							<motion.div
								key={employee.id}
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
									{employee.image ? (
										<img
											src={employee.image}
											alt={employee.name}
											className="w-9 h-9 rounded-full object-cover"
										/>
									) : (
										<Avatar name={employee.email || employee.name} size={36} />
									)}
									<div className="flex flex-col">
										<span className="text-[14px] text-white/90 group-hover:text-white transition-colors">
											{employee.name}
										</span>
										<span className="text-[13px] text-white/40">
											{employee.email}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<span
										className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
											ROLE_COLORS[employee.role] || ROLE_COLORS.employee
										}`}
									>
										{ROLE_LABELS[employee.role] || employee.role}
									</span>
									{employee.startDate && (
										<span className="text-[12px] text-white/30 hidden sm:block">
											{format(new Date(employee.startDate), "MMM d, yyyy")}
										</span>
									)}
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
