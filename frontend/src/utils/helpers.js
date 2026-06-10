/**
 * Utility helpers
 *
 * Improvements:
 * - Added getFileTypeLabel
 * - Added relative time formatting
 * - Added truncateText helper
 */

// Format bytes to human-readable string
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
};

// Format date to readable string
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format date + time
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Relative time (e.g. "2 hours ago")
export const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
};

// Get file extension
export const getFileExt = (filename = "") =>
  filename.split(".").pop()?.toLowerCase() || "";

// Get human-readable file type label
export const getFileTypeLabel = (mimeType = "", filename = "") => {
  const ext = getFileExt(filename);
  if (mimeType.includes("pdf") || ext === "pdf") return "PDF";
  if (mimeType.includes("wordprocessingml") || ext === "docx") return "Word";
  if (mimeType.includes("spreadsheetml") || ext === "xlsx") return "Excel";
  if (mimeType.includes("presentationml") || ext === "pptx") return "PowerPoint";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("zip")) return "Archive";
  if (mimeType.includes("csv") || ext === "csv") return "CSV";
  if (mimeType.includes("json") || ext === "json") return "JSON";
  if (mimeType.includes("text") || ext === "txt") return "Text";
  return ext.toUpperCase() || "File";
};

// Get category badge color
export const getCategoryColor = (cat) => {
  const map = {
    Finance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    HR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Legal: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Projects: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    Marketing: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    IT: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    General: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Other: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return map[cat] || map.General;
};

// Get action color for activity logs
export const getActionColor = (action) => {
  const map = {
    UPLOAD: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
    DOWNLOAD: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    DELETE: "text-red-400 bg-red-500/10 border border-red-500/20",
    UPDATE: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20",
    LOGIN: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20",
    LOGOUT: "text-slate-400 bg-slate-500/10 border border-slate-500/20",
    REGISTER: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
    VIEW: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20",
    SHARE: "text-pink-400 bg-pink-500/10 border border-pink-500/20",
    USER_CREATE: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
    USER_DELETE: "text-red-400 bg-red-500/10 border border-red-500/20",
    FAILED_LOGIN: "text-red-400 bg-red-500/10 border border-red-500/20",
    VERSION_RESTORE: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    RESTORE: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    ARCHIVE: "text-slate-400 bg-slate-500/10 border border-slate-500/20",
    FOLDER_CREATE: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20",
    FOLDER_DELETE: "text-red-400 bg-red-500/10 border border-red-500/20",
    DOCUMENT_MOVED: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
    PERMISSION_CHANGE: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
  };
  return map[action] || "text-slate-400 bg-slate-500/10 border border-slate-500/20";
};

// Debounce helper
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Get greeting based on time of day
export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
};
