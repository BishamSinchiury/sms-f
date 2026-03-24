import { useState, useEffect } from 'react';
import publicApi from '@/services/axios/publicApi';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import styles from './UserProfile.module.css';
import { PageContainer } from '@/components/layout/AdminLayout/PageContainer';
import { Upload, FileText, CheckCircle, Clock } from 'lucide-react';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('NATIONAL_ID');
  const [docNumber, setDocNumber] = useState('');
  const [uploading, setUploading] = useState(false);

  async function fetchProfile() {
    try {
      const res = await publicApi.get('/profile/me/');
      setProfile(res.data);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleDocUpload(e) {
    e.preventDefault();
    if (!docFile || !docNumber) {
      addToast({ type: 'error', message: 'Please provide a document file and number.' });
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('document_type', docType);
    fd.append('document_number', docNumber);
    fd.append('front_image', docFile);
    
    try {
      await publicApi.post('/profile/me/documents/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast({ type: 'success', message: 'Document uploaded successfully!' });
      setDocFile(null);
      setDocNumber('');
      fetchProfile();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!profile) return <div className={styles.error}>Profile not found.</div>;

  return (
    <PageContainer title="My Profile" breadcrumbs={[{ label: 'App', href: '/app/dashboard' }, { label: 'My Profile' }]}>
      <div className={styles.container}>
        {/* Profile Card */}
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.profilePhotoSection}>
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className={styles.profilePhotoLarge}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={styles.profilePhotoInitials}
                style={{ display: profile?.photo_url ? 'none' : 'flex' }}
              >
                {profile?.first_name?.[0] || '?'}{profile?.last_name?.[0] || ''}
              </div>
            </div>
            <div className={styles.titleInfo}>
              <h2 className={styles.name}>{profile.first_name} {profile.last_name}</h2>
              <p className={styles.role}>{profile.role_type?.toUpperCase()}</p>
            </div>
          </div>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{profile.email}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>
              <span className={styles.detailValue}>{profile.phone_number || '-'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>DOB</span>
              <span className={styles.detailValue}>{profile.date_of_birth || '-'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Gender</span>
              <span className={styles.detailValue}>{profile.gender || '-'}</span>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Identity Documents</h3>
          <p className={styles.cardSub}>Upload your identification documents for verification.</p>
          
          <div className={styles.docList}>
             {profile.identity_documents?.length === 0 && <p className={styles.empty}>No documents uploaded yet.</p>}
             {profile.identity_documents?.map(doc => (
               <div key={doc.id} className={styles.docItem}>
                  <div className={styles.docIcon}><FileText size={20} /></div>
                  <div className={styles.docInfo}>
                    <p className={styles.docType}>{doc.document_type.replace('_', ' ')}</p>
                    <p className={styles.docNum}># {doc.document_number}</p>
                  </div>
                  <div className={styles.docStatus}>
                     {doc.is_verified ? (
                       <span className={styles.verified}><CheckCircle size={16}/> Verified</span>
                     ) : (
                       <span className={styles.pending}><Clock size={16}/> Pending review</span>
                     )}
                  </div>
               </div>
             ))}
          </div>
          
          <div className={styles.uploadSection}>
            <h4 className={styles.uploadTitle}>Upload New Document</h4>
            <form onSubmit={handleDocUpload} className={styles.uploadForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Document Type</label>
                  <select className={styles.select} value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Document Number</label>
                  <input type="text" className={styles.input} placeholder="Enter ID number" value={docNumber} onChange={e => setDocNumber(e.target.value)} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Document File (Front Image)</label>
                <div className={styles.fileInputWrapper}>
                  <input type="file" className={styles.fileInput} onChange={e => setDocFile(e.target.files[0])} accept="image/*,.pdf" required />
                </div>
              </div>
              <Button type="submit" variant="primary" loading={uploading} style={{ marginTop: '0.5rem' }}>
                <Upload size={16} style={{ marginRight: '8px' }}/> Upload Document
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
     
  );
}
