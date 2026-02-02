import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/db";
import { leavePolicies } from "@/db/schema";
import { logCreate, logDelete, logUpdate } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

// Validation schema for policy config
const policyConfigSchema = t.Object({
	leaveTypes: t.Record(
		t.String(),
		t.Object({
			enabled: t.Boolean(),
			defaultAllowanceHours: t.Number(),
			accrual: t.Object({
				type: t.Union([
					t.Literal("upfront"),
					t.Literal("monthly"),
					t.Literal("quarterly"),
					t.Literal("annual"),
				]),
				proRataFirstYear: t.Boolean(),
			}),
			carryOver: t.Object({
				enabled: t.Boolean(),
				maxHours: t.Number(),
				expiresAfterMonths: t.Number(),
			}),
			rules: t.Object({
				minNoticeHours: t.Number(),
				maxConsecutiveHours: t.Number(),
				autoApproveUpToHours: t.Number(),
				requiresDocumentAfterHours: t.Number(),
				requiresApproval: t.Boolean(),
			}),
		}),
	),
});

export const leavePoliciesRoutes = new Elysia({ prefix: "/leave-policies" })
	// Middleware: Check authentication and attach user
	.derive(async ({ request, set }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			set.status = 401;
			return { user: null };
		}
		return { user: session.user };
	})

	// ==================== GET ALL POLICIES ====================
	.get("/", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "leave_policies",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const policies = await db.query.leavePolicies.findMany({
			orderBy: (leavePolicies, { desc }) => [
				desc(leavePolicies.isDefault),
				leavePolicies.name,
			],
		});

		return { policies };
	})

	// ==================== GET SINGLE POLICY ====================
	.get("/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "leave_policies",
			action: "view",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		const policy = await db.query.leavePolicies.findFirst({
			where: eq(leavePolicies.id, params.id),
		});

		if (!policy) {
			set.status = 404;
			return { error: "Policy not found" };
		}

		return { policy };
	})

	// ==================== CREATE POLICY ====================
	.post(
		"/",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "leave_policies",
				action: "create",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// Create policy
			const newPolicies = await db
				.insert(leavePolicies)
				.values({
					name: body.name,
					description: body.description,
					workingDays: body.workingDays,
					hoursPerDay: body.hoursPerDay,
					holidayRegion: body.holidayRegion,
					config: body.config,
					isDefault: body.isDefault ?? false,
					isActive: body.isActive ?? true,
				})
				.returning();

			const newPolicy = newPolicies[0];

			// Audit log
			await logCreate("leave_policies", newPolicy.id, user.id, {
				name: body.name,
				holidayRegion: body.holidayRegion,
			});

			set.status = 201;
			return { policy: newPolicy };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.Optional(t.String()),
				workingDays: t.Array(t.Number()),
				hoursPerDay: t.Number(),
				holidayRegion: t.String(),
				config: policyConfigSchema,
				isDefault: t.Optional(t.Boolean()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)

	// ==================== UPDATE POLICY ====================
	.patch(
		"/:id",
		async ({ params, body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { error: "Unauthorized" };
			}

			const result = await checkPermission({
				userId: user.id,
				resource: "leave_policies",
				action: "edit",
			});

			if (!result.allowed) {
				set.status = 403;
				return { error: "Forbidden" };
			}

			// Get existing policy
			const existingPolicy = await db.query.leavePolicies.findFirst({
				where: eq(leavePolicies.id, params.id),
			});

			if (!existingPolicy) {
				set.status = 404;
				return { error: "Policy not found" };
			}

			// Build update object with only provided fields
			const updateData: Partial<typeof leavePolicies.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (body.name !== undefined) updateData.name = body.name;
			if (body.description !== undefined)
				updateData.description = body.description;
			if (body.workingDays !== undefined)
				updateData.workingDays = body.workingDays;
			if (body.hoursPerDay !== undefined)
				updateData.hoursPerDay = body.hoursPerDay;
			if (body.holidayRegion !== undefined)
				updateData.holidayRegion = body.holidayRegion;
			if (body.config !== undefined) updateData.config = body.config;
			if (body.isActive !== undefined) updateData.isActive = body.isActive;

			// Update policy
			const updatedPolicies = await db
				.update(leavePolicies)
				.set(updateData)
				.where(eq(leavePolicies.id, params.id))
				.returning();

			const updatedPolicy = updatedPolicies[0];

			// Audit log
			await logUpdate(
				"leave_policies",
				params.id,
				user.id,
				{
					name: existingPolicy.name,
					description: existingPolicy.description,
				},
				{
					name: body.name,
					description: body.description,
				},
			);

			return { policy: updatedPolicy };
		},
		{
			body: t.Partial(
				t.Object({
					name: t.String(),
					description: t.String(),
					workingDays: t.Array(t.Number()),
					hoursPerDay: t.Number(),
					holidayRegion: t.String(),
					config: policyConfigSchema,
					isActive: t.Boolean(),
				}),
			),
		},
	)

	// ==================== DELETE POLICY ====================
	.delete("/:id", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "leave_policies",
			action: "delete",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		// Get existing policy
		const existingPolicy = await db.query.leavePolicies.findFirst({
			where: eq(leavePolicies.id, params.id),
		});

		if (!existingPolicy) {
			set.status = 404;
			return { error: "Policy not found" };
		}

		// Cannot delete default policy
		if (existingPolicy.isDefault) {
			set.status = 400;
			return { error: "Cannot delete the default policy" };
		}

		// Delete policy
		await db.delete(leavePolicies).where(eq(leavePolicies.id, params.id));

		// Audit log
		await logDelete("leave_policies", params.id, user.id, {
			name: existingPolicy.name,
		});

		return { success: true };
	})

	// ==================== SET DEFAULT POLICY ====================
	.post("/:id/set-default", async ({ params, user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		const result = await checkPermission({
			userId: user.id,
			resource: "leave_policies",
			action: "edit",
		});

		if (!result.allowed) {
			set.status = 403;
			return { error: "Forbidden" };
		}

		// Get existing policy
		const existingPolicy = await db.query.leavePolicies.findFirst({
			where: eq(leavePolicies.id, params.id),
		});

		if (!existingPolicy) {
			set.status = 404;
			return { error: "Policy not found" };
		}

		// Unset current default
		await db
			.update(leavePolicies)
			.set({ isDefault: false })
			.where(eq(leavePolicies.isDefault, true));

		// Set new default
		const updatedPolicies = await db
			.update(leavePolicies)
			.set({ isDefault: true, updatedAt: new Date() })
			.where(eq(leavePolicies.id, params.id))
			.returning();

		const updatedPolicy = updatedPolicies[0];

		// Audit log
		await logUpdate(
			"leave_policies",
			params.id,
			user.id,
			{ isDefault: false },
			{ isDefault: true },
		);

		return { policy: updatedPolicy };
	});
