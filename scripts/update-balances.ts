import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL not set");
}

const db = drizzle(databaseUrl, { schema });

async function updateBalances() {
	console.log("🔄 Updating leave balances for 2026...\n");

	// Get admin user
	const adminEmail = "karl@pause.dev";
	const user = await db.query.users.findFirst({
		where: eq(schema.users.email, adminEmail),
	});

	if (!user) {
		console.log("❌ Admin user not found");
		process.exit(1);
	}

	console.log(`Found user: ${user.name} (${user.email})`);

	// Get current leave types
	const leaveTypesList = await db.query.leaveTypes.findMany();
	console.log(`\nFound ${leaveTypesList.length} leave types`);

	// Get policy
	const policy = await db.query.leavePolicies.findFirst({
		where: eq(schema.leavePolicies.isDefault, true),
	});

	if (!policy) {
		console.log("❌ Default policy not found");
		process.exit(1);
	}

	console.log(`Found policy: ${policy.name}`);

	// Update or create balances for 2026
	const year = 2026;
	const config = policy.config;

	for (const leaveType of leaveTypesList) {
		const typeConfig = config.leaveTypes[leaveType.code];
		
		if (!typeConfig?.enabled) {
			console.log(`  ⏭️  Skipping ${leaveType.name} (disabled)`);
			continue;
		}

		const existingBalance = await db.query.leaveBalances.findFirst({
			where: eq(schema.leaveBalances.userId, user.id) && 
			       eq(schema.leaveBalances.leaveTypeId, leaveType.id) &&
			       eq(schema.leaveBalances.year, year),
		});

		if (existingBalance) {
			// Update existing balance
			await db.update(schema.leaveBalances)
				.set({ allowance: typeConfig.defaultAllowanceHours })
				.where(eq(schema.leaveBalances.id, existingBalance.id));
			console.log(`  ✓ Updated ${leaveType.name}: ${typeConfig.defaultAllowanceHours / 8} days`);
		} else {
			// Create new balance
			await db.insert(schema.leaveBalances).values({
				userId: user.id,
				leaveTypeId: leaveType.id,
				year: year,
				allowance: typeConfig.defaultAllowanceHours,
				used: 0,
				scheduled: 0,
				carriedOver: 0,
				adjustment: 0,
			});
			console.log(`  ✓ Created ${leaveType.name}: ${typeConfig.defaultAllowanceHours / 8} days`);
		}
	}

	console.log("\n✨ Balance update complete!");
	process.exit(0);
}

updateBalances().catch((err) => {
	console.error("Failed to update balances:", err);
	process.exit(1);
});
