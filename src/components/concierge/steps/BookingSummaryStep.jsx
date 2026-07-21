import React, { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { clarityEvent } from '../../../utils/analytics';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ amount, onNext, onPrev, data, estimate }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/quote?booking=confirmed',
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      clarityEvent('deposit_completed', { amount });
      onNext({ stripePaymentId: paymentIntent.id });
    } else {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="concierge-checkout-form">
      <div className="payment-wrap glass-card">
        <PaymentElement 
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {errorMessage && <div className="payment-error">⚠️ {errorMessage}</div>}

      <div className="step-actions">
        <button type="button" className="btn-outline" onClick={onPrev} disabled={processing}>
          Back
        </button>
        <button type="submit" className="btn-primary" disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Confirm & Pay $${amount} Deposit`}
        </button>
      </div>

      <style>{`
        .payment-wrap {
          padding: 1.5rem;
          margin: 1.5rem 0;
          background: rgba(255, 255, 255, 0.5);
        }
        .payment-error {
          color: #d63031;
          background: #fff5f5;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
      `}</style>
    </form>
  );
}

export function BookingSummaryStep({ data, estimate, onNext, onPrev }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const depositAmount = 50; // $50 deposit

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        const hasTrackedCompleted = sessionStorage.getItem('gg_quote_completed_tracked') === 'true';
        if (!hasTrackedCompleted) {
          window.fbq("trackCustom", "QuoteCompleted");
          sessionStorage.setItem('gg_quote_completed_tracked', 'true');
          console.log('[Meta Pixel] Fired QuoteCompleted event');
        }
      } catch (fbError) {
        console.error('[Meta Pixel] QuoteCompleted failed:', fbError);
      }
    }
  }, []);

  useEffect(() => {
    if (!showCheckout) return;

    setLoading(true);
    setError('');
    
    async function initPayment() {
      try {
        const response = await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount * 100, // cents
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            serviceType: data.serviceCategory,
            estimateRange: `$${estimate.min}-$${estimate.max}`,
            
            // Session and tracking contract
            request_id: data.request_id,
            lead_id: data.lead_id,
            funnel_session_id: data.funnel_session_id,
            quote_session_id: data.quote_session_id,
            internal_quote_id: data.internal_quote_id,
            meta_event_id: data.meta_event_id || data.eventId || ''
          }),
        });

        const result = await response.json();
        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
        } else {
          setError('Failed to initialize payment. Please try again.');
        }
      } catch (err) {
        console.error('Payment Error:', err);
        setError('Connection error. Please check your internet.');
      } finally {
        setLoading(false);
      }
    }

    initPayment();
  }, [showCheckout, data, estimate]);

  const summaryItems = useMemo(() => [
    { label: 'Service', value: data.serviceCategory },
    { label: 'Home Size', value: `${data.bedrooms} BR / ${data.bathrooms} BA (${data.sqft || 0} sqft)` },
    { label: 'Frequency', value: data.frequency },
    { label: 'Client', value: `${data.firstName} ${data.lastName}` }
  ], [data]);

  const handleReserveClick = () => {
    setShowCheckout(true);
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq("track", "InitiateCheckout");
        console.log('[Meta Pixel] Fired InitiateCheckout event');
      } catch (fbError) {
        console.error('[Meta Pixel] InitiateCheckout failed:', fbError);
      }
    }
  };

  return (
    <div className="booking-summary-step animate-concierge-fade">
      {!showCheckout ? (
        <>
          <div className="summary-grid">
            {summaryItems.map((item, i) => (
              <div key={i} className="summary-item">
                <span className="label">{item.label}</span>
                <span className="value" style={{ textTransform: item.label === 'Service' ? 'capitalize' : 'none' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="total-estimate-box glass-card">
            <span className="estimate-label">Total Estimated Investment</span>
            <h3 className="estimate-range">${estimate.min} — ${estimate.max}</h3>
            <p className="deposit-note">A ${depositAmount} deposit secures your preferred window.</p>
          </div>

          <div className="what-next-box glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem', fontWeight: 600 }}>What happens next:</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem' }}><span>📅</span> <strong>Select Your Window:</strong> Secure your booking by paying a refundable $50 deposit.</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><span>📞</span> <strong>Custom Matching:</strong> We will call or text you within 24 hours to confirm your exact cleaning time.</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><span>🔒</span> <strong>Peace of Mind:</strong> If we can't find a time that fits your schedule, your deposit is 100% refunded instantly.</li>
            </ul>
          </div>

          <div className="step-actions">
            <button type="button" className="btn-outline" onClick={onPrev}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={handleReserveClick} style={{ minWidth: '220px' }}>
              Reserve My Spot & Pay $50 Deposit
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="total-estimate-box glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <span className="estimate-label">Securing Booking for:</span>
            <h4 style={{ margin: '0.25rem 0', color: 'var(--color-primary)' }}>{data.firstName}'s Custom Cleaning</h4>
            <span className="estimate-label">Estimate: ${estimate.min} — ${estimate.max}</span>
          </div>

          {loading ? (
            <div className="payment-loading">
              <div className="spinner"></div>
              <p>Preparing secure checkout...</p>
            </div>
          ) : error ? (
            <div className="payment-error-state">
              <p>{error}</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn-outline" onClick={() => setShowCheckout(false)}>Go Back</button>
                <button className="btn-primary" onClick={() => setShowCheckout(true)}>Retry</button>
                {window.location.hostname === 'localhost' && (
                  <button className="btn-primary" onClick={() => onNext({ stripePaymentId: 'mock_dev_id' })}>
                    Skip to Confirmation (Dev)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm 
                amount={depositAmount} 
                onNext={onNext} 
                onPrev={() => setShowCheckout(false)}
                data={data}
                estimate={estimate}
              />
            </Elements>
          )}
        </>
      )}

      <style>{`
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .summary-item .label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-light);
        }
        .summary-item .value {
          font-weight: 600;
          color: var(--color-primary);
        }
        .total-estimate-box {
          text-align: center;
          padding: 1.5rem;
          background: var(--color-bg-alt);
          margin-bottom: 2rem;
          border-radius: var(--radius-md);
        }
        .estimate-label {
          font-size: 0.9rem;
          color: var(--color-text-light);
        }
        .estimate-range {
          font-size: 2rem;
          margin: 0.5rem 0;
          color: var(--color-primary);
          font-weight: 700;
        }
        .deposit-note {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }
        .payment-loading {
          text-align: center;
          padding: 3rem 0;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 500px) {
          .summary-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
