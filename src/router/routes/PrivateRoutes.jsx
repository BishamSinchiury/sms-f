import PrivateRoute from "@/router/guards/PrivateRoutes";
import Dashboard from "@/pages/Webapp/dashboard/dashboard";

export const privateRoutes = [
  { path: "/app/dashboard", element: <PrivateRoute><Dashboard /></PrivateRoute> },
];