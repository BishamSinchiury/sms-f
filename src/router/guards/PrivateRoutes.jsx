import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "@/components/layout/AppLayout/AppLayout";

function FullPageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Verifying session...</p>
    </div>
  );
}

export function PrivateRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const { profile_complete, membership_status } = user ?? {};

  // Zone B checks — redirect non-active users to profile setup or status page.
  // FIX 6 (BUG 12): waiting_approval intentionally goes to /app/profile/setup, NOT /setup/status.
  // ProfileSetup.jsx handles waiting_approval by showing a read-only status card (via showForm=false).
  // Only 'suspended' goes to /setup/status (StatusPage), which is a separate terminal page.
  if (!profile_complete) return <Navigate to="/app/profile/setup" replace />;
  if (membership_status === 'pending') return <Navigate to="/app/profile/setup" replace />;
  if (membership_status === 'waiting_approval') return <Navigate to="/app/profile/setup" replace />;
  if (membership_status === 'rejected')  return <Navigate to="/app/profile/setup"  replace />;
  if (membership_status === 'suspended') return <Navigate to="/setup/status" replace />;

  // Zone C - Full Access
  return <AppLayout>{children}</AppLayout>;
}

export function SetupRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

// Preserve default export for backward compatibility in routing files, though we will update them next.
export default PrivateRoute;