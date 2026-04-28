import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building2, LayoutDashboard, Settings2, CalendarDays, 
    ArrowRight, ArrowLeft, CheckCircle2, Info, 
    Calculator, Phone, ClipboardCheck, Sparkles as SparkleIcon
} from 'lucide-react';
import { calculateCommercialQuote } from '../utils/pricingEngine';
import { sendToCRM } from '../utils/crm';
import './CommercialCalculator.css';

const STEPS = [
    { id: 1, title: 'Business Info', icon: Building2 },
    { id: 2, title: 'Property Details', icon: LayoutDashboard },
    { id: 3, title: 'Cleaning Scope', icon: Settings2 },
    { id: 4, title: 'Frequency & Use', icon: CalendarDays },
    { id: 5, title: 'Quote Summary', icon: ClipboardCheck }
];

const PROPERTY_TYPES = [
    { id: 'office', label: 'Office Space', icon: '💼' },
    { id: 'medical', label: 'Medical Office', icon: '🏥' },
    { id: 'retail', label: 'Retail Store', icon: '🛍️' },
    { id: 'warehouse', label: 'Warehouse / Industrial', icon: '📦' },
    { id: 'gym', label: 'Gym / Fitness Center', icon: '💪' },
    { id: 'airbnb', label: 'Airbnb / Short-Term Portfolio', icon: '🏡' },
    { id: 'school', label: 'School / Daycare', icon: '🏫' },
    { id: 'restaurant', label: 'Restaurant / Hospitality', icon: '🍽️' },
    { id: 'other', label: 'Other Commercial Property', icon: '🏢' }
];

const SCOPE_OPTIONS = [
    { id: 'general', label: 'General Cleaning (Floors, Dusting)', icon: '🧹' },
    { id: 'restroom', label: 'Restroom Sanitation', icon: '🧼' },
    { id: 'breakroom', label: 'Breakroom / Kitchen Cleaning', icon: '☕' },
    { id: 'trash', label: 'Trash Removal', icon: '🗑️' },
    { id: 'windowCleaning', label: 'Window Cleaning (Interior)', icon: '🪟' },
    { id: 'carpetCleaning', label: 'Carpet Cleaning', icon: '🧶' },
    { id: 'floorBuffing', label: 'Floor Buffing / Waxing', icon: '✨' },
    { id: 'disinfection', label: 'Deep Disinfection Services', icon: '🛡️' },
    { id: 'postConstruction', label: 'Post-Construction Cleanup', icon: '🏗️' },
    { id: 'deep', label: 'Full Deep Cleaning', icon: '💎' }
];

const INITIAL_FORM = {
    businessName: '', contactName: '', phone: '', email: '',
    address: '', city: '', zipCode: '',
    propertyType: 'office',
    sqft: 2500, floors: 1, restrooms: 2, occupancy: 'Medium',
    hoursOfOperation: 'Daytime',
    scope: ['general', 'restroom', 'trash'],
    frequency: '3x',
    condition: 'average',
    notes: ''
};

