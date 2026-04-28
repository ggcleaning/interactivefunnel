import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import { BUSINESS } from '../data/config';
import './QuotePage.css';

// Lazy-load heavy components
const EstimateWidget = lazy(() => import('../components/EstimateWidget'));

const LoadingFallback = () => (
  <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.4)' }}>
    Loading Calculator...
  </div>
);

const AUDIENCE_COPY = {
  homeowner: {
    badge: "🏡 For Long Island Homeowners",
    headline: "The #1 Trusted House Cleaners for Long Island Homeowners",
    sub: "See your price and book instantly. Reclaim your weekend while we handle the dirty work in Nassau & Suffolk County."
  },
  investor: {
    badge: "💰 For Real Estate Investors",
    headline: "Fast Turnaround Cleaning for Real Estate Investors",
    sub: "Maximize your ROI with reliable, deep cleaning for your portfolio. Get an instant quote and book online in seconds."
  },
  airbnb: {
    badge: "🧳 For Airbnb & VRBO Hosts",
    headline: "5-Star Turnover Cleaning for Airbnb Hosts",
    sub: "Impeccable turnover service to keep your ratings high and your calendar full. Instant booking, reliable service."
  },
  default: {
    badge: "⏱️ Free Quote in 60 Seconds",
    headline: "You're One Step Away — See Your Price in 60 Seconds",
    sub: "Your $40 Spring discount is reserved. Just tell us about your home and we'll show your instant price — no commitment required."
  }
};

const TESTIMONIALS = [
  { name: 'Sarah M.', loc: 'Massapequa, NY', text: '“Incredible attention to detail. They left my house spotless and smelling amazing.”' },
  { name: 'David R.', loc: 'Huntington, NY', text: '“The instant quote was spot on. Highly professional and very communicative.”' },
  { name: 'Jessica L.', loc: 'Smithtown, NY', text: '“Best turnover cleaning for my Airbnb. I don’t have to worry about a thing.”' },
];

