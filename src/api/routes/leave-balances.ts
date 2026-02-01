import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";
import { getUserBalances } from "@/lib/balances";
import { logger } from "@/lib/logger";

export const leaveBalancesRoutes = new Elysia({ prefix: "/leave-balances" })
	.onBeforeHandle(async ({ request, set }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			set.status = 401;
			return { error: "Unauthorized" };
		}
	})
	.get(
		"/",
		async ({ request, set }) => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			if (!session) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			try {
				const year = new Date().getFullYear();
				const balances = await getUserBalances(session.user.id, year);

				logger.info(
					{ userId: session.user.id, year, count: balances.length },
					"Fetched leave balances",
				);

				return { balances };
			} catch (error) {
				logger.error(
					{ error, userId: session.user.id },
					"Failed to fetch leave balances",
				);
				set.status = 500;
				return { error: "Failed to fetch balances" };
			}
		},
		{
			response: {
				200: t.Object({
					balances: t.Array(
						t.Object({
							leaveTypeId: t.String(),
							leaveTypeName: t.String(),
							leaveTypeCode: t.String(),
							allowance: t.Number(),
							used: t.Number(),
							scheduled: t.Number(),
							remaining: t.Number(),
						}),
					),
				}),
				401: t.Object({ error: t.String() }),
				500: t.Object({ error: t.String() }),
			},
		},
	);
