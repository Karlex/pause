import { describe, expect, it } from "vitest";
import { calculateWorkingDays, isHoliday, isWorkingDay } from "./holidays";

describe("holidays", () => {
	describe("isHoliday", () => {
		it("returns true for Christmas Day 2026", () => {
			const christmas = new Date("2026-12-25");
			expect(isHoliday(christmas)).toBe(true);
		});

		it("returns false for regular working day", () => {
			const regularDay = new Date("2026-06-15");
			expect(isHoliday(regularDay)).toBe(false);
		});
	});

	describe("isWorkingDay", () => {
		it("returns true for Monday", () => {
			const monday = new Date("2026-06-15");
			expect(isWorkingDay(monday)).toBe(true);
		});

		it("returns false for Saturday", () => {
			const saturday = new Date("2026-06-13");
			expect(isWorkingDay(saturday)).toBe(false);
		});

		it("returns false for Sunday", () => {
			const sunday = new Date("2026-06-14");
			expect(isWorkingDay(sunday)).toBe(false);
		});

		it("returns false for Christmas Day", () => {
			const christmas = new Date("2026-12-25");
			expect(isWorkingDay(christmas)).toBe(false);
		});
	});

	describe("calculateWorkingDays", () => {
		it("calculates 5 working days for a full week", () => {
			const start = new Date("2026-06-15");
			const end = new Date("2026-06-19");
			expect(calculateWorkingDays(start, end)).toBe(5);
		});

		it("excludes weekends", () => {
			const start = new Date("2026-06-13");
			const end = new Date("2026-06-19");
			expect(calculateWorkingDays(start, end)).toBe(5);
		});

		it("excludes Christmas Day", () => {
			const start = new Date("2026-12-21");
			const end = new Date("2026-12-25");
			expect(calculateWorkingDays(start, end)).toBe(4);
		});

		it("handles single day", () => {
			const monday = new Date("2026-06-15");
			expect(calculateWorkingDays(monday, monday)).toBe(1);
		});

		it("returns 0 for weekend only range", () => {
			const saturday = new Date("2026-06-13");
			const sunday = new Date("2026-06-14");
			expect(calculateWorkingDays(saturday, sunday)).toBe(0);
		});
	});
});
