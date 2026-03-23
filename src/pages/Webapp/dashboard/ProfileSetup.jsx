import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import authApi from '@/services/axios/authApi';
import { useToast } from '@/components/ui/Toast';
import { TextInput } from '@/components/ui/Input';
import { User, ShieldCheck, MapPin, Briefcase, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

import StepPersonalInfo from '@/features/auth/register/steps/StepPersonalInfo';
import StepAddress from '@/features/auth/register/steps/StepAddress';
import StepTeacher from '@/features/auth/register/steps/StepTeacher';
import StepStudent from '@/features/auth/register/steps/StepStudent';
import StepStaff from '@/features/auth/register/steps/StepStaff';
import StepParent from '@/features/auth/register/steps/StepParent';
import StepVendor from '@/features/auth/register/steps/StepVendor';

import {
  validatePersonalInfo,
  validateAddress,
  validateTeacher,
  validateStudent,
  validateStaff,
  validateParent,
  validateVendor,
} from '@/features/auth/register/utils/validateStep';

import '@/features/auth/register/WizardShell.css';
import '@/features/auth/register/steps/StepFields.css';
import styles from './ProfileSetup.module.css';

const ROLE_CONFIG = {
  teacher: { Component: StepTeacher, validate: validateTeacher, label: 'Teacher Details', icon: Briefcase },
  student: { Component: StepStudent, validate: validateStudent, label: 'Student Details', icon: Briefcase },
  staff:   { Component: StepStaff, validate: validateStaff, label: 'Staff Details', icon: Briefcase },
  parent:  { Component: StepParent, validate: validateParent, label: 'Parent Details', icon: Briefcase },
  vendor:  { Component: StepVendor, validate: validateVendor, label: 'Vendor Details', icon: Briefcase },
};

export default function ProfileSetup() {
  const { user, tryRestoreSession, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',

    date_of_birth: '',
    gender: 'prefer_not_to_say',
    blood_group: '',
    nationality: '',
    religion: '',

    address_line_1: '',
    address_line_2: '',
    city: '',
    state_or_province: '',
    postal_code: '',
    country: '',
    
    photo: '',
    photo_url: '',
    

    teacher: { specialization: '', qualification: '', joining_date: '' },
    student: { grade: '', enrollment_number: '', guardian_name: '', guardian_phone: '', guardian_relation: '' },
    staff: { department: '', designation: '', joining_date: '' },
    parent: { linked_student_id: '', relation_to_student: '' },
    vendor: { company_name: '', service_type: '', tax_id: '' },
  });

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false); // FIX 5 (BUG 6): track profile fetch failure
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  // BUG 1 FIX + GAP 1 FIX:
  // showForm must NOT initialize from user?.membership_status because user is null
  // on mount when AuthContext is still resolving (browser reload case).
  // formInitialized prevents rendering either the form OR the card until the
  // useEffect has fired at least once with a real user object — eliminating both:
  //   a) the form flicker for waiting_approval users (showForm was stuck at true)
  //   b) the card flicker for rejected users (showForm was false before useEffect)
  const [showForm, setShowForm] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const membershipStatus = user?.membership_status;
  const roleType = user?.role_type;
  const isRejected = membershipStatus === 'rejected';

  // Reactively set showForm once user is available and loading is done.
  // 'pending' and 'rejected' both show the editable form.
  // 'waiting_approval' and 'suspended' both show the status card.
  useEffect(() => {
    if (!user) return;
    setShowForm(['pending', 'rejected'].includes(user.membership_status));
    setFormInitialized(true); // unlock rendering — prevents all flash states
  }, [user?.membership_status]);

  // Define steps dynamically based on role

  const steps = [
    { id: 'basic', label: 'Basic Info', desc: 'Your core account details.', icon: User },
    { id: 'personal', label: 'Personal Info', desc: 'A bit more about yourself.', icon: ShieldCheck },
    { id: 'address', label: 'Address', desc: 'Where can we find you?', icon: MapPin },
  ];
  
  if (roleType && ROLE_CONFIG[roleType]) {
    steps.push({
      id: roleType,
      label: ROLE_CONFIG[roleType].label,
      desc: 'Specific role requirements.',
      icon: ROLE_CONFIG[roleType].icon
    });
  }
  
  // Final Review step
  steps.push({ id: 'review', label: 'Review & Submit', desc: 'Verify your details before finalizing.', icon: CheckCircle2 });
  useEffect(() => {
    async function fetchProfile() {
      try {
        setFetchError(false); // FIX 5: reset on retry
        const res = await authApi.get('/profile/me/');
        const profile = res.data;
        
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
            photo_url: profile.photo_url || '',
            photo: profile.photo_url || '',
          };
          if (profile.role_type && profile[profile.role_type]) {
            updated[profile.role_type] = {
              ...prev[profile.role_type],
              ...profile[profile.role_type],
            };
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
        // FIX 5 (BUG 6): Set error state so user sees retry button, not blank form.
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // GAP 1 + BUG 1: show loading spinner while any of these are unresolved:
  // - AuthContext still loading (user might change)
  // - formInitialized is false (useEffect hasn't fired yet — prevents all flash states)
  // - profile fetch still in progress
  if (!user || loading || !formInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }

  // FIX 5 (BUG 6): If profile fetch failed, show error + retry button.
  // Prevents the form from rendering with empty first_name / last_name / phone
  // which the user might unknowingly submit.
  if (fetchError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--error, #dc2626)', fontWeight: 500 }}>Failed to load your profile data.</p>
        <button
          onClick={() => { setLoading(true); setFetchError(false); window.location.reload(); }}
          style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          Retry
        </button>
      </div>
    );
  }

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function updateSection(section, key, value) {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setErrors(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: undefined }
    }));
  }

  // Basic step validation
  function validateBasicInfo() {
    let isValid = true;
    let newErrs = {};
    if (!formData.first_name.trim()) { newErrs.first_name = 'First name is required'; isValid = false; }
    if (!formData.last_name.trim()) { newErrs.last_name = 'Last name is required'; isValid = false; }
    if (!formData.phone_number.trim()) { newErrs.phone_number = 'Phone number is required'; isValid = false; }
    setErrors(newErrs);
    return isValid;
  }

  function validateCurrentStep() {
    if (step.id === 'basic') return validateBasicInfo();
    if (step.id === 'personal') {
      const { valid, errors: errs } = validatePersonalInfo(formData);
      setErrors(errs); return valid;
    }
    if (step.id === 'address') {
      const { valid, errors: errs } = validateAddress(formData);
      setErrors(errs); return valid;
    }

    if (step.id === 'review') return true;
    
    // Role-specific validation
    const config = ROLE_CONFIG[step.id];
    if (config) {
      const { valid, errors: errs } = config.validate(formData[step.id]);
      setErrors({ [step.id]: errs });
      return valid;
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    if (currentStep === 0) {
      navigate('/app/dashboard');
      return;
    }
    setCurrentStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // STEP 1: Update Person fields via /profile/me/.
      // GAP 3 / BUG 4: if step 1 fails we STOP here — step 2 must not run.
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
        payload.append('photo', formData.photo);

        // FIX 4 (BUG 9): Append role-specific data as JSON to the multipart payload.
        // Without this, teacher specialization, student guardian info, etc. are silently
        // lost when a photo is being uploaded. PersonSerializer.update() already handles
        // JSON-encoded role data via the role key in extra_data.
        if (roleType && formData[roleType]) {
          payload.append(roleType, JSON.stringify(formData[roleType]));
        }

        await authApi.patch('/profile/me/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const payload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender,
          blood_group: formData.blood_group || null,
          nationality: formData.nationality,
          religion: formData.religion,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          city: formData.city,
          state_or_province: formData.state_or_province,
          postal_code: formData.postal_code,
          country: formData.country,
        };
        if (roleType && formData[roleType]) {
          payload[roleType] = formData[roleType];
        }
        await authApi.patch('/profile/me/', payload);
      }
    } catch (err) {
      // Step 1 failed — stop completely, do not touch membership status.
      console.error('Step 1 (profile/me) failed:', err);
      addToast({ type: 'error', message: 'Failed to save your profile. Please check your connection and try again.' });
      setSubmitting(false);
      return; // GAP 3: explicit early return — step 2 never runs if step 1 fails
    }

    try {
      // STEP 2: Trigger status transition to WAITING_APPROVAL via /users/me/profile/.
      // Only runs if step 1 succeeded. UserProfileUpdateView sets status = WAITING_APPROVAL.
      await authApi.patch('/users/me/profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      });
    } catch (err) {
      // Step 2 failed — Person data is already saved but status was not updated.
      // GAP 3: specific message distinguishes this from a step-1 failure.
      console.error('Step 2 (users/me/profile) failed:', err);
      addToast({
        type: 'error',
        message: 'Your profile was saved but submission failed. Please try submitting again.',
      });
      setSubmitting(false);
      return; // do not call tryRestoreSession or navigate
    }

    // GAP 3: BOTH steps succeeded. Refresh AuthContext BEFORE navigating so that
    // when ProfileSetup remounts, user.membership_status is already 'waiting_approval'
    // and the useEffect fires correctly — no flash of the wrong view.
    await tryRestoreSession();
    addToast({ type: 'success', message: 'Profile submitted! Awaiting admin approval.' });
    // Navigate directly to /app/profile/setup — not /app/dashboard — to skip the
    // PrivateRoute redirect hop and land immediately on the status card.
    navigate('/app/profile/setup');
    setSubmitting(false);
  }

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

  const renderReview = () => (
    <div key="review" className={styles.reviewWrapper}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Please confirm that all information is correct. You can go back to edit any section.
      </p>

      {formData.photo_url && (
         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img src={formData.photo_url} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
         </div>
      )}

      {/* Basic Section */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h4>Basic Info</h4>
          {showForm && <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(0)}>Edit</button>}
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}><label>Full Name</label><span>{formData.first_name} {formData.last_name}</span></div>
          <div className={styles.reviewItem}><label>Phone</label><span>{formData.phone_number}</span></div>
        </div>
      </div>

      {/* Personal Section */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h4>Personal Info</h4>
          {showForm && <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(1)}>Edit</button>}
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}><label>DOB</label><span>{formData.date_of_birth || '-'}</span></div>
          <div className={styles.reviewItem}><label>Gender</label><span style={{ textTransform: 'capitalize' }}>{formData.gender.replace(/_/g, ' ')}</span></div>
          <div className={styles.reviewItem}><label>Nationality</label><span>{formData.nationality || '-'}</span></div>
        </div>
      </div>

      {/* Address Section */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h4>Address</h4>
          {showForm && <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(2)}>Edit</button>}
        </div>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewItem}><label>Line 1</label><span>{formData.address_line_1 || '-'}</span></div>
          <div className={styles.reviewItem}><label>City</label><span>{formData.city || '-'}</span></div>
          <div className={styles.reviewItem}><label>Country</label><span>{formData.country || '-'}</span></div>
        </div>
      </div>
      


      {/* Role Section */}
      {roleType && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <h4 style={{ textTransform: 'capitalize' }}>{roleType} Details</h4>
            {showForm && <button type="button" className={styles.editBtn} onClick={() => setCurrentStep(3)}>Edit</button>}
          </div>
          <div className={styles.reviewGrid}>
            <div className={styles.reviewItem}><label>Data Filled</label><span>✓ Form completed</span></div>
          </div>
        </div>
      )}
    </div>
  );

  const StepDynamicComponent = ROLE_CONFIG[step.id]?.Component;
  const progressPercent = (currentStep / (totalSteps - 1)) * 100;

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    return `${base.replace(/\/api\/?$/, '')}${path}`;
  };

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
           
           {/* Header */}
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 {formData.photo_url ? (
                    <img src={getMediaUrl(formData.photo_url)} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                 ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                       <User size={32} color="#9ca3af" />
                    </div>
                 )}
                 <div>
                   <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>Profile Overview</h1>
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                     <span style={{ display: 'inline-block', padding: '4px 12px', background: config.badgeBg, color: config.badgeText, borderRadius: '16px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                       Status: {config.label}
                     </span>
                     {roleType && (
                       <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e0e7ff', color: '#4338ca', borderRadius: '16px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                         Role: {roleType}
                       </span>
                     )}
                   </div>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                 {membershipStatus === 'rejected' && (
                    <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                      Edit and Resubmit
                    </button>
                 )}
                 <button onClick={handleSignOut} style={{ padding: '8px 16px', background: 'white', border: '1px solid #d1d5db', color: '#374151', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                   Sign Out
                 </button>
              </div>
           </div>

           <div style={{ marginBottom: '24px', padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
             <p style={{ margin: 0, color: '#4b5563', fontSize: '15px' }}>{config.msg}</p>
           </div>

           {/* Cards Grid */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
             
             {/* Basic Info Card */}
             <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Basic Information</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>First Name</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.first_name || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Last Name</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.last_name || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Phone</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.phone_number || 'Not provided'}</span></div>
               </div>
             </div>

             {/* Personal Info Card */}
             <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Personal Details</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Date of Birth</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.date_of_birth || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Gender</span><span style={{ fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>{formData.gender ? formData.gender.replace(/_/g, ' ') : 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Blood Group</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.blood_group || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Nationality</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.nationality || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Religion</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.religion || 'Not provided'}</span></div>
               </div>
             </div>

             {/* Address Info Card */}
             <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Address Details</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Line 1</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.address_line_1 || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>City</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.city || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>State / Province</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.state_or_province || 'Not provided'}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Country</span><span style={{ fontWeight: '500', color: '#111827' }}>{formData.country || 'Not provided'}</span></div>
               </div>
             </div>

             {/* Role Info Card */}
             {roleType && (
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px', textTransform: 'capitalize' }}>{roleType} Role Settings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Submission Target</span><span style={{ fontWeight: '500', color: '#10b981' }}>Complete</span></div>
                  </div>
                </div>
             )}

           </div>
         </div>
       </div>
    );
  }

  return (
    <div className={`${styles.wizardContainer} wizard-shell`} style={{ minHeight: 'auto', background: 'transparent' }}>
      <div className={styles.wizardCard}>
        
        {/* Card Header & Progress Tracker */}
        <div className={styles.cardHeader}>
          {isRejected && (
            <div style={{ background: 'var(--error)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', marginBottom: '1rem' }}>
              Action Required: Updating Rejected Profile
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className={styles.titleRow}>
              <div className={styles.stepIcon}>
                <StepIcon size={28} strokeWidth={2.5} />
              </div>
              <h2 className={styles.stepTitle}>{step.label}</h2>
            </div>
            <button type="button" className="w-btn-back" onClick={handleSignOut} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--bg-default)' }}>
              Sign Out
            </button>
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

        {/* Scrollable Form Content */}
        <div className={styles.cardBodyWrapper}>
          <div className={styles.cardBodyInner} key={currentStep}>
            {step.id === 'basic' && renderBasicInfo()}
            {step.id === 'personal' && <StepPersonalInfo data={formData} onChange={updateField} errors={errors} />}
            {step.id === 'address' && <StepAddress data={formData} onChange={updateField} errors={errors} />}
                        {StepDynamicComponent && (
              <StepDynamicComponent
                data={formData[step.id]}
                onChange={(k, v) => updateSection(step.id, k, v)}
                errors={errors[step.id] || {}}
              />
            )}
            {step.id === 'review' && renderReview()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-nav">
          <button type="button" className="w-btn-back" onClick={handleBack} disabled={submitting}>
            <ChevronLeft size={20} />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {isLastStep ? (
            <button type="button" className="w-btn-continue" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Complete Profile'}
              <CheckCircle2 size={20} />
            </button>
          ) : (
            <button type="button" className="w-btn-continue" onClick={handleNext}>
              Continue
              <ChevronRight size={20} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
