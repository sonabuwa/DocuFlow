/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error responses across the entire API.
 * Handles Mongoose validation errors, JWT errors, CORS errors, and more.
 */

// ==========================================
// 404 NOT FOUND HANDLER
// ==========================================
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
export const errorHandler = (err, req, res, next) => {
  // Determine status code
  let statusCode = err.status || err.statusCode || 500;

  // Default error message
  let message = err.message || "Internal Server Error";

  // --- Mongoose Validation Error ---
  if (err.name === "ValidationError") {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join(". ");
  }

  // --- Mongoose Duplicate Key Error ---
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // --- Mongoose Cast Error (invalid ObjectId) ---
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // --- JWT Errors ---
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  // --- Multer Errors ---
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 50} MB.`;
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected file field in upload.";
  }

  // Log server errors in development
  if (statusCode >= 500 && process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
