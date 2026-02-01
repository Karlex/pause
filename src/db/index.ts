import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL environment variable is required");
}

// Create a connection pool for better performance and transaction support
const pool = new Pool({
	connectionString: databaseUrl,
	// Security: Enforce SSL in production
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: true }
			: false,
	// Connection pool settings
	max: 20, // Maximum number of clients in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection not established
	// Query timeout to prevent long-running queries
	query_timeout: 10000, // 10 seconds
});

// Handle pool errors
pool.on("error", (err) => {
	console.error("Unexpected error on idle client", err);
	process.exit(-1);
});

export const db = drizzle(pool, { schema });

// Export pool for transactions
export { pool };
