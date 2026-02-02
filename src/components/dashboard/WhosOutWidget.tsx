import { Users } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";

interface WhosOutData {
	whosOut: {
		user: {
			id: string;
			name: string;
			email: string;
			image?: string;
		};
		absences: {
			id: string;
			startDate: string;
			endDate: string;
			leaveType: {
				name: string;
				code: string;
				colour: string;
			};
			days: number;
		}[];
	}[];
	dateRange: {
		startDate: string;
		endDate: string;
	};
}

export function WhosOutWidget() {
	const {
		data: response,
		isLoading,
		error,
	} = useQuery<WhosOutData>({
		queryKey: ["whos-out"],
		queryFn: async () => {
			const res = await api.api.team["whos-out"].get();
			if (res.error) {
				const errorValue = res.error.value as
					| { error?: string; message?: string }
					| string;
				const errorMessage =
					typeof errorValue === "string"
						? errorValue
						: errorValue?.error ||
							errorValue?.message ||
							"Failed to fetch data";
				throw new Error(errorMessage);
			}
			return res.data as WhosOutData;
		},
	});

	if (isLoading) {
		return (
			<motion.section
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
			>
				<SectionHeader
					icon={Users}
					title="Who's Out"
					subtitle="Team absences"
				/>
				<div className="mt-4 space-y-2">
					<div className="p-3 rounded-lg bg-white/[0.02] animate-pulse h-14" />
					<div className="p-3 rounded-lg bg-white/[0.02] animate-pulse h-14" />
				</div>
			</motion.section>
		);
	}

	if (error) {
		return (
			<motion.section
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
			>
				<SectionHeader
					icon={Users}
					title="Who's Out"
					subtitle="Team absences"
				/>
				<div className="mt-4 p-4 rounded-lg bg-white/[0.02] text-center">
					<p className="text-[13px] text-white/40">Unable to load data</p>
				</div>
			</motion.section>
		);
	}

	const whosOut = response?.whosOut || [];

	// Categorize by when they're out
	const today: typeof whosOut = [];
	const tomorrow: typeof whosOut = [];
	const thisWeek: typeof whosOut = [];

	for (const person of whosOut) {
		const firstAbsence = person.absences[0];
		if (!firstAbsence) continue;

		const startDate = parseISO(firstAbsence.startDate);

		if (isToday(startDate)) {
			today.push(person);
		} else if (isTomorrow(startDate)) {
			tomorrow.push(person);
		} else {
			thisWeek.push(person);
		}
	}

	const totalOut = whosOut.length;

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5"
		>
			<div className="flex items-center justify-between">
				<SectionHeader
					icon={Users}
					title="Who's Out"
					subtitle={
						totalOut === 0
							? "No one is out"
							: `${totalOut} person${totalOut !== 1 ? "s" : ""} out`
					}
				/>
				{totalOut > 0 && (
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
						<span className="text-[11px] text-white/30">Live</span>
					</div>
				)}
			</div>

			<div className="mt-4 space-y-3">
				{totalOut === 0 ? (
					<div className="p-4 rounded-lg bg-white/[0.02] text-center">
						<p className="text-[13px] text-white/40">Everyone is in today</p>
					</div>
				) : (
					<>
						{today.length > 0 && (
							<div>
								<p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2">
									Today
								</p>
								<div className="space-y-1">
									{today.slice(0, 3).map((person) => (
										<PersonOutItem
											key={person.user.id}
											name={person.user.name}
											image={person.user.image}
											leaveType={person.absences[0].leaveType}
											days={person.absences[0].days}
										/>
									))}
								</div>
							</div>
						)}

						{tomorrow.length > 0 && (
							<div>
								<p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2">
									Tomorrow
								</p>
								<div className="space-y-1">
									{tomorrow.slice(0, 2).map((person) => (
										<PersonOutItem
											key={person.user.id}
											name={person.user.name}
											image={person.user.image}
											leaveType={person.absences[0].leaveType}
											days={person.absences[0].days}
										/>
									))}
								</div>
							</div>
						)}

						{thisWeek.length > 0 && (
							<div>
								<p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2">
									This Week
								</p>
								<div className="space-y-1">
									{thisWeek.slice(0, 2).map((person) => (
										<PersonOutItem
											key={person.user.id}
											name={person.user.name}
											image={person.user.image}
											leaveType={person.absences[0].leaveType}
											days={person.absences[0].days}
											showDate={person.absences[0].startDate}
										/>
									))}
								</div>
							</div>
						)}
					</>
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

function PersonOutItem({
	name,
	image,
	leaveType,
	days,
	showDate,
}: {
	name: string;
	image?: string;
	leaveType: { name: string; code: string; colour: string };
	days: number;
	showDate?: string;
}) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="group flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
			{image ? (
				<img
					src={image}
					alt={name}
					className="w-8 h-8 rounded-full object-cover"
				/>
			) : (
				<div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-medium text-white/60">
					{initials}
				</div>
			)}
			<div className="flex-1 min-w-0">
				<p className="text-[13px] font-medium text-white/85 truncate">{name}</p>
				<div className="flex items-center gap-2">
					<div
						className="w-1.5 h-1.5 rounded-full"
						style={{ backgroundColor: leaveType.colour }}
					/>
					<p className="text-[11px] text-white/40">
						{leaveType.name}
						{showDate && ` • ${format(parseISO(showDate), "MMM d")}`}
					</p>
				</div>
			</div>
			<span className="text-[11px] text-white/30">{days}d</span>
		</div>
	);
}
