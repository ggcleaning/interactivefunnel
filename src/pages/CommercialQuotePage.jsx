import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import QuoteForm from '../components/QuoteForm';
import { BUSINESS } from '../data/config';
import './CommercialQuotePage.css';

const CommercialQuotePage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="commercial-quote-page">
            <Helmet>
                <title>Commercial Cleaning Quote | G&G Cleaning Services Long Island</title>
                <meta name="description" content="Get a professional commercial cleaning estimate for your office, medical facility, or retail space in Long Island. G&G Cleaning offers tailored facility solutions in Nassau and Suffolk County." />
            </Helmet>

            <div className="cqp-header">
                <div className="cqp-container">
                    <span className="cqp-badge">B2B Facility Solutions</span>
                    <h1>Request a Commercial Service Proposal</h1>
                    <p>Tell us about your facility and cleaning needs. A G&G cleaning consultant will reach out within 1 business hour to schedule a physical walkthrough and provide a tailored proposal.</p>
                </div>
            </div>

            <div className="cqp-form-section">
                <QuoteForm />
            </div>

            <div className="cqp-footer-info">
                <div className="cqp-container">
                    <div className="cqp-info-grid">
                        <div className="cqp-info-item">
                            <h3>Walkthrough-First Approach</h3>
                            <p>For commercial contracts, we always perform a physical walkthrough to ensure our proposal matches your facility's unique operational needs.</p>
                        </div>
                        <div className="cqp-info-item">
                            <h3>Flexible Invoicing</h3>
                            <p>We provide standard Net-30 billing for corporate clients and property managers with easy online payment options.</p>
                        </div>
                        <div className="cqp-info-item">
                            <h3>Licensed & Insured</h3>
                            <p>G&G is fully licensed, bonded, and insured to operate in all commercial environments across Long Island.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommercialQuotePage;
