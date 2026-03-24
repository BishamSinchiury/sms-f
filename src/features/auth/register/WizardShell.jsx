// ── FE/src/features/auth/register/WizardShell.jsx ──

/**
 * WizardShell.jsx
 * ---------------
 * Single-step account creation form.
 * Collects: first name, last name, email (read-only, pre-verified),
 *           password, confirm password, phone number.
 *
 * Submits to POST /auth/register/ → auto-login → /app/profile/setup
 *
 * Profile completion (personal info, address, role-specific data)
 * is handled separately in the ProfileSetup flow after first login.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import publicApi from "@/services/axios/publicApi";
import { useAuth } from "@/context/AuthContext";
import "./WizardShell.css";

import StepAccountInfo from "./steps/StepAccountInfo";
import { validateAccountInfo } from "./utils/validateStep";

export default function WizardShell({ selectedRole, orgSlug, roleName, verifiedEmail, onBack }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Pre-fill from props — these never change during this form
    role_id: selectedRole.id,
    role_type: selectedRole.role_type ? selectedRole.role_type.toLowerCase() : "",
    org_slug: orgSlug,
    // Email is pre-verified and locked
    email: verifiedEmail || "",
    // User fills these
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    phone_number: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Field updater — clears error on change
  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // ── Keyboard: Escape goes back to role selection
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onBack();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onBack]);

  // ── Submit — validate then POST /auth/register/
  async function handleSubmit() {
    setServerError("");

    // Client-side validation
    const { valid, errors: errs } = validateAccountInfo(formData);
    if (!valid) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      // Only account fields — no Person fields, no role-specific fields
      const payload = new FormData();
      payload.append("first_name", formData.first_name.trim());
      payload.append("last_name", formData.last_name.trim());
      payload.append("email", formData.email);
      payload.append("password", formData.password);
      payload.append("org_slug", formData.org_slug);
      payload.append("role_id", formData.role_id);
      if (formData.phone_number.trim()) {
        payload.append("phone_number", formData.phone_number.trim());
      }

      const res = await publicApi.post("/auth/register/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Auto-login with the token the backend returns
      if (res.data.access) {
        signIn(res.data.access, {
          profile_complete: res.data.profile_complete,
          membership_status: res.data.membership_status,
          role_type: res.data.role_type,
        });
      }

      // Go directly to profile setup — PrivateRoute will also enforce this
      // redirect for pending users, but navigating directly skips the bounce.
      navigate("/app/profile/setup");

    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        // Show per-field errors if backend returns them
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setServerError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } else {
        setServerError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wizard-shell">

      {/* Progress — single step so always 100% */}
      <div className="w-progress-bar">
        <div className="w-progress-label">
          <span>Step 1 of 1</span>
          <span style={{ marginLeft: "12px", color: "var(--w-text)" }}>
            Account Information
          </span>
        </div>
        <div className="w-progress-track">
          <div className="w-progress-fill" style={{ width: "100%" }} />
        </div>
      </div>

      {/* Card */}
      <div className="w-step-card">

        <div className="w-step-header">
          <div className="w-step-icon">★</div>
          <div>
            <h2 className="w-step-title">Create Your Account</h2>
            <p className="w-step-subtitle">
              Joining as <strong>{roleName}</strong> · {orgSlug}
            </p>
          </div>
        </div>

        <div className="w-card-body">
          {serverError && (
            <p
              className="sf-error"
              role="alert"
              style={{
                marginBottom: "16px",
                background: "var(--w-surface)",
                padding: "12px",
                border: "1px solid var(--w-error)",
              }}
            >
              {serverError}
            </p>
          )}

          {/* Single step — account info only */}
          <StepAccountInfo
            data={formData}
            onChange={updateField}
            errors={errors}
            verifiedEmail={verifiedEmail}
          />
        </div>

        <div className="w-nav">
          <button
            type="button"
            className="w-btn-back"
            onClick={onBack}
            disabled={loading}
          >
            ← Change Role
          </button>

          <button
            type="button"
            className="w-btn-continue"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </div>

      </div>
    </div>
  );
}