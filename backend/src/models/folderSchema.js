/**
 * Folder Schema
 * Enables hierarchical folder organization for documents.
 */

import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: [100, "Folder name cannot exceed 100 characters"],
    },
    // Parent folder for nested structure (null = root)
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Who can access this folder (empty = all authenticated users)
    permissions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        canRead: { type: Boolean, default: true },
        canWrite: { type: Boolean, default: false },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    color: { type: String, default: "blue" }, // UI color theming
  },
  { timestamps: true }
);

folderSchema.index({ parentFolder: 1, isDeleted: 1 });
folderSchema.index({ createdBy: 1 });

export default mongoose.model("Folder", folderSchema);
