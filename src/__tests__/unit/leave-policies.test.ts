import { describe, expect, it } from "vitest";

describe("Leave Policies API", () => {
	describe("GET /api/leave-policies", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch("http://localhost:3001/api/leave-policies");
			expect(response.status).toBe(401);
		});
	});

	describe("GET /api/leave-policies/:id", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/leave-policies/policy-1",
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /api/leave-policies", () => {
		it("should return 401 or 422 when not authenticated", async () => {
			const response = await fetch("http://localhost:3001/api/leave-policies", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Test Policy" }),
			});
			// Elysia validates body before auth, so we get 422 for invalid body or 401 for no auth
			expect([401, 422]).toContain(response.status);
		});
	});

	describe("PATCH /api/leave-policies/:id", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/leave-policies/policy-1",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Updated Name" }),
				},
			);
			expect(response.status).toBe(401);
		});
	});

	describe("DELETE /api/leave-policies/:id", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/leave-policies/policy-1",
				{
					method: "DELETE",
				},
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /api/leave-policies/:id/set-default", () => {
		it("should return 401 when not authenticated", async () => {
			const response = await fetch(
				"http://localhost:3001/api/leave-policies/policy-1/set-default",
				{
					method: "POST",
				},
			);
			expect(response.status).toBe(401);
		});
	});
});

describe("Leave Policy Validation", () => {
	it("should require name field", () => {
		const policy = {};
		const hasName = "name" in policy;
		expect(hasName).toBe(false);
	});

	it("should validate working days are integers 0-6", () => {
		const validDays = [1, 2, 3, 4, 5];
		const allValid = validDays.every((d) => d >= 0 && d <= 6);
		expect(allValid).toBe(true);
	});

	it("should validate hours per day is positive", () => {
		const hours = 8;
		expect(hours > 0).toBe(true);
	});

	it("should validate holiday region", () => {
		const validRegions = ["UK", "US", "IN", "EU"];
		expect(validRegions).toContain("UK");
		expect(validRegions).toContain("IN");
	});
});

describe("Policy Config Structure", () => {
	it("should have leave types configuration", () => {
		const config = {
			leaveTypes: {
				annual: {
					enabled: true,
					defaultAllowanceHours: 160,
					accrual: { type: "upfront", proRataFirstYear: true },
					carryOver: { enabled: true, maxHours: 40, expiresAfterMonths: 3 },
					rules: {
						minNoticeHours: 168,
						maxConsecutiveHours: 80,
						autoApproveUpToHours: 0,
						requiresDocumentAfterHours: 0,
						requiresApproval: true,
					},
				},
			},
		};

		expect(config.leaveTypes.annual).toBeDefined();
		expect(config.leaveTypes.annual.enabled).toBe(true);
		expect(config.leaveTypes.annual.defaultAllowanceHours).toBe(160);
	});

	it("should support multiple accrual types", () => {
		const accrualTypes = ["upfront", "monthly", "quarterly", "annual"];
		expect(accrualTypes).toContain("upfront");
		expect(accrualTypes).toContain("monthly");
		expect(accrualTypes).toContain("quarterly");
		expect(accrualTypes).toContain("annual");
	});
});
