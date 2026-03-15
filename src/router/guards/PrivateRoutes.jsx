import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading, initialized, tryRestoreSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    tryRestoreSession();
  }, []);

  if (!initialized || loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}