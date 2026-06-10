import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/UI";
import Loginimg from "../assets/Login-ill.svg";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(form);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-hidden">
      {/* Background Blur Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/10 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl font-extrabold shadow-lg shadow-blue-500/30">D</div>
          <h1 className="text-2xl font-bold tracking-wide">Docu<span className="text-blue-400">Flow</span></h1>
        </div>
        <span className="text-xs text-slate-500 border border-white/10 px-3 py-1.5 rounded-full">Enterprise DMS</span>
      </nav>

      {/* Main */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-88px)]">
        {/* Left */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10 py-16">
          <div className="max-w-xl">
            <p className="text-blue-400 font-medium mb-4 tracking-widest uppercase text-sm">Centralized Document Management</p>
            <h1 className="text-5xl md:text-6xl font-black leading-tight">
              Manage Your Files<span className="block text-blue-400">Securely & Easily</span>
            </h1>
            <p className="mt-6 text-gray-400 text-lg leading-relaxed">
              Access, organize, and protect all your important documents in one modern cloud-based platform built for teams and businesses.
            </p>
            <div className="flex items-center gap-4 mt-8">
              {["RBAC Security","Version Control","Audit Logs"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{f}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12">
            <img src={Loginimg} alt="Login Illustration" className="w-full max-w-lg drop-shadow-[0_0_40px_rgba(59,130,246,0.35)]" />
          </div>
        </div>

        {/* Right - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl shadow-black/40">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Welcome Back 👋</h2>
              <p className="text-gray-400 mt-3">Sign in to continue to your dashboard.</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm text-gray-300 font-medium">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com" required
                  className="w-full bg-[#0b1120] border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none rounded-2xl px-5 py-4 transition-all text-white placeholder:text-gray-500" />
              </div>
              <div>
                <label className="block mb-2 text-sm text-gray-300 font-medium">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" required
                  className="w-full bg-[#0b1120] border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none rounded-2xl px-5 py-4 transition-all text-white placeholder:text-gray-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 transition-all duration-300 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                {loading ? <><Spinner size={20} /> Signing in...</> : "Sign In to Dashboard"}
              </button>
            </form>

            <p className="text-center text-slate-600 text-xs mt-6">
              Contact your admin to create an account.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-5 text-center text-gray-500 text-sm">
        © 2026 DocuFlow. All Rights Reserved.
      </footer>
    </div>
  );
}
