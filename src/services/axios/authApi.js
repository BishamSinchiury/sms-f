import axios from "axios";
import { defaultConfig } from "./config";
import { getCsrfToken } from "./crsfHelper";
import { tokenStore } from "./tokenStore";

const authApi = axios.create(defaultConfig);

authApi.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    const unsafeMethods = ["post", "put", "patch", "delete"];
    if(unsafeMethods.includes(config.method)) {
        config.headers["X-CSRFToken"] = getCsrfToken();
    }
    return config;
});


authApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            tokenStore.clear();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default authApi;