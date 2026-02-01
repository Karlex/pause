/**
 * Security Configuration
 * Centralized security settings and policies
 */

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
	// General API rate limit
	general: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100,
	},
	// Stricter limits for authentication endpoints
	auth: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5, // 5 attempts per 15 minutes
	},
	// Leave request submission
	leaveRequests: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 10,
	},
};

// Data retention policies (in days)
export const DATA_RETENTION = {
	// Session data
	sessions: 7, // 7 days
	// Audit logs
	auditLogs: 365, // 1 year
	// Leave requests (keep indefinitely for compliance)
	leaveRequests: null, // Never delete
	// User activity logs
	activityLogs: 90, // 90 days
	// Failed login attempts
	failedLogins: 30, // 30 days
};

// Password policy
export const PASSWORD_POLICY = {
	minLength: 8,
	maxLength: 128,
	requireUppercase: true,
	requireLowercase: true,
	requireNumbers: true,
	requireSpecialChars: true,
	preventCommonPasswords: true,
	maxAge: null, // No password expiration (NIST recommendation)
	preventReuse: 5, // Prevent last 5 passwords
};

// Session configuration
export const SESSION_CONFIG = {
	// Cookie settings
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		maxAge: 60 * 60 * 24 * 7, // 7 days
	},
	// Session duration
	duration: 60 * 60 * 24 * 7, // 7 days
	// Inactivity timeout
	inactivityTimeout: 60 * 60 * 24, // 1 day
};

// CORS configuration
export const CORS_CONFIG = {
	origin: process.env.FRONTEND_URL || "http://localhost:3000",
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	exposedHeaders: ["X-Total-Count", "X-Rate-Limit"],
	maxAge: 86400, // 24 hours
};

// Content Security Policy
export const CSP_CONFIG = {
	"default-src": ["'self'"],
	"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
	"style-src": ["'self'", "'unsafe-inline'"],
	"img-src": ["'self'", "data:", "https:"],
	"font-src": ["'self'"],
	"connect-src": ["'self'", process.env.API_URL || "http://localhost:3001"],
	"media-src": ["'self'"],
	"object-src": ["'none'"],
	"frame-ancestors": ["'none'"],
	"base-uri": ["'self'"],
	"form-action": ["'self'"],
};

// Input validation limits
export const VALIDATION_LIMITS = {
	// Text fields
	noteMaxLength: 1000,
	nameMaxLength: 100,
	emailMaxLength: 255,
	// Arrays
	maxAttachments: 5,
	// File uploads
	maxFileSize: 5 * 1024 * 1024, // 5MB
	allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
};

// Encryption configuration
export const ENCRYPTION_CONFIG = {
	algorithm: "AES-GCM",
	keyLength: 256,
	ivLength: 12, // 96 bits for GCM
	// Fields that should be encrypted
	encryptedFields: [
		"accessToken",
		"refreshToken",
		"calendarAccessToken",
		"calendarRefreshToken",
	],
};

// Audit log events
export const AUDIT_EVENTS = {
	// Authentication
	LOGIN: "login",
	LOGOUT: "logout",
	LOGIN_FAILED: "login_failed",
	PASSWORD_CHANGED: "password_changed",
	// Leave requests
	LEAVE_REQUEST_CREATED: "leave_request_created",
	LEAVE_REQUEST_CANCELLED: "leave_request_cancelled",
	LEAVE_REQUEST_APPROVED: "leave_request_approved",
	LEAVE_REQUEST_DECLINED: "leave_request_declined",
	// User management
	USER_CREATED: "user_created",
	USER_UPDATED: "user_updated",
	USER_DELETED: "user_deleted",
	// Balance adjustments
	BALANCE_ADJUSTED: "balance_adjusted",
};

// Security headers
export const SECURITY_HEADERS = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy":
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
};

// GDPR/Privacy compliance
export const PRIVACY_CONFIG = {
	// Data portability
	allowDataExport: true,
	// Right to erasure
	allowAccountDeletion: true,
	// Data retention notice
	retentionNoticeDays: 30,
	// Privacy policy version
	privacyPolicyVersion: "1.0.0",
	// Cookie consent required
	cookieConsentRequired: true,
};
