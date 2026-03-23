import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import publicApi from '@/services/axios/publicApi';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { TextInput, PasswordInput } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAuthenticated, user, loading, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  function validate() {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoadingState(true);
    try {
      const res = await publicApi.post('/auth/login/', { email, password });
      const { access_token, profile_complete, membership_status, role_type } = res.data;
      signIn(access_token, { profile_complete, membership_status, role_type });
      // Navigation handled by the if-block below on next render
    } catch (err) {
      if (!err.response) {
        addToast({ type: 'error', message: 'Network error. Please check your connection.' });
      } else if (err.response.status === 401 || err.response.status === 400) {
        setServerError(err.response.data?.detail || err.response.data?.message || 'Invalid credentials. Please try again.');
      } else {
        addToast({ type: 'error', message: err.response.data?.detail || 'Server error. Please try again later.' });
      }
    } finally {
      setLoadingState(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Restoring session...</p>
      </div>
    );
  }

  // FIX 2 (BUG 3): Redirect authenticated users based on status.
  // pending/waiting_approval/rejected → /app/profile/setup (ProfileSetup handles both form + status card)
  // suspended → /setup/status (StatusPage)
  // profile_complete=false → /app/profile/setup (was previously /here — a broken placeholder)
  if (isAuthenticated) {
    const s = user?.membership_status;
    if (!user?.profile_complete) return <Navigate to="/app/profile/setup" replace />;
    if (s === 'pending') return <Navigate to="/app/profile/setup" replace />;
    if (s === 'waiting_approval') return <Navigate to="/app/profile/setup" replace />;
    if (s === 'rejected') return <Navigate to="/app/profile/setup" replace />;
    if (s === 'suspended') return <Navigate to="/setup/status" replace />;
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your account to continue</p>
      </div>

      {serverError && (
        <p className={styles.serverError} role="alert">{serverError}</p>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
        />

        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loadingState}>
          Login
        </Button>

        <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/admin/login')}
          className={styles.adminBtn}
        >
          Login as System Admin
        </Button>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>Forgot password?</Link>
          <Link to="/register" className={styles.link}>Create an account</Link>
        </div>
      </form>
    </AuthLayout>
  );
}