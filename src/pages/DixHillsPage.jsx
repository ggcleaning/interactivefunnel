import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import FAQSection from '../components/modular/FAQSection';
import { BUSINESS, LOCATIONS } from '../data/config';
import heroBg from '../assets/hero-bg.png';
import './TownLandingPage.css';

const DixHillsPage = ({ onOpenEstimate }) => {
  const content = LOCATIONS.dix_hills;

  return (
    <div className="town-landing-page">
      <Helmet>
        <title>{`Luxury House Cleaning in ${content.name}, NY | ${BUSINESS.name} — Trusted Since ${BUSINESS.founded}`}</title>
        <meta name="description" content={content.description} />
        <link rel="canonical" href={`${BUSINESS.website}/locations/dix-hills`} />
        
        {/* Localized Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": BUSINESS.name,
            "image": `${BUSINESS.website}/favicon.svg`,
            "description": content.description,
            "url": `${BUSINESS.website}/locations/dix-hills`,
            "telephone": `+1${BUSINESS.phone.replace(/-/g, '')}`,
            "areaServed": {
              "@type": "City",
              "name": content.name,
              "containedInPlace": {
                "@type": "AdministrativeArea",
                "name": `${content.county} County`
              }
            }
          })}
        </script>
      </Helmet>

      <HeroTemplate
        badge={`Serving ${content.name}`}
        headline={content.headline}
        subheadline={content.subheadline}
        primaryCta={{ label: 'Get Instant Quote', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'View Services', to: '/services' }}
        bgImage={heroBg}
        variant="dark"
      />

      <TrustBar items={BUSINESS.trustBadges} variant="light" />

      {/* SECTION 3 — PAIN + OUTCOME */}
      <section className="town-section">
        <div className="town-container">
          <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Finally Enjoy a Clean Home Without the Stress</h2>
          
          <div className="town-pain-grid">
            <ul className="pain-points-list">
              {[
                `Tired of spending your weekends cleaning instead of living?`,
                `Need a reliable team you don't have to manage or follow up with?`,
                `Want your home consistently spotless without the hassle of doing it yourself?`,
                `Looking for a cleaning service that actually knows ${content.name} homes?`
              ].map((point, i) => (
                <li key={i}>
                  <div style={{ color: 'var(--color-secondary)', flexShrink: 0 }}><CheckCircle size={24} /></div>
                  <div><strong>{point}</strong></div>
                </li>
              ))}
            </ul>

            <div className="pain-outcome glass-card">
              <Sparkles size={40} color="var(--color-secondary)" style={{ marginBottom: '20px' }} />
              <h3>We handle everything.</h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-dark)' }}>So you can focus on your time, your family, and your life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — TRUST + LOCAL AUTHORITY */}
      <section className="town-section town-trust-section alt-bg">
        <div className="town-container">
          <div className="town-trust-content">
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Trusted House Cleaners in {content.name} Since {BUSINESS.founded}</h2>
            
            <div className="town-trust-text">
              <p>{content.name} is one of {content.county} County's most desirable residential communities, known for its sprawling estates, scenic hills, and proximity to <strong>Half Hollow Hills Schools</strong> and the <strong>Cunningham Park</strong> area. These homes require specialized care to maintain their beauty.</p>
              
              <p>G&G Cleaning has been the premier choice for {content.name} homeowners for over 15 years. We specialize in deep cleans and maintenance for large, upscale properties throughout the <strong>Signal Hill</strong>, <strong>Arshon</strong>, and <strong>Candlewood</strong> neighborhoods. Our teams are trained to handle expansive floor plans and high-end finishes with professional care.</p>
              
              <ul className="cta-benefits-grid">
                <li><ShieldCheck size={24} color="var(--color-secondary)" /> Non-toxic, family & pet-safe products</li>
                <li><CheckCircle size={24} color="var(--color-secondary)" /> Detailed 40+ point cleaning checklist</li>
                <li><CheckCircle size={24} color="var(--color-secondary)" /> Same trained, background-checked team</li>
                <li><Clock size={24} color="var(--color-secondary)" /> Flexible scheduling built around you</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — SERVICES */}
      <section className="town-section">
        <div className="town-container">
          <h2 style={{ textAlign: 'center' }}>Our Most Popular Cleaning Services in {content.name}</h2>
          <p className="section-subtitle">
            We offer fully customized cleaning plans based on your home size, lifestyle, and preferences. Every service includes our 40+ point checklist and non-toxic products.
          </p>
          
          <div className="town-services-grid">
            {[
              { title: 'Deep Cleaning', desc: 'A full reset for your home — targeting built-up grime, overlooked areas, baseboards, vents, and appliances. Perfect for first-time clients.' },
              { title: 'Recurring Cleaning', desc: 'Weekly, Bi-Weekly, or Monthly maintenance. Our most popular service for homeowners to keep their homes guest-ready.' },
              { title: 'Move-In / Move-Out', desc: 'Comprehensive deep clean for home transitions — covering inside cabinets, appliance interiors, and every room top-to-bottom.' },
              { title: 'Post-Renovation', desc: 'Construction dust and debris removed thoroughly so your newly renovated space is safe and ready to enjoy.' },
            ].map((svc, i) => (
              <div key={i} className="town-service-card glass-card">
                <h3>{svc.title}</h3>
                <p>{svc.desc}</p>
              </div>
            ))}
          </div>

          <div className="service-tip glass-card">
            <Sparkles size={30} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
            <div>
              <strong>💡 Pro Tip:</strong> Many {content.name} families prefer our bi-weekly cleaning to keep their large homes consistently fresh while maintaining a busy schedule.
            </div>
          </div>
        </div>
      </section>

      <FAQSection 
        items={content.faqs} 
        title={`${content.name} House Cleaning — Frequently Asked Questions`} 
      />

      <CTABanner
        headline={`Book Your First Cleaning in ${content.name} Today`}
        sub={`Stop spending your weekends cleaning and start enjoying your home the way it was meant to be enjoyed. ${BUSINESS.name} has been ${content.name}'s trusted cleaning service since ${BUSINESS.founded}.`}
        primaryCta={{ label: 'Get Your Instant Quote Now', onClick: onOpenEstimate }}
        secondaryCta={{ label: 'View Pricing', to: '/pricing' }}
        variant="dark"
      />
    </div>
  );
};

export default DixHillsPage;
