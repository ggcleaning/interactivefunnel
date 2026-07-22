import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from './StaffAuthProvider';
import { sanitizeRedirectUrl } from '../utils/redirectSanitizer';

export default function ProtectedStaffRoute({ children, allowedRoles = ['owner_admin', 'staff'] }) {
  const { isAuthenticated, isLoading, staff, role, authError, signOut } = useStaffAuth();
  const location = useLocation();

  // 1. Neutral loading state (Prevents flash of protected content before server authorization)
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090a0f',
        color: 'rgba(255,255,255,0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>Verifying Staff Authorization...</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to /staff-login with safe returnTo
  if (!isAuthenticated || !staff) {
    const rawDestination = `${location.pathname}${location.search}`;
    const safeReturnTo = sanitizeRedirectUrl(rawDestination, '/operations');
    return <Navigate to={`/staff-login?returnTo=${encodeURIComponent(safeReturnTo)}`} replace />;
  }

  // 3. Authenticated but unauthorized role -> Access Denied State
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090a0f',
        color: '#f87171',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#ef4444' }}>403 — Access Denied</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Your staff account (<strong>{staff.email}</strong>) has role <code>{role}</code>, which is not authorized for this view.
          </p>
          {authError && <p style={{ fontSize: '0.85rem', color: '#fca5a5', marginBottom: '1rem' }}>{authError}</p>}
          <button
            onClick={signOut}
            style={{
              background: '#27272a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.65rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 4. Authorized -> Render protected route content
  return children;
}
