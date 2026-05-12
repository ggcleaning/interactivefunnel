import React from 'react';
import { motion } from 'framer-motion';
import { OFFERS } from '../../data/config';
import './PromoBanner.css';

const PromoBanner = ({ onOpenEstimate }) => {
  if (!OFFERS.active) return null;

  return (
    <motion.div 
      className="promo-banner"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="promo-banner-content">
        <div className="promo-message">
          <span className="promo-icon">✨</span>
          <p className="promo-text">
            <span className="promo-headline">{OFFERS.headline}</span>
            <span className="promo-sub"> — {OFFERS.subheadline}</span>
          </p>
        </div>
        <button className="promo-cta" onClick={onOpenEstimate}>
          {OFFERS.cta} <span className="arrow">→</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PromoBanner;
