/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for encryption with environment-specific keys
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
	throw new Error(
		"ENCRYPTION_KEY environment variable is required for data encryption",
	);
}

// Derive a proper 32-byte key using PBKDF2
// This is much more secure than simple padding
const SALT = "pause-leave-management-salt-v1"; // In production, store this separately
const ITERATIONS = 100000;

const getKey = async (): Promise<CryptoKey> => {
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(ENCRYPTION_KEY);
	const saltData = encoder.encode(SALT);

	// Import the password as a key for PBKDF2
	const baseKey = await crypto.subtle.importKey(
		"raw",
		passwordData,
		{ name: "PBKDF2" },
		false,
		["deriveBits", "deriveKey"],
	);

	// Derive a 256-bit key using PBKDF2
	return await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: saltData,
			iterations: ITERATIONS,
			hash: "SHA-256",
		},
		baseKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
};

/**
 * Encrypt sensitive data
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: iv:ciphertext:authTag (base64)
 */
export async function encrypt(plaintext: string): Promise<string> {
	if (!plaintext) return plaintext;

	const key = await getKey();
	const encoder = new TextEncoder();
	const data = encoder.encode(plaintext);

	// Generate random IV (12 bytes for GCM)
	const iv = crypto.getRandomValues(new Uint8Array(12));

	// Encrypt
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		data,
	);

	// Combine IV and ciphertext
	const result = new Uint8Array(iv.length + encrypted.byteLength);
	result.set(iv);
	result.set(new Uint8Array(encrypted), iv.length);

	// Return as base64
	return btoa(String.fromCharCode(...result));
}

/**
 * Decrypt sensitive data
 * @param ciphertext - The encrypted data (base64 format: iv:ciphertext:authTag)
 * @returns Decrypted plaintext
 */
export async function decrypt(ciphertext: string): Promise<string> {
	if (!ciphertext) return ciphertext;

	try {
		const key = await getKey();

		// Decode base64
		const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

		// Extract IV (first 12 bytes)
		const iv = data.slice(0, 12);
		const encrypted = data.slice(12);

		// Decrypt
		const decrypted = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			encrypted,
		);

		const decoder = new TextDecoder();
		return decoder.decode(decrypted);
	} catch (error) {
		console.error("Decryption failed:", error);
		throw new Error("Failed to decrypt data");
	}
}

/**
 * Sanitize user input to prevent XSS
 * @param input - The user input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(
	input: string | null | undefined,
): string | null | undefined {
	if (!input) return input;

	// Remove potentially dangerous HTML tags and attributes
	return input
		.replace(
			/\u003cscript\b[^\u003c]*(?:(?!\u003c\/script\u003e)\u003c[^\u003c]*)*\u003c\/script\u003e/gi,
			"",
		)
		.replace(
			/\u003ciframe\b[^\u003c]*(?:(?!\u003c\/iframe\u003e)\u003c[^\u003c]*)*\u003c\/iframe\u003e/gi,
			"",
		)
		.replace(
			/\u003cobject\b[^\u003c]*(?:(?!\u003c\/object\u003e)\u003c[^\u003c]*)*\u003c\/object\u003e/gi,
			"",
		)
		.replace(
			/\u003cembed\b[^\u003c]*(?:(?!\u003c\/embed\u003e)\u003c[^\u003c]*)*\u003c\/embed\u003e/gi,
			"",
		)
		.replace(
			/\u003cform\b[^\u003c]*(?:(?!\u003c\/form\u003e)\u003c[^\u003c]*)*\u003c\/form\u003e/gi,
			"",
		)
		.replace(/javascript:/gi, "")
		.replace(/on\w+\s*=/gi, "")
		.trim();
}

/**
 * Hash sensitive data for comparison (one-way)
 * @param data - The data to hash
 * @returns SHA-256 hash
 */
export async function hashData(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(data);
	const hash = await crypto.subtle.digest("SHA-256", encoded);
	return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
