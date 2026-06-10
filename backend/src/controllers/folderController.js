/**
 * Folder Controller
 * Handles folder CRUD, navigation, and breadcrumb generation.
 */

import Folder from "../models/folderSchema.js";
import Document from "../models/documentSchema.js";
import { logActivity } from "../utils/activityLogger.js";

// ==========================================
// CREATE FOLDER
// ==========================================
export const createFolder = async (req, res, next) => {
  try {
    const { name, parentFolder = null, color = "blue" } = req.body;

    // Check for duplicate name in same parent
    const existing = await Folder.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      parentFolder: parentFolder || null,
      createdBy: req.user._id,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A folder with this name already exists here.",
      });
    }

    const folder = await Folder.create({
      name,
      parentFolder: parentFolder || null,
      createdBy: req.user._id,
      color,
    });

    await logActivity({
      userId: req.user._id,
      action: "FOLDER_CREATE",
      folderId: folder._id,
      details: `Created folder: "${name}"`,
      req,
    });

    res.status(201).json({ success: true, message: "Folder created.", data: folder });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET FOLDERS (by parent, for navigation)
// ==========================================
export const getFolders = async (req, res, next) => {
  try {
    const { parentFolder = null } = req.query;

    const query = {
      isDeleted: false,
      parentFolder: parentFolder || null,
    };

    // Employees only see their own folders; admins see all
    if (req.user.role !== "admin") {
      query.createdBy = req.user._id;
    }

    const folders = await Folder.find(query)
      .populate("createdBy", "name")
      .sort("name")
      .lean();

    res.status(200).json({ success: true, data: folders });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET BREADCRUMB PATH
// Traverses parentFolder chain upward to build breadcrumb
// ==========================================
export const getBreadcrumb = async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const breadcrumb = [];

    let currentId = folderId;
    let depth = 0;
    const MAX_DEPTH = 10; // Prevent infinite loops

    while (currentId && depth < MAX_DEPTH) {
      const folder = await Folder.findById(currentId).select("name parentFolder").lean();
      if (!folder) break;
      breadcrumb.unshift({ _id: folder._id, name: folder.name });
      currentId = folder.parentFolder;
      depth++;
    }

    res.status(200).json({ success: true, data: breadcrumb });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RENAME FOLDER
// ==========================================
export const renameFolder = async (req, res, next) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findById(req.params.id);

    if (!folder || folder.isDeleted) {
      return res.status(404).json({ success: false, message: "Folder not found." });
    }

    if (
      req.user.role !== "admin" &&
      folder.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const oldName = folder.name;
    folder.name = name;
    await folder.save();

    await logActivity({
      userId: req.user._id,
      action: "FOLDER_RENAME",
      folderId: folder._id,
      details: `Renamed folder from "${oldName}" to "${name}"`,
      req,
    });

    res.status(200).json({ success: true, message: "Folder renamed.", data: folder });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE FOLDER (soft delete)
// ==========================================
export const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder || folder.isDeleted) {
      return res.status(404).json({ success: false, message: "Folder not found." });
    }

    if (
      req.user.role !== "admin" &&
      folder.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    // Move documents in this folder to root before deleting
    await Document.updateMany({ folder: folder._id }, { $set: { folder: null } });

    folder.isDeleted = true;
    await folder.save();

    await logActivity({
      userId: req.user._id,
      action: "FOLDER_DELETE",
      folderId: folder._id,
      details: `Deleted folder: "${folder.name}"`,
      req,
    });

    res.status(200).json({ success: true, message: "Folder deleted. Documents moved to root." });
  } catch (error) {
    next(error);
  }
};
