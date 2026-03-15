import { createContext, useContext, useState } from "react";
import publicApi from "@/services/axios/publicApi";
import { tokenStore } from "@/services/axios/tokenStore";

const AuthContext = createContext(null);

/**
 * AuthProvider — general user authentication context.
 *
 * LAZY INITIALIZATION: No API calls on mount. The provider starts in an
 * un-initialized state (initialized=false, loading=false). Session
 * restoration happens only when:
 *   1. A route guard calls `tryRestoreSession()`, or
 *   2. The user explicitly logs in via `login()`.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    /**
     * Attempt to restore an existing session via refresh token.
     * Call this from route guards when loading protected / guest routes.
     * Skips the call if already initialized.
     */
    async function tryRestoreSession() {
        if (initialized) return;
        setLoading(true);
        try {
            const res = await publicApi.post("/user/token/refresh/");
            tokenStore.set(res.data.access);
            setUser(res.data.user);
        } catch {
            tokenStore.clear();
            setUser(null);
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }

    async function login(email, password) {
        const res = await publicApi.post("/user/login/", { email, password });
        tokenStore.set(res.data.access);
        setUser(res.data.user);
        setInitialized(true);
    }

    async function logout() {
        try {
            await publicApi.post("/user/logout/");
        } finally {
            tokenStore.clear();
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, initialized, login, logout, tryRestoreSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}