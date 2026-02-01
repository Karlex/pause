import {
	ArrowRight,
	Bell,
	CalendarBlank,
	CheckCircle,
	Clock,
	WarningCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { BalanceCards } from "./BalanceCards";
import { RequestModal } from "./RequestModal";

interface LeaveRequest {
	id: string;
	startDate: string;
	endDate: string;
	status: "approved" | "pending" | "declined";
	totalHours: number;
	leaveType: {
		name: string;
		code: string;
	};
}

interface DashboardProps {
	user: {
		name: string;
		email: string;
		role: string;
	};
}

export function Dashboard({ user }: DashboardProps) {
	const firstName = user.name?.split(" ")[0] || "there";
	const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
	const [selectedLeaveTypeCode, setSelectedLeaveTypeCode] = useState<
		string | undefined
	>(undefined);
	const isManager = user.role === "manager" || user.role === "super_admin";

	const handleOpenRequestModal = (leaveTypeCode?: string) => {
		setSelectedLeaveTypeCode(leaveTypeCode);
		setIsRequestModalOpen(true);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<DashboardHeader firstName={firstName} />

			{/* Balance Cards - Click to request */}
			<BalanceCards onRequestClick={handleOpenRequestModal} />

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Left Column - 2/3 width */}
				<div className="lg:col-span-2 space-y-4">
					<UpcomingTimeOff />
					{isManager && <PendingActions />}
				</div>

				{/* Right Column - 1/3 width */}
				<div className="space-y-4">
					<TodaysSchedule />
					<RecentActivity />
				</div>
			</div>

			<RequestModal
				isOpen={isRequestModalOpen}
				onClose={() => {
					setIsRequestModalOpen(false);
					setSelectedLeaveTypeCode(undefined);
				}}
				preselectedLeaveTypeCode={selectedLeaveTypeCode}
			/>
		</div>
	);
}

function DashboardHeader({ firstName }: { firstName: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="flex items-center justify-between"
		>
			<div>
				<div className="flex items-baseline gap-3 mb-1">
					<h1 className="text-[26px] font-medium text-white tracking-[-0.02em]">
						Good morning, {firstName}
					</h1>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{
							delay: 0.2,
							type: "spring",
							stiffness: 400,
							damping: 20,
						}}
						className="w-1.5 h-1.5 rounded-full bg-white/30"
					/>
				</div>
				<p className="text-white/30 text-[13px]">
					Here's everything that needs your attention
				</p>
			</div>
			<motion.button
				type="button"
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className="relative p-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
			>
				<Bell className="w-[18px] h-[18px]" weight="light" />
				<span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/50" />
			</motion.button>
		</motion.div>
	);
}

function UpcomingTimeOff() {
	const {
		data: response,
		isLoading,
		error,
	} = useQuery<{
		requests: LeaveRequest[];
	}>({
		queryKey: ["leave-requests"],
		queryFn: async () => {
			const res = await api.api["leave-requests"].get();
			if (res.error) {
				throw new Error(res.error.value.message);
			}
			return res.data as { requests: LeaveRequest[] };
		},
	});

	const formatDateRange = (startDate: string, endDate: string) => {
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (start.getTime() === end.getTime()) {
			return format(start, "MMM d, yyyy");
		}

		const sameMonth = start.getMonth() === end.getMonth();
		const sameYear = start.getFullYear() === end.getFullYear();

		if (sameMonth && sameYear) {
			return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
		}

		return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
	};

	if (isLoading) {
		return (
			<motion.section
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
			>
				<SectionHeader
					icon={CalendarBlank}
					title="Upcoming Time Off"
					subtitle="Your scheduled leave"
				/>
				<div className="space-y-2 mt-4">
					<div className="p-4 rounded-lg bg-white/[0.02] animate-pulse h-16" />
					<div className="p-4 rounded-lg bg-white/[0.02] animate-pulse h-16" />
				</div>
			</motion.section>
		);
	}

	if (error) {
		return (
			<motion.section
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
			>
				<SectionHeader
					icon={CalendarBlank}
					title="Upcoming Time Off"
					subtitle="Your scheduled leave"
				/>
				<div className="mt-4 p-4 rounded-lg bg-white/[0.02] text-center">
					<p className="text-[14px] text-white/40">
						Unable to load time off data
					</p>
				</div>
			</motion.section>
		);
	}

	const requests = response?.requests || [];

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
		>
			<div className="flex items-center justify-between">
				<SectionHeader
					icon={CalendarBlank}
					title="Upcoming Time Off"
					subtitle="Your scheduled leave"
				/>
				<motion.button
					type="button"
					whileHover={{ x: 2 }}
					className="group flex items-center gap-1.5 text-[13px] text-white/30 hover:text-white/60 transition-colors"
				>
					View all
					<ArrowRight
						className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
						weight="light"
					/>
				</motion.button>
			</div>

			<div className="mt-4 space-y-1">
				{requests.length === 0 ? (
					<div className="p-4 rounded-lg bg-white/[0.02] text-center">
						<p className="text-[14px] text-white/40">No upcoming time off</p>
					</div>
				) : (
					requests.map((request) => (
						<TimeOffItem
							key={request.id}
							type={request.leaveType.name}
							dates={formatDateRange(request.startDate, request.endDate)}
							status={request.status}
							days={Math.ceil(request.totalHours / 8)}
						/>
					))
				)}
			</div>
		</motion.section>
	);
}

