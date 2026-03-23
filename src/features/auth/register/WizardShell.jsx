/**
 * WizardShell.jsx
 * ---------------
 * Manages step state, form data, navigation, and submission.
 * Keyboard: Enter advances, Escape goes back.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import publicApi from "@/services/axios/publicApi";
import { useAuth } from "@/context/AuthContext";
import "./WizardShell.css";

import StepAccountInfo  from "./steps/StepAccountInfo";
import StepPersonalInfo from "./steps/StepPersonalInfo";
import StepAddress      from "./steps/StepAddress";
import StepTeacher      from "./steps/StepTeacher";
import StepStudent      from "./steps/StepStudent";
import StepStaff        from "./steps/StepStaff";
import StepParent       from "./steps/StepParent";
import StepVendor       from "./steps/StepVendor";
import StepReview       from "./steps/StepReview";

import {
  validateAccountInfo,
  validatePersonalInfo,
  validateAddress,
  validateTeacher,
  validateStudent,
  validateStaff,
  validateParent,
  validateVendor,
} from "./utils/validateStep";

// Describes each step generically; role-specific step inserted at index 3 dynamically
const BASE_STEPS = [
  { key: "accountInfo",  title: "Account Information",   desc: "Create your login credentials.",            Component: null },
  { key: "personalInfo", title: "Personal Information",  desc: "Tell us a bit about yourself.",            Component: null },
  { key: "address",      title: "Address",               desc: "Where are you located? (all optional)",   Component: null },
];

const ROLE_STEP_MAP = {
  teacher: { key: "teacher", title: "Teacher Details",  desc: "Your subject and qualifications.", Component: StepTeacher, validate: validateTeacher },
  student: { key: "student", title: "Student Details",  desc: "Academic info and guardian.",       Component: StepStudent, validate: validateStudent },
  staff:   { key: "staff",   title: "Staff Details",    desc: "Your department and designation.",  Component: StepStaff,   validate: validateStaff   },
  parent:  { key: "parent",  title: "Parent Info",      desc: "Link to your child (optional).",   Component: StepParent,  validate: validateParent  },
  vendor:  { key: "vendor",  title: "Vendor Details",   desc: "Your company and service type.",   Component: StepVendor,  validate: validateVendor  },
};

const REVIEW_STEP = { key: "review", title: "Review & Submit", desc: "Confirm your details before submitting.", Component: null };

function buildSteps(roleType) {
  const roleStep = roleType && ROLE_STEP_MAP[roleType] ? ROLE_STEP_MAP[roleType] : null;
  const core = [
    { ...BASE_STEPS[0], Component: StepAccountInfo,  validate: validateAccountInfo  },
    { ...BASE_STEPS[1], Component: StepPersonalInfo, validate: validatePersonalInfo },
    { ...BASE_STEPS[2], Component: StepAddress,      validate: validateAddress      },
  ];
  if (roleStep) core.push(roleStep);
  core.push({ ...REVIEW_STEP, validate: () => ({ valid: true, errors: {} }) });
  return core;
}

const INITIAL_FORM = {
  role_id:   "",
  role_type: "",
  org_slug:  "",

  // Step 1
  email: "", password: "", confirm_password: "",
  first_name: "", last_name: "", phone_number: "",

  // Step 2
  photo: null, date_of_birth: "", gender: "", blood_group: "", nationality: "", religion: "",

  // Step 3
  address_line_1: "", address_line_2: "", city: "",
  state_or_province: "", postal_code: "", country: "",

  // Step 4 — role scoped
  teacher: { specialization: "", qualification: "", joining_date: "" },
  student: { grade: "", enrollment_number: "", guardian_name: "", guardian_phone: "", guardian_relation: "" },
  staff:   { department: "", designation: "", joining_date: "" },
  parent:  { linked_student_id: "", relation_to_student: "" },
  vendor:  { company_name: "", service_type: "", tax_id: "" },
};

export default function WizardShell({ selectedRole, orgSlug, roleName, verifiedEmail, onBack }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    role_id:   selectedRole.id,
    role_type: selectedRole.role_type ? selectedRole.role_type.toLowerCase() : "",
    org_slug:  orgSlug,
    // Pre-fill the verified email so it is included in the wizard payload
    // even though the field will be rendered read-only in StepAccountInfo.
    email: verifiedEmail || "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const steps = buildSteps(formData.role_type);
  const totalSteps  = steps.length;
  const step        = steps[currentStep];
  const isLastStep  = currentStep === totalSteps - 1;
  const roleStepIdx = steps.findIndex((s) => s.key === formData.role_type);

  // ── Generic field updater
  function updateField(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ── Section updater (for role-specific sub-objects)
  function updateSection(section, key, value) {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setErrors((prev) => {
      const sec = { ...(prev[section] || {}), [key]: undefined };
      return { ...prev, [section]: sec };
    });
  }

  // ── Validate current step
  function validateCurrent() {
    if (!step.validate) return true;
    const dataSlice = ["teacher","student","staff","parent","vendor"].includes(step.key)
      ? formData[step.key]
      : formData;
    const { valid, errors: errs } = step.validate(dataSlice);
    if (!valid) {
      if (["teacher","student","staff","parent","vendor"].includes(step.key)) {
        setErrors((prev) => ({ ...prev, [step.key]: errs }));
      } else {
        setErrors(errs);
      }
    }
    return valid;
  }

  function handleNext() {
    if (!validateCurrent()) return;
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    setErrors({});
    if (currentStep === 0) { onBack(); return; }
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function jumpTo(idx) {
    setErrors({});
    setCurrentStep(idx);
  }

  // ── Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") handleBack();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentStep]);

  // ── Submit
  async function handleSubmit() {
    setServerError("");
    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name:  formData.last_name,
        email:      formData.email,
        password:   formData.password,
        phone_number: formData.phone_number,
        org_slug:   formData.org_slug,
        role_id:    formData.role_id,
        date_of_birth: formData.date_of_birth || undefined,
        gender:     formData.gender,
        blood_group: formData.blood_group || undefined,
        nationality: formData.nationality,
        religion:   formData.religion,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city:       formData.city,
        state_or_province: formData.state_or_province,
        postal_code: formData.postal_code,
        country:    formData.country,
        [formData.role_type]: formData[formData.role_type],
      };
      
      const formDataToSend = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== "") {
          if (key === "photo" && payload[key] instanceof File) {
            formDataToSend.append(key, payload[key]);
          } else if (typeof payload[key] === 'object' && !(payload[key] instanceof File)) {
            formDataToSend.append(key, JSON.stringify(payload[key]));
          } else {
            formDataToSend.append(key, payload[key]);
          }
        }
      });
      
      const res = await publicApi.post("/auth/register/", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Auto-login locally (the HttpOnly cookie is set by the backend)
      if (res.data.access) {
         signIn(res.data.access, {
           profile_complete: res.data.profile_complete,
           membership_status: res.data.membership_status,
           role_type: res.data.role_type,
         });
      }
      
      navigate("/app/profile/setup"); // navigate directly to setup — skips the PrivateRoute redirect hop
      
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
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

  // ── Render step component
  const StepComponent = step.Component;
  const stepProgress = (currentStep / (totalSteps - 1)) * 100;

  const stepErrors = ["teacher","student","staff","parent","vendor"].includes(step.key)
    ? (errors[step.key] || {})
    : errors;

  return (
    <div className="wizard-shell">
      {/* Progress */}
      <div className="w-progress-bar">
        <div className="w-progress-label">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span style={{ marginLeft: "12px", color: "var(--w-text)" }}>{step.title}</span>
        </div>
        <div className="w-progress-track">
          <div className="w-progress-fill" style={{ width: `${stepProgress}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="w-step-card">
        <div className="w-step-header">
          <div className="w-step-icon">★</div>
          <div>
            <h2 className="w-step-title">{step.title}</h2>
            <p className="w-step-subtitle">{step.desc}</p>
          </div>
        </div>

        <div className="w-card-body">
          {serverError && (
            <p className="sf-error" role="alert" style={{ marginBottom: '16px', background: 'var(--w-surface)', padding: '12px', border: '1px solid var(--w-error)' }}>{serverError}</p>
          )}

          {step.key === "review" ? (
            <StepReview
              formData={formData}
              roleName={roleName}
              roleStepIndex={roleStepIdx}
              onEdit={jumpTo}
            />
          ) : (
            <StepComponent
              data={["teacher","student","staff","parent","vendor"].includes(step.key)
                ? formData[step.key]
                : formData}
              onChange={
                ["teacher","student","staff","parent","vendor"].includes(step.key)
                  ? (key, val) => updateSection(step.key, key, val)
                  : updateField
              }
              errors={stepErrors}
              // Pass verifiedEmail only to StepAccountInfo so it can lock the email field.
              {...(step.key === "accountInfo" ? { verifiedEmail } : {})}
            />
          )}
        </div>

        <div className="w-nav">
          <button
            type="button"
            className="w-btn-back"
            onClick={handleBack}
            disabled={loading}
          >
            ← {currentStep === 0 ? "Change Role" : "Back"}
          </button>

          {isLastStep ? (
            <button
              type="button"
              className="w-btn-continue"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting…" : "Submit Registration"}
            </button>
          ) : (
            <button
              type="button"
              className="w-btn-continue"
              onClick={handleNext}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
