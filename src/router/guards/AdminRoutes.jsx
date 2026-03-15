import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminRoute({ children }) {
  const { authStep, loading, initialized, tryRestoreSession } = useAdminAuth();
  const location = useLocation();

  useEffect(() => {
    tryRestoreSession();
  }, []);

  if (!initialized || loading) return null;

  if (authStep !== "authed") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}