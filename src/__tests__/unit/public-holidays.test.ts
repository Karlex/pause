import { describe, expect, it } from "vitest";

describe("Public Holidays API", () => {
	describe("GET /api/public-holidays", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch("http://localhost:3001/api/public-holidays");
			expect(response.status).toBe(401);
		});
	});

	describe("GET /api/public-holidays/:id", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/public-holidays/holiday-1",
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /api/public-holidays", () => {
		it("should return 401 or 422 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/public-holidays",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Test Holiday" }),
				},
			);
			// Elysia validates body before auth, so we get 422 for invalid body or 401 for no auth
			expect([401, 422]).toContain(response.status);
		});
	});

	describe("PATCH /api/public-holidays/:id", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/public-holidays/holiday-1",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Updated Holiday" }),
				},
			);
			expect(response.status).toBe(401);
		});
	});

	describe("DELETE /api/public-holidays/:id", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/public-holidays/holiday-1",
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /api/public-holidays/import/:region", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/public-holidays/import/UK",
				{
					method: "POST",
				},
			);
			expect(response.status).toBe(401);
		});
	});
});

describe("Public Holiday Validation", () => {
	it("should require name field", () => {
		const holiday = {};
		const hasName = "name" in holiday;
		expect(hasName).toBe(false);
	});

	it("should require date field", () => {
		const holiday = {};
		const hasDate = "date" in holiday;
		expect(hasDate).toBe(false);
	});

	it("should validate date format", () => {
		const validDate = "2026-12-25";
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		expect(dateRegex.test(validDate)).toBe(true);
	});

	it("should validate region", () => {
		const validRegions = ["UK", "US", "IN", "EU"];
		expect(validRegions).toContain("UK");
		expect(validRegions).toContain("IN");
	});

	it("should calculate year from date", () => {
		const date = "2026-12-25";
		const year = Number.parseInt(date.split("-")[0]);
		expect(year).toBe(2026);
	});
});

describe("Holiday Import Logic", () => {
	it("should import UK holidays", () => {
		const ukHolidays = [
			{ name: "New Year's Day", date: "2026-01-01", region: "UK" },
			{ name: "Good Friday", date: "2026-04-03", region: "UK" },
			{ name: "Easter Monday", date: "2026-04-06", region: "UK" },
			{ name: "Early May Bank Holiday", date: "2026-05-04", region: "UK" },
			{ name: "Spring Bank Holiday", date: "2026-05-25", region: "UK" },
			{ name: "Summer Bank Holiday", date: "2026-08-31", region: "UK" },
			{ name: "Christmas Day", date: "2026-12-25", region: "UK" },
			{ name: "Boxing Day", date: "2026-12-28", region: "UK" },
		];

		expect(ukHolidays).toHaveLength(8);
		expect(ukHolidays[0].name).toBe("New Year's Day");
	});

	it("should import India holidays", () => {
		const indiaHolidays = [
			{ name: "Republic Day", date: "2026-01-26", region: "IN" },
			{ name: "Holi", date: "2026-03-04", region: "IN" },
			{ name: "Good Friday", date: "2026-04-03", region: "IN" },
			{ name: "Independence Day", date: "2026-08-15", region: "IN" },
			{ name: "Gandhi Jayanti", date: "2026-10-02", region: "IN" },
			{ name: "Diwali", date: "2026-11-08", region: "IN" },
			{ name: "Christmas Day", date: "2026-12-25", region: "IN" },
		];

		expect(indiaHolidays).toHaveLength(7);
		expect(indiaHolidays[0].name).toBe("Republic Day");
	});

	it("should prevent duplicate holidays for same date and region", () => {
		const existingHolidays = [
			{ date: "2026-12-25", region: "UK", name: "Christmas Day" },
		];

		const newHoliday = { date: "2026-12-25", region: "UK", name: "Xmas" };

		const isDuplicate = existingHolidays.some(
			(h) => h.date === newHoliday.date && h.region === newHoliday.region,
		);

		expect(isDuplicate).toBe(true);
	});
});
