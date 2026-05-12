import { createClient } from '@supabase/supabase-js';

import { GHL_CONFIG } from './utils/ghlConfig.js';

// Environment Variables - SECRETS ONLY
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;
const INTERNAL_ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

// Public Identifiers - Using GHL_CONFIG with process.env fallbacks
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || GHL_CONFIG.LOCATION_ID;
const GHL_SALES_PIPELINE_ID = process.env.GHL_SALES_PIPELINE_ID || GHL_CONFIG.PIPELINES.SALES;
const GHL_STAGE_QUOTE_GENERATED_ID = process.env.GHL_STAGE_QUOTE_GENERATED_ID || GHL_CONFIG.STAGES.QUOTE_GENERATED;
const GHL_CUSTOM_FIELD_INTERNAL_QUOTE_ID = process.env.GHL_CUSTOM_FIELD_INTERNAL_QUOTE_ID || GHL_CONFIG.CUSTOM_FIELDS.INTERNAL_QUOTE_ID;
const GHL_CUSTOM_FIELD_PROPOSAL_URL = process.env.GHL_CUSTOM_FIELD_PROPOSAL_URL || GHL_CONFIG.CUSTOM_FIELDS.PROPOSAL_URL;
const GHL_CUSTOM_FIELD_AGREEMENT_URL = process.env.GHL_CUSTOM_FIELD_AGREEMENT_URL || GHL_CONFIG.CUSTOM_FIELDS.AGREEMENT_URL;
const GHL_CUSTOM_FIELD_PROPOSAL_STATUS = process.env.GHL_CUSTOM_FIELD_PROPOSAL_STATUS || GHL_CONFIG.CUSTOM_FIELDS.PROPOSAL_STATUS;
const GHL_CUSTOM_FIELD_AGREEMENT_STATUS = process.env.GHL_CUSTOM_FIELD_AGREEMENT_STATUS || GHL_CONFIG.CUSTOM_FIELDS.AGREEMENT_STATUS;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Normalizes phone numbers to E.164 format
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  // Assume US for now if not specified, or use a more robust lib if available
  const base = cleaned.startsWith('1') ? cleaned : `1${cleaned}`;
  return `+${base}`;
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const debugLogs = [];
  const log = (msg, obj) => {
    const line = `[${new Date().toISOString()}] ${msg} ${obj ? JSON.stringify(obj) : ''}`;
    console.log(line);
    debugLogs.push(line);
  };

  const adminSecret = event.headers['x-admin-secret'];
  if (INTERNAL_ADMIN_SECRET && adminSecret !== INTERNAL_ADMIN_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const { quoteData, customerData, internalQuoteId, action = 'sync' } = JSON.parse(event.body);

  // 0. Get Quote Action
  if (action === 'get_quote') {
    if (!internalQuoteId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'internalQuoteId required' }) };
    }

    try {
      const { data: quote, error: qErr } = await supabase
        .from('quotes')
        .select('*')
        .eq('internal_quote_id', internalQuoteId)
        .maybeSingle();

      if (qErr) throw qErr;
      if (!quote) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Quote not found' }) };

      const { data: customer, error: cErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .maybeSingle();

      if (cErr) throw cErr;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          quote,
          customer
        })
      };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
  }

  // Health Check Action (Bypass Supabase)
  if (action === 'ghl_health_check') {
    try {
      const ghlRes = await fetch(`https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}`, {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2023-02-21'
        }
      });
      if (ghlRes.ok) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: "GHL Connected" }) };
      } else {
        const err = await ghlRes.json();
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "GHL Connection Failed", details: err }) };
      }
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }

  try {
    // 1. Resolve Customer & Deduplicate
    const normalizedPhone = normalizePhone(customerData.phone);
    const customer = await resolveCustomer(customerData, normalizedPhone);

    // 2. Persist Quote in Supabase
    const quote = await persistQuote(quoteData, customer.id, internalQuoteId);

    // 3. Sync to GHL (Idempotent)
    let syncResult = { success: true };
    if (action !== 'save_only') {
      syncResult = await syncToGHL(customer, quote, log);
    } else {
      // If saving only, just mark as success for the response
      syncResult = { 
        success: true, 
        contactId: customer.ghl_contact_id, 
        opportunityId: quote.sales_ghl_opportunity_id 
      };
    }

    // 4. Update Quote/Customer with results
    if (syncResult.success) {
      await supabase.from('quotes').update({
        sales_ghl_opportunity_id: syncResult.opportunityId,
        status: 'success',
        last_synced_at: new Date().toISOString()
      }).eq('id', quote.id);

      if (syncResult.contactId && !customer.ghl_contact_id) {
        await supabase.from('customers').update({ 
          ghl_contact_id: syncResult.contactId,
          last_synced_at: new Date().toISOString()
        }).eq('id', customer.id);
      }
    } else {
      await supabase.from('quotes').update({
        status: 'error'
      }).eq('id', quote.id);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        ...syncResult, 
        ghlContactId: syncResult.contactId,
        salesGhlOpportunityId: syncResult.opportunityId,
        internalQuoteId: quote.internal_quote_id,
        quoteId: quote.id,
        customerId: customer.id,
        proposal_pdf_url: quote.proposal_pdf_url,
        proposal_status: quote.proposal_status,
        agreement_url: quote.agreement_url,
        agreement_status: quote.agreement_status,
        debugLogs: debugLogs
      }),
    };

  } catch (error) {
    console.error('[GHL Sync Error]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message,
        debugLogs: debugLogs 
      }),
    };
  }
};

