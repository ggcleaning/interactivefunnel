import React from 'react';
import { Link } from 'react-router-dom';
import { useStaffAuth } from '../auth/StaffAuthProvider';
import './OperationsDashboardPage.css';

export default function OperationsDashboardPage() {
  const { staff, role, signOut } = useStaffAuth();

  return (
    <div className="ops-dashboard-container">
      <header className="ops-header">
        <div className="ops-title-group">
          <h1>G&G Operations Command Center</h1>
          <p>Phase 3A Staff Auth Foundation & Route Protection Shell</p>
        </div>

        <div className="ops-user-badge">
          <div className="ops-user-info">
            <div className="ops-user-name">{staff?.displayName || staff?.email}</div>
            <div className="ops-user-role">{role || 'staff'}</div>
          </div>
          <button onClick={signOut} className="ops-logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main>
        <div className="ops-placeholder-card">
          <h2>🔒 Staff Authorization Verified</h2>
          <p>
            Welcome back, <strong>{staff?.displayName || staff?.email}</strong>. You have successfully authenticated through Supabase Auth and passed server-side staff verification via <code>/.netlify/functions/staff-session</code>.
          </p>
          <p>
            The full Read-Only Operations Command Center (lead ledgers, Stripe payment statuses, GHL queue monitoring, and quote history) is scheduled for implementation in <strong>Phase 3A.1</strong>.
          </p>
          <div className="ops-actions">
            <Link to="/internal-quote" className="ops-link-btn">
              Open Internal Quote Desk →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
