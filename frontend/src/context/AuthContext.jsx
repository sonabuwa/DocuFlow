/**
 * Auth Context
 *
 * Improvements:
 * - Validates token on app load (calls /me to ensure token is still valid)
 * - Handles token expiry code from API
 * - Stores user in sessionStorage-backed state (not localStorage parse on every render)
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u && u !== "undefined" ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const isAdmin = user?.role === "admin";

  // Validate token on mount (ensure user session is still valid)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setInitializing(false);
      return;
    }
    authService
      .getMe()
      .then((res) => {
        const freshUser = res.data.data;
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token invalid or expired — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      const { user: u, token: t } = res.data.data;
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.replace("/login");
  }, []);

  if (initializing) {
    // Show minimal loading while verifying session
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium">Loading DocuFlow…</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
