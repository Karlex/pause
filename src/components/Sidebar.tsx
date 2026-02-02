import {
	Building,
	CalendarBlank,
	CheckCircle,
	Clock,
	FileText,
	House,
	Shield,
	UserCircle,
	Users,
} from "@phosphor-icons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ProfileTrigger } from "@/components/ProfileModal";
import { useCanApprove, useCanCreate } from "@/hooks/usePermissions";
import { authClient } from "@/lib/auth-client";

interface NavItem {
	label: string;
	to: string;
	icon: React.ComponentType<{
		className?: string;
		weight?: "light" | "regular" | "bold" | "fill";
	}>;
}

// Navigation items for all authenticated users
const mainNavItems: NavItem[] = [
	{ label: "Home", to: "/", icon: House },
	{ label: "Team", to: "/manager", icon: Users },
	{ label: "Time Off", to: "/time-off", icon: CalendarBlank },
	{ label: "Time Tracking", to: "/time-tracking", icon: Clock },
	{ label: "Documents", to: "/documents", icon: FileText },
];

// Admin-only navigation items (users:create permission)
const adminNavItems: NavItem[] = [
	{ label: "People", to: "/people", icon: UserCircle },
	{ label: "Roles", to: "/admin/roles", icon: Shield },
	{ label: "Departments", to: "/admin/departments", icon: Building },
];

// Manager/Admin approval navigation
const approvalNavItems: NavItem[] = [
	{ label: "Approvals", to: "/approvals", icon: CheckCircle },
];

export function Sidebar() {
	const location = useLocation();
	const { data: session } = authClient.useSession();
	const canCreateUsers = useCanCreate("users");
	const canApproveRequests = useCanApprove("leave_requests");

	return (
		<aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#090909] flex flex-col">
			{/* Logo Section */}
			<div className="px-5 pt-6 pb-5">
				<Link to="/">
					<Logo size="md" />
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-3">
				<ul className="space-y-0.5">
					{/* Main navigation - accessible to all users */}
					{mainNavItems.map((item) => {
						const isActive = location.pathname === item.to;
						const Icon = item.icon;

						return (
							<li key={item.to}>
								<Link
									to={item.to}
									className={`
										flex items-center gap-3 px-3 py-2 rounded-md
										text-[13px] transition-colors duration-150
										${
											isActive
												? "text-white"
												: "text-white/40 hover:text-white/60"
										}
									`}
								>
									<Icon
										className="w-[18px] h-[18px]"
										weight={isActive ? "fill" : "light"}
									/>
									<span className="font-normal">{item.label}</span>
								</Link>
							</li>
						);
					})}

					{/* Admin-only section */}
					{canCreateUsers && (
						<>
							<li className="my-2 border-t border-white/[0.06]" />
							{adminNavItems.map((item) => {
								const isActive = location.pathname === item.to;
								const Icon = item.icon;

								return (
									<li key={item.to}>
										<Link
											to={item.to}
											className={`
												flex items-center gap-3 px-3 py-2 rounded-md
												text-[13px] transition-colors duration-150
												${
													isActive
														? "text-white"
														: "text-white/40 hover:text-white/60"
												}
											`}
										>
											<Icon
												className="w-[18px] h-[18px]"
												weight={isActive ? "fill" : "light"}
											/>
											<span className="font-normal">{item.label}</span>
										</Link>
									</li>
								);
							})}
						</>
					)}

					{/* Approvals section - for managers/admins who can approve */}
					{canApproveRequests && (
						<>
							<li className="my-2 border-t border-white/[0.06]" />
							{approvalNavItems.map((item) => {
								const isActive = location.pathname === item.to;
								const Icon = item.icon;

								return (
									<li key={item.to}>
										<Link
											to={item.to}
											className={`
												flex items-center gap-3 px-3 py-2 rounded-md
												text-[13px] transition-colors duration-150
												${
													isActive
														? "text-white"
														: "text-white/40 hover:text-white/60"
												}
											`}
										>
											<Icon
												className="w-[18px] h-[18px]"
												weight={isActive ? "fill" : "light"}
											/>
											<span className="font-normal">{item.label}</span>
										</Link>
									</li>
								);
							})}
						</>
					)}
				</ul>
			</nav>

			{/* User Section - Opens Profile Modal */}
			<div className="px-3 py-4 mt-auto">
				<ProfileTrigger user={session?.user ?? null} />
			</div>
		</aside>
	);
}
