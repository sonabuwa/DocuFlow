/**
 * Authentication & Authorization Middleware
 *
 * Improvements:
 * - Cleaner error messages
 * - Proper token expiry handling
 * - Separated protect and authorize cleanly
 */

import jwt from "jsonwebtoken";
import User from "../models/authSchema.js";

const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// PROTECT: Verify JWT Token
// ==========================================
export const protect = async (req, res, next) => {
  let token;

  try {
    // Extract Bearer token from Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Verify and decode token - throws if expired or invalid
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to request (without password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Account no longer exists.",
      });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

// ==========================================
// AUTHORIZE: Role-Based Access Control
// ==========================================
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

// ==========================================
// ADMIN ONLY shorthand
// ==========================================
export const adminOnly = authorize("admin");
