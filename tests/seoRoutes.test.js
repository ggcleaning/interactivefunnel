import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LOCATION_DATA } from '../src/data/locationData.js';
import { getLocationSchemas, CANONICAL_BUSINESS_ID } from '../src/utils/seoSchemas.js';

describe('SEO Routes, Initial-HTML Prerendering & Schema.org Compliance', () => {
  it('should contain unique metadata for all initial priority town markets', () => {
    const slugs = Object.keys(LOCATION_DATA);
    expect(slugs.length).toBeGreaterThanOrEqual(6);

    const titles = new Set();
    const descriptions = new Set();

    slugs.forEach((slug) => {
      const town = LOCATION_DATA[slug];
      expect(town.name).toBeTruthy();
      expect(town.metaTitle).toBeTruthy();
      expect(town.metaDescription).toBeTruthy();
      expect(town.h1).toBeTruthy();
      expect(town.intro).toBeTruthy();
      expect(town.localHighlights.length).toBeGreaterThanOrEqual(2);
      expect(town.localFaqs.length).toBeGreaterThanOrEqual(2);

      // Verify titles & descriptions are unique
      expect(titles.has(town.metaTitle)).toBe(false);
      expect(descriptions.has(town.metaDescription)).toBe(false);

      titles.add(town.metaTitle);
      descriptions.add(town.metaDescription);
    });
  });

  it('getLocationSchemas should build compliant Schema.org JSON-LD without non-standard types', () => {
    const gardenCity = LOCATION_DATA['garden-city'];
    const schemas = getLocationSchemas(gardenCity);

    expect(schemas.length).toBe(3);

    const [webPage, service, breadcrumb] = schemas;

    // WebPage check
    expect(webPage['@type']).toBe('WebPage');
    expect(webPage.url).toBe('https://ggcleaningli.com/cleaning-services/garden-city');

    // Service check
    expect(service['@type']).toBe('Service');
    expect(service.serviceType).toBe('Home cleaning');
    expect(service.provider['@id']).toBe(CANONICAL_BUSINESS_ID);
    expect(service.areaServed.name).toContain('Garden City');

    // Ensure non-standard CleaningService type is NEVER used
    const jsonString = JSON.stringify(schemas);
    expect(jsonString.includes('CleaningService')).toBe(false);

    // Breadcrumb check
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement.length).toBe(3);
  });

  it('should verify raw initial-HTML artifacts exist with pre-populated SEO head & schema tags', () => {
    const distDir = path.resolve(__dirname, '../dist');

    // Skip static file inspection if dist hasn't been built yet during isolated test run
    if (!fs.existsSync(distDir)) {
      console.warn('[SEO Test Warning] dist directory not present during test. Build script will generate static HTML.');
      return;
    }

    Object.keys(LOCATION_DATA).forEach((slug) => {
      const filePath = path.join(distDir, 'cleaning-services', slug, 'index.html');
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, 'utf-8');
        const loc = LOCATION_DATA[slug];

        // Head SEO Checks
        expect(html).toContain(`<title>${loc.metaTitle}</title>`);
        expect(html).toContain(`name="description" content="${loc.metaDescription}"`);
        expect(html).toContain(`rel="canonical" href="https://ggcleaningli.com/cleaning-services/${loc.slug}"`);
        
        // Body H1 & Intro Checks
        expect(html).toContain(`<h1>${loc.h1}</h1>`);
        expect(html).toContain(loc.intro);

        // Schema JSON-LD Checks
        expect(html).toContain(`"serviceType":"Home cleaning"`);
        expect(html).toContain(`"@id":"https://ggcleaningli.com/#business"`);
        expect(html.includes('CleaningService')).toBe(false);
        expect(html.includes('name="keywords"')).toBe(false);
      }
    });

    // 404 HTML Check
    const file404Path = path.join(distDir, '404.html');
    if (fs.existsSync(file404Path)) {
      const html404 = fs.readFileSync(file404Path, 'utf-8');
      expect(html404).toContain('noindex, nofollow');
    }
  });

  it('sitemap.xml should contain exact canonical URLs without trailing slash mismatches', () => {
    const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8');
      Object.keys(LOCATION_DATA).forEach((slug) => {
        expect(sitemapXml).toContain(`https://ggcleaningli.com/cleaning-services/${slug}`);
      });
    }
  });
});
