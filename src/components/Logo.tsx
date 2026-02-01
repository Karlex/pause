import { motion } from "motion/react";

interface LogoProps {
	size?: "sm" | "md" | "lg";
	animate?: boolean;
}

export function Logo({ size = "md", animate = true }: LogoProps) {
	const sizes = {
		sm: "text-[18px]",
		md: "text-[22px]",
		lg: "text-[28px]",
	};

	const content = (
		<span
			className={`font-mono font-semibold tracking-tight ${sizes[size]}`}
			style={{
				fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
				letterSpacing: "-0.03em",
			}}
		>
			<span className="text-white">P</span>
			<span className="text-white/70">ause</span>
		</span>
	);

	if (animate) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			>
				{content}
			</motion.div>
		);
	}

	return content;
}
