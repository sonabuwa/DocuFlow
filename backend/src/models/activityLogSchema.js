/**
 * Activity Log Schema
 *
 * Improvements:
 * - Added VERSION_RESTORE and FOLDER actions
 * - Added FAILED_LOGIN for security audit
 * - Added PERMISSION_CHANGE for RBAC tracking
 * - Added ARCHIVE / RESTORE actions
 * - Optimized indexes
 */

import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth
        "LOGIN",
        "LOGOUT",
        "REGISTER",
        "FAILED_LOGIN",       // Security: failed login attempt
        // Documents
        "UPLOAD",
        "DOWNLOAD",
        "DELETE",
        "UPDATE",
        "VIEW",
        "SHARE",
        "ARCHIVE",
        "RESTORE",
        "VERSION_RESTORE",    // Restored to a previous version
        // Folders
        "FOLDER_CREATE",
        "FOLDER_DELETE",
        "FOLDER_RENAME",
        "DOCUMENT_MOVED",
        // Admin
        "USER_CREATE",
        "USER_DELETE",
        "PERMISSION_CHANGE",
      ],
    },
    targetDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    targetFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    details: { type: String, default: "" },     // Human-readable description
    metadata: { type: mongoose.Schema.Types.Mixed, default: null }, // Extra structured data
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  {
    timestamps: true,
    // Automatically expire logs after 1 year (TTL index) - for data retention
    // Uncomment in production: expireAfterSeconds: 365 * 24 * 60 * 60
  }
);

// ==========================================
// INDEXES for efficient querying
// ==========================================
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ targetDocument: 1 });

export default mongoose.model("ActivityLog", activityLogSchema);
