import { Facehash } from "facehash";

interface AvatarProps {
	name: string;
	size?: number;
	className?: string;
}

const defaultColors = ["#1a1a1a", "#2a2a2a", "#3a3a3a"];

export function Avatar({ name, size = 32, className = "" }: AvatarProps) {
	return (
		<div className={`rounded-full overflow-hidden ${className}`}>
			<Facehash
				name={name}
				size={size}
				variant="solid"
				showInitial={true}
				colors={defaultColors}
			/>
		</div>
	);
}
