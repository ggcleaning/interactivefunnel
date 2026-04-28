import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import PlanCompareModal from '../components/PlanCompareModal';
import { BUSINESS, PACKAGES, ADDONS, RECURRING_PLANS, SAVINGS_PERKS, COMMERCIAL_SERVICES, PLAN_NOTES } from '../data/config';
import './PricingPage.css';


const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const PricingPage = ({ onOpenEstimate }) => {
  const [showCompare, setShowCompare] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    document.title = 'Cleaning Service Prices Long Island | GG Cleaning';
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    onOpenEstimate();
  };

  return (
    <div className="pricing-page-v2">
      <Helmet>
        <title>House Cleaning Prices Long Island | G&G Cleaning Services</title>
        <meta name="description" content="See upfront house cleaning prices for Long Island homes. G&G Cleaning offers standard, deep, and move-out packages with no hidden fees — serving Nassau and Suffolk County." />
      </Helmet>
      <HeroTemplate
        badge="Transparent Pricing"
        headline={<>Transparent Pricing for<br /><em>Long Island Homes</em></>}
        subheadline="Our pricing is transparent, fair, and built for Long Island homes. Every package is clearly scoped — no hidden fees, no surprise charges at the end. Use the calculator below to see your exact range in under 60 seconds."
        primaryCta={{ label: 'Book Your Cleaning', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'Calculate My Price', onClick: onOpenEstimate }}
        variant="dark"
        bgImage="/images/heroes/pricing-hero.png"
      />

      {/* HOW PRICING WORKS */}
      <div className="pp-how-strip">
        <div className="pp-how-inner">
          <div className="pp-how-title">How Pricing Works<small>WHAT AFFECTS YOUR QUOTE</small></div>
          <div className="pp-how-facts">
            {[
              { title: 'Home Size', desc: 'Based on bedrooms, bathrooms & square footage' },
              { title: 'Service Type', desc: 'Standard, Deep, or Move-In/Out — each has a different scope' },
              { title: 'Frequency', desc: 'Recurring clients receive better rates than one-time bookings' },
              { title: 'Condition', desc: 'Homes needing extra attention may require additional time' },
            ].map(f => (
              <div key={f.title} className="pp-how-fact"><strong>{f.title}</strong><span>{f.desc}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* PACKAGES */}
      <section className="pp-section">
        <div className="pp-container">
          <motion.div className="pp-section-header" {...fadeUp}>
            <div className="pp-label">Our Packages</div>
            <h2>House Cleaning Packages in Long Island</h2>
            <p>Every home is different. Pick the package that fits — or customize with add-ons below. Prices reflect Nassau and Suffolk County homes.</p>
          </motion.div>
          <div className="pp-packages-grid">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                className={`pp-pkg-card${pkg.featured ? ' pp-pkg-card--featured' : ''}`}
                {...fadeUp}
                transition={{ duration: 0.55, delay: i * 0.1 }}
              >
                {pkg.tag && <div className="pp-featured-tag">{pkg.tag}</div>}
                <div className="pp-pkg-icon">{pkg.icon}</div>
                <div className="pp-pkg-name">{pkg.name}</div>
                <div className="pp-pkg-desc">{pkg.desc}</div>
                <div className="pp-pkg-price-row">
                  <span className="pp-from">Starting at</span>
                  <span className="pp-price" style={pkg.featured ? { color: '#C9A84C' } : {}}>{pkg.price}</span>
                  <span className="pp-price-note">{pkg.priceNote}</span>
                </div>
                <div className="pp-pkg-includes-label">What's Included</div>
                <ul className="pp-pkg-list">
                  {pkg.includes.map(item => <li key={item}>{item}</li>)}
                </ul>
                <div className="pp-pkg-ideal" style={pkg.featured ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.82)' } : {}}>
                  <strong style={pkg.featured ? { color: '#C9A84C' } : {}}>Ideal for:</strong> {pkg.ideal}
                </div>
                <button className="pp-pkg-cta" onClick={onOpenEstimate} style={{ width: '100%', border: 'none', cursor: 'pointer' }}>Book {pkg.name} →</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="pp-addons-section">
        <div className="pp-container">
          <motion.div className="pp-section-header" {...fadeUp}>
            <div className="pp-label">Customize Your Clean</div>
            <h2>Add-On Services</h2>
            <p>Enhance your cleaning with targeted extras — inside fridge, oven, interior windows, baseboards, and cabinet fronts. Priced clearly upfront.</p>
          </motion.div>
          <div className="pp-addons-grid">
            {ADDONS.map((a, i) => (
              <motion.div key={a.id} className="pp-addon-card" {...fadeUp} transition={{ duration: 0.45, delay: i * 0.07 }}>
                <div className="pp-addon-left">
                  <div className="pp-addon-icon">{a.icon}</div>
                  <div>
                    <div className="pp-addon-name">{a.name}</div>
                    <div className="pp-addon-note">{a.note}</div>
                  </div>
                </div>
                <div className="pp-addon-price">{a.price}</div>
              </motion.div>
            ))}
          </div>
          <p className="pp-addons-note">✦ Add-on pricing varies by home size and condition. Final price confirmed at booking.</p>
        </div>
      </section>

      {/* RECURRING PLANS */}
      <section className="pp-section pp-recurring-section">
        <div className="pp-container">
          <motion.div className="pp-section-header" {...fadeUp}>
            <div className="pp-label">Save More</div>
            <h2>Save with Recurring House Cleaning in Long Island</h2>
            <p>
              {PLAN_NOTES.pricing} <br />
              <strong>Please Note:</strong> {PLAN_NOTES.operational}
            </p>
          </motion.div>
          <div className="pp-packages-grid">
            {RECURRING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                className={`pp-pkg-card pp-recurring-card${plan.featured ? ' pp-pkg-card--featured' : ''}`}
                {...fadeUp}
                transition={{ duration: 0.55, delay: i * 0.1 }}
              >
                {plan.tag && <div className="pp-featured-tag">{plan.tag}</div>}
                <div className="pp-pkg-name">{plan.name}</div>
                <div className="pp-pkg-desc" style={{ fontWeight: 600, color: plan.featured ? 'rgba(255,255,255,0.85)' : 'var(--color-secondary, #c9a84c)', marginBottom: 4 }}>{plan.frequency}</div>
                <div className="pp-pkg-price-row" style={{ marginBottom: 12 }}>
                  <span className="pp-price" style={plan.featured ? { color: '#C9A84C' } : {}}>{plan.price}</span>
                  <span className="pp-price-note" style={plan.featured ? { color: 'rgba(255,255,255,0.6)' } : {}}>{plan.priceLabel}</span>
                </div>
                <ul className="pp-pkg-list">
                  {plan.features.map(item => <li key={item}>{item}</li>)}
                </ul>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    className="pp-pkg-cta" 
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Start My Plan →
                  </button>
                  <button 
                    className={`pp-pkg-cta-outline${plan.featured ? ' featured' : ''}`}
                    onClick={() => setShowCompare(true)}
                  >
                    Compare All Plans
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plan Compare Modal ── */}
      <PlanCompareModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        onSelectPlan={handleSelectPlan}
      />

      {/* SAVINGS & MEMBER PERKS */}
      <section className="pp-discounts-section">
        <div className="pp-container">
          <motion.div className="pp-section-header" {...fadeUp}>
            <div className="pp-label">Current Savings</div>
            <h2>Current Savings & Member Perks</h2>
            <p>We love rewarding our clients. Enjoy exclusive perks when you book or subscribe with GG.</p>
          </motion.div>
          <div className="pp-discounts-grid">
            {SAVINGS_PERKS.map((perk, i) => (
              <motion.div key={perk.title} className="pp-discount-card" {...fadeUp} transition={{ duration: 0.45, delay: i * 0.08 }}>
                <div className="pp-discount-icon">{perk.icon}</div>
                <div>
                  <div className="pp-discount-title">{perk.title}</div>
                  <div className="pp-discount-desc">{perk.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="pp-addons-note">✦ Annual plans available for best value · Final pricing confirmed based on home size and condition</p>
        </div>
      </section>

      {/* COMMERCIAL */}
      <section className="pp-commercial-section">
        <div className="pp-container">
          <motion.div className="pp-section-header" {...fadeUp}>
            <div className="pp-label">Business Cleaning</div>
            <h2>Commercial Cleaning Services</h2>
            <p>Consistent, professional cleaning for offices and businesses across Nassau & Suffolk County.</p>
          </motion.div>
          <div className="pp-commercial-grid">
            {COMMERCIAL_SERVICES.map((c, i) => (
              <motion.div key={c.id} className={`pp-comm-card${c.full ? ' pp-comm-card--full' : ''}`} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="pp-comm-icon">{c.icon}</div>
                <div className="pp-comm-name">{c.name}</div>
                <div className="pp-comm-desc">{c.desc}</div>
                {c.priceNote && <div className="pp-comm-price-note">{c.priceNote}</div>}
                <ul className="pp-comm-list">
                  {c.items.map(item => <li key={item}>{item}</li>)}
                </ul>
                <Link to="/commercial" className="pp-comm-cta">
                  {c.full ? 'Request a Custom Quote →' : `Get ${c.name.split(' ')[0]} Quote →`}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <TrustBar items={BUSINESS.trustBadges} variant="dark" />

      <CTABanner
        headline="Ready to Book a Cleaning<br />in Long Island?"
        sub="Get your free, no-obligation quote today. We'll confirm your price and schedule within 1 business hour."
        primaryCta={{ label: 'Book Your Cleaning', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'Get a Free Quote', onClick: onOpenEstimate }}
        variant="dark"
      />
    </div>
  );
};

export default PricingPage;
