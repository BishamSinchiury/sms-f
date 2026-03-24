// ── FE/src/pages/Webapp/dashboard/ProfileSetup.jsx ──

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import authApi from '@/services/axios/authApi';
import { useToast } from '@/components/ui/Toast';
import { User, ShieldCheck, MapPin, Briefcase, FileText, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

import StepPersonalInfo from '@/features/auth/register/steps/StepPersonalInfo';
import StepAddress from '@/features/auth/register/steps/StepAddress';
import StepTeacher from '@/features/auth/register/steps/StepTeacher';
import StepStudent from '@/features/auth/register/steps/StepStudent';
import StepStaff from '@/features/auth/register/steps/StepStaff';
import StepParent from '@/features/auth/register/steps/StepParent';
import StepVendor from '@/features/auth/register/steps/StepVendor';
import StepDocuments from '@/features/auth/register/steps/StepDocuments';

import {
  validatePersonalInfo,
  validateAddress,
  validateTeacher,
  validateStudent,
  validateStaff,
  validateParent,
  validateVendor,
  validateDocuments,
} from '@/features/auth/register/utils/validateStep';

import '@/features/auth/register/WizardShell.css';
import '@/features/auth/register/steps/StepFields.css';
import styles from './ProfileSetup.module.css';

const ROLE_CONFIG = {
  teacher: { Component: StepTeacher, validate: validateTeacher, label: 'Teacher Details', icon: Briefcase },
  student: { Component: StepStudent, validate: validateStudent, label: 'Student Details', icon: Briefcase },
  staff: { Component: StepStaff, validate: validateStaff, label: 'Staff Details', icon: Briefcase },
  parent: { Component: StepParent, validate: validateParent, label: 'Parent Details', icon: Briefcase },
  vendor: { Component: StepVendor, validate: validateVendor, label: 'Vendor Details', icon: Briefcase },
};
const ROLES_WITH_DOCUMENTS = new Set(['teacher', 'student', 'staff', 'parent', 'vendor', 'admin', 'owner']);
const INITIAL_DOCUMENTS = {
  national_id: { file: null, number: '' },
  passport: { file: null, number: '' },
  birth_certificate: { file: null, number: '' },
  pan_card: { file: null, number: '' },
  cv: { file: null },
  recruitment_letter: { file: null },
  transfer_certificate: { file: null, number: '' },
  admission_form: { file: null },
};

export default function ProfileSetup() {
  const { user, tryRestoreSession, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: '', gender: 'prefer_not_to_say', blood_group: '',
    nationality: '', religion: '',
    address_line_1: '', address_line_2: '', city: '',
    state_or_province: '', postal_code: '', country: '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
    emergency_contact_relation: user?.emergency_contact_relation || '',
    photo: '', photo_url: '',
    teacher: { specialization: '', qualification: '', joining_date: '' },
    student: { grade: '', enrollment_number: '', guardian_name: '', guardian_phone: '', guardian_relation: '' },
    staff: { department: '', designation: '', joining_date: '' },
    parent: { linked_student_id: '', relation_to_student: '' },
    vendor: { company_name: '', service_type: '', tax_id: '' },
  });

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [existingDocs, setExistingDocs] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const membershipStatus = user?.membership_status;
  const roleType = user?.role_type;
  const isRejected = membershipStatus === 'rejected';
  const showDocStep = ROLES_WITH_DOCUMENTS.has(roleType);

  useEffect(() => {
    if (!user) return;
    setShowForm(['pending', 'rejected'].includes(user.membership_status));
    setFormInitialized(true);
  }, [user?.membership_status]);

  const steps = [
    { id: 'basic', label: 'Basic Info', desc: 'Your core account details.', icon: User },
    { id: 'personal', label: 'Personal Info', desc: 'A bit more about yourself.', icon: ShieldCheck },
    { id: 'address', label: 'Address', desc: 'Where can we find you?', icon: MapPin },
  ];
  if (roleType && ROLE_CONFIG[roleType]) {
    steps.push({ id: roleType, label: ROLE_CONFIG[roleType].label, desc: 'Specific role requirements.', icon: ROLE_CONFIG[roleType].icon });
  }
  if (showDocStep) {
    steps.push({ id: 'documents', label: 'Documents', desc: 'Upload your identity documents.', icon: FileText });
  }
  steps.push({ id: 'review', label: 'Review & Submit', desc: 'Verify your details before finalizing.', icon: CheckCircle2 });

  useEffect(() => {
    async function fetchAll() {
      try {
        setFetchError(false);
        const [profileRes, docsRes] = await Promise.all([
          authApi.get('/profile/me/'),
          authApi.get('/profile/me/documents/'),
        ]);
        const profile = profileRes.data;
        const docs = docsRes.data?.results ?? docsRes.data ?? [];
        setExistingDocs(Array.isArray(docs) ? docs : []);
        setFormData(prev => {
          const updated = {
            ...prev,
            first_name: profile.first_name || prev.first_name,
            last_name: profile.last_name || prev.last_name,
            phone_number: profile.phone_number || prev.phone_number,
            date_of_birth: profile.date_of_birth || '',
            gender: profile.gender || 'prefer_not_to_say',
            blood_group: profile.blood_group || '',
            nationality: profile.nationality || '',
            religion: profile.religion || '',
            address_line_1: profile.address_line_1 || '',
            address_line_2: profile.address_line_2 || '',
            city: profile.city || '',
            state_or_province: profile.state_or_province || '',
            postal_code: profile.postal_code || '',
            country: profile.country || '',
            emergency_contact_name: profile.emergency_contact_name || '',
            emergency_contact_phone: profile.emergency_contact_phone || '',
            emergency_contact_relation: profile.emergency_contact_relation || '',
            photo_url: profile.photo_url || '',
            photo: profile.photo_url || '',
          };
          if (profile.role_type && profile[profile.role_type]) {
            updated[profile.role_type] = { ...prev[profile.role_type], ...profile[profile.role_type] };
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to fetch profile or documents', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (!user || loading || !formInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--error, #dc2626)', fontWeight: 500 }}>Failed to load your profile data.</p>
        <button onClick={() => { setLoading(true); setFetchError(false); window.location.reload(); }}
          style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
          Retry
        </button>
      </div>
    );
  }

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;
  const progressPercent = (currentStep / (totalSteps - 1)) * 100;

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }
  function updateSection(section, key, value) {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    setErrors(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [key]: undefined } }));
  }
  function updateDocument(docType, field, value) {
    setDocuments(prev => ({ ...prev, [docType]: { ...prev[docType], [field]: value } }));
    setDocErrors(prev => ({ ...prev, [docType]: undefined, _group: undefined }));
  }

  function validateBasicInfo() {
    const errs = {};
    if (!formData.first_name.trim()) errs.first_name = 'First name is required';
    if (!formData.last_name.trim()) errs.last_name = 'Last name is required';
    if (!formData.phone_number.trim()) errs.phone_number = 'Phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateCurrentStep() {
    if (step.id === 'basic') return validateBasicInfo();
    if (step.id === 'personal') { const { valid, errors: e } = validatePersonalInfo(formData); setErrors(e); return valid; }
    if (step.id === 'address') { const { valid, errors: e } = validateAddress(formData); setErrors(e); return valid; }
    if (step.id === 'review') return true;
    if (step.id === 'documents') {
      const { valid, errors: e } = validateDocuments(roleType, documents, existingDocs);
      setDocErrors(e);
      return valid;
    }
    const config = ROLE_CONFIG[step.id];
    if (config) { const { valid, errors: e } = config.validate(formData[step.id]); setErrors({ [step.id]: e }); return valid; }
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
  }
  function handleBack() {
    if (currentStep === 0) { navigate('/app/dashboard'); return; }
    setCurrentStep(s => Math.max(s - 1, 0));
  }

  async function uploadDocuments() {
    const toUpload = Object.entries(documents).filter(([, state]) => state?.file instanceof File);
    if (toUpload.length === 0) return true;
    setUploadingDocs(true);
    try {
      for (const [docType, state] of toUpload) {
        const payload = new FormData();
        payload.append('document_type', docType);
        payload.append('front_image', state.file);
        if (state.number) payload.append('document_number', state.number);
        await authApi.post('/profile/me/documents/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return true;
    } catch (err) {
      console.error('Document upload failed:', err);
      addToast({ type: 'error', message: 'Failed to upload one or more documents. Please try again.' });
      return false;
    } finally {
      setUploadingDocs(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);

    // STEP 1 — Update Person fields
    try {
      if (formData.photo instanceof File) {
        const payload = new FormData();
        payload.append('first_name', formData.first_name);
        payload.append('last_name', formData.last_name);
        payload.append('phone_number', formData.phone_number);
        if (formData.date_of_birth) payload.append('date_of_birth', formData.date_of_birth);
        payload.append('gender', formData.gender);
        if (formData.blood_group) payload.append('blood_group', formData.blood_group);
        if (formData.nationality) payload.append('nationality', formData.nationality);
        if (formData.religion) payload.append('religion', formData.religion);
        payload.append('address_line_1', formData.address_line_1);
        payload.append('address_line_2', formData.address_line_2);
        payload.append('city', formData.city);
        payload.append('state_or_province', formData.state_or_province);
        payload.append('postal_code', formData.postal_code);
        payload.append('country', formData.country);
        if (formData.emergency_contact_name) payload.append('emergency_contact_name', formData.emergency_contact_name);
        if (formData.emergency_contact_phone) payload.append('emergency_contact_phone', formData.emergency_contact_phone);
        if (formData.emergency_contact_relation) payload.append('emergency_contact_relation', formData.emergency_contact_relation);
        payload.append('photo', formData.photo);
        if (roleType && formData[roleType]) payload.append(roleType, JSON.stringify(formData[roleType]));
        await authApi.patch('/profile/me/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const payload = {
          first_name: formData.first_name, last_name: formData.last_name,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender, blood_group: formData.blood_group || null,
          nationality: formData.nationality, religion: formData.religion,
          address_line_1: formData.address_line_1, address_line_2: formData.address_line_2,
          city: formData.city, state_or_province: formData.state_or_province,
          postal_code: formData.postal_code, country: formData.country,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relation: formData.emergency_contact_relation,
        };
        if (roleType && formData[roleType]) payload[roleType] = formData[roleType];
        await authApi.patch('/profile/me/', payload);
      }
    } catch (err) {
      console.error('Step 1 failed:', err);
      addToast({ type: 'error', message: 'Failed to save your profile. Please check your connection and try again.' });
      setSubmitting(false);
      return;
    }

    // STEP 2 — Upload new documents
    const docsOk = await uploadDocuments();
    if (!docsOk) { setSubmitting(false); return; }

    // STEP 3 — Trigger status → WAITING_APPROVAL (includes backend doc validation)
    try {
      await authApi.patch('/users/me/profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });
    } catch (err) {
      console.error('Step 3 failed:', err);
      const detail = err.response?.data?.detail;
      if (err.response?.data?.code === 'missing_identity_document') {
        // Jump back to the documents step so the user can fix it
        const docIdx = steps.findIndex(s => s.id === 'documents');
        if (docIdx >= 0) setCurrentStep(docIdx);
        setDocErrors({ _group: detail });
        addToast({ type: 'error', message: detail });
      } else {
        addToast({ type: 'error', message: 'Your profile was saved but submission failed. Please try submitting again.' });
      }
      setSubmitting(false);
      return;
    }

    await tryRestoreSession();
    addToast({ type: 'success', message: 'Profile submitted! Awaiting admin approval.' });
    navigate('/app/profile/setup');
    setSubmitting(false);
  }

  const handleSignOut = async () => { await logout(); navigate('/login'); };

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    return `${base.replace(/\/api\/?$/, '')}${path}`;
  };

  const StepDynamicComponent = ROLE_CONFIG[step.id]?.Component;

  // ── STATUS CARD
  if (!showForm) {
    const STATUS_CONFIG = {
      waiting_approval: { badgeBg: '#fef3c7', badgeText: '#b45309', label: 'Pending Review', msg: 'Your profile has been submitted and is under review. You will be notified once approved.' },
      rejected: { badgeBg: '#fee2e2', badgeText: '#b91c1c', label: 'Profile Rejected', msg: 'Your profile was rejected. Please review your details and resubmit.' },
      suspended: { badgeBg: '#fee2e2', badgeText: '#b91c1c', label: 'Account Suspended', msg: 'Your account has been suspended. Please contact your administrator.' },
    };
    const config = STATUS_CONFIG[membershipStatus] || STATUS_CONFIG.waiting_approval;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-default)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {formData.photo_url
                ? <img src={getMediaUrl(formData.photo_url)} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
                : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={32} color="#9ca3af" /></div>
              }
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>Profile Overview</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '4px 12px', background: config.badgeBg, color: config.badgeText, borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>Status: {config.label}</span>
                  {roleType && <span style={{ padding: '4px 12px', background: '#e0e7ff', color: '#4338ca', borderRadius: '16px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>Role: {roleType}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {membershipStatus === 'rejected' && (
                <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  Edit and Resubmit
                </button>
              )}
              <button onClick={handleSignOut} style={{ padding: '8px 16px', background: 'white', border: '1px solid #d1d5db', color: '#374151', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Sign Out</button>
            </div>
          </div>

          <div style={{ marginBottom: '24px', padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
            <p style={{ margin: 0, color: '#4b5563', fontSize: '15px' }}>{config.msg}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {[
              { title: 'Basic Information', rows: [['First Name', formData.first_name], ['Last Name', formData.last_name], ['Phone', formData.phone_number]] },
              { title: 'Personal Details', rows: [['Date of Birth', formData.date_of_birth], ['Gender', formData.gender?.replace(/_/g, ' ')], ['Nationality', formData.nationality]] },
              { title: 'Address Details', rows: [['City', formData.city], ['State/Province', formData.state_or_province], ['Country', formData.country]] },
            ].map(({ title, rows }) => (
              <div key={title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>{title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rows.map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>{label}</span>
                      <span style={{ fontWeight: '500', color: '#111827', textTransform: label === 'Gender' ? 'capitalize' : 'none' }}>{val || 'Not provided'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {existingDocs.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Documents</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {existingDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px', textTransform: 'capitalize' }}>{doc.document_type.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: doc.is_verified ? '#d1fae5' : '#fef9c3', color: doc.is_verified ? '#065f46' : '#92400e', fontWeight: 600 }}>
                        {doc.is_verified ? '✓ Verified' : 'Uploaded'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── EDITABLE FORM
  const renderBasicInfo = () => (
    <div key="basic">
      <div className="sf-grid-2">
        <div className="sf-group">
          <label htmlFor="fname" className="sf-label">First Name</label>
          <input id="fname" className={`sf-input${errors.first_name ? ' has-error' : ''}`} value={formData.first_name} onChange={e => updateField('first_name', e.target.value)} />
          {errors.first_name && <p className="sf-error">{errors.first_name}</p>}
        </div>
        <div className="sf-group">
          <label htmlFor="lname" className="sf-label">Last Name</label>
          <input id="lname" className={`sf-input${errors.last_name ? ' has-error' : ''}`} value={formData.last_name} onChange={e => updateField('last_name', e.target.value)} />
          {errors.last_name && <p className="sf-error">{errors.last_name}</p>}
        </div>
      </div>
      <div className="sf-group">
        <label htmlFor="phone" className="sf-label">Phone Number</label>
        <input id="phone" className={`sf-input${errors.phone_number ? ' has-error' : ''}`} value={formData.phone_number} onChange={e => updateField('phone_number', e.target.value)} placeholder="+977 98XXXXXXXX" />
        {errors.phone_number && <p className="sf-error">{errors.phone_number}</p>}
      </div>
    </div>
  );

  const renderReview = () => {
    const docStepIdx = steps.findIndex(s => s.id === 'documents');
    return (
      <div key="review" className={styles.reviewWrapper}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Confirm all information is correct before submitting.</p>
        {formData.photo_url && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img src={formData.photo_url} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
          </div>
        )}
        {[
          { title: 'Basic Info', idx: 0, rows: [['Full Name', `${formData.first_name} ${formData.last_name}`], ['Phone', formData.phone_number]] },
          { title: 'Personal Info', idx: 1, rows: [['DOB', formData.date_of_birth || '-'], ['Gender', formData.gender?.replace(/_/g, ' ')], ['Nationality', formData.nationality || '-'], ['Emergency Contact', formData.emergency_contact_name ? `${formData.emergency_contact_name} (${formData.emergency_contact_relation || '-'}) - ${formData.emergency_contact_phone || '--'}` : '-']] },
          { title: 'Address', idx: 2, rows: [['Line 1', formData.address_line_1 || '-'], ['City', formData.city || '-'], ['Country', formData.country || '-']] },
        ].map(({ title, idx, rows }) => (
          <div key={title} className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h4>{title}</h4>
              <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(idx)}>Edit</button>
            </div>
            <div className={styles.reviewGrid}>
              {rows.map(([label, val]) => (
                <div key={label} className={styles.reviewItem}><label>{label}</label><span>{val}</span></div>
              ))}
            </div>
          </div>
        ))}
        {roleType && ROLE_CONFIG[roleType] && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h4 style={{ textTransform: 'capitalize' }}>{roleType} Details</h4>
              <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(3)}>Edit</button>
            </div>
            <div className={styles.reviewGrid}>
              <div className={styles.reviewItem}><label>Status</label><span>✓ Completed</span></div>
            </div>
          </div>
        )}
        {showDocStep && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h4>Documents</h4>
              {docStepIdx >= 0 && <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(docStepIdx)}>Edit</button>}
            </div>
            <div className={styles.reviewGrid}>
              {(existingDocs.length > 0 || Object.values(documents).some(d => d.file))
                ? (
                  <>
                    {existingDocs.map(doc => (
                      <div key={doc.id} className={styles.reviewItem}>
                        <label style={{ textTransform: 'capitalize' }}>{doc.document_type.replace(/_/g, ' ')}</label>
                        <span style={{ color: '#10b981' }}>✓ Uploaded</span>
                      </div>
                    ))}
                    {Object.entries(documents)
                      .filter(([_, data]) => data.file)
                      .map(([docType, _]) => (
                        <div key={docType} className={styles.reviewItem}>
                          <label style={{ textTransform: 'capitalize' }}>{docType.replace(/_/g, ' ')}</label>
                          <span style={{ color: '#10b981' }}>✓ Ready to upload</span>
                        </div>
                      ))}
                  </>
                )
                : <div className={styles.reviewItem}><label>Status</label><span style={{ color: '#f59e0b' }}>No documents uploaded yet</span></div>
              }
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.wizardContainer} wizard-shell`} style={{ minHeight: 'auto', background: 'transparent' }}>
      <div className={styles.wizardCard}>
        <div className={styles.cardHeader}>
          {isRejected && (
            <div style={{ background: 'var(--error)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', marginBottom: '1rem' }}>
              Action Required: Updating Rejected Profile
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className={styles.titleRow}>
              <div className={styles.stepIcon}><StepIcon size={28} strokeWidth={2.5} /></div>
              <h2 className={styles.stepTitle}>{step.label}</h2>
            </div>
            <button type="button" className="w-btn-back" onClick={handleSignOut} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--bg-default)' }}>Sign Out</button>
          </div>
          <p className={styles.stepDesc}>{step.desc}</p>
          <div className={styles.progressContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.cardBodyWrapper}>
          <div className={styles.cardBodyInner} key={currentStep}>
            {step.id === 'basic' && renderBasicInfo()}
            {step.id === 'personal' && <StepPersonalInfo data={formData} onChange={updateField} errors={errors} />}
            {step.id === 'address' && <StepAddress data={formData} onChange={updateField} errors={errors} />}
            {StepDynamicComponent && step.id !== 'documents' && (
              <StepDynamicComponent
                data={formData[step.id]}
                onChange={(k, v) => updateSection(step.id, k, v)}
                errors={errors[step.id] || {}}
              />
            )}
            {step.id === 'documents' && (
              <StepDocuments
                roleType={roleType}
                documents={documents}
                onChange={updateDocument}
                errors={docErrors}
                existingDocs={existingDocs}
              />
            )}
            {step.id === 'review' && renderReview()}
          </div>
        </div>

        <div className="w-nav">
          <button type="button" className="w-btn-back" onClick={handleBack} disabled={submitting || uploadingDocs}>
            <ChevronLeft size={20} />{currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          {isLastStep ? (
            <button type="button" className="w-btn-continue" onClick={handleSubmit} disabled={submitting || uploadingDocs}>
              {submitting || uploadingDocs ? 'Submitting...' : 'Complete Profile'}<CheckCircle2 size={20} />
            </button>
          ) : (
            <button type="button" className="w-btn-continue" onClick={handleNext}>
              Continue <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}