import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";

interface Balance {
	leaveTypeId: string;
	leaveTypeName: string;
	leaveTypeCode: string;
	allowance: number;
	used: number;
	scheduled: number;
	remaining: number;
}

// Priority order for leave types (most important first)
const LEAVE_TYPE_PRIORITY = ["annual", "sick", "holiday", "emergency"];

// Subtle color accents - barely noticeable, maintaining monochrome aesthetic
const TYPE_ACCENT = {
	annual: {
		border: "border-white/[0.12]",
		hoverBorder: "hover:border-white/[0.18]",
		bg: "bg-white/[0.035]",
		icon: "text-white/70",
	},
	sick: {
		border: "border-white/[0.10]",
		hoverBorder: "hover:border-white/[0.14]",
		bg: "bg-white/[0.03]",
		icon: "text-white/60",
	},
	holiday: {
		border: "border-white/[0.09]",
		hoverBorder: "hover:border-white/[0.13]",
		bg: "bg-white/[0.025]",
		icon: "text-white/55",
	},
	emergency: {
		border: "border-white/[0.11]",
		hoverBorder: "hover:border-white/[0.16]",
		bg: "bg-white/[0.032]",
		icon: "text-white/65",
	},
};

interface BalanceCardsProps {
	onRequestClick?: (leaveTypeCode?: string) => void;
}

export function BalanceCards({ onRequestClick }: BalanceCardsProps = {}) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["leave-balances"],
		queryFn: async () => {
			const response = await api.api["leave-balances"].get();
			if (response.error) {
				throw new Error("Failed to fetch balances");
			}
			return response.data.balances as Balance[];
		},
	});

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
					>
						<div className="h-3 w-20 bg-white/10 rounded mb-3" />
						<div className="h-7 w-14 bg-white/10 rounded mb-2" />
						<div className="h-2 w-full bg-white/10 rounded" />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
				<p className="text-white/60 text-sm">Failed to load balances</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="mt-2 text-sm text-white/40 hover:text-white/60"
				>
					Retry
				</button>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
				<p className="text-white/40 text-sm">No leave balances configured</p>
			</div>
		);
	}

	// Sort by priority
	const sortedData = [...data].sort((a, b) => {
		const priorityA = LEAVE_TYPE_PRIORITY.indexOf(a.leaveTypeCode);
		const priorityB = LEAVE_TYPE_PRIORITY.indexOf(b.leaveTypeCode);
		return priorityA - priorityB;
	});

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{sortedData.map((balance, index) => (
				<BalanceCard
					key={balance.leaveTypeId}
					balance={balance}
					index={index}
					onClick={onRequestClick}
				/>
			))}
		</div>
	);
}

function BalanceCard({
	balance,
	index,
	onClick,
}: {
	balance: Balance;
	index: number;
	onClick?: (leaveTypeCode?: string) => void;
}) {
	const { isOverdrawn, isUnlimited } = getDisplayValues(balance);
	const accent =
		TYPE_ACCENT[balance.leaveTypeCode as keyof typeof TYPE_ACCENT] ||
		TYPE_ACCENT.annual;

	const percentageUsed =
		balance.allowance > 0
			? Math.min(100, (balance.used / balance.allowance) * 100)
			: balance.used > 0
				? Math.min(100, balance.used * 10)
				: 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				delay: index * 0.05,
				duration: 0.4,
				ease: [0.22, 1, 0.36, 1],
			}}
			onClick={() => onClick?.(balance.leaveTypeCode)}
			className={`
				group relative p-5 rounded-xl border cursor-pointer
				${accent.bg} ${accent.border} ${accent.hoverBorder}
				hover:bg-white/[0.04]
				transition-all duration-300
				${isOverdrawn ? "border-red-500/30 bg-red-500/[0.02]" : ""}
			`}
		>
			{/* Subtle glow effect on hover */}
			<div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

			{/* Header with icon */}
			<div className="relative flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<TypeIcon code={balance.leaveTypeCode} className={accent.icon} />
					<p className="text-[12px] text-white/50 font-medium">
						{balance.leaveTypeName}
					</p>
				</div>
				{isOverdrawn && (
					<span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
						Overdrawn
					</span>
				)}
			</div>

			{/* Main Value - Days Remaining */}
			<div className="relative mb-4">
				<div className="flex items-baseline gap-1.5">
					<motion.p
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
						className={`
							text-[32px] font-semibold tracking-tight leading-none
							${isOverdrawn ? "text-red-400" : "text-white"}
						`}
					>
						{isUnlimited ? balance.used : Math.max(0, balance.remaining)}
					</motion.p>
					<p className="text-[13px] text-white/40">
						{isUnlimited ? "used" : "remaining"}
					</p>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="relative space-y-2">
				<div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: `${Math.min(100, percentageUsed)}%` }}
						transition={{
							delay: index * 0.05 + 0.15,
							duration: 0.6,
							ease: [0.22, 1, 0.36, 1],
						}}
						className={`
							h-full rounded-full
							${getProgressStyle(percentageUsed, isOverdrawn)}
						`}
					/>
				</div>
				<p className="text-[11px] text-white/30">
					{isUnlimited ? (
						<span>{balance.used} days used</span>
					) : (
						<span>
							{balance.used} used
							{balance.scheduled > 0 && (
								<span className="text-white/40">
									{" "}
									+ {balance.scheduled} pending
								</span>
							)}
							<span className="text-white/30"> of {balance.allowance}</span>
						</span>
					)}
				</p>
			</div>
		</motion.div>
	);
}

function TypeIcon({ code, className }: { code: string; className: string }) {
	// Minimalist icons using Unicode symbols - subtle and elegant
	const icons: Record<string, string> = {
		annual: "◯", // Circle - completeness, wholeness
		sick: "+", // Plus - medical cross
		holiday: "✦", // Four point star - celebration
		emergency: "◆", // Diamond - urgency
	};

	return (
		<span className={`text-[10px] ${className} opacity-60`}>
			{icons[code] || "◯"}
		</span>
	);
}

function getDisplayValues(balance: Balance) {
	const isUnlimited = balance.allowance === 0;
	const isOverdrawn = !isUnlimited && balance.remaining < 0;
	return { isOverdrawn, isUnlimited };
}

function getProgressStyle(percentage: number, isOverdrawn: boolean): string {
	if (isOverdrawn) return "bg-red-500";
	if (percentage >= 90) return "bg-white/90";
	if (percentage >= 75) return "bg-white/70";
	return "bg-white/40";
}
