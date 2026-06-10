import { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, Tag, FolderOpen } from "lucide-react";
import { folderService } from "../services/api";
import { FileIcon } from "../components/FileIcon";
import { formatBytes } from "../utils/helpers";
import toast from "react-hot-toast";

const CATEGORIES = ["General","Finance","HR","Legal","Projects","Marketing","IT","Other"];
const MAX_MB = 50;

export default function Uploads() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads,    setUploads]    = useState([]);
  const [form, setForm] = useState({ description: "", tags: "", category: "General", folder: "" });
  const [folders, setFolders] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    folderService.getAll().then((r) => setFolders(r.data.data || [])).catch(() => {});
  }, []);

  const updateUpload = (id, patch) =>
    setUploads((p) => p.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const processFiles = (files) => {
    const snapshot = { ...form };
    for (const file of files) {
      if (file.size > MAX_MB * 1024 * 1024) { toast.error(`"${file.name}" exceeds ${MAX_MB} MB.`); continue; }
      const entry = { id: `${Date.now()}-${Math.random()}`, file, name: file.name, size: file.size, type: file.type, status: "uploading", progress: 0, error: null };
      setUploads((p) => [entry, ...p]);
      runUpload(entry, snapshot);
    }
  };

  const runUpload = (entry, snap) => {
    const fd = new FormData();
    fd.append("file",        entry.file);
    fd.append("description", snap.description);
    fd.append("tags",        snap.tags);
    fd.append("category",    snap.category);
    if (snap.folder) fd.append("folder", snap.folder);

    const xhr   = new XMLHttpRequest();
    const token = localStorage.getItem("token");
    const base  = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) updateUpload(entry.id, { progress: Math.round((e.loaded / e.total) * 100) });
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        updateUpload(entry.id, { status: "done", progress: 100 });
        toast.success(`"${entry.name}" uploaded!`);
      } else {
        let msg = "Upload failed";
        try { msg = JSON.parse(xhr.responseText).message || msg; } catch {}
        updateUpload(entry.id, { status: "error", progress: 0, error: msg });
        toast.error(msg);
      }
    });
    xhr.addEventListener("error", () => {
      updateUpload(entry.id, { status: "error", progress: 0, error: "Network error" });
      toast.error("Network error");
    });
    xhr.open("POST", `${base}/documents/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(fd);
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); };
  const removeUpload   = (id) => setUploads((p) => p.filter((u) => u.id !== id));
  const clearCompleted = ()   => setUploads((p) => p.filter((u) => u.status !== "done"));
  const doneCount  = uploads.filter((u) => u.status === "done").length;
  const errorCount = uploads.filter((u) => u.status === "error").length;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Metadata Form */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <FolderOpen size={16} className="text-blue-400" /> File Metadata
          <span className="text-slate-600 text-xs font-normal ml-1">(applied to next upload)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-xs">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field w-full">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Destination Folder</label>
            <select value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} className="input-field w-full">
              <option value="">Root (no folder)</option>
              {folders.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Tags (comma-separated)</label>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="finance, q4, report" className="input-field w-full pl-9" />
            </div>
          </div>
          <div>
            <label className="label-xs">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..." className="input-field w-full" />
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-14 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group
          ${isDragging ? "border-blue-500 bg-blue-500/5 scale-[1.01]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"}`}
      >
        <input type="file" multiple className="hidden" ref={fileInputRef}
          onChange={(e) => processFiles(Array.from(e.target.files))}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.json"
        />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
          ${isDragging ? "bg-blue-500/20 text-blue-400 scale-110" : "bg-blue-600/10 text-blue-500 group-hover:scale-110"}`}>
          <UploadCloud size={32} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{isDragging ? "Drop files here" : "Drag & drop files"}</p>
          <p className="text-slate-500 text-sm mt-1">or <span className="text-blue-400">click to browse</span></p>
          <p className="text-slate-600 text-xs mt-2">PDF, DOCX, XLSX, PPTX, PNG, ZIP · Max {MAX_MB} MB per file</p>
        </div>
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Upload Queue
              {doneCount  > 0 && <span className="ml-2 text-emerald-500">{doneCount} done</span>}
              {errorCount > 0 && <span className="ml-2 text-red-500">{errorCount} failed</span>}
            </h3>
            {doneCount > 0 && <button onClick={clearCompleted} className="text-xs text-slate-500 hover:text-white transition-colors">Clear completed</button>}
          </div>
          {uploads.map((u) => (
            <div key={u.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-[#161b22] rounded-xl flex-shrink-0"><FileIcon mimeType={u.type} filename={u.name} size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1.5">
                  <p className="text-sm font-semibold text-white truncate pr-4">{u.name}</p>
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{formatBytes(u.size)}</span>
                </div>
                {u.status === "error"
                  ? <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {u.error}</p>
                  : <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-200 ${u.status === "done" ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${u.progress}%` }} />
                    </div>
                }
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {u.status === "done"      && <CheckCircle2 size={20} className="text-emerald-400" />}
                {u.status === "uploading" && <span className="text-[10px] font-bold text-blue-400 w-9 text-right">{u.progress}%</span>}
                {u.status === "error"     && <AlertCircle  size={20} className="text-red-400" />}
                <button onClick={() => removeUpload(u.id)} className="text-slate-600 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"><X size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
