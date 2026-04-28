import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { X, Calendar, MapPin, Phone, Mail, User, Clock } from 'lucide-react';
import { sendToCRM } from '../utils/crm';
import emailjs from '@emailjs/browser';
import { BUSINESS } from '../data/config';
import './BookingInfoModal.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BookingInfoModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const [step, setStep] = useState('info'); // 'info' or 'pay'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferredTime: 'Morning',
    marketingOptIn: true, // Default to true
  });

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setStep('info');
      setError('');
      setClientSecret('');
    }
  }, [isOpen]);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Capture Lead Immediately (Abandoned Checkout Recovery)
      sendToCRM({
        ...form,
        plan_name: plan.name,
        status: 'Lead / Pending Payment',
        location_id: 'D5WYnc5CK01FskhJtW3W',
        checkout_stage: 'info_completed'
      }, 'lead_capture');

      const response = await fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          service: plan.name,
          amount: (plan.depositAmount || 50) * 100, // in cents
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      setStep('pay');
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Unable to reach payment server. Please check your internet or try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div 
        className="bm-container"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <button className="bm-close" onClick={onClose}><X size={20} /></button>
        
        <div className="bm-header">
          <h2 className="bm-title">{step === 'info' ? 'Complete Your Booking' : 'Secure Deposit'}</h2>
          <p className="bm-subtitle">
            {step === 'info' 
              ? `You've selected the ${plan.name} package.` 
              : 'Payments secured by Stripe.'}
          </p>
        </div>

        <div className="bm-content">
          <AnimatePresence mode="wait">
            {step === 'info' ? (
              <motion.form 
                key="info"
                onSubmit={handleInfoSubmit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {error && <div className="bm-error">⚠️ {error}</div>}
                
                <div className="bm-form-group">
                  <label className="bm-label">Full Name *</label>
                  <input 
                    className="bm-input" 
                    type="text" 
                    placeholder="Jane Smith"
                    required
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-label">Email Address *</label>
                  <input 
                    className="bm-input" 
                    type="email" 
                    placeholder="jane@example.com"
                    required
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-label">Phone Number *</label>
                  <input 
                    className="bm-input" 
                    type="tel" 
                    placeholder="(516) 123-4567"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-label">Service Address *</label>
                  <input 
                    className="bm-input" 
                    type="text" 
                    placeholder="123 Main St, Town, NY"
                    required
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                  />
                </div>

                <div className="bm-form-group">
                  <label className="bm-label">Best Time to Contact</label>
                  <div className="bm-time-grid">
                    <button 
                      type="button"
                      className={`bm-time-btn ${form.preferredTime === 'Morning' ? 'active' : ''}`}
                      onClick={() => setForm({...form, preferredTime: 'Morning'})}
                    >
                      <span className="bm-time-label">🌅 Morning</span>
                      <span className="bm-time-sub">9 AM – 12 PM</span>
                    </button>
                    <button 
                      type="button"
                      className={`bm-time-btn ${form.preferredTime === 'Afternoon' ? 'active' : ''}`}
                      onClick={() => setForm({...form, preferredTime: 'Afternoon'})}
                    >
                      <span className="bm-time-label">☀️ Afternoon</span>
                      <span className="bm-time-sub">1 PM – 5 PM</span>
                    </button>
                  </div>
                </div>

                <div className="bm-form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="bm-checkbox-container" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      style={{ marginTop: '4px' }}
                      checked={form.marketingOptIn}
                      onChange={(e) => setForm({...form, marketingOptIn: e.target.checked})}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                      I agree to receive recurring automated marketing text messages (e.g. cart reminders, special holiday discounts) at the phone number provided. Consent is not a condition to purchase.
                    </span>
                  </label>
                </div>

                <div className="bm-footer" style={{ padding: '10px 0 0' }}>
                  <button type="submit" className="bm-btn-primary" disabled={loading}>
                    {loading ? 'Please wait...' : 'Continue to Payment →'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="pay"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                    <CheckoutForm 
                      amount={plan.depositAmount || 50}
                      onSuccess={async (paymentIntent) => {
                        // 1. Notify Owner via EmailJS immediately
                        try {
                          const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
                          const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
                          const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

                          if (serviceId && templateId && publicKey) {
                            await emailjs.send(
                              serviceId,
                              templateId,
                              {
                                from_name: form.name,
                                from_email: form.email,
                                phone: form.phone,
                                service_type: plan.name + ' (Package Booking)',
                                zip_code: '', // Not in this form
                                notes: `[PAID BOOKING - $${plan.depositAmount || 50} DEPOSIT RECEIVED] 
                                        Package: ${plan.name}
                                        Preferred Time: ${form.preferredTime}
                                        Address: ${form.address}
                                        Stripe ID: ${paymentIntent.id}`,
                                to_name: BUSINESS.name
                              },
                              publicKey
                            );
                          }
                        } catch (err) {
                          console.error('Email notification failed:', err);
                        }

                        // 2. Sync to CRM
                        sendToCRM({
                          ...form,
                          service: plan.name,
                          deposit_amount: plan.depositAmount || 50,
                          status: 'Deposit Paid',
                          location_id: 'D5WYnc5CK01FskhJtW3W',
                          pipeline_id: 'IpQfoYb7UZNLlLC6gv4g',
                          stage: 'Booking Confirmed',
                          stripe_payment_id: paymentIntent.id,
                          tags: ['residentialclient', 'Paid Booking']
                        }, 'booking_confirmed');

                        // 3. Trigger parent success
                        onSuccess(paymentIntent);
                      }}
                      onBack={() => setStep('info')}
                    />
                  </Elements>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingInfoModal;
