import React from 'react';
import './Concierge.css';

export function ConciergeLayout({ children, progress, showEstimate = false, estimateData = null }) {
  return (
    <div className="concierge-wrapper">
      <div className="concierge-container">
        {/* Progress bar at the very top */}
        <div className="concierge-progress-track">
          <div 
            className="concierge-progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="concierge-content-grid">
          {/* Main Stage */}
          <main className="concierge-stage">
            {children}
          </main>

          {/* Floating Live Estimate (Sidebar on desktop, bottom on mobile) */}
          {showEstimate && (
            <aside className="concierge-estimate-sidebar animate-concierge-fade">
              <div className="estimate-card glass-card">
                <span className="estimate-label">Investment Range</span>
                <div className="estimate-value">
                  {estimateData ? (
                    <>
                      <span className="currency">$</span>
                      <span className="amount">{estimateData.min} - {estimateData.max}</span>
                    </>
                  ) : (
                    <span className="calculating">Analyzing details...</span>
                  )}
                </div>
                <div className="estimate-confidence">
                  <div className="confidence-track">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${(estimateData?.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="confidence-text">Accuracy Level</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
