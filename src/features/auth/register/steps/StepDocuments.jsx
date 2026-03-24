// ── FE/src/features/auth/register/steps/StepDocuments.jsx ──

/**
 * StepDocuments.jsx
 * -----------------
 * Role-aware document upload step in the profile setup wizard.
 * Inserted before the Review step.
 *
 * Document requirements per role:
 *   teacher / staff:  national_id OR passport (one required — hard validation)
 *                     pan_card (optional), cv (optional), recruitment_letter (optional)
 *   student:          national_id OR birth_certificate (one required — hard validation)
 *                     transfer_certificate (optional), admission_form (optional)
 *   parent / vendor:  national_id OR passport (one required — hard validation)
 *   admin / owner:    no documents required — empty state shown
 *
 * Props:
 *   roleType     {string}   — e.g. "teacher", "student"
 *   documents    {object}   — { national_id: { file, number }, ... }
 *   onChange     {function} — (docType, field, value) => void
 *   errors       {object}   — { _group?: string, [docType]?: string }
 *   existingDocs {Array}    — docs already on the server from GET /profile/me/documents/
 */

import styles from "./StepDocuments.module.css";

// Document types that have a document number field
const HAS_NUMBER = new Set([
    "national_id",
    "passport",
    "birth_certificate",
    "pan_card",
    "driving_license",
    "transfer_certificate",
]);

// Human-readable labels per document type
const DOC_LABELS = {
    national_id: "National ID Card",
    passport: "Passport",
    birth_certificate: "Birth Certificate",
    pan_card: "PAN Card",
    cv: "CV / Resume",
    recruitment_letter: "Recruitment Letter",
    transfer_certificate: "Transfer Certificate",
    admission_form: "Admission Form Copy",
};

// Document types to show per role, with note text
const ROLE_DOCS = {
    teacher: [
        { type: "national_id", note: "National ID or Passport — one is required" },
        { type: "passport", note: "National ID or Passport — one is required" },
        { type: "pan_card", note: "Optional" },
        { type: "cv", note: "Optional" },
        { type: "recruitment_letter", note: "Optional" },
    ],
    staff: [
        { type: "national_id", note: "National ID or Passport — one is required" },
        { type: "passport", note: "National ID or Passport — one is required" },
        { type: "pan_card", note: "Optional" },
        { type: "cv", note: "Optional" },
        { type: "recruitment_letter", note: "Optional" },
    ],
    student: [
        { type: "national_id", note: "National ID or Birth Certificate — one is required" },
        { type: "birth_certificate", note: "National ID or Birth Certificate — one is required" },
        { type: "transfer_certificate", note: "Optional" },
        { type: "admission_form", note: "Optional" },
    ],
    parent: [
        { type: "national_id", note: "National ID or Passport — one is required" },
        { type: "passport", note: "National ID or Passport — one is required" },
    ],
    vendor: [
        { type: "national_id", note: "National ID or Passport — one is required" },
        { type: "passport", note: "National ID or Passport — one is required" },
    ],
    admin: [],
    owner: [],
};


// ── Individual document field
function FileUploadField({ docType, docState, onChange, error, note, existingDoc }) {
    const label = DOC_LABELS[docType] || docType;
    const hasNumber = HAS_NUMBER.has(docType);
    const isUploaded = !!existingDoc;

    function handleFileChange(e) {
        const file = e.target.files?.[0] || null;
        onChange(docType, "file", file);
    }

    return (
        <div className={`${styles.docField}${error ? ` ${styles.docFieldError}` : ""}`}>

            <div className={styles.docFieldHeader}>
                <span className={styles.docFieldLabel}>{label}</span>
                {note && <span className={styles.docFieldNote}>{note}</span>}
                {isUploaded && (
                    <span className={`${styles.badge} ${styles.badgeUploaded}`}>
                        ✓ Uploaded
                    </span>
                )}
            </div>

            <div className={styles.fileRow}>
                <label className={styles.fileBtn}>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    {docState?.file ? (
                        <span className={styles.fileName}>📎 {docState.file.name}</span>
                    ) : isUploaded ? (
                        <span style={{ color: "var(--w-text-muted, #6b7280)", fontSize: "13px" }}>
                            Replace file (optional)
                        </span>
                    ) : (
                        <span>Choose file</span>
                    )}
                </label>
                <span className={styles.fileFormats}>PDF, JPG, PNG — max 5MB</span>
            </div>

            {hasNumber && (
                <input
                    type="text"
                    className={styles.numberInput}
                    placeholder={`${label} number (optional)`}
                    value={docState?.number || ""}
                    onChange={(e) => onChange(docType, "number", e.target.value)}
                />
            )}

            {error && (
                <p className="sf-error" style={{ marginTop: "6px" }}>{error}</p>
            )}
        </div>
    );
}


// ── Main component
export default function StepDocuments({
    roleType,
    documents = {},
    onChange,
    errors = {},
    existingDocs = [],
}) {
    const docConfig = ROLE_DOCS[roleType] || [];

    // Build a lookup of already-uploaded docs by document_type
    const uploadedByType = {};
    existingDocs.forEach((doc) => {
        uploadedByType[doc.document_type] = doc;
    });

    // No documents required for this role
    if (docConfig.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p className={styles.emptyIcon}>✓</p>
                <p>No documents required for this role.</p>
            </div>
        );
    }

    return (
        <div>
            <p className={styles.intro}>
                Upload your documents. At least one identity document is required
                before you can submit your profile.
            </p>

            {errors._group && (
                <div className={styles.groupError} role="alert">
                    {errors._group}
                </div>
            )}

            <div className={styles.list}>
                {docConfig.map(({ type, note }) => (
                    <FileUploadField
                        key={type}
                        docType={type}
                        docState={documents[type]}
                        onChange={onChange}
                        error={errors[type]}
                        note={note}
                        existingDoc={uploadedByType[type]}
                    />
                ))}
            </div>
        </div>
    );
}