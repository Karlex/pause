import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

async function resetDatabase() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL not set");
	}

	console.log("Connecting to database...");
	const db = drizzle(databaseUrl);

	console.log("Dropping all tables...");
	await db.execute(sql`DROP SCHEMA public CASCADE`);
	await db.execute(sql`CREATE SCHEMA public`);
	await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);

	console.log("Database reset complete!");
	process.exit(0);
}

resetDatabase().catch((err) => {
	console.error("Failed to reset database:", err);
	process.exit(1);
});
