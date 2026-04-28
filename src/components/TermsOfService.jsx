import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUSINESS } from '../data/config';
import './PrivacyPolicy.css'; // Reusing the same modal styling as Privacy Policy

const TermsOfService = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="privacy-modal-overlay" onClick={onClose}>
                    <motion.div
                        className="privacy-modal-content"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                    >
                        <button className="close-btn" onClick={onClose} aria-label="Close modal">
                            <X size={24} />
                        </button>

                        <div className="privacy-content-scroll">
                            <h2>Terms of Service</h2>
                            <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

                            <section>
                                <h3>1. Agreement to Terms</h3>
                                <p>By accessing or using the services provided by {BUSINESS.name} ("we," "us," off "our"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access our website or use any services.</p>
                            </section>

                            <section>
                                <h3>2. Services Provided</h3>
                                <p>We provide residential and commercial cleaning services. The scope of work, pricing, and scheduling will be agreed upon prior to the performance of any services. We reserve the right to refuse service to anyone for any reason at any time.</p>
                            </section>

                            <section>
                                <h3>3. User Responsibilities</h3>
                                <p>You agree to provide accurate, current, and complete information when booking our services. You are responsible for ensuring a safe working environment for our cleaning staff and securing any pets prior to our arrival.</p>
                            </section>
                            
                            <section>
                                <h3>4. Cancellation and Rescheduling</h3>
                                <p>We require at least 24 hours' notice for cancellations or rescheduling. Failure to provide sufficient notice may result in a cancellation fee. Deposits paid to secure an appointment are non-refundable if cancelled within 24 hours.</p>
                            </section>

                            <section>
                                <h3>5. Payment Terms</h3>
                                <p>A deposit may be required to secure an appointment. The remaining balance is due at the time of service completion unless a contractual agreement states otherwise. We accept major credit cards and other agreed-upon forms of payment.</p>
                            </section>

                            <section>
                                <h3>6. Communications and SMS</h3>
                                <p>By providing your phone number, you consent to receive text messages sent by an automatic telephone dialing system. Consent to these terms is not a condition of purchase. Message and data rates may apply. You may opt-out of these communications at any time by replying STOP.</p>
                            </section>

                            <section>
                                <h3>7. Contact Information</h3>
                                <p>If you have any questions about these Terms of Service, please contact us at:</p>
                                <p>
                                    <strong>Email:</strong> {BUSINESS.email}<br />
                                    <strong>Phone:</strong> {BUSINESS.phone}<br />
                                    <strong>Address:</strong> {BUSINESS.address.street}, {BUSINESS.address.city}, {BUSINESS.address.state} {BUSINESS.address.zip}
                                </p>
                            </section>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TermsOfService;
