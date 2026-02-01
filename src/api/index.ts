import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { approvalsRoutes } from "./routes/approvals";
import { employeesRoutes } from "./routes/employees";
import { leaveBalancesRoutes } from "./routes/leave-balances";
import { leaveRequestsRoutes } from "./routes/leave-requests";
import { managerRoutes } from "./routes/manager";

export const api = new Elysia({ prefix: "/api" })
	.all("/auth/*", ({ request }) => auth.handler(request))
	.use(leaveBalancesRoutes)
	.use(leaveRequestsRoutes)
	.use(approvalsRoutes)
	.use(managerRoutes)
	.use(employeesRoutes)
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
