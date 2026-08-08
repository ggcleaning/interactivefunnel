import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LOCATION_DATA } from '../data/locationData';
import { getLocationSchemas } from '../utils/seoSchemas';
import SEOHead from '../components/SEOHead';
import EstimateWidget from '../components/EstimateWidget';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  Home,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { BUSINESS } from '../data/config';
import './LocationPage.css';

const LocationPage = () => {
  const { slug } = useParams();
  const location = LOCATION_DATA[slug?.toLowerCase()];
  const [showWidgetModal, setShowWidgetModal] = useState(false);

  // Handle 404 for unknown town slugs
  if (!location) {
    return (
      <div className="location-404-wrapper">
        <SEOHead
          title="Town Not Found | G&G Cleaning Services"
          description="The requested service area page could not be found. G&G Cleaning Services serves all of Nassau and Suffolk County on Long Island."
        />
        <Navbar />
        <main className="location-404-container">
          <div className="location-404-card">
            <span className="location-404-icon">📍</span>
            <h1>Location Page Not Found</h1>
            <p>We couldn't find a dedicated landing page for <code>/{slug}</code>, but G&G Cleaning Services proudly serves all homes and businesses across <strong>Nassau and Suffolk Counties</strong> on Long Island!</p>
            
            <div className="location-404-actions">
              <Link to="/" className="btn-primary">
                Return to Homepage
              </Link>
            </div>

            <div className="location-404-active-towns">
              <h3>Explore Our Primary Service Areas:</h3>
              <div className="active-towns-grid">
                {Object.values(LOCATION_DATA).map((loc) => (
                  <Link key={loc.slug} to={`/cleaning-services/${loc.slug}`} className="town-link-chip">
                    📍 {loc.name}, NY
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canonicalUrl = `https://ggcleaningli.com/cleaning-services/${location.slug}`;
  const pageSchemas = getLocationSchemas(location);

  return (
    <div className="location-page-wrapper">
      <SEOHead
        title={location.metaTitle}
        description={location.metaDescription}
        canonicalUrl={canonicalUrl}
        schemas={pageSchemas}
      />

      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="location-hero">
          <div className="location-hero-container">
            <div className="location-hero-content">
              <div className="location-badge">
                <MapPin className="icon-sm" />
                <span>{location.name}, NY — {location.county} County</span>
              </div>
              
              <h1>{location.h1}</h1>
              
              <p className="location-hero-intro">{location.intro}</p>

              <div className="location-hero-cta-group">
                <button 
                  className="btn-location-primary"
                  onClick={() => setShowWidgetModal(true)}
                >
                  <Sparkles className="icon-sm" />
                  Calculate {location.name} Quote Instant →
                </button>
                <a href={`tel:${BUSINESS.phone}`} className="btn-location-secondary">
                  <PhoneCall className="icon-sm" />
                  Call {BUSINESS.phone}
                </a>
              </div>

              <div className="location-trust-bar">
                <div className="trust-item"><ShieldCheck className="trust-icon" /> Fully Insured & Bonded</div>
                <div className="trust-item"><Star className="trust-icon" /> 5.0 Star Rated on Google</div>
                <div className="trust-item"><Home className="trust-icon" /> Serving Long Island Since 2008</div>
              </div>
            </div>

            <div className="location-hero-widget-preview">
              <div className="widget-preview-card">
                <h3>Get an Instant Price in {location.name}</h3>
                <p>Select your home size and get a guaranteed price quote in under 60 seconds.</p>
                <button 
                  className="widget-preview-btn"
                  onClick={() => setShowWidgetModal(true)}
                >
                  Launch Instant Price Calculator
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* HOUSING CONTEXT SECTION */}
        <section className="location-section housing-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Tailored Cleaning for {location.name} Homes</h2>
              <p>{location.housingContext}</p>
            </div>

            <div className="highlights-grid">
              {location.localHighlights.map((highlight, idx) => (
                <div key={idx} className="highlight-card">
                  <CheckCircle2 className="highlight-icon" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR SERVICES */}
        <section className="location-section services-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Popular Cleaning Packages in {location.name}</h2>
              <p>Choose the ideal cleaning schedule for your home and lifestyle.</p>
            </div>

            <div className="services-grid">
              {location.popularServices.map((srv, idx) => (
                <div key={idx} className="service-card">
                  <div className="service-card-header">
                    <Sparkles className="service-icon" />
                    <h3>{srv.title}</h3>
                  </div>
                  <p>{srv.desc}</p>
                  <button 
                    className="service-card-btn"
                    onClick={() => setShowWidgetModal(true)}
                  >
                    Select Package <ArrowRight className="icon-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        {location.testimonial && (
          <section className="location-section testimonial-section">
            <div className="section-container">
              <div className="testimonial-card">
                <div className="stars-row">★★★★★</div>
                <p className="quote">"{location.testimonial.quote}"</p>
                <div className="author">— {location.testimonial.author}, {location.testimonial.area}</div>
              </div>
            </div>
          </section>
        )}

        {/* LOCAL FAQS */}
        <section className="location-section faqs-section">
          <div className="section-container">
            <div className="section-header">
              <h2><HelpCircle className="inline-icon" /> Frequently Asked Questions in {location.name}</h2>
            </div>

            <div className="faqs-list">
              {location.localFaqs.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <h4>{faq.q}</h4>
                  <p>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NEARBY TOWNS (CRAWLABLE INTERNAL LINKS) */}
        <section className="location-section nearby-section">
          <div className="section-container">
            <h3>Nearby Long Island Communities We Serve</h3>
            <div className="nearby-towns-flex">
              {location.nearbyTowns.map((townName, idx) => {
                const matchedSlug = Object.keys(LOCATION_DATA).find(
                  (s) => LOCATION_DATA[s].name.toLowerCase() === townName.toLowerCase()
                );
                return matchedSlug ? (
                  <Link key={idx} to={`/cleaning-services/${matchedSlug}`} className="nearby-town-link">
                    📍 {townName}, NY
                  </Link>
                ) : (
                  <span key={idx} className="nearby-town-tag">
                    📍 {townName}, NY
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ESTIMATE WIDGET MODAL */}
      {showWidgetModal && (
        <div className="location-widget-modal-backdrop" onClick={() => setShowWidgetModal(false)}>
          <div className="location-widget-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowWidgetModal(false)}>✕</button>
            <EstimateWidget onClose={() => setShowWidgetModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPage;
