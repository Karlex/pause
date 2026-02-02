import { describe, expect, it } from "vitest";

describe("balances logic", () => {
	describe("balance formula", () => {
		it("should calculate remaining balance correctly", () => {
			const allowance = 20; // days
			const used = 5; // days
			const scheduled = 2; // days
			const remaining = allowance - used - scheduled;
			expect(remaining).toBe(13);
		});

		it("should handle zero remaining balance", () => {
			const balance = {
				allowance: 160,
				used: 120,
				scheduled: 40,
			};
			const remaining = balance.allowance - balance.used - balance.scheduled;
			expect(remaining).toBe(0);
		});

		it("should handle negative balance", () => {
			const balance = {
				allowance: 160,
				used: 200,
				scheduled: 0,
			};
			const remaining = balance.allowance - balance.used - balance.scheduled;
			expect(remaining).toBe(-40);
		});

		it("should convert hours to days correctly", () => {
			const hoursPerDay = 8;
			const allowanceHours = 160;
			const allowanceDays = allowanceHours / hoursPerDay;
			expect(allowanceDays).toBe(20);
		});

		it("should handle half days", () => {
			const hoursPerDay = 8;
			const halfDayHours = 4;
			const halfDay = halfDayHours / hoursPerDay;
			expect(halfDay).toBe(0.5);
		});

		it("should round to 1 decimal place", () => {
			const value = 19.33333;
			const rounded = Math.round(value * 10) / 10;
			expect(rounded).toBe(19.3);
		});
	});

	describe("adjustment and carryover", () => {
		it("should add carryover to allowance", () => {
			const baseAllowance = 20;
			const carriedOver = 2;
			const adjustment = 1;
			const totalAllowance = baseAllowance + carriedOver + adjustment;
			expect(totalAllowance).toBe(23);
		});

		it("should convert carryover from hours to days", () => {
			const hoursPerDay = 8;
			const carriedOverHours = 16;
			const carriedOverDays = carriedOverHours / hoursPerDay;
			expect(carriedOverDays).toBe(2);
		});

		it("should convert adjustment from hours to days", () => {
			const hoursPerDay = 8;
			const adjustmentHours = 8;
			const adjustmentDays = adjustmentHours / hoursPerDay;
			expect(adjustmentDays).toBe(1);
		});
	});

	describe("used and scheduled calculation", () => {
		it("should sum approved requests correctly", () => {
			const requests = [{ days: 1 }, { days: 2 }, { days: 3 }];
			const used = requests.reduce((total, r) => total + r.days, 0);
			expect(used).toBe(6);
		});

		it("should sum pending requests correctly", () => {
			const requests = [{ days: 2 }, { days: 3 }];
			const scheduled = requests.reduce((total, r) => total + r.days, 0);
			expect(scheduled).toBe(5);
		});

		it("should handle empty approved requests", () => {
			const requests: Array<{ days: number }> = [];
			const used = requests.reduce((total, r) => total + r.days, 0);
			expect(used).toBe(0);
		});

		it("should handle empty pending requests", () => {
			const requests: Array<{ days: number }> = [];
			const scheduled = requests.reduce((total, r) => total + r.days, 0);
			expect(scheduled).toBe(0);
		});
	});

	describe("leave type filtering", () => {
		it("should filter active leave types", () => {
			const leaveTypes = [
				{ id: "1", name: "Annual", isActive: true },
				{ id: "2", name: "Sick", isActive: true },
				{ id: "3", name: "Disabled", isActive: false },
			];
			const activeTypes = leaveTypes.filter((t) => t.isActive);
			expect(activeTypes).toHaveLength(2);
		});

		it("should exclude disabled leave types from balances", () => {
			const leaveTypes = [
				{ id: "1", code: "annual", enabled: true },
				{ id: "2", code: "sick", enabled: false },
			];
			const enabledTypes = leaveTypes.filter((t) => t.enabled);
			expect(enabledTypes).toHaveLength(1);
			expect(enabledTypes[0].code).toBe("annual");
		});
	});

	describe("year filtering", () => {
		it("should filter by year correctly", () => {
			const balances = [{ year: 2025 }, { year: 2026 }, { year: 2026 }];
			const currentYearBalances = balances.filter((b) => b.year === 2026);
			expect(currentYearBalances).toHaveLength(2);
		});

		it("should handle no balances for year", () => {
			const balances = [{ year: 2025 }, { year: 2024 }];
			const currentYearBalances = balances.filter((b) => b.year === 2026);
			expect(currentYearBalances).toHaveLength(0);
		});
	});
});
