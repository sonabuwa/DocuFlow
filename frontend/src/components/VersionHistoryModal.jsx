import { useState, useEffect, useRef } from "react";
import {
  History, Eye, Download, RotateCcw, UploadCloud,
  CheckCircle2, AlertCircle, X, Loader2, MessageSquare, Clock, User
} from "lucide-react";
import { documentService } from "../services/api";
import { FileIcon } from "./FileIcon";
import { Modal, Tooltip, FilePreviewModal } from "./UI";
import { formatBytes, timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

export default function VersionHistoryModal({ open, onClose, docId, onVersionUpdated }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [changelog, setChangelog] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [previewVer, setPreviewVer] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocDetails = async () => {
    setLoading(true);
    try {
      const res = await documentService.getOne(docId);
      setDoc(res.data.data);
    } catch {
      toast.error("Failed to load document history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && docId) {
      fetchDocDetails();
      // Reset upload state
      setFile(null);
      setChangelog("");
      setUploading(false);
      setUploadProgress(0);
    } else {
      setDoc(null);
    }
  }, [open, docId]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("changelog", changelog);

    try {
      await documentService.update(docId, formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });
      toast.success("New version uploaded successfully!");
      setFile(null);
      setChangelog("");
      // Refresh list
      await fetchDocDetails();
      if (onVersionUpdated) onVersionUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload new version.");
    } finally {
      setUploading(false);
    }
  };

  const handleRestoreVersion = async (versionNum) => {
    if (window.confirm(`Are you sure you want to restore Version ${versionNum}? This will create a new version as the current file.`)) {
      setRestoringVersion(versionNum);
      try {
        await documentService.restoreVersion(docId, versionNum);
        toast.success(`Restored to version ${versionNum}!`);
        await fetchDocDetails();
        if (onVersionUpdated) onVersionUpdated();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to restore version.");
      } finally {
        setRestoringVersion(null);
      }
    }
  };

  const handleDownloadVersion = (versionNum, originalname) => {
    const downloadUrl = documentService.getVersionDownloadUrl(docId, versionNum);
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = originalname;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Download failed."));
  };

  // If versions array is empty (for legacy files), construct a virtual version 1
  const getVersionsList = () => {
    if (!doc) return [];
    if (doc.versions && doc.versions.length > 0) {
      // Return sorted with newest version first
      return [...doc.versions].sort((a, b) => b.version - a.version);
    }
    // Fallback for legacy documents
    return [
      {
        version: 1,
        filename: doc.filename,
        originalname: doc.originalname,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        changelog: "Initial upload (Legacy)",
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
      },
    ];
  };

  const versions = getVersionsList();

  return (
    <Modal open={open} onClose={onClose} title="Version History" size="xl">
      {loading && !doc ? (
        <div className="flex flex-col items-center py-12 text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm">Loading document history…</p>
        </div>
      ) : !doc ? (
        <p className="text-center text-slate-500 py-8 text-sm">Document not found.</p>
      ) : (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl">
              <FileIcon mimeType={doc.mimeType} filename={doc.originalname} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-white text-sm truncate">
                {doc.originalname}
              </h4>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Current Version: v{doc.version || 1}</span>
                <span>·</span>
                <span>{formatBytes(doc.fileSize)}</span>
              </p>
            </div>
          </div>

          {/* Upload New Version Section */}
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UploadCloud size={14} className="text-blue-400" /> Upload New Version
            </h4>

            {uploading ? (
              <div className="space-y-2 py-4">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={14} />
                    Uploading new version...
                  </span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadVersion} className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group
                    ${
                      isDragging
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                    }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <UploadCloud
                    size={24}
                    className="text-slate-500 group-hover:scale-110 transition-transform"
                  />
                  {file ? (
                    <div className="min-w-0 max-w-full">
                      <p className="text-sm font-semibold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-300 font-medium">
                        Drag & drop a new file version
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        or click to select file
                      </p>
                    </div>
                  )}
                </div>

                {/* Changelog description */}
                {file && (
                  <div className="space-y-3 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Changelog note (What changed?)
                      </label>
                      <div className="relative">
                        <MessageSquare
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          type="text"
                          value={changelog}
                          onChange={(e) => setChangelog(e.target.value)}
                          placeholder="e.g. Added section 3, corrected typo"
                          className="w-full bg-[#161b22] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setChangelog("");
                        }}
                        className="px-4 py-2 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all text-white"
                      >
                        Upload Version
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Versions List (Timeline) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History size={14} className="text-purple-400" /> Version History Timeline
            </h4>

            <div className="relative border-l border-white/10 ml-3 pl-6 space-y-6 py-2">
              {versions.map((ver, idx) => {
                const isCurrent = ver.version === (doc.version || 1);
                return (
                  <div key={idx} className="relative">
                    {/* Timeline Node Icon */}
                    <span
                      className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center
                      ${
                        isCurrent
                          ? "bg-blue-500 border-blue-500 ring-4 ring-blue-500/20"
                          : "bg-[#0d1117] border-white/20"
                      }`}
                    />

                    {/* Content Box */}
                    <div
                      className={`p-4 rounded-2xl border transition-all flex justify-between items-start gap-4 hover:bg-white/[0.01]
                      ${
                        isCurrent
                          ? "bg-blue-600/[0.02] border-blue-500/20"
                          : "bg-white/[0.005] border-white/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">
                            Version {ver.version}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                              Active
                            </span>
                          )}
                          <span className="text-xs text-slate-500 truncate font-medium">
                            {ver.originalname}
                          </span>
                        </div>

                        {/* Changelog */}
                        <p className="text-xs text-slate-300 italic">
                          "{ver.changelog || "No comments"}"
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {ver.uploadedBy?.name || "System"}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {timeAgo(ver.createdAt)}
                          </span>
                          <span>·</span>
                          <span>{formatBytes(ver.fileSize)}</span>
                        </div>
                      </div>

                      {/* Version Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip text="Preview Version">
                          <button
                            onClick={() => setPreviewVer(ver)}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-purple-400 transition-all"
                          >
                            <Eye size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Download Version">
                          <button
                            onClick={() =>
                              handleDownloadVersion(ver.version, ver.originalname)
                            }
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-emerald-400 transition-all"
                          >
                            <Download size={15} />
                          </button>
                        </Tooltip>
                        {!isCurrent && (
                          <Tooltip text="Restore to Latest">
                            <button
                              disabled={restoringVersion !== null}
                              onClick={() => handleRestoreVersion(ver.version)}
                              className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-blue-400 transition-all disabled:opacity-30"
                            >
                              {restoringVersion === ver.version ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <RotateCcw size={15} />
                              )}
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Nested Preview Modal for Specific Versions */}
      {previewVer && (
        <FilePreviewModal
          open={!!previewVer}
          onClose={() => setPreviewVer(null)}
          document={{
            ...doc,
            originalname: previewVer.originalname,
            mimeType: previewVer.mimeType,
          }}
          downloadUrl={documentService.getVersionDownloadUrl(
            docId,
            previewVer.version
          )}
          previewUrl={documentService.getVersionPreviewUrl(
            docId,
            previewVer.version
          )}
        />
      )}
    </Modal>
  );
}
