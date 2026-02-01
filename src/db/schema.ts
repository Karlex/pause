import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	real,
	text,
	time,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

// ============ ENUMS ============

export const roleEnum = pgEnum("role", [
	"employee",
	"team_lead",
	"manager",
	"hr_admin",
	"super_admin",
]);

export const requestStatusEnum = pgEnum("request_status", [
	"pending",
	"approved",
	"declined",
	"cancelled",
]);

export const accrualTypeEnum = pgEnum("accrual_type", [
	"upfront",
	"monthly",
	"quarterly",
	"annual",
]);

// ============ TYPES ============

export interface PolicyConfig {
	leaveTypes: {
		[code: string]: {
			enabled: boolean;
			defaultAllowanceHours: number;
			accrual: {
				type: "upfront" | "monthly" | "quarterly" | "annual";
				proRataFirstYear: boolean;
			};
			carryOver: {
				enabled: boolean;
				maxHours: number;
				expiresAfterMonths: number;
			};
			rules: {
				minNoticeHours: number;
				maxConsecutiveHours: number;
				autoApproveUpToHours: number;
				requiresDocumentAfterHours: number;
				requiresApproval: boolean;
			};
		};
	};
}

export interface NotificationPreferences {
	email: "all" | "important" | "none";
}

// ============ TABLES ============

// Users (extends Better Auth user table)
export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	name: text("name").notNull(),
	image: text("image"),

	// Role & hierarchy
	role: roleEnum("role").notNull().default("employee"),
	department: text("department"),
	managerId: text("manager_id"),

	// Location & time
	location: text("location").notNull().default("UK"),
	timezone: text("timezone").notNull().default("Europe/London"),

	// Employment
	startDate: date("start_date"),
	policyId: text("policy_id").references(() => leavePolicies.id),

	// Preferences
	notificationPreferences: jsonb("notification_preferences")
		.$type<NotificationPreferences>()
		.default({ email: "all" }),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth session table
export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth account table (for OAuth providers)
export const accounts = pgTable("accounts", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth verification table
export const verifications = pgTable("verifications", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave Policies
export const leavePolicies = pgTable("leave_policies", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	description: text("description"),

	// Schedule
	workingDays: integer("working_days")
		.array()
		.notNull()
		.default([1, 2, 3, 4, 5]),
	hoursPerDay: real("hours_per_day").notNull().default(8),
	holidayRegion: text("holiday_region").notNull().default("UK"),

	// Full policy configuration as JSON
	config: jsonb("config").$type<PolicyConfig>().notNull(),

	isDefault: boolean("is_default").notNull().default(false),
	isActive: boolean("is_active").notNull().default(true),

	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave Types (system-wide definitions)
export const leaveTypes = pgTable("leave_types", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	code: text("code").notNull().unique(), // 'annual', 'sick', etc.
	name: text("name").notNull(),
	description: text("description"),
	icon: text("icon"), // Emoji or icon name
	colour: text("colour").notNull().default("#8b5cf6"),
	sortOrder: integer("sort_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
	isSystem: boolean("is_system").notNull().default(false), // Can't delete system types
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Leave Requests
export const leaveRequests = pgTable("leave_requests", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	leaveTypeId: text("leave_type_id")
		.notNull()
		.references(() => leaveTypes.id, { onDelete: "restrict" }),

	// Date/time range (hour precision)
	startDate: date("start_date").notNull(),
	startTime: time("start_time").notNull().default("09:00"),
	endDate: date("end_date").notNull(),
	endTime: time("end_time").notNull().default("17:00"),

	// Calculated values
	totalHours: real("total_hours").notNull(),
	workingHours: real("working_hours").notNull(), // Excludes weekends/holidays

	// Status
	status: requestStatusEnum("status").notNull().default("pending"),

	// Details
	note: text("note"),
	attachments: jsonb("attachments").$type<string[]>().default([]),

	// Approval
	reviewerId: text("reviewer_id").references(() => users.id, {
		onDelete: "set null",
	}),
	reviewerNote: text("reviewer_note"),
	reviewedAt: timestamp("reviewed_at"),
	autoApproved: boolean("auto_approved").notNull().default(false),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave Balances
export const leaveBalances = pgTable(
	"leave_balances",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		leaveTypeId: text("leave_type_id")
			.notNull()
			.references(() => leaveTypes.id, { onDelete: "restrict" }),
		year: integer("year").notNull(),

		// All values in hours for precision
		allowance: real("allowance").notNull(), // Total for year
		used: real("used").notNull().default(0), // Already taken
		scheduled: real("scheduled").notNull().default(0), // Approved, future
		carriedOver: real("carried_over").notNull().default(0),
		adjustment: real("adjustment").notNull().default(0), // Manual +/-

		// Computed: remaining = allowance + carriedOver + adjustment - used - scheduled

		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [unique().on(table.userId, table.leaveTypeId, table.year)],
);

// Public Holidays
export const publicHolidays = pgTable(
	"public_holidays",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		date: date("date").notNull(),
		name: text("name").notNull(),
		region: text("region").notNull(),
		year: integer("year").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [unique().on(table.date, table.region)],
);

// Calendar Connections (for sync)
export const calendarConnections = pgTable("calendar_connections", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	provider: text("provider").notNull(), // 'google', 'outlook'
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at"),
	calendarId: text("calendar_id"), // Which calendar to sync to
	syncEnabled: boolean("sync_enabled").notNull().default(true),
	lastSyncAt: timestamp("last_sync_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	type: text("type").notNull(), // 'request_submitted', 'request_approved', etc.
	title: text("title").notNull(),
	body: text("body"),
	data: jsonb("data"), // Related IDs, etc.
	read: boolean("read").notNull().default(false),
	emailSent: boolean("email_sent").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	action: text("action").notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	userId: text("user_id").references(() => users.id),
	changes: jsonb("changes"),
	metadata: jsonb("metadata"), // IP, user agent, etc.
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ one, many }) => ({
	manager: one(users, {
		fields: [users.managerId],
		references: [users.id],
		relationName: "manager",
	}),
	directReports: many(users, { relationName: "manager" }),
	policy: one(leavePolicies, {
		fields: [users.policyId],
		references: [leavePolicies.id],
	}),
	leaveRequests: many(leaveRequests),
	leaveBalances: many(leaveBalances),
	notifications: many(notifications),
	calendarConnections: many(calendarConnections),
	sessions: many(sessions),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const leavePoliciesRelations = relations(leavePolicies, ({ many }) => ({
	users: many(users),
}));

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
	leaveRequests: many(leaveRequests),
	leaveBalances: many(leaveBalances),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
	user: one(users, {
		fields: [leaveRequests.userId],
		references: [users.id],
	}),
	leaveType: one(leaveTypes, {
		fields: [leaveRequests.leaveTypeId],
		references: [leaveTypes.id],
	}),
	reviewer: one(users, {
		fields: [leaveRequests.reviewerId],
		references: [users.id],
	}),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
	user: one(users, {
		fields: [leaveBalances.userId],
		references: [users.id],
	}),
	leaveType: one(leaveTypes, {
		fields: [leaveBalances.leaveTypeId],
		references: [leaveTypes.id],
	}),
}));

export const publicHolidaysRelations = relations(publicHolidays, () => ({}));

export const calendarConnectionsRelations = relations(
	calendarConnections,
	({ one }) => ({
		user: one(users, {
			fields: [calendarConnections.userId],
			references: [users.id],
		}),
	}),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id],
	}),
}));
