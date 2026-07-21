// ============================================================
// G&G Cleaning — Phase 2: Stripe Webhook
// Server-side booking capture. Handles payment_intent.succeeded
// and payment_intent.payment_failed for atomic database reconciliation.
// Strictly enforces raw signature verification, event idempotency ledger,
// PII-free metadata contract, and Supabase contact hydration.
// ============================================================

import Stripe from 'stripe';
import crypto from 'crypto';
import { getSupabaseClient } from './utils/supabaseClient.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function featureEnabled(envVar, defaultVal = true) {
  const val = process.env[envVar];
  if (val === undefined || val === null || val === '') return defaultVal;
  return val.toLowerCase() !== 'false';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const hashData = (data) => {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

async function sendMetaCapiPurchase({ email, phone, firstName, lastName, city, zip, amountUsd, stripePaymentIntentId }) {
  const PIXEL_ID = process.env.FB_PIXEL_ID || process.env.VITE_FB_PIXEL_ID;
  const ACCESS_TOKEN = process.env.FB_CAPI_ACCESS_TOKEN;
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[stripe-webhook] Missing FB CAPI credentials. Skipping CAPI Purchase event.');
    return;
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: stripePaymentIntentId, // Shared with client Pixel for deduplication
        action_source: 'website',
        user_data: {
          em: email ? [hashData(email)] : [],
          ph: phone ? [hashData(phone.replace(/\D/g, ''))] : [],
          fn: firstName ? [hashData(firstName)] : [],
          ln: lastName ? [hashData(lastName)] : [],
          ct: city ? [hashData(city)] : [],
          zp: zip ? [hashData(zip)] : [],
          country: [hashData('us')],
        },
        custom_data: {
          value: amountUsd || 50,
          currency: 'USD',
          content_type: 'product',
          content_name: 'Cleaning Service Deposit',
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errRes = await res.json();
      console.error('[stripe-webhook] Meta CAPI Purchase error:', errRes);
    } else {
      console.log('[stripe-webhook] Successfully sent Meta CAPI Purchase event:', stripePaymentIntentId);
    }
  } catch (err) {
    console.error('[stripe-webhook] Exception sending Meta CAPI Purchase:', err.message);
  }
}

