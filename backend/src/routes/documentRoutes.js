import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { upload }             from "../config/multerConfig.js";
import { uploadLimiter }      from "../middleware/rateLimiter.js";
import {
  validateDocumentUpload,
  validateDocumentUpdate,
  validateMongoId,
} from "../middleware/validate.js";
import {
  uploadDocument,
  getAllDocuments,
  getDocument,
  downloadDocument,
  previewDocument,
  deleteDocument,
  updateDocument,
  getDashboardStats,
  restoreDocument,
  shareDocument,
  revokeShare,
  moveDocument,
  getDeletedDocuments,
  downloadDocumentVersion,
  previewDocumentVersion,
  restoreDocumentVersion,
  deleteDocumentVersion,
} from "../controllers/documentController.js";

const router = express.Router();
router.use(protect);

router.get("/stats",  getDashboardStats);
router.get("/",       getAllDocuments);
router.get("/trash",  adminOnly, getDeletedDocuments);

router.post("/upload", uploadLimiter, upload.single("file"), validateDocumentUpload, uploadDocument);

router.get   ("/:id",          validateMongoId, getDocument);
router.get   ("/:id/download", validateMongoId, downloadDocument);
router.get   ("/:id/preview",  validateMongoId, previewDocument);
router.patch ("/:id",          validateMongoId, upload.single("file"), validateDocumentUpdate, updateDocument);
router.delete("/:id",          validateMongoId, deleteDocument);

router.get   ("/:id/versions/:versionNum/download", validateMongoId, downloadDocumentVersion);
router.get   ("/:id/versions/:versionNum/preview",  validateMongoId, previewDocumentVersion);
router.post  ("/:id/versions/:versionNum/restore",  validateMongoId, restoreDocumentVersion);
router.delete("/:id/versions/:versionNum",          validateMongoId, deleteDocumentVersion);

router.post("/:id/restore",          validateMongoId, adminOnly, restoreDocument);
router.post("/:id/share",            validateMongoId, shareDocument);
router.delete("/:id/share/:userId",  validateMongoId, revokeShare);
router.patch("/:id/move",            validateMongoId, moveDocument);

export default router;
