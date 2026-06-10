/**
 * Folder Routes
 */

import express from "express";
import {
  createFolder,
  getFolders,
  getBreadcrumb,
  renameFolder,
  deleteFolder,
} from "../controllers/folderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateFolderCreate, validateMongoId } from "../middleware/validate.js";

const router = express.Router();

router.use(protect);

router.get("/", getFolders);
router.post("/", validateFolderCreate, createFolder);
router.get("/:folderId/breadcrumb", getBreadcrumb);
router.patch("/:id", validateMongoId, renameFolder);
router.delete("/:id", validateMongoId, deleteFolder);

export default router;
