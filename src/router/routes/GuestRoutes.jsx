// GuestRoutes.jsx
import { UserGuestRoute, AdminGuestRoute } from "@/router/guards/PublicRoutes";
import Login from "@/pages/Website/AuthPages/Login";
import Register from "@/pages/Website/AuthPages/Register";
import AdminLogin from "@/pages/Website/AuthPages/AdminLogin";

// These routes live inside <AuthProvider> in the router.
// UserGuestRoute redirects already-logged-in users to /app/dashboard.
export const guestUserRoutes = [
  { path: "/login", element: <UserGuestRoute><Login /></UserGuestRoute> },
  { path: "/register", element: <UserGuestRoute><Register /></UserGuestRoute> },
];

// This route lives inside <AdminAuthProvider> in the router.
// AdminGuestRoute redirects already-logged-in admins to /app/admin/dashboard.
export const guestAdminRoutes = [
  { path: "/admin/login", element: <AdminGuestRoute><AdminLogin /></AdminGuestRoute> },
];