import { useState, useEffect } from "react";
import {
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";

// ==========================================
// STAT CARD
// ==========================================
export const StatCard = ({
  label,
  value,
  icon,
  sub,
  accent = "blue",
  trend,
}) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-xl border ${colors[accent] || colors.blue} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1 tracking-tight text-white">
        {value}
      </p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
};

// ==========================================
// BADGE
// ==========================================
export const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${className}`}
  >
    {children}
  </span>
);

// ==========================================
// EMPTY STATE
// ==========================================
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
    <div className="bg-blue-500/5 p-8 rounded-full mb-6 border border-blue-500/10">
      {icon}
    </div>
    <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
    <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
      {description}
    </p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// ==========================================
// SPINNER
// ==========================================
export const Spinner = ({ size = 20, className = "" }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);

// ==========================================
// SKELETON CARD (for document loading)
// ==========================================
export const SkeletonCard = () => (
  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-white/5 rounded-xl" />
        <div className="w-8 h-8 bg-white/5 rounded-xl" />
      </div>
    </div>
  </div>
);

// ==========================================
// SKELETON ROW (for tables)
// ==========================================
export const SkeletonRow = ({ cols = 4 }) => (
  <tr className="border-b border-white/[0.02]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div
          className="h-4 bg-white/5 rounded animate-pulse"
          style={{ width: `${60 + ((i * 13) % 40)}%` }}
        />
      </td>
    ))}
  </tr>
);

// ==========================================
// SEARCH INPUT
// ==========================================
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => (
  <div className={`relative ${className}`}>
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 w-full transition-all text-slate-300 placeholder:text-slate-600"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

// ==========================================
// MODAL WRAPPER
// ==========================================
export const Modal = ({ open, onClose, title, children, size = "lg" }) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-2xl",
      "2xl": "max-w-4xl",
    }[size] || "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-[#0d1117] border border-white/10 rounded-3xl p-8 w-full ${sizeClass} shadow-2xl z-10 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ==========================================
// CONFIRM DIALOG (replaces window.confirm)
// ==========================================
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#0d1117] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-500/10" : "bg-blue-500/10"}`}
        >
          <AlertTriangle
            size={24}
            className={danger ? "text-red-400" : "text-blue-400"}
          />
        </div>
        <h3 className="text-lg font-bold text-center text-white mb-2">
          {title}
        </h3>
        <p className="text-slate-400 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${danger ? "bg-red-600 hover:bg-red-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// FILE PREVIEW MODAL
// Supports:
//   - PDF:          fetch with auth → blob URL → iframe (inline)
//   - Images:       fetch with auth → blob URL → <img>
//   - TXT:          fetch with auth → read as text → <pre>
//   - DOC/DOCX/XLS/XLSX/PPT/PPTX: Google Docs Viewer via the backend /preview URL
//     (the /preview endpoint serves inline with proper Content-Type so Docs Viewer can load it)
//   - Others:       download prompt
//
// FIX: All file types now handled. Auth token used for all direct fetches.
// Office files use Google Docs Viewer with the backend preview URL (requires public internet
// access to docs.google.com; falls back gracefully if unavailable).
// ==========================================

// Derive preview strategy from MIME type and filename
const getPreviewStrategy = (mimeType, filename) => {
  if (!mimeType && !filename) return "unsupported";
  const mime = (mimeType || "").toLowerCase();
  const ext = (filename || "").split(".").pop().toLowerCase();

  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (
    mime.startsWith("text/") ||
    ext === "txt" ||
    ext === "md" ||
    ext === "log" ||
    ext === "csv"
  )
    return "text";
  if (
    mime.includes("msword") ||
    mime.includes("wordprocessingml") ||
    mime.includes("ms-excel") ||
    mime.includes("spreadsheetml") ||
    mime.includes("ms-powerpoint") ||
    mime.includes("presentationml") ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)
  )
    return "office";
  return "unsupported";
};

