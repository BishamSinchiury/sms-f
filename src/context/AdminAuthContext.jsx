import { createContext, useContext, useState } from "react";
import adminApi from "@/services/axios/adminApi";

const AdminAuthContext = createContext(null);

/**
 * AdminAuthProvider — system admin authentication context.
 *
 * LAZY INITIALIZATION: No API calls on mount. The provider starts in an
 * un-initialized state. Session restoration happens only when:
 *   1. A route guard calls `tryRestoreSession()`, or
 *   2. The admin logs in via `submitCredentials()` + `submitOtp()`.
 */
export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [authStep, setAuthStep] = useState("idle");
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Attempt to restore an existing admin session.
     * Call from route guards when loading admin routes.
     */
    async function tryRestoreSession() {
        if (initialized) return;
        setLoading(true);
        try {
            const res = await adminApi.get("/sys/auth/me/", { _silent: true });
            setAdmin(res.data);
            setAuthStep("authed");
        } catch {
            setAdmin(null);
            setAuthStep("idle");
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }

    async function submitCredentials(email, password) {
        setError(null);
        try {
            await adminApi.post("/sys/auth/login/", { email, password });
            setAuthStep("otp_pending");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
            throw err;
        }
    }

    async function submitOtp(otp) {
        setError(null);
        try {
            const res = await adminApi.post("/sys/auth/verify-otp/", { otp });
            setAdmin(res.data.user);
            setAuthStep("authed");
            setInitialized(true);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired OTP");
            throw err;
        }
    }

    async function adminLogout() {
        try {
            await adminApi.post("/sys/auth/logout/");
        } finally {
            setAdmin(null);
            setAuthStep("idle");
            setError(null);
        }
    }

    function resetFlow() {
        setAuthStep("idle");
        setError(null);
    }

    return (
        <AdminAuthContext.Provider value={{
            admin,
            authStep,
            loading,
            initialized,
            error,
            submitCredentials,
            submitOtp,
            adminLogout,
            resetFlow,
            tryRestoreSession,
        }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
    return ctx;
}