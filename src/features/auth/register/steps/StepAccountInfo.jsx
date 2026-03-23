import "./StepFields.css";

const FIELDS = [
  { key: "first_name", label: "First Name", type: "text", placeholder: "John", autoComplete: "given-name" },
  { key: "last_name",  label: "Last Name",  type: "text", placeholder: "Doe",  autoComplete: "family-name" },
  { key: "email",      label: "Email",      type: "email", placeholder: "you@example.com", autoComplete: "email" },
  { key: "phone_number", label: "Phone Number", type: "tel", placeholder: "+977 98XXXXXXXX", autoComplete: "tel", optional: true },
];

// Accept verifiedEmail prop — set by WizardShell when the email was pre-verified via OTP.
export default function StepAccountInfo({ data, onChange, errors = {}, verifiedEmail }) {
  return (
    <div>
      <div className="sf-grid-2">
        {["first_name", "last_name"].map((key) => {
          const f = FIELDS.find((f) => f.key === key);
          return (
            <div key={key} className="sf-group">
              <label htmlFor={`acc-${key}`} className="sf-label">{f.label}</label>
              <input
                id={`acc-${key}`}
                type={f.type}
                value={data[key]}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                className={`sf-input${errors[key] ? " has-error" : ""}`}
              />
              {errors[key] && <p className="sf-error">{errors[key]}</p>}
            </div>
          );
        })}
      </div>

      {["email", "phone_number"].map((key) => {
        const f = FIELDS.find((f) => f.key === key);
        // Email is read-only when it was pre-verified in Step 0 of RegisterPage.
        // The value is still in formData and will be submitted normally.
        const isVerifiedEmail = key === "email" && !!verifiedEmail;
        return (
          <div key={key} className="sf-group">
            <label htmlFor={`acc-${key}`} className="sf-label">
              {f.label}{" "}
              {f.optional && <span className="sf-optional">(optional)</span>}
              {/* Show "✓ Verified" badge next to label only when email is locked */}
              {isVerifiedEmail && (
                <span style={{ color: "#16a34a", fontSize: "0.78rem", fontWeight: 600, marginLeft: "6px" }}>
                  ✓ Verified
                </span>
              )}
            </label>
            <input
              id={`acc-${key}`}
              type={f.type}
              value={data[key]}
              // FIX 15 (BUG 16): No onChange when email is read-only (verified).
              // The value is locked — no handler is needed.
              onChange={isVerifiedEmail ? undefined : (e) => onChange(key, e.target.value)}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              // Lock the email field when a pre-verified email is already set.
              readOnly={isVerifiedEmail}
              className={`sf-input${errors[key] ? " has-error" : ""}${isVerifiedEmail ? " sf-input-readonly" : ""}`}
              style={isVerifiedEmail ? { background: "var(--bg-subtle, #f3f4f6)", cursor: "default" } : undefined}
            />
            {errors[key] && <p className="sf-error">{errors[key]}</p>}
          </div>
        );
      })}

      <div className="sf-group">
        <label htmlFor="acc-password" className="sf-label">Password</label>
        <input
          id="acc-password"
          type="password"
          value={data.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className={`sf-input${errors.password ? " has-error" : ""}`}
        />
        {errors.password && <p className="sf-error">{errors.password}</p>}
      </div>

      <div className="sf-group">
        <label htmlFor="acc-confirm" className="sf-label">Confirm Password</label>
        <input
          id="acc-confirm"
          type="password"
          value={data.confirm_password}
          onChange={(e) => onChange("confirm_password", e.target.value)}
          placeholder="Repeat the password"
          autoComplete="new-password"
          className={`sf-input${errors.confirm_password ? " has-error" : ""}`}
        />
        {errors.confirm_password && <p className="sf-error">{errors.confirm_password}</p>}
      </div>
    </div>
  );
}
