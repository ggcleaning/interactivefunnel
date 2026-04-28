const crypto = require('crypto');

// Function to hash user data as required by Meta CAPI
const hashData = (data) => {
    if (!data) return null;
    return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        
        // Configuration from Netlify Environment Variables
        // You MUST add these inside your Netlify Dashboard -> Site settings -> Environment variables
        const PIXEL_ID = process.env.VITE_FB_PIXEL_ID;
        const ACCESS_TOKEN = process.env.FB_CAPI_ACCESS_TOKEN;

        if (!PIXEL_ID || !ACCESS_TOKEN) {
            console.error('[FB CAPI] Missing Pixel ID or Access Token in Netlify config.');
            return { statusCode: 500, body: JSON.stringify({ error: 'Missing CAPI configuration' }) };
        }

        // Prepare the payload according to the JSON structure provided by the user
        const payload = {
            data: [
                {
                    event_name: 'Lead',
                    event_time: Math.floor(Date.now() / 1000), // Current time in seconds
                    action_source: 'system_generated', // or 'website'
                    user_data: {
                        em: body.email ? [hashData(body.email)] : [],
                        ph: body.phone ? [hashData(body.phone.replace(/\D/g, ''))] : [],
                        // If you have a lead ID, you can pass it here
                        // lead_id: body.lead_id
                    },
                    custom_data: {
                        event_source: 'crm',
                        lead_event_source: 'Your CRM',
                        value: body.value || 0,
                        currency: 'USD'
                    }
                }
            ]
        };

        // Send to Facebook Graph API
        const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[FB CAPI] Meta API Error:', result);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to send event to Meta', details: result })
            };
        }

        console.log('[FB CAPI] Successfully sent server-side Lead event:', result);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'CAPI Lead Event Sent', result })
        };

    } catch (error) {
        console.error('[FB CAPI] Internal Server Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
