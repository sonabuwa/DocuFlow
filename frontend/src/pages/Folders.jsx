/**
 * Folders Page
 * New page for folder management and document organization.
 */

import { useState, useEffect } from "react";
import {
  FolderPlus, Folder, Trash2, ChevronRight, Home,
  FolderOpen, RefreshCw, Pencil, Check, X
} from "lucide-react";
import { folderService, documentService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, Spinner, ConfirmDialog } from "../components/UI";
import { FileIcon } from "../components/FileIcon";
import { formatBytes, timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

const FOLDER_COLORS = {
  blue: "text-blue-400 bg-blue-500/10",
  emerald: "text-emerald-400 bg-emerald-500/10",
  purple: "text-purple-400 bg-purple-500/10",
  orange: "text-orange-400 bg-orange-500/10",
  pink: "text-pink-400 bg-pink-500/10",
};

export default function Folders() {
  const { isAdmin } = useAuth();
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumb, setBreadcrumb] = useState([]); // [{_id, name}]
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadContent = async (folderId = null) => {
    setLoading(true);
    try {
      const [foldersRes, docsRes] = await Promise.all([
        folderService.getAll(folderId),
        documentService.getAll({ folder: folderId ? folderId : "root", limit: 20 }),
      ]);
      setFolders(foldersRes.data.data || []);
      setDocs(docsRes.data.data.documents || []);
    } catch {
      toast.error("Failed to load folder contents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContent(currentFolder); }, [currentFolder]);

  const navigateTo = async (folder) => {
    setCurrentFolder(folder._id);
    try {
      const res = await folderService.getBreadcrumb(folder._id);
      setBreadcrumb(res.data.data || []);
    } catch {}
  };

  const navigateToRoot = () => {
    setCurrentFolder(null);
    setBreadcrumb([]);
  };

  const navigateToBreadcrumb = async (item) => {
    setCurrentFolder(item._id);
    // Trim breadcrumb to this item
    const idx = breadcrumb.findIndex((b) => b._id === item._id);
    setBreadcrumb(breadcrumb.slice(0, idx + 1));
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      await folderService.create({ name: newFolderName.trim(), parentFolder: currentFolder });
      setNewFolderName("");
      toast.success("Folder created.");
      loadContent(currentFolder);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create folder.");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (id) => {
    if (!editName.trim()) return;
    try {
      await folderService.rename(id, editName.trim());
      setEditingId(null);
      toast.success("Folder renamed.");
      loadContent(currentFolder);
    } catch (err) {
      toast.error(err.response?.data?.message || "Rename failed.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await folderService.delete(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" deleted. Documents moved to root.`);
      loadContent(currentFolder);
    } catch {
      toast.error("Failed to delete folder.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
        <button onClick={navigateToRoot} className="flex items-center gap-1 hover:text-white transition-colors">
          <Home size={14} /> Root
        </button>
        {breadcrumb.map((item, idx) => (
          <div key={item._id} className="flex items-center gap-1">
            <ChevronRight size={14} />
            <button
              onClick={() => navigateToBreadcrumb(item)}
              className={`hover:text-white transition-colors ${idx === breadcrumb.length - 1 ? "text-white font-semibold" : ""}`}
            >
              {item.name}
            </button>
          </div>
        ))}
      </nav>

      {/* Create Folder Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 flex-1 max-w-sm">
          <FolderPlus size={16} className="text-blue-400 flex-shrink-0" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New folder name…"
            className="bg-transparent text-sm text-white focus:outline-none w-full placeholder:text-slate-600"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !newFolderName.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        >
          {creating ? <Spinner size={14} /> : <Plus size={14} />}
          Create
        </button>
        <button onClick={() => loadContent(currentFolder)}
          className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-blue-500" /></div>
      ) : (
        <>
          {/* Folders Grid */}
          {folders.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Folders</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {folders.map((folder) => (
                  <div key={folder._id} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer">
                    {editingId === folder._id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(folder._id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="bg-transparent border-b border-blue-500 text-sm text-white focus:outline-none w-full"
                        />
                        <button onClick={() => handleRename(folder._id)} className="text-emerald-400"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <div onClick={() => navigateTo(folder)}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue}`}>
                          <Folder size={22} />
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{folder.name}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(folder.createdAt)}</p>
                      </div>
                    )}
                    {/* Folder Actions */}
                    {editingId !== folder._id && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(folder._id); setEditName(folder.name); }}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                          <Pencil size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(folder); }}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents in this folder */}
          {docs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                Files in {currentFolder ? breadcrumb[breadcrumb.length - 1]?.name || "Folder" : "Root"}
              </p>
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc._id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 hover:bg-white/[0.03] transition-all">
                    <FileIcon mimeType={doc.mimeType} filename={doc.originalname} size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{doc.originalname}</p>
                      <p className="text-xs text-slate-500">{formatBytes(doc.fileSize)} · {timeAgo(doc.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {folders.length === 0 && docs.length === 0 && (
            <EmptyState
              icon={<FolderOpen size={48} className="text-slate-700" />}
              title="This folder is empty"
              description="Create subfolders or upload documents to organize your files here."
            />
          )}
        </>
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Folder"
        message={`Delete "${deleteTarget?.name}"? Files inside will be moved to root.`}
        confirmLabel="Delete Folder"
        danger
      />
    </div>
  );
}

// Shim: Plus icon used inside this file
function Plus({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
