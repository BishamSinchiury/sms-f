import React, { useRef, useState, useEffect } from 'react';
import './StepPersonalInfo.css';
import './StepFields.css';

const GENDER_OPTIONS = [
  { value: "male",             label: "Male" },
  { value: "female",           label: "Female" },
  { value: "other",            label: "Other" },
  { value: "prefer_not_to_say",label: "Prefer not to say" },
];

const BLOOD_GROUP_OPTIONS = [
  "", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

export default function StepPersonalInfo({ data, onChange, errors }) {
  const photoInputRef = useRef(null);
  const [photoError, setPhotoError] = useState(null);
  
  const [photoPreview, setPhotoPreview] = useState(
    typeof data.photo === 'string' && data.photo ? data.photo : null
  );

  useEffect(() => {
    if (data.photo instanceof File) {
      const url = URL.createObjectURL(data.photo);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof data.photo === 'string' && data.photo) {
      setPhotoPreview(data.photo);
    } else {
      setPhotoPreview(null);
    }
  }, [data.photo]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be under 2MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange('photo', file);
    setPhotoPreview(previewUrl);
    setPhotoError(null);
  };

  return (
    <div>
      <div className="spi-photo-row">
        <div
          className="spi-photo-circle"
          onClick={() => photoInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && photoInputRef.current?.click()}
        >
          {photoPreview
            ? <img src={photoPreview} alt="Profile preview" />
            : (
              <div className="spi-photo-placeholder">
                📷
                <span>No photo</span>
              </div>
            )
          }
          <div className="spi-photo-overlay">✎</div>
        </div>

        <div className="spi-photo-meta">
          <button
            type="button"
            className="spi-photo-btn"
            onClick={() => photoInputRef.current?.click()}
          >
            {photoPreview ? 'Change Photo' : 'Upload Photo'}
          </button>
          <p className="spi-photo-hint">
            JPG, PNG or WebP · Max 2MB<br />
            Recommended: 256×256px
          </p>
          {(photoError || errors?.photo) && <p className="sf-error">{photoError || errors?.photo}</p>}
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="sf-grid-2">
        <div className="sf-group">
          <label htmlFor="pi-dob" className="sf-label">
            Date of Birth <span className="sf-optional">(optional)</span>
          </label>
          <input
            id="pi-dob"
            type="date"
            value={data.date_of_birth || ''}
            onChange={(e) => onChange("date_of_birth", e.target.value)}
            className={`sf-input${errors?.date_of_birth ? ' has-error' : ''}`}
          />
          {errors?.date_of_birth && <p className="sf-error">{errors.date_of_birth}</p>}
        </div>

        <div className="sf-group">
          <label htmlFor="pi-gender" className="sf-label">Gender</label>
          <div className="sf-select-wrap">
            <select
              id="pi-gender"
              value={data.gender || ''}
              onChange={(e) => onChange("gender", e.target.value)}
              className={`sf-select${errors?.gender ? ' has-error' : ''}`}
            >
              <option value="">— Select gender —</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {errors?.gender && <p className="sf-error">{errors.gender}</p>}
        </div>
      </div>

      <div className="sf-grid-2">
        <div className="sf-group">
          <label htmlFor="pi-blood" className="sf-label">
            Blood Group <span className="sf-optional">(optional)</span>
          </label>
          <div className="sf-select-wrap">
            <select
              id="pi-blood"
              value={data.blood_group || ''}
              onChange={(e) => onChange("blood_group", e.target.value)}
              className="sf-select"
            >
              <option value="">— Select blood group —</option>
              {BLOOD_GROUP_OPTIONS.filter(Boolean).map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sf-group">
          <label htmlFor="pi-nationality" className="sf-label">
            Nationality <span className="sf-optional">(optional)</span>
          </label>
          <input
            id="pi-nationality"
            type="text"
            value={data.nationality || ''}
            onChange={(e) => onChange("nationality", e.target.value)}
            placeholder="e.g. Nepali"
            className="sf-input"
          />
        </div>
      </div>

      <div className="sf-group">
        <label htmlFor="pi-religion" className="sf-label">
          Religion <span className="sf-optional">(optional)</span>
        </label>
        <input
          id="pi-religion"
          type="text"
          value={data.religion || ''}
          onChange={(e) => onChange("religion", e.target.value)}
          placeholder="e.g. Hindu, Muslim, Christian…"
          className="sf-input"
        />
      </div>

      <h3 className="sf-section-title" style={{ marginTop: '24px', fontSize: '1rem', color: '#111827', fontWeight: 600 }}>Emergency Contact <span className="sf-optional">(optional)</span></h3>
      <div className="sf-grid-2">
        <div className="sf-group">
          <label htmlFor="ec-name" className="sf-label">Contact Name</label>
          <input
            id="ec-name"
            type="text"
            value={data.emergency_contact_name || ''}
            onChange={(e) => onChange("emergency_contact_name", e.target.value)}
            className="sf-input"
            placeholder="e.g. Jane Doe"
          />
        </div>
        <div className="sf-group">
          <label htmlFor="ec-phone" className="sf-label">Contact Phone</label>
          <input
            id="ec-phone"
            type="text"
            value={data.emergency_contact_phone || ''}
            onChange={(e) => onChange("emergency_contact_phone", e.target.value)}
            className="sf-input"
            placeholder="+977 98XXXXXXXX"
          />
        </div>
      </div>
      <div className="sf-group" style={{ marginTop: '16px' }}>
        <label htmlFor="ec-relation" className="sf-label">Relation</label>
        <input
          id="ec-relation"
          type="text"
          value={data.emergency_contact_relation || ''}
          onChange={(e) => onChange("emergency_contact_relation", e.target.value)}
          className="sf-input"
          placeholder="e.g. Spouse, Parent, Sibling"
        />
      </div>
    </div>
  );
}
