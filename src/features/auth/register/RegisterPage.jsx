/**
 * RegisterPage.jsx
 * ----------------
 * Step 0: Email OTP verification (NEW — pre-registration email gate).
 * Step 1: Org slug lookup + role selector card.
 * Once email is verified AND a role is chosen → renders WizardShell.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useRoles } from "./hooks/useRoles";
import WizardShell from "./WizardShell";
import publicApi from "@/services/axios/publicApi";
import styles from "./Wizard.module.css";

const ROLE_ICONS = {
  teacher: "🎓",
  student: "📚",
  staff:   "🏢",
  parent:  "👨‍👩‍👧",
  vendor:  "🛒",
  admin:   "⚙️",
  owner:   "👑",
};

export default function RegisterPage() {
  // ── Step 0: Email OTP state ─────────────────────────────────────
  // verifiedEmail is null until the user completes OTP verification.
  // otpSent tracks whether the OTP input field should be shown.
  const [emailInput, setEmailInput]     = useState("");
  const [otpInput, setOtpInput]         = useState("");
  const [otpSent, setOtpSent]           = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(null); // null = not yet verified
  const [otpLoading, setOtpLoading]     = useState(false);
  const [otpError, setOtpError]         = useState("");

  // ── Step 1: Org + role state ────────────────────────────────────
  const [orgSlug, setOrgSlug]           = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [wizardActive, setWizardActive] = useState(false);

  const { roles, status, error } = useRoles(orgSlug);

  const orgStatusIcon =
    status === "loading" ? "⟳" :
    status === "ok"      ? "✓" :
    status === "error"   ? "✗" : null;

  const slugBorderColor =
    status === "error" ? "var(--error)" :
    status === "ok"    ? "#22c55e"      : "var(--border)";

  // ── OTP: send ───────────────────────────────────────────────────
  async function handleSendOtp() {
    setOtpError("");
    const email = emailInput.trim().toLowerCase();
    if (!email) { setOtpError("Please enter your email address."); return; }
    setOtpLoading(true);
    try {
      await publicApi.post("/auth/send-otp/", { email });
      setOtpSent(true); // show OTP input field
    } catch (err) {
      setOtpError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  // ── OTP: verify ─────────────────────────────────────────────────
  async function handleVerifyOtp() {
    setOtpError("");
    if (!otpInput.trim()) { setOtpError("Please enter the OTP."); return; }
    setOtpLoading(true);
    try {
      const res = await publicApi.post("/auth/verify-otp/", {
        email: emailInput.trim().toLowerCase(),
        otp:   otpInput.trim(),
      });
      if (res.data.verified) {
        // Store verified email — the org+role screen now unlocks.
        setVerifiedEmail(res.data.email);
      }
    } catch (err) {
      setOtpError(err.response?.data?.detail || "Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  // ── Role selection ───────────────────────────────────────────────
  function handleRoleSelect(role) { setSelectedRole(role); }
  function handleContinue() {
    if (selectedRole && status === "ok") setWizardActive(true);
  }

  // ── Wizard active: email verified + role chosen ──────────────────
  if (wizardActive && selectedRole && verifiedEmail) {
    return (
      <div className={styles.wizardContainer}>
        <div className={styles.wizardHeader}>
          <h1 className={styles.wizardTitle}>Create Your Account</h1>
          <p className={styles.wizardSubtitle}>
            Joining as <strong>{selectedRole.name}</strong> · {orgSlug}
          </p>
        </div>
        {/* Pass verifiedEmail so WizardShell pre-fills and locks the email field */}
        <WizardShell
          selectedRole={selectedRole}
          orgSlug={orgSlug}
          roleName={selectedRole.name}
          verifiedEmail={verifiedEmail}
          onBack={() => setWizardActive(false)}
        />
      </div>
    );
  }

  // ── Step 0: Email OTP verification (not yet verified) ────────────
  if (!verifiedEmail) {
    return (
      <div className={styles.wizardContainer}>
        <div className={styles.wizardHeader}>
          <h1 className={styles.wizardTitle}>Verify Your Email</h1>
          <p className={styles.wizardSubtitle}>
            We'll send a one-time code to your email before you can register.
          </p>
        </div>

        <div className={styles.roleSelectorWrap}>
          {/* Email input */}
          <div className={styles.fieldGroup} style={{ marginBottom: "1rem" }}>
            <label htmlFor="reg-email" className={styles.label}>Email Address</label>
            <input
              id="reg-email"
              type="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setOtpError(""); }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={otpSent} // lock email once OTP is sent
              style={{
                width: "100%", padding: "0.75rem 1rem",
                borderRadius: "0.5rem", border: "1px solid var(--border)",
                backgroundColor: otpSent ? "var(--bg-subtle, #f3f4f6)" : "var(--bg)",
                color: "var(--text-primary)",
                fontSize: "1rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* OTP input — shown after Send OTP succeeds */}
          {otpSent && (
            <div className={styles.fieldGroup} style={{ marginBottom: "1rem" }}>
              <label htmlFor="reg-otp" className={styles.label}>
                Enter OTP — check your inbox
              </label>
              <input
                id="reg-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpInput}
                onChange={(e) => { setOtpInput(e.target.value); setOtpError(""); }}
                placeholder="6-digit code"
                style={{
                  width: "100%", padding: "0.75rem 1rem",
                  borderRadius: "0.5rem", border: "1px solid var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text-primary)",
                  fontSize: "1.25rem", letterSpacing: "0.5rem",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Error message */}
          {otpError && (
            <p style={{ color: "var(--error, #ef4444)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {otpError}
            </p>
          )}

          {/* Action row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link to="/login" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textDecoration: "underline" }}>
              Already have an account?
            </Link>

            {!otpSent ? (
              // First action: send OTP
              <button
                type="button"
                className={styles.btnNext}
                onClick={handleSendOtp}
                disabled={otpLoading || !emailInput.trim()}
              >
                {otpLoading ? "Sending…" : "Send OTP →"}
              </button>
            ) : (
              // Second action: verify OTP
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {/* Allow resend — resets OTP input and re-sends */}
                <button
                  type="button"
                  style={{ fontSize: "0.875rem", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => { setOtpSent(false); setOtpInput(""); setOtpError(""); }}
                  disabled={otpLoading}
                >
                  Change email
                </button>
                <button
                  type="button"
                  className={styles.btnNext}
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || !otpInput.trim()}
                >
                  {otpLoading ? "Verifying…" : "Verify →"}
                </button>
              </div>
            )}
          </div>

          {/* Resend OTP link (only shown after send) */}
          {otpSent && (
            <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>
              Didn't receive it?{" "}
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "0.8rem", textDecoration: "underline" }}
                onClick={handleSendOtp}
                disabled={otpLoading}
              >
                Resend OTP
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Step 1: Org slug + role selection (email already verified) ───
  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardHeader}>
        <h1 className={styles.wizardTitle}>Join Your Organization</h1>
        <p className={styles.wizardSubtitle}>
          ✓ Email verified: <strong>{verifiedEmail}</strong>
          <br />Enter your organization's slug and select your role.
        </p>
      </div>

      <div className={styles.roleSelectorWrap}>
        {/* Org Slug */}
        <div className={styles.fieldGroup} style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="rs-slug" className={styles.label}>Organization Slug</label>
          <div className={styles.orgInputWrap}>
            <input
              id="rs-slug"
              type="text"
              value={orgSlug}
              onChange={(e) => { setOrgSlug(e.target.value); setSelectedRole(null); }}
              placeholder="e.g. sunshine-school"
              autoComplete="off"
              style={{
                width: "100%", padding: "0.75rem 2.5rem 0.75rem 1rem",
                borderRadius: "0.5rem",
                border: `1px solid ${status === "error" ? "var(--error)" : slugBorderColor}`,
                backgroundColor: "var(--bg)",
                color: "var(--text-primary)",
                fontSize: "1rem", outline: "none", boxSizing: "border-box",
              }}
            />
            {orgStatusIcon && (
              <span
                className={styles.orgStatusIcon}
                style={{ color: status === "ok" ? "#22c55e" : status === "error" ? "var(--error)" : "var(--text-secondary)" }}
              >
                {orgStatusIcon}
              </span>
            )}
          </div>
          {status === "error" && (
            <span style={{ color: "var(--error)", fontSize: "0.8rem" }}>{error}</span>
          )}
          {status === "ok" && (
            <span style={{ color: "#22c55e", fontSize: "0.8rem" }}>
              Organization found — {roles.length} role{roles.length !== 1 ? "s" : ""} available
            </span>
          )}
        </div>

        {/* Role grid */}
        {status === "ok" && roles.length > 0 && (
          <>
            <label className={styles.label} style={{ marginBottom: "0.5rem", display: "block" }}>
              Select your role
            </label>
            <div className={styles.roleGrid}>
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`${styles.roleCard} ${selectedRole?.id === role.id ? styles.roleCardActive : ""}`}
                >
                  <span className={styles.roleIcon}>{ROLE_ICONS[role.role_type] || "👤"}</span>
                  <span className={styles.roleName}>{role.name}</span>
                  <span className={styles.roleType}>{role.role_type}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Action row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
          <Link to="/login" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textDecoration: "underline" }}>
            Already have an account?
          </Link>
          <button
            type="button"
            className={styles.btnNext}
            disabled={!selectedRole || status !== "ok"}
            onClick={handleContinue}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
