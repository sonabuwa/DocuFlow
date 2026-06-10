import mongoose from "mongoose";

// ── Share Permission Sub-Schema ───────────────────────────────────────────────
const sharePermissionSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    permission: { type: String, enum: ["view", "download", "edit"], default: "view" },
    expiresAt:  { type: Date, default: null },
    grantedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ── Version Schema ────────────────────────────────────────────────────────────
const versionSchema = new mongoose.Schema(
  {
    version:         { type: Number, required: true },
    filename:        { type: String, required: true },
    originalname:    { type: String, required: true },
    fileSize:        { type: Number, required: true },
    mimeType:        { type: String, required: true },
    cloudUrl:        { type: String, required: true },
    cloudPublicId:   { type: String, required: true },
    storageProvider: { type: String, default: "local" },
    changelog:       { type: String, default: "" },
    uploadedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// ── Document Schema ───────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema(
  {
    filename:        { type: String, required: true },
    originalname:    { type: String, required: true },
    fileSize:        { type: Number, required: true },
    mimeType:        { type: String, required: true },
    cloudUrl:        { type: String, required: true },
    cloudPublicId:   { type: String, required: true },
    storageProvider: { type: String, default: "local" },
    version:         { type: Number, default: 1 },
    versions:        [versionSchema],
    description:     { type: String, default: "" },
    tags:            [{ type: String, trim: true, lowercase: true }],
    category: {
      type:    String,
      enum:    ["General","Finance","HR","Legal","Projects","Marketing","IT","Other"],
      default: "General",
    },
    uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    folder:       { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    isDeleted:    { type: Boolean, default: false },
    deletedAt:    { type: Date,    default: null  },
    archivedAt:   { type: Date,    default: null  },
    sharedWith:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sharePermissions: [sharePermissionSchema],
    downloadCount: { type: Number, default: 0 },
    viewCount:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
documentSchema.index({ filename: "text", description: "text", tags: "text", originalname: "text" });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ category: 1 });
documentSchema.index({ folder: 1, isDeleted: 1 });
documentSchema.index({ isDeleted: 1, createdAt: -1 });
documentSchema.index({ downloadCount: -1 });
documentSchema.index({ "sharePermissions.user": 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
documentSchema.virtual("previewSupported").get(function () {
  const previewable = [
    "application/pdf",
    "image/jpeg","image/png","image/gif","image/webp","image/svg+xml",
    "text/plain","text/csv",
  ];
  return previewable.includes(this.mimeType);
});

// ── Methods ───────────────────────────────────────────────────────────────────
documentSchema.methods.hasAccessFor = function (userId) {
  if (this.uploadedBy.toString() === userId.toString()) return true;
  if (this.sharedWith.some((id) => id.toString() === userId.toString())) return true;
  const perm = this.sharePermissions.find(
    (p) => p.user.toString() === userId.toString()
  );
  if (!perm) return false;
  if (perm.expiresAt && perm.expiresAt < new Date()) return false;
  return true;
};

export default mongoose.model("Document", documentSchema);
