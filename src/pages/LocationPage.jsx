import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LOCATIONS, BUSINESS } from '../data/config';
import HeroTemplate from '../components/modular/HeroTemplate';
import TrustBar from '../components/modular/TrustBar';
import CTABanner from '../components/modular/CTABanner';
import FAQSection from '../components/modular/FAQSection';
import { trackEvent } from '../utils/analytics';

/**
 * LocationPage - Reusable template for all town-specific landing pages.
 * Pulls data dynamically from the LOCATIONS config.
 */
const LocationPage = ({ onOpenEstimate }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Find the location data by slug (mapping kebab-case to camelCase if needed)
  const locationKey = Object.keys(LOCATIONS).find(
    key => key.toLowerCase() === slug.replace(/-/g, '').toLowerCase()
  );
  
  const location = LOCATIONS[locationKey];

  useEffect(() => {
    if (!location) {
      // If location doesn't exist, redirect to home
      navigate('/', { replace: true });
      return;
    }

    // Track page view for this specific location
    trackEvent('location_page_view', {
      location: location.name,
      slug: slug
    });

    window.scrollTo(0, 0);
  }, [location, slug, navigate]);

  if (!location) return null;

  // Personalized CTA handler that passes the area to the funnel
  const handleCtaClick = () => {
    trackEvent('location_cta_click', {
      location: location.name,
      type: 'primary'
    });
    
    // Store selected area in session for the funnel to pick up
    sessionStorage.setItem('preferred_area', location.name);
    
    // Open the estimate widget
    onOpenEstimate();
  };

  // Generate Local Business Schema for this specific town
  const schema = {
    "@context": "https://schema.org",
    "@type": "CleaningService",
    "name": `${BUSINESS.name} - ${location.name}`,
    "description": location.description,
    "url": `${BUSINESS.website}/locations/${slug}`,
    "telephone": BUSINESS.phone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": location.name,
      "addressRegion": "NY",
      "addressCountry": "US"
    },
    "areaServed": {
      "@type": "City",
      "name": location.name
    },
    "provider": {
      "@type": "LocalBusiness",
      "name": BUSINESS.name,
      "image": `${BUSINESS.website}/logo.png`
    }
  };

  return (
    <div className="location-page">
      <Helmet>
        <title>{location.headline} | {BUSINESS.name}</title>
        <meta name="description" content={location.description} />
        <link rel="canonical" href={`${BUSINESS.website}/locations/${slug}`} />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <HeroTemplate 
        badge={`${location.county} County’s #1 Rated Cleaners`}
        headline={location.headline}
        subheadline={location.subheadline}
        primaryCta={{
          label: `Get a Quote for ${location.name}`,
          onClick: handleCtaClick
        }}
        secondaryCta={{
          label: "View Pricing",
          onClick: () => navigate('/pricing')
        }}
        bgImage="/images/hero-clean.jpg"
      />

      <TrustBar items={BUSINESS.trustBadges} />

      {/* Town-Specific FAQ Section */}
      {location.faqs && location.faqs.length > 0 && (
        <FAQSection 
          title={`Frequently Asked Questions in ${location.name}`}
          items={location.faqs}
        />
      )}

      <CTABanner 
        headline={`Ready for a Spotless ${location.name} Home?`}
        sub="Join hundreds of satisfied Long Island homeowners who trust G&G Cleaning for their weekly and bi-weekly needs."
        primaryCta={{
          label: `Get My ${location.name} Quote`,
          onClick: handleCtaClick
        }}
      />
    </div>
  );
};

export default LocationPage;
