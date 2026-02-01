import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, className = "", ...props }, ref) => {
		return (
			<div className="space-y-2">
				{label && (
					<label
						htmlFor={props.id}
						className="block text-[13px] font-medium text-white/70"
					>
						{label}
					</label>
				)}
				<input
					ref={ref}
					className={`w-full px-3.5 py-2.5 bg-[#0d0d0d] text-white placeholder:text-white/25 rounded-lg border border-white/[0.08] outline-none transition-all duration-200 hover:border-white/15 focus:border-white/25 focus:bg-[#0d0d0d] ${className}`}
					{...props}
				/>
				{error && <p className="text-[13px] text-error">{error}</p>}
			</div>
		);
	},
);

Input.displayName = "Input";
