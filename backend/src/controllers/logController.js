/**
 * Log Controller
 *
 * Improvements:
 * - Added date range filtering
 * - Added user filter for admin
 * - Better pagination
 */

import ActivityLog from "../models/activityLogSchema.js";

// ==========================================
// GET ALL LOGS (Admin)
// ==========================================
export const getAllLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      action = "",
      userId = "",
      dateFrom = "",
      dateTo = "",
    } = req.query;

    const query = {};

    if (action && action !== "All") query.action = action;
    if (userId) query.user = userId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate("user", "name email role")
        .populate("targetDocument", "originalname mimeType")
        .populate("targetFolder", "name")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET MY LOGS (Current User)
// ==========================================
export const getMyLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find({ user: req.user._id })
        .populate("targetDocument", "originalname mimeType")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
