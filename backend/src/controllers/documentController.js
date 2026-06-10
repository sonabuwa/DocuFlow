import path   from "path";
import fs     from "fs";
import Document from "../models/documentSchema.js";
import User     from "../models/authSchema.js";
import { logActivity } from "../utils/activityLogger.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024)    return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
};

// ── Upload Document ───────────────────────────────────────────────────────────
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file provided." });

    const { description = "", tags = "", category = "General", folder = null } = req.body;
    const fileUrl    = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const parsedTags = tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

    const doc = await Document.create({
      filename:        req.file.filename,
      originalname:    req.file.originalname,
      fileSize:        req.file.size,
      mimeType:        req.file.mimetype,
      description,
      tags:            parsedTags,
      category,
      cloudUrl:        fileUrl,
      cloudPublicId:   req.file.filename,
      storageProvider: "local",
      uploadedBy:      req.user._id,
      folder:          folder || null,
      version:         1,
      versions: [{
        version:       1,
        filename:      req.file.filename,
        originalname:  req.file.originalname,
        fileSize:      req.file.size,
        mimeType:      req.file.mimetype,
        cloudUrl:      fileUrl,
        cloudPublicId: req.file.filename,
        storageProvider: "local",
        changelog:     "Initial upload",
        uploadedBy:    req.user._id,
      }]
    });

    await logActivity({
      userId:   req.user._id,
      action:   "UPLOAD",
      docId:    doc._id,
      details:  `Uploaded "${req.file.originalname}" (${formatBytes(req.file.size)})`,
      metadata: { category, folder, tags: parsedTags },
      req,
    });

    res.status(201).json({ success: true, message: "File uploaded successfully.", data: doc });
  } catch (error) { next(error); }
};

// ── Get All Documents ─────────────────────────────────────────────────────────
export const getAllDocuments = async (req, res, next) => {
  try {
    const {
      search = "", category = "", sort = "-createdAt",
      page = 1, limit = 10, folder = "", fileType = "",
      uploader = "", dateFrom = "", dateTo = "",
      tags: tagFilter = "", view = "", onlyShared = "",
    } = req.query;

    const query = { isDeleted: false };

    if (req.user.role !== "admin") {
      if (view === "mine")        query.uploadedBy = req.user._id;
      else if (view === "shared") query.$or = [{ sharedWith: req.user._id }, { "sharePermissions.user": req.user._id }];
      else                        query.$or = [{ uploadedBy: req.user._id }, { sharedWith: req.user._id }, { "sharePermissions.user": req.user._id }];
    } else if (onlyShared === "true") {
      query.$or = [
        { sharedWith: { $exists: true, $not: { $size: 0 } } },
        { sharePermissions: { $exists: true, $not: { $size: 0 } } },
      ];
    }

    if (category && category !== "All") query.category = category;
    if (folder === "root") query.folder = null;
    else if (folder)       query.folder = folder;

    if (fileType) {
      const mimeMap = {
        pdf: /application\/pdf/, image: /image\//, word: /msword|wordprocessingml/,
        excel: /ms-excel|spreadsheetml/, powerpoint: /ms-powerpoint|presentationml/, zip: /zip/,
      };
      if (mimeMap[fileType]) query.mimeType = { $regex: mimeMap[fileType] };
    }

    if (uploader && req.user.role === "admin") {
      const u = await User.findOne({ name: { $regex: uploader, $options: "i" } });
      if (u) query.uploadedBy = u._id;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   query.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
    }

    if (tagFilter) {
      const tagList = tagFilter.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (tagList.length > 0) query.tags = { $in: tagList };
    }

    if (search) {
      const rx = { $regex: search, $options: "i" };
      const sc = [{ originalname: rx }, { description: rx }, { tags: rx }];
      if (query.$or) { query.$and = [{ $or: query.$or }, { $or: sc }]; delete query.$or; }
      else query.$or = sc;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate("uploadedBy", "name email role")
        .populate("folder", "name")
        .sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Document.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: { documents, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) { next(error); }
};

// ── Get Single Document ───────────────────────────────────────────────────────
export const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("uploadedBy", "name email role")
      .populate("sharedWith", "name email")
      .populate("sharePermissions.user", "name email")
      .populate("folder", "name");

    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && !doc.hasAccessFor(req.user._id))
      return res.status(403).json({ success: false, message: "Access denied." });

    await Document.findByIdAndUpdate(doc._id, { $inc: { viewCount: 1 } });
    await logActivity({ userId: req.user._id, action: "VIEW", docId: doc._id, details: `Viewed "${doc.originalname}"`, req });

    res.status(200).json({ success: true, data: doc });
  } catch (error) { next(error); }
};

