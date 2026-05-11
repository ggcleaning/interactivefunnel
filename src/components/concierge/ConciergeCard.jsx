import React from 'react';

export function ConciergeCard({ title, subtitle, children, footer }) {
  return (
    <div className="concierge-card glass-card animate-concierge-slide">
      <header className="concierge-card-header">
        <h2 className="concierge-title">{title}</h2>
        {subtitle && <p className="concierge-subtitle">{subtitle}</p>}
      </header>

      <div className="concierge-card-body">
        {children}
      </div>

      {footer && (
        <footer className="concierge-card-footer">
          {footer}
        </footer>
      )}
    </div>
  );
}
