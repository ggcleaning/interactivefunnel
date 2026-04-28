import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { BUSINESS, PACKAGES, RECURRING_PLANS, TESTIMONIALS, FAQS } from '../data/config';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import FAQSection from '../components/modular/FAQSection';
import heroBg from '../assets/hero-bg.png';
import familyPhoto from '../assets/family-photo.jpg';
import './HomePage.css';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const HomePage = ({ onOpenEstimate }) => {
  useEffect(() => {
    document.title = 'House Cleaning Services Long Island | GG Cleaning Services';
  }, []);

  return (
    <div className="home-page">
      <Helmet>
        <title>Professional House Cleaning Long Island | G&G Cleaning Services</title>
        <meta name="description" content="Come home to a spotless house. G&G Cleaning is a family-owned, fully insured cleaning service serving Nassau and Suffolk County since 2008. See your price instantly — no email required." />
      </Helmet>
      
      {/* HERO */}
      <HeroTemplate
        badge="✦ Family Owned & Operated • Serving Long Island Since 2008"
        headline={(
          <div style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Come Home to a <span className="text-gold">Spotless House</span> — Every Time.
          </div>
        )}
        subheadline="G&G Cleaning Services is a family-owned team proudly serving professional house cleaning across Nassau and Suffolk County since 2008. Fully insured, transparent pricing, and a 100% satisfaction guarantee on every visit."
        primaryCta={{ label: 'See Your Price Instantly', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'Request Commercial Quote', to: '/commercial' }}
        bgImage={heroBg}
        variant="dark"
      />

      {/* TRUST BAR */}
      <TrustBar items={BUSINESS.trustBadges} variant="dark" />

      {/* SEO INTRO + SERVICES */}
      <section className="home-section home-services">
        <div className="home-container">
          <motion.div className="home-section-header" {...fadeUp}>
            <div className="home-label">Long Island Cleaning Services</div>
            <h2>The Right Clean for Every Home and Business</h2>
            <p>
              Whether you need a weekly maintenance clean, a full deep reset, or an inspection-ready move-out, G&G has a service built for it.
              Every visit is backed by our family-owned team, transparent pricing, and a satisfaction guarantee.
            </p>
          </motion.div>

          <div className="home-services-grid">
            {[
              {
                icon: '🧹', title: 'Standard Cleaning',
                desc: 'Walk into a clean home without lifting a finger. Our standard visits cover the kitchen, bathrooms, floors, and all surfaces on your schedule — weekly, biweekly, or monthly.',
                ideal: 'Ideal for busy homeowners and families who want reliable, recurring maintenance.',
                link: '/services'
              },
              {
                icon: '🧼', title: 'Deep Cleaning',
                desc: 'A thorough reset from baseboards to appliance interiors. We tackle the spots that regular cleaning doesn\'t reach — grout lines, door frames, inside the microwave, and behind furniture.',
                ideal: 'Ideal for first-time clients, seasonal resets, pre-event prep, or post-renovation clean-ups.',
                link: '/services'
              },
              {
                icon: '🚪', title: 'Move-In / Move-Out',
                desc: 'Inspection-ready cleaning for landlords, tenants, and buyers. We cover cabinet interiors, closets, appliance interiors, and every corner — so you get your security deposit back.',
                ideal: 'Ideal for tenants moving out, landlords turning over a property, and buyers preparing a new home.',
                link: '/services'
              },
              {
                icon: '🏢', title: 'Commercial Cleaning',
                desc: 'A consistently clean workspace makes a strong first impression on clients and keeps your team productive. We serve offices, retail locations, and auto shops across Long Island.',
                ideal: 'Ideal for small business owners, office managers, and retail operators in Nassau and Suffolk County.',
                link: '/commercial'
              },
            ].map((s, i) => (
              <motion.div key={s.title} className="home-service-card" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="hs-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '10px' }}>{s.ideal}</p>
                <Link to={s.link} className="hs-link">Learn More →</Link>
              </motion.div>
            ))}
          </div>

          <div className="home-services-cta">
            <Link to="/services" className="btn-outline-home">View All Services</Link>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="home-section home-pricing-preview">
        <div className="home-container">
          <motion.div className="home-section-header" {...fadeUp}>
            <div className="home-label">Transparent Pricing</div>
            <h2>Clear, Upfront Pricing for Long Island Homes</h2>
            <p>No hidden fees. No surprise charges. Every package is priced transparently for Nassau and Suffolk County homes. Not sure which to choose? Most first-time clients start with a Deep Reset to establish a clean baseline, then move to a Standard recurring plan.</p>
          </motion.div>

          <div className="home-pkg-grid">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                className={`home-pkg-card${pkg.featured ? ' home-pkg-card--featured' : ''}`}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {pkg.tag && <div className="home-pkg-tag">{pkg.tag}</div>}
                <div className="home-pkg-icon">{pkg.icon}</div>
                <div className="home-pkg-name">{pkg.name}</div>
                <div className="home-pkg-price">
                  <span>Starting at</span>
                  <strong style={{ color: pkg.featured ? '#c9a84c' : 'inherit' }}>{pkg.price}</strong>
                  <span>{pkg.priceNote}</span>
                </div>
                <ul className="home-pkg-list">
                  {pkg.includes.slice(0, 4).map(item => <li key={item}>{item}</li>)}
                  <li className="home-pkg-more">+ {pkg.includes.length - 4} more included</li>
                </ul>
                <Link to="/quote" className={`home-pkg-cta${pkg.featured ? ' home-pkg-cta--gold' : ''}`}>
                  Calculate My Price →
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="home-pricing-cta">
            <Link to="/pricing" className="btn-outline-home">See Full Pricing Breakdown</Link>
          </div>
        </div>
      </section>

      {/* RECURRING PLANS PREVIEW */}
      <section className="home-section home-plans-preview">
        <div className="home-container">
          <motion.div className="home-section-header" {...fadeUp}>
            <div className="home-label">Save More</div>
            <h2>Set It, Forget It, and Come Home to Clean.</h2>
            <p>Recurring members get better pricing, priority scheduling, and the same trusted crew on every visit — so your home is always ready without you having to think about it.</p>
          </motion.div>
          <div className="home-plans-grid">
            {RECURRING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                className={`home-plan-card${plan.featured ? ' home-plan-card--featured' : ''}`}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {plan.tag && <div className="home-plan-tag">{plan.tag}</div>}
                <div className="home-plan-name">{plan.name}</div>
                <div className="home-plan-freq">{plan.frequency}</div>
                <ul className="home-plan-features">
                  {plan.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <Link to="/plans" className="home-plan-link">Start This Plan →</Link>
              </motion.div>
            ))}
          </div>
          <div className="home-plans-cta">
            <Link to="/plans" className="btn-outline-home">Compare All Plans</Link>
          </div>
        </div>
      </section>

      {/* SERVICE AREA */}
      <section className="home-section home-area-section">
        <div className="home-container">
          <motion.div className="home-section-header" {...fadeUp}>
            <div className="home-label">Where We Clean</div>
            <h2>Serving Nassau &amp; Suffolk County, Long Island</h2>
            <p>G&G Cleaning serves homeowners and businesses throughout Nassau and Suffolk County. Don't see your town listed? Contact us — we likely cover your area and can confirm availability within one business hour.</p>
          </motion.div>
          <motion.div className="home-area-grid" {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }}>
            {['Hempstead', 'Huntington', 'Islip', 'Babylon', 'Brookhaven', 'Smithtown', 'Garden City', 'Massapequa', 'Levittown', 'Valley Stream', 'Freeport', 'Commack'].map(town => (
              <div key={town} className="home-area-chip">{town}</div>
            ))}
          </motion.div>
          <p className="home-area-note">Don't see your town? <Link to="/quote" className="hs-link">Contact us</Link> — we likely serve your area.</p>
        </div>
      </section>

      {/* ABOUT / TRUST */}
      <section className="home-section home-about">
        <div className="home-container home-about-inner">
          <motion.div className="home-about-img-wrap" {...fadeUp}>
            <img src={familyPhoto} alt="GG Cleaning Services family team" className="home-about-img" />
          </motion.div>
          <motion.div className="home-about-text" {...fadeUp} transition={{ duration: 0.55, delay: 0.15 }}>
            <div className="home-label">Our Story</div>
            <h2>Built on Trust. Proven Over 15 Years.</h2>
            <p>G&G Cleaning Services was founded by <strong>Griselda Alas</strong> in 2008. Working in the cleaning industry since the early 2000s, Griselda built this business from the ground up — one home, one family, one relationship at a time. The belief was simple: <strong>your home deserves the same care we'd give our own.</strong></p>
            <p style={{ marginTop: '1rem' }}>We are not a franchise. We are not a call center. When you reach out to G&G, you reach the family — and we treat every client like a neighbor. Many of our clients have been with us for 10 years or more. That kind of loyalty is not bought. It is earned, one visit at a time.</p>
            <div className="home-about-stats">
              {[
                { value: '15+', label: 'Years in Business' },
                { value: '10+', label: 'Year Client Relationships' },
                { value: '5.0 ⭐', label: 'on Google' },
              ].map(s => (
                <div key={s.label} className="home-stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="home-section home-testimonials">
        <div className="home-container">
          <motion.div className="home-section-header" {...fadeUp}>
            <div className="home-label">What Clients Say</div>
            <h2>What Long Island Homeowners Are Saying</h2>
          </motion.div>
          <div className="home-reviews-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.id} className="home-review-card" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <div className="home-review-stars">{'⭐'.repeat(t.rating)}</div>
                <p className="home-review-text">"{t.text}"</p>
                <div className="home-review-author">
                  <strong>{t.name}</strong>
                  <span>{t.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FAQSection items={FAQS} />

      {/* CTA BANNER */}
      <CTABanner
        headline="Your Cleanest Home Starts Here."
        sub="Book online in 60 seconds, or use our instant calculator to see your price range right now — no email required. We serve all of Nassau and Suffolk County."
        primaryCta={{ label: 'See Your Price Instantly', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'Request Commercial Quote', to: '/commercial' }}
        variant="dark"
      />
    </div>
  );
};

export default HomePage;
