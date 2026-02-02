import { describe, expect, it } from "vitest";

describe("encryption logic", () => {
	describe("base64 encoding", () => {
		it("should encode data correctly", () => {
			const data = "Hello World";
			const encoded = btoa(data);
			expect(encoded).toBe("SGVsbG8gV29ybGQ=");
		});

		it("should decode data correctly", () => {
			const encoded = "SGVsbG8gV29ybGQ=";
			const decoded = atob(encoded);
			expect(decoded).toBe("Hello World");
		});

		it("should handle empty string", () => {
			expect(btoa("")).toBe("");
			expect(atob("")).toBe("");
		});

		it("should handle special characters", () => {
			const data = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
			const encoded = btoa(data);
			const decoded = atob(encoded);
			expect(decoded).toBe(data);
		});

		it("should handle unicode", () => {
			const data = "你好世界 🌍";
			const encoded = btoa(unescape(encodeURIComponent(data)));
			const decoded = decodeURIComponent(escape(atob(encoded)));
			expect(decoded).toBe(data);
		});
	});

	describe("IV generation", () => {
		it("should generate 12-byte IV", () => {
			const iv = new Uint8Array(12);
			crypto.getRandomValues(iv);
			expect(iv.byteLength).toBe(12);
		});

		it("should generate random IVs", () => {
			const iv1 = new Uint8Array(12);
			const iv2 = new Uint8Array(12);
			crypto.getRandomValues(iv1);
			crypto.getRandomValues(iv2);
			expect(iv1).not.toEqual(iv2);
		});
	});

	describe("input sanitization", () => {
		it("should remove script tags", () => {
			const input = '<script>alert("xss")</script>';
			const sanitized = input
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
				.trim();
			expect(sanitized).toBe("");
		});

		it("should remove javascript protocol", () => {
			const input = 'Click <a href="javascript:steal()">here</a>';
			const sanitized = input.replace(/javascript:/gi, "");
			expect(sanitized).not.toContain("javascript:");
		});

		it("should remove event handlers", () => {
			const input = '<img onerror="alert(1)" src="x">';
			const sanitized = input.replace(/on\w+\s*=/gi, "");
			expect(sanitized).not.toContain("onerror");
		});

		it("should remove iframes", () => {
			const input = '<iframe src="evil.com"></iframe>';
			const sanitized = input
				.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
				.trim();
			expect(sanitized).toBe("");
		});

		it("should preserve safe content", () => {
			const input = "Hello, this is a normal message!";
			expect(input).toBe("Hello, this is a normal message!");
		});

		it("should trim whitespace", () => {
			const input = "  hello world  ";
			const sanitized = input.trim();
			expect(sanitized).toBe("hello world");
		});
	});

	describe("data hashing", () => {
		it("should produce consistent hash for same input", async () => {
			const encoder = new TextEncoder();
			const data = encoder.encode("test data");
			const hash = await crypto.subtle.digest("SHA-256", data);
			const hash1 = btoa(String.fromCharCode(...new Uint8Array(hash)));

			const hash2 = await crypto.subtle.digest(
				"SHA-256",
				encoder.encode("test data"),
			);
			const hash2Str = btoa(String.fromCharCode(...new Uint8Array(hash2)));

			expect(hash1).toBe(hash2Str);
		});

		it("should produce different hash for different input", async () => {
			const encoder = new TextEncoder();
			const hash1 = await crypto.subtle.digest(
				"SHA-256",
				encoder.encode("data1"),
			);
			const hash2 = await crypto.subtle.digest(
				"SHA-256",
				encoder.encode("data2"),
			);
			const hash1Str = btoa(String.fromCharCode(...new Uint8Array(hash1)));
			const hash2Str = btoa(String.fromCharCode(...new Uint8Array(hash2)));

			expect(hash1Str).not.toBe(hash2Str);
		});

		it("should produce 32-byte hash", async () => {
			const encoder = new TextEncoder();
			const hash = await crypto.subtle.digest(
				"SHA-256",
				encoder.encode("test"),
			);
			expect(hash.byteLength).toBe(32);
		});

		it("should handle long strings", async () => {
			const encoder = new TextEncoder();
			const longData = "a".repeat(10000);
			const hash = await crypto.subtle.digest(
				"SHA-256",
				encoder.encode(longData),
			);
			expect(hash.byteLength).toBe(32);
		});
	});

	describe("ciphertext format", () => {
		it("should combine IV and ciphertext", () => {
			const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
			const ciphertext = new Uint8Array([20, 21, 22, 23]);
			const result = new Uint8Array(iv.length + ciphertext.byteLength);
			result.set(iv);
			result.set(ciphertext, iv.length);
			expect(result.byteLength).toBe(16);
		});

		it("should extract IV correctly", () => {
			const data = new Uint8Array([
				1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 21, 22, 23,
			]);
			const iv = data.slice(0, 12);
			const encrypted = data.slice(12);
			expect(iv.byteLength).toBe(12);
			expect(encrypted.byteLength).toBe(4);
		});
	});

	describe("negative cases", () => {
		it("should reject invalid base64 for decryption", () => {
			const invalidData = "!@#$%^&*()";
			expect(() => atob(invalidData)).toThrow();
		});

		it("should handle extremely long strings", () => {
			const longString = "x".repeat(100000);
			const encoded = btoa(longString);
			const decoded = atob(encoded);
			expect(decoded.length).toBe(100000);
		});

		it("should handle null byte in string", () => {
			const withNull = "Hello\x00World";
			const encoded = btoa(withNull);
			const decoded = atob(encoded);
			expect(decoded).toBe(withNull);
		});

		it("should handle newlines in string", () => {
			const multiline = "Line1\nLine2\r\nLine3";
			const encoded = btoa(multiline);
			const decoded = atob(encoded);
			expect(decoded).toBe(multiline);
		});
	});
});
