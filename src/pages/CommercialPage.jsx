import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import { BUSINESS, COMMERCIAL_SERVICES } from '../data/config';
import offBg from '../assets/office-bg.png';
import './CommercialPage.css';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const CommercialPage = () => {
  useEffect(() => {
    document.title = `Commercial Cleaning Services Long Island | ${BUSINESS.name}`;
  }, []);

  return (
    <div className="commercial-page">
      <Helmet>
        <title>Commercial Cleaning Services Long Island | G&G Cleaning</title>
        <meta name="description" content="G&G Cleaning provides commercial cleaning for offices, retail spaces, and auto shops across Long Island. Flexible contracts, dedicated crews, and flat-rate billing in Nassau and Suffolk County." />
      </Helmet>
      <HeroTemplate
        badge="Commercial Cleaning"
        headline={<>Commercial Cleaning Services<br /><em>Long Island Businesses Trust</em></>}
        subheadline="A consistently clean workspace makes a strong first impression on your clients and keeps your team focused. G&G provides reliable, thorough commercial cleaning for offices, retail locations, and auto shops across Nassau and Suffolk County — on a flexible schedule that never disrupts your operations."
        primaryCta={{ label: 'Request a Free Commercial Quote', to: '/commercial-quote' }}
        secondaryCta={{ label: 'View Plans', to: '/pricing' }}
        bgImage={offBg}
        variant="dark"
      />

      <TrustBar items={BUSINESS.trustBadges} variant="dark" />

      {/* WHY COMMERCIAL */}
      <section className="cp-section">
        <div className="cp-container">
          <motion.div className="cp-section-header" {...fadeUp}>
            <div className="cp-label">Why G&G Commercial</div>
            <h2>Commercial Cleaning Long Island Businesses Trust</h2>
            <p>Your clients notice everything. A clean, well-maintained workspace signals professionalism, builds confidence, and keeps your team proud of where they work. G&G's commercial clients get a dedicated crew, flat-rate billing, and consistent results — every week, without fail.</p>
          </motion.div>
          <div className="cp-why-grid">
            {[
              { icon: '🤝', title: 'Dedicated Crew', desc: 'The same professional team assigned to your location every time — no strangers walking through your door.' },
              { icon: '📋', title: 'Flexible Contracts', desc: 'Weekly, bi-weekly, or monthly scheduling built around your business hours — never disrupting operations.' },
              { icon: '💳', title: 'Flat-Rate Billing', desc: 'Transparent monthly invoicing with no surprise charges. Budget confidently every single month.' },
              { icon: '⚡', title: 'Priority Response', desc: 'Commercial clients receive priority response times for any urgent requests or schedule changes.' },
            ].map((item, i) => (
              <motion.div key={item.title} className="cp-why-card" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="cp-why-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE CARDS */}
      <section className="cp-section cp-services-section">
        <div className="cp-container">
          <motion.div className="cp-section-header" {...fadeUp}>
            <div className="cp-label">Commercial Services</div>
            <h2>Services We Offer for Businesses</h2>
          </motion.div>
          <div className="cp-services-grid">
            {COMMERCIAL_SERVICES.map((svc, i) => (
              <motion.div
                key={svc.id}
                className={`cp-svc-card${svc.full ? ' cp-svc-card--full' : ''}`}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="cp-svc-icon">{svc.icon}</div>
                <div className="cp-svc-name">{svc.name}</div>
                <div className="cp-svc-desc">{svc.desc}</div>
                {svc.priceNote && <div className="cp-svc-price">{svc.priceNote}</div>}
                <ul className="cp-svc-list">
                  {svc.items.map(item => <li key={item}>{item}</li>)}
                </ul>
                <Link to="/commercial-quote" className="cp-svc-cta">
                  {svc.full ? 'Request a Custom Quote →' : `Get ${svc.name.split(' ')[0]} Quote →`}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="cp-industries-section">
        <div className="cp-container">
          <motion.div className="cp-section-header" {...fadeUp}>
            <div className="cp-label">Industries We Serve</div>
            <h2>From Offices to Auto Shops</h2>
          </motion.div>
          <div className="cp-industries-grid">
            {[
              { icon: '🏢', label: 'Corporate Offices' },
              { icon: '🏥', label: 'Medical Offices' },
              { icon: '🛒', label: 'Retail Stores' },
              { icon: '🔧', label: 'Auto Shops' },
              { icon: '🏨', label: 'Hospitality' },
              { icon: '🏫', label: 'Educational Facilities' },
              { icon: '🍽️', label: 'Restaurants & Cafes' },
              { icon: '🏭', label: 'Light Industrial' },
            ].map((ind, i) => (
              <motion.div key={ind.label} className="cp-industry-chip" {...fadeUp} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <span>{ind.icon}</span> {ind.label}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTRACT PROCESS */}
      <section className="cp-section">
        <div className="cp-container">
          <motion.div className="cp-section-header" {...fadeUp}>
            <div className="cp-label">Getting Started</div>
            <h2>How a Commercial Contract Works</h2>
          </motion.div>
          <div className="cp-steps">
            {[
              { n: '01', title: 'Request a Quote', desc: 'Fill out our form or call us. Tell us about your space, hours, and scope.' },
              { n: '02', title: 'Walkthrough & Proposal', desc: 'We visit your location to assess scope and present a flat-rate monthly proposal.' },
              { n: '03', title: 'Contract & Schedule', desc: 'Sign a simple service agreement and we schedule your first clean.' },
              { n: '04', title: 'Dedicated Team Assigned', desc: 'The same professional crew is assigned to your property every scheduled cleaning.' },
            ].map((step, i) => (
              <motion.div key={step.n} className="cp-step" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="cp-step-num">{step.n}</div>
                <div className="cp-step-title">{step.title}</div>
                <div className="cp-step-desc">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        headline="Ready to Book Commercial<br />Cleaning in Long Island?"
        sub="Request a custom quote and we'll build a contract around your schedule and budget."
        primaryCta={{ label: 'Request a Commercial Quote', to: '/commercial-quote' }}
        secondaryCta={{ label: 'View Pricing', to: '/pricing' }}
        variant="dark"
      />
    </div>
  );
};

export default CommercialPage;
