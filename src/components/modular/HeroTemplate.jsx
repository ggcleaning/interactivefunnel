import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './HeroTemplate.css';

/**
 * HeroTemplate — Reusable hero section for all pages.
 * Props:
 *   badge       : string
 *   headline    : string | JSX
 *   subheadline : string
 *   primaryCta  : { label, to }
 *   secondaryCta: { label, to } (optional)
 *   variant     : 'dark' | 'light' | 'gradient'  (default: 'dark')
 *   bgImage     : image url string (optional)
 */
const HeroTemplate = ({
  badge,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  commercialCta,
  variant = 'dark',
  bgImage,
  children,
}) => {
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <section
      className={`hero-template hero-template--${variant}`}
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
    >
      <div className="hero-template__overlay" />
      <div className="hero-template__inner">
        <motion.div className="hero-template__content" {...fadeUp}>
          {badge && <div className="hero-template__badge">✦ {badge}</div>}

          <h1 className="hero-template__headline">
            {typeof headline === 'string'
              ? headline.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < headline.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))
              : headline}
          </h1>

          {subheadline && (
            <p className="hero-template__sub">{subheadline}</p>
          )}

          <div className="hero-template__ctas">
            {primaryCta && (
              primaryCta.onClick ? (
                <button onClick={primaryCta.onClick} className="hero-template__cta-primary">
                  {primaryCta.label} →
                </button>
              ) : (
                <Link to={primaryCta.to} className="hero-template__cta-primary">
                  {primaryCta.label} →
                </Link>
              )
            )}
            {secondaryCta && (
              secondaryCta.onClick ? (
                <button onClick={secondaryCta.onClick} className="hero-template__cta-secondary">
                  {secondaryCta.label}
                </button>
              ) : (
                <Link to={secondaryCta.to} className="hero-template__cta-secondary">
                  {secondaryCta.label}
                </Link>
              )
            )}
            {commercialCta && (
              commercialCta.onClick ? (
                <button onClick={commercialCta.onClick} className="hero-template__cta-commercial">
                  {commercialCta.label}
                </button>
              ) : (
                <Link to={commercialCta.to} className="hero-template__cta-commercial">
                  {commercialCta.label}
                </Link>
              )
            )}
          </div>

          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroTemplate;
