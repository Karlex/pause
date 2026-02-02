import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { publicHolidays } from "@/db/schema";
import { logCreate, logDelete, logUpdate } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

// Predefined holiday sets for import
const PREDEFINED_HOLIDAYS: Record<
	string,
	Array<{ name: string; date: string; region: string }>
> = {
	UK: [
		{ name: "New Year's Day", date: "01-01", region: "UK" },
		{ name: "Good Friday", date: "04-03", region: "UK" }, // 2026 date
		{ name: "Easter Monday", date: "04-06", region: "UK" }, // 2026 date
		{ name: "Early May Bank Holiday", date: "05-04", region: "UK" }, // 2026 date
		{ name: "Spring Bank Holiday", date: "05-25", region: "UK" }, // 2026 date
		{ name: "Summer Bank Holiday", date: "08-31", region: "UK" }, // 2026 date
		{ name: "Christmas Day", date: "12-25", region: "UK" },
		{ name: "Boxing Day", date: "12-28", region: "UK" }, // 2026 date (substitute)
	],
	US: [
		{ name: "New Year's Day", date: "01-01", region: "US" },
		{ name: "Martin Luther King Jr. Day", date: "01-19", region: "US" }, // 2026 date
		{ name: "Presidents' Day", date: "02-16", region: "US" }, // 2026 date
		{ name: "Memorial Day", date: "05-25", region: "US" }, // 2026 date
		{ name: "Independence Day", date: "07-04", region: "US" },
		{ name: "Labor Day", date: "09-07", region: "US" }, // 2026 date
		{ name: "Thanksgiving Day", date: "11-26", region: "US" }, // 2026 date
		{ name: "Christmas Day", date: "12-25", region: "US" },
	],
	IN: [
		{ name: "Republic Day", date: "01-26", region: "IN" },
		{ name: "Holi", date: "03-04", region: "IN" }, // 2026 date
		{ name: "Good Friday", date: "04-03", region: "IN" }, // 2026 date
		{ name: "Independence Day", date: "08-15", region: "IN" },
		{ name: "Gandhi Jayanti", date: "10-02", region: "IN" },
		{ name: "Diwali", date: "11-08", region: "IN" }, // 2026 date
		{ name: "Christmas Day", date: "12-25", region: "IN" },
	],
};

