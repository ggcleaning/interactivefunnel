/**
 * G&G Cleaning Services — Compliant Schema.org Structured Data Generator
 * Adheres strictly to Schema.org standards (using Service with serviceType: "Home cleaning",
 * referencing single canonical LocalBusiness @id: "https://ggcleaningli.com/#business").
 */

export const CANONICAL_BUSINESS_ID = "https://ggcleaningli.com/#business";

/**
 * Returns the single root LocalBusiness schema object for G&G Cleaning Services.
 */
export function getRootBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": CANONICAL_BUSINESS_ID,
    "name": "G&G Cleaning Services",
    "url": "https://ggcleaningli.com",
    "logo": "https://ggcleaningli.com/assets/logo.png",
    "telephone": "+1-516-298-8323",
    "email": "info@ggcleaningli.com",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "31 Kirby Lane",
      "addressLocality": "Central Islip",
      "addressRegion": "NY",
      "postalCode": "11722",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 40.7895,
      "longitude": -73.1989
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "15:00"
      }
    ],
    "areaServed": [
      { "@type": "AdministrativeArea", "name": "Nassau County" },
      { "@type": "AdministrativeArea", "name": "Suffolk County" }
    ]
  };
}

/**
 * Generates Schema.org Service & WebPage schema for specific town/location pages.
 * 
 * @param {Object} location 
 * @param {string} location.name - e.g. "Garden City"
 * @param {string} location.slug - e.g. "garden-city"
 * @param {string} location.county - e.g. "Nassau"
 * @param {string} location.description - Meta description
 * @returns {Array<Object>} Array of JSON-LD schema objects
 */
export function getLocationSchemas(location) {
  const pageUrl = `https://ggcleaningli.com/cleaning-services/${location.slug}`;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    "url": pageUrl,
    "name": `House Cleaning & Maid Services in ${location.name}, NY | G&G Cleaning Services`,
    "description": location.description,
    "isPartOf": {
      "@type": "WebSite",
      "@id": "https://ggcleaningli.com/#website",
      "name": "G&G Cleaning Services",
      "url": "https://ggcleaningli.com"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    "name": `Residential House Cleaning Services in ${location.name}`,
    "serviceType": "Home cleaning",
    "provider": {
      "@type": "LocalBusiness",
      "@id": CANONICAL_BUSINESS_ID,
      "name": "G&G Cleaning Services"
    },
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": `${location.name}, ${location.county} County, NY`
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "House Cleaning Packages",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Standard Maintenance House Cleaning"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Deep House Cleaning"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Move-In / Move-Out Cleaning"
          }
        }
      ]
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://ggcleaningli.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Service Areas",
        "item": "https://ggcleaningli.com/#service-area"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${location.name}, NY`,
        "item": pageUrl
      }
    ]
  };

  return [webPageSchema, serviceSchema, breadcrumbSchema];
}
