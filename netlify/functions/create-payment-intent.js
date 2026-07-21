// ============================================================
// Netlify Serverless Function: create-payment-intent
// SECURITY: Stripe secret key NEVER goes to the browser.
//           This function runs on the server side only.
//
// Required Netlify Environment Variable:
//   STRIPE_SECRET_KEY (Managed in Netlify UI)
// ============================================================

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { 
      name, 
      email, 
      phone, 
      address,
      serviceType, 
      service, 
      estimateLow, 
      estimateHigh, 
      estimateRange,
      addons, 
      bookingDate, 
      bookingTime, 
      preferredTime,
      urgencyFee,
      amount, // Optional override if sent from Pricing Page
      
      // Metadata contract parameters
      request_id,
      requestId,
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

    // Use amount from body (if provided) or default to 5000 cents ($50)
    const finalAmount = amount || 5000;

    // 1. Create a Customer so we can securely vault the card for recurring usage or remaining balances
    const customer = await stripe.customers.create({
      name: name || 'Not provided',
      email: email || undefined,
      phone: phone || undefined,
      metadata: {
        service_type: serviceType || service || 'Cleaning',
      }
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'usd',
      customer: customer.id,
      setup_future_usage: 'off_session',
      receipt_email: email || undefined,
      description: `G&G Cleaning — Booking Deposit (${serviceType || service || 'Cleaning'})`,
      metadata: {
        customer_name: name || 'Not provided',
        customer_email: email || 'Not provided',
        customer_phone: phone || 'Not provided',
        customer_address: address || 'Not provided',
        service_type: serviceType || service || 'Cleaning',
        estimate_range: estimateRange || (estimateLow ? `$${estimateLow}–$${estimateHigh}` : 'N/A'),
        addons: Array.isArray(addons) ? addons.join(', ') : (addons || 'None'),
        booking_date: bookingDate || 'Pending Selection',
        booking_time: preferredTime || bookingTime || 'Pending Selection',
        priority_fee: urgencyFee ? `$${urgencyFee}` : '$0',
        
        // Metadata contract fields for webhook reconciliation
        request_id: request_id || requestId || '',
        lead_id: lead_id || leadId || '',
        funnel_session_id: funnel_session_id || funnelSessionId || '',
        quote_session_id: quote_session_id || quoteSessionId || '',
        internal_quote_id: internal_quote_id || internalQuoteId || '',
        meta_event_id: meta_event_id || metaEventId || '',
      },
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


