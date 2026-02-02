import { db } from "@/db";
import { auditLogs, sensitiveDataAccessLogs } from "@/db/schema";

export interface AuditLogEntry {
	action: string;
	entityType: string;
	entityId: string;
	userId?: string;
	changes?: Record<string, unknown>;
	metadata?: {
		ip?: string;
		userAgent?: string;
		[key: string]: unknown;
	};
}

export interface SensitiveDataAccessEntry {
	userId: string;
	accessedUserId?: string;
	fieldName: string;
	action: "view" | "edit";
	reason?: string;
	metadata?: {
		ip?: string;
		userAgent?: string;
		[key: string]: unknown;
	};
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
	try {
		await db.insert(auditLogs).values({
			action: entry.action,
			entityType: entry.entityType,
			entityId: entry.entityId,
			userId: entry.userId,
			changes: entry.changes,
			metadata: entry.metadata,
		});
	} catch (error) {
		console.error("Failed to write audit log:", error);
		// Don't throw - audit logging should not break the application
	}
}

/**
 * Log access to sensitive data (GDPR compliance)
 */
export async function logSensitiveDataAccess(
	entry: SensitiveDataAccessEntry,
): Promise<void> {
	try {
		await db.insert(sensitiveDataAccessLogs).values({
			userId: entry.userId,
			accessedUserId: entry.accessedUserId,
			fieldName: entry.fieldName,
			action: entry.action,
			reason: entry.reason,
			metadata: entry.metadata,
		});
	} catch (error) {
		console.error("Failed to write sensitive data access log:", error);
		// Don't throw - logging should not break the application
	}
}

/**
 * Create an audit log middleware for API routes
 */
export function createAuditMiddleware(
	action: string,
	entityType: string,
	getEntityId?: (request: Request) => string,
) {
	return async ({ request, userId }: { request: Request; userId?: string }) => {
		const entityId = getEntityId?.(request) ?? "unknown";

		await logAudit({
			action,
			entityType,
			entityId,
			userId,
			metadata: {
				ip: getClientIP(request),
				userAgent: request.headers.get("user-agent") ?? undefined,
			},
		});
	};
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	return "unknown";
}

/**
 * Log entity creation
 */
export async function logCreate(
	entityType: string,
	entityId: string,
	userId: string,
	data: Record<string, unknown>,
): Promise<void> {
	await logAudit({
		action: "create",
		entityType,
		entityId,
		userId,
		changes: { created: data },
	});
}

/**
 * Log entity update
 */
export async function logUpdate(
	entityType: string,
	entityId: string,
	userId: string,
	oldData: Record<string, unknown>,
	newData: Record<string, unknown>,
): Promise<void> {
	const changes: Record<string, { old: unknown; new: unknown }> = {};

	for (const key of Object.keys(newData)) {
		if (oldData[key] !== newData[key]) {
			changes[key] = {
				old: oldData[key],
				new: newData[key],
			};
		}
	}

	await logAudit({
		action: "update",
		entityType,
		entityId,
		userId,
		changes,
	});
}

/**
 * Log entity deletion
 */
export async function logDelete(
	entityType: string,
	entityId: string,
	userId: string,
	data?: Record<string, unknown>,
): Promise<void> {
	await logAudit({
		action: "delete",
		entityType,
		entityId,
		userId,
		changes: { deleted: data },
	});
}