// ── Download Document ─────────────────────────────────────────────────────────
export const downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && !doc.hasAccessFor(req.user._id))
      return res.status(403).json({ success: false, message: "Access denied." });

    await Document.findByIdAndUpdate(doc._id, { $inc: { downloadCount: 1 } });
    await logActivity({ userId: req.user._id, action: "DOWNLOAD", docId: doc._id, details: `Downloaded "${doc.originalname}"`, req });

    const filePath = path.join(process.cwd(), "uploads", doc.cloudPublicId);
    if (fs.existsSync(filePath)) return res.download(filePath, doc.originalname);
    res.redirect(doc.cloudUrl);
  } catch (error) { next(error); }
};

// ── Preview Document ──────────────────────────────────────────────────────────
export const previewDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && !doc.hasAccessFor(req.user._id))
      return res.status(403).json({ success: false, message: "Access denied." });

    const filePath = path.join(process.cwd(), "uploads", doc.cloudPublicId);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "File not found on server." });

    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.originalname)}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => { if (!res.headersSent) res.status(500).json({ success: false, message: "Error reading file." }); });
    stream.pipe(res);
  } catch (error) { next(error); }
};

// ── Delete Document (soft) ────────────────────────────────────────────────────
export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    await logActivity({ userId: req.user._id, action: "DELETE", docId: doc._id, details: `Deleted "${doc.originalname}"`, req });
    res.status(200).json({ success: true, message: "Document deleted successfully." });
  } catch (error) { next(error); }
};

// ── Restore Deleted Document (Admin — from Trash) ─────────────────────────────
export const restoreDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, isDeleted: true });
    if (!doc) return res.status(404).json({ success: false, message: "Archived document not found." });

    doc.isDeleted = false;
    doc.deletedAt = null;
    await doc.save();

    await logActivity({ userId: req.user._id, action: "RESTORE", docId: doc._id, details: `Restored "${doc.originalname}"`, req });
    res.status(200).json({ success: true, message: "Document restored.", data: doc });
  } catch (error) { next(error); }
};

// ── Update Document (metadata & new file versions) ──────────────────────────
export const updateDocument = async (req, res, next) => {
  try {
    const { description, tags, category, changelog } = req.body;
    const doc = await Document.findById(req.params.id);

    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });

    let isNewVersion = false;

    // Handle new version file upload
    if (req.file) {
      isNewVersion = true;
      
      // Initialize versions array for legacy docs
      if (!doc.versions || doc.versions.length === 0) {
        doc.versions = [{
          version:         1,
          filename:        doc.filename,
          originalname:    doc.originalname,
          fileSize:        doc.fileSize,
          mimeType:        doc.mimeType,
          cloudUrl:        doc.cloudUrl,
          cloudPublicId:   doc.cloudPublicId,
          storageProvider: doc.storageProvider || "local",
          changelog:       "Initial version",
          uploadedBy:      doc.uploadedBy,
          createdAt:       doc.createdAt || new Date(),
        }];
        doc.version = 1;
      }

      const nextVersion = (doc.version || 1) + 1;
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      
      const newVersionItem = {
        version:         nextVersion,
        filename:        req.file.filename,
        originalname:    req.file.originalname,
        fileSize:        req.file.size,
        mimeType:        req.file.mimetype,
        cloudUrl:        fileUrl,
        cloudPublicId:   req.file.filename,
        storageProvider: "local",
        changelog:       changelog || "New version upload",
        uploadedBy:      req.user._id,
      };

      doc.versions.push(newVersionItem);
      doc.version = nextVersion;

      // Update main document properties to latest
      doc.filename        = req.file.filename;
      doc.originalname    = req.file.originalname;
      doc.fileSize        = req.file.size;
      doc.mimeType        = req.file.mimetype;
      doc.cloudUrl        = fileUrl;
      doc.cloudPublicId   = req.file.filename;
      doc.storageProvider = "local";
    }

    if (description !== undefined) doc.description = description;
    if (category    !== undefined) doc.category     = category;
    if (tags        !== undefined) {
      doc.tags = typeof tags === "string"
        ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : tags;
    }

    await doc.save();

    if (isNewVersion) {
      await logActivity({
        userId:   req.user._id,
        action:   "UPDATE_VERSION",
        docId:    doc._id,
        details:  `Uploaded version ${doc.version} for "${doc.originalname}"`,
        req,
      });
      res.status(200).json({ success: true, message: `Document updated to version ${doc.version}.`, data: doc });
    } else {
      await logActivity({ userId: req.user._id, action: "UPDATE", docId: doc._id, details: `Updated metadata for "${doc.originalname}"`, req });
      res.status(200).json({ success: true, message: "Document updated.", data: doc });
    }
  } catch (error) { next(error); }
};

