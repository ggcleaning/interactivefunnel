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

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
            throw new Error(result.error || `Proxy returned status ${response.status}`);
        }

        console.log(`[CRM] Successfully sent ${type} event via proxy`);

        // Fire standard frontend Facebook Pixel event if available (unless skipped)
        if (typeof window !== 'undefined' && window.fbq && !data.skipMetaLead) {
            window.fbq('track', 'Lead', {
                value: payload.value || 180,
                currency: 'USD'
            });
        }

        return { success: true };
    } catch (error) {
        console.error('[CRM] Error sending data to proxy, trying fallback:', error);
        
        // Dynamic EmailJS fallback to prevent lead loss
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
            try {
                console.log('[CRM Fallback] Forwarding lead via EmailJS...');
                const emailjs = await import('@emailjs/browser');
                
                const notesContent = `[CRM FALLBACK] - CRM Webhook Failed to Forward Lead.
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


