import { getSupabaseClient } from './utils/supabaseClient.js';
import { qualifyServiceZip } from '../../src/utils/zipValidation.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { email, phone = '', zipCode = '', zip = '', marketingConsent } = body;

        const rawZip = String(zipCode || zip || '').trim();
        const rawEmail = String(email || '').trim().toLowerCase();
        const rawPhone = String(phone || '').trim();

        // 1. Validation & Field Length Limits
        if (!rawEmail || !rawZip) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    error: 'Email address and ZIP code are required for waitlist submission.'
                })
            };
        }

        if (rawEmail.length > 255 || rawPhone.length > 30 || rawZip.length > 10) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    error: 'Submitted fields exceed allowable length limits.'
                })
            };
        }

        // 2. ZIP Qualification Check
        const zipCheck = qualifyServiceZip(rawZip);

        if (zipCheck.status === 'ELIGIBLE') {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    code: 'ZIP_IS_ELIGIBLE',
                    error: `ZIP code ${zipCheck.normalizedZip} is in our active Nassau & Suffolk County service area! Please request a quote directly.`
                })
            };
        }

        if (zipCheck.status === 'INVALID_ZIP') {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    code: 'INVALID_ZIP',
                    error: 'Please enter a valid 5-digit US ZIP code.'
                })
            };
        }

        // 3. Affirmative Consent Requirement
        if (marketingConsent !== true) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    code: 'CONSENT_REQUIRED',
                    error: 'Affirmative consent is required to receive waitlist expansion updates.'
                })
            };
        }

        // 4. Persistence to gg_service_area_waitlist
        let supabase = null;
        try {
            supabase = getSupabaseClient();
        } catch (clientErr) {
            console.warn('[submit-waitlist] Supabase client initialization warning:', clientErr.message);
        }

        if (supabase) {
            const { error: dbError } = await supabase
                .from('gg_service_area_waitlist')
                .insert({
                    email: rawEmail,
                    phone: rawPhone || null,
                    zip_code: zipCheck.normalizedZip || rawZip,
                    marketing_consent: true,
                    consent_timestamp: new Date().toISOString(),
                    consent_policy_version: 'v1.0-2026',
                    ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'] || null,
                    user_agent: event.headers['user-agent'] || null
                });

            if (dbError) {
                // Deduplication: unique_waitlist_email_zip conflict (PostgreSQL code 23505)
                if (dbError.code === '23505' || dbError.message.includes('unique')) {
                    console.log('[submit-waitlist] Deduplicated entry for waitlist request');
                } else {
                    console.error('[submit-waitlist] Supabase insert error:', dbError.message);
                }
            }
        } else {
            console.warn('[submit-waitlist] Supabase client unavailable for waitlist insert.');
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                message: 'Thank you! You have been added to our service expansion waitlist. We will notify you when G&G expands to your area.'
            })
        };
    } catch (err) {
        console.error('[submit-waitlist] Handler error:', err.message);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: false,
                error: 'An unexpected error occurred. Please try again.'
            })
        };
    }
};
