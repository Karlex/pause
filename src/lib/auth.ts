import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
	appName: "Pause",
	basePath: "/api/auth",

	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Simplified for now
	},

	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				// TODO: Integrate with Resend
				console.log(`[Magic Link] Send to ${email}: ${url}`);
			},
			expiresIn: 60 * 10, // 10 minutes
		}),
	],

	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // Refresh daily
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // 5 minutes
		},
	},

	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "employee",
				input: false,
			},
			department: {
				type: "string",
				required: false,
				input: false,
			},
			managerId: {
				type: "string",
				required: false,
				input: false,
			},
			location: {
				type: "string",
				required: true,
				defaultValue: "UK",
				input: false,
			},
			timezone: {
				type: "string",
				required: false,
				defaultValue: "Europe/London",
				input: false,
			},
			startDate: {
				type: "string",
				required: false,
				input: false,
			},
			policyId: {
				type: "string",
				required: false,
				input: false,
			},
		},
	},

	account: {
		accountLinking: {
			enabled: true,
		},
	},
});

export type Session = typeof auth.$Infer.Session;