/**
 * Resolves a customer from local DB or creates a new one (Phone-First)
 */
async function resolveCustomer(data, phone) {
  // Search by Normalized Phone first
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('normalized_phone', phone)
    .maybeSingle();

  if (existing) {
    // Update existing customer info if it changed
    const { data: updated } = await supabase
      .from('customers')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        address_line_1: data.address,
        city: data.city,
        postal_code: data.zipCode
      })
      .eq('id', existing.id)
      .select()
      .single();
    return updated;
  }

  // Create new local customer
  const { data: created, error } = await supabase
    .from('customers')
    .insert([{
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      normalized_phone: phone,
      address_line_1: data.address,
      city: data.city,
      postal_code: data.zipCode,
      source: 'Internal Quote Desk'
    }])
    .select()
    .single();

  if (error) throw error;
  
  await createAuditLog('customer', created.id, created.internal_quote_id, 'created');
  return created;
}

/**
 * Saves or updates a quote in Supabase
 */
async function persistQuote(data, customerId, internalQuoteId) {
  let existing = null;
  
  if (internalQuoteId) {
    const { data: q } = await supabase
      .from('quotes')
      .select('*')
      .eq('internal_quote_id', internalQuoteId)
      .maybeSingle();
    existing = q;
  }

  const quotePayload = {
    customer_id: customerId,
    estimated_total: data.quoteTotal,
    quote_payload: data,
    status: 'generated'
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('quotes')
      .update(quotePayload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    await createAuditLog('quote', updated.id, updated.internal_quote_id, 'updated');
    return updated;
  } else {
    // Use provided ID or generate new GGQ-YYYY-XXXXXX
    let finalId = internalQuoteId;
    if (!finalId) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      finalId = `GGQ-${year}-${random}`;
    }

    const { data: created, error } = await supabase
      .from('quotes')
      .insert([{ ...quotePayload, internal_quote_id: finalId }])
      .select()
      .single();
    if (error) throw error;
    await createAuditLog('quote', created.id, created.internal_quote_id, 'created');
    return created;
  }
}

/**
 * Idempotent GHL Sync (Contact + Opportunity)
 */
