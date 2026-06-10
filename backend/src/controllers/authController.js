/**
 * Auth Controller v2.2
 * - Uses findByIdAndUpdate to avoid Mongoose validation on existing users
 * - Added searchUsers for the Share modal
 */

import User from "../models/authSchema.js";
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/activityLogger.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) console.error("❌ FATAL: JWT_SECRET is not defined in .env");

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// REGISTER
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "An account with this email already exists." });

    const newUser = await User.create({ name, email, password, role: role || "employee" });
    const token = generateToken(newUser._id);

    await logActivity({ userId: newUser._id, action: "REGISTER", details: `New account: ${name} (${email})`, req });

    const userObj = newUser.toObject();
    delete userObj.password;
    delete userObj.failedLoginAttempts;

    res.status(201).json({ success: true, message: "Account created successfully.", data: { user: userObj, token } });
  } catch (error) { next(error); }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password +failedLoginAttempts +isActive");

    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password." });

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: "This account has been deactivated. Please contact an administrator." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      await User.findByIdAndUpdate(user._id, { $set: { failedLoginAttempts: attempts } });
      await logActivity({ userId: user._id, action: "FAILED_LOGIN", details: `Failed attempt #${attempts} for ${email}`, metadata: { attempts }, req });
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    await User.findByIdAndUpdate(user._id, { $set: { failedLoginAttempts: 0, lastLogin: new Date() } });
    const token = generateToken(user._id);
    await logActivity({ userId: user._id, action: "LOGIN", details: `Logged in: ${user.name}`, req });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.failedLoginAttempts;

    res.status(200).json({ success: true, message: "Login successful.", data: { user: userObj, token } });
  } catch (error) { next(error); }
};

// LOGOUT
export const logout = async (req, res, next) => {
  try {
    await logActivity({ userId: req.user._id, action: "LOGOUT", details: `Logged out: ${req.user.name}`, req });
    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) { next(error); }
};

// GET CURRENT USER
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password -failedLoginAttempts");
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

// GET ALL USERS (Admin)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -failedLoginAttempts").sort("-createdAt");
    res.status(200).json({ success: true, data: users, count: users.length });
  } catch (error) { next(error); }
};

// DELETE USER (Admin)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account." });
    }
    await User.findByIdAndDelete(req.params.id);
    await logActivity({ userId: req.user._id, action: "USER_DELETE", details: `Deleted user: ${user.name} (${user.email})`, req });
    res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) { next(error); }
};

// SEARCH USERS — for Share modal (any authenticated user)
export const searchUsers = async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.status(200).json({ success: true, data: [] });

    const users = await User.find({
      _id: { $ne: req.user._id }, // exclude self
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id name email role")
      .limit(10)
      .lean();

    res.status(200).json({ success: true, data: users });
  } catch (error) { next(error); }
};
