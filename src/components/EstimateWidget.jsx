import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import emailjs from '@emailjs/browser';
import { calculateRecurringQuote, ADDON_META, getDistancePricing, formatCurrency } from '../utils/pricingEngine.js';
import { getZipDistance } from '../config/serviceZones';
import CheckoutForm from './CheckoutForm';
import PhotoQuoteFlow from './PhotoQuoteFlow';
import { sendToCRM } from '../utils/crm';
import { trackConversion } from '../utils/metaTracking';
import { BUSINESS } from '../data/config';
import { generateInternalQuoteId, generateRequestId, generateFunnelSessionId } from '../utils/idGenerator';
import TrustBar from './modular/TrustBar';
import { 
    Wand2, 
    Sparkles, 
    Home, 
    Bed, 
    Bath, 
    Zap, 
    CheckCircle2, 
    MapPin, 
    Calendar, 
    ShieldCheck,
    Clock,
    User,
    Phone,
    Mail,
    CreditCard,
    ArrowRight
} from 'lucide-react';
import './EstimateWidget.css';

// ─── Deferred Stripe Setup ────────────────────────────────────────────────────
let stripePromise;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
    }
    return stripePromise;
};

// ─── Step config ─────────────────────────────────────────────────────────────
const TOTAL_STEPS = 4; // 0-3

const STEP_META = [
    { eyebrow: 'Step 1 of 3', title: 'Your Home Info' },
    { eyebrow: 'Step 2 of 3', title: 'Select Date & Time' },
    { eyebrow: 'Step 3 of 3', title: 'Contact Details' },
    { eyebrow: 'Secure Checkout', title: 'Reserve Your Spot' },
];

const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Scheduling Rules ─────────────────────────────────────────────────────────
// Premium tiers for last-minute bookings. Positioned as a convenience premium,
// NOT a penalty. The label copy reinforces that we're making it happen fast.
const PRIORITY_TIERS = [
    { maxDays: 0, label: '⚡ Same-Day Rush',      sub: '+$75 priority fee', fee: 75 },
    { maxDays: 1, label: '🔥 Next-Day Priority',   sub: '+$50 priority fee', fee: 50 },
    { maxDays: 2, label: '📌 2-Day Express',        sub: '+$25 express fee',  fee: 25 },
];
const STANDARD_TIER = { label: 'Standard Booking', sub: 'No extra charge', fee: 0 };

const getUrgencyTier = (daysAhead) => {
    for (const tier of PRIORITY_TIERS) {
        if (daysAhead <= tier.maxDays) return tier;
    }
    return STANDARD_TIER;
};

const generateDates = () => {
    const dates = [];
    const now = new Date();
    // Determine start: if it's past 2 PM, same-day is no longer bookable
    const cutoffHour = 14; // 2:00 PM local
    const startOffset = now.getHours() >= cutoffHour ? 1 : 0;

    for (let i = startOffset; i < 21; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        if (d.getDay() === 0) continue; // Skip Sundays — closed

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        dates.push({
            value: dateStr,
            label: dayStr,
            urgency: getUrgencyTier(i),
        });
    }
    return dates;
};

