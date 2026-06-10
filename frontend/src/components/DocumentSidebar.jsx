import { useState, useEffect, useRef } from "react";
import {
  X, Eye, Download, Trash2, PlusCircle, RotateCcw,
  Loader2, FileText
} from "lucide-react";
import { documentService } from "../services/api";
import { FileIcon } from "./FileIcon";
import { FilePreviewModal } from "./UI";
import { formatBytes } from "../utils/helpers";
import toast from "react-hot-toast";

export default function DocumentSidebar({ docId, onClose, onDocumentUpdated, onDeleteDocument }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [changelog, setChangelog] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [deletingVersion, setDeletingVersion] = useState(null);
  const [previewVer, setPreviewVer] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocDetails = async () => {
    setLoading(true);
    try {
      const res = await documentService.getOne(docId);
      setDoc(res.data.data);
    } catch {
      toast.error("Failed to load document details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocDetails();
      // Reset local form states
      setFile(null);
      setChangelog("");
      setUploading(false);
      setUploadProgress(0);
    } else {
      setDoc(null);
    }
  }, [docId]);

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
      await fetchDocDetails();
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload new version.");
    } finally {
      setUploading(false);
    }
  };

  const handleRestoreVersion = async (versionNum) => {
    if (window.confirm(`Are you sure you want to restore Version ${versionNum}?`)) {
      setRestoringVersion(versionNum);
      try {
        await documentService.restoreVersion(docId, versionNum);
        toast.success(`Restored to version ${versionNum}!`);
        await fetchDocDetails();
        if (onDocumentUpdated) onDocumentUpdated();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to restore version.");
      } finally {
        setRestoringVersion(null);
      }
    }
  };

  const handleDeleteVersion = async (versionNum) => {
    if (window.confirm(`Are you sure you want to delete Version ${versionNum}?`)) {
      setDeletingVersion(versionNum);
      try {
        const res = await documentService.deleteVersion(docId, versionNum);
        toast.success(`Deleted version ${versionNum}!`);
        
        if (res.data.deletedDocument) {
          // Entire document was deleted because it had only 1 version left
          onClose();
          if (onDeleteDocument) onDeleteDocument(docId);
        } else {
          await fetchDocDetails();
          if (onDocumentUpdated) onDocumentUpdated();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete version.");
      } finally {
        setDeletingVersion(null);
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

  const handleDownloadActive = () => {
    if (!doc) return;
    fetch(documentService.getDownloadUrl(doc._id), {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = doc.originalname;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Download failed."));
  };

  const handleDeleteAll = () => {
    if (!doc) return;
    if (window.confirm(`Delete "${doc.originalname}"? This moves the document and all its versions to the trash.`)) {
      documentService.delete(doc._id)
        .then(() => {
          toast.success("Document deleted.");
          onClose();
          if (onDeleteDocument) onDeleteDocument(doc._id);
        })
        .catch((err) => toast.error(err.response?.data?.message || "Delete failed."));
    }
  };

  const getVersionsList = () => {
    if (!doc) return [];
    if (doc.versions && doc.versions.length > 0) {
      return [...doc.versions].sort((a, b) => b.version - a.version);
    }
    return [
      {
        version: 1,
        filename: doc.filename,
        originalname: doc.originalname,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        changelog: "Initial document import.",
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
      },
    ];
  };

  // Format short display ID
  const getShortId = (id) => {
    if (!id) return "";
    return id.substring(0, 8).toUpperCase();
  };

  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("hi-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatVersionDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const formatted = date.toLocaleString("hi-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return formatted.replace(/\s?(am|pm)/i, (_, meridiem) => `, ${meridiem.toLowerCase()}`);
  };

  const versions = getVersionsList();

  if (!docId) return null;

  return (
    <div className="w-[min(420px,35vw)] h-full flex flex-col bg-[#0b0e14] border-l border-white/10 shadow-2xl shadow-black/40 flex-shrink-0 animate-slide-in overflow-y-auto">
      {loading && !doc ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm">Loading details…</p>
        </div>
      ) : !doc ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Document not found.
        </div>
      ) : (
        <div className="p-6 flex-1 flex flex-col">
          <div className="space-y-6 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/5 rounded-2xl">
                  <FileIcon mimeType={doc.mimeType} filename={doc.originalname} size={28} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-white text-base truncate max-w-[220px]">
                    {doc.originalname}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                    Vault ID: {getShortId(doc._id)} • Created {formatCreatedDate(doc.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewVer(versions.find(v => v.version === doc.version) || doc)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={handleDownloadActive}
                className="flex-1 py-2 rounded-xl bg-[#5f5ce5] hover:bg-[#4d4acb] text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download size={14} /> Download Active
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 size={14} /> Delete All
              </button>
            </div>

            <div className="border-t border-white/5" />

            {/* Version Timeline Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                Version Timeline
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[#5f5ce5]/25 bg-[#5f5ce5]/10 text-[#8b88f0]">
                {versions.length} version{versions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Dotted Upload New Version Box */}
            {uploading ? (
              <div className="space-y-2 py-4 bg-white/[0.01] border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-[#5f5ce5]" size={14} />
                    Uploading new version...
                  </span>
                  <span className="font-mono text-[10px]">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5f5ce5] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : file ? (
              <form onSubmit={handleUploadVersion} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 p-2 bg-[#161b22] border border-white/5 rounded-lg">
                  <FileText size={16} className="text-[#5f5ce5]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                </div>
                <div>
                  <input
                    type="text"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="Changelog description (e.g. love)"
                    className="w-full bg-[#161b22] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#5f5ce5]/50"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setChangelog("");
                    }}
                    className="px-3 py-1.5 border border-white/10 rounded-lg text-slate-400 hover:bg-white/5 text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#5f5ce5] hover:bg-[#4d4acb] rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer"
                  >
                    Upload Version
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all bg-white/[0.005] cursor-pointer"
              >
                <PlusCircle size={14} className="text-slate-400 group-hover:text-white" />
                Upload new version of this file
              </button>
            )}

            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            {/* Timeline List */}
            <div className="relative border-l border-white/10 ml-3 pl-6 space-y-4 py-2 mt-4">
              {versions.map((ver, idx) => {
                const isCurrent = ver.version === (doc.version || 1);
                return (
                  <div key={idx} className="relative">
                    {/* Node Dot */}
                    {isCurrent ? (
                      <span className="absolute -left-[30px] top-4 w-3.5 h-3.5 rounded-full bg-[#5f5ce5] border border-[#5f5ce5] ring-4 ring-[#5f5ce5]/20 flex items-center justify-center" />
                    ) : (
                      <span className="absolute -left-[29px] top-4.5 w-2.5 h-2.5 rounded-full bg-[#0b0e14] border-2 border-slate-600" />
                    )}

                    {/* Timeline version card */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all
                      ${
                        isCurrent
                          ? "bg-[#5f5ce5]/5 border-[#5f5ce5]/25"
                          : "bg-white/[0.005] border-white/5 hover:border-white/10"
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            Version {ver.version}.0
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {formatVersionDate(ver.createdAt)}
                        </span>
                      </div>

                      {/* Changelog description */}
                      <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap break-words leading-relaxed">
                        {ver.changelog || "Initial document import."}
                      </p>

                      {/* Bottom Info & Action Row */}
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <div className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]" title={`Original: ${ver.originalname}`}>
                          {formatBytes(ver.fileSize)} • Original: {ver.originalname}
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {!isCurrent && (
                            <button
                              disabled={restoringVersion !== null}
                              onClick={() => handleRestoreVersion(ver.version)}
                              className="text-[10px] font-bold text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-0.5 disabled:opacity-30 cursor-pointer"
                            >
                              {restoringVersion === ver.version ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <RotateCcw size={11} />
                              )}
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDownloadVersion(ver.version, ver.originalname)
                            }
                            className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                          >
                            <Download size={11} /> Save
                          </button>
                          <button
                            disabled={deletingVersion !== null}
                            onClick={() => handleDeleteVersion(ver.version)}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                          >
                            {deletingVersion === ver.version ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Embedded File Preview Overlay */}
      {previewVer && (
        <FilePreviewModal
          open={!!previewVer}
          onClose={() => setPreviewVer(null)}
          document={{
            ...doc,
            originalname: previewVer.originalname,
            mimeType: previewVer.mimeType,
          }}
          downloadUrl={
            previewVer._id === doc._id
              ? documentService.getDownloadUrl(doc._id)
              : documentService.getVersionDownloadUrl(doc._id, previewVer.version)
          }
          previewUrl={
            previewVer._id === doc._id
              ? documentService.getPreviewUrl(doc._id)
              : documentService.getVersionPreviewUrl(doc._id, previewVer.version)
          }
        />
      )}
    </div>
  );
}
