import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Lock, ShieldCheck, Calculator, Send, Copy, 
    UserPlus, CheckCircle2, AlertTriangle, 
    Calendar, Clock, Home, Info, LogOut,
    PlusCircle, MinusCircle, DollarSign,
    FileText, CheckCircle, ExternalLink, Loader2,
    Search
} from 'lucide-react';
import { calculateRecurringQuote, calculateCommercialQuote, getDistancePricing, ADDON_META_INTERNAL } from '../utils/pricingEngine';
import { getZipDistance } from '../config/serviceZones';
import { sendInternalQuote, generateDocument, fetchQuote } from '../utils/crm';
import { useStaffAuth } from '../auth/StaffAuthProvider';
import './InternalQuotePage.css';

// Admin & Staff Configuration
const ADMIN_OVERRIDE_CODES = {
    'ADMINOVERRIDE': { allowRushBypass: true, waiveRushFee: false, label: 'Admin Override' },
    'GRACEPRIORITY': { allowRushBypass: true, waiveRushFee: false, label: 'Grace Priority' },
    'MANUALBOOK':    { allowRushBypass: true, waiveRushFee: false, label: 'Manual Book' },
    'WAIVERUSH':     { allowRushBypass: false, waiveRushFee: true, label: 'Waive Rush Fee' },
};

const CUSTOMER_COUPONS = {
    'SPRING40':    { type: 'flat', amount: 40, label: '$40 Spring Special' },
    'FIRSTCLEAN':  { type: 'percent', amount: 0.10, label: '10% First Clean' },
    'REFERRAL25':  { type: 'flat', amount: 25, label: '$25 Referral' },
};

const STAFF_LIST = ['Griselda', 'Roberto', 'VA', 'Other'];

const INITIAL_FORM = {
    firstName: '', lastName: '', phone: '', email: '',
    address: '', city: '', zipCode: '11722',
    propertyType: 'House', cleaningType: 'standard',
    
    // Residential specific
    bedrooms: 3, bathrooms: 2, sqft: 2000,
    frequency: 'oneTime', condition: 'standard',
    addons: [], 
    
    // Custom Residential Pricing
    useHourlyPricing: false, estimatedHours: 4, hourlyRate: 50,
    useSqftPricing: false, ratePerSqft: 0.10,
    pricingTier: 'high',
    
    // Commercial specific
    businessName: '',
    commercialPropertyType: 'office',
    commercialFrequency: '1x',
    commercialCondition: 'average',
    commercialScope: [],
    
    preferredDate: '', preferredTime: 'Morning',
    petsInHome: 'No', accessInstructions: '', parkingInstructions: '',
    customerNotes: '', internalVANotes: '',
    overrideCode: '', couponCode: '',
    quotedBy: 'Griselda', otherStaff: '',
    internalQuoteId: null, // Track the persistent ID (GGQ-YYYY-XXXXXX)
};

