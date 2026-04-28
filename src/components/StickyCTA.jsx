import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './StickyCTA.css';

const StickyCTA = ({ onOpenEstimate }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsVisible(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="sticky-cta"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <a href="tel:5162988323" className="sticky-btn call-btn">
                        <Phone size={17} />
                        <span>Call Now</span>
                    </a>
                    <button className="sticky-btn quote-btn" onClick={onOpenEstimate}>
                        <span>Get Instant Estimate</span>
                        <ArrowRight size={17} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyCTA;
