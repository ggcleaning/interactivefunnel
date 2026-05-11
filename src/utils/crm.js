/**
 * G&G Cleaning Services - Lead Capture Utility
 * Connects the frontend to GHL via Webhooks.
 * 
 * Includes Meta CAPI deduplication support:
 * - Automatically reads _fbp and _fbc cookies
 * - Passes event_id through to GHL so server matches browser events
 */

import { getFbp, getFbc } from './metaTracking';

const BOOKING_WEBHOOK_URL = import.meta.env.VITE_GHL_BOOKING_WEBHOOK_URL || import.meta.env.VITE_GHL_WEBHOOK_URL;
const QUOTE_WEBHOOK_URL   = import.meta.env.VITE_GHL_QUOTE_WEBHOOK_URL;
const FB_ADS_WEBHOOK_URL  = import.meta.env.VITE_GHL_FB_ADS_WEBHOOK_URL;
const INTERNAL_WEBHOOK_URL = import.meta.env.VITE_GHL_INTERNAL_WEBHOOK_URL;

// Single unified public webhook — all website forms (quote, booking, commercial, chat)
// use this URL. Only Facebook Ads leads use the separate FB_ADS_WEBHOOK_URL.
const UNIFIED_PUBLIC_WEBHOOK =
    QUOTE_WEBHOOK_URL || BOOKING_WEBHOOK_URL || import.meta.env.VITE_GHL_WEBHOOK_URL;

/**
 * Sends lead or booking data to the configured Webhook (GHL).
 * Automatically enriches every payload with fbp, fbc, and event_id
 * for Meta CAPI deduplication.
 * 
 * @param {Object} data - The payload to send (event_id should be included for dedup).
 * @param {string} type - The type of event (e.g., 'lead_capture', 'booking_confirmed').
 */
export const sendToCRM = async (data, type = 'lead_capture') => {
    // Check if the lead came from Facebook (stored in sessionStorage by App.jsx)
    const storedSource = typeof window !== 'undefined' ? sessionStorage.getItem('lead_source') : null;
    const isFacebook = storedSource === 'facebook' || data.source === 'facebook';

    // All public forms → unified webhook. Facebook-sourced leads → FB Ads webhook.
    let webhookUrl = isFacebook && FB_ADS_WEBHOOK_URL
        ? FB_ADS_WEBHOOK_URL
        : UNIFIED_PUBLIC_WEBHOOK;

    if (!webhookUrl) {
        console.error(`[Lead Capture] FATAL: No webhook URL configured for event type: ${type}.`, data);
        return { success: false, error: 'No webhook URL' };
    }


    // ── Meta CAPI Enrichment ──────────────────────────────────────────────────
    const fbp = data.fbp || getFbp();
    const fbc = data.fbc || getFbc();

    // ── GHL Field Mirroring ───────────────────────────────────────────────────
    const enrichedData = {
        ...data,
        "Full Name": data.name || (data.firstName ? `${data.firstName} ${data.lastName}` : data.contactName),
        "Full name": data.name || (data.firstName ? `${data.firstName} ${data.lastName}` : data.contactName),
        "Phone number": data.phone,
        "Phone Number": data.phone,
        "Email Address": data.email,
        "Email": data.email,
        "Business Name": data.businessName,
        "Property Type": data.propertyType || data.serviceCategory || data.commercialPropertyType,
        "Facility Type": data.commercialPropertyType,
        "Square Footage": data.sqft,
        "Cleaning Frequency": data.commercialFrequency || data.frequency,
        "Target Visit Price": data.quoteTotal || data.perVisitTotal || data.exact,
        "Total Monthly Value": data.monthlyTotal || data.ongoingMonthlyTotal,
        "Value": data.value || data.quoteTotal || data.exact || (type === 'lead_capture' ? 180 : 0),
        "Currency": data.currency || 'USD',
        "value": data.value || data.quoteTotal || data.exact || (type === 'lead_capture' ? 180 : 0),
        "currency": data.currency || 'USD',
        "campaign": data.utm_campaign || data.campaign,
        "adset": data.ad_set || data.adset,
        "content": data.utm_content || data.content,
        "source": data.source || 'GG Cleaning Concierge',
        "event_type": type,
        "timestamp": new Date().toISOString(),
        "fbp": fbp || undefined,
        "fbc": fbc || undefined,

        // --- Concierge Operational Intelligence ---
        "Clutter Level": data.clutterLevel,
        "Has Pets": data.hasPets ? 'Yes' : 'No',
        "Elevator Access": data.hasElevator ? 'Yes' : 'No',
        "Floor Level": data.floorLevel,
        "Parking Info": data.parkingType,
        "Bedrooms": data.bedrooms,
        "Bathrooms": data.bathrooms,
        "Estimate Range": data.min && data.max ? `$${data.min} - $${data.max}` : undefined,
        "Confidence Score": data.confidence,

        "tags": [
            ...(data.tags || []),
            ...(type === 'commercial_quote' ? ['Commercial-Quote'] : []),
            ...(type === 'concierge_lead' ? ['Concierge-Funnel', 'Warm-Lead'] : [])
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrichedData),
        });

        if (!response.ok) {
            throw new Error(`Webhook error: ${response.statusText}`);
        }

        console.log(`[Lead Capture] Successfully sent ${type} event to ${webhookUrl.split('/').pop()}`, { 
            name: data.name || data.contactName,
            email: data.email
        });

        // Option 1: Fire standard frontend Facebook Pixel event
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'Lead', {
                value: enrichedData.value,
                currency: 'USD'
            });
            console.log('[Meta Pixel] Fired frontend Lead event');
        }

        // Option 2: Fire Server-Side API Event (Facebook Conversions API)
        // We trigger our Netlify background function to securely send the payload
        try {
            // Helper to extract cookies for advanced matching (fbp, fbc)
            const getCookie = (name) => {
                if (typeof document === 'undefined') return null;
                const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                return match ? match[2] : null;
            };

            const fullName = data.name || data.contactName || '';
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            fetch('/.netlify/functions/fb-capi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    phone: data.phone,
                    firstName: firstName,
                    lastName: lastName,
                    city: data.city || '',
                    state: data.state || '',
                    zip: data.zipCode || data.zip || '',
                    fbp: getCookie('_fbp'),
                    fbc: getCookie('_fbc'),
                    value: enrichedData.value,
                    event_type: type
                })
            }).catch(err => console.error('[FB CAPI] Background fetch failed', err));
        } catch (e) {
            // Non-blocking error
        }

        return { success: true };
    } catch (error) {
        console.error('[Lead Capture] Error sending data:', error);
        return { success: false, error: error.message };
    }
};

