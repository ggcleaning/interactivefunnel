/**
 * G&G Cleaning Services — Static Location Prerenderer
 * Builds static HTML artifacts for all location routes ensuring raw initial-HTML
 * contains title, description, canonical, H1, intro text, and compliant Schema.org JSON-LD before JS loads.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCATION_DATA } from '../src/data/locationData.js';
import { getLocationSchemas } from '../src/utils/seoSchemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

function prerender() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`[Prerender Error] Build template not found at ${TEMPLATE_PATH}. Run vite build first.`);
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // 1. Prerender Initial Location Landing Pages
  Object.keys(LOCATION_DATA).forEach((slug) => {
    const loc = LOCATION_DATA[slug];
    const canonicalUrl = `https://ggcleaningli.com/cleaning-services/${loc.slug}`;
    const schemas = getLocationSchemas(loc);

    // Build head replacement
    const headInjection = `
    <title>${loc.metaTitle}</title>
    <meta name="title" content="${loc.metaTitle}">
    <meta name="description" content="${loc.metaDescription}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:title" content="${loc.metaTitle}">
    <meta property="og:description" content="${loc.metaDescription}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://ggcleaningli.com/og-image.png">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${loc.metaTitle}">
    <meta property="twitter:description" content="${loc.metaDescription}">
    ${schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n    ')}
    `;

    // Build body initial HTML replacement
    const bodyInjection = `
    <div className="location-page-wrapper">
      <main>
        <section className="location-hero">
          <div className="location-hero-container">
            <div className="location-hero-content">
              <div className="location-badge">📍 ${loc.name}, NY — ${loc.county} County</div>
              <h1>${loc.h1}</h1>
              <p className="location-hero-intro">${loc.intro}</p>
            </div>
          </div>
        </section>
        <section className="location-section housing-section">
          <h2>Tailored Cleaning for ${loc.name} Homes</h2>
          <p>${loc.housingContext}</p>
        </section>
      </main>
    </div>
    `;

    let html = baseTemplate;

    // Replace default head title & description
    html = html.replace(/<title>.*?<\/title>/i, `<title>${loc.metaTitle}</title>`);
    html = html.replace(/<meta name="description" content=".*?"/i, `<meta name="description" content="${loc.metaDescription}"`);
    html = html.replace(/<link rel="canonical" href=".*?"/i, `<link rel="canonical" href="${canonicalUrl}"`);
    html = html.replace(/<meta name="keywords".*?>/gi, ''); // Ensure zero meta keywords

    // Inject JSON-LD right before </head>
    html = html.replace('</head>', `${headInjection}\n</head>`);

    // Inject initial static markup inside <div id="root"></div>
    html = html.replace('<div id="root"></div>', `<div id="root">${bodyInjection}</div>`);

    const targetDir = path.join(DIST_DIR, 'cleaning-services', slug);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetFile, html, 'utf-8');
    console.log(`[Prerender] Created static route: dist/cleaning-services/${slug}/index.html`);
  });

  // 2. Build / Update Static 404 Page (with noindex header)
  const file404Path = path.join(DIST_DIR, '404.html');
  let html404 = fs.existsSync(file404Path) ? fs.readFileSync(file404Path, 'utf-8') : baseTemplate;

  if (!html404.includes('noindex')) {
    html404 = html404.replace('</head>', `<meta name="robots" content="noindex, nofollow" />\n</head>`);
  }

  fs.writeFileSync(file404Path, html404, 'utf-8');
  console.log(`[Prerender] Created/Updated dist/404.html with noindex directive.`);
}

prerender();
