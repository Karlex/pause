import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import type { PolicyConfig } from "../src/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL not set");
}

const db = drizzle(databaseUrl, { schema });

async function updatePolicy() {
	console.log("🔄 Updating policy configuration...\n");

	const updatedPolicyConfig: PolicyConfig = {
		leaveTypes: {
			annual: {
				enabled: true,
				defaultAllowanceHours: 160, // 20 days (CHANGED from 200)
				accrual: { type: "upfront", proRataFirstYear: true },
				carryOver: { enabled: true, maxHours: 40, expiresAfterMonths: 3 },
				rules: {
					minNoticeHours: 48,
					maxConsecutiveHours: 80,
					autoApproveUpToHours: 0,
					requiresDocumentAfterHours: 0,
					requiresApproval: true,
				},
			},
			sick: {
				enabled: true,
				defaultAllowanceHours: 40, // 5 days (CHANGED from 80)
				accrual: { type: "upfront", proRataFirstYear: false },
				carryOver: { enabled: false, maxHours: 0, expiresAfterMonths: 0 },
				rules: {
					minNoticeHours: 0,
					maxConsecutiveHours: 40,
					autoApproveUpToHours: 16,
					requiresDocumentAfterHours: 24,
					requiresApproval: false,
				},
			},
			holiday: {
				enabled: true,
				defaultAllowanceHours: 0,
				accrual: { type: "upfront", proRataFirstYear: false },
				carryOver: { enabled: false, maxHours: 0, expiresAfterMonths: 0 },
				rules: {
					minNoticeHours: 0,
					maxConsecutiveHours: 8,
					autoApproveUpToHours: 8,
					requiresDocumentAfterHours: 0,
					requiresApproval: false,
				},
			},
			emergency: {
				enabled: true,
				defaultAllowanceHours: 0,
				accrual: { type: "upfront", proRataFirstYear: false },
				carryOver: { enabled: false, maxHours: 0, expiresAfterMonths: 0 },
				rules: {
					minNoticeHours: 0,
					maxConsecutiveHours: 40,
					autoApproveUpToHours: 8,
					requiresDocumentAfterHours: 0,
					requiresApproval: true,
				},
			},
		},
	};

	// Update the policy
	await db.update(schema.leavePolicies)
		.set({ config: updatedPolicyConfig })
		.where(eq(schema.leavePolicies.isDefault, true));

	console.log("✓ Updated policy:");
	console.log("  - Annual Leave: 20 days (was 25)");
	console.log("  - Sick Leave: 5 days (was 10)");

	// Now update all user balances for 2026
	console.log("\n🔄 Updating user balances...");
	
	const users = await db.query.users.findMany();
	const leaveTypes = await db.query.leaveTypes.findMany();
	const year = 2026;

	for (const user of users) {
		console.log(`\nUpdating balances for ${user.name}:`);
		
		for (const leaveType of leaveTypes) {
			const typeConfig = updatedPolicyConfig.leaveTypes[leaveType.code];
			
			if (!typeConfig?.enabled) continue;

			const existingBalance = await db.query.leaveBalances.findFirst({
				where: eq(schema.leaveBalances.userId, user.id) && 
				       eq(schema.leaveBalances.leaveTypeId, leaveType.id) &&
				       eq(schema.leaveBalances.year, year),
			});

			if (existingBalance) {
				await db.update(schema.leaveBalances)
					.set({ allowance: typeConfig.defaultAllowanceHours })
					.where(eq(schema.leaveBalances.id, existingBalance.id));
				console.log(`  ✓ ${leaveType.name}: ${typeConfig.defaultAllowanceHours / 8} days`);
			}
		}
	}

	console.log("\n✨ Update complete!");
	process.exit(0);
}

updatePolicy().catch((err) => {
	console.error("Failed to update policy:", err);
	process.exit(1);
});
