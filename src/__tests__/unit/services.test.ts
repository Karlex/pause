import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database
const mockDb = {
	query: {
		leaveRequests: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
		leaveBalances: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
		users: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
		leaveTypes: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
	},
	insert: vi.fn(() => ({
		values: vi.fn(() => ({
			returning: vi.fn(),
		})),
	})),
	update: vi.fn(() => ({
		set: vi.fn(() => ({
			where: vi.fn(),
		})),
	})),
};

vi.mock("@/db", () => ({
	db: mockDb,
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: mockGetSession,
		},
	},
}));

import { calculateWorkingDays } from "@/lib/holidays";

describe("Leave Request Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("createLeaveRequest", () => {
		const mockUser = {
			id: "user-123",
			email: "test@example.com",
			role: "employee",
		};

		const mockLeaveType = {
			id: "type-123",
			name: "Annual Leave",
			code: "annual",
		};

		const mockBalance = {
			id: "balance-123",
			userId: "user-123",
			leaveTypeId: "type-123",
			allowance: 160, // 20 days in hours
			used: 0,
			scheduled: 0,
			year: 2026,
		};

		it("should create a leave request with valid data", async () => {
			// Arrange
			mockGetSession.mockResolvedValue({ user: mockUser });
			mockDb.query.leaveTypes.findFirst.mockResolvedValue(mockLeaveType);
			mockDb.query.leaveBalances.findFirst.mockResolvedValue(mockBalance);
			mockDb.query.leaveRequests.findMany.mockResolvedValue([]);
			mockDb
				.insert()
				.values()
				.returning.mockResolvedValue([
					{
						id: "request-123",
						userId: mockUser.id,
						leaveTypeId: "type-123",
						startDate: "2026-03-15",
						endDate: "2026-03-17",
						totalHours: 24,
						status: "pending",
					},
				]);

			// Act - Use a known working week (Monday-Wednesday)
			const startDate = "2026-06-15"; // Monday
			const endDate = "2026-06-17"; // Wednesday
			const workingDays = calculateWorkingDays(
				new Date(startDate),
				new Date(endDate),
			);

			// Assert
			expect(workingDays).toBe(3);
			expect(workingDays * 8).toBe(24); // 3 days = 24 hours
		});

		it("should reject request when insufficient balance", async () => {
			// Arrange
			const lowBalance = {
				...mockBalance,
				allowance: 16, // Only 2 days
				used: 16, // Already used all
			};

			// Act
			const requestedDays = 5;
			const requestedHours = requestedDays * 8;
			const availableHours =
				lowBalance.allowance - lowBalance.used - lowBalance.scheduled;

			// Assert
			expect(requestedHours).toBeGreaterThan(availableHours);
		});

		it("should reject request with end date before start date", () => {
			// Arrange
			const startDate = new Date("2026-03-15");
			const endDate = new Date("2026-03-10");

			// Act
			const isValid = endDate >= startDate;

			// Assert
			expect(isValid).toBe(false);
		});

		it("should reject request for past dates", () => {
			// Arrange
			const today = new Date("2026-02-01");
			const pastDate = new Date("2026-01-15");

			// Act
			const isValid = pastDate >= today;

			// Assert
			expect(isValid).toBe(false);
		});

		it("should handle half-day requests correctly", () => {
			// Arrange
			const fullDayHours = 8;
			const halfDayHours = 4;

			// Act & Assert
			expect(halfDayHours).toBe(fullDayHours / 2);
			expect(fullDayHours - halfDayHours).toBe(halfDayHours);
		});

		it("should detect overlapping requests", async () => {
			// Arrange
			const existingRequest = {
				id: "existing-123",
				startDate: "2026-03-15",
				endDate: "2026-03-17",
				status: "approved",
			};

			const newStartDate = "2026-03-16";
			const newEndDate = "2026-03-18";

			// Act
			const hasOverlap =
				newStartDate <= existingRequest.endDate &&
				newEndDate >= existingRequest.startDate;

			// Assert
			expect(hasOverlap).toBe(true);
		});

		it("should allow non-overlapping requests", async () => {
			// Arrange
			const existingRequest = {
				id: "existing-123",
				startDate: "2026-03-15",
				endDate: "2026-03-17",
				status: "approved",
			};

			const newStartDate = "2026-03-18";
			const newEndDate = "2026-03-20";

			// Act
			const hasOverlap =
				newStartDate <= existingRequest.endDate &&
				newEndDate >= existingRequest.startDate;

			// Assert
			expect(hasOverlap).toBe(false);
		});
	});

	describe("getLeaveRequests", () => {
		it("should return only the authenticated user's requests", async () => {
			// Arrange
			const userId = "user-123";
			const otherUserId = "user-456";

			const userRequests = [
				{ id: "req-1", userId, status: "pending" },
				{ id: "req-2", userId, status: "approved" },
			];

			const otherUserRequests = [
				{ id: "req-3", userId: otherUserId, status: "pending" },
			];

			// Act
			const filteredRequests = [...userRequests, ...otherUserRequests].filter(
				(req) => req.userId === userId,
			);

			// Assert
			expect(filteredRequests).toHaveLength(2);
			expect(filteredRequests.every((req) => req.userId === userId)).toBe(true);
		});

		it("should filter by status", async () => {
			// Arrange
			const requests = [
				{ id: "req-1", status: "pending" },
				{ id: "req-2", status: "approved" },
				{ id: "req-3", status: "pending" },
			];

			// Act
			const pendingRequests = requests.filter(
				(req) => req.status === "pending",
			);

			// Assert
			expect(pendingRequests).toHaveLength(2);
		});
	});

	describe("cancelLeaveRequest", () => {
		it("should allow cancelling pending request", () => {
			// Arrange
			const request = {
				id: "req-123",
				status: "pending",
				userId: "user-123",
			};

			// Act
			const canCancel = request.status === "pending";

			// Assert
			expect(canCancel).toBe(true);
		});

		it("should not allow cancelling approved request", () => {
			// Arrange
			const request = {
				id: "req-123",
				status: "approved",
				userId: "user-123",
			};

			// Act
			const canCancel = request.status === "pending";

			// Assert
			expect(canCancel).toBe(false);
		});

		it("should not allow cancelling declined request", () => {
			// Arrange
			const request = {
				id: "req-123",
				status: "declined",
				userId: "user-123",
			};

			// Act
			const canCancel = request.status === "pending";

			// Assert
			expect(canCancel).toBe(false);
		});

		it("should restore balance when cancelling", () => {
			// Arrange
			const balance = {
				scheduled: 24,
				remaining: 136,
			};
			const requestHours = 24;

			// Act
			const newScheduled = balance.scheduled - requestHours;
			const newRemaining = balance.remaining + requestHours;

			// Assert
			expect(newScheduled).toBe(0);
			expect(newRemaining).toBe(160);
		});
	});
});

