import { Select } from "@base-ui-components/react/select";
import { CaretDown, Check } from "@phosphor-icons/react";
import { type ClassValue, clsx } from "clsx";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export interface SelectOption {
	value: string;
	label: string;
	description?: string;
}

interface BaseSelectProps {
	id?: string;
	label?: string;
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export const BaseSelect = forwardRef<HTMLButtonElement, BaseSelectProps>(
	(
		{
			id,
			label,
			value,
			onChange,
			options,
			placeholder = "Select...",
			disabled,
			className,
		},
		ref,
	) => {
		const selectedOption = options.find((opt) => opt.value === value);

		return (
			<Select.Root
				value={value}
				onValueChange={(newValue) => {
					if (newValue) onChange(newValue);
				}}
				disabled={disabled}
			>
				<div className={cn("space-y-1.5", className)}>
					{label && (
						<label
							htmlFor={id}
							className="block text-[12px] font-medium text-white/70"
						>
							{label}
						</label>
					)}
					<Select.Trigger
						ref={ref}
						id={id}
						className={cn(
							"w-full px-3 py-2 bg-white/[0.02] text-white text-[13px] rounded-lg border border-white/[0.06] outline-none transition-all duration-200 flex items-center justify-between",
							"hover:border-white/10 focus:border-white/20 focus:bg-white/[0.03] data-[popup-open]:border-white/20 data-[popup-open]:bg-white/[0.03]",
							"disabled:opacity-50 disabled:cursor-not-allowed",
						)}
					>
						<Select.Value
							className={cn(selectedOption ? "text-white" : "text-white/40")}
						>
							{selectedOption?.label || placeholder}
						</Select.Value>
						<Select.Icon className="text-white/30">
							<CaretDown className="w-3.5 h-3.5" weight="bold" />
						</Select.Icon>
					</Select.Trigger>
					<Select.Portal>
						<Select.Backdrop className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40" />
						<Select.Positioner className="z-50" sideOffset={4}>
							<Select.Popup
								className={cn(
									"w-[var(--anchor-width)] py-0.5 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-2xl",
									"max-h-[240px] overflow-auto outline-none",
								)}
							>
								{options.map((option) => (
									<Select.Item
										key={option.value}
										value={option.value}
										className={cn(
											"px-3 py-2 text-left text-[13px] transition-colors flex items-center justify-between cursor-pointer outline-none",
											"text-white/70 hover:bg-white/[0.04] hover:text-white",
											"data-[selected]:bg-white/[0.08] data-[selected]:text-white",
										)}
									>
										<Select.ItemText>{option.label}</Select.ItemText>
										<Select.ItemIndicator>
											<Check
												className="w-3.5 h-3.5 text-white/60"
												weight="bold"
											/>
										</Select.ItemIndicator>
									</Select.Item>
								))}
							</Select.Popup>
						</Select.Positioner>
					</Select.Portal>
				</div>
			</Select.Root>
		);
	},
);

BaseSelect.displayName = "BaseSelect";
