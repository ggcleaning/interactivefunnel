/**
 * G&G Cleaning Services — Sitemap Generator Script
 * Generates public/sitemap.xml including all primary routes and active location pages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCATION_DATA } from '../src/data/locationData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://ggcleaningli.com';

const CORE_ROUTES = [
  '/',
  '/services',
  '/pricing',
  '/plans',
  '/commercial',
  '/quote',
  '/services/deep-cleaning-checklist',
  '/reviews'
];

function generateSitemapXml() {
  const lastMod = new Date().toISOString().split('T')[0];

  const coreUrls = CORE_ROUTES.map((route) => `  <url>
    <loc>${DOMAIN}${route}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');

  const locationUrls = Object.keys(LOCATION_DATA).map((slug) => `  <url>
    <loc>${DOMAIN}/cleaning-services/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreUrls}
${locationUrls}
</urlset>`;

  const targetPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(targetPath, xmlContent, 'utf-8');
  console.log(`[Sitemap] Successfully generated sitemap.xml at ${targetPath}`);
}

generateSitemapXml();
