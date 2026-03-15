import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";

import { publicRoutes } from "./routes/PublicRoutes";
import { guestUserRoutes, guestAdminRoutes } from "./routes/GuestRoutes";
import { privateRoutes } from "./routes/PrivateRoutes";
import { adminRoutes } from "./routes/AdminRoutes";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}

        <Route element={<AuthProvider><Outlet /></AuthProvider>}>
          {guestUserRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {privateRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>

        <Route element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
          {guestAdminRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          {adminRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}