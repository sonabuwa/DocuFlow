import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderOpen, Download, Trash2, RefreshCw, Filter,
  Eye, Share2, Tag, X, Users, User, Share, Loader2, History
} from "lucide-react";
import { documentService } from "../services/api";
import { useAuth }         from "../context/AuthContext";
import { FileIcon }        from "../components/FileIcon";
import ShareModal          from "../components/ShareModal";
import DocumentSidebar     from "../components/DocumentSidebar";
import {
  EmptyState, SearchInput, Badge, SkeletonCard,
  ConfirmDialog, FilePreviewModal, Tooltip,
} from "../components/UI";
import {
  formatBytes, formatDateTime, getCategoryColor,
  debounce, timeAgo, getFileTypeLabel,
} from "../utils/helpers";
import toast from "react-hot-toast";

const CATEGORIES  = ["All","General","Finance","HR","Legal","Projects","Marketing","IT","Other"];
const FILE_TYPES  = ["All","pdf","word","excel","powerpoint","image","zip"];
const SORTS = [
  { label: "Newest First",    value: "-createdAt"     },
  { label: "Oldest First",    value: "createdAt"      },
  { label: "Name A-Z",        value: "originalname"   },
  { label: "Largest",         value: "-fileSize"      },
  { label: "Most Downloaded", value: "-downloadCount" },
];
const ADMIN_TABS    = [{ id: "all",    label: "All Documents", icon: Users },
                       { id: "shared", label: "Shared",        icon: Share }];
const EMPLOYEE_TABS = [{ id: "mine",   label: "My Documents",  icon: User  },
                       { id: "shared", label: "Shared With Me", icon: Share }];

