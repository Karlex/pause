import { Gear, SignOut } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { authClient } from "@/lib/auth-client";

interface User {
	id: string;
	name: string;
	email: string;
	image?: string | null;
}

interface ProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: User | null;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.reload();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/50"
					/>
					<motion.div
						ref={modalRef}
						initial={{ opacity: 0, scale: 0.95, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -10 }}
						transition={{
							duration: 0.2,
							ease: [0.22, 1, 0.36, 1],
						}}
						className="fixed left-3 bottom-4 z-50 w-[216px] bg-[#0a0a0a] rounded-xl border border-white/[0.08] shadow-xl overflow-hidden"
					>
						{/* User Info Section */}
						<div className="p-4 border-b border-white/[0.08]">
							<div className="flex items-center gap-3">
								{user?.image ? (
									<img
										src={user.image}
										alt={user.name}
										className="w-10 h-10 rounded-full object-cover"
									/>
								) : (
									<Avatar
										name={user?.email || user?.name || "user"}
										size={40}
									/>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-[14px] font-medium text-white truncate">
										{user?.name || "User"}
									</p>
									<p className="text-[12px] text-white/40 truncate mt-0.5">
										{user?.email || ""}
									</p>
								</div>
							</div>
						</div>

						{/* Options Section */}
						<div className="p-1.5">
							<Link
								to="/settings"
								onClick={onClose}
								className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
							>
								<Gear className="w-[18px] h-[18px]" weight="light" />
								<span>Settings</span>
							</Link>
							<button
								type="button"
								onClick={handleSignOut}
								className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
							>
								<SignOut className="w-[18px] h-[18px]" weight="light" />
								<span>Sign out</span>
							</button>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

interface ProfileTriggerProps {
	user: User | null;
}

export function ProfileTrigger({ user }: ProfileTriggerProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.03] transition-colors"
			>
				<Avatar name={user?.email || user?.name || "user"} size={32} />
				<div className="flex-1 min-w-0 text-left">
					<p className="text-[13px] text-white/80 truncate">
						{user?.name || "User"}
					</p>
					<p className="text-[11px] text-white/30 truncate">
						{user?.email || ""}
					</p>
				</div>
			</button>
			<ProfileModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				user={user}
			/>
		</>
	);
}
