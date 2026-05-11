import { createClient } from '@supabase/supabase-js';
import { handler as generateDocHandler } from '../netlify/functions/generate-document.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.INTERNAL_ADMIN_SECRET || 'GGC_ADMIN_2024_SECURE';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPhase2() {
  const testQuoteId = 'GGQ-TEST-ENV-001';
  console.log(`--- Verifying Phase 2 for Quote: ${testQuoteId} ---`);

  // 1. Verify Schema
  console.log('\n1. Verifying Database Schema...');
  const { data: schemaTest, error: schemaError } = await supabase
    .from('quotes')
    .select('proposal_pdf_url, proposal_status, proposal_generated_at, agreement_url, agreement_status, agreement_generated_at, estimated_total')
    .eq('internal_quote_id', testQuoteId)
    .single();

  if (schemaError) {
    console.error('❌ Schema Verification Failed:', schemaError.message);
    return;
  }
  console.log('✅ Schema Verification Passed (Columns exist)');

  // 2. Generate Proposal & Agreement
  const runGeneration = async (type) => {
    console.log(`\n2. Generating ${type}...`);
    const event = {
      httpMethod: 'POST',
      headers: { 'x-admin-secret': adminSecret },
      body: JSON.stringify({ internalQuoteId: testQuoteId, documentType: type })
    };

    const response = await generateDocHandler(event);
    const body = JSON.parse(response.body);

    if (response.statusCode === 200) {
      console.log(`✅ ${type} Generated Successfully`);
      console.log(`   URL: ${body.url}`);
      return body.url;
    } else {
      console.error(`❌ ${type} Generation Failed:`, body.error);
      return null;
    }
  };

  const proposalUrl = await runGeneration('proposal');
  const agreementUrl = await runGeneration('agreement');

  // 3. Confirm Database Persistence
  console.log('\n3. Confirming DB Persistence...');
  const { data: quoteAfter, error: fetchError } = await supabase
    .from('quotes')
    .select('*')
    .eq('internal_quote_id', testQuoteId)
    .single();

  if (fetchError) {
    console.error('❌ Failed to fetch quote after generation:', fetchError.message);
  } else {
    console.log('   Proposal URL in DB:', quoteAfter.proposal_pdf_url);
    console.log('   Agreement URL in DB:', quoteAfter.agreement_url);
    
    if (quoteAfter.proposal_pdf_url === proposalUrl && quoteAfter.proposal_status === 'generated') {
        console.log('✅ Proposal Persistence Verified');
    } else {
        console.log('❌ Proposal Persistence Mismatch or Failed');
    }
    
    if (quoteAfter.agreement_url === agreementUrl && quoteAfter.agreement_status === 'generated') {
        console.log('✅ Agreement Persistence Verified');
    } else {
        console.log('❌ Agreement Persistence Mismatch or Failed');
    }
  }

  // 4. Verify Audit Logs
  console.log('\n4. Verifying Audit Logs...');
  const { data: logs, error: logError } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('internal_quote_id', testQuoteId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (logError) {
    console.error('❌ Log Verification Failed:', logError.message);
  } else {
    const docLogs = logs.filter(l => l.action.includes('generated'));
    if (docLogs.length >= 2) {
        console.log(`✅ Found ${docLogs.length} generation-related logs`);
        docLogs.forEach(l => console.log(`   - ${l.action}: ${l.metadata?.url}`));
    } else {
        console.log('❌ Expected at least 2 generation audit logs, found:', docLogs.length);
        console.log('   Recent actions found:', logs.map(l => l.action).join(', '));
    }
  }

  // 5. Phase 1 Regression (Save Draft)
  console.log('\n5. Phase 1 Regression Test (Save Draft)...');
  const newTotal = (Number(quoteAfter.estimated_total) || 100) + 0.01;
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ estimated_total: newTotal })
    .eq('internal_quote_id', testQuoteId);

  if (updateError) {
    console.error('❌ Save Draft Regression Failed:', updateError.message);
  } else {
    console.log(`✅ Save Draft Regression Passed (Updated estimated_total to ${newTotal})`);
  }

  console.log('\n--- Verification Complete ---');
}

verifyPhase2();
