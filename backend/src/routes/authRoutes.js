import express from "express";
import { signup, login, logout, getMe, getUsers, deleteUser, searchUsers } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateLogin, validateSignup, validateMongoId } from "../middleware/validate.js";

const router = express.Router();

// Public
router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);

// Protected
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.get("/search", protect, searchUsers); // ← NEW: search users by name/email

// Admin only
router.get("/users", protect, adminOnly, getUsers);
router.delete("/users/:id", protect, adminOnly, validateMongoId, deleteUser);

export default router;
