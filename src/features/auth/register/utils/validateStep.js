// ── FE/src/features/auth/register/utils/validateStep.js ──

/**
 * validateStep.js
 * ---------------
 * Per-step validation. Returns { valid: bool, errors: {} }.
 *
 * validateDocuments enforces the hard validation rules:
 *   teacher / staff:  at least one of national_id or passport must have a file
 *   student:          at least one of national_id or birth_certificate must have a file
 *   parent / vendor:  at least one of national_id or passport must have a file
 *   admin / owner:    always valid — no document requirements
 *
 * "Has a file" means either:
 *   - documents[type].file is a File object (new upload this session), OR
 *   - existingDocs contains a row with that document_type (uploaded previously)
 */

export function validateRoleSelector({ orgSlug, orgStatus, orgError, roleId }) {
  const errors = {};
  if (!orgSlug.trim()) {
    errors.orgSlug = "Organization slug is required.";
  } else if (orgStatus === "error") {
    errors.orgSlug = orgError || "Invalid organization.";
  } else if (orgStatus !== "ok") {
    errors.orgSlug = "Please wait for the organization to be verified.";
  }
  if (!roleId) errors.roleId = "Please select a role.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAccountInfo({ email, password, confirm_password, first_name, last_name }) {
  const errors = {};
  if (!first_name.trim()) errors.first_name = "First name is required.";
  if (!last_name.trim()) errors.last_name = "Last name is required.";
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!confirm_password) {
    errors.confirm_password = "Please confirm your password.";
  } else if (password !== confirm_password) {
    errors.confirm_password = "Passwords do not match.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePersonalInfo({ date_of_birth, gender }) {
  const errors = {};
  if (!gender) errors.gender = "Please select your gender.";
  if (date_of_birth) {
    const d = new Date(date_of_birth);
    if (isNaN(d.getTime())) errors.date_of_birth = "Enter a valid date.";
    else if (d > new Date()) errors.date_of_birth = "Date of birth cannot be in the future.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAddress() {
  return { valid: true, errors: {} };
}

export function validateTeacher({ specialization, qualification }) {
  const errors = {};
  if (!specialization.trim()) errors.specialization = "Specialization is required.";
  if (!qualification.trim()) errors.qualification = "Qualification is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateStudent({ grade, guardian_name, guardian_relation }) {
  const errors = {};
  if (!grade.trim()) errors.grade = "Grade/Class is required.";
  if (!guardian_name.trim()) errors.guardian_name = "Guardian name is required.";
  if (!guardian_relation) errors.guardian_relation = "Guardian relation is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateStaff({ department, designation }) {
  const errors = {};
  if (!department.trim()) errors.department = "Department is required.";
  if (!designation.trim()) errors.designation = "Designation is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateParent() {
  return { valid: true, errors: {} };
}

export function validateVendor({ company_name, service_type }) {
  const errors = {};
  if (!company_name.trim()) errors.company_name = "Company name is required.";
  if (!service_type.trim()) errors.service_type = "Service type is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * validateDocuments
 * -----------------
 * Hard validation for the Documents step.
 *
 * @param {string} roleType         — e.g. "teacher", "student"
 * @param {object} documents        — { national_id: { file, number }, ... }
 * @param {Array}  existingDocs     — docs already on the server from GET /profile/me/documents/
 *
 * Returns { valid, errors } where errors may contain:
 *   - errors[docType]: per-field error (currently unused but available)
 *   - errors._group:   top-level group error shown at the top of the step
 */
export function validateDocuments(roleType, documents = {}, existingDocs = []) {
  const errors = {};

  // Build a set of document_type values that already exist on the server
  const uploadedTypes = new Set(existingDocs.map((d) => d.document_type));

  // Helper: does the user have a file for this type (new or existing)?
  function hasDoc(type) {
    return uploadedTypes.has(type) || !!(documents[type]?.file);
  }

  if (roleType === "student") {
    // student: national_id OR birth_certificate
    if (!hasDoc("national_id") && !hasDoc("birth_certificate")) {
      errors._group =
        "Please upload at least one identity document: National ID or Birth Certificate.";
    }
  } else if (["teacher", "staff", "parent", "vendor", "admin", "owner"].includes(roleType)) {
    // these roles: national_id OR passport
    if (!hasDoc("national_id") && !hasDoc("passport")) {
      errors._group =
        "Please upload at least one identity document: National ID or Passport.";
    }
  }
  // admin, owner, unknown roles — no requirement, always valid

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateReview() {
  return { valid: true, errors: {} };
}

const VALIDATORS = {
  accountInfo: validateAccountInfo,
  personalInfo: validatePersonalInfo,
  address: validateAddress,
  teacher: validateTeacher,
  student: validateStudent,
  staff: validateStaff,
  parent: validateParent,
  vendor: validateVendor,
  review: validateReview,
};

export function getValidator(stepKey) {
  return VALIDATORS[stepKey] || (() => ({ valid: true, errors: {} }));
}