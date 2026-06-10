/**
 * Activity Logs Page
 *
 * Improvements:
 * - Date range filter
 * - Action icons with colors
 * - Pagination improved
 * - Better loading/empty states
 */

import { useState, useEffect, useCallback } from "react";
import { Activity, Filter, RefreshCw, Calendar } from "lucide-react";
import { logService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, Spinner } from "../components/UI";
import { formatDateTime, getActionColor, timeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

const ACTIONS = [
  "All","LOGIN","LOGOUT","FAILED_LOGIN","REGISTER",
  "UPLOAD","DOWNLOAD","DELETE","UPDATE","VIEW","SHARE",
  "VERSION_RESTORE","RESTORE","FOLDER_CREATE","FOLDER_DELETE",
  "DOCUMENT_MOVED","USER_CREATE","USER_DELETE","PERMISSION_CHANGE"
];

const ACTION_LABELS = {
  UPLOAD: "Uploaded a file", DOWNLOAD: "Downloaded a file",
  DELETE: "Deleted a file", UPDATE: "Updated a document",
  LOGIN: "Logged in", LOGOUT: "Logged out",
  REGISTER: "Registered", VIEW: "Viewed a document",
  SHARE: "Shared a document", USER_CREATE: "Created a user",
  USER_DELETE: "Deleted a user", FAILED_LOGIN: "Failed login attempt",
  VERSION_RESTORE: "Restored a version", RESTORE: "Restored a document",
  FOLDER_CREATE: "Created a folder", FOLDER_DELETE: "Deleted a folder",
  DOCUMENT_MOVED: "Moved a document", PERMISSION_CHANGE: "Changed permissions",
};

export default function Logs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchLogs = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page, limit: 25,
        action: action !== "All" ? action : "",
        dateFrom, dateTo,
        ...overrides,
      };
      const res = isAdmin
        ? await logService.getAll(params)
        : await logService.getMy(params);
      const data = res.data.data;
      setLogs(data.logs || data);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      toast.error("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, action, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [action, page, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {isAdmin && (
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 appearance-none">
              {ACTIONS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-500" />
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" />
          <span className="text-slate-600 text-xs">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" />
        </div>
        <button onClick={() => fetchLogs()}
          className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
          <RefreshCw size={16} />
        </button>
        <span className="text-xs text-slate-500 ml-auto">{pagination.total} total events</span>
      </div>

      {/* Log List */}
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size={30} className="text-blue-500" /></div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Activity size={48} className="text-slate-700" />}
          title="No logs found"
          description="Activity logs will appear here as users interact with DocuFlow."
        />
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.03]">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                {/* Action badge */}
                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 ${getActionColor(log.action)}`}>
                  {log.action.replace("_", " ")}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    {log.user?.name || "Unknown User"}
                    <span className="text-slate-500 font-normal"> — {log.details || ACTION_LABELS[log.action] || log.action}</span>
                  </p>
                  {log.targetDocument?.originalname && (
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      📄 {log.targetDocument.originalname}
                    </p>
                  )}
                  {log.targetFolder?.name && (
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      📁 {log.targetFolder.name}
                    </p>
                  )}
                  {log.ipAddress && (
                    <p className="text-[10px] text-slate-700 mt-0.5 font-mono">{log.ipAddress}</p>
                  )}
                </div>

                {/* Time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500 font-mono">{timeAgo(log.createdAt)}</p>
                  <p className="text-[10px] text-slate-700 mt-0.5">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            ← Prev
          </button>
          <span className="text-sm text-slate-500 px-3">Page {page} of {pagination.pages}</span>
          <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
