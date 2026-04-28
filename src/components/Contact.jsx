import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Thank you! We will get back to you shortly.');
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
                            <span>(555) 123-4567</span>
                        </div>
                        <div className="contact-item">
                            <Mail color="var(--color-secondary)" />
                            <span>info@ggcleaning.com</span>
                        </div>
                        <div className="contact-item">
                            <MapPin color="var(--color-secondary)" />
                            <span>Serving the Greater Metro Area</span>
                        </div>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-input" placeholder="Your Name" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" placeholder="your@email.com" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Service Needed</label>
                        <select className="form-input">
                            <option>Residential Cleaning</option>
                            <option>Commercial Cleaning</option>
                            <option>Move-In / Move-Out</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Message</label>
                        <textarea className="form-textarea" placeholder="Tell us about your space..." required></textarea>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        Send Message <Send size={16} />
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Contact;
