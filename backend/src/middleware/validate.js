import { body, param, validationResult } from "express-validator";

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(". ") });
  }
  next();
};

export const validateLogin = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

export const validateSignup = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and a number"),
  body("role").optional().isIn(["employee", "admin", "user"]).withMessage("Invalid role"),
  handleValidation,
];

export const validateDocumentUpload = [
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  body("category").optional().isIn(["General","Finance","HR","Legal","Projects","Marketing","IT","Other"]).withMessage("Invalid category"),
  body("tags").optional().trim().isLength({ max: 200 }).withMessage("Tags cannot exceed 200 characters"),
  handleValidation,
];

export const validateDocumentUpdate = [
  param("id").isMongoId().withMessage("Invalid document ID"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  body("category").optional().isIn(["General","Finance","HR","Legal","Projects","Marketing","IT","Other"]).withMessage("Invalid category"),
  handleValidation,
];

export const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidation,
];

export const validateFolderCreate = [
  body("name").trim().notEmpty().withMessage("Folder name is required").isLength({ min: 1, max: 100 }).withMessage("Folder name must be 1-100 characters"),
  body("parentFolder").optional({ nullable: true }).isMongoId().withMessage("Invalid parent folder ID"),
  handleValidation,
];
