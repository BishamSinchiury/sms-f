import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { TextInput, PasswordInput } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import styles from './AdminLogin.module.css';

/**
 * AdminLogin — Dedicated page for System Admin login.
 * Implements a 2-step flow:
 *   1. Credentials (Email/Password)
 *   2. Multi-Factor (OTP)
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    authStep,
    loading,
    error,
    submitCredentials,
    submitOtp,
    resetFlow
  } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // FIX 14 (BUG 17): Reset auth flow only if user navigated back mid-flow.
  // On fresh mount, authStep is 'idle' → no-op. When returning during 'otp_pending'
  // step, authStep !== 'idle' → reset to clean state.
  useEffect(() => {
    if (authStep !== 'idle') {
      resetFlow();
    }
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authStep === 'authed') {
      addToast({ type: 'success', message: 'Welcome, System Admin.' });
      navigate('/app/admin/dashboard');
    }
  }, [authStep, navigate, addToast]);

  const validateCredentials = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCredentials();
    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await submitCredentials(email, password);
    } catch (err) {
      // Errors handled by context + displayed via `error` prop
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setValidationErrors({ otp: 'OTP is required' });
      return;
    }

    try {
      await submitOtp(otp);
    } catch (err) {
      // Errors handled by context
    }
  };

  const isOtpStep = authStep === 'otp_pending';

  return (
    <AuthLayout brandTitle="Admin Gateway">
      <div className={styles.header}>
        <h2 className={styles.title}>
          {isOtpStep ? 'Security Verification' : 'System Admin Login'}
        </h2>
        <p className={styles.subtitle}>
          {isOtpStep
            ? 'Enter the 6-digit code sent to your device'
            : 'Access the system management console'}
        </p>
      </div>

      {error && (
        <p className={styles.serverError} role="alert">
          {error}
        </p>
      )}

      {!isOtpStep ? (
        <form className={`${styles.form} ${styles.stepContainer}`} onSubmit={handleCredentialSubmit} noValidate>
          <TextInput
            id="admin-email"
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
            error={validationErrors.email}
            disabled={loading}
          />

          <PasswordInput
            id="admin-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            error={validationErrors.password}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Identify Admin
          </Button>

          <div className={styles.links}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate('/login')}
            >
              ← Back to user login
            </button>
          </div>
        </form>
      ) : (
        <form className={`${styles.form} ${styles.stepContainer}`} onSubmit={handleOtpSubmit} noValidate>
          <div className={styles.otpInstructions}>
            A one-time password has been sent to <strong>{email}</strong>.
            It will expire in 5 minutes.
          </div>

          <TextInput
            id="admin-otp"
            label="OTP Code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            error={validationErrors.otp}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Verify & Enter
          </Button>

          <div className={styles.links}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={resetFlow}
            >
              ← Use different credentials
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}