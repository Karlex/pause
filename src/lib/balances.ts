import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leaveBalances, leaveRequests, leaveTypes, users } from "@/db/schema";
import { calculateWorkingDays } from "./holidays";
import { logger } from "./logger";

export interface BalanceCalculation {
	leaveTypeId: string;
	leaveTypeName: string;
	leaveTypeCode: string;
	allowance: number; // in days
	used: number; // in days
	scheduled: number; // in days (pending approval)
	remaining: number; // in days
}

/**
 * Calculate leave balance for a user
 * Real-time calculation based on policy allowance minus approved/pending requests
 */
export async function calculateBalance(
	userId: string,
	leaveTypeId: string,
	year: number,
): Promise<BalanceCalculation | null> {
	try {
		const leaveType = await db.query.leaveTypes.findFirst({
			where: eq(leaveTypes.id, leaveTypeId),
		});

		if (!leaveType) {
			logger.warn({ userId, leaveTypeId }, "Leave type not found");
			return null;
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			with: {
				policy: true,
			},
		});

		if (!user?.policy) {
			logger.warn({ userId }, "User has no policy assigned");
			return null;
		}

		const policyConfig = user.policy.config;
		const leaveTypeConfig = policyConfig.leaveTypes[leaveType.code];

		if (!leaveTypeConfig?.enabled) {
			return {
				leaveTypeId,
				leaveTypeName: leaveType.name,
				leaveTypeCode: leaveType.code,
				allowance: 0,
				used: 0,
				scheduled: 0,
				remaining: 0,
			};
		}

		// Policies store allowances in hours but we display in days for consistency
		const hoursPerDay = user.policy.hoursPerDay ?? 8;
		const baseAllowance = leaveTypeConfig.defaultAllowanceHours / hoursPerDay;

		const balanceRecord = await db.query.leaveBalances.findFirst({
			where: and(
				eq(leaveBalances.userId, userId),
				eq(leaveBalances.leaveTypeId, leaveTypeId),
				eq(leaveBalances.year, year),
			),
		});

		const adjustment = balanceRecord?.adjustment
			? balanceRecord.adjustment / hoursPerDay
			: 0;
		const carriedOver = balanceRecord?.carriedOver
			? balanceRecord.carriedOver / hoursPerDay
			: 0;

		const totalAllowance = baseAllowance + carriedOver + adjustment;

		const approvedRequests = await db.query.leaveRequests.findMany({
			where: and(
				eq(leaveRequests.userId, userId),
				eq(leaveRequests.leaveTypeId, leaveTypeId),
				eq(leaveRequests.status, "approved"),
				sql`${leaveRequests.startDate} >= ${`${year}-01-01`}`,
				sql`${leaveRequests.endDate} <= ${`${year}-12-31`}`,
			),
		});

		const used = approvedRequests.reduce((total, request) => {
			return (
				total +
				calculateWorkingDays(
					new Date(request.startDate),
					new Date(request.endDate),
				)
			);
		}, 0);

		const pendingRequests = await db.query.leaveRequests.findMany({
			where: and(
				eq(leaveRequests.userId, userId),
				eq(leaveRequests.leaveTypeId, leaveTypeId),
				eq(leaveRequests.status, "pending"),
				sql`${leaveRequests.startDate} >= ${`${year}-01-01`}`,
				sql`${leaveRequests.endDate} <= ${`${year}-12-31`}`,
			),
		});

		const scheduled = pendingRequests.reduce((total, request) => {
			return (
				total +
				calculateWorkingDays(
					new Date(request.startDate),
					new Date(request.endDate),
				)
			);
		}, 0);

		const remaining = totalAllowance - used - scheduled;

		return {
			leaveTypeId,
			leaveTypeName: leaveType.name,
			leaveTypeCode: leaveType.code,
			allowance: Math.round(totalAllowance * 10) / 10, // Round to 1 decimal
			used: Math.round(used * 10) / 10,
			scheduled: Math.round(scheduled * 10) / 10,
			remaining: Math.round(remaining * 10) / 10,
		};
	} catch (error) {
		logger.error(
			{ error, userId, leaveTypeId, year },
			"Failed to calculate balance",
		);
		throw error;
	}
}

/**
 * Get all leave balances for a user for a specific year
 */
export async function getUserBalances(
	userId: string,
	year: number,
): Promise<BalanceCalculation[]> {
	try {
		// Get all active leave types
		const allLeaveTypes = await db.query.leaveTypes.findMany({
			where: eq(leaveTypes.isActive, true),
			orderBy: leaveTypes.sortOrder,
		});

		const balances = await Promise.all(
			allLeaveTypes.map((lt) => calculateBalance(userId, lt.id, year)),
		);

		return balances.filter((b): b is BalanceCalculation => b !== null);
	} catch (error) {
		logger.error({ error, userId, year }, "Failed to get user balances");
		throw error;
	}
}