export const publicHolidaysRoutes = new Elysia({ prefix: "/public-holidays" })
	// Middleware: Check authentication and attach user
	.derive(async ({ request, set }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			set.status = 401;
			return { user: null };
		}
		return { user: session.user };
	})

	// ==================== GET ALL HOLIDAYS ====================
	.get("/", async ({ user, set, query }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "public_holidays",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		// Build query with optional filters
		let holidays: (typeof publicHolidays.$inferSelect)[];
		if (query?.year) {
			const year = Number.parseInt(query.year as string);
			holidays = await db.query.publicHolidays.findMany({
				where: eq(publicHolidays.year, year),
				orderBy: (publicHolidays, { asc }) => [asc(publicHolidays.date)],
			});
		} else if (query?.region) {
			holidays = await db.query.publicHolidays.findMany({
				where: eq(publicHolidays.region, query.region as string),
				orderBy: (publicHolidays, { asc }) => [asc(publicHolidays.date)],
			});
		} else {
			holidays = await db.query.publicHolidays.findMany({
				orderBy: (publicHolidays, { asc }) => [asc(publicHolidays.date)],
			});
		}

		return { holidays };
	})

	// ==================== GET SINGLE HOLIDAY ====================
	.get("/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "public_holidays",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const holiday = await db.query.publicHolidays.findFirst({
			where: eq(publicHolidays.id, params.id),
		});

		if (!holiday) {
			set.status = 404;
			return { error: "Holiday not found" };
		}

		return { holiday };
	})

	// ==================== CREATE HOLIDAY ====================
	.post(
		"/",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "public_holidays",
				action: "create",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// Extract year from date
			const year = Number.parseInt(body.date.split("-")[0]);

			// Check for duplicate (same date + region)
			const existing = await db.query.publicHolidays.findFirst({
				where: and(
					eq(publicHolidays.date, body.date),
					eq(publicHolidays.region, body.region),
				),
			});

			if (existing) {
				set.status = 409;
				return { error: "Holiday already exists for this date and region" };
			}

			// Create holiday
			const newHolidays = await db
				.insert(publicHolidays)
				.values({
					name: body.name,
					date: body.date,
					region: body.region,
					year,
				})
				.returning();

			const newHoliday = newHolidays[0];

			// Audit log
			await logCreate("public_holidays", newHoliday.id, user.id, {
				name: body.name,
				date: body.date,
				region: body.region,
			});

			set.status = 201;
			return { holiday: newHoliday };
		},
		{
			body: t.Object({
				name: t.String(),
				date: t.String(), // Format: YYYY-MM-DD
				region: t.String(),
			}),
		},
	)

	// ==================== UPDATE HOLIDAY ====================
	.patch(
		"/:id",
		async ({ params, body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "public_holidays",
				action: "edit",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// Get existing holiday
			const existingHoliday = await db.query.publicHolidays.findFirst({
				where: eq(publicHolidays.id, params.id),
			});

			if (!existingHoliday) {
				set.status = 404;
				return { error: "Holiday not found" };
			}

			// Build update object
			const updateData: Partial<typeof publicHolidays.$inferInsert> = {};

			if (body.name !== undefined) updateData.name = body.name;
			if (body.date !== undefined) {
				updateData.date = body.date;
				updateData.year = Number.parseInt(body.date.split("-")[0]);
			}
			if (body.region !== undefined) updateData.region = body.region;

			// Check for duplicate if date or region changed
			if (body.date || body.region) {
				const newDate = body.date || existingHoliday.date;
				const newRegion = body.region || existingHoliday.region;

				const duplicate = await db.query.publicHolidays.findFirst({
					where: and(
						eq(publicHolidays.date, newDate),
						eq(publicHolidays.region, newRegion),
					),
				});

				if (duplicate && duplicate.id !== params.id) {
					set.status = 409;
					return { error: "Holiday already exists for this date and region" };
				}
			}

			// Update holiday
			const updatedHolidays = await db
				.update(publicHolidays)
				.set(updateData)
				.where(eq(publicHolidays.id, params.id))
				.returning();

			const updatedHoliday = updatedHolidays[0];

			// Audit log
			await logUpdate(
				"public_holidays",
				params.id,
				user.id,
				{
					name: existingHoliday.name,
					date: existingHoliday.date,
					region: existingHoliday.region,
				},
				{
					name: body.name,
					date: body.date,
					region: body.region,
				},
			);

			return { holiday: updatedHoliday };
		},
		{
			body: t.Partial(
				t.Object({
					name: t.String(),
					date: t.String(),
					region: t.String(),
				}),
			),
		},
	)

	// ==================== DELETE HOLIDAY ====================
	.delete("/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "public_holidays",
			action: "delete",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		// Get existing holiday
		const existingHoliday = await db.query.publicHolidays.findFirst({
			where: eq(publicHolidays.id, params.id),
		});

		if (!existingHoliday) {
			set.status = 404;
			return { error: "Holiday not found" };
		}

		// Delete holiday
		await db.delete(publicHolidays).where(eq(publicHolidays.id, params.id));

		// Audit log
		await logDelete("public_holidays", params.id, user.id, {
			name: existingHoliday.name,
			date: existingHoliday.date,
			region: existingHoliday.region,
		});

		return { success: true };
	})

	// ==================== IMPORT PREDEFINED HOLIDAYS ====================
	.post("/import/:region", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "public_holidays",
			action: "create",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const region = params.region.toUpperCase();
		const predefined = PREDEFINED_HOLIDAYS[region];

		if (!predefined) {
			set.status = 400;
			return { error: `Unknown region: ${params.region}` };
		}

		// Get current year
		const currentYear = new Date().getFullYear();

		// Import holidays for current year
		const importedHolidays = [];
		const skippedHolidays = [];

		for (const holiday of predefined) {
			const date = `${currentYear}-${holiday.date}`;

			// Check if already exists
			const existing = await db.query.publicHolidays.findFirst({
				where: and(
					eq(publicHolidays.date, date),
					eq(publicHolidays.region, region),
				),
			});

			if (existing) {
				skippedHolidays.push(holiday.name);
				continue;
			}

			// Create holiday
			const newHolidays = await db
				.insert(publicHolidays)
				.values({
					name: holiday.name,
					date,
					region,
					year: currentYear,
				})
				.returning();

			importedHolidays.push(newHolidays[0]);

			// Audit log
			await logCreate("public_holidays", newHolidays[0].id, user.id, {
				name: holiday.name,
				date,
				region,
				imported: true,
			});
		}

		return {
			imported: importedHolidays.length,
			skipped: skippedHolidays.length,
			holidays: importedHolidays,
			skippedNames: skippedHolidays,
		};
	});
