import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { approvalsRoutes } from "./routes/approvals";
import { employeesRoutes } from "./routes/employees";
import { leaveBalancesRoutes } from "./routes/leave-balances";
import { leavePoliciesRoutes } from "./routes/leave-policies";
import { leaveRequestsRoutes } from "./routes/leave-requests";
import { managerRoutes } from "./routes/manager";
import { publicHolidaysRoutes } from "./routes/public-holidays";
import { rbacRoutes } from "./routes/rbac";
import { teamRoutes } from "./routes/team";

export const api = new Elysia({ prefix: "/api" })
	.all("/auth/*", ({ request }) => auth.handler(request))
	.use(leaveBalancesRoutes)
	.use(leaveRequestsRoutes)
	.use(leavePoliciesRoutes)
	.use(publicHolidaysRoutes)
	.use(approvalsRoutes)
	.use(managerRoutes)
	.use(employeesRoutes)
	.use(rbacRoutes)
	.use(teamRoutes)
	.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
	.onError(({ code, error }) => {
		console.error(`[API Error] ${code}:`, error);
		return {
			error:
				code === "VALIDATION" ? "Validation failed" : "Internal server error",
			code,
		};
	});

export type Api = typeof api;