const generateTimeSlots = () => {
    return [
        { value: 'Morning', label: '🌅 Morning', sub: '8 AM – 12 PM' },
        { value: 'Afternoon', label: '☀️ Afternoon', sub: '12 PM – 4 PM' },
        { value: 'Evening', label: '🌙 Evening', sub: '4 PM – 7 PM' }
    ];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
// trackConversion is imported from metaTracking.js — it fires the pixel
// AND returns { event_id, fbp, fbc } to sync with GHL (CAPI deduplication).

const PropertySelector = ({ label, icon: Icon, options, value, onChange }) => (
    <div className="ew-form-group">
        <label className="ew-label">{label}</label>
        <div className="ew-prop-grid">
            {options.map((opt) => (
                <div 
                    key={opt.value}
                    className={`ew-prop-card ${value === opt.value ? 'selected' : ''}`}
                    onClick={() => onChange(opt.value)}
                >
                    <div className="ew-prop-icon">
                        <Icon size={20} />
                    </div>
                    <div className="ew-prop-label">{opt.label}</div>
                    <div className="ew-prop-val">{opt.value}</div>
                </div>
            ))}
        </div>
    </div>
);

const ReceiptSidebar = ({ form, estimate, distancePricing, step, serviceLabels }) => {
    if (step === 3 && !estimate) return null;

    const urgencyFee = form.urgencyFee || 0;
    const baseTotal = estimate?.distMonth1?.finalTotal || 0;
    const total = baseTotal + urgencyFee;
    const deposit = Math.round(total * 0.25);

    return (
        <div className="ew-sidebar">
            <div className="ew-sidebar-title">
                <Sparkles size={16} /> Your Living Quote
            </div>
            
            <div className="ew-sidebar-content">
                {form.bedrooms && (
                    <div className="ew-sidebar-item">
                        <span>🏠 {form.bedrooms} Bed, {form.bathrooms} Bath</span>
                        <span>{form.zipCode}</span>
                    </div>
                )}
                {form.frequency && (
                    <div className="ew-sidebar-item">
                        <span>✨ {form.frequency === 'oneTime' ? (serviceLabels[form.serviceType] || 'Standard') : `${form.frequency} Plan`}</span>
                    </div>
                )}
                {estimate && (
                    <>
                        <div className="ew-sidebar-item">
                            <span>Base Rate</span>
                            <span>{formatCurrency(estimate.distMonth1.baseSubtotal)}</span>
                        </div>
                        {distancePricing?.travelFee > 0 && (
                            <div className="ew-sidebar-item">
                                <span>Route Premium</span>
                                <span>+{formatCurrency(distancePricing.travelFee)}</span>
                            </div>
                        )}
                        {urgencyFee > 0 && (
                            <div className="ew-sidebar-item">
                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>⚡ Priority Fee</span>
                                <span style={{ fontWeight: 600 }}>+{formatCurrency(urgencyFee)}</span>
                            </div>
                        )}
                        <div className="ew-sidebar-item total">
                            <span>Final Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </>
                )}
            </div>

            {estimate && (
                <div className="ew-sidebar-deposit">
                    <div className="ew-sidebar-deposit-label">Secure Today For Only</div>
                    <div className="ew-sidebar-deposit-value">{formatCurrency(deposit)}</div>
                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.9 }}>
                        Remaining balance due after cleaning
                    </div>
                </div>
            )}

            <div className="ew-trust-mini" style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                    <ShieldCheck size={14} color="#10b981" /> 100% Satisfaction Guarantee
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-light)' }}>
                    <CreditCard size={14} /> Secure SSL Checkout
                </div>
            </div>
        </div>
    );
};

const OptionBtn = ({ value, selected, onClick, icon, label, sublabel, layout = 'column' }) => (
    <button
        type="button"
        className={`ew-option-btn layout-${layout}${selected ? ' selected' : ''}`}
        onClick={() => onClick(value)}
    >
        {icon && <span className="ew-option-icon">{icon}</span>}
        <div className="ew-option-content">
            <span className="ew-option-label">{label}</span>
            {sublabel && <span className="ew-option-sublabel">{sublabel}</span>}
        </div>
    </button>
);

