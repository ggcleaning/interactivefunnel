import { getSupabaseClient } from './utils/supabaseClient.js';
import { qualifyServiceZip } from '../../src/utils/zipValidation.js';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// G&G Cleaning — persist-lead.js
// Canonical lead-capture endpoint. Drop-in replacement for crm-proxy.
// Atomically persists lead + queue + activity log via Supabase RPC.
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateLeadId() {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `GGL-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Forward lead data directly to the primary GHL webhook (legacy fallback).
 * Used only when Supabase persistence is disabled or unavailable.
 */
async function forwardToGHL(data, eventType) {
    const BOOKING_URL = process.env.GHL_BOOKING_WEBHOOK_URL || process.env.GHL_WEBHOOK_URL;
    const QUOTE_URL   = process.env.GHL_QUOTE_WEBHOOK_URL || BOOKING_URL;
    const FB_ADS_URL  = process.env.GHL_FB_ADS_WEBHOOK_URL;
    const UNIFIED_URL = process.env.GHL_WEBHOOK_URL || QUOTE_URL;

    const source = (data.source || '').toLowerCase();
    const isFacebook = source.includes('facebook');

    let targetUrl = isFacebook && FB_ADS_URL ? FB_ADS_URL : UNIFIED_URL;
    if (eventType === 'booking_confirmed') targetUrl = BOOKING_URL;
    if (eventType === 'quote_requested')   targetUrl = QUOTE_URL;

    if (!targetUrl) {
        console.error('[persist-lead] No GHL webhook URL configured for legacy fallback');
        return false;
    }

    try {
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(10000)
        });
        return res.ok;
    } catch (err) {
        console.error('[persist-lead] Legacy GHL forwarding failed:', err.message);
        return false;
    }
}

/**
 * Send emergency email via SMTP or fetch-based EmailJS API
 * when Supabase is entirely unavailable.
 */
async function sendEmergencyNotification(leadData, error) {
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
        console.error('[persist-lead] No OWNER_EMAIL configured for emergency notification');
        return false;
    }

    try {
        // Attempt EmailJS API as emergency notification channel
        const emailJsServiceId = process.env.EMAILJS_SERVICE_ID;
        const emailJsTemplateId = process.env.EMAILJS_EMERGENCY_TEMPLATE_ID;
        const emailJsPublicKey = process.env.EMAILJS_PUBLIC_KEY;

        if (emailJsServiceId && emailJsTemplateId && emailJsPublicKey) {
            const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: emailJsServiceId,
                    template_id: emailJsTemplateId,
                    user_id: emailJsPublicKey,
                    template_params: {
                        to_email: ownerEmail,
                        subject: `[G&G EMERGENCY] Lead persistence failed`,
                        lead_name: leadData.full_name || leadData.first_name || 'Unknown',
                        lead_email: leadData.email || 'N/A',
                        lead_phone: leadData.phone || 'N/A',
                        lead_source: leadData.source || 'N/A',
                        error_message: error?.message || 'Unknown error'
                    }
                }),
                signal: AbortSignal.timeout(5000)
            });
            return res.ok;
        }

        console.warn('[persist-lead] Emergency email channels not configured');
        return false;
    } catch (emailErr) {
        console.error('[persist-lead] Emergency notification failed:', emailErr.message);
        return false;
    }
}

/**
 * Parse the feature flag. Returns true for 'true', missing, or malformed.
 * Returns false only for explicit string 'false'.
 */
function featureEnabled(envVar, defaultVal = true) {
    const val = process.env[envVar];
    if (val === undefined || val === null || val === '') return defaultVal;
    return val.toLowerCase() !== 'false';
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { data = {}, type } = body;

        // -------------------------------------------------------------------
        // Normalize fields
        // -------------------------------------------------------------------
        const source     = data.source || type || 'unknown';
        const event_type = data.event_type || type || 'unknown';
        const firstName  = data.firstName || data.first_name || '';
        const lastName   = data.lastName || data.last_name || '';
        const fullName   = data.fullName || data.full_name || data.name || `${firstName} ${lastName}`.trim();
        const email      = data.email || null;
        const phone      = data.phone || null;

        // Require at least one contact field
        if (!email && !phone) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    error: 'At least one contact field (email or phone) is required'
                })
            };
        }

        // Server-Authoritative ZIP Enforcement
        const zipCode = data.zipCode || data.zip_code || data.zip || '';
        const zipCheck = qualifyServiceZip(zipCode);
        if (!zipCheck.isServiceable) {
            console.warn(`[persist-lead] Rejected out-of-area lead request. ZIP: "${zipCode}", Status: ${zipCheck.status}, Reason: ${zipCheck.internalReason}`);
            return {
                statusCode: 422,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    error: 'OUTSIDE_SERVICE_AREA',
                    code: 'OUTSIDE_SERVICE_AREA',
                    message: 'We currently serve homes and businesses across Nassau and Suffolk counties on Long Island. Try another ZIP or ask to be notified if we expand to your area.',
                    details: { normalizedZip: zipCheck.normalizedZip, status: zipCheck.status, isServiceable: zipCheck.isServiceable }
                })
            };
        }

        // IDs
        const lead_id          = data.lead_id || generateLeadId();
        const request_id       = data.request_id || crypto.randomUUID();
        const funnel_session_id = data.funnel_session_id || data.quoteSessionId || data.quote_session_id || null;
        const meta_event_id    = data.meta_event_id || data.event_id || null;

        // Feature flags
        const persistEnabled = featureEnabled('GG_FEATURE_SUPABASE_PERSIST', true);
        const queueEnabled   = featureEnabled('GG_FEATURE_CRM_QUEUE', true);
        const ghlEnabled     = featureEnabled('GG_FEATURE_GHL_SYNC', true);

        // -------------------------------------------------------------------
        // Build the CRM payload (matches the shape crm-proxy sends to GHL)
        // -------------------------------------------------------------------
        const crmPayload = {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
            email: email || '',
            source: source,
            event_type: event_type,
            lead_id: lead_id,
            request_id: request_id,
            timestamp: new Date().toISOString(),
            // Tracking
            fbp: data.fbp || '',
            fbc: data.fbc || '',
            meta_event_id: meta_event_id || '',
            // Service details
            service_type: data.service_type || data.serviceType || '',
            frequency: data.frequency || '',
            bedrooms: data.bedrooms || '',
            bathrooms: data.bathrooms || '',
            sqft: data.sqft || data.squareFootage || '',
            clutter_level: data.clutterLevel || data.clutter_level || '',
            has_pets: data.hasPets ?? data.has_pets ?? '',
            estimate_min: data.estimateMin || data.estimate_min || '',
            estimate_max: data.estimateMax || data.estimate_max || '',
            estimated_total: data.estimatedTotal || data.estimated_total || '',
            // Address
            zip_code: data.zipCode || data.zip_code || data.zip || '',
            address: data.address || data.address_line_1 || '',
            city: data.city || '',
            // UTM
            utm_source: data.utm_source || '',
            utm_medium: data.utm_medium || '',
            utm_campaign: data.utm_campaign || '',
            page_url: data.page_url || data.pageUrl || '',
            // Tags
            tags: data.tags || [source, event_type].filter(Boolean),
            // Stage
            lead_stage: data.lead_stage || data.leadStage || '',
            // Quote references
            internal_quote_id: data.internal_quote_id || data.internalQuoteId || '',
            quote_session_id: funnel_session_id || ''
        };

        // -------------------------------------------------------------------
        // PERSISTENCE IS ALWAYS ATTEMPTED.
        // GG_FEATURE_SUPABASE_PERSIST controls fallback behavior on RPC failure:
        //   true (default): RPC failure is non-fatal, forward to GHL as fallback
        //   false: RPC failure is FATAL — do NOT silently drop to GHL-only
        //          (used during migration/maintenance to surface errors)
        // There is no code path that silently returns to non-durable capture.
        // -------------------------------------------------------------------

        // -------------------------------------------------------------------
        // MAIN PATH: Atomic Supabase persistence via RPC
        // -------------------------------------------------------------------
        const supabase = getSupabaseClient();

        const rpcParams = {
            p_lead_id:            lead_id,
            p_request_id:         request_id,
            p_source:             source,
            p_event_type:         event_type,
            p_funnel_session_id:  funnel_session_id,
            p_lead_stage:         data.lead_stage || data.leadStage || null,
            p_first_name:         firstName || null,
            p_last_name:          lastName || null,
            p_email:              email,
            p_phone:              phone,
            p_zip_code:           data.zipCode || data.zip_code || data.zip || null,
            p_address:            data.address || data.address_line_1 || null,
            p_city:               data.city || null,
            p_service_category:   data.service_type || data.serviceType || null,
            p_frequency:          data.frequency || null,
            p_bedrooms:           data.bedrooms ? parseInt(data.bedrooms, 10) : null,
            p_bathrooms:          data.bathrooms ? parseInt(data.bathrooms, 10) : null,
            p_sqft:               data.sqft || data.squareFootage ? parseInt(data.sqft || data.squareFootage, 10) : null,
            p_clutter_level:      data.clutterLevel || data.clutter_level || null,
            p_has_pets:           data.hasPets ?? data.has_pets ?? null,
            p_estimate_min:       data.estimateMin || data.estimate_min || null,
            p_estimate_max:       data.estimateMax || data.estimate_max || null,
            p_quote_session_id:   funnel_session_id,
            p_internal_quote_id:  data.internal_quote_id || data.internalQuoteId || null,
            p_utm_source:         data.utm_source || null,
            p_utm_medium:         data.utm_medium || null,
            p_utm_campaign:       data.utm_campaign || null,
            p_page_url:           data.page_url || data.pageUrl || null,
            p_fbp:                data.fbp || null,
            p_fbc:                data.fbc || null,
            p_meta_event_id:      meta_event_id,
            p_raw_payload:        body,
            p_tags:               Array.isArray(data.tags) ? data.tags : [source, event_type].filter(Boolean),
            p_enable_crm_queue:   queueEnabled,
            p_crm_integration:    'ghl',
            p_crm_event_type:     event_type,
            // Always pass CRM payload so queue row has audit data.
            // If GHL sync is disabled, we mark the queue completed post-RPC.
            p_crm_payload:        queueEnabled ? crmPayload : null
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'gg_persist_lead_and_queue',
            rpcParams
        );

        if (rpcError) {
            console.error('[persist-lead] Supabase RPC failed:', {
                code: rpcError.code,
                hint: rpcError.hint,
                message: rpcError.message?.substring(0, 200)
            });

            if (persistEnabled) {
                // Normal mode: RPC failure is non-fatal.
                // Forward to GHL directly as emergency fallback + notify owner.
                const ghlOk = await forwardToGHL(crmPayload, event_type);
                const emailOk = await sendEmergencyNotification(crmPayload, rpcError);

                return {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        fallback: emailOk || ghlOk,
                        lead_id,
                        message: 'Lead saved via backup channel. Our team has been notified.'
                    })
                };
            } else {
                // Strict mode (GG_FEATURE_SUPABASE_PERSIST=false):
                // Surface the error — do NOT silently fallback to GHL-only.
                // Used during maintenance to ensure errors are visible.
                await sendEmergencyNotification(crmPayload, rpcError);

                return {
                    statusCode: 503,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        error: 'Lead persistence temporarily unavailable',
                        lead_id
                    })
                };
            }
        }

        // If GHL sync disabled, mark the queue entry completed immediately
        if (!ghlEnabled && rpcResult?.queue_id) {
            await supabase
                .from('gg_crm_sync_queue')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    last_error: 'ghl_disabled'
                })
                .eq('id', rpcResult.queue_id);
        }

        console.log('[persist-lead] Lead persisted successfully:', {
            lead_id,
            lead_created: rpcResult?.lead_created,
            queue_created: rpcResult?.queue_created
        });

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                lead_id,
                lead_uuid: rpcResult?.lead_uuid || null,
                lead_created: rpcResult?.lead_created ?? true,
                queue_created: rpcResult?.queue_created ?? false
            })
        };

    } catch (err) {
        console.error('[persist-lead] Unhandled error:', err.message);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, error: 'Internal server error' })
        };
    }
};

