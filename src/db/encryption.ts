/**
 * Database encryption at rest utilities
 *
 * This module provides transparent encryption for sensitive database fields.
 * Uses AES-256-GCM encryption with automatic encrypt/decrypt on database operations.
 *
 * Usage:
 * ```typescript
 * // In schema definition
 * encryptedBankDetails: encryptedText('bank_details'),
 * encryptedSalary: encryptedText('salary'),
 * ```
 */

import { decrypt, encrypt } from "@/lib/encryption";

/**
 * Marks a field as requiring encryption at rest
 * This is a type marker - actual encryption happens in the data layer
 */
export type EncryptedField = string & { __encrypted: true };

/**
 * Encrypt a value before storing in database
 */
export async function encryptField(
	value: string | null | undefined,
): Promise<string | null> {
	if (!value) return null;
	return await encrypt(value);
}

/**
 * Decrypt a value after retrieving from database
 */
export async function decryptField(
	encryptedValue: string | null | undefined,
): Promise<string | null> {
	if (!encryptedValue) return null;
	return await decrypt(encryptedValue);
}

/**
 * Encrypt multiple fields in an object
 */
export async function encryptFields<T extends Record<string, unknown>>(
	data: T,
	fieldsToEncrypt: (keyof T)[],
): Promise<T> {
	const result = { ...data };

	for (const field of fieldsToEncrypt) {
		const value = result[field];
		if (typeof value === "string") {
			(result as Record<string, string | null>)[field as string] =
				await encryptField(value);
		}
	}

	return result;
}

/**
 * Decrypt multiple fields in an object
 */
export async function decryptFields<T extends Record<string, unknown>>(
	data: T,
	fieldsToEncrypt: (keyof T)[],
): Promise<T> {
	const result = { ...data };

	for (const field of fieldsToEncrypt) {
		const value = result[field];
		if (typeof value === "string") {
			(result as Record<string, string | null>)[field as string] =
				await decryptField(value);
		}
	}

	return result;
}

/**
 * List of sensitive fields that should be encrypted
 * These fields will be automatically encrypted before INSERT/UPDATE
 * and decrypted after SELECT
 */
export const ENCRYPTED_FIELDS = {
	// Employee sensitive data
	employeeData: [
		"bankAccountNumber",
		"bankSortCode",
		"salary",
		"taxCode",
		"niNumber",
		"idDocumentNumber",
		"emergencyContactPhone",
	] as const,

	// Calendar tokens
	calendarConnections: ["accessToken", "refreshToken"] as const,

	// Account tokens
	accounts: ["accessToken", "refreshToken"] as const,
};

/**
 * Type helper for encrypted fields
 */
export type EncryptedEmployeeDataField =
	(typeof ENCRYPTED_FIELDS.employeeData)[number];
export type EncryptedCalendarField =
	(typeof ENCRYPTED_FIELDS.calendarConnections)[number];
export type EncryptedAccountField = (typeof ENCRYPTED_FIELDS.accounts)[number];
