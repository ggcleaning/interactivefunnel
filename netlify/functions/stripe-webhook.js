// ============================================================
// G&G Cleaning — Phase 2: Stripe Webhook
// Server-side booking capture. Fires on payment_intent.succeeded
// and checkout.session.completed to guarantee bookings are persisted.
// ============================================================

import Stripe from 'stripe';
import { getSupabaseClient } from './utils/supabaseClient.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Parse the feature flag.
 */
function featureEnabled(envVar, defaultVal = true) {
    const val = process.env[envVar];
    if (val === undefined || val === null || val === '') return defaultVal;
    return val.toLowerCase() !== 'false';
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // ── 1. VERIFY SIGNATURE ───────────────────────────────────
  let stripeEvent;
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[stripe-webhook] Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
    return { 
      statusCode: 400, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ error: 'Missing signature or webhook secret configuration' }) 
    };
  }

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return { 
      statusCode: 400, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ error: 'Invalid signature' }) 
    };
  }

  console.log(`[stripe-webhook] Verified Stripe event: id=${stripeEvent.id}, type=${stripeEvent.type}`);

  // Handle deposit, success, and failure events
  const allowedEvents = ['payment_intent.succeeded', 'checkout.session.completed', 'payment_intent.payment_failed'];
  if (!allowedEvents.includes(stripeEvent.type)) {
    return { 
      statusCode: 200, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ received: true, ignored: stripeEvent.type }) 
    };
  }

  try {
    const supabase = getSupabaseClient();
    let paymentIntentId = '';
    let amountReceived = 0;
    let metadata = {};
    let customerEmail = null;
    let customerPhone = null;
    let customerName = null;
    let isFailed = stripeEvent.type === 'payment_intent.payment_failed';

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      paymentIntentId = session.payment_intent;
      amountReceived = session.amount_total || 0;
      metadata = session.metadata || {};
      customerEmail = session.customer_details?.email || metadata.customer_email || null;
      customerPhone = session.customer_details?.phone || metadata.customer_phone || null;
      customerName = session.customer_details?.name || metadata.customer_name || null;
    } else {
      const pi = stripeEvent.data.object;
      paymentIntentId = pi.id;
      amountReceived = pi.amount_received || pi.amount || 0;
      metadata = pi.metadata || {};
      customerEmail = pi.receipt_email || metadata.customer_email || null;
      customerPhone = metadata.customer_phone || null;
      customerName = metadata.customer_name || null;
    }

    const depositUsd = amountReceived / 100;
    
    // Extract metadata contract fields
    const request_id = metadata.request_id || stripeEvent.id;
    const lead_id = metadata.lead_id || `GGL-ST-${Math.floor(100000 + Math.random() * 900000)}`;
    const funnel_session_id = metadata.funnel_session_id || metadata.quote_session_id || null;
    const quote_session_id = metadata.quote_session_id || funnel_session_id || null;
    const internal_quote_id = metadata.internal_quote_id || null;
    const meta_event_id = metadata.meta_event_id || null;

    let firstName = metadata.first_name || '';
    let lastName = metadata.last_name || '';
    if (!firstName && customerName && customerName !== 'Not provided') {
      const parts = customerName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const email = customerEmail || metadata.email || null;
    const phone = customerPhone || metadata.phone || null;

    const source = 'stripe_webhook';
    const event_type = isFailed ? 'payment_failed' : 'booking_confirmed';
    const lead_stage = isFailed ? 'Payment Failed' : 'Deposit Paid';

    // Parse numeric parameters
    const bedrooms = metadata.bedrooms ? parseInt(metadata.bedrooms, 10) : null;
    const bathrooms = metadata.bathrooms ? parseInt(metadata.bathrooms, 10) : null;
    const sqft = metadata.sqft ? parseInt(metadata.sqft, 10) : null;

    const zipCode = metadata.zip_code || metadata.zip || metadata.customer_address || null;
    const address = metadata.address || metadata.customer_address || null;

    const serviceType = metadata.service_type || metadata.service || null;
    const frequency = metadata.frequency || null;
    
    const estimateMin = metadata.estimate_min ? parseFloat(metadata.estimate_min) : null;
    const estimateMax = metadata.estimate_max ? parseFloat(metadata.estimate_max) : null;

    // Safety-sanitized raw payload (never log or store secret card details)
    const sanitizedPayload = {
      event_id: stripeEvent.id,
      event_type: stripeEvent.type,
      payment_intent_id: paymentIntentId,
      amount_usd: depositUsd,
      timestamp: new Date().toISOString()
    };

    const tags = isFailed 
      ? ['payment_failed', 'stripe_webhook', 'phase2_failed_attempt']
      : ['deposit_paid', 'stripe_webhook', 'phase2_payment_verified'];

    // Enforce CRM payload structure for sync queue audit
    const crmPayload = {
      full_name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || '',
      email: email || '',
      source: source,
      event_type: event_type,
      lead_id: lead_id,
      request_id: request_id,
      timestamp: new Date().toISOString(),
      service_type: serviceType || '',
      frequency: frequency || '',
      bedrooms: bedrooms || '',
      bathrooms: bathrooms || '',
      sqft: sqft || '',
      estimate_min: estimateMin || '',
      estimate_max: estimateMax || '',
      zip_code: zipCode || '',
      address: address || '',
      tags: tags,
      lead_stage: lead_stage,
      internal_quote_id: internal_quote_id || '',
      quote_session_id: quote_session_id || ''
    };

    const rpcParams = {
      p_lead_id: lead_id,
      p_request_id: request_id,
      p_source: source,
      p_event_type: event_type,
      p_funnel_session_id: funnel_session_id,
      p_lead_stage: lead_stage,
      p_first_name: firstName || null,
      p_last_name: lastName || null,
      p_email: email,
      p_phone: phone,
      p_zip_code: zipCode,
      p_address: address,
      p_city: null,
      p_service_category: serviceType,
      p_frequency: frequency,
      p_bedrooms: bedrooms,
      p_bathrooms: bathrooms,
      p_sqft: sqft,
      p_clutter_level: metadata.clutter_level || null,
      p_has_pets: metadata.has_pets === 'true' || metadata.has_pets === true ? true : (metadata.has_pets === 'false' || metadata.has_pets === false ? false : null),
      p_estimate_min: estimateMin,
      p_estimate_max: estimateMax,
      p_quote_session_id: quote_session_id,
      p_internal_quote_id: internal_quote_id,
      p_utm_source: metadata.utm_source || null,
      p_utm_medium: metadata.utm_medium || null,
      p_utm_campaign: metadata.utm_campaign || null,
      p_page_url: metadata.page_url || null,
      p_fbp: metadata.fbp || null,
      p_fbc: metadata.fbc || null,
      p_meta_event_id: meta_event_id,
      p_raw_payload: sanitizedPayload,
      p_tags: tags,
      p_enable_crm_queue: !isFailed,
      p_crm_integration: 'ghl',
      p_crm_event_type: event_type,
      p_crm_payload: isFailed ? null : crmPayload,
      // Phase 2 payment params
      p_stripe_payment_intent_id: paymentIntentId,
      p_deposit_amount: depositUsd,
      p_payment_status: isFailed ? 'failed' : 'succeeded'
    };

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'gg_persist_lead_and_queue',
      rpcParams
    );

    if (rpcError) {
      console.error('[stripe-webhook] Supabase RPC failed:', rpcError.message);
      return { 
        statusCode: 500, 
        headers: CORS_HEADERS, 
        body: JSON.stringify({ error: rpcError.message }) 
      };
    }

    // Mark sync queue completed immediately if GHL is disabled
    const ghlEnabled = featureEnabled('GG_FEATURE_GHL_SYNC', true);
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

    if (!process.env.OWNER_EMAIL) {
      console.warn('[stripe-webhook] OWNER_EMAIL environment variable not set. Skipping notifications.');
    }

    console.log('[stripe-webhook] Processed event successfully:', {
      event_id: stripeEvent.id,
      lead_uuid: rpcResult?.lead_uuid,
      reconciled: !rpcResult?.lead_created
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        reconciled: !rpcResult?.lead_created,
        lead_id: rpcResult?.lead_id
      })
    };

  } catch (err) {
    console.error('[stripe-webhook] Unhandled processing error:', err.message);
    return { 
      statusCode: 500, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