async function syncToGHL(customer, quote, log) {
  try {
    log('Starting GHL Sync...', { quoteId: quote.internal_quote_id });
    
    // 1. Search/Upsert Contact
    let contactId = customer.ghl_contact_id;
    
    // 3. Find or Create GHL Contact
    log(`Step 3.1: Searching for contact by phone: ${customer.normalized_phone}...`);
    let searchRes = await ghlRequest('/contacts/search', 'POST', { 
      locationId: GHL_LOCATION_ID, 
      query: customer.normalized_phone,
      pageLimit: 20
    }, log);
    
    if (!searchRes.contacts || searchRes.contacts.length === 0) {
      log(`Step 3.2: Contact not found by phone. Searching by email: ${customer.email}...`);
      searchRes = await ghlRequest('/contacts/search', 'POST', {
        locationId: GHL_LOCATION_ID,
        query: customer.email,
        pageLimit: 20
      }, log);
    }
    
    if (searchRes.contacts && searchRes.contacts.length > 0) {
      contactId = searchRes.contacts[0].id;
      log(`Step 3.3: Found existing contact: ${contactId}`);
    } else {
      log(`Step 3.3: Contact not found. Creating new contact...`);
      const contactPayload = {
        locationId: GHL_LOCATION_ID,
        firstName: customer.first_name,
        lastName: customer.last_name,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.normalized_phone,
        address1: customer.address_line_1,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postal_code,
        source: customer.source || 'Internal Quote Console'
      };
      const newContact = await ghlRequest('/contacts/', 'POST', contactPayload, log);
      contactId = newContact.contact?.id || newContact.id;
      log(`Step 3.4: Created Contact ID: ${contactId}`);
    }
    

    // 2. Upsert Opportunity (Idempotent via internal_quote_id or existing ID)
    let opportunityId = quote.sales_ghl_opportunity_id;
    
    const oppPayload = {
      pipelineId: GHL_SALES_PIPELINE_ID,
      locationId: GHL_LOCATION_ID,
      contactId: contactId,
      name: `${quote.internal_quote_id} | ${customer.first_name} ${customer.last_name}`,
      status: 'open',
      pipelineStageId: GHL_STAGE_QUOTE_GENERATED_ID,
      monetaryValue: parseFloat(quote.estimated_total) || 0,
      customFields: []
    };

    if (GHL_CUSTOM_FIELD_INTERNAL_QUOTE_ID) {
      oppPayload.customFields.push({ id: GHL_CUSTOM_FIELD_INTERNAL_QUOTE_ID, value: quote.internal_quote_id });
    }
    if (GHL_CUSTOM_FIELD_PROPOSAL_URL && quote.proposal_pdf_url) {
      oppPayload.customFields.push({ id: GHL_CUSTOM_FIELD_PROPOSAL_URL, value: quote.proposal_pdf_url });
    }
    if (GHL_CUSTOM_FIELD_AGREEMENT_URL && quote.agreement_url) {
      oppPayload.customFields.push({ id: GHL_CUSTOM_FIELD_AGREEMENT_URL, value: quote.agreement_url });
    }
    if (GHL_CUSTOM_FIELD_PROPOSAL_STATUS && quote.proposal_status) {
      oppPayload.customFields.push({ id: GHL_CUSTOM_FIELD_PROPOSAL_STATUS, value: quote.proposal_status });
    }
    if (GHL_CUSTOM_FIELD_AGREEMENT_STATUS && quote.agreement_status) {
      oppPayload.customFields.push({ id: GHL_CUSTOM_FIELD_AGREEMENT_STATUS, value: quote.agreement_status });
    }

    if (opportunityId) {
      log(`Step 4.0: Opportunity ID known from database: ${opportunityId}. Updating...`);
      // Disallowed in V2 PUT: locationId, contactId
      const { locationId: _loc, contactId: _con, ...updatePayload } = oppPayload;
      await ghlRequest(`/opportunities/${opportunityId}`, 'PUT', updatePayload, log);
    } else {
      // 4. Find or Create GHL Opportunity
      log(`Step 4.1: Searching for existing opportunity for quote: ${quote.internal_quote_id}...`);
      const existingOpps = await ghlRequest(`/opportunities/search?location_id=${GHL_LOCATION_ID}&q=${quote.internal_quote_id}`, 'GET', null, log);
      
      if (existingOpps.opportunities && existingOpps.opportunities.length > 0) {
        opportunityId = existingOpps.opportunities[0].id;
        log(`Step 4.2: Found existing opportunity via search: ${opportunityId}. Updating...`);
        // Disallowed in V2 PUT: locationId, contactId
        const { locationId: _loc, contactId: _con, ...updatePayload } = oppPayload;
        await ghlRequest(`/opportunities/${opportunityId}`, 'PUT', updatePayload, log);
      } else {
        log(`Step 4.2: Opportunity not found. Creating new...`);
        const newOpp = await ghlRequest('/opportunities/', 'POST', oppPayload, log);
        opportunityId = newOpp.opportunity?.id || newOpp.id;
        log(`Step 4.3: Created Opportunity ID: ${opportunityId}`);
      }
    }

    await logSyncEvent('quote', quote.id, quote.internal_quote_id, 'opportunity_upsert', oppPayload, { opportunityId }, 'success');

    return { success: true, contactId, opportunityId };

  } catch (error) {
    console.error('GHL Sync Error:', error.message);
    await logSyncEvent('quote', quote.id, quote.internal_quote_id, 'ghl_sync', null, null, 'failed', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * GHL API Request Helper
 */
async function ghlRequest(path, method, body, log) {
  const url = `https://services.leadconnectorhq.com${path}`;
  if (log) log(`ghlRequest ${method} ${path}`, body);
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
      'Version': '2023-02-21',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  if (response.status === 204) return {};
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `GHL API Error: ${response.status}`);
  }
  return data;
}

/**
 * Logging Helpers
 */
async function logSyncEvent(entityType, entityId, internalQuoteId, action, requestSummary, responseSummary, status, errorMsg) {
  try {
    await supabase.from('sync_events').insert([{
      entity_type: entityType,
      entity_id: entityId,
      internal_quote_id: internalQuoteId,
      provider: 'GHL',
      action: action,
      status: status,
      request_payload: requestSummary,
      response_payload: responseSummary,
      error_message: errorMsg
    }]);
  } catch (e) {
    console.error('Failed to log sync event:', e);
  }
}

async function createAuditLog(entityType, entityId, internalQuoteId, action, details = {}) {
  try {
    await supabase.from('audit_logs').insert([{
      entity_type: entityType,
      entity_id: entityId,
      internal_quote_id: internalQuoteId,
      action: action,
      actor: 'staff',
      metadata: details
    }]);
  } catch (e) {
    console.error('Failed to create audit log:', e);
  }
}