// ── Share Document ────────────────────────────────────────────────────────────
export const shareDocument = async (req, res, next) => {
  try {
    const { userIds, permission = "view", expiresAt = null } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });
    if (!Array.isArray(userIds) || userIds.length === 0)
      return res.status(400).json({ success: false, message: "Provide at least one user ID." });

    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length)
      return res.status(400).json({ success: false, message: "One or more users not found." });

    for (const userId of userIds) {
      const existing = doc.sharePermissions.find((p) => p.user.toString() === userId.toString());
      if (existing) {
        existing.permission = permission;
        existing.expiresAt  = expiresAt ? new Date(expiresAt) : null;
        existing.grantedBy  = req.user._id;
      } else {
        doc.sharePermissions.push({ user: userId, permission, expiresAt: expiresAt ? new Date(expiresAt) : null, grantedBy: req.user._id });
        if (!doc.sharedWith.includes(userId)) doc.sharedWith.push(userId);
      }
    }

    await doc.save();
    await logActivity({ userId: req.user._id, action: "SHARE", docId: doc._id, details: `Shared "${doc.originalname}" with ${users.length} user(s)`, req });
    res.status(200).json({ success: true, message: "Document shared.", data: doc });
  } catch (error) { next(error); }
};

// ── Revoke Share ──────────────────────────────────────────────────────────────
export const revokeShare = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });

    doc.sharePermissions = doc.sharePermissions.filter((p) => p.user.toString() !== userId);
    doc.sharedWith       = doc.sharedWith.filter((id) => id.toString() !== userId);
    await doc.save();

    await logActivity({ userId: req.user._id, action: "SHARE", docId: doc._id, details: `Revoked access for user ${userId}`, req });
    res.status(200).json({ success: true, message: "Access revoked.", data: doc });
  } catch (error) { next(error); }
};

// ── Move Document ─────────────────────────────────────────────────────────────
export const moveDocument = async (req, res, next) => {
  try {
    const { folderId } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });

    doc.folder = folderId || null;
    await doc.save();
    await logActivity({ userId: req.user._id, action: "DOCUMENT_MOVED", docId: doc._id, details: `Moved "${doc.originalname}"`, req });
    res.status(200).json({ success: true, message: "Document moved.", data: doc });
  } catch (error) { next(error); }
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin    = req.user.role === "admin";
    const userFilter = isAdmin ? {} : { uploadedBy: req.user._id };

    const [totalDocs, totalDeleted, storageAgg, categoryAgg, recentDocs,
      uploadTrend, topDownloads, totalUsers, sharedWithMe] = await Promise.all([
      Document.countDocuments({ ...userFilter, isDeleted: false }),
      Document.countDocuments({ ...userFilter, isDeleted: true }),
      Document.aggregate([{ $match: { ...userFilter, isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: "$fileSize" }, totalViews: { $sum: "$viewCount" } } }]),
      Document.aggregate([{ $match: { ...userFilter, isDeleted: false } },
        { $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Document.find({ ...userFilter, isDeleted: false }).populate("uploadedBy", "name").sort("-createdAt").limit(5).lean(),
      Document.aggregate([{ $match: { ...userFilter, isDeleted: false,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }]),
      Document.find({ ...userFilter, isDeleted: false }).populate("uploadedBy", "name")
        .sort("-downloadCount").limit(5).select("originalname downloadCount mimeType fileSize uploadedBy").lean(),
      isAdmin ? User.countDocuments() : Promise.resolve(null),
      !isAdmin ? Document.countDocuments({ isDeleted: false, $or: [
        { sharedWith: req.user._id }, { "sharePermissions.user": req.user._id }] }) : Promise.resolve(null),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDocs, totalDeleted,
        totalStorage: storageAgg[0]?.totalSize || 0,
        totalStorageFormatted: formatBytes(storageAgg[0]?.totalSize || 0),
        totalViews: storageAgg[0]?.totalViews || 0,
        totalUsers, sharedWithMe,
        categoryBreakdown: categoryAgg,
        recentDocuments:   recentDocs,
        uploadTrend, topDownloads,
      },
    });
  } catch (error) { next(error); }
};

