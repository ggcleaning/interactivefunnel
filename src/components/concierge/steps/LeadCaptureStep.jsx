import React, { useState } from 'react';
import { generateInternalQuoteId } from '../../../utils/idGenerator';
import { sendToCRM } from '../../../utils/crm';

function getUtmParams() {
  if (typeof window === 'undefined') {
    return { utm_source: '', utm_medium: '', utm_campaign: '' };
  }
  const params = new URLSearchParams(window.location.search);
  
  let utm_source = params.get('utm_source') || '';
  let utm_medium = params.get('utm_medium') || '';
  let utm_campaign = params.get('utm_campaign') || '';
  
  try {
    if (!utm_source) utm_source = sessionStorage.getItem('utm_source') || '';
    if (!utm_medium) utm_medium = sessionStorage.getItem('utm_medium') || '';
    if (!utm_campaign) utm_campaign = sessionStorage.getItem('utm_campaign') || '';
    
    if (params.get('utm_source')) sessionStorage.setItem('utm_source', params.get('utm_source'));
    if (params.get('utm_medium')) sessionStorage.setItem('utm_medium', params.get('utm_medium'));
    if (params.get('utm_campaign')) sessionStorage.setItem('utm_campaign', params.get('utm_campaign'));
  } catch (e) {
    console.warn('sessionStorage not available:', e);
  }
  
  return { utm_source, utm_medium, utm_campaign };
}

export function LeadCaptureStep({ data, onChange, onNext }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Generate or retrieve unique quote_session_id
      const sessionId = data.quote_session_id || data.internal_quote_id || generateInternalQuoteId();
      
      // 2. Parse UTMs and Page URL
      const utms = getUtmParams();
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      
      // 3. Save contact info and IDs in state immediately
      const updatedData = {
        quote_session_id: sessionId,
        internal_quote_id: sessionId,
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
        page_url: currentUrl,
      };
      
      onChange(updatedData);

      // 4. Fire Meta Pixel Lead & Custom QuoteStarted event immediately after validation
      // Ensure this is not blocked by GHL API success/failure
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          const hasTrackedLead = sessionStorage.getItem('gg_lead_tracked') === 'true';
          if (!hasTrackedLead) {
            window.fbq("track", "Lead");
            window.fbq("trackCustom", "QuoteStarted");
            sessionStorage.setItem('gg_lead_tracked', 'true');
            console.log('[Meta Pixel] Fired Lead & QuoteStarted events');
          }
        } catch (fbError) {
          console.error('[Meta Pixel] Tracking failed:', fbError);
        }
      }

      // 5. Send partial lead to GHL secure proxy
      const payload = {
        event_type: "quote_started",
        lead_stage: "Quote Started - Contact Captured",
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        zip_code: data.zipCode,
        quote_session_id: sessionId,
        internal_quote_id: sessionId,
        source: "Website Quote Funnel",
        page_url: currentUrl,
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
        created_at: new Date().toISOString(),
        tags: [
          "quote_started",
          "website_quote_funnel",
          "contact_captured",
          "needs_follow_up_if_abandoned"
        ],
        skipMetaLead: true, // We already fired the pixel event above
      };

      console.log('[CRM] Submitting Step 1 lead...', payload);
      const res = await sendToCRM(payload, 'quote_started');
      
      if (!res.success) {
        console.warn('[CRM Proxy Warning] Primary lead capture forwarding failed, fallback triggered', res.error);
      }

      // 6. Transition to Step 2 regardless of GHL response success
      onNext();
    } catch (err) {
      console.error('[LeadCaptureStep] Submit error:', err);
      // Move to step 2 anyway to prevent breaking user flow
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lead-capture-step animate-concierge-fade">
      <p className="step-intro">Get your personalized cleaning quote in less than 60 seconds.</p>
      
      <form onSubmit={handleSubmit} className="premium-form">
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input 
              id="firstName"
              name="firstName"
              type="text" 
              required
              autocomplete="given-name"
              placeholder="e.g. Jane"
              value={data.firstName || ''} 
              onChange={(e) => onChange({ firstName: e.target.value })} 
            />
          </div>
          <div className="input-group">
            <label htmlFor="lastName">Last Name</label>
            <input 
              id="lastName"
              name="lastName"
              type="text" 
              required
              autocomplete="family-name"
              placeholder="e.g. Smith"
              value={data.lastName || ''} 
              onChange={(e) => onChange({ lastName: e.target.value })} 
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input 
            id="email"
            name="email"
            type="email" 
            required
            autocomplete="email"
            placeholder="jane@example.com"
            value={data.email || ''} 
            onChange={(e) => onChange({ email: e.target.value })} 
          />
        </div>

        <div className="form-row">
          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input 
              id="phone"
              name="phone"
              type="tel" 
              required
              autocomplete="tel"
              placeholder="(555) 000-0000"
              value={data.phone || ''} 
              onChange={(e) => onChange({ phone: e.target.value })} 
            />
          </div>
          <div className="input-group">
            <label htmlFor="zipCode">ZIP Code</label>
            <input 
              id="zipCode"
              name="zipCode"
              type="text" 
              required
              autocomplete="postal-code"
              placeholder="e.g. 11701"
              value={data.zipCode || ''} 
              onChange={(e) => onChange({ zipCode: e.target.value })} 
            />
          </div>
        </div>

        <div className="trust-badge">
          <span className="icon">🔒</span>
          <span className="text">No obligation. We’ll only use this to send your estimate and follow up about your cleaning request.</span>
        </div>

        <div className="step-actions">
          <div /> {/* Spacer since there is no Back button on Step 1 */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
            style={{ minWidth: '200px' }}
          >
            {isSubmitting ? 'Saving...' : 'Continue to My Estimate'}
          </button>
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