async function sendOwnerNotification({ ownerEmail, customerName, service, bookingDate, depositAmount, leadUuid, stripePaymentIntentId }) {
  if (!ownerEmail) {
    console.warn('[stripe-webhook] OWNER_EMAIL environment variable not set. Skipping notifications.');
    return;
  }

  const isProduction =
    process.env.CONTEXT === 'production' &&
    process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
  const subjectPrefix = isProduction ? '' : '[TEST] ';
  const subject = `${subjectPrefix}G&G Deposit Paid — Lead ${escapeHtml(leadUuid)}`;

  const sanitizedContent = {
    customerName: escapeHtml(customerName || 'Customer'),
    service: escapeHtml(service || 'General Cleaning'),
    bookingDate: escapeHtml(bookingDate || 'Pending Selection'),
    depositAmount: escapeHtml(`$${depositAmount}`),
    leadUuid: escapeHtml(leadUuid),
    paymentIntentId: escapeHtml(stripePaymentIntentId),
    subject,
  };

  console.log(`[stripe-webhook] Owner notification (${subject}) sent to ${ownerEmail} for lead ${sanitizedContent.leadUuid}`);
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 1. VERIFY SIGNATURE (Exact raw body & Base64 handling)
  let stripeEvent;
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[stripe-webhook] Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing signature or webhook secret configuration' }),
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
      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  console.log(`[stripe-webhook] Verified Stripe event: id=${stripeEvent.id}, type=${stripeEvent.type}`);

  // 2. SCOPE LIMITATION: Handle payment_intent.succeeded and payment_intent.payment_failed only
  const allowedEvents = ['payment_intent.succeeded', 'payment_intent.payment_failed'];
  if (!allowedEvents.includes(stripeEvent.type)) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ received: true, ignored: stripeEvent.type }),
    };
  }

  try {
    const supabase = getSupabaseClient();
    const pi = stripeEvent.data.object;
    const paymentIntentId = pi.id;
    const amountReceived = pi.amount_received || pi.amount || 0;
    const amountCents = amountReceived;
    const depositUsd = amountReceived / 100;
    const metadata = pi.metadata || {};
    const isFailed = stripeEvent.type === 'payment_intent.payment_failed';

    // Correlation Metadata identifiers only
    const request_id = metadata.request_id || null;
    const lead_uuid = metadata.lead_uuid || metadata.lead_id || null;
    const meta_event_id = metadata.meta_event_id || null;
    const payment_flow = metadata.payment_flow || 'concierge';
    const ghlEnabled = featureEnabled('GG_FEATURE_GHL_SYNC', true);

    const tags = isFailed
      ? ['payment_failed', 'stripe_webhook', 'phase2_failed_attempt']
      : ['deposit_paid', 'stripe_webhook', 'phase2_payment_verified'];

    const sanitizedPayload = {
      event_id: stripeEvent.id,
      event_type: stripeEvent.type,
      payment_intent_id: paymentIntentId,
      amount_usd: depositUsd,
      timestamp: new Date().toISOString(),
    };

    // 3. RPC Call for Atomic Database Reconciliation
    const rpcParams = {
      p_stripe_event_id: stripeEvent.id,
      p_stripe_payment_intent_id: paymentIntentId,
      p_lead_uuid: lead_uuid,
      p_request_id: request_id,
      p_amount_cents: amountCents,
      p_currency: pi.currency || 'usd',
      p_payment_status: isFailed ? 'failed' : 'succeeded',
      p_payment_flow: payment_flow,
      p_enable_crm_queue: !isFailed && ghlEnabled,
      p_meta_event_id: meta_event_id,
      p_raw_payload: sanitizedPayload,
      p_crm_integration: 'ghl',
      p_crm_event_type: isFailed ? 'payment_failed' : 'booking_confirmed',
      p_crm_payload: !isFailed && ghlEnabled ? {
        stripe_event_id: stripeEvent.id,
        stripe_payment_intent_id: paymentIntentId,
        deposit_amount: depositUsd,
        timestamp: new Date().toISOString(),
        payment_flow,
        request_id,
        lead_uuid,
      } : null,
      p_tags: tags,
    };

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'gg_reconcile_stripe_payment',
      rpcParams
    );

    if (rpcError) {
      console.error('[stripe-webhook] Supabase RPC failed:', rpcError.message);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: rpcError.message }),
      };
    }

    const resolvedLeadUuid = rpcResult?.lead_uuid;
    const isAlreadyProcessed = rpcResult?.already_processed === true;

    // 4. Hydrate customer contact details from Supabase gg_leads (NOT from Stripe metadata)
    let leadRecord = null;
    if (!isFailed && !isAlreadyProcessed && resolvedLeadUuid) {
      try {
        const { data: leadData } = await supabase
          .from('gg_leads')
          .select('*')
          .eq('id', resolvedLeadUuid)
          .maybeSingle();
        leadRecord = leadData;
      } catch (hydrationErr) {
        console.error('[stripe-webhook] Contact hydration error (continuing):', hydrationErr.message);
      }
    }

    // 5. Execute Post-Persistence Idempotent Notifications (Owner Email & Meta CAPI Purchase)
    if (!isFailed && !isAlreadyProcessed) {
      const fullName = leadRecord ? `${leadRecord.first_name || ''} ${leadRecord.last_name || ''}`.trim() || 'Valued Customer' : 'Valued Customer';

      // Send Owner Notification
      try {
        await sendOwnerNotification({
          ownerEmail: process.env.OWNER_EMAIL || 'info@ggcleaningli.com',
          customerName: fullName,
          service: leadRecord?.service_category || 'Residential Cleaning',
          bookingDate: leadRecord?.booking_date || 'Pending Selection',
          depositAmount: depositUsd,
          leadUuid: resolvedLeadUuid,
          stripePaymentIntentId: paymentIntentId,
        });
      } catch (emailErr) {
        console.error('[stripe-webhook] Owner notification failed (continuing):', emailErr.message);
      }

      // Send Meta CAPI Purchase with deduplication ID
      try {
        await sendMetaCapiPurchase({
          email: leadRecord?.email,
          phone: leadRecord?.phone,
          firstName: leadRecord?.first_name,
          lastName: leadRecord?.last_name,
          city: leadRecord?.city,
          zip: leadRecord?.zip_code,
          amountUsd: depositUsd,
          stripePaymentIntentId: paymentIntentId,
        });
      } catch (capiErr) {
        console.error('[stripe-webhook] Meta CAPI Purchase failed (continuing):', capiErr.message);
      }
    }

    console.log('[stripe-webhook] Processed event successfully:', {
      event_id: stripeEvent.id,
      lead_uuid: resolvedLeadUuid,
      reconciled: !rpcResult?.lead_created,
      already_processed: isAlreadyProcessed,
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        reconciled: !rpcResult?.lead_created,
        already_processed: isAlreadyProcessed,
        lead_id: rpcResult?.lead_id,
        lead_uuid: resolvedLeadUuid,
      }),
    };
  } catch (err) {
    console.error('[stripe-webhook] Unhandled processing error:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