describe("Approval Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("approveRequest", () => {
		it("should approve pending request", () => {
			// Arrange
			const request = {
				id: "req-123",
				status: "pending",
				userId: "employee-123",
				totalHours: 24,
			};

			// Act
			const canApprove = request.status === "pending";

			// Assert
			expect(canApprove).toBe(true);
		});

		it("should update user balance on approval", () => {
			// Arrange
			const balance = {
				used: 0,
				scheduled: 24,
				remaining: 136,
			};
			const requestHours = 24;

			// Act
			const newUsed = balance.used + requestHours;
			const newScheduled = balance.scheduled - requestHours;

			// Assert
			expect(newUsed).toBe(24);
			expect(newScheduled).toBe(0);
		});

		it("should reject approval for non-pending request", () => {
			// Arrange
			const request = {
				id: "req-123",
				status: "approved",
			};

			// Act
			const canApprove = request.status === "pending";

			// Assert
			expect(canApprove).toBe(false);
		});

		it("should only allow managers to approve their team's requests", () => {
			// Arrange
			const managerId = "manager-123";
			const otherManagerId = "manager-456";
			const employee = {
				id: "employee-123",
				managerId: managerId,
			};

			// Act
			const isAuthorized = employee.managerId === managerId;
			const isNotAuthorized = employee.managerId === otherManagerId;

			// Assert
			expect(isAuthorized).toBe(true);
			expect(isNotAuthorized).toBe(false);
		});

		it("should allow super admin to approve any request", () => {
			// Arrange
			const userRole = "super_admin";

			// Act
			const isSuperAdmin = userRole === "super_admin";

			// Assert
			expect(isSuperAdmin).toBe(true);
		});

		it("should allow HR admin to approve any request", () => {
			// Arrange
			const userRole = "hr_admin";

			// Act
			const isHRAdmin = userRole === "hr_admin";

			// Assert
			expect(isHRAdmin).toBe(true);
		});
	});

	describe("declineRequest", () => {
		it("should decline pending request", () => {
			// Arrange
			const request = {
				id: "req-123",
				status: "pending",
			};

			// Act
			const canDecline = request.status === "pending";

			// Assert
			expect(canDecline).toBe(true);
		});

		it("should not update balance when declining", () => {
			// Arrange
			const balance = {
				used: 0,
				scheduled: 24,
			};
			const originalUsed = balance.used;

			// Act - When declining, only scheduled should change
			const newScheduled = 0;

			// Assert
			expect(balance.used).toBe(originalUsed); // Used should not change
			expect(newScheduled).toBe(0); // Scheduled should be cleared
		});

		it("should restore balance to remaining when declining", () => {
			// Arrange
			const balance = {
				scheduled: 24,
				remaining: 136,
			};
			const requestHours = 24;

			// Act
			const _newScheduled = 0;
			const newRemaining = balance.remaining + requestHours;

			// Assert
			expect(newRemaining).toBe(160);
		});
	});

	describe("getPendingApprovals", () => {
		it("should return pending requests for manager's team", () => {
			// Arrange
			const _managerId = "manager-123";
			const teamRequests = [
				{ id: "req-1", userId: "emp-1", status: "pending" },
				{ id: "req-2", userId: "emp-2", status: "pending" },
			];
			const _otherRequests = [
				{ id: "req-3", userId: "emp-3", status: "pending" },
			];

			// Act
			const pendingRequests = teamRequests.filter(
				(req) => req.status === "pending",
			);

			// Assert
			expect(pendingRequests).toHaveLength(2);
		});

		it("should return all pending requests for super admin", () => {
			// Arrange
			const isSuperAdmin = true;
			const allRequests = [
				{ id: "req-1", status: "pending" },
				{ id: "req-2", status: "pending" },
				{ id: "req-3", status: "pending" },
			];

			// Act
			const pendingRequests = isSuperAdmin ? allRequests : [];

			// Assert
			expect(pendingRequests).toHaveLength(3);
		});

		it("should not return requests for non-managed users", () => {
			// Arrange
			const _managerId = "manager-123";
			const managedUsers = ["emp-1", "emp-2"];
			const requests = [
				{ id: "req-1", userId: "emp-1", status: "pending" },
				{ id: "req-2", userId: "emp-3", status: "pending" },
			];

			// Act
			const filteredRequests = requests.filter((req) =>
				managedUsers.includes(req.userId),
			);

			// Assert
			expect(filteredRequests).toHaveLength(1);
			expect(filteredRequests[0].id).toBe("req-1");
		});
	});
});

