import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useConciergeFunnel } from '../hooks/useConciergeFunnel';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import { BUSINESS } from '../data/config';
import './QuotePage.css';

// Lazy-load heavy components
const ConciergeFunnel = lazy(() => import('../components/concierge/ConciergeFunnel').then(module => ({ default: module.ConciergeFunnel })));

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
  const { currentStep } = useConciergeFunnel();
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

  const isConfirmed = currentStep === 'booking-confirmed';

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
      <div className="qf-concierge-container">
        <Suspense fallback={<LoadingFallback />}>
          <ConciergeFunnel />
        </Suspense>
      </div>

      {/* SOCIAL PROOF & TRUST */}
      {!isConfirmed && (
        <section className="qf-social-proof reveal visible">
          <div className="container">
            <TrustBar />
            <div className="testimonial-grid" style={{ marginTop: '4rem' }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="glass-card testimonial-item animate-concierge-slide" style={{ animationDelay: `${i * 0.2}s` }}>
                  <p className="t-text" style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{t.text}</p>
                  <div className="t-meta" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                    <span className="t-name" style={{ fontWeight: 600, display: 'block' }}>{t.name}</span>
                    <span className="t-loc" style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t.loc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* EXIT INTENT POPUP */}
      {showExitIntent && !isConfirmed && (
        <div className="qf-exit-overlay">
          <div className="qf-exit-modal glass-card">
            <button className="qf-exit-close" onClick={() => setShowExitIntent(false)}>✕</button>
            <div className="qf-exit-badge">GENTLE REMINDER</div>
            <h2 className="qf-exit-title">Your $40 Gift Awaits</h2>
            <p className="qf-exit-desc">Complete your concierge inquiry now to secure your $40 First-Time Client credit.</p>
            <button className="btn-primary" onClick={() => setShowExitIntent(false)} style={{ width: '100%', marginTop: '1.5rem' }}>
              Return to Concierge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotePage;
