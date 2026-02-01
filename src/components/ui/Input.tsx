import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, className = "", ...props }, ref) => {
		return (
			<div className="space-y-1.5">
				{label && (
					<label
						htmlFor={props.id}
						className="block text-[12px] font-medium text-white/70"
					>
						{label}
					</label>
				)}
				<input
					ref={ref}
					className={`w-full px-3 py-2 bg-white/[0.02] text-white text-[13px] placeholder:text-white/25 rounded-lg border border-white/[0.06] outline-none transition-all duration-200 hover:border-white/10 focus:border-white/20 focus:bg-white/[0.03] ${className}`}
					{...props}
				/>
				{error && <p className="text-[12px] text-red-400">{error}</p>}
			</div>
		);
	},
);

Input.displayName = "Input";
