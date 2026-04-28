import React from 'react';
import { motion } from 'framer-motion';
import './TrustBar.css';

/**
 * TrustBar — Portable trust signals row.
 * Props:
 *   items: Array<{ icon, title, sub }>
 *   variant: 'dark' | 'light' | 'gold'  (default: 'dark')
 */
const TrustBar = ({ items = [], variant = 'dark' }) => (
  <div className={`trust-bar trust-bar--${variant}`}>
    <div className="trust-bar__inner">
      {items.map((t) => (
        <motion.div
          key={t.title}
          className="trust-bar__item"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <div className="trust-bar__icon">{t.icon}</div>
          <div>
            <strong className="trust-bar__title">{t.title}</strong>
            <span className="trust-bar__sub">{t.sub}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default TrustBar;
