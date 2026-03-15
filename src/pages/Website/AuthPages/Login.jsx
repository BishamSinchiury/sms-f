import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import styles from './Login.module.css';

/**
 * LoginPage — handles both user and admin login.
 *
 * When "Login as System Admin" is checked, submits to the admin
 * endpoint via AdminAuthContext. Otherwise uses AuthContext.
 *
 * NOTE: This page is rendered inside <AuthProvider> for regular login.
 *       For admin login, the user can navigate to /admin/login instead;
 *       the checkbox here is a convenience shortcut.
 */
export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  function validate() {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isAdmin) {
        // Redirect to admin login page for the full admin flow (OTP, etc.)
        navigate('/admin/login');
        return;
      }

      await login(email, password);
      addToast({ type: 'success', message: 'Welcome back!' });
      navigate('/app/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.';

      // Show field-level error if it's a credentials issue
      if (err.response?.status === 401 || err.response?.status === 400) {
        setServerError(msg);
      } else {
        // Unexpected error → toast
        addToast({ type: 'error', message: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>
          Sign in to your account to continue
        </p>
      </div>

      {serverError && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
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

        <label className={styles.adminToggle}>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          Login as System Admin
        </label>

        {isAdmin && (
          <p className={styles.adminHint}>
            You'll be redirected to the admin login flow which requires OTP verification.
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          {isAdmin ? 'Continue to Admin Login' : 'Login'}
        </Button>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
          <Link to="/register" className={styles.link}>
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}