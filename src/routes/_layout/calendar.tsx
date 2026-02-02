import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	addDays,
	addMonths,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	isToday,
	parseISO,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import { motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_layout/calendar")({
	component: CalendarPage,
});

interface CalendarEvent {
	id: string;
	userId: string;
	userName: string;
	userImage?: string;
	startDate: string;
	endDate: string;
	leaveType: {
		name: string;
		code: string;
		colour: string;
	};
	totalHours: number;
	days: number;
}

interface CalendarData {
	events: CalendarEvent[];
	month: number;
	year: number;
}

function CalendarPage() {
	const [currentDate, setCurrentDate] = useState(new Date());

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth() + 1;

	const { data: response, isLoading } = useQuery<CalendarData>({
		queryKey: ["team-calendar", year, month],
		queryFn: async () => {
			const res = await api.api.team.calendar.get({
				$query: { year: year.toString(), month: month.toString() },
			});
			if (res.error) {
				throw new Error(
					typeof res.error.value === "string"
						? res.error.value
						: "Failed to fetch calendar data",
				);
			}
			return res.data as CalendarData;
		},
	});

	const { data: leaveTypesData } = useQuery({
		queryKey: ["leave-types"],
		queryFn: async () => {
			const res = await api.api["leave-balances"].types.get();
			if (res.error) {
				throw new Error("Failed to fetch leave types");
			}
			return res.data.types;
		},
	});

	const events = response?.events || [];

	const handlePrevMonth = () => {
		setCurrentDate((prev) => subMonths(prev, 1));
	};

	const handleNextMonth = () => {
		setCurrentDate((prev) => addMonths(prev, 1));
	};

	const handleToday = () => {
		setCurrentDate(new Date());
	};

	// Generate calendar days
	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(monthStart);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const days: Date[] = [];
	let day = new Date(calendarStart);
	const end = new Date(calendarEnd);
	while (day <= end) {
		days.push(new Date(day));
		day = addDays(day, 1);
	}

	// Group events by date
	const eventsByDate = new Map<string, CalendarEvent[]>();
	for (const event of events) {
		const start = parseISO(event.startDate);
		const end = parseISO(event.endDate);

		// Add event to each day it spans
		const currentDay = new Date(start);
		while (currentDay <= end) {
			const dateKey = format(currentDay, "yyyy-MM-dd");
			if (!eventsByDate.has(dateKey)) {
				eventsByDate.set(dateKey, []);
			}
			// Only add if not already added for this date
			const existing = eventsByDate.get(dateKey);
			if (existing && !existing.find((e) => e.id === event.id)) {
				existing.push(event);
			}
			currentDay.setDate(currentDay.getDate() + 1);
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="flex items-center justify-between"
			>
				<div className="flex items-center gap-4">
					<div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
						<CalendarBlank className="w-5 h-5 text-white/50" weight="light" />
					</div>
					<div>
						<h1 className="text-[22px] font-medium text-white tracking-[-0.02em]">
							Team Calendar
						</h1>
						<p className="text-[13px] text-white/40">
							See who's out and plan ahead
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<motion.button
						type="button"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={handleToday}
						className="px-4 py-2 rounded-lg bg-white/[0.04] text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
					>
						Today
					</motion.button>
					<div className="flex items-center gap-1">
						<motion.button
							type="button"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handlePrevMonth}
							className="p-2 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
						>
							<CaretLeft className="w-4 h-4" weight="light" />
						</motion.button>
						<motion.button
							type="button"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleNextMonth}
							className="p-2 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
						>
							<CaretRight className="w-4 h-4" weight="light" />
						</motion.button>
					</div>
					<div className="px-4 py-2 min-w-[140px] text-center">
						<span className="text-[15px] font-medium text-white">
							{format(currentDate, "MMMM yyyy")}
						</span>
					</div>
				</div>
			</motion.div>

			{/* Calendar */}
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
			>
				{/* Weekday headers */}
				<div className="grid grid-cols-7 border-b border-white/[0.06]">
					{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
						<div
							key={dayName}
							className="py-3 text-center text-[12px] font-medium text-white/40 uppercase tracking-wider"
						>
							{dayName}
						</div>
					))}
				</div>

				{/* Calendar grid */}
				<div className="grid grid-cols-7">
					{isLoading
						? // biome-ignore lint/suspicious/noArrayIndexKey: loading skeletons are temporary
							Array.from({ length: 35 }).map((_, idx) => (
								<div
									key={`skeleton-${idx}`}
									className="min-h-[120px] p-2 border-r border-b border-white/[0.04] animate-pulse bg-white/[0.01]"
								/>
							))
						: days.map((date) => {
								const dateKey = format(date, "yyyy-MM-dd");
								const dayEvents = eventsByDate.get(dateKey) || [];
								const isCurrentMonth = isSameMonth(date, currentDate);
								const isTodayDate = isToday(date);

								return (
									<div
										key={dateKey}
										className={`min-h-[120px] p-2 border-r border-b border-white/[0.04] ${
											!isCurrentMonth ? "bg-white/[0.01]" : ""
										}`}
									>
										<div className="flex items-center justify-between mb-2">
											<span
												className={`text-[13px] ${
													isTodayDate
														? "w-7 h-7 rounded-full bg-white text-black font-medium flex items-center justify-center"
														: isCurrentMonth
															? "text-white/70"
															: "text-white/30"
												}`}
											>
												{format(date, "d")}
											</span>
											{dayEvents.length > 0 && (
												<span className="text-[10px] text-white/30">
													{dayEvents.length} out
												</span>
											)}
										</div>

										<div className="space-y-1">
											{dayEvents.slice(0, 3).map((event) => (
												<div
													key={event.id}
													className="px-2 py-1 rounded text-[11px] truncate cursor-pointer hover:opacity-80 transition-opacity"
													style={{
														backgroundColor: `${event.leaveType.colour}20`,
														color: event.leaveType.colour,
													}}
												>
													{event.userName.split(" ")[0]} •{" "}
													{event.leaveType.name}
												</div>
											))}
											{dayEvents.length > 3 && (
												<div className="text-[10px] text-white/30 pl-2">
													+{dayEvents.length - 3} more
												</div>
											)}
										</div>
									</div>
								);
							})}
				</div>
			</motion.div>

			{/* Legend */}
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="flex items-center gap-6 text-[12px] text-white/40"
			>
				<span>Leave types:</span>
				<div className="flex items-center gap-4">
					{leaveTypesData?.map((type) => (
						<div key={type.id} className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded"
								style={{ backgroundColor: type.colour }}
							/>
							<span>{type.name}</span>
						</div>
					))}
				</div>
			</motion.div>
		</div>
	);
}