const CommercialCalculator = () => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // ── Logic ───────────────────────────────────────────────────────────────
    const estimate = useMemo(() => calculateCommercialQuote(form), [form]);

    const set = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [field]: val }));
    };

    const toggleScope = (id) => {
        setForm(f => ({
            ...f,
            scope: f.scope.includes(id) ? f.scope.filter(s => s !== id) : [...f.scope, id]
        }));
    };

    const next = () => setStep(s => Math.min(s + 1, STEPS.length));
    const prev = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async (actionType) => {
        setIsSubmitting(true);
        const payload = {
            ...form,
            leadType: 'Commercial',
            estimatedMonthly: `$${estimate.monthly.min} - $${estimate.monthly.max}`,
            estimatedPerVisit: `$${estimate.perVisit.min} - $${estimate.perVisit.max}`,
            requestedAction: actionType,
            tags: ['Commercial-Quote-Request', actionType.replace(/\s+/g, '-')]
        };

        const result = await sendToCRM(payload, 'commercial_quote');
        if (result.success) {
            setIsComplete(true);
        } else {
            alert('Something went wrong. Please try again or call us directly.');
        }
        setIsSubmitting(false);
    };

    // ── Animation Config ─────────────────────────────────────────────────────
    const variants = {
        enter: { x: 20, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 }
    };

    if (isComplete) {
        return (
            <motion.div className="cc-success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="cc-success-icon"><CheckCircle2 size={64} /></div>
                <h2>Quote Request Received</h2>
                <p>One of our commercial specialists will review your requirements and reach out within 24 hours to schedule a walkthrough.</p>
                <div className="cc-success-actions">
                    <button onClick={() => window.location.href = '/'} className="cc-btn-primary">Back to Home</button>
                    <a href="tel:5160000000" className="cc-btn-outline"><Phone size={16} /> Call Specialist</a>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="cc-container">
            {/* Header & Progress */}
            <div className="cc-header">
                <div className="cc-title-area">
                    <h1 className="cc-title">Commercial Estimate Builder</h1>
                    <p className="cc-subtitle">Professional facility management solutions for Long Island businesses.</p>
                </div>
                <div className="cc-progress-track">
                    {STEPS.map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.id} className={`cc-progress-step ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}>
                                <div className="step-circle"><Icon size={16} /></div>
                                <span className="step-label">{s.title}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="cc-card">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="cc-step-content"
                    >
                        {/* STEP 1: BUSINESS INFO */}
                        {step === 1 && (
                            <div className="cc-form-grid">
                                <div className="cc-field full">
                                    <label>Company / Business Name</label>
                                    <input value={form.businessName} onChange={set('businessName')} placeholder="e.g. Long Island Tech Hub" />
                                </div>
                                <div className="cc-field">
                                    <label>Contact Name</label>
                                    <input value={form.contactName} onChange={set('contactName')} placeholder="Your Full Name" />
                                </div>
                                <div className="cc-field">
                                    <label>Phone Number</label>
                                    <input value={form.phone} onChange={set('phone')} placeholder="(516) 000-0000" />
                                </div>
                                <div className="cc-field">
                                    <label>Email Address</label>
                                    <input value={form.email} onChange={set('email')} placeholder="name@business.com" />
                                </div>
                                <div className="cc-field">
                                    <label>ZIP Code</label>
                                    <input value={form.zipCode} onChange={set('zipCode')} maxLength={5} placeholder="11722" />
                                </div>
                                <div className="cc-field full">
                                    <label>Facility Address</label>
                                    <input value={form.address} onChange={set('address')} placeholder="Street, Suite, Floor" />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: PROPERTY DETAILS */}
                        {step === 2 && (
                            <div className="cc-form-grid">
                                <div className="cc-field full">
                                    <label>Property Type</label>
                                    <div className="cc-property-selector">
                                        {PROPERTY_TYPES.map(type => (
                                            <button 
                                                key={type.id}
                                                className={`cc-property-btn ${form.propertyType === type.id ? 'selected' : ''}`}
                                                onClick={() => setForm(f => ({ ...f, propertyType: type.id }))}
                                            >
                                                <span className="type-icon">{type.icon}</span>
                                                <span className="type-label">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="cc-field">
                                    <label>Square Footage (Est.)</label>
                                    <input type="number" value={form.sqft} onChange={set('sqft')} step={500} />
                                </div>
                                <div className="cc-field">
                                    <label>Number of Floors</label>
                                    <input type="number" value={form.floors} onChange={set('floors')} min={1} />
                                </div>
                                <div className="cc-field">
                                    <label>Number of Restrooms</label>
                                    <input type="number" value={form.restrooms} onChange={set('restrooms')} min={0} />
                                </div>
                                <div className="cc-field">
                                    <label>Occupancy Level</label>
                                    <select value={form.occupancy} onChange={set('occupancy')}>
                                        <option value="Low">Low (Quiet Office)</option>
                                        <option value="Medium">Medium (Standard Business)</option>
                                        <option value="High">High (Retail/Public/Warehouse)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SCOPE */}
                        {step === 3 && (
                            <div className="cc-scope-section">
                                <p className="cc-instr">Select the services required for your facility:</p>
                                <div className="cc-scope-grid">
                                    {SCOPE_OPTIONS.map(opt => (
                                        <div 
                                            key={opt.id} 
                                            className={`cc-scope-card ${form.scope.includes(opt.id) ? 'selected' : ''}`}
                                            onClick={() => toggleScope(opt.id)}
                                        >
                                            <span className="scope-check">{form.scope.includes(opt.id) ? '✓' : ''}</span>
                                            <span className="scope-icon">{opt.icon}</span>
                                            <span className="scope-label">{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: FREQUENCY & CONDITION */}
                        {step === 4 && (
                            <div className="cc-form-grid">
                                <div className="cc-field">
                                    <label>Desired Frequency</label>
                                    <select value={form.frequency} onChange={set('frequency')}>
                                        <option value="1x">1x per week</option>
                                        <option value="2x">2x per week</option>
                                        <option value="3x">3x per week</option>
                                        <option value="5x">5x per week (Daily)</option>
                                        <option value="custom">Custom Schedule</option>
                                    </select>
                                </div>
                                <div className="cc-field">
                                    <label>Current Facility Condition</label>
                                    <select value={form.condition} onChange={set('condition')}>
                                        <option value="light">Light Maintenance (Well kept)</option>
                                        <option value="average">Average Use (Standard wear)</option>
                                        <option value="heavy">Heavy Use (Needs attention)</option>
                                        <option value="deep">Needs Initial Deep Clean First</option>
                                    </select>
                                </div>
                                <div className="cc-field full">
                                    <label>Additional Notes / Special Instructions</label>
                                    <textarea value={form.notes} onChange={set('notes')} placeholder="Tell us about special flooring, security access, or high-priority areas..." />
                                </div>
                            </div>
                        )}

                        {/* STEP 5: SUMMARY */}
                        {step === 5 && (
                            <div className="cc-summary">
                                <div className="cc-summary-results">
                                    <div className="cc-result-card">
                                        <span className="res-label">Est. Monthly Contract</span>
                                        <span className="res-value">${estimate.monthly.min} – ${estimate.monthly.max}</span>
                                        <span className="res-sub">Based on {estimate.recommendedFrequency}</span>
                                    </div>
                                    <div className="cc-result-card secondary">
                                        <span className="res-label">Est. Cost Per Visit</span>
                                        <span className="res-value">${estimate.perVisit.min} – ${estimate.perVisit.max}</span>
                                    </div>
                                </div>

                                {estimate.deepCleanFee > 0 && (
                                    <div className="cc-deep-alert">
                                        <SparkleIcon size={16} />
                                        <span>Initial Deep Clean Recommended: <strong>Approx. ${estimate.deepCleanFee}</strong></span>
                                    </div>
                                )}

                                <div className="cc-disclaimer">
                                    <Info size={14} />
                                    <span>These values are estimates only. Final pricing is confirmed after a formal site walkthrough.</span>
                                </div>

                                <div className="cc-final-actions">
                                    <button className="cc-action-btn primary" onClick={() => handleSubmit('Book Walkthrough')}>
                                        <CalendarDays size={18} /> Book Site Walkthrough
                                    </button>
                                    <button className="cc-action-btn secondary" onClick={() => handleSubmit('Request Formal Proposal')}>
                                        <ClipboardCheck size={18} /> Get Formal Proposal
                                    </button>
                                    <button className="cc-action-btn outline" onClick={() => handleSubmit('Speak With Specialist')}>
                                        <Phone size={18} /> Speak With Specialist
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="cc-nav">
                    {step > 1 && step < 5 && (
                        <button className="cc-btn-back" onClick={prev}><ArrowLeft size={16} /> Back</button>
                    )}
                    {step < 5 && (
                        <button className="cc-btn-next" onClick={next}>Continue <ArrowRight size={16} /></button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommercialCalculator;