// Maintain compatibility for older imports
export const sendToGHL = sendToCRM;

/**
 * Sends an internal staff quote to the robust GHL Sync service.
 * This ensures the quote is saved to Supabase and synced to GHL V2 API
 * with proper deduplication and ID tracking.
 *
 * @param {Object} quoteData - Full quote payload from the internal quote desk.
 * @param {string} internalQuoteId - Existing ID if updating a saved quote.
 * @param {boolean} forceNew - Force create a new quote ID.
 */
export const sendInternalQuote = async (payload, internalQuoteId = null) => {
    const ADMIN_SECRET = import.meta.env.VITE_INTERNAL_ADMIN_SECRET;

    // Handle both legacy (unstructured) and new (structured) payloads
    const body = payload.quoteData && payload.customerData 
        ? { ...payload, internalQuoteId: internalQuoteId || payload.internalQuoteId }
        : {
            quoteData: payload,
            customerData: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
                address: payload.address,
                city: payload.city,
                zipCode: payload.zipCode
            },
            internalQuoteId
          };

    try {
        const response = await fetch('/.netlify/functions/ghl-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-secret': ADMIN_SECRET
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Sync error: ${response.statusText}`);
        }

        console.log(`[Internal Quote Desk] Sync/Save successful:`, result);
        return result;
    } catch (error) {
        console.error('[Internal Quote Desk] Operation failed:', error);
        return { success: false, error: error.message };
    }
};
/**
 * Generates a branded document (proposal/agreement) and stores it in Supabase
 * @param {string} internalQuoteId 
 * @param {string} documentType 'proposal' | 'agreement'
 */
export const generateDocument = async (internalQuoteId, documentType) => {
  const adminSecret = import.meta.env.VITE_INTERNAL_ADMIN_SECRET;
  
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
 * Fetches a saved quote by its internal ID
 * @param {string} internalQuoteId 
 */
export const fetchQuote = async (internalQuoteId) => {
    const ADMIN_SECRET = import.meta.env.VITE_INTERNAL_ADMIN_SECRET;
    
    try {
        const response = await fetch('/.netlify/functions/ghl-sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-secret': ADMIN_SECRET
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
