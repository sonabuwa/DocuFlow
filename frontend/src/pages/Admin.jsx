/**
 * Admin Page - User Management
 *
 * Improvements:
 * - ConfirmDialog replaces window.confirm
 * - Inline form validation
 * - Password strength indicator
 * - Role badge colors
 * - User stats summary
 */

import { useState, useEffect } from "react";
import { UserPlus, Mail, Lock, ShieldCheck, Trash2, Search, Plus, UserCircle, Users } from "lucide-react";
import { authService } from "../services/api";
import { Spinner, ConfirmDialog } from "../components/UI";
import { formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

const passwordStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score === 3) return { label: "Fair", color: "bg-yellow-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
};

export default function Admin() {
  const [employees, setEmployees] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    authService.getUsers()
      .then((res) => setEmployees(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setFetching(false));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) e.password = "Must have uppercase, lowercase, and a number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await authService.signup(form);
      toast.success(`Account created for ${form.name}.`);
      setForm({ name: "", email: "", password: "", role: "employee" });
      setErrors({});
      const res = await authService.getUsers();
      setEmployees(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await authService.deleteUser(deleteTarget._id);
      setEmployees((p) => p.filter((u) => u._id !== deleteTarget._id));
      toast.success(`${deleteTarget.name} deleted.`);
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const pwStrength = passwordStrength(form.password);
  const filtered = employees.filter((e) =>
    e.name?.toLowerCase().includes(filter.toLowerCase()) ||
    e.email?.toLowerCase().includes(filter.toLowerCase())
  );

  const adminCount = employees.filter((e) => e.role === "admin").length;
  const employeeCount = employees.filter((e) => e.role !== "admin").length;

  return (
    <div className="space-y-8">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: employees.length, color: "text-white" },
          { label: "Admins", value: adminCount, color: "text-purple-400" },
          { label: "Employees", value: employeeCount, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <section className="lg:col-span-1">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500"><UserPlus size={20} /></div>
              <h2 className="text-lg font-bold">Add Employee</h2>
            </div>
            <form onSubmit={handleAdd} className="space-y-4" noValidate>
              {[
                { key: "name", label: "Full Name", type: "text", icon: UserCircle, ph: "Jane Smith" },
                { key: "email", label: "Work Email", type: "email", icon: Mail, ph: "jane@company.com" },
                { key: "password", label: "Initial Password", type: "password", icon: Lock, ph: "••••••••" },
              ].map(({ key, label, type, icon: Icon, ph }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={type}
                      placeholder={ph}
                      value={form[key]}
                      onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: "" }); }}
                      className={`w-full bg-[#161b22] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none placeholder:text-slate-600 transition-colors ${errors[key] ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-blue-500/50"}`}
                    />
                  </div>
                  {key === "password" && form.password && (
                    <div className="mt-1.5">
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pwStrength?.color}`} style={{ width: pwStrength?.width }} />
                      </div>
                      <p className={`text-[10px] mt-1 ${pwStrength?.color.replace("bg-", "text-")}`}>{pwStrength?.label}</p>
                    </div>
                  )}
                  {errors[key] && <p className="text-[10px] text-red-400 mt-1">{errors[key]}</p>}
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Access Level</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[#161b22] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2">
                {saving ? <Spinner size={16} /> : <Plus size={16} />}
                {saving ? "Creating…" : "Create Account"}
              </button>
            </form>
          </div>
        </section>

        {/* Employee Table */}
        <section className="lg:col-span-2">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4">
              <h3 className="font-bold flex items-center gap-2">
                <Users size={16} className="text-slate-400" /> Team Members
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter users…"
                  className="bg-[#0d1117] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500/50 w-48" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase tracking-[0.15em] border-b border-white/5">
                    {["Employee", "Role", "Last Login", "Joined", ""].map((h) => (
                      <th key={h} className="px-6 py-4 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {fetching ? (
                    <tr><td colSpan={5} className="text-center py-16 text-slate-500">
                      <Spinner size={24} className="text-blue-500 mx-auto" />
                    </td></tr>
                  ) : filtered.map((emp) => (
                    <tr key={emp._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {emp.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${emp.role === "admin" ? "bg-purple-500/10 text-purple-300 border-purple-500/20" : "bg-blue-500/10 text-blue-300 border-blue-500/20"}`}>
                          <ShieldCheck size={12} /> {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {emp.lastLogin ? formatDate(emp.lastLogin) : "Never"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(emp.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setDeleteTarget(emp)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!fetching && filtered.length === 0 && (
                <div className="py-16 text-center text-slate-500 text-sm">
                  {filter ? "No users match your filter." : "No employees yet. Add your first team member."}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteTarget?.name}? Their documents will remain in the system.`}
        confirmLabel="Delete User"
        danger
      />
    </div>
  );
}
