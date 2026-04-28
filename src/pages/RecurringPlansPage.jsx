import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import PlanCompareModal from '../components/PlanCompareModal';
import { BUSINESS, RECURRING_PLANS, SAVINGS_PERKS, PLAN_NOTES } from '../data/config';
import './RecurringPlansPage.css';


const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const RecurringPlansPage = ({ onOpenEstimate }) => {
  const [showCompare, setShowCompare] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    document.title = 'Recurring Cleaning Services Long Island | GG Cleaning';
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    onOpenEstimate();
  };

  return (
    <div className="plans-page">
      <Helmet>
        <title>Recurring Cleaning Plans Long Island | GG Cleaning Services</title>
        <meta name="description" content="Save on monthly house cleaning in Nassau and Suffolk County. Our recurring plans offer the best value for busy Long Island homeowners." />
      </Helmet>
      <HeroTemplate
        badge="Recurring Membership Plans"
        headline={<>Recurring Cleaning Plans<br />for <em>Long Island Homes</em></>}
        subheadline="Stop thinking about cleaning. Our recurring plans keep your home consistently spotless, with better pricing, priority scheduling, and the same trusted crew on every visit."
        primaryCta={{ label: 'Start My Plan', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'Get an Estimate', onClick: onOpenEstimate }}
        variant="dark"
        bgImage="/images/heroes/plans-hero.png"
      />

      <TrustBar items={BUSINESS.trustBadges} variant="dark" />

      {/* WHY RECURRING */}
      <section className="rp-section">
        <div className="rp-container">
          <motion.div className="rp-section-header" {...fadeUp}>
            <div className="rp-label">Why Recurring</div>
            <h2>Set It, Forget It, and Come Home to Clean.</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-light)', maxWidth: 540, margin: '0 auto' }}>Recurring members get better pricing, priority scheduling, and the same trusted crew on every visit — so your home is always ready without you having to think about it.</p>
          </motion.div>
          <div className="rp-why-grid">
            {[
              { icon: '💰', title: 'Save on Every Visit', desc: 'Recurring clients automatically receive better rates than one-time bookings. The more frequently we visit, the more you save — and your rate is locked in for 12 months.' },
              { icon: '📅', title: 'Always on the Calendar', desc: 'Recurring members get priority scheduling and are never bumped — even during busy holiday weeks when everyone wants a clean home.' },
              { icon: '✨', title: 'Better Results Every Time', desc: 'A home on a regular maintenance schedule is always easier to clean. That means a more thorough result on every visit — for the same price.' },
              { icon: '🤝', title: 'A Team That Knows Your Home', desc: "You'll see the same familiar faces every visit — professionals who know your home's layout, your preferences, and your standards. No explaining things twice."},
            ].map((item, i) => (
              <motion.div key={item.title} className="rp-why-card" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="rp-why-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS GRID */}
      <section className="rp-section rp-plans-section">
        <div className="rp-container">
          <motion.div className="rp-section-header" {...fadeUp}>
            <div className="rp-label">Choose Your Plan</div>
            <h2>Recurring Cleaning Plans for Long Island Homes</h2>
            <p>
              {PLAN_NOTES.pricing} <br />
              <strong>Baseline Note:</strong> {PLAN_NOTES.operational}
            </p>
          </motion.div>
          <div className="rp-plans-grid">
            {RECURRING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                className={`rp-plan-card${plan.featured ? ' rp-plan-card--featured' : ''}`}
                {...fadeUp}
                transition={{ duration: 0.55, delay: i * 0.1 }}
              >
                {plan.tag && <div className="rp-plan-tag">{plan.tag}</div>}
                <div className="rp-plan-name">{plan.name}</div>
                <div className="rp-plan-freq">{plan.frequency}</div>
                <div className="rp-plan-price-row" style={{ marginTop: 4, marginBottom: 12 }}>
                  <span className="rp-plan-price" style={plan.featured ? { color: '#d4af37' } : { color: 'var(--color-primary)' }}>{plan.price}</span>
                  <span className="rp-plan-price-label" style={plan.featured ? { color: 'rgba(255,255,255,0.6)' } : { color: 'var(--color-text-light)' }}>{plan.priceLabel}</span>
                </div>
                <ul className="rp-plan-features">
                  {plan.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button 
                    className={`rp-plan-cta${plan.featured ? ' rp-plan-cta--gold' : ''}`}
                    onClick={() => handleSelectPlan(plan)}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    Start {plan.name} →
                  </button>
                  <button 
                    className="rp-plan-outline"
                    onClick={() => setShowCompare(true)}
                    style={{ background: 'transparent', cursor: 'pointer' }}
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

      {/* SAVINGS & PERKS */}
      <section className="rp-section rp-perks-section">
        <div className="rp-container">
          <motion.div className="rp-section-header" {...fadeUp}>
            <div className="rp-label">Member Perks</div>
            <h2>Current Savings & Member Benefits</h2>
            <p>We love rewarding long-term clients. Here's what you get as a GG recurring member.</p>
          </motion.div>
          <div className="rp-perks-grid">
            {SAVINGS_PERKS.map((perk, i) => (
              <motion.div key={perk.title} className="rp-perk-card" {...fadeUp} transition={{ duration: 0.45, delay: i * 0.08 }}>
                <div className="rp-perk-icon">{perk.icon}</div>
                <div>
                  <div className="rp-perk-title">{perk.title}</div>
                  <div className="rp-perk-desc">{perk.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ STRIP */}
      <section className="rp-faq-section">
        <div className="rp-container">
          <motion.div className="rp-section-header" {...fadeUp}>
            <div className="rp-label">Common Questions</div>
            <h2>Recurring Plan FAQs</h2>
          </motion.div>
          <div className="rp-faq-grid">
            {[
              { q: 'Is there a long-term contract?', a: 'No. Monthly plans have no long-term commitment. Cancel or adjust anytime with 48 hours notice.' },
              { q: 'What if I want to pause my plan?', a: 'We offer flexible pause options. Life happens — just contact us and we will accommodate.' },
              { q: 'Do I need a deep clean first?', a: "Most first-time recurring clients start with a deep clean to establish a clean baseline. We recommend this but it's not required." },
              { q: 'Can I upgrade my plan later?', a: 'Absolutely. You can upgrade, downgrade, or add services to your plan at any time.' },
            ].map((faq, i) => (
              <motion.div key={faq.q} className="rp-faq-item" {...fadeUp} transition={{ duration: 0.45, delay: i * 0.08 }}>
                <div className="rp-faq-q">{faq.q}</div>
                <div className="rp-faq-a">{faq.a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        headline="Ready to Start Recurring<br />Cleaning in Long Island?"
        sub="Start saving today. Get your custom quote and pick a plan that fits your home and schedule."
        primaryCta={{ label: 'Start My Plan', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'See Full Pricing', to: '/pricing' }}
        variant="dark"
      />
    </div>
  );
};

export default RecurringPlansPage;
