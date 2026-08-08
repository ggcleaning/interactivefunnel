import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEOHead Component — Dynamically manages head tags, canonicals, OG tags, and Schema JSON-LD.
 */
const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://ggcleaningli.com/og-image.png',
  schemas = []
}) => {
  return (
    <Helmet>
      {/* Primary Title & Description */}
      {title && <title>{title}</title>}
      {title && <meta name="title" content={title} />}
      {description && <meta name="description" content={description} />}
      
      {/* Canonical Link */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph Tags */}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Tags */}
      <meta property="twitter:card" content="summary_large_image" />
      {title && <meta property="twitter:title" content={title} />}
      {description && <meta property="twitter:description" content={description} />}
      {ogImage && <meta property="twitter:image" content={ogImage} />}

      {/* JSON-LD Schemas */}
      {schemas.map((schemaObj, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schemaObj)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
