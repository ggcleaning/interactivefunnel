import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUSINESS } from '../data/config';
import './PrivacyPolicy.css'; // We'll need a bit of CSS for the modal

const PrivacyPolicy = ({ isOpen, onClose }) => {
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
                            <h2>Privacy Policy</h2>
                            <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

                            <section>
                                <h3>1. Introduction</h3>
                                <p>G&G Cleaning Services ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and tell you about your privacy rights.</p>
                            </section>

                            <section>
                                <h3>2. Information We Collect</h3>
                                <p>We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                                <ul>
                                    <li><strong>Identity Data:</strong> First name, last name.</li>
                                    <li><strong>Contact Data:</strong> Email address, telephone number, service address.</li>
                                    <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting and location.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>3. How We Use Your Data</h3>
                                <p>We will only use your personal data for the purpose for which we collected it, which includes:</p>
                                <ul>
                                    <li>To provide you with a quote for our services.</li>
                                    <li>To schedule and perform cleaning services.</li>
                                    <li>To communicate with you about your appointment.</li>
                                    <li>To improve our website and services.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>4. SMS and Text Messaging (10DLC Compliance)</h3>
                                <p>By providing your phone number and opting in, you consent to receive SMS and MMS messages from G&G Cleaning Services. We use this information to send appointment reminders, service updates, and occasional promotional offers.</p>
                                <p><strong>Data Sharing:</strong> No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</p>
                                <p><strong>Opt-Out:</strong> You may opt-out of receiving SMS communications at any time by replying "STOP" to our messages. Message and data rates may apply.</p>
                            </section>

                            <section>
                                <h3>5. Data Security</h3>
                                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We do not sell your personal data to third parties.</p>
                            </section>

                            <section>
                                <h3>6. Contact Us</h3>
                                <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
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

export default PrivacyPolicy;
