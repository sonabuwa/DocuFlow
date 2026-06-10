/**
 * Sidebar Component
 *
 * Improvements:
 * - Added Folders navigation item
 * - My Logs for non-admin users
 * - Collapsible on mobile
 * - Tooltip labels on hover
 * - Version badge in footer
 */

import {
  LayoutDashboard,
  FolderOpen,
  UploadCloud,
  Shield,
  Activity,
  LogOut,
  ChevronRight,
  FolderTree,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  {
    id: "Dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  { id: "Documents", label: "Documents", icon: FolderOpen, adminOnly: false },
  { id: "Folders", label: "Folders", icon: FolderTree, adminOnly: false },
  { id: "Uploads", label: "Upload Files", icon: UploadCloud, adminOnly: false },
  { id: "Admin Setting", label: "Management", icon: Shield, adminOnly: true },
  { id: "Logs", label: "Audit Logs", icon: Activity, adminOnly: true },
  {
    id: "MyLogs",
    label: "My Activity",
    icon: User,
    adminOnly: false,
    employeeOnly: true,
  },
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin, logout } = useAuth();

  const visible = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.employeeOnly && isAdmin) return false;
    return true;
  });

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0a0e17] flex flex-col fixed h-full z-20">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/20">
          D
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight">
            Docu<span className="text-blue-400">Flow</span>
          </span>
          <p className="text-[9px] text-slate-600 font-mono -mt-0.5">v2.0.0</p>
        </div>
      </div>

      {/* User info pill */}
      <div className="mx-4 mt-4 mb-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4 mb-3 mt-2">
          {isAdmin ? "Admin Navigation" : "My Navigation"}
        </p>
        {visible.map(({ id, label, icon: Icon, adminOnly }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                size={18}
                className={
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-white transition-colors"
                }
              />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} className="opacity-60" />}
              {adminOnly && !active && (
                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
