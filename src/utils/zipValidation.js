/**
 * G&G Cleaning Services — Canonical Service Area Qualification Engine
 * Server-authoritative and client-side ZIP qualification logic.
 * 
 * Strict Input Requirements:
 * - Accepts exactly 5 digits (e.g., "11530") or ZIP+4 with hyphen (e.g., "11530-1234").
 * - Rejects internal spaces ("115 30"), letters ("1153a"), partials ("115"), arbitrary punctuation ("11530!"),
 *   or malformed 9-digit formats ("115301234" or "11530-12").
 * - Determines eligibility solely from LONG_ISLAND_ZIP_REGISTRY. Never lets preferred_area override eligibility.
 */

import { LONG_ISLAND_ZIP_REGISTRY } from './zipRegistry.js';

/**
 * Validates raw ZIP code format strictly and extracts normalized 5-digit string.
 * @param {string|number} input 
 * @returns {{ isValid: boolean, normalizedZip: string }}
 */
export function validateAndNormalizeZipFormat(input) {
  if (input === null || input === undefined) {
    return { isValid: false, normalizedZip: '' };
  }

  const str = String(input).trim();

  // Pattern 1: Exactly 5 digits
  if (/^\d{5}$/.test(str)) {
    return { isValid: true, normalizedZip: str };
  }

  // Pattern 2: Exactly 9 digits in ZIP+4 hyphenated format (12345-6789)
  if (/^\d{5}-\d{4}$/.test(str)) {
    return { isValid: true, normalizedZip: str.split('-')[0] };
  }

  // All other formats (internal spaces, letters, partials, punctuation, unhyphenated 9-digits) are invalid
  return { isValid: false, normalizedZip: '' };
}

/**
 * Qualifies a ZIP code against the deterministic service-area registry.
 * 
 * @param {string|number} rawZip 
 * @param {string} [_ignoredPreferredArea] - Never overrides operational ZIP eligibility
 * @returns {{
 *   normalizedZip: string,
 *   status: 'ELIGIBLE' | 'INVALID_ZIP' | 'OUTSIDE_SERVICE_AREA',
 *   county: string | null,
 *   marketArea: string | null,
 *   internalReason: 'OUT_OF_COUNTY' | 'OUT_OF_STATE' | 'UNKNOWN_ZIP' | 'MALFORMED' | null,
 *   isServiceable: boolean
 * }}
 */
export function qualifyServiceZip(rawZip, _ignoredPreferredArea = null) {
  const { isValid, normalizedZip } = validateAndNormalizeZipFormat(rawZip);

  if (!isValid) {
    return {
      normalizedZip: '',
      status: 'INVALID_ZIP',
      county: null,
      marketArea: null,
      internalReason: 'MALFORMED',
      isServiceable: false
    };
  }

  // Lookup in operational registry
  const match = LONG_ISLAND_ZIP_REGISTRY[normalizedZip];
  if (match) {
    return {
      normalizedZip,
      status: 'ELIGIBLE',
      county: match.county,
      marketArea: match.marketArea,
      internalReason: null,
      isServiceable: true
    };
  }

  // Classify out-of-area reason for internal analytics
  const numericZip = parseInt(normalizedZip, 10);
  let internalReason = 'OUT_OF_COUNTY';

  const isNyZip = (numericZip >= 10000 && numericZip <= 14999);
  if (!isNyZip) {
    internalReason = 'OUT_OF_STATE';
  } else if (
    (numericZip >= 10000 && numericZip <= 10499) || // Manhattan, Bronx, Staten Island
    (numericZip >= 11100 && numericZip <= 11499)    // Brooklyn & Queens
  ) {
    internalReason = 'OUT_OF_COUNTY';
  } else if (numericZip >= 10500 && numericZip <= 10999) {
    // Westchester, Rockland, Dutchess, Putnam
    internalReason = 'OUT_OF_COUNTY';
  } else {
    internalReason = 'UNKNOWN_ZIP';
  }

  return {
    normalizedZip,
    status: 'OUTSIDE_SERVICE_AREA',
    county: null,
    marketArea: null,
    internalReason,
    isServiceable: false
  };
}