function SectionHeader({
	icon: Icon,
	title,
	subtitle,
}: {
	icon: React.ComponentType<{
		className?: string;
		weight?: "light" | "regular" | "bold" | "fill";
	}>;
	title: string;
	subtitle: string;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
				<Icon className="w-4 h-4 text-white/50" weight="light" />
			</div>
			<div>
				<h2 className="text-[14px] font-medium text-white/90 tracking-[-0.01em]">
					{title}
				</h2>
				<p className="text-[12px] text-white/30">{subtitle}</p>
			</div>
		</div>
	);
}

function TimeOffItem({
	type,
	dates,
	status,
	days,
}: {
	type: string;
	dates: string;
	status: "approved" | "pending" | "declined";
	days: number;
}) {
	const statusConfig = {
		approved: {
			icon: CheckCircle,
			color: "text-white/70",
			bg: "bg-white/[0.06]",
			label: "Approved",
		},
		pending: {
			icon: Clock,
			color: "text-white/50",
			bg: "bg-white/[0.04]",
			label: "Pending",
		},
		declined: {
			icon: WarningCircle,
			color: "text-red-400",
			bg: "bg-red-500/[0.08]",
			label: "Declined",
		},
	};

	const config = statusConfig[status];
	const StatusIcon = config.icon;

	return (
		<motion.div
			whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
			className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] transition-colors cursor-pointer"
		>
			<div className="flex items-center gap-3">
				<div
					className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
				>
					<StatusIcon className={`w-4 h-4 ${config.color}`} weight="light" />
				</div>
				<div>
					<p className="text-[14px] font-medium text-white/85">{type}</p>
					<p className="text-[12px] text-white/30">{dates}</p>
				</div>
			</div>
			<div className="text-right">
				<span className={`text-[13px] font-medium ${config.color}`}>
					{config.label}
				</span>
				<p className="text-[11px] text-white/25">
					{days} day{days !== 1 ? "s" : ""}
				</p>
			</div>
		</motion.div>
	);
}

function PendingActions() {
	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.16, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
		>
			<SectionHeader
				icon={WarningCircle}
				title="Requires Attention"
				subtitle="Action needed"
			/>

			<div className="mt-4 space-y-1">
				<ActionItem
					title="Approve Sarah's leave request"
					description="Annual leave • Feb 10-14"
					priority="high"
				/>
				<ActionItem
					title="Submit expense report"
					description="Due by Feb 5"
					priority="medium"
				/>
			</div>
		</motion.section>
	);
}

function ActionItem({
	title,
	description,
	priority,
}: {
	title: string;
	description: string;
	priority: "high" | "medium" | "low";
}) {
	const priorityConfig = {
		high: { dot: "bg-white/60", label: "High" },
		medium: { dot: "bg-white/35", label: "Medium" },
		low: { dot: "bg-white/20", label: "Low" },
	};

	const config = priorityConfig[priority];

	return (
		<motion.div
			whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
			className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] transition-colors cursor-pointer"
		>
			<div>
				<p className="text-[14px] font-medium text-white/85 group-hover:text-white transition-colors">
					{title}
				</p>
				<p className="text-[12px] text-white/30">{description}</p>
			</div>
			<div className="flex items-center gap-2">
				<div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
				<span className="text-[11px] text-white/25">{config.label}</span>
			</div>
		</motion.div>
	);
}

function TodaysSchedule() {
	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
		>
			<SectionHeader
				icon={Clock}
				title="Today's Schedule"
				subtitle="Your meetings today"
			/>

			<div className="mt-4 space-y-1">
				<ScheduleItem time="10:00 AM" title="Team Standup" duration="30 min" />
				<ScheduleItem
					time="2:00 PM"
					title="1:1 with Manager"
					duration="30 min"
				/>
				<ScheduleItem time="4:00 PM" title="Project Review" duration="1 hour" />
			</div>
		</motion.section>
	);
}

function ScheduleItem({
	time,
	title,
	duration,
}: {
	time: string;
	title: string;
	duration: string;
}) {
	return (
		<motion.div
			whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
			className="group flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] transition-colors cursor-pointer"
		>
			<div className="text-[13px] font-medium text-white/50 w-[72px] shrink-0">
				{time}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-[14px] font-medium text-white/85 truncate">
					{title}
				</p>
				<p className="text-[11px] text-white/30">{duration}</p>
			</div>
		</motion.div>
	);
}

function RecentActivity() {
	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
		>
			<SectionHeader
				icon={CheckCircle}
				title="Recent Activity"
				subtitle="Latest updates"
			/>

			<div className="mt-4 space-y-3">
				<ActivityItem action="Your leave was approved" time="2 hours ago" />
				<ActivityItem action="Requested sick leave" time="Yesterday" />
			</div>
		</motion.section>
	);
}

function ActivityItem({ action, time }: { action: string; time: string }) {
	return (
		<div className="flex items-center justify-between py-1">
			<p className="text-[13px] text-white/70">{action}</p>
			<p className="text-[11px] text-white/25">{time}</p>
		</div>
	);
}
