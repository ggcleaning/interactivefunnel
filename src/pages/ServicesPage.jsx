import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import { BUSINESS, PACKAGES, ADDONS } from '../data/config';
import offBg from '../assets/office-bg.png';
import './ServicesPage.css';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const serviceDetails = [
  {
    id: 'standard',
    icon: '🧹',
    name: 'Standard Cleaning',
    headline: 'Reliable, Consistent Cleaning That Keeps Your Home Always Ready',
    desc: 'Our standard house cleaning service keeps Long Island homes fresh and maintained on regular weekly or bi-weekly visits. This is our most popular service — ideal for busy households across Nassau and Suffolk County who want reliable results without lifting a finger.',
    useCases: ['Weekly or bi-weekly home maintenance', 'Dual-income households on Long Island', 'Families with kids or pets', 'Airbnb and vacation rental turnovers'],
    benefits: ['Consistent clean you can count on', 'Preferential rates for recurring clients', 'Same team every visit for trust and familiarity', 'Flexible scheduling around your life'],
  },
  {
    id: 'deep',
    icon: '🧼',
    name: 'Deep Cleaning',
    headline: 'A Top-to-Bottom Reset That Standard Cleaning Doesn\'t Cover',
    desc: 'Our deep cleaning service in Long Island goes far beyond the surface. We get behind appliances, inside cabinets, scrub grout, and address build-up that regular cleaning misses. Most new recurring clients begin with a deep clean to establish a clean baseline before switching to a maintenance schedule.',
    useCases: ['First-time GG Cleaning clients', 'Post-renovation or construction cleanup', 'Seasonal cleaning (spring / fall) across Long Island', 'Homes returning from extended vacancy'],
    benefits: ['Removes built-up grease, grime & allergens', 'Sets a baseline for recurring house cleaning', 'Improves indoor air quality', 'Extends the life of surfaces and appliances'],
  },
  {
    id: 'moveout',
    icon: '🚪',
    name: 'Move-In / Move-Out Cleaning',
    headline: 'Leave Your Old Place Spotless — Arrive to a Fresh Start',
    desc: 'Our move-out cleaning service in Nassau and Suffolk County is our most comprehensive residential package. We clean every inch — inside appliances, closets, drawers, and more. Property managers, landlords, and realtors across Long Island trust us to prepare homes for listing or new tenant arrival.',
    useCases: ['Renters wanting their full deposit back', 'Homeowners preparing a Long Island home for sale', 'Property managers between tenants', 'Realtors staging a home for listing on Long Island'],
    benefits: ['Increases chance of full deposit return', 'Faster home sale or tenant placement', 'Professional results guaranteed', 'Trusted by Long Island realtors and property managers'],
  },
  {
    id: 'commercial',
    icon: '🏢',
    name: 'Commercial Cleaning',
    headline: 'Professional, Consistent Cleaning for Long Island Businesses',
    desc: 'We provide reliable commercial cleaning services for offices, retail locations, and auto shops across Nassau and Suffolk County. Commercial clients get dedicated team assignments, flat-rate monthly billing, and the same professional standards we bring to every home.',
    useCases: ['Office complexes and corporate spaces across Long Island', 'Auto dealerships and mechanic shops', 'Retail stores and showrooms in Nassau & Suffolk County', 'Small to mid-size businesses'],
    benefits: ['Flexible weekly, bi-weekly, or monthly scheduling', 'Dedicated cleaning crew for your location', 'Transparent flat-rate billing', 'Priority scheduling and response time'],
  },
];

const ServicesPage = ({ onOpenEstimate }) => {
  useEffect(() => {
    document.title = 'Cleaning Services Long Island | GG Cleaning';
  }, []);

  return (
    <div className="services-page">
      <Helmet>
        <title>House Cleaning Services Nassau & Suffolk County | G&G Cleaning</title>
        <meta name="description" content="G&G Cleaning offers standard, deep, and move-in/move-out cleaning for Long Island homes. Family-owned, fully insured, and serving Nassau and Suffolk County since 2008." />
      </Helmet>
      <HeroTemplate
        badge="Full-Spectrum Cleaning"
        headline={<>House Cleaning Services<br />in <em>Nassau & Suffolk County</em></>}
        subheadline="G&G Cleaning Services offers residential and commercial cleaning across Nassau & Suffolk County. Standard, deep, move-in/out, and commercial — all backed by a family-owned team you can trust since 2008."
        primaryCta={{ label: 'See Your Price Instantly', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'View Pricing', to: '/pricing' }}
        commercialCta={{ label: 'Request Commercial Quote', to: '/commercial' }}
        bgImage={offBg}
        variant="dark"
      />

      <TrustBar items={BUSINESS.trustBadges} variant="dark" />

      {/* SERVICE DETAILS */}
      {serviceDetails.map((svc, idx) => (
        <section key={svc.id} className={`sp-section${idx % 2 === 1 ? ' sp-section--alt' : ''}`}>
          <div className="sp-container">
            <motion.div className="sp-service-block" {...fadeUp}>
              <div className="sp-service-icon">{svc.icon}</div>
              <div className="sp-service-label">Our Services</div>
              <h2 className="sp-service-name">{svc.name}</h2>
              <p className="sp-service-headline">{svc.headline}</p>
              <p className="sp-service-desc">{svc.desc}</p>

              <div className="sp-two-col">
                <div>
                  <h4 className="sp-col-title">📋 Use Cases</h4>
                  <ul className="sp-list">
                    {svc.useCases.map(u => <li key={u}>{u}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="sp-col-title">✅ Benefits</h4>
                  <ul className="sp-list sp-list--gold">
                    {svc.benefits.map(b => <li key={b}>{b}</li>)}
                  </ul>
                </div>
              </div>

              {svc.id === 'commercial' ? (
                <Link to="/commercial-intake" className="sp-service-cta" style={{ color: 'white' }}>
                    Request Commercial Quote →
                </Link>
              ) : (
                <button onClick={onOpenEstimate} className="sp-service-cta" style={{ border: 'none', cursor: 'pointer', color: 'white' }}>
                    Get Instant Quote for {svc.name} →
                </button>
              )}
            </motion.div>
          </div>
        </section>
      ))}

      {/* ADD-ONS STRIP */}
      <section className="sp-addons-section">
        <div className="sp-container">
          <motion.div className="sp-section-header" {...fadeUp}>
            <div className="sp-label">Customize Your Clean</div>
            <h2>Available Add-On Services</h2>
            <p>Add only what you need — priced clearly upfront.</p>
          </motion.div>
          <div className="sp-addons-grid">
            {ADDONS.map((a, i) => (
              <motion.div key={a.id} className="sp-addon-card" {...fadeUp} transition={{ duration: 0.4, delay: i * 0.07 }}>
                <span className="sp-addon-icon">{a.icon}</span>
                <div className="sp-addon-info">
                  <strong>{a.name}</strong>
                  <span>{a.note}</span>
                </div>
                <div className="sp-addon-price">{a.price}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        headline="Ready to Book a Service?"
        sub="Get your instant estimate for home cleaning, or request a custom walkthrough for your business space."
        primaryCta={{ label: 'See Your Price Instantly', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'Request Commercial Quote', to: '/commercial-intake' }}
        variant="dark"
      />
    </div>
  );
};

export default ServicesPage;
