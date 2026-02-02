import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL not set");
}

const db = drizzle(databaseUrl, { schema });

async function updateColors() {
	console.log("Updating leave type colors to monochrome theme...\n");

	const colorUpdates = [
		{ id: "lt_annual", colour: "#a0a0a0" },
		{ id: "lt_sick", colour: "#ff6b6b" },
		{ id: "lt_holiday", colour: "#4dabf7" },
		{ id: "lt_emergency", colour: "#ff8787" },
	];

	for (const update of colorUpdates) {
		await db
			.update(schema.leaveTypes)
			.set({ colour: update.colour })
			.where(eq(schema.leaveTypes.id, update.id));
		console.log(`  ✓ Updated ${update.id} to ${update.colour}`);
	}

	console.log("\n✨ Color update complete!");
	process.exit(0);
}

updateColors().catch((err) => {
	console.error("Failed to update colors:", err);
	process.exit(1);
});
