/**
 * G&G Cleaning Services - Meta Tracking Utility
 * 
 * This file handles the synchronization between:
 * - Meta Browser Pixel (fbq)
 * - GoHighLevel Server-Side CAPI
 * 
 * The key to deduplication is sending the SAME event_id in both places.
 */

/**
 * Generate a unique Event ID for deduplication.
 * This ID must be sent to BOTH fbq (browser) and GHL webhook (server).
 * @returns {string} A unique string like "gg_Lead_1713200000000_abc12"
 */
export const generateEventId = (eventName = 'event') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `gg_${eventName}_${timestamp}_${random}`;
};

/**
 * Read the _fbp cookie (Facebook Browser ID).
 * Set automatically by the Meta Pixel when it loads.
 * Critical for server-side matching quality.
 * @returns {string|null}
 */
export const getFbp = () => {
    try {
        const match = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/);
        return match ? match[2] : null;
    } catch {
        return null;
    }
};

/**
 * Read the _fbc cookie (Facebook Click ID).
 * Set when a user clicks a Facebook Ad (contains the fbclid URL parameter).
 * Critical for connecting ad clicks to conversions.
 * @returns {string|null}
 */
export const getFbc = () => {
    try {
        // First, try reading the _fbc cookie (set by Meta Pixel automatically)
        const cookieMatch = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/);
        if (cookieMatch) return cookieMatch[2];

        // Fallback: Build fbc from fbclid URL parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        const fbclid = urlParams.get('fbclid');
        if (fbclid) {
            const subdomain = 1;
            const creationTime = Math.floor(Date.now() / 1000);
            return `fb.${subdomain}.${creationTime}.${fbclid}`;
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * The unified tracking function.
 * Fires the browser pixel AND returns metadata to attach to the GHL webhook payload.
 * 
 * Usage:
 *   const trackingMeta = trackConversion('Lead', { content_name: 'Deep Clean' });
 *   // Then pass trackingMeta into sendToCRM so GHL has the same event_id
 * 
 * @param {string} eventName - Meta standard event name (e.g., 'Lead', 'Purchase')
 * @param {Object} pixelParams - Additional parameters for the browser pixel
 * @returns {{ event_id: string, fbp: string|null, fbc: string|null }}
 */
export const trackConversion = (eventName, pixelParams = {}) => {
    const event_id = generateEventId(eventName);
    const fbp = getFbp();
    const fbc = getFbc();

    // Enforce required Meta CAPI fields: Value and Currency
    // Default to USD if not provided
    const currency = pixelParams.currency || 'USD';
    
    // Default values for common events to satisfy Meta requirements
    let value = pixelParams.value;
    if (value === undefined || value === null) {
        if (eventName === 'Lead') value = 180; // Baseline lead value
        if (eventName === 'Purchase') value = 0;
    }

    const finalParams = {
        ...pixelParams,
        value,
        currency
    };

    // Fire the browser-side pixel with the event_id
    if (window.fbq) {
        window.fbq('track', eventName, finalParams, { eventID: event_id });
    }

    // Return the metadata so it can be sent to GHL (server side)
    // We include value/currency so the server-side event matches the browser-side exactly
    return { event_id, fbp, fbc, value, currency };
};
