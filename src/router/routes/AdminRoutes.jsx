import AdminRoute from "@/router/guards/AdminRoutes";
import AdminDashboard from "@/pages/admin/AdminDashboard";

export const adminRoutes = [
  { path: "/app/admin/dashboard", element: <AdminRoute><AdminDashboard /></AdminRoute> },
];