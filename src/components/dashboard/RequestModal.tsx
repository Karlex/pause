import { CalendarBlank, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BaseSelect, type SelectOption } from "@/components/ui";
import { api } from "@/lib/api-client";

interface RequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	preselectedLeaveTypeCode?: string;
}

const LEAVE_TYPE_CODES: Record<string, string> = {
	annual: "lt_annual",
	sick: "lt_sick",
	holiday: "lt_holiday",
	emergency: "lt_emergency",
};

const LEAVE_TYPE_NAMES: Record<string, string> = {
	annual: "Annual Leave",
	sick: "Sick Leave",
	holiday: "Holiday Leave",
	emergency: "Emergency Leave",
};

const LEAVE_TYPE_OPTIONS: SelectOption[] = [
	{ value: "lt_annual", label: "Annual Leave" },
	{ value: "lt_sick", label: "Sick Leave" },
	{ value: "lt_holiday", label: "Holiday Leave" },
	{ value: "lt_emergency", label: "Emergency Leave" },
];

export function RequestModal({
	isOpen,
	onClose,
	preselectedLeaveTypeCode,
}: RequestModalProps) {
	const queryClient = useQueryClient();
	const dateRangeId = useId();
	const leaveTypeId = useId();
	const noteId = useId();
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState(() => {
		if (
			preselectedLeaveTypeCode &&
			LEAVE_TYPE_CODES[preselectedLeaveTypeCode]
		) {
			return LEAVE_TYPE_CODES[preselectedLeaveTypeCode];
		}
		return "";
	});

	// Reset dates when modal opens with different leave type
	useEffect(() => {
		if (isOpen) {
			setStartDate(null);
			setEndDate(null);
			setNote("");
			setHalfDay(false);
			setError("");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);
	const [note, setNote] = useState("");
	const [halfDay, setHalfDay] = useState(false);
	const [error, setError] = useState("");

	const submitMutation = useMutation({
		mutationFn: async (data: {
			startDate: string;
			endDate: string;
			leaveTypeId: string;
			note?: string;
			halfDay?: boolean;
		}) => {
			const response = await api.api["leave-requests"].post(data);
			if (response.error) {
				const errorValue = response.error;
				if (typeof errorValue === "string") {
					throw new Error(errorValue);
				}
				if (errorValue && typeof errorValue === "object") {
					const errorData = errorValue as { error?: string; message?: string };
					throw new Error(
						errorData.error || errorData.message || "Failed to submit request",
					);
				}
				throw new Error("Failed to submit request");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
			queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
			onClose();
			resetForm();
		},
		onError: (err) => {
			console.error("Leave request error:", err);
			if (err instanceof Error) {
				if (err.message === "[object Object]") {
					const errorObj = err as unknown as Record<string, unknown>;
					setError(
						String(
							errorObj?.error ||
								errorObj?.message ||
								"Failed to submit request",
						),
					);
				} else {
					setError(err.message);
				}
			} else if (typeof err === "string") {
				setError(err);
			} else {
				const errorObj = err as Record<string, unknown>;
				setError(
					String(
						errorObj?.error ||
							errorObj?.message ||
							"An unexpected error occurred",
					),
				);
			}
		},
	});

	const resetForm = () => {
		setStartDate(null);
		setEndDate(null);
		setSelectedLeaveTypeId("");
		setNote("");
		setHalfDay(false);
		setError("");
	};

	const formatDate = (date: Date | null): string => {
		if (!date) return "";
		return date.toISOString().split("T")[0];
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!startDate || !endDate || !selectedLeaveTypeId) {
			setError("Please fill in all required fields");
			return;
		}

		if (startDate > endDate) {
			setError("End date must be after start date");
			return;
		}

		submitMutation.mutate({
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
			leaveTypeId: selectedLeaveTypeId,
			note: note || undefined,
			halfDay,
		});
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
						onClick={onClose}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 16 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 16 }}
						transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
						className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] z-50"
					>
						<div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden relative">
							<div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
										<CalendarBlank
											className="w-4 h-4 text-white/50"
											weight="light"
										/>
									</div>
									<h2 className="text-[15px] font-medium text-white tracking-[-0.01em]">
										Request Time Off
									</h2>
								</div>
								<button
									type="button"
									onClick={onClose}
									className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
								>
									<X className="w-4 h-4" weight="light" />
								</button>
							</div>
							<form onSubmit={handleSubmit} className="p-5 space-y-4">
								{error && (
									<div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400">
										{error}
									</div>
								)}
								<div className="space-y-5">
									<div>
										<DatePicker
											id={dateRangeId}
											selected={startDate}
											onChange={(dates: [Date | null, Date | null]) => {
												const [start, end] = dates;
												setStartDate(start);
												setEndDate(end);
											}}
											startDate={startDate}
											endDate={endDate}
											selectsRange
											dateFormat="MMM d"
											placeholderText="Select dates"
											className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[14px] text-white focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
											popperClassName="react-datepicker-popper"
											popperPlacement="bottom-start"
										/>
									</div>
									{preselectedLeaveTypeCode ? (
										<div className="py-2">
											<p className="text-[12px] text-white/50">
												{LEAVE_TYPE_NAMES[preselectedLeaveTypeCode]}
											</p>
										</div>
									) : (
										<BaseSelect
											id={leaveTypeId}
											label="Leave Type"
											options={LEAVE_TYPE_OPTIONS}
											placeholder="Select type"
											value={selectedLeaveTypeId}
											onChange={(value) => setSelectedLeaveTypeId(value)}
										/>
									)}
								</div>
								<div className="flex items-center gap-2.5">
									<button
										type="button"
										onClick={() => setHalfDay(!halfDay)}
										className={`w-9 h-5 rounded-full transition-colors relative ${halfDay ? "bg-white/25" : "bg-white/[0.08]"}`}
									>
										<span
											className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${halfDay ? "translate-x-4" : "translate-x-0"}`}
										/>
									</button>
									<span className="text-[12px] text-white/50">Half day</span>
								</div>
								<div>
									<label
										htmlFor={noteId}
										className="block text-[12px] text-white/50 mb-1.5"
									>
										Note <span className="text-white/30">(optional)</span>
									</label>
									<textarea
										id={noteId}
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder="Add details..."
										rows={2}
										className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors resize-none"
									/>
								</div>
								<motion.button
									type="submit"
									disabled={submitMutation.isPending}
									whileHover={{ scale: 1.01 }}
									whileTap={{ scale: 0.99 }}
									className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-medium text-[13px] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{submitMutation.isPending
										? "Submitting..."
										: "Submit Request"}
								</motion.button>
							</form>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