// ── Get Deleted Documents (Admin) ─────────────────────────────────────────────
export const getDeletedDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ isDeleted: true })
      .populate("uploadedBy", "name email").sort("-deletedAt").lean();
    res.status(200).json({ success: true, data: docs, count: docs.length });
  } catch (error) { next(error); }
};

// ── Download Document Version ──────────────────────────────────────────────────
export const downloadDocumentVersion = async (req, res, next) => {
  try {
    const { id, versionNum } = req.params;
    const doc = await Document.findById(id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && !doc.hasAccessFor(req.user._id))
      return res.status(403).json({ success: false, message: "Access denied." });

    const ver = doc.versions.find((v) => v.version === parseInt(versionNum));
    if (!ver)
      return res.status(404).json({ success: false, message: "Version not found." });

    await Document.findByIdAndUpdate(doc._id, { $inc: { downloadCount: 1 } });
    await logActivity({ userId: req.user._id, action: "DOWNLOAD", docId: doc._id, details: `Downloaded "${doc.originalname}" (Version ${versionNum})`, req });

    const filePath = path.join(process.cwd(), "uploads", ver.cloudPublicId);
    if (fs.existsSync(filePath)) return res.download(filePath, ver.originalname);
    res.redirect(ver.cloudUrl);
  } catch (error) { next(error); }
};

// ── Preview Document Version ───────────────────────────────────────────────────
export const previewDocumentVersion = async (req, res, next) => {
  try {
    const { id, versionNum } = req.params;
    const doc = await Document.findById(id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && !doc.hasAccessFor(req.user._id))
      return res.status(403).json({ success: false, message: "Access denied." });

    const ver = doc.versions.find((v) => v.version === parseInt(versionNum));
    if (!ver)
      return res.status(404).json({ success: false, message: "Version not found." });

    const filePath = path.join(process.cwd(), "uploads", ver.cloudPublicId);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "File not found on server." });

    await Document.findByIdAndUpdate(doc._id, { $inc: { viewCount: 1 } });
    await logActivity({ userId: req.user._id, action: "VIEW", docId: doc._id, details: `Viewed "${doc.originalname}" (Version ${versionNum})`, req });

    res.setHeader("Content-Type", ver.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(ver.originalname)}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => { if (!res.headersSent) res.status(500).json({ success: false, message: "Error reading file." }); });
    stream.pipe(res);
  } catch (error) { next(error); }
};

