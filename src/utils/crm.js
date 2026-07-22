/**
 * G&G Cleaning Services - Lead Capture & Staff Quote Utility
 * Connects the frontend to durable lead persistence and staff quote management.
 */

import { getFbp, getFbc } from './metaTracking';
import { staffApiFetch } from '../lib/staffApiClient';

/**
 * Sends lead or booking data to the durable persist-lead function.
 * Falls back to EmailJS if the server is unreachable.
 * 
 * @param {Object} data - The payload to send.
 * @param {string} type - The type of event ('concierge_lead', 'booking_confirmed', etc.).
 * @returns {{ success: boolean, lead_id?: string, fallback?: boolean, error?: string }}
 */
export const sendToCRM = async (data, type = 'lead_capture') => {
    const fbp = data.fbp || getFbp();
    const fbc = data.fbc || getFbc();

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
        return { success: true, lead_id: result.lead_id, lead_uuid: result.lead_uuid };
    } catch (error) {
        console.error('[CRM] Error sending data to server, trying fallback:', error);
        
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
        }

        return { success: false, error: error.message };
    }
};

export const sendToGHL = sendToCRM;

/**
 * Sends an internal staff quote using verified staff Bearer JWT authorization.
 */
export const sendInternalQuote = async (payload, _unusedSecret = null, internalQuoteId = null) => {
    const body = {
        ...payload,
        internalQuoteId: internalQuoteId || payload.internalQuoteId
    };

    try {
        const result = await staffApiFetch('/.netlify/functions/ghl-sync', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        return result;
    } catch (error) {
        console.error('[Internal Quote] Operation failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generates a branded document via backend using verified staff Bearer JWT authorization.
 */
export const generateDocument = async (internalQuoteId, documentType) => {
    return await staffApiFetch('/.netlify/functions/generate-document', {
        method: 'POST',
        body: JSON.stringify({ internalQuoteId, documentType })
    });
};

/**
 * Fetches a saved quote using verified staff Bearer JWT authorization.
 */
export const fetchQuote = async (internalQuoteId) => {
    try {
        const result = await staffApiFetch('/.netlify/functions/ghl-sync', {
            method: 'POST',
            body: JSON.stringify({ 
                internalQuoteId,
                action: 'get_quote'
            }),
        });

        return result;
    } catch (error) {
        console.error('[CRM Utils] fetchQuote failed:', error);
        return { success: false, error: error.message };
    }
};
