/**
 * Multer File Upload Configuration
 *
 * Improvements:
 * - Double validation: MIME type + file extension
 * - Protects against MIME spoofing by checking both
 * - Sanitized filenames
 * - Configurable max size via environment
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// ALLOWED FILE TYPES
// Both MIME type AND extension must match to prevent spoofing
// ==========================================
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/json",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".ppt", ".pptx", ".zip", ".jpg", ".jpeg",
  ".png", ".gif", ".webp", ".txt", ".csv", ".json",
]);

// ==========================================
// STORAGE ENGINE
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize original filename: strip special chars, keep extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ==========================================
// FILE FILTER: MIME + Extension Double Check
// ==========================================
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
  const extAllowed = ALLOWED_EXTENSIONS.has(ext);

  if (mimeAllowed && extAllowed) {
    return cb(null, true);
  }

  const err = new Error(
    `File type not allowed. Allowed types: PDF, Word, Excel, PowerPoint, Images, ZIP, TXT, CSV.`
  );
  err.code = "INVALID_FILE_TYPE";
  err.status = 400;
  cb(err, false);
};

// ==========================================
// MULTER INSTANCE
// ==========================================
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || "50") * 1024 * 1024,
    files: 5, // Max 5 files per request
  },
});
