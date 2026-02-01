import { isWeekend } from "date-fns";
import Holidays from "date-holidays";
import { logger } from "./logger";

const hd = new Holidays("GB", "eng"); // UK, England

/**
 * Check if a date is a UK public holiday
 */
export function isHoliday(date: Date): boolean {
	try {
		return hd.isHoliday(date) !== false;
	} catch (error) {
		logger.error({ error, date }, "Failed to check holiday");
		return false;
	}
}

/**
 * Check if a date is a working day (not weekend, not holiday)
 */
export function isWorkingDay(date: Date): boolean {
	return !isWeekend(date) && !isHoliday(date);
}

/**
 * Get all UK holidays for a specific year
 */
export function getHolidaysForYear(
	year: number,
): Array<{ date: Date; name: string }> {
	try {
		const holidays = hd.getHolidays(year);
		return holidays.map((h) => ({
			date: new Date(h.date),
			name: h.name,
		}));
	} catch (error) {
		logger.error({ error, year }, "Failed to get holidays for year");
		return [];
	}
}

/**
 * Calculate working days between two dates (inclusive)
 * Excludes weekends and UK public holidays
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
	let workingDays = 0;
	const current = new Date(startDate);
	const end = new Date(endDate);

	while (current <= end) {
		if (isWorkingDay(current)) {
			workingDays++;
		}
		current.setDate(current.getDate() + 1);
	}

	return workingDays;
}
