import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import PlanCompareModal from './PlanCompareModal';
import { BUSINESS, PACKAGES, ADDONS, RECURRING_PLANS, SAVINGS_PERKS, COMMERCIAL_SERVICES, PLAN_NOTES } from '../data/config';
import { generateInternalQuoteId, generateRequestId, generateFunnelSessionId } from '../utils/idGenerator';
import './Pricing.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const packages = PACKAGES;
const addons = ADDONS;
const commercialCards = COMMERCIAL_SERVICES;
const trustItems = BUSINESS.trustBadges.map(b => ({ icon: b.icon, title: b.header, sub: b.text }));
const recurringPlans = RECURRING_PLANS;
const savingsPerks = SAVINGS_PERKS;


const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.55 } };

const Pricing = () => {
    const [showCompare, setShowCompare] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [checkoutStep, setCheckoutStep] = useState('idle'); // idle | loading | pay | success

    const handleSelectPlan = async (plan) => {
        setSelectedPlan(plan);
        setCheckoutStep('loading');
        const sessionId = generateInternalQuoteId();
        try {
            const res = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: (plan.depositAmount || 50) * 100,
                    name: plan.name,
                    email: '',
                    service: plan.name,
                    
                    quote_session_id: sessionId,
                    internal_quote_id: sessionId,
                    request_id: generateRequestId(),
                    funnel_session_id: generateFunnelSessionId()
                }),
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setCheckoutStep('pay');
            } else {
                setCheckoutStep('idle');
                alert('Could not start checkout. Please try again.');
            }
        } catch {
            setCheckoutStep('idle');
            alert('Network error. Please try again.');
        }
    };

    const resetCheckout = () => { setSelectedPlan(null); setClientSecret(''); setCheckoutStep('idle'); };
    return (
        <div className="pricing-page">
            {/* HERO */}
            <section className="pricing-hero">
                <div className="pricing-hero-inner">
                    <motion.div {...fadeUp}>
                        <div className="pricing-badge">✦ Transparent Pricing</div>
                        <h1>Simple, Honest<br /><em>Pricing You Can Trust</em></h1>
                        <p className="pricing-hero-sub">No hidden fees. No surprises. Exceptional cleaning at fair, market-based prices for Nassau & Suffolk County homes and businesses.</p>
                        <div className="pricing-trust-pills">
                            {['Family-Owned & Operated', 'Satisfaction Guaranteed', 'Nassau & Suffolk County', 'Fully Insured'].map(t => (
                                <div key={t} className="trust-pill"><span className="pill-dot" />{t}</div>
                            ))}
                        </div>
                        <div className="pricing-hero-ctas">
                            <a href="#contact" className="btn-primary">Book Your Cleaning →</a>
                            <a href="#contact" className="btn-outline-pricing">Get a Free Quote</a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* HOW PRICING WORKS */}
            <div className="how-strip">
                <div className="how-inner">
                    <div className="how-title">How Pricing Works<small>WHAT AFFECTS YOUR QUOTE</small></div>
                    <div className="how-facts">
                        {[
                            { title: 'Home Size', desc: 'Based on bedrooms, bathrooms & square footage' },
                            { title: 'Service Type', desc: 'Standard, Deep, or Move-In/Out — each has a different scope' },
                            { title: 'Frequency', desc: 'Recurring clients receive better rates than one-time bookings' },
                            { title: 'Condition', desc: 'Homes needing extra attention may require additional time' },
                        ].map(f => (
                            <div key={f.title} className="how-fact"><strong>{f.title}</strong><span>{f.desc}</span></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PACKAGES */}
            <section className="pricing-section">
                <div className="pricing-container">
                    <motion.div className="pricing-section-header" {...fadeUp}>
                        <div className="pricing-label">Our Packages</div>
                        <h2 className="pricing-section-title">Choose the Right Clean for You</h2>
                        <p className="pricing-section-sub">Every home is different. Pick the package that fits your needs — or customize with add-ons below.</p>
                    </motion.div>
                    <div className="packages-grid">
                        {packages.map((pkg, i) => (
                            <motion.div key={pkg.name} className={`pkg-card${pkg.featured ? ' featured' : ''}`} {...fadeUp} transition={{ duration: 0.55, delay: i * 0.1 }}>
                                <div className="pkg-header">
                                    {pkg.tag && <div className="featured-tag">{pkg.tag}</div>}
                                    <div className="pkg-icon">{pkg.icon}</div>
                                    <div className="pkg-name">{pkg.name}</div>
                                    <div className="pkg-desc">{pkg.desc}</div>
                                </div>
                                <div className="pkg-body">
                                    <div className="pkg-price-row">
                                        <span className="pkg-from">Starting at</span>
                                        <span className="pkg-price" style={pkg.featured ? { color: '#C9A84C' } : {}}>{pkg.price}</span>
                                        <span className="pkg-price-note" style={pkg.featured ? { color: 'rgba(255,255,255,0.6)' } : {}}>{pkg.priceNote}</span>
                                    </div>
                                    <div className="pkg-includes-label">What's Included</div>
                                    <ul className="pkg-list">
                                        {pkg.includes.map(item => <li key={item}>{item}</li>)}
                                    </ul>
                                    <div className="pkg-ideal" style={pkg.featured ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.82)' } : {}}>
                                        <strong style={pkg.featured ? { color: '#C9A84C' } : {}}>Ideal for:</strong> {pkg.ideal}
                                    </div>
                                    <a href="#contact" className="pkg-cta">Book {pkg.name} →</a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ADD-ONS */}
            <section className="addons-section">
                <div className="pricing-container">
                    <motion.div className="pricing-section-header" {...fadeUp}>
                        <div className="pricing-label">Customize Your Clean</div>
                        <h2 className="pricing-section-title">Add-On Services</h2>
                        <p className="pricing-section-sub">Enhance any package with targeted extras. Add only what you need — priced clearly upfront.</p>
                    </motion.div>
                    <div className="addons-grid">
                        {addons.map((a, i) => (
                            <motion.div key={a.name} className="addon-card" {...fadeUp} transition={{ duration: 0.45, delay: i * 0.07 }}>
                                <div className="addon-left">
                                    <div className="addon-icon">{a.icon}</div>
                                    <div>
                                        <div className="addon-name">{a.name}</div>
                                        <div className="addon-note">{a.note}</div>
                                    </div>
                                </div>
                                <div className="addon-price">{a.price}</div>
                            </motion.div>
                        ))}
                    </div>
                    <p className="addons-note">✦ Add-on pricing varies by home size and condition. Final price confirmed at booking.</p>
                </div>
            </section>

            {/* RECURRING PLANS */}
            <section className="pricing-section recurring-section">
                <div className="pricing-container">
                    <motion.div className="pricing-section-header" {...fadeUp}>
                        <div className="pricing-label">Maintain the Clean</div>
                        <h2 className="pricing-section-title">Save More with Recurring Cleaning Plans</h2>
                        <p className="pricing-section-sub">
                            {PLAN_NOTES.pricing} <br />
                            <strong>Note:</strong> {PLAN_NOTES.operational}
                        </p>
                    </motion.div>
                    <div className="packages-grid">
                        {recurringPlans.map((plan, i) => (
                            <motion.div key={plan.name} className={`pkg-card recurring-card${plan.featured ? ' featured' : ''}`} {...fadeUp} transition={{ duration: 0.55, delay: i * 0.1 }}>
                                <div className="pkg-header">
                                    {plan.tag && <div className="featured-tag">{plan.tag}</div>}
                                    <div className="pkg-name">{plan.name}</div>
                                    <div className="pkg-desc" style={{ fontWeight: 600, color: plan.featured ? 'rgba(255,255,255,0.85)' : 'var(--color-secondary)', marginBottom: 4 }}>{plan.frequency}</div>
                                    <div className="pkg-price-row" style={{ marginBottom: 0 }}>
                                        <span className="pkg-price" style={plan.featured ? { color: '#d4af37' } : {}}>{plan.price}</span>
                                        <span className="pkg-price-note" style={plan.featured ? { color: 'rgba(255,255,255,0.55)' } : {}}>{plan.priceLabel}</span>
                                    </div>
                                </div>
                                <div className="pkg-body">
                                    <ul className="pkg-list">
                                        {plan.features.map(item => <li key={item}>{item}</li>)}
                                    </ul>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <button
                                            className="pkg-cta"
                                            onClick={() => handleSelectPlan(plan)}
                                            disabled={checkoutStep === 'loading'}
                                        >
                                            {checkoutStep === 'loading' && selectedPlan?.id === plan.id ? 'Loading…' : 'Start This Plan →'}
                                        </button>
                                        <button className={`pkg-cta-outline${plan.featured ? ' featured' : ''}`} onClick={() => setShowCompare(true)}>Compare All Plans</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Plan Compare Modal ── */}
            <PlanCompareModal
                isOpen={showCompare}
                onClose={() => setShowCompare(false)}
                onSelectPlan={handleSelectPlan}
            />

            {/* ── Stripe Checkout Overlay ── */}
            <AnimatePresence>
                {(checkoutStep === 'pay' || checkoutStep === 'success') && (
                    <motion.div className="plan-checkout-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) resetCheckout(); }}>
                        <motion.div className="plan-checkout-modal" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.3 }}>
                            {checkoutStep === 'success' ? (
                                <div className="plan-checkout-success">
                                    <div className="pcs-icon">✅</div>
                                    <h3>Booking Requested!</h3>
                                    <p>Your <strong>{selectedPlan?.name}</strong> deposit has been received. We'll call you within 1 business hour to confirm your schedule.</p>
                                    <button className="pkg-cta" onClick={resetCheckout}>Done</button>
                                </div>
                            ) : (
                                <>
                                    <div className="plan-checkout-header">
                                        <div>
                                            <div className="pcm-eyebrow" style={{ color: '#9333ea', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>Securing Your Spot</div>
                                            <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#581c87' }}>{selectedPlan?.name}</h3>
                                            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.88rem' }}>Pay a 25% down payment based on your quote to reserve your first cleaning. Balance due after service.</p>
                                        </div>
                                        <button className="pcm-close" onClick={resetCheckout} style={{ background: '#f5f3ff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                                    </div>
                                    {clientSecret && (
                                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#7c3aed' } } }}>
                                            <CheckoutForm
                                                amount={selectedPlan?.depositAmount || 50}
                                                onSuccess={() => setCheckoutStep('success')}
                                                onBack={resetCheckout}
                                            />
                                        </Elements>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SAVINGS & MEMBER PERKS */}
            <section className="discounts-section">
                <div className="pricing-container">
                    <motion.div className="pricing-section-header" {...fadeUp}>
                        <div className="pricing-label">Current Savings</div>
                        <h2 className="pricing-section-title">Current Savings & Member Perks</h2>
                        <p className="pricing-section-sub">We love rewarding our clients. Enjoy exclusive perks when you book or subscribe with G&G.</p>
                    </motion.div>
                    <div className="discounts-grid">
                        {savingsPerks.map((perk, i) => (
                            <motion.div key={perk.title} className="discount-card" {...fadeUp} transition={{ duration: 0.45, delay: i * 0.08 }}>
                                <div className="discount-icon">{perk.icon}</div>
                                <div>
                                    <div className="discount-title">{perk.title}</div>
                                    <div className="discount-desc">{perk.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <p className="addons-note">✦ Annual plans available for best value · Final pricing confirmed based on home size and condition</p>
                </div>
            </section>

            {/* COMMERCIAL */}

            <section className="commercial-section">
                <div className="pricing-container">
                    <motion.div className="pricing-section-header" {...fadeUp}>
                        <div className="pricing-label">Business Cleaning</div>
                        <h2 className="pricing-section-title">Commercial Cleaning Services</h2>
                        <p className="pricing-section-sub">Consistent, professional cleaning for offices and businesses across Nassau & Suffolk County.</p>
                    </motion.div>
                    <div className="commercial-grid">
                        {commercialCards.map((c, i) => (
                            <motion.div key={c.name} className={`comm-card${c.full ? ' full' : ''}`} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                                <div className="comm-icon">{c.icon}</div>
                                <div className="comm-name">{c.name}</div>
                                <div className="comm-desc">{c.desc}</div>
                                {c.priceNote && <div className="comm-price-note">{c.priceNote}</div>}
                                <ul className="comm-list">
                                    {c.items.map(item => <li key={item}>{item}</li>)}
                                </ul>
                                <a href="#contact" className="comm-cta">
                                    {c.full ? 'Request a Custom Quote →' : `Get ${c.name.split(' ')[0]} Quote →`}
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TRUST BAR */}
            <div className="pricing-trust-bar">
                <div className="pricing-trust-inner">
                    {trustItems.map(t => (
                        <div key={t.title} className="pricing-trust-item">
                            <div className="ticon">{t.icon}</div>
                            <div><strong>{t.title}</strong><span>{t.sub}</span></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FINAL CTA */}
            <section className="pricing-final-cta">
                <motion.div {...fadeUp}>
                    <h2>Ready for a Cleaner Home<br />or Business?</h2>
                    <p>Get your free, no-obligation quote today. We'll match the right service to your needs and budget.</p>
                    <div className="final-cta-btns">
                        <a href="#contact" className="btn-primary">Book Your Cleaning Today →</a>
                        <a href="#contact" className="btn-outline-pricing">Get a Free Quote</a>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default Pricing;
