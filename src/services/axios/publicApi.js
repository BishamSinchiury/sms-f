import axios from "axios";
import { defaultConfig } from "./config";
import { getCsrfToken } from "./crsfHelper";

const publicApi = axios.create(defaultConfig);

publicApi.interceptors.request.use((config)=> {
    const unsafeMethods = ["post", "put", "patch", "delete"];
    if (unsafeMethods.includes(config.method)) {
        config.headers["X-CSRFToken"] = getCsrfToken();
    }
    return config;
});

export default publicApi;