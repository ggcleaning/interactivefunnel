
import { qualifyServiceZip } from '../../src/utils/zipValidation.js';

export const handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { data = {}, type } = JSON.parse(event.body || '{}');

        // Server-Authoritative ZIP Qualification Check
        const zipCode = data.zipCode || data.zip_code || data.zip || '';
        if (zipCode) {
            const zipCheck = qualifyServiceZip(zipCode);
            if (!zipCheck.isServiceable) {
                console.warn(`[crm-proxy] Rejected out-of-area CRM proxy submission for ZIP "${zipCode}"`);
                return {
                    statusCode: 422,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'OUTSIDE_SERVICE_AREA',
                        code: 'OUTSIDE_SERVICE_AREA',
                        message: 'We currently serve homes and businesses across Nassau and Suffolk counties on Long Island.',
                        details: { normalizedZip: zipCheck.normalizedZip, status: zipCheck.status, isServiceable: zipCheck.isServiceable }
                    })
                };
            }
        }

        // Fetch Webhook URLs from SERVER-SIDE environment variables
        // (No VITE_ prefix = not baked into frontend JS)
        const BOOKING_URL = process.env.GHL_BOOKING_WEBHOOK_URL || process.env.GHL_WEBHOOK_URL;
        const QUOTE_URL   = process.env.GHL_QUOTE_WEBHOOK_URL || BOOKING_URL;
        const FB_ADS_URL  = process.env.GHL_FB_ADS_WEBHOOK_URL;
        const UNIFIED_URL = process.env.GHL_WEBHOOK_URL || QUOTE_URL;
        const MOTHERS_DAY_URL = process.env.GHL_MOTHERS_DAY_WEBHOOK_URL || UNIFIED_URL;

        // Determine which webhook to use
        const storedSource = data.source || 'GG Cleaning Concierge';
        const isFacebook = storedSource.toLowerCase().includes('facebook');

        let targetUrl = isFacebook && FB_ADS_URL ? FB_ADS_URL : UNIFIED_URL;
        
        // Overrides based on explicit type
        if (type === 'booking_confirmed') targetUrl = BOOKING_URL;
        if (type === 'quote_requested') targetUrl = QUOTE_URL;
        if (type === 'mothers_day_lead') targetUrl = MOTHERS_DAY_URL;

        if (!targetUrl) {
            console.error('[CRM Proxy] No target URL configured for type:', type);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'CRM webhook environment variable is missing' })
            };
        }

        console.log(`[CRM Proxy] Forwarding ${type} event to CRM...`);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                console.error(`[CRM Proxy] CRM Webhook returned status ${response.status}`);
                return {
                    statusCode: 502,
                    headers,
                    body: JSON.stringify({ success: false, error: 'CRM forwarding failed' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Lead forwarded to CRM' })
            };
        } catch (fetchError) {
            console.error('[CRM Proxy] Fetch error:', fetchError);
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ success: false, error: 'CRM forwarding failed' })
            };
        }

    } catch (error) {
        console.error('[CRM Proxy] Error parsing body or internal error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'CRM forwarding failed' })
        };
    }
};

