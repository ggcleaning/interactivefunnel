import React from 'react';

const FREQUENCIES = [
  { id: 'weekly', label: 'Weekly', icon: '🗓️', discount: '15% OFF' },
  { id: 'biweekly', label: 'Bi-Weekly', icon: '📅', discount: '10% OFF' },
  { id: 'monthly', label: 'Monthly', icon: '🌙', discount: '5% OFF' },
  { id: 'one-time', label: 'One-Time', icon: '⚡', discount: 'Standard' }
];

export function FrequencyStep({ value, onChange, onNext, onPrev }) {
  return (
    <div className="frequency-step animate-concierge-fade">
      <div className="option-grid">
        {FREQUENCIES.map((freq) => (
          <button
            key={freq.id}
            className={`option-button ${value === freq.id ? 'active' : ''}`}
            onClick={() => {
              onChange({ frequency: freq.id });
              setTimeout(() => onNext(), 300);
            }}
          >
            <span className="option-icon">{freq.icon}</span>
            <span className="option-label">{freq.label}</span>
            <span className="discount-tag" style={{ 
              fontSize: '0.75rem', 
              background: freq.id === 'one-time' ? 'transparent' : 'var(--color-primary)',
              color: freq.id === 'one-time' ? 'var(--color-text-light)' : 'white',
              padding: '2px 8px',
              borderRadius: '99px',
              marginTop: '4px'
            }}>
              {freq.discount}
            </span>
          </button>
        ))}
      </div>

      <div className="step-actions" style={{ marginTop: '3rem' }}>
        <button className="btn-outline" onClick={onPrev}>Back</button>
      </div>
    </div>
  );
}
