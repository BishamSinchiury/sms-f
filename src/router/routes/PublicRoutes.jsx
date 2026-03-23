// FIX 2 (BUG 13): Removed /here route and `here` import — it was a placeholder
// with a lowercase component name (<here /> renders as an unknown HTML element).
// Login.jsx no longer redirects to /here (it uses /app/profile/setup instead).

import Home from "@/pages/Website/Home/Home";

export const publicRoutes = [
  { path: "/", element: <Home /> },
]
