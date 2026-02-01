import { Popover } from "@base-ui-components/react/popover";
import { CalendarBlank, CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { type ClassValue, clsx } from "clsx";
import {
	addDays,
	addMonths,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import { forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface BaseDatePickerProps {
	id?: string;
	label?: string;
	value?: Date | null;
	onChange: (date: Date | null) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export const BaseDatePicker = forwardRef<
	HTMLButtonElement,
	BaseDatePickerProps
>(
	(
		{
			id,
			label,
			value,
			onChange,
			placeholder = "Select date",
			disabled,
			className,
		},
		ref,
	) => {
		const [currentMonth, setCurrentMonth] = useState(value || new Date());
		const [open, setOpen] = useState(false);

		const handleDateSelect = (date: Date) => {
			onChange(date);
			setOpen(false);
		};

		const handleClear = (e: React.MouseEvent) => {
			e.stopPropagation();
			onChange(null);
		};

		const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
		const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

		// Generate calendar days
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const calendarStart = startOfWeek(monthStart);
		const calendarEnd = endOfWeek(monthEnd);

		const days: Date[] = [];
		let day = calendarStart;
		while (day <= calendarEnd) {
			days.push(day);
			day = addDays(day, 1);
		}

		const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

		return (
			<div className={cn("space-y-1.5", className)}>
				{label && (
					<label
						htmlFor={id}
						className="block text-[12px] font-medium text-white/70"
					>
						{label}
					</label>
				)}
				<Popover.Root open={open} onOpenChange={setOpen}>
					<Popover.Trigger
						ref={ref}
						id={id}
						disabled={disabled}
						className={cn(
							"w-full px-3 py-2 bg-white/[0.02] text-[13px] rounded-lg border border-white/[0.06] outline-none transition-all duration-200 flex items-center justify-between",
							"hover:border-white/10 focus:border-white/20 focus:bg-white/[0.03] data-[open]:border-white/20 data-[open]:bg-white/[0.03]",
							"disabled:opacity-50 disabled:cursor-not-allowed",
						)}
					>
						<span className={value ? "text-white" : "text-white/40"}>
							{value ? format(value, "MMM d, yyyy") : placeholder}
						</span>
						<div className="flex items-center gap-1.5">
							{value && (
								<button
									type="button"
									onClick={handleClear}
									className="p-0.5 rounded-full hover:bg-white/[0.1] text-white/40 hover:text-white/60"
								>
									<X className="w-3 h-3" weight="bold" />
								</button>
							)}
							<CalendarBlank
								className="w-3.5 h-3.5 text-white/30"
								weight="light"
							/>
						</div>
					</Popover.Trigger>
					<Popover.Portal>
						<Popover.Positioner className="z-50" sideOffset={4}>
							<Popover.Popup
								className={cn(
									"w-[260px] p-2.5 bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-2xl outline-none",
								)}
							>
								{/* Header */}
								<div className="flex items-center justify-between mb-2 px-1">
									<button
										type="button"
										onClick={prevMonth}
										className="p-1 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white/80"
									>
										<CaretLeft className="w-3.5 h-3.5" weight="bold" />
									</button>
									<span className="text-[13px] font-medium text-white">
										{format(currentMonth, "MMMM yyyy")}
									</span>
									<button
										type="button"
										onClick={nextMonth}
										className="p-1 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white/80"
									>
										<CaretRight className="w-3.5 h-3.5" weight="bold" />
									</button>
								</div>

								{/* Week days */}
								<div className="grid grid-cols-7 mb-1">
									{weekDays.map((dayName) => (
										<div
											key={dayName}
											className="text-center text-[10px] font-medium text-white/40 py-1"
										>
											{dayName}
										</div>
									))}
								</div>

								{/* Calendar grid */}
								<div className="grid grid-cols-7 gap-0.5">
									{days.map((dayItem) => {
										const isSelected = value && isSameDay(dayItem, value);
										const isCurrentMonth = isSameMonth(dayItem, monthStart);
										const isToday = isSameDay(dayItem, new Date());
										const dayKey = format(dayItem, "yyyy-MM-dd");

										return (
											<button
												key={dayKey}
												type="button"
												onClick={() => handleDateSelect(dayItem)}
												className={cn(
													"h-7 w-7 rounded-md text-[12px] flex items-center justify-center transition-colors",
													isSelected
														? "bg-white text-black font-medium"
														: isToday
															? "bg-white/[0.08] text-white border border-white/20"
															: isCurrentMonth
																? "text-white/80 hover:bg-white/[0.06]"
																: "text-white/30",
												)}
											>
												{format(dayItem, "d")}
											</button>
										);
									})}
								</div>
							</Popover.Popup>
						</Popover.Positioner>
					</Popover.Portal>
				</Popover.Root>
			</div>
		);
	},
);

BaseDatePicker.displayName = "BaseDatePicker";
