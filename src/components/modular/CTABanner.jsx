import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CTABanner.css';

/**
 * CTABanner — Standardized CTA section for every page.
 * Props:
 *   headline   : string
 *   sub        : string
 *   primaryCta : { label, to }
 *   secondaryCta: { label, to } (optional)
 *   variant    : 'dark' | 'gold' | 'light' (default: 'dark')
 */
const CTABanner = ({
  headline = 'Ready to Get Started?',
  sub = 'Get your free, no-obligation quote today.',
  primaryCta = { label: 'Book Your Cleaning Today', to: '/quote' },
  secondaryCta,
  commercialCta,
  variant = 'dark',
}) => (
  <section className={`cta-banner cta-banner--${variant}`}>
    <motion.div
      className="cta-banner__inner"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <h2 className="cta-banner__headline" dangerouslySetInnerHTML={{ __html: headline }} />
      <p className="cta-banner__sub">{sub}</p>
      <div className="cta-banner__btns">
        {primaryCta.onClick ? (
          <button onClick={primaryCta.onClick} className="cta-banner__btn-primary">
            {primaryCta.label} →
          </button>
        ) : (
          <Link to={primaryCta.to} className="cta-banner__btn-primary">
            {primaryCta.label} →
          </Link>
        )}
        {secondaryCta && (
          secondaryCta.onClick ? (
            <button onClick={secondaryCta.onClick} className="cta-banner__btn-secondary">
              {secondaryCta.label}
            </button>
          ) : (
            <Link to={secondaryCta.to} className="cta-banner__btn-secondary">
              {secondaryCta.label}
            </Link>
          )
        )}
        {commercialCta && (
          commercialCta.onClick ? (
            <button onClick={commercialCta.onClick} className="cta-banner__btn-commercial">
              {commercialCta.label}
            </button>
          ) : (
            <Link to={commercialCta.to} className="cta-banner__btn-commercial">
              {commercialCta.label}
            </Link>
          )
        )}
      </div>
    </motion.div>
  </section>
);

export default CTABanner;