const InternalQuotePage = () => {
    const { staff } = useStaffAuth();
    const [form, setForm] = useState(INITIAL_FORM);
    const [isFieldMode, setIsFieldMode] = useState(false);
    const [estimate, setEstimate] = useState(null);
    const [distancePricing, setDistancePricing] = useState(null);
    const [isCommercial, setIsCommercial] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [toast, setToast] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ 
        status: 'idle', // 'idle' | 'syncing' | 'success' | 'error' | 'saving'
        lastSynced: null, 
        error: null 
    });
    const [isSaving, setIsSaving] = useState(false);
    const [docStatus, setDocStatus] = useState({
        proposal: { status: 'not_generated', url: null },
        agreement: { status: 'not_generated', url: null }
    });

    // ── Logic Helpers ──────────────────────────────────────────────────────────
    const showToast = (msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const set = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [field]: val }));
    };

    const toggleAddon = (key) => {
        setForm(f => ({
            ...f,
            addons: f.addons.includes(key) ? f.addons.filter(k => k !== key) : [...f.addons, key]
        }));
    };

    const togglePricingMode = (mode) => {
        setForm(f => {
            const next = { ...f };
            if (mode === 'hourly') {
                next.useHourlyPricing = !f.useHourlyPricing;
                if (next.useHourlyPricing) next.useSqftPricing = false;
            } else if (mode === 'sqft') {
                next.useSqftPricing = !f.useSqftPricing;
                if (next.useSqftPricing) next.useHourlyPricing = false;
            }
            return next;
        });
    };

    // ── Real-time Pricing ──────────────────────────────────────────────────────
    useEffect(() => {
        const updatePrice = async () => {
            setIsCalculating(true);
            try {
                const zipData = await getZipDistance(form.zipCode);
                
                let result;
                if (isCommercial) {
                    result = calculateCommercialQuote({
                        propertyType: form.commercialPropertyType,
                        sqft: form.sqft,
                        condition: form.commercialCondition,
                        frequency: form.commercialFrequency,
                        scope: form.commercialScope,
                        pricingTier: form.pricingTier
                    });
                } else {
                    result = calculateRecurringQuote({
                        bedrooms: form.bedrooms,
                        bathrooms: form.bathrooms,
                        serviceType: form.cleaningType,
                        condition: form.condition,
                        addons: form.addons,
                        frequency: form.frequency,
                        useHourlyPricing: form.useHourlyPricing,
                        estimatedHours: form.estimatedHours,
                        hourlyRate: form.hourlyRate,
                        useSqftPricing: form.useSqftPricing,
                        ratePerSqft: form.ratePerSqft,
                        sqft: form.sqft,
                        pricingTier: form.pricingTier
                    });
                }

                const baseTotalForTravel = isCommercial ? result.perVisit.min : result.firstMonthTotal;
                const distPricingMonth1 = getDistancePricing(baseTotalForTravel, zipData.zone);
                
                // For commercial, ongoing is similar to monthly but travel fee might be different
                const ongoingBase = isCommercial ? result.monthly.min : result.ongoingMonthlyTotal;
                const distPricingOngoing = getDistancePricing(ongoingBase, zipData.zone);

                setEstimate({
                    ...result,
                    distMonth1: distPricingMonth1,
                    distOngoing: distPricingOngoing
                });
                setDistancePricing({ zone: zipData.zone, travelFee: distPricingMonth1.travelFee });
            } finally {
                setIsCalculating(false);
            }
        };
        if (form.zipCode.length === 5) updatePrice();
    }, [
        form.bedrooms, form.bathrooms, form.cleaningType, form.condition, form.addons, form.frequency, form.zipCode, 
        form.commercialPropertyType, form.sqft, form.commercialCondition, form.commercialFrequency, form.commercialScope,
        form.useHourlyPricing, form.estimatedHours, form.hourlyRate,
        form.useSqftPricing, form.ratePerSqft, form.pricingTier,
        isCommercial
    ]);

    // ── Derived Totals ─────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        if (!estimate) return { total: 0, deposit: 0, balance: 0, rushFee: 0, discount: 0 };
        
        let rushFee = 0;
        let discount = 0;

        // Rush Fee Logic
        if (form.preferredDate) {
            const daysOut = Math.ceil((new Date(form.preferredDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysOut <= 0) rushFee = 100;
            else if (daysOut === 1) rushFee = 65;
            else if (daysOut === 2) rushFee = 45;
        }

        const activeOverride = ADMIN_OVERRIDE_CODES[form.overrideCode.toUpperCase()];
        if (activeOverride?.waiveRushFee) rushFee = 0;

        let baseTotal = 0;
        if (isCommercial) {
            baseTotal = estimate.perVisit?.min || 0;
        } else {
            baseTotal = estimate.distMonth1?.finalTotal || 0;
        }
        
        const activeCoupon = CUSTOMER_COUPONS[form.couponCode.toUpperCase()];
        if (activeCoupon) {
            discount = activeCoupon.type === 'flat' ? activeCoupon.amount : (baseTotal * activeCoupon.amount);
        }

        const finalTotal = baseTotal + rushFee - discount;
        const deposit = isCommercial ? 0 : Math.round(finalTotal * 0.25);

        return {
            total: finalTotal,
            deposit,
            balance: finalTotal - deposit,
            rushFee,
            discount,
            overrideLabel: activeOverride?.label,
            couponLabel: activeCoupon?.label,
            isCommercialRange: isCommercial,
            commercialMax: isCommercial ? ((estimate.perVisit?.max || 0) + rushFee - discount) : null
        };
    }, [estimate, form.preferredDate, form.overrideCode, form.couponCode, isCommercial]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const handlePushToGHL = async () => {
        if (!form.phone || !form.firstName) {
            showToast('Name and Phone are required for sync', 'error');
            return;
        }

        setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
        const staffName = form.quotedBy === 'Other' ? form.otherStaff : form.quotedBy;
        const payload = {
            quoteData: {
                ...form,
                internalQuotedBy: staffName,
                quoteTotal: totals.total,
                monthlyTotal: estimate?.monthly?.min || 0,
                depositAmount: totals.deposit,
                balanceDue: totals.balance,
                travelFee: distancePricing?.travelFee || 0,
                rushFee: totals.rushFee,
                discountAmount: totals.discount,
                overrideUsed: !!totals.overrideLabel,
                priorityOverrideUsed: form.overrideCode,
                status: isApproved ? 'Manual Booking Approved' : (isFieldMode ? 'On-Site Adjustment' : 'Internal Quote Generated'),
                isFieldAdjustment: isFieldMode,
                tags: isFieldMode ? ['On-Site-Adjustment'] : (isApproved ? ['Manually-Approved'] : [])
            },
            customerData: {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email,
                address: form.address,
                city: form.city,
                zipCode: form.zipCode
            },
            internalQuoteId: form.internalQuoteId,
            action: 'sync'
        };

        const result = await sendInternalQuote(payload, null, form.internalQuoteId);
        
        if (result.success) {
            setSyncStatus({
                status: 'success',
                lastSynced: new Date().toLocaleTimeString(),
                error: null
            });
            
            if (result.internalQuoteId) {
                setForm(f => ({ ...f, internalQuoteId: result.internalQuoteId }));
                if (result.proposal_pdf_url || result.agreement_url) {
                    setDocStatus({
                        proposal: { status: result.proposal_status || 'idle', url: result.proposal_pdf_url },
                        agreement: { status: result.agreement_status || 'idle', url: result.agreement_url }
                    });
                }
            }
            showToast(isFieldMode ? 'Final price updated in GHL!' : 'Successfully pushed to GHL!', 'success');
        } else {
            setSyncStatus({ status: 'error', lastSynced: null, error: result.error });
            showToast('Error pushing to GHL: ' + result.error, 'error');
        }
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        setSyncStatus(prev => ({ ...prev, status: 'saving' }));
        
        const staffName = form.quotedBy === 'Other' ? form.otherStaff : form.quotedBy;
        const payload = {
            quoteData: {
                ...form,
                internalQuotedBy: staffName,
                quoteTotal: totals.total,
                depositAmount: totals.deposit,
                balanceDue: totals.balance
            },
            customerData: {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email,
                address: form.address,
                city: form.city,
                zipCode: form.zipCode
            },
            internalQuoteId: form.internalQuoteId,
            action: 'save_only'
        };

        try {
            const result = await sendInternalQuote(payload, null, form.internalQuoteId);
            if (result.success) {
                setForm(f => ({ ...f, internalQuoteId: result.internalQuoteId }));
                if (result.proposal_pdf_url || result.agreement_url) {
                    setDocStatus({
                        proposal: { status: result.proposal_status || 'idle', url: result.proposal_pdf_url },
                        agreement: { status: result.agreement_status || 'idle', url: result.agreement_url }
                    });
                }
                showToast('Draft saved successfully!', 'success');
                setSyncStatus(prev => ({ ...prev, status: 'idle', lastSynced: new Date().toLocaleTimeString() }));
            } else {
                showToast('Error saving draft: ' + result.error, 'error');
                setSyncStatus(prev => ({ ...prev, status: 'error', error: result.error }));
            }
        } catch (e) {
            showToast('Save failed: ' + e.message, 'error');
            setSyncStatus(prev => ({ ...prev, status: 'error', error: e.message }));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendProposal = async () => {
        if (!form.email) {
            showToast('Email required to send proposal', 'error');
            return;
        }
        
        const staffName = form.quotedBy === 'Other' ? form.otherStaff : form.quotedBy;
        const payload = {
            quoteData: {
                ...form,
                internalQuotedBy: staffName,
                quoteTotal: totals.total,
                monthlyTotal: estimate?.monthly?.min || 0,
                depositAmount: totals.deposit,
                balanceDue: totals.balance,
                status: 'Commercial Proposal Requested',
                tags: ['Commercial-Proposal-Triggered']
            },
            customerData: {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email,
                address: form.address,
                city: form.city,
                zipCode: form.zipCode
            },
            internalQuoteId: form.internalQuoteId,
            action: 'send_proposal'
        };

        showToast('Generating proposal...', 'info');
        const result = await sendInternalQuote(payload, null, form.internalQuoteId);
        if (result.success) {
            showToast('Proposal triggered in GHL!', 'success');
            if (result.proposal_pdf_url) {
                setDocStatus(prev => ({
                    ...prev,
                    proposal: { status: 'generated', url: result.proposal_pdf_url }
                }));
            }
        } else {
            showToast('Error triggering proposal: ' + result.error, 'error');
        }
    };

    const handleGenerateDoc = async (type) => {
        if (!form.internalQuoteId) {
            showToast('Please "Save Draft" first to assign a Quote ID.', 'warning');
            return;
        }

        setDocStatus(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'generating' }
        }));

        try {
            const result = await generateDocument(form.internalQuoteId, type);

            if (result.success) {
                setDocStatus(prev => ({
                    ...prev,
                    [type]: { status: 'generated', url: result.url }
                }));
                showToast(`${type === 'proposal' ? 'Proposal' : 'Agreement'} generated!`, 'success');
            } else {
                setDocStatus(prev => ({
                    ...prev,
                    [type]: { ...prev[type], status: 'error' }
                }));
                showToast(`Generation failed: ${result.error}`, 'error');
            }
        } catch (err) {
            setDocStatus(prev => ({
                ...prev,
                [type]: { ...prev[type], status: 'error' }
            }));
            showToast('Failed to connect to generator', 'error');
        }
    };

    const handleLoadQuote = async () => {
        if (!searchId) return;
        setIsLoadingQuote(true);
        try {
            const result = await fetchQuote(searchId.trim());
            if (result.success) {
                const quote = result.quote;
                const payload = quote.quote_payload;
                
                const customer = quote.customer || {};
                setForm({
                    ...INITIAL_FORM,
                    ...payload,
                    firstName: customer.first_name || payload.firstName || '',
                    lastName: customer.last_name || payload.lastName || '',
                    email: customer.email || payload.email || '',
                    phone: customer.phone || payload.phone || '',
                    address: customer.service_address || payload.address || '',
                    city: customer.city || payload.city || '',
                    zipCode: customer.postal_code || payload.zipCode || '',
                    internalQuoteId: quote.internal_quote_id
                });
                
                setIsCommercial(quote.property_type === 'Commercial' || payload.propertyType === 'commercial');
                
                setDocStatus({
                    proposal: { 
                        status: quote.proposal_status === 'generated' ? 'generated' : 'idle', 
                        url: quote.proposal_pdf_url 
                    },
                    agreement: { 
                        status: quote.agreement_status === 'generated' ? 'generated' : 'idle', 
                        url: quote.agreement_url 
                    }
                });
                
                showToast('Quote loaded successfully!', 'success');
                setSearchId('');
            } else {
                showToast('Quote not found: ' + result.error, 'error');
            }
        } catch (e) {
            showToast('Load failed: ' + e.message, 'error');
        } finally {
            setIsLoadingQuote(false);
        }
    };

    const copyQuote = () => {
        let summary = '';
        if (isCommercial) {
            summary = `
G&G Commercial Cleaning Estimate for ${form.businessName || form.firstName}
----------------------------------
Facility: ${form.commercialPropertyType.toUpperCase()} (${form.sqft} sqft)
Frequency: ${form.commercialFrequency}
Est. Per Visit: $${estimate.perVisit.min} - $${estimate.perVisit.max}
Est. Monthly: $${estimate.monthly.min} - $${estimate.monthly.max}
Notes: Final proposal provided after walkthrough.
            `.trim();
        } else {
            summary = `
G&G Cleaning Quote for ${form.firstName}
----------------------------------
Service: ${form.cleaningType.toUpperCase()} (${form.frequency})
Home: ${form.bedrooms} Bed / ${form.bathrooms} Bath
Total: $${totals.total}
Deposit: $${totals.deposit} (Required to secure date)
Balance: $${totals.balance} (Due day of cleaning)
            `.trim();
        }
        navigator.clipboard.writeText(summary);
        showToast('Quote summary copied to clipboard!', 'success');
    };

    const sendDepositLink = () => {
        showToast('Stripe link flow initiated (Redirecting...)', 'info');
        handlePushToGHL();
    };

    // ── Rendering ─────────────────────────────────────────────────────────────
    return (
        <div className={`iq-page ${isFieldMode ? 'field-mode' : 'office-mode'}`}>
            <header className="iq-topbar">
                <div className="iq-topbar-left">
                    <div className="iq-topbar-badge">INTERNAL</div>
                    <h1 className="iq-topbar-title">G&G Quote Desk</h1>
                </div>
                
                <div className="iq-topbar-right">
                    <div className="iq-sync-health">
                        <div className={`iq-sync-dot ${syncStatus.status}`} title={`Status: ${syncStatus.status}`} />
                        <div className="iq-sync-text">
                            <span className="status-label">
                                {syncStatus.status === 'syncing' ? 'Syncing to GHL...' : 
                                 syncStatus.status === 'error' ? 'Sync Failed' : 
                                 syncStatus.status === 'success' ? 'Synced' : 'Ready'}
                            </span>
                            {syncStatus.lastSynced && (
                                <span className="status-time">Last: {syncStatus.lastSynced}</span>
                            )}
                        </div>
                    </div>

                    <div className="iq-mode-toggle">
                        <span className={!isFieldMode ? 'active' : ''}>OFFICE</span>
                        <button 
                            className={`iq-toggle-switch ${isFieldMode ? 'field' : 'office'}`}
                            onClick={() => setIsFieldMode(!isFieldMode)}
                        >
                            <div className="iq-toggle-handle" />
                        </button>
                        <span className={isFieldMode ? 'active' : ''}>FIELD</span>
                    </div>

                    <div className="iq-staff-identity">
                        <span className="staff-name">Staff: {staff?.display_name || staff?.email || 'Authenticated Staff'} ({staff?.role || 'staff'})</span>
                        <span className="staff-status">● System Online</span>
                    </div>

                    <button onClick={useStaffAuth().logout} className="iq-logout-btn" title="Sign Out"><LogOut size={14} /></button>
                </div>
            </header>

            <main className="iq-layout">
                <div className="iq-form-stack">
                    {!isFieldMode && (
                        <div className="iq-section">
                            <h2 className="iq-section-title"><UserPlus size={16} /> Customer Details</h2>
                            <div className="iq-grid-2">
                                <div className="iq-field">
                                    <label className="iq-label">First Name <span className="req">*</span></label>
                                    <input className="iq-input" value={form.firstName} onChange={set('firstName')} placeholder="Customer First Name" />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Last Name <span className="req">*</span></label>
                                    <input className="iq-input" value={form.lastName} onChange={set('lastName')} placeholder="Customer Last Name" />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Phone <span className="req">*</span></label>
                                    <input className="iq-input" value={form.phone} onChange={set('phone')} placeholder="(516) 000-0000" />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Email</label>
                                    <input className="iq-input" value={form.email} onChange={set('email')} placeholder="customer@email.com" />
                                </div>
                                <div className="iq-field full">
                                    <label className="iq-label">Business Name {isCommercial && <span className="req">*</span>}</label>
                                    <input className="iq-input" value={form.businessName} onChange={set('businessName')} placeholder="Acme Corp (Required for Commercial)" />
                                </div>
                                <div className="iq-field full">
                                    <label className="iq-label">Street Address</label>
                                    <input className="iq-input" value={form.address} onChange={set('address')} placeholder="123 Main St" />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">City</label>
                                    <input className="iq-input" value={form.city} onChange={set('city')} placeholder="Central Islip" />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">ZIP Code <span className="req">*</span></label>
                                    <input className="iq-input" value={form.zipCode} onChange={set('zipCode')} maxLength={5} />
                                </div>
                            </div>
                        </div>
                    )}

                    {isFieldMode && (
                        <div className="iq-field-header">
                            <h2>Field Adjustment Mode</h2>
                            <p>Adjusting quote for: <strong>{form.firstName || 'Unknown'} {form.lastName}</strong></p>
                        </div>
                    )}

                    <div className="iq-section">
                        <h2 className="iq-section-title"><Calculator size={16} /> Service Configuration</h2>
                        <div className="iq-grid-3">
                            <div className="iq-field">
                                <label className="iq-label">Service Category</label>
                                <select className="iq-select" value={form.cleaningType} onChange={set('cleaningType')}>
                                    <option value="standard">Residential Standard</option>
                                    <option value="deep">Residential Deep</option>
                                    <option value="moveOut">Residential Move-In/Out</option>
                                    <option value="postConstruction">Post-Construction</option>
                                    <option value="airbnbTurnover">Airbnb Turnover</option>
                                    <option value="commercial">Commercial / Office</option>
                                </select>
                            </div>
                            <div className="iq-field">
                                <label className="iq-label">Pricing Level (Multiplier)</label>
                                <select className="iq-select" value={form.pricingTier} onChange={set('pricingTier')}>
                                    <option value="high">High (100% Rate)</option>
                                    <option value="medium">Medium (85% Discounted)</option>
                                    <option value="low">Low (70% Budget)</option>
                                </select>
                            </div>
                            {!isCommercial ? (
                                <div className="iq-field">
                                    <label className="iq-label">Frequency</label>
                                    <select className="iq-select" value={form.frequency} onChange={set('frequency')}>
                                        <option value="oneTime">One-Time Service</option>
                                        <option value="weekly">Weekly (15% Savings)</option>
                                        <option value="biweekly">Bi-Weekly (10% Savings)</option>
                                        <option value="monthly">Monthly (5% Savings)</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="iq-field">
                                    <label className="iq-label">Property Type</label>
                                    <select className="iq-select" value={form.commercialPropertyType} onChange={set('commercialPropertyType')}>
                                        <option value="office">Office Space</option>
                                        <option value="medical">Medical Facility</option>
                                        <option value="retail">Retail / Storefront</option>
                                        <option value="warehouse">Warehouse / Industrial</option>
                                        <option value="gym">Gym / Fitness</option>
                                        <option value="restaurant">Restaurant / F&B</option>
                                        <option value="school">School / Daycare</option>
                                        <option value="other">Other Commercial</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {isCommercial ? (
                            <div className="iq-grid-3 mt-16">
                                <div className="iq-field">
                                    <label className="iq-label">Visits Per Week</label>
                                    <select className="iq-select" value={form.commercialFrequency} onChange={set('commercialFrequency')}>
                                        <option value="1x">1x Per Week</option>
                                        <option value="2x">2x Per Week</option>
                                        <option value="3x">3x Per Week</option>
                                        <option value="5x">5x Per Week (Mon-Fri)</option>
                                        <option value="custom">Custom / One-Time</option>
                                    </select>
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Facility Size (SQFT)</label>
                                    <input type="number" className="iq-input" value={form.sqft} onChange={set('sqft')} step={500} />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Initial Condition</label>
                                    <select className="iq-select" value={form.commercialCondition} onChange={set('commercialCondition')}>
                                        <option value="average">Average Maintenance</option>
                                        <option value="light">Light (Clean)</option>
                                        <option value="heavy">Heavy (Overdue)</option>
                                        <option value="deep">Initial Deep Clean Needed</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="iq-grid-3 mt-16">
                                <div className="iq-field">
                                    <label className="iq-label">Bedrooms</label>
                                    <input type="number" className="iq-input" value={form.bedrooms} onChange={set('bedrooms')} min={0} />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Bathrooms</label>
                                    <input type="number" className="iq-input" value={form.bathrooms} onChange={set('bathrooms')} step={0.5} min={0} />
                                </div>
                                <div className="iq-field">
                                    <label className="iq-label">Home Size (SQFT)</label>
                                    <input type="number" className="iq-input" value={form.sqft} onChange={set('sqft')} step={100} />
                                </div>
                            </div>
                        )}

                        {!isCommercial ? (
                            <>
                                <div className="iq-pricing-toggles mt-16">
                                    <label className={form.useHourlyPricing ? 'active' : ''}>
                                        <input type="checkbox" checked={form.useHourlyPricing} onChange={() => togglePricingMode('hourly')} />
                                        Override: Custom Hourly Rate
                                    </label>
                                    <label className={form.useSqftPricing ? 'active' : ''}>
                                        <input type="checkbox" checked={form.useSqftPricing} onChange={() => togglePricingMode('sqft')} />
                                        Override: Custom SQFT Rate
                                    </label>
                                </div>

                                {form.useHourlyPricing && (
                                    <div className="iq-grid-2 iq-override-card mt-12">
                                        <div className="iq-field">
                                            <label className="iq-label">Estimated Hours</label>
                                            <input type="number" className="iq-input" value={form.estimatedHours} onChange={set('estimatedHours')} step={0.5} min={0.5} />
                                        </div>
                                        <div className="iq-field">
                                            <label className="iq-label">Hourly Rate ($)</label>
                                            <input type="number" className="iq-input" value={form.hourlyRate} onChange={set('hourlyRate')} min={10} />
                                        </div>
                                    </div>
                                )}

                                {form.useSqftPricing && (
                                    <div className="iq-grid-2 iq-override-card mt-12">
                                        <div className="iq-field">
                                            <label className="iq-label">Rate per SQFT ($)</label>
                                            <input type="number" className="iq-input" value={form.ratePerSqft} onChange={set('ratePerSqft')} step={0.01} min={0.01} />
                                        </div>
                                        <div className="iq-field iq-summary-info">
                                            Calculation uses the 'Home Size (SQFT)' field from above.
                                        </div>
                                    </div>
                                )}

                                <label className="iq-label mt-20 block">Add-on Services</label>
                                <div className="iq-addon-grid">
                                    {ADDON_META_INTERNAL.map(addon => (
                                        <div 
                                            key={addon.key} 
                                            className={`iq-addon-chip ${form.addons.includes(addon.key) ? 'selected' : ''}`}
                                            onClick={() => toggleAddon(addon.key)}
                                        >
                                            <span>{addon.icon} {addon.label}</span>
                                            <span className="chip-price">+${addon.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <label className="iq-label mt-20 block">Specific Scope Additions</label>
                                <div className="iq-addon-grid">
                                    {[
                                        { key: 'windowCleaning', label: 'Window Cleaning', icon: '🪟' },
                                        { key: 'carpetCleaning', label: 'Carpet Cleaning', icon: '🧹' },
                                        { key: 'floorBuffing', label: 'Floor Buffing', icon: '✨' },
                                        { key: 'disinfection', label: 'Electrostatic Disinfection', icon: '🛡️' },
                                    ].map(item => (
                                        <div 
                                            key={item.key} 
                                            className={`iq-addon-chip ${form.commercialScope.includes(item.key) ? 'selected' : ''}`}
                                            onClick={() => {
                                                const newScope = form.commercialScope.includes(item.key)
                                                    ? form.commercialScope.filter(k => k !== item.key)
                                                    : [...form.commercialScope, item.key];
                                                setForm(f => ({ ...f, commercialScope: newScope }));
                                            }}
                                        >
                                            <span>{item.icon} {item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="iq-section override-section">
                        <h2 className="iq-section-title"><Calendar size={16} /> Scheduling & Overrides</h2>
                        <div className="iq-grid-2">
                            <div className="iq-field">
                                <label className="iq-label">Preferred Date</label>
                                <input type="date" className="iq-input" value={form.preferredDate} onChange={set('preferredDate')} />
                                {totals.rushFee > 0 && !totals.overrideLabel && (
                                    <div className="iq-rush-warning">
                                        <AlertTriangle size={14} />
                                        <span>Rush Booking: +${totals.rushFee} fee applied.</span>
                                    </div>
                                )}
                                {totals.overrideLabel && (
                                    <div className="iq-rush-bypassed">
                                        <ShieldCheck size={14} className="mr-6" />
                                        <span>Override Active: System restrictions bypassed.</span>
                                    </div>
                                )}
                            </div>
                            <div className="iq-field">
                                <label className="iq-label">Admin Override Code</label>
                                <input className="iq-input override-input" value={form.overrideCode} onChange={set('overrideCode')} placeholder="ENTER CODE" />
                                {form.overrideCode && (
                                    <div className={`iq-override-status ${ADMIN_OVERRIDE_CODES[form.overrideCode.toUpperCase()] ? 'valid' : 'invalid'}`}>
                                        {ADMIN_OVERRIDE_CODES[form.overrideCode.toUpperCase()] 
                                            ? `✓ Valid: ${ADMIN_OVERRIDE_CODES[form.overrideCode.toUpperCase()].label}` 
                                            : '✗ Invalid Code'}
                                    </div>
                                )}
                            </div>
                            <div className="iq-field">
                                <label className="iq-label">Customer Coupon</label>
                                <input className="iq-input" value={form.couponCode} onChange={set('couponCode')} placeholder="e.g. SPRING40" />
                                {form.couponCode && (
                                    <div className={`iq-coupon-status ${CUSTOMER_COUPONS[form.couponCode.toUpperCase()] ? 'valid' : 'invalid'}`}>
                                        {CUSTOMER_COUPONS[form.couponCode.toUpperCase()] 
                                            ? `✓ Applied: ${CUSTOMER_COUPONS[form.couponCode.toUpperCase()].label}` 
                                            : '✗ Unknown Coupon'}
                                    </div>
                                )}
                            </div>
                            <div className="iq-field">
                                <label className="iq-label">Quoted By</label>
                                <select className="iq-select" value={form.quotedBy} onChange={set('quotedBy')}>
                                    {STAFF_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {form.quotedBy === 'Other' && (
                                    <div className="iq-other-staff">
                                        <input className="iq-input" value={form.otherStaff} onChange={set('otherStaff')} placeholder="Enter Name" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="iq-section">
                        <h2 className="iq-section-title"><Info size={16} /> Notes & Access</h2>
                        <div className="iq-grid-2">
                            <div className="iq-field">
                                <label className="iq-label">Access Instructions</label>
                                <textarea className="iq-textarea" value={form.accessInstructions} onChange={set('accessInstructions')} placeholder="Hidden key, door code, etc." />
                            </div>
                            <div className="iq-field">
                                <label className="iq-label">Internal VA Notes (Private)</label>
                                <textarea className="iq-textarea" value={form.internalVANotes} onChange={set('internalVANotes')} placeholder="Staff only: client temperament, special request, etc." />
                            </div>
                        </div>
                    </div>

                    <div className="iq-reset-row">
                        <button className="iq-reset-btn" onClick={() => { if(window.confirm('Reset everything?')) setForm(INITIAL_FORM); }}>RESET FORM</button>
                    </div>

                </div>

                <aside className="iq-summary-sticky">
                    <div className="iq-summary">
                        <div className="iq-summary-header">
                            <h3>{isCommercial ? 'Commercial Estimate' : 'Residential Quote'}</h3>
                            <div className="iq-summary-customer">
                                {isCommercial 
                                    ? (form.businessName || 'New Business')
                                    : (form.firstName || form.lastName ? `${form.firstName} ${form.lastName}` : 'New Customer')}
                            </div>
                            {form.internalQuoteId && (
                                <div className="iq-summary-id">
                                    ID: {form.internalQuoteId}
                                </div>
                            )}
                        </div>
                        
                        <div className="iq-summary-title">
                            <div className="flex items-center gap-8">
                                <Calculator size={20} />
                                <h3>Quote Summary</h3>
                            </div>
                            <div className="iq-load-quote-box">
                                <input 
                                    type="text" 
                                    placeholder="Load by ID..." 
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLoadQuote()}
                                    className="iq-search-input"
                                />
                                <button 
                                    onClick={handleLoadQuote} 
                                    disabled={isLoadingQuote || !searchId}
                                    className="iq-search-btn"
                                >
                                    {isLoadingQuote ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="iq-summary-body">
                            {isCommercial ? (
                                <>
                                    <div className="iq-summary-row">
                                        <span className="label">Est. Per Visit</span>
                                        <span className="value">${estimate?.perVisit?.min} - ${estimate?.perVisit?.max}</span>
                                    </div>
                                    <div className="iq-summary-row">
                                        <span className="label">Est. Monthly</span>
                                        <span className="value" style={{ fontWeight: 700, color: 'var(--iq-gold)' }}>
                                            ${estimate?.monthly?.min} - ${estimate?.monthly?.max}
                                        </span>
                                    </div>
                                    {estimate?.deepCleanFee > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Initial Deep Clean</span>
                                            <span className="value fee">+${estimate.deepCleanFee}</span>
                                        </div>
                                    )}
                                    <div className="iq-summary-row mt-8 iq-summary-info">
                                        <Info size={10} /> <span>Prices are ranges. Final proposal after walkthrough.</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {form.useHourlyPricing ? (
                                        <div className="iq-summary-row">
                                            <span className="label">Hourly Base ({form.estimatedHours}h @ ${form.hourlyRate})</span>
                                            <span className="value">${estimate?.startingCost || 0}</span>
                                        </div>
                                    ) : form.useSqftPricing ? (
                                        <div className="iq-summary-row">
                                            <span className="label">SQFT Base ({form.sqft}sqft @ ${form.ratePerSqft})</span>
                                            <span className="value">${estimate?.startingCost || 0}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="iq-summary-row">
                                                <span className="label">Starting Base Cost</span>
                                                <span className="value">${estimate?.startingCost || 0}</span>
                                            </div>
                                            {estimate?.bedroomsTotal > 0 && (
                                                <div className="iq-summary-row">
                                                    <span className="label">Bedrooms ({form.bedrooms})</span>
                                                    <span className="value">+${estimate?.bedroomsTotal}</span>
                                                </div>
                                            )}
                                            {estimate?.bathroomsTotal > 0 && (
                                                <div className="iq-summary-row">
                                                    <span className="label">Bathrooms ({form.bathrooms})</span>
                                                    <span className="value">+${estimate?.bathroomsTotal}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    
                                    {estimate?.addonsTotal > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Add-ons Total</span>
                                            <span className="value">+${estimate.addonsTotal}</span>
                                        </div>
                                    )}
                                    {estimate?.conditionFee > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Condition Adjust ({form.condition})</span>
                                            <span className="value fee">+${estimate.conditionFee}</span>
                                        </div>
                                    )}
                                    {distancePricing?.travelFee > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Travel / Route Fee</span>
                                            <span className="value fee">+${distancePricing.travelFee}</span>
                                        </div>
                                    )}
                                    {estimate?.tierDiscount > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Tier Discount ({form.pricingTier})</span>
                                            <span className="value discount">-${estimate.tierDiscount}</span>
                                        </div>
                                    )}
                                    {totals.rushFee > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Urgency Premium</span>
                                            <span className="value fee">+${totals.rushFee}</span>
                                        </div>
                                    )}
                                    {totals.discount > 0 && (
                                        <div className="iq-summary-row">
                                            <span className="label">Discounts Applied</span>
                                            <span className="value discount">-${totals.discount}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <hr className="iq-summary-divider" />

                            <div className="iq-summary-total">
                                <span className="t-label">{isCommercial ? 'TARGET VISIT PRICE' : 'TOTAL QUOTE'}</span>
                                <span>${totals.total}</span>
                            </div>

                            {!isCommercial && (
                                <div className="iq-deposit-box">
                                    <div className="iq-deposit-label">Secure Today For</div>
                                    <div className="iq-deposit-amount">${totals.deposit}</div>
                                    <div className="iq-deposit-sub">(25% Booking Deposit)</div>
                                </div>
                            )}

                            {!isCommercial && (
                                <div className="iq-balance-row">
                                    <span>Due at Completion</span>
                                    <span>${totals.balance}</span>
                                </div>
                            )}

                            {totals.overrideLabel && (
                                <div className="iq-override-flag">
                                    <ShieldCheck size={12} /> {totals.overrideLabel} ACTIVE
                                </div>
                            )}

                            {isApproved && (
                                <div className="iq-approved-flag">
                                    <CheckCircle2 size={12} /> MANUALLY APPROVED
                                </div>
                            )}
                        </div>

                        <div className="iq-actions">
                            <button 
                                className={`iq-btn iq-btn-gold ${syncStatus.status === 'syncing' ? 'loading' : ''}`} 
                                onClick={handlePushToGHL}
                                disabled={syncStatus.status === 'syncing'}
                            >
                                {syncStatus.status === 'syncing' ? (
                                    <Clock size={16} className="spin" />
                                ) : (
                                    <UserPlus size={16} />
                                )}
                                {isFieldMode ? 'UPDATE FINAL PRICE IN GHL' : 'SYNC TO CRM / GHL'}
                            </button>
                            <button 
                                className={`iq-btn iq-btn-outline ${isSaving ? 'loading' : ''}`} 
                                onClick={handleSaveDraft}
                                disabled={isSaving || syncStatus.status === 'syncing'}
                            >
                                {isSaving ? <Clock size={16} className="spin" /> : <ShieldCheck size={16} />}
                                SAVE DRAFT ONLY
                            </button>
                            {!isFieldMode && (
                                <button className="iq-btn iq-btn-primary" onClick={sendDepositLink}>
                                    <DollarSign size={16} /> SEND DEPOSIT LINK
                                </button>
                            )}
                            {isCommercial && !isFieldMode && (
                                <button className="iq-btn iq-btn-purple" onClick={handleSendProposal}>
                                    <Send size={16} /> GENERATE & SEND PROPOSAL
                                </button>
                            )}
                            <button className="iq-btn iq-btn-outline" onClick={copyQuote}>
                                <Copy size={16} /> {isFieldMode ? 'COPY FINAL TOTAL' : 'COPY SUMMARY'}
                            </button>
                            <button 
                                className={`iq-btn ${isApproved ? 'iq-btn-success' : 'iq-btn-outline'} mt-8`}
                                onClick={() => setIsApproved(!isApproved)}
                            >
                                <CheckCircle2 size={16} /> {isApproved ? 'MANUAL APPROVAL SET' : 'MARK AS APPROVED'}
                            </button>

                            {form.internalQuoteId && (
                                <div className="iq-docs-section">
                                    <hr className="iq-summary-divider" />
                                    <h4 className="iq-docs-title">Branded Documents</h4>
                                    
                                    <div className="iq-doc-row">
                                        <div className="iq-doc-info">
                                            <FileText size={14} />
                                            <span>Proposal</span>
                                            {docStatus.proposal.status === 'generated' && <CheckCircle size={12} className="text-success" />}
                                        </div>
                                        {docStatus.proposal.status === 'generating' ? (
                                            <Loader2 size={14} className="spin" />
                                        ) : docStatus.proposal.url ? (
                                            <div className="iq-doc-actions-inline">
                                                <a href={docStatus.proposal.url} target="_blank" rel="noreferrer" className="iq-doc-link">View</a>
                                                <button className="iq-doc-regen" onClick={() => handleGenerateDoc('proposal')}>Regen</button>
                                            </div>
                                        ) : (
                                            <button className="iq-doc-generate" onClick={() => handleGenerateDoc('proposal')}>Generate</button>
                                        )}
                                    </div>

                                    <div className="iq-doc-row">
                                        <div className="iq-doc-info">
                                            <FileText size={14} />
                                            <span>Agreement</span>
                                            {docStatus.agreement.status === 'generated' && <CheckCircle size={12} className="text-success" />}
                                        </div>
                                        {docStatus.agreement.status === 'generating' ? (
                                            <Loader2 size={14} className="spin" />
                                        ) : docStatus.agreement.url ? (
                                            <div className="iq-doc-actions-inline">
                                                <a href={docStatus.agreement.url} target="_blank" rel="noreferrer" className="iq-doc-link">View</a>
                                                <button className="iq-doc-regen" onClick={() => handleGenerateDoc('agreement')}>Regen</button>
                                            </div>
                                        ) : (
                                            <button className="iq-doc-generate" onClick={() => handleGenerateDoc('agreement')}>Generate</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-20 iq-footer-note">
                        <div className="iq-footer-note-content">
                            <Info size={14} />
                            <span>This is a private staff tool. Data pushed here triggers the "Internal Quote" GHL workflow.</span>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Toasts */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        className={`iq-toast ${toast.type}`}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InternalQuotePage;
