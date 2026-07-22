import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStaffAuth } from '../auth/StaffAuthProvider';
import { sanitizeRedirectUrl } from '../utils/redirectSanitizer';
import './StaffLoginPage.css';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, isAuthenticated, staff } = useStaffAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawReturnTo = searchParams.get('returnTo');
  const targetDestination = sanitizeRedirectUrl(rawReturnTo, '/operations');

  // If already authenticated and verified, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated && staff) {
      navigate(targetDestination, { replace: true });
    }
  }, [isAuthenticated, staff, navigate, targetDestination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(targetDestination, { replace: true });
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="staff-login-container">
      <div className="staff-login-card">
        <div className="staff-login-header">
          <span className="staff-login-badge">Internal Operations</span>
          <h1 className="staff-login-title">G&G Staff Sign In</h1>
          <p className="staff-login-subtitle">Enter your staff credentials to access the command center</p>
        </div>

        {errorMsg && (
          <div className="staff-login-alert" role="alert">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="staff-login-form" onSubmit={handleSubmit}>
          <div className="staff-field-group">
            <label className="staff-field-label" htmlFor="staff-email-input">
              Staff Email
            </label>
            <div className="staff-input-wrapper">
              <input
                id="staff-email-input"
                type="email"
                className="staff-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ggcleaningli.com"
                required
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="staff-field-group">
            <label className="staff-field-label" htmlFor="staff-password-input">
              Password
            </label>
            <div className="staff-input-wrapper">
              <input
                id="staff-password-input"
                type={showPassword ? 'text' : 'password'}
                className="staff-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="staff-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="staff-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" /> Authenticating...
              </>
            ) : (
              'Sign In to Staff Console'
            )}
          </button>
        </form>

        <div className="staff-login-footer">
          G&G Cleaning Services LI — Authorized Staff Access Only
        </div>
      </div>
    </div>
  );
}
