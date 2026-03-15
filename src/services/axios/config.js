import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const defaultConfig = {
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
};