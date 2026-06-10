/**
 * Dashboard Layout
 *
 * Improvements:
 * - Folders page added
 * - MyLogs for employees
 * - Page titles/subs updated
 */

import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import DashboardHome from "./DashboardHome";
import Documents from "./Documents";
import Uploads from "./Uploads";
import Admin from "./Admin";
import Logs from "./Logs";
import Folders from "./Folders";

const PAGE_META = {
  Dashboard:       { title: "Dashboard",        sub: "Organization overview and activity" },
  Documents:       { title: "Documents",         sub: "Browse, search and manage all documents" },
  Folders:         { title: "Folders",           sub: "Organize documents into folders" },
  Uploads:         { title: "Upload Files",      sub: "Upload new files to the document vault" },
  "Admin Setting": { title: "User Management",  sub: "Manage employees and access roles" },
  Logs:            { title: "Audit Logs",        sub: "Full activity audit trail" },
  MyLogs:          { title: "My Activity",       sub: "Your personal activity history" },
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const { isAdmin } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":     return <DashboardHome onNavigate={setActiveTab} />;
      case "Documents":     return <Documents />;
      case "Folders":       return <Folders />;
      case "Uploads":       return <Uploads />;
      case "Admin Setting": return isAdmin ? <Admin /> : null;
      case "Logs":          return isAdmin ? <Logs /> : null;
      case "MyLogs":        return <Logs />;
      default:              return <div className="text-center py-20 text-slate-500">Coming soon…</div>;
    }
  };

  const meta = PAGE_META[activeTab] || PAGE_META.Dashboard;

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-white font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-8 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{meta.title}</h1>
            <p className="text-slate-500 text-xs mt-0.5">{meta.sub}</p>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.03] blur-[150px] -z-10 pointer-events-none" />
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
