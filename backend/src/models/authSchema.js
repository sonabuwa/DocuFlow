/**
 * User Schema v2.1
 * Fix: Removed duplicate email index (unique:true already creates one)
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Name is required"], trim: true,
      minlength: [2, "Name must be at least 2 characters"], maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String, required: [true, "Email is required"],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String, required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"], select: false,
    },
    role: { type: String, enum: ["employee", "user", "admin"], default: "employee" },
    lastLogin: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.failedLoginAttempts;
  return obj;
};

// NOTE: No schema.index({ email:1 }) here — unique:true above already handles it

export default mongoose.model("User", userSchema);
