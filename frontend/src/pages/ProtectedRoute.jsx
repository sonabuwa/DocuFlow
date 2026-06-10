// Legacy ProtectedRoute kept for compatibility.
// App.jsx now uses AuthContext-based inline guards.
// This file can be safely removed in a future cleanup.
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}
