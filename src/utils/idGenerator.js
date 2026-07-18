/**
 * Generates a stable internal quote ID in the format GGQ-YYYY-XXXXXX
 * @returns {string}
 */
export const generateInternalQuoteId = () => {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `GGQ-${year}-${randomPart}`;
};

/**
 * Validates if a string is a valid Internal Quote ID
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidQuoteId = (id) => {
  return /^GGQ-\d{4}-\d{6}$/.test(id);
};

/**
 * Generates a canonical lead ID in the format GGL-YYYYMMDD-XXXXXX
 * Used as the human-readable lead identifier stored in gg_leads.lead_id
 * @returns {string}
 */
export const generateLeadId = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `GGL-${yyyy}${mm}${dd}-${rand}`;
};

/**
 * Generates a unique request ID (UUID v4) for submission idempotency.
 * 
 * Semantics:
 *   - One request_id per actual form submission attempt
 *   - Browser retry of same submission reuses the request_id
 *   - Netlify retry reuses the request_id
 *   - Double-click converges safely (same request_id)
 *   - A new estimate from the same customer → new request_id
 *   - A new booking from the same customer → new request_id
 * 
 * Generate once per form submission, store in component state,
 * and pass to sendToCRM. If the server doesn't receive one,
 * it generates a UUID server-side (but browser-side is preferred).
 * 
 * @returns {string} UUID v4
 */
export const generateRequestId = () => {
  return crypto.randomUUID();
};

/**
 * Generates a stable funnel session ID (UUID v4).
 * Used to link multiple events within one pricing/quote session.
 * Should be generated once when a funnel starts and reused
 * across all steps within that funnel.
 * 
 * @returns {string} UUID v4
 */
export const generateFunnelSessionId = () => {
  return crypto.randomUUID();
};
