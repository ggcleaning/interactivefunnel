/**
 * G&G Cleaning Services - Lead Capture Utility
 * Connects the frontend to durable lead persistence via a secure server-side function.
 * 
 * Phase 1: Routes through persist-lead.js for atomic Supabase persistence + CRM queue.
 * Legacy crm-proxy is retained as an emergency fallback only.
 * 
 * IMPORTANT: sendToCRM no longer fires window.fbq.
 * Each calling component is responsible for its own Meta pixel events
 * using trackConversion() from metaTracking.js with a shared meta_event_id.
 */

import { getFbp, getFbc } from './metaTracking';

/**
 * Sends lead or booking data to the durable persist-lead function.
 * Falls back to EmailJS if the server is unreachable.
 * 
 * @param {Object} data - The payload to send.
 * @param {string} type - The type of event ('concierge_lead', 'booking_confirmed', etc.).
 * @returns {{ success: boolean, lead_id?: string, fallback?: boolean, error?: string }}
 */
export const sendToCRM = async (data, type = 'lead_capture') => {
    // 1. Meta CAPI Enrichment — attach browser cookies for server-side deduplication
    const fbp = data.fbp || getFbp();
    const fbc = data.fbc || getFbc();

    // 2. Prepare Enriched Payload
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
        // Route to durable persistence endpoint (Phase 1 transport)
        const response = await fetch('/.netlify/functions/persist-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload, type }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
            throw new Error(result.error || `Server returned status ${response.status}`);
        }

        console.log(`[CRM] Successfully sent ${type} event. Lead ID: ${result.lead_id || 'N/A'}`);

        // NOTE: window.fbq is NOT called here.
        // Each calling component handles its own Meta pixel events
        // using trackConversion() with a shared meta_event_id.

        return { success: true, lead_id: result.lead_id, lead_uuid: result.lead_uuid };
    } catch (error) {
        console.error('[CRM] Error sending data to server, trying fallback:', error);
        
        // Dynamic EmailJS fallback to prevent lead loss
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
            try {
                console.log('[CRM Fallback] Forwarding lead via EmailJS...');
                const emailjs = await import('@emailjs/browser');
                
                const notesContent = `[CRM FALLBACK] - Server-side persistence failed.
Step Reached: ${payload.step_reached || 'N/A'}
Quote Session ID: ${payload.quote_session_id || payload.internal_quote_id || 'N/A'}
Timestamp: ${payload.timestamp}
Page URL: ${payload.page_url || (typeof window !== 'undefined' ? window.location.href : 'N/A')}

UTM Tracking:
- Source: ${payload.utm_source || 'N/A'}
- Medium: ${payload.utm_medium || 'N/A'}
- Campaign: ${payload.utm_campaign || 'N/A'}

Completed Answers:
- Bedrooms: ${payload.bedrooms || 'N/A'}
- Bathrooms: ${payload.bathrooms || 'N/A'}
- Sqft Size: ${payload.sqft || 'N/A'}
- Service Type: ${payload.serviceCategory || payload.serviceType || 'N/A'}
- Frequency: ${payload.frequency || 'N/A'}
- Pets: ${payload.hasPets ? 'Yes' : 'No'}
- Clutter Level: ${payload.clutterLevel || 'N/A'}
- Additional Notes: ${payload.notes || 'None'}`;

                await emailjs.default.send(
                    serviceId,
                    templateId,
                    {
                        from_name: payload["Full Name"] || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'Web Lead',
                        from_email: payload["Email Address"] || payload.email || '',
                        phone: payload["Phone Number"] || payload.phone || '',
                        service_type: payload.serviceCategory || payload.serviceType || 'Not specified',
                        zip_code: payload.zip_code || payload.zipCode || '',
                        notes: notesContent,
                        to_name: 'G&G Cleaning Services'
                    },
                    publicKey
                );
                console.log('[CRM Fallback] Fallback email sent successfully.');
                return { success: true, fallback: true };
            } catch (emailjsError) {
                console.error('[CRM Fallback] EmailJS sending failed:', emailjsError);
            }
        } else {
            console.warn('[CRM Fallback] EmailJS environment variables are missing; cannot run fallback.');
        }

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


