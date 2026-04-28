import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import './ServiceArea.css';

const ServiceArea = () => {
    return (
        <section className="service-area-section" id="service-area">
            <div className="service-area-container">
                <motion.div
                    className="service-area-compact"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="area-header">
                        <MapPin size={28} className="area-icon" />
                        <div>
                            <h3>Service Area</h3>
                            <p>Proudly serving all of Nassau & Suffolk County, Long Island</p>
                        </div>
                    </div>

                    <div className="counties-compact">
                        <div className="county-badge nassau">
                            <MapPin size={18} />
                            <span>Nassau County</span>
                        </div>
                        <div className="county-badge suffolk">
                            <MapPin size={18} />
                            <span>Suffolk County</span>
                        </div>
                    </div>

                    <a href="#contact" className="check-availability-btn">
                        Check Your Area
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default ServiceArea;
