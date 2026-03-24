import axios from "axios";
import { defaultConfig } from "./config";
import { getCsrfToken } from "./crsfHelper";

const publicApi = axios.create(defaultConfig);

publicApi.interceptors.request.use((config) => {
  const unsafeMethods = ["post", "put", "patch", "delete"];
  if (unsafeMethods.includes(config.method)) {
    config.headers["X-CSRFToken"] = getCsrfToken();
  }
  return config;
});
let isRefreshing = false;

publicApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    // 403 = authenticated but not authorized — do NOT redirect to login
    if (status === 403) {
      return Promise.reject(error);
    }

    // 401 = token expired — attempt refresh once
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) return Promise.reject(error);
      isRefreshing = true;

      try {
        const res = await publicApi.post('/auth/refresh/', {}, { withCredentials: true });
        const { access_token } = res.data;
        localStorage.setItem('access_token', access_token);
        publicApi.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        isRefreshing = false;
        
        return publicApi(originalRequest);   // retry with new token
      } catch {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        delete publicApi.defaults.headers.common['Authorization'];
        if (window.location.pathname !== '/login') {   // ← guard here
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default publicApi;