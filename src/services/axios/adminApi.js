import axios from "axios";
import { defaultConfig } from "./config";
import { getCsrfToken } from "./crsfHelper";

const adminApi = axios.create(defaultConfig);


adminApi.interceptors.request.use((config) => {
  const unsafeMethods = ["post", "put", "patch", "delete"];
  if (unsafeMethods.includes(config.method)) {
    config.headers["X-CSRFToken"] = getCsrfToken();
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip the redirect for requests that explicitly opt-out (e.g. the
    // initial /sys/auth/me/ session check — a 401 there just means the
    // admin isn't logged in yet, and the context handles that gracefully).
    const silent = error.config?._silent;
    if (!silent && [401, 403].includes(error.response?.status)) {
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default adminApi;