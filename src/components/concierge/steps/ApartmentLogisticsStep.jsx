import React from 'react';

export function ApartmentLogisticsStep({ data, onChange, onNext, onPrev }) {
  return (
    <div className="apartment-step animate-concierge-fade">
      <section className="intelligence-group">
        <h3>What floor is your apartment on?</h3>
        <div className="counter-controls" style={{ justifyContent: 'center', margin: '2rem 0' }}>
          <button onClick={() => onChange({ floorLevel: Math.max(1, (data.floorLevel || 1) - 1) })} className="btn-counter">-</button>
          <span className="count-display">{data.floorLevel || 1}</span>
          <button onClick={() => onChange({ floorLevel: (data.floorLevel || 1) + 1 })} className="btn-counter">+</button>
        </div>
      </section>

      <section className="intelligence-group" style={{ marginTop: '2rem' }}>
        <h3>Is there an elevator?</h3>
        <div className="toggle-group">
          <button 
            className={`toggle-btn ${data.hasElevator ? 'active' : ''}`}
            onClick={() => onChange({ hasElevator: true })}
          >
            🛗 Yes
          </button>
          <button 
            className={`toggle-btn ${!data.hasElevator ? 'active' : ''}`}
            onClick={() => onChange({ hasElevator: false })}
          >
            🧗 No
          </button>
        </div>
      </section>

      <div className="step-actions">
        <button className="btn-outline" onClick={onPrev}>Back</button>
        <button className="btn-primary" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}
