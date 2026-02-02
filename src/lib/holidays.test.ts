import { describe, expect, it } from "vitest";
import {
	calculateWorkingDays,
	getHolidaysForYear,
	isHoliday,
	isWorkingDay,
} from "./holidays";

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

		it("returns true for New Year's Day", () => {
			const newYear = new Date("2026-01-01");
			expect(isHoliday(newYear)).toBe(true);
		});

		it("returns true for Good Friday", () => {
			const goodFriday = new Date("2026-04-03");
			expect(isHoliday(goodFriday)).toBe(true);
		});

		it("returns true for Easter Monday", () => {
			const easterMonday = new Date("2026-04-06");
			expect(isHoliday(easterMonday)).toBe(true);
		});

		it("returns true for Early May Bank Holiday", () => {
			const mayDay = new Date("2026-05-04");
			expect(isHoliday(mayDay)).toBe(true);
		});

		it("returns true for Spring Bank Holiday", () => {
			const springBank = new Date("2026-05-25");
			expect(isHoliday(springBank)).toBe(true);
		});

		it("returns true for Summer Bank Holiday", () => {
			const summerBank = new Date("2026-08-31");
			expect(isHoliday(summerBank)).toBe(true);
		});

		it("returns true for Boxing Day", () => {
			const boxingDay = new Date("2026-12-26");
			expect(isHoliday(boxingDay)).toBe(true);
		});
	});

	describe("getHolidaysForYear", () => {
		it("returns holidays for 2026", () => {
			const holidays = getHolidaysForYear(2026);
			expect(holidays.length).toBeGreaterThan(0);
		});

		it("returns Christmas in holidays", () => {
			const holidays = getHolidaysForYear(2026);
			const christmas = holidays.find((h) => h.name === "Christmas Day");
			expect(christmas).toBeDefined();
			if (christmas) {
				expect(christmas.date.getMonth()).toBe(11); // December
				expect(christmas.date.getDate()).toBe(25);
			}
		});

		it("returns New Year's Day in holidays", () => {
			const holidays = getHolidaysForYear(2026);
			const newYear = holidays.find((h) => h.name === "New Year's Day");
			expect(newYear).toBeDefined();
			if (newYear) {
				expect(newYear.date.getMonth()).toBe(0); // January
				expect(newYear.date.getDate()).toBe(1);
			}
		});

		it("returns expected number of holidays for UK", () => {
			const holidays = getHolidaysForYear(2026);
			// UK typically has 8 bank holidays
			expect(holidays.length).toBeGreaterThanOrEqual(8);
		});

		it("returns Date objects for each holiday", () => {
			const holidays = getHolidaysForYear(2026);
			for (const holiday of holidays) {
				expect(holiday.date instanceof Date).toBe(true);
				expect(typeof holiday.name).toBe("string");
			}
		});

		it("handles different years", () => {
			const holidays2025 = getHolidaysForYear(2025);
			const holidays2026 = getHolidaysForYear(2026);
			expect(holidays2025.length).toBeGreaterThan(0);
			expect(holidays2026.length).toBeGreaterThan(0);
		});

		it("returns holidays sorted by date", () => {
			const holidays = getHolidaysForYear(2026);
			for (let i = 1; i < holidays.length; i++) {
				expect(holidays[i].date.getTime()).toBeGreaterThanOrEqual(
					holidays[i - 1].date.getTime(),
				);
			}
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