// ── Document Card ─────────────────────────────────────────────────────────────
function DocumentCard({ doc, isAdmin, owned, onDownload, onDelete, onSelect, isSelected }) {
  const fileExt = doc.originalname.split(".").pop().toUpperCase() || "File";
  
  return (
    <div
      onClick={() => onSelect(doc)}
      className={`group bg-[#0d1117]/40 border rounded-2xl p-5 hover:bg-[#0d1117]/75 hover:border-white/10 transition-all flex flex-col justify-between h-[180px] cursor-pointer relative overflow-hidden select-none ${
        isSelected ? "border-[#5f5ce5]/40 bg-[#5f5ce5]/5 ring-1 ring-[#5f5ce5]/20 shadow-lg shadow-[#5f5ce5]/5" : "border-white/5"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-white/5 rounded-xl flex-shrink-0">
          <FileIcon mimeType={doc.mimeType} filename={doc.originalname} size={22} />
        </div>
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
          v{doc.version || 1}.0
        </Badge>
      </div>
      
      <div className="min-w-0 flex-1 mt-3">
        <h3 className="font-bold text-white text-sm truncate" title={doc.originalname}>
          {doc.originalname}
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">
          Format: {fileExt}
        </p>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Size: {formatBytes(doc.fileSize)}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-[10px] text-slate-600 font-medium" title={formatDateTime(doc.updatedAt || doc.createdAt)}>
          Updated {timeAgo(doc.updatedAt || doc.createdAt)}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(doc);
            }}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-emerald-400 transition-all"
          >
            <Download size={14} />
          </button>
          {owned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc);
              }}
              className="p-1 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Documents() {
  const { user, isAdmin } = useAuth();
  const TABS = isAdmin ? ADMIN_TABS : EMPLOYEE_TABS;
  const [activeDocTab, setActiveDocTab] = useState(TABS[0].id);

  const [docs,        setDocs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("All");
  const [sort,        setSort]        = useState("-createdAt");
  const [fileType,    setFileType]    = useState("All");
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({ total: 0, pages: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const getTabParams = useCallback(() => {
    if (isAdmin) return activeDocTab === "shared" ? { onlyShared: "true" } : {};
    return activeDocTab === "shared" ? { view: "shared" } : { view: "mine" };
  }, [isAdmin, activeDocTab]);

  const fetchDocs = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { search, category, sort, page, limit: 12,
        fileType: fileType !== "All" ? fileType : "", dateFrom, dateTo,
        ...getTabParams(), ...overrides };
      const res = await documentService.getAll(params);
      setDocs(res.data.data.documents);
      setPagination(res.data.data.pagination);
    } catch { toast.error("Failed to load documents.");
    } finally { setLoading(false); }
  }, [search, category, sort, page, fileType, dateFrom, dateTo, getTabParams]);

  useEffect(() => { fetchDocs(); }, // eslint-disable-next-line
    [category, sort, page, fileType, dateFrom, dateTo, activeDocTab]);

  const handleTabSwitch = (tabId) => {
    setActiveDocTab(tabId); setPage(1); setSearch("");
    setCategory("All"); setFileType("All"); setDateFrom(""); setDateTo("");
    setSelectedDocId(null); // Clear sidebar selection
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(() => { setPage(1); fetchDocs({ page: 1 }); }, 400), [fetchDocs]);
  const handleSearch = (v) => { setSearch(v); debouncedSearch(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await documentService.delete(deleteTarget._id);
      setDocs((p) => p.filter((d) => d._id !== deleteTarget._id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
      if (selectedDocId === deleteTarget._id) {
        setSelectedDocId(null);
      }
      toast.success(`"${deleteTarget.originalname}" deleted.`);
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed."); }
  };

  const handleDownload = (doc) => {
    fetch(documentService.getDownloadUrl(doc._id), { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.blob()).then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = doc.originalname; a.click();
        URL.revokeObjectURL(a.href);
      }).catch(() => toast.error("Download failed."));
  };

  const clearFilters = () => {
    setSearch(""); setCategory("All"); setFileType("All");
    setDateFrom(""); setDateTo(""); setSort("-createdAt"); setPage(1);
  };

  const isOwner = (doc) => doc.uploadedBy?._id === user?._id || doc.uploadedBy === user?._id;
  const hasActiveFilters = search || category !== "All" || fileType !== "All" || dateFrom || dateTo;

  const visibleDocs = useMemo(() => {
    if (activeDocTab === "shared") return docs;
    if (isAdmin) return docs.filter((d) => d.uploadedBy?.role === "admin");
    return docs.filter((d) => d.uploadedBy?._id === user?._id || d.uploadedBy === user?._id);
  }, [docs, isAdmin, activeDocTab, user]);

  return (
    <div className="relative h-[calc(100vh-100px)] overflow-hidden">
      {/* Dim overlay when version panel is open */}
      {selectedDocId && (
        <div
          className="absolute inset-0 bg-black/50 z-10 animate-fade-in"
          onClick={() => setSelectedDocId(null)}
        />
      )}

      {/* Documents Grid Explorer */}
      <div className="h-full overflow-y-auto pr-1 space-y-5">
        
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => handleTabSwitch(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeDocTab === id ? "bg-[#5f5ce5] text-white shadow-lg shadow-[#5f5ce5]/20" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Documents Explorer</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? activeDocTab === "all" ? "Access, filter, download, and manage your vault files." : "Showing documents shared with other users."
              : activeDocTab === "mine" ? "Access, filter, download, and manage your vault files." : "Showing documents shared with you."}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center flex-wrap">
            <SearchInput value={search} onChange={handleSearch} placeholder="Search documents, tags, descriptions…" className="flex-1 min-w-48 max-w-sm" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  className="bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 appearance-none">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
                {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Tooltip text="Advanced Filters">
                <button onClick={() => setShowFilters((p) => !p)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${showFilters ? "bg-[#5f5ce5]/20 border-[#5f5ce5]/40 text-[#5f5ce5]" : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  <Filter size={16} />
                </button>
              </Tooltip>
              <Tooltip text="Refresh">
                <button onClick={() => fetchDocs()} className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer">
                  <RefreshCw size={16} />
                </button>
              </Tooltip>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer">
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="bg-[#0d1117]/50 border border-white/5 rounded-2xl p-4 flex flex-wrap gap-4 animate-fade-in">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">File Type</label>
                <select value={fileType} onChange={(e) => { setFileType(e.target.value); setPage(1); }}
                  className="bg-[#161b22] border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none">
                  {FILE_TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">From Date</label>
                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="bg-[#161b22] border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">To Date</label>
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="bg-[#161b22] border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none" />
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">{loading ? "Loading…" : `${visibleDocs.length} document${visibleDocs.length !== 1 ? "s" : ""} found`}</p>

        {/* Document Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : visibleDocs.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={48} className="text-slate-700" />}
            title="No documents found"
            description={hasActiveFilters ? "Try different search terms or clear filters." : "No documents yet."}
            action={hasActiveFilters && (
              <button onClick={clearFilters} className="px-4 py-2 rounded-xl bg-[#5f5ce5] hover:bg-[#4d4acb] text-sm font-bold transition-all text-white">Clear Filters</button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {visibleDocs.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                isAdmin={isAdmin}
                owned={isOwner(doc)}
                onDownload={handleDownload}
                onDelete={setDeleteTarget}
                onSelect={(d) => setSelectedDocId((prev) => (prev === d._id ? null : d._id))}
                isSelected={selectedDocId === doc._id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">← Prev</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all cursor-pointer ${page === p ? "bg-[#5f5ce5] text-white" : "bg-white/[0.03] border border-white/10 text-slate-400 hover:bg-white/5"}`}>
                  {p}
                </button>
              ))}
            </div>
            <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">Next →</button>
          </div>
        )}
      </div>

      {/* Right panel: Version Timeline slide-out */}
      {selectedDocId && (
        <div className="absolute top-0 right-0 bottom-0 z-20">
          <DocumentSidebar
            docId={selectedDocId}
            onClose={() => setSelectedDocId(null)}
            onDocumentUpdated={fetchDocs}
            onDeleteDocument={(id) => {
              setDocs((p) => p.filter((d) => d._id !== id));
              setPagination((p) => ({ ...p, total: p.total - 1 }));
            }}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Document"
        message={`Delete "${deleteTarget?.originalname}"? It will be moved to Trash.`}
        confirmLabel="Delete" danger
      />
    </div>
  );
}
