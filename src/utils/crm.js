/**
 * G&G Cleaning Services - Lead Capture Utility
 * Connects the frontend to GHL via a secure server-side proxy.
 * 
 * This prevents GHL Webhook URLs from being baked into the frontend bundle,
 * resolving Netlify Secrets Scanning build failures.
 */

import { getFbp, getFbc } from './metaTracking';

/**
 * Sends lead or booking data to our secure Netlify proxy function.
 * 
 * @param {Object} data - The payload to send.
 * @param {string} type - The type of event ('concierge_lead', 'booking_confirmed', etc.).
 */
export const sendToCRM = async (data, type = 'lead_capture') => {
    // 1. Meta CAPI Enrichment
    const fbp = data.fbp || getFbp();
    const fbc = data.fbc || getFbc();

    // 2. Prepare Enriched Payload for Proxy
    const payload = {
        ...data,
        "Full Name": data.name || (data.firstName ? `${data.firstName} ${data.lastName}` : data.contactName),
        "Phone Number": data.phone,
        "Email Address": data.email,
        "timestamp": new Date().toISOString(),
        "fbp": fbp || undefined,
        "fbc": fbc || undefined,
        "tags": [
            ...(data.tags || []),
            ...(type === 'commercial_quote' ? ['Commercial-Quote'] : []),
            ...(type === 'concierge_lead' ? ['Concierge-Funnel', 'Warm-Lead'] : [])
        ],
    };

    try {
        // Call our SECURE server-side proxy instead of GHL directly
        const response = await fetch('/.netlify/functions/crm-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload, type }),
        });

        if (!response.ok) {
            throw new Error(`Proxy error: ${response.statusText}`);
        }

        console.log(`[CRM] Successfully sent ${type} event via proxy`);

        // Fire standard frontend Facebook Pixel event if available
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'Lead', {
                value: payload.value || 180,
                currency: 'USD'
            });
        }

        return { success: true };
    } catch (error) {
        console.error('[CRM] Error sending data:', error);
        return { success: false, error: error.message };
    }
};

// Maintain compatibility for older imports
export const sendToGHL = sendToCRM;

/**
 * Sends an internal staff quote to the robust GHL Sync service.
 * Authentication relies on the adminSecret passed from the UI (entered by staff).
 */
export const sendInternalQuote = async (payload, adminSecret, internalQuoteId = null) => {
    const body = {
        ...payload,
        internalQuoteId: internalQuoteId || payload.internalQuoteId
    };

    try {
        const response = await fetch('/.netlify/functions/ghl-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-secret': adminSecret
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Sync error: ${response.status}`);

        return result;
    } catch (error) {
        console.error('[Internal Quote] Operation failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generates a branded document via backend.
 * Requires adminSecret from UI.
 */
export const generateDocument = async (internalQuoteId, documentType, adminSecret) => {
  const response = await fetch('/.netlify/functions/generate-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret
    },
    body: JSON.stringify({ internalQuoteId, documentType })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate document');
  return data;
};

/**
 * Fetches a saved quote.
 * Requires adminSecret from UI.
 */
export const fetchQuote = async (internalQuoteId, adminSecret) => {
    try {
        const response = await fetch('/.netlify/functions/ghl-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-secret': adminSecret
            },
            body: JSON.stringify({ 
                internalQuoteId,
                action: 'get_quote'
            }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to fetch quote');
        return result;
    } catch (error) {
        console.error('[CRM Utils] fetchQuote failed:', error);
        return { success: false, error: error.message };
    }
};


