import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { sendToCRM } from '../utils/crm';
import { generateRequestId, generateLeadId } from '../utils/idGenerator';
import { trackConversion } from '../utils/metaTracking';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        serviceNeeded: 'Residential Cleaning',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [requestId] = useState(() => generateRequestId());

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status === 'sending') return;

        setStatus('sending');

        try {
            // Fire browser-side Meta Lead event
            const tracking = trackConversion('Lead', {
                content_name: formData.serviceNeeded,
                value: 180,
                currency: 'USD'
            });

            // Send to durable persistence via sendToCRM
            const result = await sendToCRM({
                name: formData.name,
                firstName: formData.name.split(' ')[0] || formData.name,
                lastName: formData.name.split(' ').slice(1).join(' ') || '',
                email: formData.email,
                source: 'contact_form',
                event_type: 'contact_inquiry',
                lead_stage: 'Contact Form Inquiry',
                serviceType: formData.serviceNeeded,
                notes: formData.message,
                lead_id: generateLeadId(),
                request_id: requestId,
                meta_event_id: tracking.event_id,
                fbp: tracking.fbp,
                fbc: tracking.fbc,
                page_url: typeof window !== 'undefined' ? window.location.href : '',
                tags: ['Contact-Form', 'Website-Inquiry'],
                skipMetaLead: true // Meta pixel already fired above
            }, 'contact_inquiry');

            if (result.success) {
                setStatus('success');
                setFormData({ name: '', email: '', serviceNeeded: 'Residential Cleaning', message: '' });
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error('[Contact] Submission error:', err);
            setStatus('error');
        }
    };

    return (
        <section className="contact-section" id="contact">
            <div className="contact-container">
                <div className="contact-info">
                    <h2>Ready for a <br /><span className="text-gradient">Spotless Shine?</span></h2>
                    <p style={{ color: '#94a3b8' }}>Get a free quote today. We are available for one-time deep cleans or recurring maintenance.</p>

                    <div className="contact-details">
                        <div className="contact-item">
                            <Phone color="var(--color-secondary)" />
                            <span>(631) 206-8065</span>
                        </div>
                        <div className="contact-item">
                            <Mail color="var(--color-secondary)" />
                            <span>gandgcleaningservicesLI@gmail.com</span>
                        </div>
                        <div className="contact-item">
                            <MapPin color="var(--color-secondary)" />
                            <span>Serving the Greater Long Island Area</span>
                        </div>
                    </div>
                </div>

                {status === 'success' ? (
                    <div className="contact-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
                        <CheckCircle size={48} color="var(--color-secondary)" />
                        <h3 style={{ color: '#fff' }}>Thank you!</h3>
                        <p style={{ color: '#94a3b8' }}>We&apos;ve received your message and will get back to you within 24 hours.</p>
                        <button 
                            className="btn-primary" 
                            onClick={() => setStatus('idle')}
                            style={{ marginTop: '8px' }}
                        >
                            Send Another Message
                        </button>
                    </div>
                ) : (
                    <form className="contact-form" onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '12px' }}>
                                <AlertTriangle size={18} color="#ef4444" />
                                <span style={{ color: '#ef4444', fontSize: '14px' }}>Something went wrong. Please try again or call us directly.</span>
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input 
                                type="text" 
                                name="name"
                                className="form-input" 
                                placeholder="Your Name" 
                                value={formData.name}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input 
                                type="email" 
                                name="email"
                                className="form-input" 
                                placeholder="your@email.com" 
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Service Needed</label>
                            <select 
                                name="serviceNeeded"
                                className="form-input"
                                value={formData.serviceNeeded}
                                onChange={handleChange}
                            >
                                <option>Residential Cleaning</option>
                                <option>Commercial Cleaning</option>
                                <option>Move-In / Move-Out</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Message</label>
                            <textarea 
                                name="message"
                                className="form-textarea" 
                                placeholder="Tell us about your space..." 
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={status === 'sending'}
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            {status === 'sending' ? 'Sending...' : 'Send Message'} <Send size={16} />
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};

export default Contact;