export const FilePreviewModal = ({
  open,
  onClose,
  document: doc,
  downloadUrl,
  previewUrl,
}) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loadingState, setLoadingState] = useState("idle"); // idle | loading | ready | error
  const [officeViewerError, setOfficeViewerError] = useState(false);

  const strategy = doc
    ? getPreviewStrategy(doc.mimeType, doc.originalname)
    : "unsupported";
  // For office files, use the backend /preview URL (inline, no auth header needed via iframe)
  const effectivePreviewUrl = previewUrl || downloadUrl;

  // Fetch blob for PDF, image, and text
  useEffect(() => {
    if (!open || !doc) return;
    if (!["pdf", "image", "text"].includes(strategy)) return;

    setBlobUrl(null);
    setTextContent(null);
    setOfficeViewerError(false);
    setLoadingState("loading");

    const token = localStorage.getItem("token");
    const fetchUrl = effectivePreviewUrl || downloadUrl;

    fetch(fetchUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (strategy === "text") return res.text();
        return res.blob();
      })
      .then((result) => {
        if (strategy === "text") {
          setTextContent(result);
        } else {
          setBlobUrl(URL.createObjectURL(result));
        }
        setLoadingState("ready");
      })
      .catch(() => setLoadingState("error"));

    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [open, doc?._id, strategy]); // eslint-disable-line react-hooks/exhaustive-deps

  // For office files, set loading state to "ready" immediately (Google Docs Viewer handles it)
  useEffect(() => {
    if (!open || !doc) return;
    if (strategy === "office") {
      setOfficeViewerError(false);
      setLoadingState("ready");
    }
    if (strategy === "unsupported") {
      setLoadingState("ready");
    }
  }, [open, doc?._id, strategy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !doc) return null;

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setTextContent(null);
    setLoadingState("idle");
    onClose();
  };

  const triggerDownload = () => {
    if (blobUrl) {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.originalname;
      a.click();
      return;
    }
    const token = localStorage.getItem("token");
    fetch(downloadUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = doc.originalname;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  // Build Google Docs Viewer URL for office files
  // The backend /preview endpoint serves the file inline; we pass its full URL to Docs Viewer
  const buildGoogleDocsViewerUrl = () => {
    // Use the backend preview URL — it must be publicly accessible for Google Docs Viewer
    // For localhost development, Google Docs Viewer won't work; show a helpful message
    const encodedUrl = encodeURIComponent(effectivePreviewUrl);
    return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
  };

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const renderPreview = () => {
    if (loadingState === "loading") {
      return (
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm">Loading preview…</p>
        </div>
      );
    }

    if (loadingState === "error") {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <p className="text-slate-300 font-medium">Preview failed to load.</p>
          <p className="text-slate-500 text-sm">
            The file may be unavailable or access was denied.
          </p>
          <button
            onClick={triggerDownload}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all"
          >
            Download Instead
          </button>
        </div>
      );
    }

    switch (strategy) {
      case "pdf":
        return blobUrl ? (
          <iframe
            src={`${blobUrl}#toolbar=1&view=FitH`}
            className="w-full h-full rounded-xl border border-white/10"
            title={doc.originalname}
          />
        ) : null;

      case "image":
        return blobUrl ? (
          <img
            src={blobUrl}
            alt={doc.originalname}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          />
        ) : null;

      case "text":
        return textContent !== null ? (
          <div className="w-full h-full overflow-auto rounded-xl border border-white/10 bg-[#0a0e17] p-6">
            <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {textContent}
            </pre>
          </div>
        ) : null;

      case "office":
        if (isLocalhost) {
          // Google Docs Viewer cannot reach localhost; show informative fallback
          return (
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center text-4xl">
                📋
              </div>
              <p className="text-slate-200 font-semibold text-lg">
                {doc.originalname}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Office file preview (DOCX, XLSX, PPTX) requires a publicly
                accessible server URL. On localhost, Google Docs Viewer cannot
                reach the file.
              </p>
              <p className="text-slate-500 text-xs">
                Deploy to a public server for in-browser Office preview.
              </p>
              <button
                onClick={triggerDownload}
                className="mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all"
              >
                Download File
              </button>
            </div>
          );
        }
        return officeViewerError ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center text-4xl">
              📋
            </div>
            <p className="text-slate-300 font-medium">
              Office preview unavailable.
            </p>
            <p className="text-slate-500 text-sm">
              Google Docs Viewer could not load this file.
            </p>
            <button
              onClick={triggerDownload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all"
            >
              Download Instead
            </button>
          </div>
        ) : (
          <iframe
            src={buildGoogleDocsViewerUrl()}
            className="w-full h-full rounded-xl border border-white/10"
            title={doc.originalname}
            onError={() => setOfficeViewerError(true)}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        );

      default:
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-4xl">
              📄
            </div>
            <p className="text-slate-200 font-semibold">{doc.originalname}</p>
            <p className="text-slate-500 text-sm">
              Preview not available for this file type.
            </p>
            <button
              onClick={triggerDownload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all"
            >
              Download File
            </button>
          </div>
        );
    }
  };

  const strategyLabel =
    {
      pdf: "PDF",
      image: "Image",
      text: "Text File",
      office: "Office Document",
      unsupported: "File",
    }[strategy] || "File";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117]/80 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-white truncate">
            {doc.originalname}
          </span>
          <span className="text-xs text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded-lg hidden sm:block">
            {strategyLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={triggerDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all"
          >
            Download
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {renderPreview()}
      </div>
    </div>
  );
};

// ==========================================
// TOOLTIP
// ==========================================
export const Tooltip = ({ children, text, position = "top" }) => {
  const [visible, setVisible] = useState(false);
  const posClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-800 border border-white/10 rounded-lg whitespace-nowrap pointer-events-none ${posClass}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};

// ==========================================
// SECTION HEADER
// ==========================================
export const SectionHeader = ({ icon, title, children }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <h3 className="font-bold text-sm text-white">{title}</h3>
    </div>
    {children}
  </div>
);
