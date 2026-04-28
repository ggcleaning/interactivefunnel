import React from 'react';
import { Home, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './Services.css';

const Services = ({ onOpenEstimate }) => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <section className="services-section" id="services">
            <div className="section-header">
                <span className="section-sub">Our Expertise</span>
                <h2 className="section-title">Cleaning Solutions for Every Space</h2>
                <p className="section-desc">Whether it's your family home or corporate office, we deliver the same level of excellence and care.</p>
            </div>

            <motion.div
                className="services-grid"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
            >
                {/* Residential Card */}
                <motion.div variants={item} className="service-card residential">
                    <div className="card-icon-wrapper">
                        <Home size={32} color="var(--color-primary)" />
                    </div>
                    <h3>Residential Cleaning</h3>
                    <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
                        Reclaim your weekends. We handle the dirty work so you can come home to a sparkling, stress-free environment.
                    </p>
                    <div className="service-features">
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Recurring Maintenance (Weekly/Bi-weekly)</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Deep Cleaning & Sanitization</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Move-In / Move-Out Service</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Eco-Friendly Products Available</span>
                        </div>
                    </div>
                    <div className="service-cta">
                        <button onClick={onOpenEstimate} className="service-link" style={{ width: '100%', justifyContent: 'center', background: 'none', border: '1px solid var(--color-primary)', borderRadius: '8px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: '600' }}>
                           Get Instant Quote <ArrowRight size={16} />
                        </button>
                    </div>
                </motion.div>

                {/* Commercial Card */}
                <motion.div variants={item} className="service-card commercial">
                    <div className="card-icon-wrapper">
                        <Building2 size={32} color="var(--color-primary)" />
                    </div>
                    <h3>Commercial Cleaning</h3>
                    <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
                        Make a lasting impression on clients and boost employee morale with a consistently spotless workplace.
                    </p>
                    <div className="service-features">
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Office Complexes & Retail</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Common Area Maintenance</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Restroom Sanitization</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={18} className="feature-icon" />
                            <span>Custom Recurring Contracts</span>
                        </div>
                    </div>
                    <div className="service-cta">
                        <a href="#contact" className="service-link" style={{ width: '100%', justifyContent: 'center' }}>Request Commercial Quote <ArrowRight size={16} /></a>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default Services;
