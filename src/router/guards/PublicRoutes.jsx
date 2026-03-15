import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * UserGuestRoute
 * --------------
 * Wraps /login and /register.
 * Only mounted inside <AuthProvider>, so it only reads the user auth context.
 * Calls tryRestoreSession() on mount to check for existing session.
 * If the user is already logged in, redirect them to the user dashboard.
 */
export function UserGuestRoute({ children }) {
  const { user, loading, initialized, tryRestoreSession } = useAuth();

  useEffect(() => {
    tryRestoreSession();
  }, []);

  if (!initialized || loading) return null;

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

/**
 * AdminGuestRoute
 * ---------------
 * Wraps /admin/login.
 * Only mounted inside <AdminAuthProvider>, so it only reads the admin auth context.
 * Calls tryRestoreSession() on mount to check for existing admin session.
 * If the admin is already logged in, redirect them to the admin dashboard.
 */
export function AdminGuestRoute({ children }) {
  const { authStep, loading, initialized, tryRestoreSession } = useAdminAuth();

  useEffect(() => {
    tryRestoreSession();
  }, []);

  if (!initialized || loading) return null;

  if (authStep === "authed") {
    return <Navigate to="/app/admin/dashboard" replace />;
  }

  return children;
}