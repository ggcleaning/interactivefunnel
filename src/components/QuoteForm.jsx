import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { BUSINESS } from '../data/config';
import { sendToCRM } from '../utils/crm';
import { trackConversion } from '../utils/metaTracking';
import './Contact.css';

const QuoteForm = () => {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        serviceType: 'Residential Standard Clean',
        zipCode: '',
        notes: '',
        companyName: '',
        position: '',
        marketingOptIn: true
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // EmailJS configuration
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            // Check if environment variables are set and log them for debugging (obfuscated)
            if (!serviceId || !templateId || !publicKey) {
                const missing = [];
                if (!serviceId) missing.push('Service ID');
                if (!templateId) missing.push('Template ID');
                if (!publicKey) missing.push('Public Key');
                throw new Error(`Email service missing config: ${missing.join(', ')}. Please check Netlify environment variables.`);
            }

            // 1. Sync to CRM (GHL) with specific tagging
            const source = sessionStorage.getItem('lead_source') || 'organic';
            const audience = sessionStorage.getItem('lead_audience');
            const campaign = sessionStorage.getItem('lead_campaign');
            const adSet = sessionStorage.getItem('lead_ad_set');
            const content = sessionStorage.getItem('lead_content');

            const tags = formData.serviceType.toLowerCase().includes('commercial') 
                ? ['commercialclient', 'Quote-Request'] 
                : ['residentialclient', 'Quote-Request'];
            
            if (source === 'facebook') tags.push('fb-ad-funnel');

            // Audience-specific tagging
            if (audience === 'airbnb') {
                tags.push('airbnb-ads-funnel');
            } else if (audience === 'investor' || audience === 'property-manager') {
                tags.push('property-manager-funnel');
            }

            // Fire pixel + capture dedup metadata (event_id, fbp, fbc)
            const metaData = trackConversion('Lead', {
                content_category: 'Manual Quote Request',
                content_name: formData.serviceType,
                value: 180 // Baseline quote value
            });

            try {
                await sendToCRM({
                    ...formData,
                    name: `${formData.firstName} ${formData.lastName}`,
                    status: 'Quote Request / Web Form',
                    source: source,
                    audience: audience,
                    utm_campaign: campaign,
                    ad_set: adSet,
                    utm_content: content,
                    location_id: 'D5WYnc5CK01FskhJtW3W',
                    marketing_opt_in: formData.marketingOptIn,
                    tags: tags,
                    // CAPI deduplication fields
                    ...metaData
                }, 'lead_capture');
            } catch (crmErr) {
                console.warn('CRM sync failed, continuing with email:', crmErr);
            }

            // 2. Send email using EmailJS
            const emailResult = await emailjs.send(
                serviceId,
                templateId,
                {
                    from_name: `${formData.firstName} ${formData.lastName}`,
                    from_email: formData.email,
                    phone: formData.phone,
                    service_type: formData.serviceType,
                    zip_code: formData.zipCode,
                    notes: formData.notes,
                    company_name: formData.companyName,
                    position: formData.position,
                    to_name: BUSINESS.name
                },
                publicKey
            );

            console.log('Email sent successfully:', emailResult.status, emailResult.text);

            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                companyName: '',
                position: '',
                serviceType: 'Residential Standard Clean',
                zipCode: '',
                notes: ''
            });

            setSubmitted(true);
            
            // Redirect to success page as the primary action
            setTimeout(() => {
                navigate('/quote-confirmed', { 
                    state: { 
                        form: formData,
                        isCommercial: formData.serviceType?.toLowerCase().includes('commercial')
                    } 
                });
            }, 1500);

        } catch (err) {
            console.error('Submission error:', err);
            
            // Detailed error logging to help identify why EmailJS is failing
            if (err.text) console.error('EmailJS Error Text:', err.text);
            if (err.status) console.error('EmailJS Status:', err.status);

            // Enhanced error message for the user
            const displayError = err.text === 'The user_id parameter is required' || err.status === 400
                ? `Configuration Error: Please ensure EmailJS Public Key is set correctly in your Netlify dashboard.`
                : (err.text || err.message || `Failed to send request. Please call us directly at ${BUSINESS.phone}.`);
            
            setError(displayError);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <section className="contact-section" id="contact">
                <div className="contact-container" style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="contact-form" style={{ maxWidth: '600px', textAlign: 'center', padding: '4rem 2rem' }}>
                        <CheckCircle2 size={64} color="var(--color-accent)" style={{ margin: '0 auto 1.5rem' }} />
                        <h2>Request Received!</h2>
                        <p>Thank you. A member of our team will contact you shortly to confirm details and provide your quote.</p>
                        <button onClick={() => setSubmitted(false)} className="btn-outline" style={{ marginTop: '2rem' }}>Send Another Request</button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="contact-section" id="contact" aria-labelledby="quote-heading">
            <div className="contact-container">
                <div className="contact-info">
                    <span className="section-sub">Get Started</span>
                    <h2 id="quote-heading">Ready for a Spotless Space?</h2>
                    <p style={{ marginBottom: '2rem' }}>
                        Fill out the form to get a free, no-obligation quote. For immediate assistance, please call us directly.
                    </p>

                    <div className="contact-details">
                        <div className="contact-item">
                            <div style={{ background: 'var(--color-bg-alt)', padding: '12px', borderRadius: '50%' }}>
                                <MapPin color="var(--color-secondary)" />
                            </div>
                            <div>
                                <strong>Service Area</strong>
                                <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-text-light)' }}>All of Nassau & Suffolk County</p>
                            </div>
                        </div>
                        <div className="contact-item">
                            <div style={{ background: 'var(--color-bg-alt)', padding: '12px', borderRadius: '50%' }}>
                                <Calendar color="var(--color-secondary)" />
                            </div>
                            <div>
                                <strong>Availability</strong>
                                <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-text-light)' }}>Mon - Sat: 7am - 6pm</p>
                            </div>
                        </div>
                        <div className="contact-item">
                            <div style={{ background: 'var(--color-bg-alt)', padding: '12px', borderRadius: '50%' }}>
                                <Send color="var(--color-secondary)" />
                            </div>
                            <div>
                                <strong>Contact Directly</strong>
                                <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-text-light)' }}>
                                    {BUSINESS.phone} <br />
                                    {BUSINESS.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <h3>Free Quote Request</h3>

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            color: '#c33'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label htmlFor="firstName" className="form-label">First Name</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                className="form-input"
                                required
                                placeholder="John"
                                aria-required="true"
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName" className="form-label">Last Name</label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                className="form-input"
                                required
                                placeholder="Doe"
                                aria-required="true"
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-input"
                            required
                            placeholder="john@example.com"
                            aria-required="true"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">Phone Number</label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            className="form-input"
                            required
                            placeholder="(555) 555-5555"
                            aria-required="true"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label htmlFor="serviceType" className="form-label">Service Type</label>
                            <select
                                id="serviceType"
                                name="serviceType"
                                className="form-input"
                                aria-label="Select service type"
                                value={formData.serviceType}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option>Residential Standard Clean</option>
                                <option>Residential Deep Clean</option>
                                <option>Move-In / Move-Out</option>
                                <option>Commercial Office</option>
                                <option>Post-Construction</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="zipCode" className="form-label">Zip Code</label>
                            <input
                                id="zipCode"
                                name="zipCode"
                                type="text"
                                className="form-input"
                                required
                                placeholder="11530"
                                aria-required="true"
                                value={formData.zipCode}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {(formData.serviceType.includes('Commercial') || formData.serviceType.includes('Post-Construction')) && (
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label htmlFor="companyName" className="form-label">Business or Company Name *</label>
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Acme Corp"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="position" className="form-label">Your Position *</label>
                                <select
                                    id="position"
                                    name="position"
                                    className="form-input"
                                    required
                                    value={formData.position}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="">Select Position</option>
                                    <option value="Owner">Owner</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Facility Manager">Facility Manager</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="ew-label" htmlFor="notes">Notes or Special Requirements (Optional)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="ew-input"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Tell us more about your space or share your preferred cleaning time..."
                            style={{ minHeight: '100px', resize: 'vertical' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                        <label 
                            className="ew-checkbox-container" 
                            style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                alignItems: 'flex-start', 
                                cursor: 'pointer',
                                padding: '10px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px'
                            }}
                        >
                            <input 
                                type="checkbox" 
                                name="marketingOptIn"
                                style={{ marginTop: '4px' }}
                                checked={formData.marketingOptIn}
                                onChange={(e) => setFormData(f => ({ ...f, marketingOptIn: e.target.checked }))}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                                I agree to receive recurring automated marketing text messages (e.g. cart reminders, special discounts) at the phone number provided. Consent is not a condition to purchase.
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Get My Free Quote'} <Send size={18} />
                    </button>

                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1rem', textAlign: 'center' }}>
                        We respect your privacy. Your information is never shared.
                    </p>
                </form>
            </div>
        </section>
    );
};

export default QuoteForm;