const INITIAL_FORM_STATE = {
    homeType: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    frequency: '',
    serviceType: '',
    condition: '', 
    addons: [],
    name: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    notes: '',
    date: '',
    time: '',
    urgencyFee: 0,
    marketingOptIn: true,
    smsOptIn: false,
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EstimateWidget = ({ onClose, inline = false }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    
    // Parse URL params for prefilling
    const searchParams = new URLSearchParams(window.location.search);
    const prefName = searchParams.get('fname') || '';
    const prefPhone = searchParams.get('phone') || '';

    const sessionId = generateInternalQuoteId();
    const initialForm = {
        ...INITIAL_FORM_STATE,
        name: prefName,
        phone: prefPhone,
        quote_session_id: sessionId,
        internal_quote_id: sessionId,
        funnel_session_id: generateFunnelSessionId(),
        request_id: generateRequestId()
    };

    const [form, setForm] = useState(initialForm);
    const availableDates = generateDates();
    const availableTimes = form.date ? generateTimeSlots(form.serviceType) : [];

    const serviceLabels = {
        standard: 'Standard Cleaning',
        deep: 'Deep Cleaning',
        moveOut: 'Move-In / Move-Out',
        turnover: 'Turnover (Airbnb)',
    };
    
    const [estimate, setEstimate] = useState(null);
    const [distancePricing, setDistancePricing] = useState(null);
    const [depositAmount, setDepositAmount] = useState(0);
    const [clientSecret, setClientSecret] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [showPhotoFlow, setShowPhotoFlow] = useState(false);

    // Track Lead on mount if inline (Page load)
    useEffect(() => {
        if (inline) {
            trackConversion('Lead', { 
                content_category: 'Widget Load',
                value: 10 // Soft lead value for page load
            });
        }
    }, [inline]);

    // Dispatch event whenever step changes
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('ew_step_change', { 
            detail: { 
                step, 
                depositAmount,
                estimate 
            } 
        }));
    }, [step, depositAmount, estimate]);

    const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

    const toggleAddon = (key) => {
        setForm((f) => ({
            ...f,
            addons: f.addons.includes(key)
                ? f.addons.filter((k) => k !== key)
                : [...f.addons, key],
        }));
    };

    const canProceed = () => {
        if (step === 0) {
            const isZipValid = form.zipCode && form.zipCode.length === 5;
            const hasHomeDetails = form.bedrooms !== '' && form.bathrooms !== '' && isZipValid;
            const hasFreq = form.frequency !== '';
            const hasService = form.frequency === 'oneTime' ? form.serviceType !== '' : true;
            const hasCondition = form.condition !== '';
            return hasHomeDetails && hasFreq && hasService && hasCondition;
        }
        if (step === 1) return form.date && form.time;
        if (step === 2) return form.name && form.phone && form.email && form.address && form.zipCode && form.smsOptIn;
        return true;
    };

    const goNext = async () => {
        if (step < 3) {
            trackConversion('ViewContent', { content_name: 'Estimate Widget Step' });
        }
        
        const source = sessionStorage.getItem('lead_source') || 'organic';
        const audience = sessionStorage.getItem('lead_audience');
        const campaign = sessionStorage.getItem('lead_campaign');
        const adSet = sessionStorage.getItem('lead_ad_set');
        const content = sessionStorage.getItem('lead_content');

        const tags = ['Residential', 'Calculator', (form.homeType === 'Commercial' || form.serviceType === 'commercial') ? 'commercialclient' : 'residentialclient'];
        if (source === 'facebook') tags.push('fb-ad-funnel');
        if (audience === 'airbnb') tags.push('airbnb-ads-funnel');
        else if (audience === 'investor' || audience === 'property-manager') tags.push('property-manager-funnel');

        if (step === 0) {
            setIsCalculating(true);
            try {
                const zipData = await getZipDistance(form.zipCode);
                const result = calculateRecurringQuote({
                    bedrooms: form.bedrooms,
                    bathrooms: form.bathrooms,
                    serviceType: form.frequency === 'oneTime' ? form.serviceType : 'standard',
                    condition: form.condition,
                    addons: form.addons,
                    frequency: form.frequency
                });

                const distPricingMonth1 = getDistancePricing(result.firstMonthTotal, zipData.zone);
                const distPricingOngoing = getDistancePricing(result.ongoingMonthlyTotal, zipData.zone);

                setEstimate({
                    ...result,
                    distMonth1: distPricingMonth1,
                    distOngoing: distPricingOngoing
                });
                
                setDistancePricing({
                    zone: zipData.zone,
                    distance: zipData.distance,
                    travelFee: distPricingMonth1.travelFee,
                    distanceCredit: distPricingMonth1.distanceCredit
                });
                
                // Deposit is strictly 25% of the Final Month 1 Total
                setDepositAmount(Math.round(distPricingMonth1.finalTotal * 0.25));

                sendToCRM({
                    ...form,
                    serviceType: form.frequency === 'oneTime' ? (serviceLabels[form.serviceType] || form.serviceType) : `${form.frequency} Plan`,
                    estimateRange: result.isRecurring 
                        ? `$${distPricingMonth1.finalTotal} First Month | $${distPricingOngoing.finalTotal} Ongoing`
                        : `$${distPricingMonth1.finalTotal}`,
                    addons: form.addons,
                    marketing_opt_in: form.marketingOptIn,
                    source, audience, utm_campaign: campaign, ad_set: adSet, utm_content: content,
                    location_id: import.meta.env.VITE_GHL_LOCATION_ID,
                    status: 'Anonymous Estimate Generated',
                    tags: ['Anonymous-Estimate', ...tags],
                    service_zone: zipData.zone,
                    premium_route_fee: distPricingMonth1.travelFee,
                    long_distance_credit: distPricingMonth1.distanceCredit,
                    final_total: distPricingMonth1.finalTotal
                }, 'lead_capture');

                setDirection(1);
                setStep(1);
            } catch (err) {
                console.error(err);
            } finally {
                setIsCalculating(false);
            }
            return; // stop execution, we manually advanced step
        }

        if (step === 2) {
            tags.push('Partial-Lead');
            const metaData = trackConversion('Lead', {
                content_category: 'Cleaning Quote',
                content_name: form.frequency === 'oneTime' ? form.serviceType : form.frequency,
                value: estimate?.total || 180
            });
            window.__gg_lead_meta = metaData;

            sendToCRM({
                ...form,
                serviceType: form.frequency === 'oneTime' ? (serviceLabels[form.serviceType] || form.serviceType) : `${form.frequency} Plan`,
                estimateRange: estimate?.distMonth1 ? `$${estimate.distMonth1.finalTotal}` : '',
                status: 'Lead / Contact Captured',
                source, audience, utm_campaign: campaign, ad_set: adSet, utm_content: content,
                location_id: import.meta.env.VITE_GHL_LOCATION_ID,
                tags,
                ...(window.__gg_lead_meta ? window.__gg_lead_meta : {})
            }, 'lead_capture');
        }

        setDirection(1);
        setStep((s) => s + 1);
    };

    const goBack = () => {
        setDirection(-1);
        setStep((s) => Math.max(0, s - 1));
    };

    const resetWidget = () => {
        setForm(INITIAL_FORM_STATE);
        setStep(0);
        setPaymentConfirmed(false);
        setClientSecret(null);
        if (inline) {
            document.getElementById('calculator_anchor')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const initiateCheckout = async () => {
        setCheckoutLoading(true);
        setCheckoutError('');
        try {
            // Recalculate deposit to include the urgency fee from date selection
            const urgencyFee = form.urgencyFee || 0;
            const baseEstimateFinal = estimate?.distMonth1?.finalTotal || 0;
            const totalWithUrgency = baseEstimateFinal + urgencyFee;
            const finalDeposit = Math.round(totalWithUrgency * 0.25);
            setDepositAmount(finalDeposit);

            const res = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: finalDeposit * 100, // Converting to cents for Stripe
                    payment_flow: 'estimate_widget',
                    serviceType: form.frequency === 'oneTime' ? (serviceLabels[form.serviceType] || form.serviceType) : `${form.frequency} Plan`,
                    estimateRange: `$${baseEstimateFinal}`,
                    urgencyFee: urgencyFee,
                    request_id: form.request_id || form.requestId,
                    lead_uuid: form.lead_uuid || form.lead_id,
                    funnel_session_id: form.funnel_session_id || form.funnelSessionId,
                    quote_session_id: form.quote_session_id || form.quoteSessionId,
                    internal_quote_id: form.internal_quote_id || form.internalQuoteId,
                    meta_event_id: form.meta_event_id || form.eventId || ''
                }),
            });

            const source = sessionStorage.getItem('lead_source') || 'organic';
            const tags = ['Residential', 'Attempted-Booking', (form.homeType === 'Commercial' || form.serviceType === 'commercial') ? 'commercialclient' : 'residentialclient'];
            if (source === 'facebook') tags.push('fb-ad-funnel');

            sendToCRM({
                ...form,
                serviceType: form.frequency === 'oneTime' ? (serviceLabels[form.serviceType] || form.serviceType) : `${form.frequency} Plan`,
                estimateRange: `$${baseEstimateFinal}`,
                status: 'Qualified Lead / Checkout Started',
                source: source,
                location_id: import.meta.env.VITE_GHL_LOCATION_ID,
                urgency_fee: urgencyFee,
                tags: tags
            }, 'lead_capture');

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setClientSecret(data.clientSecret);
            setDirection(1);
            setStep(3);
        } catch (err) {
            setCheckoutError('Unable to start checkout. Please try again.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleDateSelect = (dateObj) => {
        setForm(f => ({ ...f, date: dateObj.value, urgencyFee: dateObj.urgency.fee, time: '' }));
    };


    return (
        <div className={`ew-overlay ${inline ? 'inline' : ''}`} role="dialog" aria-modal="true">
            <motion.div className="ew-modal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                {/* Exit Mechanism */}
                {step > 0 && (
                    <button className="ew-exit-btn" onClick={resetWidget} title="Reset Calculator">✕</button>
                )}
                
                {/* Progress Stepper */}
                <div className="ew-desktop-progress-container">
                    {[
                        'Your Home',
                        'Pick a Date',
                        'Contact',
                        'Secure'
                    ].flatMap((label, idx, arr) => {
                        const isCompleted = idx < step;
                        const isActive = idx === step;
                        const elements = [
                            <div key={label} className={`ew-prog-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="ew-prog-circle">
                                    {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                </div>
                                <div className="ew-prog-label">{label}</div>
                            </div>
                        ];
                        if (idx < arr.length - 1) {
                            elements.push(
                                <div key={`conn-${idx}`} className={`ew-prog-connector ${idx < step ? 'filled' : ''}`} />
                            );
                        }
                        return elements;
                    })}
                </div>

                <div className="ew-header">
                    <div className="ew-header-text">
                        <div className="ew-eyebrow">{STEP_META[step].eyebrow}</div>
                        <div className="ew-title">{STEP_META[step].title}</div>
                    </div>
                    {!inline && <button className="ew-close-btn" onClick={onClose}>✕</button>}
                </div>


                <div className="ew-step-content">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.15 } }}
                        >
                            {/* STEP 0: YOUR HOME */}
                            {step === 0 && (
                                <div className="ew-step-stack">
                                    <div className="ew-info-line">
                                        <Sparkles size={16} color="var(--color-secondary)" />
                                        <span>G&G Smart Quote Engine: Most Long Island homes range from <strong>$120 – $280</strong></span>
                                    </div>

                                    <PropertySelector 
                                        label="Bedrooms *" 
                                        icon={Bed}
                                        value={form.bedrooms} 
                                        onChange={set('bedrooms')} 
                                        options={[
                                            { label: 'Studio', value: '1' },
                                            { label: 'Med', value: '2' },
                                            { label: 'Large', value: '3' },
                                            { label: 'XL', value: '4' },
                                            { label: 'Luxury', value: '5+' },
                                        ]}
                                    />
                                    
                                    <PropertySelector 
                                        label="Bathrooms *" 
                                        icon={Bath}
                                        value={form.bathrooms} 
                                        onChange={set('bathrooms')} 
                                        options={[
                                            { label: 'Full', value: '1' },
                                            { label: 'Family', value: '2' },
                                            { label: 'Large', value: '3' },
                                            { label: 'Grand', value: '4+' },
                                        ]}
                                    />

                                    <div className="ew-form-group">
                                        <label className="ew-label">Service ZIP Code *</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                            <input 
                                                className="ew-input" 
                                                style={{ paddingLeft: '40px' }}
                                                type="text" 
                                                placeholder="e.g. 11743" 
                                                maxLength="5" 
                                                value={form.zipCode} 
                                                onChange={(e) => set('zipCode')(e.target.value.replace(/\D/g,''))} 
                                            />
                                        </div>
                                    </div>

                                    {form.homeType === 'Commercial' && (
                                        <div className="ew-commercial-notice" style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Commercial Quote Needed</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '0', lineHeight: '1.4' }}>
                                                Every business is unique. We provide customized quotes for commercial spaces. You can continue this form, or contact us directly.
                                            </p>
                                        </div>
                                    )}

                                    <div className="ew-step-divider" style={{ borderTop: '1px solid var(--color-border)', margin: '24px 0' }}></div>

                                    {/* FREQUENCY & CLEANING TYPE */}
                                    <div className="ew-form-group">
                                        <label className="ew-label">How often do you need cleaning?</label>
                                        <div className="ew-options-grid cols-2 tall">
                                            <OptionBtn label="One-Time" value="oneTime" sublabel="Just once" selected={form.frequency === 'oneTime'} onClick={set('frequency')} icon="📅" />
                                            <OptionBtn label="Basic Plan" value="Basic" sublabel="1x / Month (-5%)" selected={form.frequency === 'Basic'} onClick={set('frequency')} icon="🥉" />
                                            <OptionBtn label="Plus Plan" value="Plus" sublabel="2x / Month (-10%)" selected={form.frequency === 'Plus'} onClick={set('frequency')} icon="🥈" />
                                            <OptionBtn label="Premium Plan" value="Premium" sublabel="Weekly (-15%)" selected={form.frequency === 'Premium'} onClick={set('frequency')} icon="🥇" />
                                        </div>
                                    </div>

                                    {form.frequency === 'oneTime' && (
                                        <div className="ew-form-group" style={{ marginTop: '20px' }}>
                                            <label className="ew-label">Select Service Type</label>
                                            <div className="ew-options-grid cols-2 tall">
                                                <OptionBtn label="Standard Clean" value="standard" sublabel="Maintenance" selected={form.serviceType === 'standard'} onClick={set('serviceType')} icon="🧹" />
                                                <OptionBtn label="Deep Clean" value="deep" sublabel="Thorough Reset" selected={form.serviceType === 'deep'} onClick={set('serviceType')} icon="🧼" />
                                                <OptionBtn label="Move-In/Out" value="moveOut" sublabel="Empty Home" selected={form.serviceType === 'moveOut'} onClick={set('serviceType')} icon="🚪" />
                                                <OptionBtn label="Turnover (Airbnb)" value="turnover" sublabel="Rentals" selected={form.serviceType === 'turnover'} onClick={set('serviceType')} icon="🧳" />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {form.frequency !== 'oneTime' && form.frequency !== '' && (
                                        <div className="ew-commercial-notice" style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', textAlign: 'center' }}>
                                            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Your Setup Month</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '0', lineHeight: '1.4' }}>
                                                All recurring plans start with an initial <strong>Deep Clean</strong> to get your home to our baseline standard, followed by regular Standard Cleanings.
                                            </p>
                                        </div>
                                    )}

                                    <div className="ew-step-divider" style={{ borderTop: '1px solid var(--color-border)', margin: '24px 0' }}></div>

                                    {/* CONDITION & ADD-ONS */}
                                    <div className="ew-form-group">
                                        <label className="ew-label">Current Condition *</label>
                                        <div className="ew-options-grid cols-3">
                                            {['light', 'moderate', 'heavy'].map((c) => (
                                                <OptionBtn 
                                                    key={c} 
                                                    label={c.charAt(0).toUpperCase() + c.slice(1)} 
                                                    value={c}
                                                    selected={form.condition === c} 
                                                    onClick={set('condition')} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="ew-form-group">
                                        <label className="ew-label">Add-ons (Optional)</label>
                                        <div className="ew-addons-grid">
                                            {ADDON_META.map((meta) => (
                                                <button 
                                                    key={meta.key} 
                                                    type="button" 
                                                    className={`ew-addon-card${form.addons.includes(meta.key) ? ' active' : ''}`} 
                                                    onClick={() => toggleAddon(meta.key)}
                                                >
                                                    <span className="ew-addon-icon">{meta.icon}</span>
                                                    <div className="ew-addon-details">
                                                        <span className="ew-addon-name">{meta.label}</span>
                                                        <span className="ew-addon-price">+{meta.price}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: CONTACT DETAILS & ESTIMATE */}
                            {step === 2 && (
                                <div className="ew-step-stack">
                                    {/* ESTIMATE REVEAL SUMMARY */}
                                    {estimate && distancePricing && (
                                        <div className="ew-estimate-result" style={{ textAlign: 'center', padding: '0 0 24px' }}>
                                            {estimate.isRecurring ? (
                                                // RECURRING REVEAL
                                                <>
                                                    <div className="ew-estimate-pill" style={{ background: 'var(--color-bg-alt)', border: '2px solid var(--color-primary)', padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '20px' }}>
                                                        <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>First Month (Setup)</span>
                                                            <span style={{ fontSize: '0.8rem', background: 'var(--color-accent)', color: 'var(--color-bg)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>Extra 10% Off</span>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ color: 'var(--color-text-light)' }}>Includes</span>
                                                            <span style={{ fontWeight: 600 }}>1 Deep + {estimate.visitsPerMonth - 1} Standard</span>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--color-border)', marginTop: '8px' }}>
                                                            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Averaged Flat Quote</span>
                                                            <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                                                                {formatCurrency(estimate.distMonth1.finalTotal)}
                                                            </span>
                                                        </div>
                                                        <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0, textAlign: 'right' }}>
                                                            That's just {formatCurrency(estimate.distMonth1.finalTotal / estimate.visitsPerMonth)} / visit
                                                        </p>
                                                    </div>

                                                    <div className="ew-estimate-pill" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                                                        <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Ongoing Months (Month 2+)</span>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ color: 'var(--color-text-light)' }}>Includes</span>
                                                            <span style={{ fontWeight: 600 }}>{estimate.visitsPerMonth} Standard Cleanings</span>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--color-border)', marginTop: '8px' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Ongoing Monthly Total</span>
                                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                                                                {formatCurrency(estimate.distOngoing.finalTotal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                // ONE-TIME REVEAL
                                                <div className="ew-estimate-pill" style={{ background: 'var(--color-bg-alt)', border: '2px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                                                    <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Quote Summary</span>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ color: 'var(--color-text-light)' }}>{serviceLabels[form.serviceType] || 'Cleaning'}</span>
                                                        <span style={{ fontWeight: 600 }}>{formatCurrency(estimate.distMonth1.baseSubtotal)}</span>
                                                    </div>

                                                    {distancePricing.travelFee > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ color: 'var(--color-text-light)' }}>Premium Route Fee (Remote)</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>+{formatCurrency(distancePricing.travelFee)}</span>
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid var(--color-border)' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Final Quote</span>
                                                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                                                            {formatCurrency(estimate.distMonth1.finalTotal)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="ew-step-divider" style={{ borderTop: '1px solid var(--color-border)', margin: '0 0 24px' }}></div>

                                    <div className="ew-form-row">
                                        <div className="ew-form-group">
                                            <label className="ew-label">Your Name</label>
                                            <input className="ew-input" type="text" placeholder="Griselda Alas" value={form.name} onChange={(e) => set('name')(e.target.value)} />
                                        </div>
                                        <div className="ew-form-group">
                                            <label className="ew-label">Phone Number</label>
                                            <input className="ew-input" type="tel" placeholder="(555) 555-5555" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="ew-form-group">
                                        <label className="ew-label">Email Address</label>
                                        <input className="ew-input" type="email" placeholder="info@ggcleaningli.com" value={form.email} onChange={(e) => set('email')(e.target.value)} />
                                    </div>
                                    <div className="ew-form-group">
                                        <label className="ew-label">Service Address *</label>
                                        <input className="ew-input" style={{ width: '100%' }} type="text" placeholder="123 Main St, Huntington, NY" value={form.address} onChange={(e) => set('address')(e.target.value)} />
                                    </div>
                                    <div className="ew-form-group">
                                        <label className="ew-label">Notes or Special Instructions (Optional)</label>
                                        <textarea className="ew-input" placeholder="e.g. Please arrive after 10 AM, I have a friendly dog, etc." style={{ minHeight: '60px', resize: 'vertical' }} value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
                                    </div>
                                    <div className="ew-form-group" style={{ 
                                        marginTop: '1.5rem', 
                                        padding: '1rem', 
                                        background: 'var(--color-bg-alt)', 
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            id="sms-opt-in" 
                                            checked={form.smsOptIn} 
                                            onChange={(e) => set('smsOptIn')(e.target.checked)}
                                            style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="sms-opt-in" style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.4', cursor: 'pointer', margin: 0 }}>
                                            By checking this box, you agree to receive SMS/MMS messages from G&G Cleaning Services regarding your estimate, appointment details, and occasional promotional offers. 
                                            Consent is not a condition of purchase. Message & data rates may apply. Reply STOP to cancel at any time.
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: SCHEDULING */}
                            {step === 1 && (
                                <>
                                    <label className="ew-label" style={{ marginBottom: '4px', display:'block' }}>Choose your preferred date</label>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 0, marginBottom: '12px' }}>
                                        ⚡ Same-day &amp; next-day available — priority fees apply for last-minute bookings.
                                    </p>
                                    <div className="ew-option-grid cols-2" style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: 20 }}>
                                        {availableDates.map(d => (
                                            <OptionBtn
                                                key={d.value}
                                                value={d.value}
                                                label={d.label}
                                                sublabel={d.urgency.fee > 0 ? d.urgency.sub : d.urgency.label}
                                                selected={form.date === d.value}
                                                onClick={() => handleDateSelect(d)}
                                            />
                                        ))}
                                    </div>

                                    {/* Urgency fee callout */}
                                    {form.date && form.urgencyFee > 0 && (
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(106,27,154,0.08), rgba(255,193,7,0.08))',
                                            border: '1px solid var(--color-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '10px 14px',
                                            marginBottom: '14px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.85rem'
                                        }}>
                                            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Priority Booking Fee</span>
                                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>+${form.urgencyFee}</span>
                                        </div>
                                    )}

                                    {form.date && (
                                        <>
                                            <label className="ew-label" style={{ marginBottom: '10px', display:'block' }}>Select arrival window</label>
                                            <div className="ew-options-grid small">
                                                {availableTimes.map(t => <OptionBtn key={t.value} value={t.value} label={t.label} sublabel={t.sub} selected={form.time === t.value} onClick={set('time')} />)}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* STEP 3: CHECKOUT */}
                            {step === 3 && clientSecret && (
                                <div className="ew-checkout-container" style={{ padding: '10px 0' }}>
                                    <div className="ew-checkout-summary" style={{ background: 'var(--color-bg-alt)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ margin: '0 0 14px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>Booking Summary</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--color-text)' }}>
                                            <span>{estimate.isRecurring ? 'First Month Quote:' : 'Final Quote:'}</span>
                                            <span style={{ fontWeight: 600 }}>${estimate?.distMonth1?.finalTotal}</span>
                                        </div>

                                        {form.urgencyFee > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                                                <span>⚡ Priority Booking Fee</span>
                                                <span style={{ fontWeight: 600 }}>+${form.urgencyFee}</span>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--color-text)' }}>
                                            <span>Required Deposit (25%):</span>
                                            <span style={{ fontWeight: 600 }}>${depositAmount}.00</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '10px', fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                                            <span>Remaining Balance Due (Day of Service):</span>
                                            <span>${(estimate?.distMonth1?.finalTotal || 0) + (form.urgencyFee || 0) - depositAmount}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="ew-urgency-line">
                                        <span>🗓️</span>
                                        Spring slots are filling fast — only a few openings left this week
                                    </div>

                                    <Elements stripe={getStripe()} options={{ clientSecret }}>
                                        <CheckoutForm
                                            amount={depositAmount}
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
                                                                service_type: form.frequency === 'oneTime' ? (serviceLabels[form.serviceType] || form.serviceType) : `${form.frequency} Plan`,
                                                                zip_code: form.zipCode,
                                                                notes: `[PAID BOOKING - $${depositAmount} DEPOSIT RECEIVED]${form.urgencyFee > 0 ? ` ⚡ PRIORITY BOOKING (+$${form.urgencyFee} fee)` : ''} 
                                                                        Date: ${form.date}
                                                                        Time: ${form.time}
                                                                        Address: ${form.address}
                                                                        Quote: $${estimate.distMonth1.finalTotal}${form.urgencyFee > 0 ? `\n                                                                        Priority Fee: +$${form.urgencyFee}` : ''}
                                                                        Stripe ID: ${paymentIntent.id}`,
                                                                to_name: BUSINESS.name
                                                            },
                                                            publicKey
                                                        );
                                                    }
                                                } catch (err) {
                                                    console.error('Email notification failed:', err);
                                                }

                                                const source = sessionStorage.getItem('lead_source') || 'organic';
                                                const tags = [form.homeType === 'Commercial' ? 'commercialclient' : 'residentialclient', 'Paid Booking'];
                                                if (source === 'facebook') tags.push('fb-ad-funnel');

                                                // 2. Sync to CRM
                                                sendToCRM({
                                                    ...form,
                                                    serviceType: serviceLabels[form.serviceType] || form.serviceType,
                                                    bookingDate: form.date,
                                                    bookingTime: form.time,
                                                    urgencyFee: form.urgencyFee,
                                                    paymentTotal: `$${depositAmount}.00 (Deposit)`,
                                                    status: 'Deposit Paid',
                                                    source: source,
                                                    deposit_amount: depositAmount,
                                                    stripe_payment_id: paymentIntent.id,
                                                    location_id: import.meta.env.VITE_GHL_LOCATION_ID,
                                                    pipelineId: import.meta.env.VITE_GHL_PIPELINE_ID,
                                                    stage: 'Booking Confirmed',
                                                    tags: tags,
                                                    // Distance pricing persistence
                                                    service_zone: distancePricing?.zone,
                                                    premium_route_fee: distancePricing?.travelFee,
                                                    long_distance_credit: distancePricing?.distanceCredit,
                                                    final_total: distancePricing?.finalTotal
                                                }, 'booking_confirmed');

                                                // 3. Track Purchase in Meta Pixel (synchronized with GHL server event)
                                                const purchaseMeta = trackConversion('Purchase', {
                                                    value: estimate?.total || depositAmount,
                                                    currency: 'USD',
                                                    content_name: form.serviceType,
                                                    content_category: 'Cleaning Booking'
                                                });

                                                // Re-send to CRM with the Purchase event_id for CAPI dedup
                                                sendToCRM({
                                                    name: form.name,
                                                    email: form.email,
                                                    phone: form.phone,
                                                    status: 'Purchase Event Fired',
                                                    stripe_payment_id: paymentIntent.id,
                                                    ...purchaseMeta
                                                }, 'booking_confirmed');

                                                setPaymentConfirmed(true);
                                                navigate('/booking-confirmed', { state: { showPhotoPrompt: true, form, estimate } });
                                            }}
                                            breakdown={distancePricing}
                                            onBack={goBack}
                                        />
                                    </Elements>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    {(step < 3 || step === 2) && (
                        <div className="ew-nav" style={{ marginTop: 24 }}>
                            {step > 0 && step !== 3 && (
                                <button className="ew-btn-back" onClick={goBack}>← Back</button>
                            )}
                            {step === 0 ? (
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <button 
                                        className="ew-btn-premium" 
                                        onClick={goNext} 
                                        disabled={!canProceed() || isCalculating}
                                        style={{ width: '100%' }}
                                    >
                                        {isCalculating ? 'Calculating...' : 'Show Me My Price — $40 Off Applied →'}
                                    </button>
                                    <div className="qf-trustbar-hero mobile-only" style={{ marginTop: '1.5rem' }}>
                                        <TrustBar items={BUSINESS.trustBadges} variant="light" />
                                    </div>
                                </div>
                            ) : step === 1 ? (
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <button 
                                        className="ew-btn-next" 
                                        onClick={goNext} 
                                        disabled={!canProceed()}
                                        style={{ width: '100%' }}
                                    >
                                        Next →
                                    </button>
                                    {!form.time && form.date && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                                            Please select an arrival window above to continue
                                        </span>
                                    )}
                                </div>
                            ) : step === 2 ? (
                                <button 
                                    className="ew-btn-next" 
                                    onClick={() => {
                                        trackConversion('AddPaymentInfo', {
                                            value: depositAmount,
                                            currency: 'USD'
                                        });
                                        initiateCheckout();
                                    }} 
                                    disabled={!canProceed() || checkoutLoading}
                                >
                                    {checkoutLoading ? 'Preparing…' : `Reserve for $${depositAmount} →`}
                                </button>
                            ) : null}
                        </div>
                    )}

                    {checkoutError && (
                        <div className="ew-error-banner" style={{ 
                            background: 'rgba(211, 47, 47, 0.1)', 
                            color: '#d32f2f', 
                            padding: '12px', 
                            borderRadius: 'var(--radius-sm)', 
                            marginTop: '1rem',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            border: '1px solid rgba(211, 47, 47, 0.2)'
                        }}>
                            ⚠️ {checkoutError}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="qf-guarantee-line" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <span className="qf-lock-icon">🔒</span> Safe & Secure Checkout via Stripe.
                        </div>
                    )}
                </div>

                <ReceiptSidebar 
                    form={form} 
                    estimate={estimate} 
                    distancePricing={distancePricing} 
                    step={step} 
                    serviceLabels={serviceLabels} 
                />

                <div className="ew-social-ticker">
                    <div className="ew-social-pulse" />
                    <span><strong>12 people</strong> booked a cleaning in Huntington this week</span>
                </div>
            </motion.div>
        </div>
    );
};

export default EstimateWidget;
