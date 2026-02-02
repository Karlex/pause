/**
 * Employee Sensitive Data Service
 *
 * Handles encryption/decryption of sensitive employee data fields.
 * All sensitive fields are automatically encrypted before storage and
 * decrypted after retrieval.
 *
 * Usage:
 * ```typescript
 * // Store sensitive data
 * await createEmployeeSensitiveData(userId, {
 *   bankAccountNumber: "12345678",
 *   salary: "50000.00",
 *   // ... other fields
 * });
 *
 * // Retrieve and decrypt
 * const data = await getEmployeeSensitiveData(userId);
 * // data.bankAccountNumber is now decrypted
 * ```
 */

import { eq } from "drizzle-orm";
import { logSensitiveDataAccess } from "@/lib/audit";
import { decryptField, encryptField } from "./encryption";
import { db } from "./index";
import { employeeSensitiveData } from "./schema";

// Fields that should be encrypted
const ENCRYPTED_FIELDS = [
	"phone",
	"personalEmail",
	"address",
	"emergencyContactPhone",
	"salary",
	"bankAccountNumber",
	"bankSortCode",
	"taxCode",
	"niNumber",
	"idDocumentNumber",
] as const;

type EncryptedField = (typeof ENCRYPTED_FIELDS)[number];
type EmployeeSensitiveDataInput = Partial<
	Omit<
		typeof employeeSensitiveData.$inferInsert,
		"id" | "createdAt" | "updatedAt" | "lastAccessedAt" | "lastAccessedBy"
	>
>;

/**
 * Encrypt sensitive fields before storage
 */
async function encryptSensitiveFields(
	data: EmployeeSensitiveDataInput,
): Promise<EmployeeSensitiveDataInput> {
	const encrypted = { ...data };

	for (const field of ENCRYPTED_FIELDS) {
		const value = encrypted[field];
		if (typeof value === "string") {
			(encrypted as Record<EncryptedField, string | null>)[field] =
				await encryptField(value);
		}
	}

	return encrypted;
}

/**
 * Decrypt sensitive fields after retrieval
 */
async function decryptSensitiveFields(
	data: typeof employeeSensitiveData.$inferSelect | null,
): Promise<
	| (Omit<typeof employeeSensitiveData.$inferSelect, EncryptedField> &
			Record<EncryptedField, string | null>)
	| null
> {
	if (!data) return null;

	const decrypted = { ...data } as Record<string, unknown>;

	for (const field of ENCRYPTED_FIELDS) {
		const value = data[field];
		if (typeof value === "string") {
			decrypted[field] = await decryptField(value);
		}
	}

	return decrypted as Omit<
		typeof employeeSensitiveData.$inferSelect,
		EncryptedField
	> &
		Record<EncryptedField, string | null>;
}

/**
 * Create sensitive data record for an employee
 * Automatically encrypts sensitive fields
 */
export async function createEmployeeSensitiveData(
	userId: string,
	data: Omit<EmployeeSensitiveDataInput, "userId">,
) {
	const encrypted = await encryptSensitiveFields(data);

	const [record] = await db
		.insert(employeeSensitiveData)
		.values({
			userId,
			...encrypted,
		})
		.returning();

	return record;
}

/**
 * Get employee sensitive data with automatic decryption
 * Logs access for audit trail
 */
export async function getEmployeeSensitiveData(
	userId: string,
	accessorId: string,
	reason?: string,
) {
	// Log the access attempt
	await logSensitiveDataAccess({
		userId: accessorId,
		accessedUserId: userId,
		fieldName: "employee_sensitive_data",
		action: "view",
		reason,
	});

	// Update last accessed metadata
	await db
		.update(employeeSensitiveData)
		.set({
			lastAccessedAt: new Date(),
			lastAccessedBy: accessorId,
		})
		.where(eq(employeeSensitiveData.userId, userId));

	// Retrieve and decrypt
	const record = await db.query.employeeSensitiveData.findFirst({
		where: eq(employeeSensitiveData.userId, userId),
	});

	const result = await decryptSensitiveFields(record);
	if (!result) return null;
	return result;
}

/**
 * Update employee sensitive data
 * Automatically encrypts sensitive fields
 */
export async function updateEmployeeSensitiveData(
	userId: string,
	accessorId: string,
	data: Partial<EmployeeSensitiveDataInput>,
	reason?: string,
) {
	// Log the update attempt
	await logSensitiveDataAccess({
		userId: accessorId,
		accessedUserId: userId,
		fieldName: "employee_sensitive_data",
		action: "edit",
		reason,
	});

	const encrypted = await encryptSensitiveFields(data);

	const [record] = await db
		.update(employeeSensitiveData)
		.set({
			...encrypted,
			updatedAt: new Date(),
			lastAccessedAt: new Date(),
			lastAccessedBy: accessorId,
		})
		.where(eq(employeeSensitiveData.userId, userId))
		.returning();

	return record;
}

/**
 * Delete employee sensitive data
 */
export async function deleteEmployeeSensitiveData(
	userId: string,
	accessorId: string,
	reason?: string,
) {
	// Log the deletion
	await logSensitiveDataAccess({
		userId: accessorId,
		accessedUserId: userId,
		fieldName: "employee_sensitive_data",
		action: "delete",
		reason,
	});

	await db
		.delete(employeeSensitiveData)
		.where(eq(employeeSensitiveData.userId, userId));
}

/**
 * Check if employee has sensitive data record
 */
export async function hasEmployeeSensitiveData(
	userId: string,
): Promise<boolean> {
	const record = await db.query.employeeSensitiveData.findFirst({
		where: eq(employeeSensitiveData.userId, userId),
		columns: { id: true },
	});

	return !!record;
}
