import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { api } from "./src/api";

const port = process.env.PORT ?? 3001;

// Security headers middleware
const securityHeaders = new Elysia()
	.onAfterHandle(({ set }) => {
		// Prevent XSS attacks
		set.headers["X-Content-Type-Options"] = "nosniff";
		set.headers["X-Frame-Options"] = "DENY";
		set.headers["X-XSS-Protection"] = "1; mode=block";
		// Strict Transport Security (HTTPS only)
		if (process.env.NODE_ENV === "production") {
			set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
		}
		// Content Security Policy
		set.headers["Content-Security-Policy"] = 
			"default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self'; " +
			"connect-src 'self' http://localhost:3001; " +
			"frame-ancestors 'none';";
		// Referrer Policy
		set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
		// Permissions Policy
		set.headers["Permissions-Policy"] = 
			"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()";
	});

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

const rateLimiter = new Elysia()
	.onBeforeHandle(({ request, set }) => {
		const ip = request.headers.get("x-forwarded-for") || 
					request.headers.get("x-real-ip") || 
					"unknown";
		const now = Date.now();
		const windowStart = Math.floor(now / RATE_WINDOW) * RATE_WINDOW;
		const key = `${ip}:${windowStart}`;
		
		const current = rateLimitStore.get(key);
		if (!current || current.resetTime < now) {
			rateLimitStore.set(key, { count: 1, resetTime: windowStart + RATE_WINDOW });
		} else {
			current.count++;
			if (current.count > RATE_LIMIT) {
				set.status = 429;
				return { error: "Too many requests, please try again later" };
			}
		}
		
		// Clean up old entries periodically
		if (Math.random() < 0.01) { // 1% chance per request
			const cutoff = now - RATE_WINDOW * 2;
			for (const [k, v] of rateLimitStore.entries()) {
				if (v.resetTime < cutoff) {
					rateLimitStore.delete(k);
				}
			}
		}
	});

const server = new Elysia()
	.use(securityHeaders)
	.use(rateLimiter)
	.use(
		cors({
			origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
			credentials: true,
		}),
	)
	.use(api)
	.listen(port);

console.log(`Elysia server running on http://localhost:${port}`);

export type App = typeof server;
