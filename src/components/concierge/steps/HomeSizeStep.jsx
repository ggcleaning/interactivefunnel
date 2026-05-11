import React from 'react';

export function HomeSizeStep({ data, onChange, onNext, onPrev }) {
  const updateCount = (field, delta) => {
    const newVal = Math.max(1, (data[field] || 1) + delta);
    onChange({ [field]: newVal });
  };

  return (
    <div className="home-size-step animate-concierge-fade">
      <div className="counter-row">
        <label>How many Bedrooms?</label>
        <div className="counter-controls">
          <button onClick={() => updateCount('bedrooms', -1)} className="btn-counter">-</button>
          <span className="count-display">{data.bedrooms || 1}</span>
          <button onClick={() => updateCount('bedrooms', 1)} className="btn-counter">+</button>
        </div>
      </div>

      <div className="counter-row">
        <label>How many Bathrooms?</label>
        <div className="counter-controls">
          <button onClick={() => updateCount('bathrooms', -1)} className="btn-counter">-</button>
          <span className="count-display">{data.bathrooms || 1}</span>
          <button onClick={() => updateCount('bathrooms', 1)} className="btn-counter">+</button>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-outline" onClick={onPrev}>Back</button>
        <button className="btn-primary" onClick={onNext}>Continue</button>
      </div>

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
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
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
