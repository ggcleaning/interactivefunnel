import React from 'react';

const SERVICE_OPTIONS = [
  { id: 'standard', label: 'Standard Clean', icon: '🧹', desc: 'Maintenance cleaning' },
  { id: 'deep', label: 'Deep Clean', icon: '✨', desc: 'Thorough, detailed clean' },
  { id: 'moveOut', label: 'Move In / Out', icon: '📦', desc: 'Entire home detailing' },
  { id: 'airbnb', label: 'Airbnb / Turnover', icon: '🔑', desc: 'Fast, guest-ready prep' }
];

const FREQUENCY_OPTIONS = [
  { id: 'one-time', label: 'One-Time', desc: 'No contract' },
  { id: 'weekly', label: 'Weekly', desc: 'Save 15%' },
  { id: 'bi-weekly', label: 'Bi-Weekly', desc: 'Save 10%' },
  { id: 'monthly', label: 'Monthly', desc: 'Save 5%' }
];

const CLUTTER_OPTIONS = [
  { id: 'low', label: 'Minimalist', icon: '✨', desc: 'Surfaces clear' },
  { id: 'medium', label: 'Average', icon: '🏠', desc: 'Daily living' },
  { id: 'high', label: 'Heavy', icon: '🧸', desc: 'Lots of items' }
];

export function OperationalIntelligenceStep({ data, onChange, onNext, onPrev }) {
  return (
    <div className="operational-step animate-concierge-fade">
      {/* 1. Service Type */}
      <section className="intelligence-group">
        <h3>Service Type</h3>
        <div className="option-grid">
          {SERVICE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.id}
              className={`option-button ${data.serviceCategory === opt.id ? 'active' : ''}`}
              onClick={() => onChange({ serviceCategory: opt.id })}
            >
              <span className="option-icon" style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
              <span className="option-subtitle">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Frequency */}
      <section className="intelligence-group" style={{ marginTop: '2rem' }}>
        <h3>Frequency</h3>
        <div className="option-grid grid-4">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.id}
              className={`option-button freq-button ${data.frequency === opt.id ? 'active' : ''}`}
              onClick={() => onChange({ frequency: opt.id })}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-subtitle discount-badge">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', marginTop: '2rem' }}>
        {/* 3. Pets */}
        <section className="intelligence-group">
          <h3>Do you have pets?</h3>
          <div className="toggle-group">
            <button 
              type="button"
              className={`toggle-btn ${data.hasPets ? 'active' : ''}`}
              onClick={() => onChange({ hasPets: true })}
            >
              🐾 Yes
            </button>
            <button 
              type="button"
              className={`toggle-btn ${!data.hasPets ? 'active' : ''}`}
              onClick={() => onChange({ hasPets: false })}
            >
              ❌ No
            </button>
          </div>
        </section>

        {/* 4. Clutter Level */}
        <section className="intelligence-group">
          <h3>Clutter Level</h3>
          <div className="option-grid grid-3">
            {CLUTTER_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                className={`option-button small-btn ${data.clutterLevel === opt.id ? 'active' : ''}`}
                onClick={() => onChange({ clutterLevel: opt.id })}
              >
                <span className="option-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="step-actions">
        <button type="button" className="btn-outline" onClick={onPrev}>Back</button>
        <button type="button" className="btn-primary" onClick={onNext}>Continue</button>
      </div>

      <style>{`
        .intelligence-group h3 {
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          color: var(--color-primary);
          font-weight: 600;
        }
        .option-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .option-grid.grid-4 {
          grid-template-columns: repeat(4, 1fr);
        }
        .option-grid.grid-3 {
          grid-template-columns: repeat(3, 1fr);
        }
        .option-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }
        .option-button:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .option-button.active {
          border-color: var(--color-primary);
          background: var(--color-bg-alt);
          color: var(--color-primary);
        }
        .option-label {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .option-subtitle {
          font-size: 0.75rem;
          color: var(--color-text-light);
          margin-top: 0.25rem;
        }
        .discount-badge {
          background: var(--color-bg-alt);
          color: var(--color-primary);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-weight: 700;
        }
        .toggle-group {
          display: flex;
          gap: 0.75rem;
        }
        .toggle-btn {
          flex: 1;
          padding: 0.85rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }
        .toggle-btn:hover {
          border-color: var(--color-primary);
        }
        .toggle-btn.active {
          border-color: var(--color-primary);
          background: var(--color-bg-alt);
          color: var(--color-primary);
        }
        .step-actions {
          margin-top: var(--spacing-xl);
          display: flex;
          justify-content: space-between;
        }
        @media (max-width: 600px) {
          .option-grid.grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          .row-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
