// ============================================================
// Netlify Serverless Function: create-payment-intent
// SECURITY: Stripe secret key NEVER goes to the browser.
//           This function runs on the server side only.
//
// Metadata Contract: Identifiers ONLY (NO customer PII in metadata).
// ============================================================

import Stripe from 'stripe';
import { calculateRecurringQuote, getDistancePricing } from '../../src/utils/pricingEngine.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function cleanIdentifier(val) {
  if (!val || val === 'null' || val === 'undefined') return '';
  return String(val).trim();
}

function calculateEstimateDeposit(body) {
  const { 
    bedrooms = 1, 
    bathrooms = 1, 
    sqft = 0, 
    frequency = 'oneTime', 
    serviceType = 'standard',
    condition = 'standard',
    addons = [],
    urgencyFee = 0,
    zipZone = 'local'
  } = body;

  const quote = calculateRecurringQuote({
    bedrooms: parseInt(bedrooms, 10) || 1,
    bathrooms: parseInt(bathrooms, 10) || 1,
    sqft: parseInt(sqft, 10) || 0,
    frequency: frequency || 'oneTime',
    serviceType: serviceType || 'standard',
    condition: condition || 'standard',
    addons: Array.isArray(addons) ? addons : [],
  });

  const baseTotal = quote.firstMonthTotal;
  const dist = getDistancePricing(baseTotal, zipZone);
  const totalWithUrgency = dist.finalTotal + (parseInt(urgencyFee, 10) || 0);
  const calculatedDeposit = Math.round(totalWithUrgency * 0.25);
  const finalDepositDollars = Math.max(calculatedDeposit, 50); // $50 minimum deposit floor
  return finalDepositDollars * 100; // deposit in cents
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      name, 
      email, 
      phone, 
      payment_flow,
      amount,
      
      // Correlation metadata fields
      request_id,
      requestId,
      lead_uuid,
      lead_id,
      leadId,
      funnel_session_id,
      funnelSessionId,
      quote_session_id,
      quoteSessionId,
      internal_quote_id,
      internalQuoteId,
      meta_event_id,
      metaEventId
    } = body;

    const flow = (payment_flow || 'concierge').toLowerCase();
    let finalAmount = 5000; // Default Concierge $50 flat

    if (flow === 'estimate_widget') {
      const serverCalcAmount = calculateEstimateDeposit(body);
      finalAmount = serverCalcAmount; // Server calculation ALWAYS dictates the charge

      if (typeof amount === 'number' && amount > 0 && amount !== serverCalcAmount) {
        console.warn(`[create-payment-intent] Diagnostic notice: Client requested ${amount} cents, server calculated ${serverCalcAmount} cents. Server calculation enforced.`);
      }
    } else {
      // Concierge flow: strictly $50 (5000 cents)
      finalAmount = 5000;
    }

    // 1. Create standard Stripe Customer (built-in fields only, no PII in metadata)
    const customer = await stripe.customers.create({
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
    });

    // 2. Build metadata contract containing correlation identifiers ONLY
    const metadata = {};
    const reqId = cleanIdentifier(request_id || requestId);
    const leadUuid = cleanIdentifier(lead_uuid || lead_id || leadId);
    const funnelId = cleanIdentifier(funnel_session_id || funnelSessionId);
    const quoteId = cleanIdentifier(quote_session_id || quoteSessionId);
    const intQuoteId = cleanIdentifier(internal_quote_id || internalQuoteId);
    const metaId = cleanIdentifier(meta_event_id || metaEventId);

    if (reqId) metadata.request_id = reqId;
    if (leadUuid) metadata.lead_uuid = leadUuid;
    if (funnelId) metadata.funnel_session_id = funnelId;
    if (quoteId) metadata.quote_session_id = quoteId;
    if (intQuoteId) metadata.internal_quote_id = intQuoteId;
    if (metaId) metadata.meta_event_id = metaId;
    metadata.payment_flow = flow;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'usd',
      customer: customer.id,
      setup_future_usage: 'off_session',
      receipt_email: email || undefined,
      description: `G&G Cleaning Deposit`,
      metadata,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (error) {
    console.error('Stripe error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
