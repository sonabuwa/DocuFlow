/**
 * Activity Logger Utility
 *
 * Improvements:
 * - Added metadata support for structured audit data
 * - Added targetFolder support
 * - Never blocks main request flow
 */

import ActivityLog from "../models/activityLogSchema.js";

/**
 * Creates an activity log entry asynchronously.
 * @param {Object} params
 * @param {string}  params.userId       - MongoDB user _id
 * @param {string}  params.action       - enum value from activityLogSchema
 * @param {string}  [params.docId]      - optional document _id
 * @param {string}  [params.folderId]   - optional folder _id
 * @param {string}  [params.details]    - human-readable description
 * @param {Object}  [params.metadata]   - structured extra data (e.g. version info)
 * @param {Object}  [params.req]        - Express request object (for IP/UA)
 */
export const logActivity = async ({
  userId,
  action,
  docId = null,
  folderId = null,
  details = "",
  metadata = null,
  req = null,
}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      targetDocument: docId,
      targetFolder: folderId,
      details,
      metadata,
      ipAddress: req
        ? req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress || ""
        : "",
      userAgent: req ? req.headers["user-agent"] || "" : "",
    });
  } catch (err) {
    // Log errors to console only — never throw from here
    console.error("[ActivityLogger] Failed to write log:", err.message);
  }
};
