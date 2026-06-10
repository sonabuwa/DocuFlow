/**
 * Dashboard Home
 *
 * Improvements:
 * - Recharts upload trend line chart
 * - Top downloads section
 * - Total users stat (admin)
 * - Total views stat
 * - Better category breakdown with percentages
 */

import { useState, useEffect } from "react";
import {
  FileText, HardDrive, Download, FolderOpen, Plus, Clock,
  TrendingUp, Users, Eye, BarChart2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { documentService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatCard, Spinner, EmptyState, SectionHeader } from "../components/UI";
import { FileIcon } from "../components/FileIcon";
import { formatBytes, formatDateTime, getCategoryColor, timeAgo, getGreeting } from "../utils/helpers";

const CATEGORY_COLORS = {
  Finance: "#10b981", HR: "#3b82f6", Legal: "#a855f7",
  Projects: "#06b6d4", Marketing: "#ec4899", IT: "#f97316",
  General: "#64748b", Other: "#eab308",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161b22] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-blue-400 font-bold">{payload[0]?.value} upload{payload[0]?.value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default function DashboardHome({ onNavigate }) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentService.getStats()
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error("Stats error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner size={36} className="text-blue-500" />
      </div>
    );
  }

  const totalStorage = stats?.totalStorage || 0;
  const storagePct = Math.min((totalStorage / (1024 * 1024 * 500)) * 100, 100);

  // Fill missing days in trend with 0
  const trendData = (() => {
    const map = {};
    (stats?.uploadTrend || []).forEach((t) => { map[t._id] = t.count; });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return { date: key.slice(5), count: map[key] || 0 };
    });
  })();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Good {getGreeting()}, {user?.name?.split(" ")[0]} {isAdmin ? "👑" : "👋"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin
              ? "Here's your organization's document overview."
              : "Here's your personal document activity."}
          </p>
        </div>
        <button
          onClick={() => onNavigate("Uploads")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} /> New Upload
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Documents"
          value={stats?.totalDocs ?? 0}
          icon={<FileText size={20} />}
          sub={`${stats?.totalDeleted ?? 0} in trash`}
          accent="blue"
        />
        <StatCard
          label="Storage Used"
          value={stats?.totalStorageFormatted ?? "0 B"}
          icon={<HardDrive size={20} />}
          sub={`${storagePct.toFixed(1)}% of 500 MB`}
          accent="cyan"
        />
        {isAdmin ? (
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<Users size={20} />}
            sub="registered accounts"
            accent="purple"
          />
        ) : (
          <StatCard
            label="Shared With Me"
            value={stats?.sharedWithMe ?? 0}
            icon={<FolderOpen size={20} />}
            sub="documents shared with you"
            accent="purple"
          />
        )}
        <StatCard
          label="Uploads (7 days)"
          value={trendData.reduce((a, b) => a + b.count, 0)}
          icon={<TrendingUp size={20} />}
          sub="recent uploads"
          accent="emerald"
        />
      </div>

      {/* Storage Bar */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-slate-400" />
            <span className="text-sm font-semibold">Storage Usage</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {stats?.totalStorageFormatted} / 500 MB
          </span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${storagePct > 80 ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-blue-600 to-cyan-500"}`}
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-2">{storagePct.toFixed(1)}% used</p>
      </div>

      {/* Upload Trend Chart */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <SectionHeader icon={<TrendingUp size={16} />} title="Upload Activity — Last 7 Days" />
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />
              <Line
                type="monotone" dataKey="count" stroke="#3b82f6"
                strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <SectionHeader icon={<Clock size={16} />} title="Recent Documents">
              <button onClick={() => onNavigate("Documents")}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                View all →
              </button>
            </SectionHeader>
          </div>
          {stats?.recentDocuments?.length > 0 ? (
            <div className="divide-y divide-white/[0.03]">
              {stats.recentDocuments.map((doc) => (
                <div key={doc._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="p-2 bg-white/5 rounded-lg flex-shrink-0">
                    <FileIcon mimeType={doc.mimeType} filename={doc.originalname} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.originalname}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatBytes(doc.fileSize)} · {timeAgo(doc.createdAt)}
                      {isAdmin && doc.uploadedBy && ` · ${doc.uploadedBy.name}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${getCategoryColor(doc.category)}`}>
                    {doc.category}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 text-sm">
              No documents yet.{" "}
              <button onClick={() => onNavigate("Uploads")} className="text-blue-400 hover:underline">
                Upload your first file →
              </button>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <SectionHeader icon={<BarChart2 size={16} />} title="By Category" />
          {stats?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryBreakdown.map(({ _id: cat, count }) => {
                const total = stats.totalDocs || 1;
                const pct = Math.round((count / total) * 100);
                const color = CATEGORY_COLORS[cat] || "#64748b";
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">{cat}</span>
                      <span className="text-slate-500 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No categories yet.</p>
          )}
        </div>
      </div>

      {/* Top Downloads (Admin) */}
      {isAdmin && stats?.topDownloads?.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <SectionHeader icon={<Download size={16} />} title="Most Downloaded Files" />
          </div>
          <div className="divide-y divide-white/[0.03]">
            {stats.topDownloads.map((doc, idx) => (
              <div key={doc._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-slate-600 font-bold text-sm w-6 text-center">#{idx + 1}</span>
                <div className="p-2 bg-white/5 rounded-lg flex-shrink-0">
                  <FileIcon mimeType={doc.mimeType} filename={doc.originalname} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.originalname}</p>
                  <p className="text-xs text-slate-500">{formatBytes(doc.fileSize)}{doc.uploadedBy ? ` · ${doc.uploadedBy.name}` : ""}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 flex-shrink-0">
                  <Download size={14} />
                  <span className="text-sm font-bold">{doc.downloadCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
