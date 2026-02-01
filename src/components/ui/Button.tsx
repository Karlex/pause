import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ButtonProps {
	variant?: "primary" | "secondary" | "ghost";
	size?: "default" | "lg";
	isLoading?: boolean;
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
}

export function Button({
	variant = "primary",
	size = "default",
	isLoading = false,
	children,
	className = "",
	disabled,
	onClick,
	type = "button",
}: ButtonProps) {
	const baseStyles =
		"w-full text-[14px] font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

	const variants = {
		primary: "bg-white hover:bg-white/95 text-black shadow-sm",
		secondary:
			"bg-white/[0.03] hover:bg-white/[0.06] text-white/80 hover:text-white border border-white/[0.08]",
		ghost:
			"bg-transparent hover:bg-white/[0.03] text-white/50 hover:text-white/70",
	};

	const sizes = {
		default: "py-2.5",
		lg: "py-3.5",
	};

	return (
		<motion.button
			type={type}
			onClick={onClick}
			whileHover={{ scale: isLoading || disabled ? 1 : 1.01 }}
			whileTap={{ scale: isLoading || disabled ? 1 : 0.98 }}
			disabled={disabled || isLoading}
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
		>
			{isLoading ? (
				<div className="flex items-center justify-center gap-2">
					<motion.div
						className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
						animate={{ rotate: 360 }}
						transition={{
							duration: 0.8,
							repeat: Infinity,
							ease: "linear",
						}}
					/>
					<span>Loading...</span>
				</div>
			) : (
				children
			)}
		</motion.button>
	);
}
