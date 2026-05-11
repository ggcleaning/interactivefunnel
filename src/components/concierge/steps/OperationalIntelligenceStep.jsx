import React from 'react';

const CLUTTER_OPTIONS = [
  { id: 'low', label: 'Minimalist', icon: '✨', desc: 'Clear surfaces, tidy' },
  { id: 'medium', label: 'Average', icon: '🏠', desc: 'Typical daily living' },
  { id: 'high', label: 'Heavy', icon: '🧸', desc: 'Lots of items/clutter' }
];

export function OperationalIntelligenceStep({ data, onChange, onNext, onPrev }) {
  return (
    <div className="operational-step animate-concierge-fade">
      <section className="intelligence-group">
        <h3>Clutter Level</h3>
        <div className="option-grid">
          {CLUTTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`option-button ${data.clutterLevel === opt.id ? 'active' : ''}`}
              onClick={() => onChange({ clutterLevel: opt.id })}
            >
              <span className="option-icon" style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
              <span className="option-subtitle">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="intelligence-group" style={{ marginTop: '2rem' }}>
        <h3>Do you have pets?</h3>
        <div className="toggle-group">
          <button 
            className={`toggle-btn ${data.hasPets ? 'active' : ''}`}
            onClick={() => onChange({ hasPets: true })}
          >
            🐾 Yes
          </button>
          <button 
            className={`toggle-btn ${!data.hasPets ? 'active' : ''}`}
            onClick={() => onChange({ hasPets: false })}
          >
            ❌ No
          </button>
        </div>
      </section>

      <div className="step-actions">
        <button className="btn-outline" onClick={onPrev}>Back</button>
        <button className="btn-primary" onClick={onNext}>Continue</button>
      </div>

      <style>{`
        .intelligence-group h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: var(--color-primary);
        }
        .toggle-group {
          display: flex;
          gap: 1rem;
        }
        .toggle-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          font-weight: 600;
          transition: all 0.3s ease;
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
      `}</style>
    </div>
  );
}
