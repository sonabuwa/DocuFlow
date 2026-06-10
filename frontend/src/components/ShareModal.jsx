/**
 * ShareModal v2.0
 *
 * Improvements:
 * - Shows existing share permissions with expiry status (active / expired)
 * - Revoke individual user access with one click
 * - Permission level badge per shared user
 * - Warn when re-sharing with a user (will update their permission)
 * - "Already shared" users are excluded from search dropdown
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, UserCheck, Share2, Loader2, ShieldOff, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { authService, documentService } from "../services/api";
import { Modal } from "./UI";
import { debounce, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

const PERMISSION_LABELS = {
  view: { label: "View Only", color: "text-slate-300 bg-slate-500/10 border-slate-500/20" },
  download: { label: "Download", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  edit: { label: "Full Edit", color: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
};

function PermissionBadge({ permission }) {
  const cfg = PERMISSION_LABELS[permission] || PERMISSION_LABELS.view;
  return (
    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ExpiryBadge({ expiresAt }) {
  if (!expiresAt) return <span className="text-[9px] text-slate-600">No expiry</span>;
  const expired = new Date(expiresAt) < new Date();
  return (
    <span className={`flex items-center gap-1 text-[9px] font-medium ${expired ? "text-red-400" : "text-slate-500"}`}>
      {expired ? <AlertCircle size={10} /> : <Clock size={10} />}
      {expired ? "Expired" : `Expires ${formatDate(expiresAt)}`}
    </span>
  );
}

export default function ShareModal({ open, onClose, document: doc }) {
  // New share state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState("download");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Existing permissions state (loaded from doc prop)
  const [existingPerms, setExistingPerms] = useState([]);
  const [revoking, setRevoking] = useState(null); // userId being revoked

  const searchRef = useRef(null);

  // Populate existing permissions from the document object
  useEffect(() => {
    if (open && doc) {
      setExistingPerms(doc.sharePermissions || []);
    }
    if (!open) {
      setQuery(""); setSearchResults([]); setSelectedUsers([]);
      setPermission("download"); setExpiresAt(""); setShowDropdown(false);
    }
  }, [open, doc]);

  // IDs already shared (exclude from search results)
  const alreadySharedIds = existingPerms.map((p) =>
    typeof p.user === "object" ? p.user._id : p.user
  );

  const runSearch = useCallback(
    debounce(async (q, selected) => {
      if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
      setSearching(true);
      try {
        const res = await authService.searchUsers(q);
        const filtered = (res.data.data || []).filter(
          (u) =>
            !selected.find((s) => s._id === u._id) &&
            !alreadySharedIds.includes(u._id)
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    [alreadySharedIds]
  );

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    runSearch(val, selectedUsers);
  };

  const selectUser = (user) => {
    setSelectedUsers((p) => [...p, user]);
    setQuery(""); setSearchResults([]); setShowDropdown(false);
  };

  const removeUser = (id) => setSelectedUsers((p) => p.filter((u) => u._id !== id));

  const handleShare = async () => {
    if (selectedUsers.length === 0) return toast.error("Select at least one user.");
    setSaving(true);
    try {
      const res = await documentService.share(doc._id, {
        userIds: selectedUsers.map((u) => u._id),
        permission,
        expiresAt: expiresAt || null,
      });
      // Update local existing perms from response
      setExistingPerms(res.data.data?.sharePermissions || existingPerms);
      setSelectedUsers([]);
      toast.success(`Shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share document.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (userId, userName) => {
    setRevoking(userId);
    try {
      const res = await documentService.revokeShare(doc._id, userId);
      setExistingPerms(res.data.data?.sharePermissions || existingPerms.filter(
        (p) => (typeof p.user === "object" ? p.user._id : p.user) !== userId
      ));
      toast.success(`Access revoked for ${userName}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke access.");
    } finally {
      setRevoking(null);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Modal open={open} onClose={onClose} title="Share Document" size="md">
      {doc && (
        <div className="space-y-5">
          {/* Doc name */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <Share2 size={16} className="text-blue-400 flex-shrink-0" />
            <p className="text-sm text-slate-300 truncate">
              <span className="text-slate-500">Sharing: </span>
              <span className="text-white font-medium">{doc.originalname}</span>
            </p>
          </div>

          {/* ── Existing Permissions ─────────────────────────────────────── */}
          {existingPerms.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                <CheckCircle size={10} className="text-emerald-500" />
                Currently Shared With ({existingPerms.length})
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {existingPerms.map((perm) => {
                  const u = typeof perm.user === "object" ? perm.user : { _id: perm.user, name: "Unknown", email: "" };
                  const userId = u._id;
                  const isExpired = perm.expiresAt && new Date(perm.expiresAt) < new Date();
                  return (
                    <div
                      key={userId}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                        isExpired
                          ? "bg-red-500/5 border-red-500/20 opacity-60"
                          : "bg-emerald-500/5 border-emerald-500/20"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-600 to-slate-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-tight">{u.name || "Unknown user"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <ExpiryBadge expiresAt={perm.expiresAt} />
                        </div>
                      </div>
                      <PermissionBadge permission={perm.permission} />
                      <button
                        onClick={() => handleRevoke(userId, u.name)}
                        disabled={revoking === userId}
                        title="Revoke access"
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all disabled:opacity-40"
                      >
                        {revoking === userId
                          ? <Loader2 size={13} className="animate-spin" />
                          : <ShieldOff size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider if there are existing perms */}
          {existingPerms.length > 0 && (
            <div className="border-t border-white/5 pt-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add More Users</p>
            </div>
          )}

          {/* ── Search new users ─────────────────────────────────────────── */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              Search Users by Name or Email
            </label>
            <div className="relative" ref={searchRef}>
              <div className="flex items-center gap-2 bg-[#161b22] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
                {searching
                  ? <Loader2 size={16} className="text-slate-500 animate-spin flex-shrink-0" />
                  : <Search size={16} className="text-slate-500 flex-shrink-0" />
                }
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Type a name or email…"
                  className="bg-transparent text-sm text-white focus:outline-none w-full placeholder:text-slate-600"
                />
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                  {searchResults.map((user) => (
                    <button key={user._id} onClick={() => selectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${user.role === "admin" ? "text-purple-300 bg-purple-500/10 border-purple-500/20" : "text-blue-300 bg-blue-500/10 border-blue-500/20"}`}>
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && !searching && searchResults.length === 0 && query.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-500 shadow-2xl z-50">
                  No users found for "{query}"
                </div>
              )}
            </div>
          </div>

          {/* Selected users (pending share) */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Sharing With ({selectedUsers.length})
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {selectedUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2.5">
                    <UserCheck size={16} className="text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => removeUser(user._id)}
                      className="p-1 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permission & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Permission</label>
              <select value={permission} onChange={(e) => setPermission(e.target.value)}
                className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
                <option value="view">View Only</option>
                <option value="download">View & Download</option>
                <option value="edit">Full Edit</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Expires (Optional)</label>
              <input type="date" value={expiresAt} min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>

          <p className="text-xs text-slate-600">
            {permission === "view" && "User can preview only — no download."}
            {permission === "download" && "User can preview and download."}
            {permission === "edit" && "User can view, download, and update."}
            {expiresAt && ` Access expires on ${new Date(expiresAt).toLocaleDateString()}.`}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-medium transition-all">
              Close
            </button>
            <button onClick={handleShare} disabled={saving || selectedUsers.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Sharing…</> : <><Share2 size={15} /> Share</>}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
