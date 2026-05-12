
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
        const { data, type } = JSON.parse(event.body);

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
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, error: 'CRM Webhook not configured' })
            };
        }

        console.log(`[CRM Proxy] Forwarding ${type} event to GHL...`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GHL Webhook returned ${response.status}: ${errorText}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('[CRM Proxy] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
