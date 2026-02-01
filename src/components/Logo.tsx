import { motion } from "motion/react";

interface LogoProps {
	size?: "sm" | "md" | "lg";
	animate?: boolean;
}

const sizes = {
	sm: "text-[16px]",
	md: "text-[20px]",
	lg: "text-[24px]",
};

export function Logo({ size = "md", animate = true }: LogoProps) {
	const content = (
		<span
			className={`font-semibold text-white/90 ${sizes[size]}`}
			style={{
				fontFamily: '"Commit Mono", "JetBrains Mono", "SF Mono", monospace',
				letterSpacing: "-0.02em",
			}}
		>
			Keiyaku
		</span>
	);

	if (animate) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			>
				{content}
			</motion.div>
		);
	}

	return content;
}

export function LogoIcon({ className = "w-6 h-6" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Keiyaku</title>
			<rect x="5" y="4" width="7" height="24" rx="2" fill="currentColor" />
			<path
				d="M12 15 L26 5"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
			/>
			<path
				d="M12 17 L26 27"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
			/>
		</svg>
	);
}
