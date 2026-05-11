import React from 'react';
import { clarityEvent } from '../../../utils/analytics';

const CATEGORIES = [
  { id: 'house', label: 'House', icon: '🏡', subtitle: 'Single family home' },
  { id: 'apartment', label: 'Apartment', icon: '🏢', subtitle: 'Condo or Apartment' },
  { id: 'airbnb', label: 'Airbnb', icon: '✨', subtitle: 'Short-term rental' },
  { id: 'commercial', label: 'Office/Retail', icon: '🏬', subtitle: 'Commercial space' }
];

export function ServiceCategoryStep({ value, onChange, onNext }) {
  return (
    <div className="option-grid">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`option-button ${value === cat.id ? 'active' : ''}`}
          onClick={() => {
            clarityEvent('package_selected', { package: cat.label });
            onChange({ serviceCategory: cat.id });
            // Auto-advance for better UX
            setTimeout(() => onNext(), 300);
          }}
        >
          <span className="option-icon">{cat.icon}</span>
          <span className="option-label">{cat.label}</span>
          <span className="option-subtitle" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{cat.subtitle}</span>
        </button>
      ))}
    </div>
  );
}
