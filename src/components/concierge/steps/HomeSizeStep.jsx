import React from 'react';

export function HomeSizeStep({ data, onChange, onNext, onPrev }) {
  const updateCount = (field, delta) => {
    const newVal = Math.max(1, (data[field] || 1) + delta);
    onChange({ [field]: newVal });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="home-size-step animate-concierge-fade">
      <form onSubmit={handleSubmit} className="premium-form">
        <div className="counter-row">
          <label>How many Bedrooms?</label>
          <div className="counter-controls">
            <button type="button" onClick={() => updateCount('bedrooms', -1)} className="btn-counter">-</button>
            <span className="count-display">{data.bedrooms || 1}</span>
            <button type="button" onClick={() => updateCount('bedrooms', 1)} className="btn-counter">+</button>
          </div>
        </div>

        <div className="counter-row">
          <label>How many Bathrooms?</label>
          <div className="counter-controls">
            <button type="button" onClick={() => updateCount('bathrooms', -1)} className="btn-counter">-</button>
            <span className="count-display">{data.bathrooms || 1}</span>
            <button type="button" onClick={() => updateCount('bathrooms', 1)} className="btn-counter">+</button>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '2rem' }}>
          <label style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-primary)' }}>Estimated Square Footage</label>
          <input 
            type="number" 
            required
            min="100"
            max="15000"
            placeholder="e.g. 1500"
            value={data.sqft || ''} 
            onChange={(e) => onChange({ sqft: parseInt(e.target.value) || '' })} 
            style={{
              padding: '0.875rem 1rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              marginTop: '0.5rem',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div className="step-actions">
          <button type="button" className="btn-outline" onClick={onPrev}>Back</button>
          <button type="submit" className="btn-primary">Continue</button>
        </div>
      </form>

      <style>{`
        .counter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) 0;
          border-bottom: 1px solid var(--color-border);
        }
        .counter-row label {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .counter-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        .btn-counter {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--color-primary);
          color: var(--color-primary);
          background: transparent;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-counter:hover {
          background: var(--color-primary);
          color: white;
        }
        .count-display {
          font-size: 1.5rem;
          font-weight: 700;
          min-width: 30px;
          text-align: center;
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