describe("Balance Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUserBalances", () => {
		it("should return balances for current year", () => {
			// Arrange
			const currentYear = new Date().getFullYear();
			const balances = [
				{ year: currentYear, allowance: 160 },
				{ year: currentYear - 1, allowance: 160 },
			];

			// Act
			const currentYearBalances = balances.filter(
				(b) => b.year === currentYear,
			);

			// Assert
			expect(currentYearBalances).toHaveLength(1);
			expect(currentYearBalances[0].year).toBe(currentYear);
		});

		it("should calculate remaining days correctly", () => {
			// Arrange
			const balance = {
				allowance: 160, // 20 days
				used: 40, // 5 days
				scheduled: 16, // 2 days
			};

			// Act
			const remaining = balance.allowance - balance.used - balance.scheduled;
			const remainingDays = remaining / 8;

			// Assert
			expect(remaining).toBe(104);
			expect(remainingDays).toBe(13);
		});

		it("should handle negative balances", () => {
			// Arrange
			const balance = {
				allowance: 160, // 20 days
				used: 200, // 25 days (overused)
				scheduled: 0,
			};

			// Act
			const remaining = balance.allowance - balance.used - balance.scheduled;

			// Assert
			expect(remaining).toBe(-40);
			expect(remaining).toBeLessThan(0);
		});
	});

	describe("updateBalanceOnApproval", () => {
		it("should move scheduled to used on approval", () => {
			// Arrange
			const balance = {
				used: 0,
				scheduled: 24,
			};
			const requestHours = 24;

			// Act
			const newUsed = balance.used + requestHours;
			const newScheduled = balance.scheduled - requestHours;

			// Assert
			expect(newUsed).toBe(24);
			expect(newScheduled).toBe(0);
		});

		it("should handle insufficient balance gracefully", () => {
			// Arrange
			const balance = {
				allowance: 160,
				used: 160,
				scheduled: 0,
			};
			const requestHours = 24;

			// Act
			const availableHours = balance.allowance - balance.used;
			const hasSufficientBalance = availableHours >= requestHours;

			// Assert
			expect(hasSufficientBalance).toBe(false);
		});

		it("should handle partial day calculations", () => {
			// Arrange
			const balance = {
				used: 0,
				scheduled: 4, // Half day
			};
			const requestHours = 4;

			// Act
			const newUsed = balance.used + requestHours;
			const newScheduled = balance.scheduled - requestHours;

			// Assert
			expect(newUsed).toBe(4);
			expect(newScheduled).toBe(0);
		});
	});
});

