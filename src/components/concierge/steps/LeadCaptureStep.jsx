import React from 'react';

export function LeadCaptureStep({ data, onChange, onNext, onPrev }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="lead-capture-step animate-concierge-fade">
      <p className="step-intro">We're almost there. Where should we send your personalized cleaning plan?</p>
      
      <form onSubmit={handleSubmit} className="premium-form">
        <div className="form-row">
          <div className="input-group">
            <label>First Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Jane"
              value={data.firstName || ''} 
              onChange={(e) => onChange({ firstName: e.target.value })} 
            />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Smith"
              value={data.lastName || ''} 
              onChange={(e) => onChange({ lastName: e.target.value })} 
            />
          </div>
        </div>

        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email" 
            required
            placeholder="jane@example.com"
            value={data.email || ''} 
            onChange={(e) => onChange({ email: e.target.value })} 
          />
        </div>

        <div className="input-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            required
            placeholder="(555) 000-0000"
            value={data.phone || ''} 
            onChange={(e) => onChange({ phone: e.target.value })} 
          />
        </div>

        <div className="trust-badge">
          <span className="icon">🔒</span>
          <span className="text">Your information is secure and never shared.</span>
        </div>

        <div className="step-actions">
          <button type="button" className="btn-outline" onClick={onPrev}>Back</button>
          <button type="submit" className="btn-primary">View My Estimate</button>
        </div>
      </form>

      <style>{`
        .step-intro {
          text-align: center;
          margin-bottom: 2rem;
          font-size: 1.1rem;
          color: var(--color-text-light);
        }
        .premium-form {
          max-width: 500px;
          margin: 0 auto;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .input-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--color-primary);
        }
        .input-group input {
          padding: 0.875rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }
        .input-group input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 4px rgba(75, 35, 114, 0.1);
        }
        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 1.5rem 0;
          padding: 0.75rem;
          background: var(--color-bg-alt);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--color-text-light);
        }
        .step-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }
        @media (max-width: 500px) {
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