// ── Restore Document Version ───────────────────────────────────────────────────
export const restoreDocumentVersion = async (req, res, next) => {
  try {
    const { id, versionNum } = req.params;
    const doc = await Document.findById(id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });

    // Initialize versions array for legacy docs
    if (!doc.versions || doc.versions.length === 0) {
      doc.versions = [{
        version:         1,
        filename:        doc.filename,
        originalname:    doc.originalname,
        fileSize:        doc.fileSize,
        mimeType:        doc.mimeType,
        cloudUrl:        doc.cloudUrl,
        cloudPublicId:   doc.cloudPublicId,
        storageProvider: doc.storageProvider || "local",
        changelog:       "Initial version",
        uploadedBy:      doc.uploadedBy,
        createdAt:       doc.createdAt || new Date(),
      }];
      doc.version = 1;
    }

    const targetVer = doc.versions.find((v) => v.version === parseInt(versionNum));
    if (!targetVer)
      return res.status(404).json({ success: false, message: "Version not found." });

    const nextVer = (doc.version || 1) + 1;
    
    const restoredVersionItem = {
      version:         nextVer,
      filename:        targetVer.filename,
      originalname:    targetVer.originalname,
      fileSize:        targetVer.fileSize,
      mimeType:        targetVer.mimeType,
      cloudUrl:        targetVer.cloudUrl,
      cloudPublicId:   targetVer.cloudPublicId,
      storageProvider: targetVer.storageProvider,
      changelog:       `Restored from Version ${versionNum}`,
      uploadedBy:      req.user._id,
    };

    doc.versions.push(restoredVersionItem);
    doc.version = nextVer;

    // Update active document fields to the restored file details
    doc.filename        = targetVer.filename;
    doc.originalname    = targetVer.originalname;
    doc.fileSize        = targetVer.fileSize;
    doc.mimeType        = targetVer.mimeType;
    doc.cloudUrl        = targetVer.cloudUrl;
    doc.cloudPublicId   = targetVer.cloudPublicId;
    doc.storageProvider = targetVer.storageProvider;

    await doc.save();

    await logActivity({
      userId:   req.user._id,
      action:   "RESTORE_VERSION",
      docId:    doc._id,
      details:  `Restored "${doc.originalname}" to Version ${versionNum} (created Version ${nextVer})`,
      req,
    });

    res.status(200).json({ success: true, message: `Restored to version ${versionNum} as version ${nextVer}.`, data: doc });
  } catch (error) { next(error); }
};

// ── Delete Document Version ────────────────────────────────────────────────────
export const deleteDocumentVersion = async (req, res, next) => {
  try {
    const { id, versionNum } = req.params;
    const doc = await Document.findById(id);
    if (!doc || doc.isDeleted)
      return res.status(404).json({ success: false, message: "Document not found." });
    
    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized." });

    // Initialize versions array for legacy docs if not done
    if (!doc.versions || doc.versions.length === 0) {
      doc.versions = [{
        version:         1,
        filename:        doc.filename,
        originalname:    doc.originalname,
        fileSize:        doc.fileSize,
        mimeType:        doc.mimeType,
        cloudUrl:        doc.cloudUrl,
        cloudPublicId:   doc.cloudPublicId,
        storageProvider: doc.storageProvider || "local",
        changelog:       "Initial version",
        uploadedBy:      doc.uploadedBy,
        createdAt:       doc.createdAt || new Date(),
      }];
      doc.version = 1;
    }

    const versionNumInt = parseInt(versionNum);
    const verIndex = doc.versions.findIndex((v) => v.version === versionNumInt);
    if (verIndex === -1)
      return res.status(404).json({ success: false, message: "Version not found." });

    const isDeletingActive = (doc.version === versionNumInt);

    // If it's the only version left, delete the entire document (soft delete)
    if (doc.versions.length <= 1) {
      doc.isDeleted = true;
      doc.deletedAt = new Date();
      await doc.save();
      await logActivity({ userId: req.user._id, action: "DELETE", docId: doc._id, details: `Deleted "${doc.originalname}" because its only version was deleted`, req });
      return res.status(200).json({ success: true, message: "Only version deleted. Document moved to trash.", deletedDocument: true });
    }

    // Remove the version from history
    doc.versions.splice(verIndex, 1);

    // If we deleted the active version, make the latest remaining version active
    if (isDeletingActive) {
      const remainingVersions = [...doc.versions].sort((a, b) => b.version - a.version);
      const latestVer = remainingVersions[0];
      doc.version         = latestVer.version;
      doc.filename        = latestVer.filename;
      doc.originalname    = latestVer.originalname;
      doc.fileSize        = latestVer.fileSize;
      doc.mimeType        = latestVer.mimeType;
      doc.cloudUrl        = latestVer.cloudUrl;
      doc.cloudPublicId   = latestVer.cloudPublicId;
      doc.storageProvider = latestVer.storageProvider;
    }

    await doc.save();

    await logActivity({
      userId:   req.user._id,
      action:   "DELETE_VERSION",
      docId:    doc._id,
      details:  `Deleted version ${versionNum} of "${doc.originalname}"`,
      req,
    });

    res.status(200).json({ success: true, message: `Version ${versionNum} deleted successfully.`, data: doc });
  } catch (error) { next(error); }
};