const QuotePage = () => {
  const [audience, setAudience] = useState('default');
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentTriggered, setExitIntentTriggered] = useState(false);
  const [calcStep, setCalcStep] = useState(0);
  const [showHow, setShowHow] = useState(false); // Collapsed by default on mobile
  const [deposit, setDeposit] = useState(0);

  useEffect(() => {
    // 1. Determine audience from URL
    const params = new URLSearchParams(window.location.search);
    const aud = params.get('audience')?.toLowerCase();
    if (aud && AUDIENCE_COPY[aud]) {
      setAudience(aud);
    }
    
    // 2. Exit intent logic
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !exitIntentTriggered) {
        setShowExitIntent(true);
        setExitIntentTriggered(true);
      }
    };
    
    // Mobile Inactivity Timer (45s)
    const inactivityTimer = setTimeout(() => {
      if (!exitIntentTriggered && !showExitIntent) {
        setShowExitIntent(true);
        setExitIntentTriggered(true);
      }
    }, 45000);

    document.addEventListener('mouseleave', handleMouseLeave);
    
    // 3. Listen to calculator step changes
    const handleStepChange = (e) => {
      setCalcStep(e.detail.step);
      if (e.detail.depositAmount) {
        setDeposit(e.detail.depositAmount);
      }
    };
    window.addEventListener('ew_step_change', handleStepChange);

    document.title = 'Get Cleaning Quote Long Island | GG Cleaning Services';

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('ew_step_change', handleStepChange);
      clearTimeout(inactivityTimer);
    }
  }, [exitIntentTriggered]);

  const copy = AUDIENCE_COPY[audience];

  // Dynamic CTA Text based on calculator step
  let ctaText = 'Get My Free Quote';
  if (calcStep >= 3 && deposit > 0) {
    ctaText = `Reserve for $${deposit} →`;
  }
  if (calcStep === 7) ctaText = 'Booking Confirmed!';

  return (
    <div className="quote-funnel-page u-no-wand">
      <Helmet>
        <title>Get a Cleaning Quote Long Island | GG Cleaning Services</title>
        <meta name="description" content={copy.sub} />
        <link rel="canonical" href="https://ggcleaningli.com/quote" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ggcleaningli.com/quote" />
        <meta property="og:title" content="Get a Professional House Cleaning Quote in Long Island" />
        <meta property="og:description" content="Instant estimates and easy booking for Nassau and Suffolk County homes. Trusted cleaning since 2008." />
        <meta property="og:image" content="https://ggcleaningli.com/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://ggcleaningli.com/quote" />
        <meta property="twitter:title" content="Get a Cleaning Quote Long Island | GG Cleaning Services" />
        <meta property="twitter:description" content="See your cleaning price in 60 seconds. Professional service you can trust." />
        <meta property="twitter:image" content="https://ggcleaningli.com/og-image.png" />
      </Helmet>

      {/* MAIN LAYOUT SPLIT */}
      <section className="qf-hero">
        <div className="container qf-main-grid">
          {/* LEFT COLUMN: Marketing & Trust */}
          <div className="qf-main-left">
            <div className="qf-hero-content">
              <div className="qf-badge">{copy.badge}</div>
              <h1 className="qf-title">{copy.headline}</h1>
              <p className="qf-subtitle">{copy.sub}</p>
              
              {/* Desktop-only Trust Row */}
              <div className="qf-desktop-trust-row desktop-only">
                <TrustBar items={BUSINESS.trustBadges.slice(0, 5)} variant="light" />
              </div>

              {/* Premium Bullet List */}
              <div className="qf-marketing-bullets">
                <div className="qf-bullet">
                  <span className="qf-bullet-icon">✨</span>
                  <div>
                    <strong>100% Satisfaction Guarantee</strong>
                    <p>If you're not happy, we'll re-clean it for free.</p>
                  </div>
                </div>
                <div className="qf-bullet">
                  <span className="qf-bullet-icon">🛡️</span>
                  <div>
                    <strong>Fully Bonded & Insured</strong>
                    <p>Your home and belongings are protected.</p>
                  </div>
                </div>
                <div className="qf-bullet">
                  <span className="qf-bullet-icon">🧺</span>
                  <div>
                    <strong>Deep Cleaning Specialists</strong>
                    <p>We reach the spots most cleaners miss.</p>
                  </div>
                </div>
              </div>

              {/* INTEGRATED TESTIMONIALS (Desktop side-by-side) */}
              <div className="qf-integrated-testimonials desktop-only">
                <h3 className="qf-micro-title">Long Island Loves G&G</h3>
                <div className="qf-test-split">
                  {TESTIMONIALS.slice(0, 2).map((t, i) => (
                    <div key={i} className="qf-mini-test-card">
                      <div className="qf-stars">⭐⭐⭐⭐⭐</div>
                      <p className="qf-mini-test-text">{t.text}</p>
                      <div className="qf-mini-test-author">
                        <strong>{t.name}</strong> • {t.loc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN: Interactive Form */}
          <div className="qf-main-right" id="calculator_anchor">


            <div className="qf-calc-wrapper">
              <Suspense fallback={<LoadingFallback />}>
                <EstimateWidget inline={true} />
              </Suspense>
            </div>


            {/* Mobile-only Testimonials (stay at bottom on mobile) */}
            <div className="qf-mobile-testimonials mobile-only">
               {TESTIMONIALS.slice(0, 1).map((t, i) => (
                <div key={i} className="qf-mini-test-card">
                  <div className="qf-stars">⭐⭐⭐⭐⭐</div>
                  <p className="qf-mini-test-text">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES GRID - 2x2 on Desktop */}
      <section className="qf-categories">
        <div className="container">
          <h2 className="qf-section-title">Common Cleaning Categories</h2>
          <div className="qf-cat-grid">
            <div className="qf-cat-card">
              <div className="qf-cat-icon">🧹</div>
              <h3>Standard Cleaning</h3>
              <p>Perfect for regular maintenance. Kitchen, bathrooms, and living areas sparkling clean.</p>
              <div className="qf-cat-actions">
                <button className="qf-cat-btn" onClick={() => document.getElementById('calculator_anchor').scrollIntoView({ behavior: 'smooth' })}>
                  Get Price →
                </button>
                <Link to="/services" className="qf-cat-btn-outline">More Info</Link>
              </div>
            </div>
            <div className="qf-cat-card">
              <div className="qf-cat-icon">🧼</div>
              <h3>Deep Cleaning</h3>
              <p>Top-to-bottom scrub. Baseboards, vents, and every corner of your home sanitized.</p>
              <div className="qf-cat-actions">
                <button className="qf-cat-btn" onClick={() => document.getElementById('calculator_anchor').scrollIntoView({ behavior: 'smooth' })}>
                  Get Price →
                </button>
                <Link to="/services" className="qf-cat-btn-outline">More Info</Link>
              </div>
            </div>
            <div className="qf-cat-card">
              <div className="qf-cat-icon">🚪</div>
              <h3>Move-In / Out</h3>
              <p>The ultimate transition clean. Inside cabinets, ovens, and every square inch spotless.</p>
              <div className="qf-cat-actions">
                <button className="qf-cat-btn" onClick={() => document.getElementById('calculator_anchor').scrollIntoView({ behavior: 'smooth' })}>
                  Get Price →
                </button>
                <Link to="/services" className="qf-cat-btn-outline">More Info</Link>
              </div>
            </div>
            <div className="qf-cat-card">
              <div className="qf-cat-icon">🏢</div>
              <h3>Commercial</h3>
              <p>Reliable recurring care for offices, retail shops, and commercial property managers.</p>
              <div className="qf-cat-actions">
                <button className="qf-cat-btn" onClick={() => document.getElementById('calculator_anchor').scrollIntoView({ behavior: 'smooth' })}>
                  Contact Us →
                </button>
                <Link to="/commercial" className="qf-cat-btn-outline">More Info</Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* STICKY CTA (Mobile only via CSS) */}
      {calcStep < 3 && (
        <div className="qf-sticky-cta">
          <button className="qf-sticky-btn" onClick={() => {
            document.getElementById('calculator_anchor').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            {ctaText}
          </button>
        </div>
      )}

      {/* EXIT INTENT POPUP */}
      {showExitIntent && (
        <div className="qf-exit-overlay">
          <div className="qf-exit-modal">
            <button className="qf-exit-close" onClick={() => setShowExitIntent(false)}>✕</button>
            <div className="qf-exit-badge">WAIT! Your clean home is 60s away.</div>
            <h2 className="qf-exit-title">Claim $40 OFF Your First Cleaning</h2>
            <p className="qf-exit-desc">Don't miss out! Complete your booking now to secure your $40 Spring Special discount.</p>
            <div className="qf-exit-code"><strong>Applied automatically at booking</strong></div>
            <button className="qf-exit-claim" onClick={() => {
              setShowExitIntent(false);
              document.getElementById('calculator_anchor').scrollIntoView({ behavior: 'smooth' });
            }}>
              Claim Discount & Finish 
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotePage;