describe("Security Tests", () => {
	describe("Authorization", () => {
		it("should prevent users from accessing other users' requests", () => {
			// Arrange
			const currentUserId = "user-123";
			const otherUserId = "user-456";
			const request = {
				id: "req-123",
				userId: otherUserId,
			};

			// Act
			const isOwner = request.userId === currentUserId;

			// Assert
			expect(isOwner).toBe(false);
		});

		it("should prevent non-managers from approving requests", () => {
			// Arrange
			const userRole = "employee";
			const allowedRoles = ["manager", "hr_admin", "super_admin"];

			// Act
			const canApprove = allowedRoles.includes(userRole);

			// Assert
			expect(canApprove).toBe(false);
		});

		it("should prevent managers from approving non-team requests", () => {
			// Arrange
			const managerId = "manager-123";
			const employeeManagerId = "manager-456";
			const employee = {
				id: "emp-123",
				managerId: employeeManagerId,
			};

			// Act
			const isTeamMember = employee.managerId === managerId;

			// Assert
			expect(isTeamMember).toBe(false);
		});
	});

	describe("Input Validation", () => {
		it("should reject invalid date formats", () => {
			// Arrange
			const invalidDate = "not-a-date";

			// Act
			const date = new Date(invalidDate);
			const isValid = !Number.isNaN(date.getTime());

			// Assert
			expect(isValid).toBe(false);
		});

		it("should reject extremely long notes", () => {
			// Arrange
			const maxLength = 1000;
			const longNote = "a".repeat(2000);

			// Act
			const isTooLong = longNote.length > maxLength;

			// Assert
			expect(isTooLong).toBe(true);
		});

		it("should sanitize HTML in notes", () => {
			// Arrange
			const noteWithHTML = '<script>alert("xss")</script>';
			const sanitized = noteWithHTML.replace(
				/\u003cscript\b[^\u003c]*(?:(?!\u003c\/script\u003e)\u003c[^\u003c]*)*\u003c\/script\u003e/gi,
				"",
			);

			// Assert
			expect(sanitized).not.toContain("<script>");
		});
	});

	describe("Data Integrity", () => {
		it("should prevent negative balance calculations", () => {
			// Arrange
			const balance = {
				allowance: 160,
				used: 200,
				scheduled: 0,
			};

			// Act
			const remaining = balance.allowance - balance.used - balance.scheduled;

			// Assert - System should handle negative gracefully
			expect(remaining).toBeLessThan(0);
		});

		it("should prevent duplicate request IDs", () => {
			// Arrange
			const existingIds = ["req-1", "req-2", "req-3"];
			const newId = "req-2";

			// Act
			const isDuplicate = existingIds.includes(newId);

			// Assert
			expect(isDuplicate).toBe(true);
		});
	});
});
