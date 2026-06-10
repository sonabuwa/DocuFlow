/**
 * Activity Log Routes
 */

import express from "express";
import { getAllLogs, getMyLogs } from "../controllers/logController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", adminOnly, getAllLogs);
router.get("/me", getMyLogs);

export default router;
