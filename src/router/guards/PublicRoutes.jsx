// publicRoutes.jsx guard

import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { publicRoutes } from "../routes/PublicRoutes";

/**
 * UserGuestRoute
 * --------------
 * Wraps /login and /register.
 * Only mounted inside <AuthProvider>, so it only reads the user auth context.
 * Calls tryRestoreSession() on mount to check for existing session.
 * If the user is already logged in, redirect them to the user dashboard.
 */
export function UserGuestRoute({ children }) {
  const { user, initialized } = useAuth();

  // FIX 7 (BUG 8): Show spinner instead of blank screen during session restore.
  if (!initialized) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Restoring session...</p>
    </div>
  );

  if (user) {
    // BUG 5 FIX: Route directly to the correct destination instead of always
    // going to /app/dashboard and forcing PrivateRoute to do a second redirect.
    const status = user.membership_status;
    if (status === 'suspended') {
      return <Navigate to="/setup/status" replace />;
    }
    if (status === 'pending' || status === 'waiting_approval' || status === 'rejected') {
      return <Navigate to="/app/profile/setup" replace />;
    }
    // Active user (or unknown status) → dashboard
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
  }, [tryRestoreSession]);

  // Fix: Removed `|| loading` from the guard to prevent the AdminLogin page
  // from instantly unmounting and flashing blank when credentials are submitted.
  if (!initialized) return null;

  if (authStep === "authed") {
    return <Navigate to="/app/admin/dashboard" replace />;
  }

  return children;
}