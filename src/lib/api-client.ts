import { edenTreaty } from "@elysiajs/eden";
import type { Api } from "@/api";

// Eden Treaty provides end-to-end type safety between our Elysia API and React frontend
export const api = edenTreaty<Api>("http://localhost:3001", {
	fetcher: (input: RequestInfo | URL, init?: RequestInit) =>
		fetch(input, {
			...init,
			credentials: "include",
		}),
});

export type ApiClient = typeof api;
