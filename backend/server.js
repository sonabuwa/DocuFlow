/**
 * DocuFlow API v2.2
 */

import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import { generalLimiter, authLimiter } from "./src/middleware/rateLimiter.js";
import { mongoSanitize } from "./src/middleware/sanitize.js";
import { errorHandler, notFound } from "./src/middleware/errorMiddleware.js";
import authRoutes from "./src/routes/authRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import logRoutes from "./src/routes/logRoutes.js";
import folderRoutes from "./src/routes/folderRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",").map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize);
app.use(generalLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: "1d",
  etag: true,
  setHeaders: (res, filePath) => {
    // Allow inline display for common previewable types
    const ext = path.extname(filePath).toLowerCase();
    const inlineTypes = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".txt", ".md"];
    if (inlineTypes.includes(ext)) {
      res.setHeader("Content-Disposition", "inline");
    }
    // Ensure cross-origin resource policy allows embedding
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
}));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/folders", folderRoutes);

app.get("/api/health", (req, res) =>
  res.status(200).json({ success: true, message: "DocuFlow API is healthy ✅", version: "2.2.0", timestamp: new Date().toISOString() })
);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n✅ DocuFlow API v2.2 running on http://localhost:${PORT}`);
  console.log(`   CORS origins: ${allowedOrigins.join(", ")}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));

connectDB();
