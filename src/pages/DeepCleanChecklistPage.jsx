import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ShieldCheck, Clock, House, Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import FAQSection from '../components/modular/FAQSection';
import { BUSINESS, CHECKLIST, DEEP_CLEAN_FAQS } from '../data/config';
import heroBg from '../assets/hero-bg.png';
import './TownLandingPage.css';

const DeepCleanChecklistPage = ({ onOpenEstimate }) => {
  return (
    <div className="town-landing-page">
      <Helmet>
        <title>What's Included in a Professional Deep House Cleaning? | {BUSINESS.name} Long Island</title>
        <meta name="description" content="See exactly what's included in a professional deep house cleaning from G&G Cleaning. 40+ point checklist covering kitchens, bathrooms, bedrooms, and more." />
        <link rel="canonical" href={`${BUSINESS.website}/deep-cleaning-checklist`} />
      </Helmet>

      <HeroTemplate
        badge="Service Transparency"
        headline="What's Included in a Professional Deep House Cleaning?"
        subheadline="Our 40+ point checklist ensures your home gets a complete reset. We target the built-up grime, dust, and overlooked areas that standard cleanings miss."
        primaryCta={{ label: 'Get Your Instant Quote', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'View All Services', to: '/services' }}
        bgImage={heroBg}
        variant="dark"
      />

      <TrustBar items={BUSINESS.trustBadges} variant="light" />

      {/* SECTION: WHY A DEEP CLEAN */}
      <section className="town-section">
        <div className="town-container">
          <div className="town-trust-content">
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>What Is a Deep Cleaning — and Do You Really Need One?</h2>
            
            <div className="town-trust-text">
              <p>Many homeowners assume a deep clean is just a more intense regular cleaning — but a true deep clean resets your home by tackling built-up dirt, grease, soap scum, and hidden dust that standard maintenance cleanings miss entirely.</p>
              
              <p style={{ marginTop: '20px' }}><strong>A professional deep cleaning is especially valuable if:</strong></p>
              
              <ul className="cta-benefits-grid">
                <li><CheckCircle size={24} color="var(--color-secondary)" /> It's your first time hiring professional cleaners</li>
                <li><CheckCircle size={24} color="var(--color-secondary)" /> Your home hasn't had a thorough clean in 3+ months</li>
                <li><House size={24} color="var(--color-secondary)" /> You're moving in or out of a new home</li>
                <li><Sparkles size={24} color="var(--color-secondary)" /> You want a full reset before recurring service</li>
                <li><Star size={24} color="var(--color-secondary)" /> You're preparing for guests or a special event</li>
              </ul>

              <div className="service-tip glass-card" style={{ marginTop: '40px' }}>
                <Sparkles size={30} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                <div>
                  Most Long Island homeowners start with a <strong>Deep Clean</strong>, then move to <strong>Bi-Weekly Maintenance</strong> to keep their home consistently fresh without the effort.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: THE ACTUAL CHECKLIST */}
      <section className="town-section alt-bg">
        <div className="town-container">
          <h2 style={{ textAlign: 'center', marginBottom: '50px' }}>G&G Cleaning's Complete Deep Cleaning Checklist</h2>
          
          <div className="town-services-grid">
            {CHECKLIST.map((cat, i) => (
              <div key={i} className="town-service-card glass-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span> {cat.category} — {cat.count}
                </h3>
                <ul className="checklist-items">
                  {cat.items.map((item, j) => (
                    <li key={j} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '0.95rem' }}>
                      <CheckCircle size={16} color="var(--color-secondary)" style={{ marginTop: '4px', flexShrink: 0 }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: TRUST & LOCALITY */}
      <section className="town-section">
        <div className="town-container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '30px' }}>Why Long Island Trust G&G Cleaning</h2>
          <div className="trust-stack">
            <div className="trust-badge glass-card"><Star size={20} color="var(--color-secondary)" /> 5.0 Star Rated</div>
            <div className="trust-badge glass-card"><ShieldCheck size={20} color="var(--color-secondary)" /> Family-Owned Since {BUSINESS.founded}</div>
            <div className="trust-badge glass-card"><ShieldCheck size={20} color="var(--color-secondary)" /> Fully Insured & Bonded</div>
            <div className="trust-badge glass-card"><Sparkles size={20} color="var(--color-secondary)" /> Non-Toxic Products</div>
            <div className="trust-badge glass-card"><MapPin size={20} color="var(--color-secondary)" /> Same Consistent Team</div>
          </div>
        </div>
      </section>

      <FAQSection 
        items={DEEP_CLEAN_FAQS} 
        title="Deep House Cleaning — Frequently Asked Questions" 
      />

      <CTABanner
        headline="Ready for a Truly Clean Home?"
        sub={`G&G Cleaning has been Long Island's trusted deep cleaning service since ${BUSINESS.founded}. Get transparent pricing, easy scheduling, and a team that treats your home with the care it deserves.`}
        primaryCta={{ label: 'Get Your Instant Quote Now', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'View Pricing', to: '/pricing' }}
        variant="dark"
      />
    </div>
  );
};

export default DeepCleanChecklistPage;
