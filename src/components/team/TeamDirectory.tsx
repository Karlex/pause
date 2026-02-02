import { Envelope, MapPin, Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api-client";

interface TeamMember {
	id: string;
	name: string;
	email: string;
	image?: string;
	role: string;
	location: string;
	timezone: string;
	startDate?: string;
	manager?: {
		id: string;
		name: string;
		email: string;
	};
}

export function TeamDirectory() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["team-members"],
		queryFn: async () => {
			const response = await api.api.team.members.get();
			if (response.error) {
				throw new Error("Failed to fetch team members");
			}
			return response.data.members as TeamMember[];
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
								Team Directory
							</h1>
							<p className="text-white/40 text-[14px]">
								View all team members and contact details
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div
								key={i}
								className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
							>
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-full bg-white/10" />
									<div className="flex-1">
										<div className="h-4 w-32 bg-white/10 rounded mb-2" />
										<div className="h-3 w-24 bg-white/10 rounded" />
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
						<p className="text-white/60">Failed to load team members</p>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const members = data || [];

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
								Team Directory
							</h1>
							<p className="text-white/40 text-[14px]">
								{members.length} team member{members.length !== 1 ? "s" : ""}
							</p>
						</div>
					</div>
				</div>

				{/* Team Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{members.map((member, index) => (
						<motion.div
							key={member.id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: index * 0.03,
								duration: 0.4,
								ease: [0.22, 1, 0.36, 1],
							}}
							className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
						>
							{/* Avatar and Name */}
							<div className="flex items-start gap-3 mb-4">
								<Avatar
									name={member.name}
									size={48}
									className="flex-shrink-0"
								/>
								<div className="flex-1 min-w-0">
									<h3 className="text-[15px] font-medium text-white truncate">
										{member.name}
									</h3>
									<p className="text-[13px] text-white/40 capitalize">
										{member.role.replace("_", " ")}
									</p>
								</div>
							</div>

							{/* Contact Info */}
							<div className="space-y-2">
								<a
									href={`mailto:${member.email}`}
									className="flex items-center gap-2 text-[13px] text-white/50 hover:text-white/70 transition-colors"
								>
									<Envelope className="w-4 h-4" weight="light" />
									<span className="truncate">{member.email}</span>
								</a>

								{member.location && (
									<div className="flex items-center gap-2 text-[13px] text-white/50">
										<MapPin className="w-4 h-4" weight="light" />
										<span>{member.location}</span>
									</div>
								)}
							</div>

							{/* Start Date */}
							{member.startDate && (
								<div className="mt-4 pt-3 border-t border-white/[0.06]">
									<p className="text-[12px] text-white/30">
										Started {format(new Date(member.startDate), "MMM yyyy")}
									</p>
								</div>
							)}
						</motion.div>
					))}
				</div>

				{members.length === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
						className="p-8 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center"
					>
						<div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
							<Users className="w-8 h-8 text-white/40" weight="light" />
						</div>
						<p className="text-white/60 text-[15px] mb-1">No team members</p>
						<p className="text-white/40 text-[13px]">
							There are no active team members
						</p>
					</motion.div>
				)}
			</div>
		</DashboardLayout>
	);
}
