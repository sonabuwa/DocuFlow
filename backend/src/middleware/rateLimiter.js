/**
 * Rate Limiting Middleware
 * Protects API from brute-force and DoS attacks.
 */

import rateLimit from "express-rate-limit";

// ==========================================
// GENERAL API RATE LIMITER
// Applied globally to all routes
// ==========================================
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15") * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "200"),
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  skip: (req) => req.path === "/api/health", // Don't rate-limit health checks
});

// ==========================================
// AUTH RATE LIMITER
// Stricter limit for login/register to prevent brute force
// ==========================================
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "20"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
});

// ==========================================
// UPLOAD RATE LIMITER
// Limit file upload frequency per user
// ==========================================
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many uploads. Please slow down.",
  },
});
