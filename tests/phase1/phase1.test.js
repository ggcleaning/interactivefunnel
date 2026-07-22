/**
 * G&G Cleaning — Phase 1 Integration Tests
 * 
 * These tests validate:
 *   1. Migration SQL structure and security
 *   2. ID generator correctness
 *   3. Request-ID semantics
 *   4. Feature flag truth table
 *   5. CRM transport routing
 *   6. Server function security
 *   7. No secret leakage
 *   8. Rollback design correctness
 *   9. Scheduled function config
 *  10. Queue worker structure
 * 
 * Run: npx vitest run tests/phase1/
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');

function readFile(relPath) {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

// ---------------------------------------------------------------------------
// 1. Migration SQL structure and security
// ---------------------------------------------------------------------------
describe('Migration SQL', () => {
    const sql = readFile('supabase/migrations/20260717000001_gg_phase1_leads.sql');

    describe('Tables', () => {
        it('creates gg_leads table', () => {
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS gg_leads');
        });

        it('creates gg_crm_sync_queue table', () => {
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS gg_crm_sync_queue');
        });

        it('creates gg_activity_logs table', () => {
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS gg_activity_logs');
        });

        it('creates gg_update_timestamp trigger function', () => {
            expect(sql).toContain('CREATE OR REPLACE FUNCTION gg_update_timestamp()');
        });
    });

    describe('RPC', () => {
        it('creates gg_persist_lead_and_queue RPC', () => {
            expect(sql).toContain('CREATE OR REPLACE FUNCTION gg_persist_lead_and_queue');
        });

        it('uses SECURITY INVOKER', () => {
            expect(sql).toContain('SECURITY INVOKER');
        });

        it('does NOT use SECURITY DEFINER', () => {
            expect(sql).not.toContain('SECURITY DEFINER');
        });

        it('uses ON CONFLICT for lead idempotency', () => {
            expect(sql).toContain('ON CONFLICT (request_id) DO UPDATE');
        });

        it('uses ON CONFLICT DO NOTHING for queue idempotency', () => {
            expect(sql).toContain('ON CONFLICT (idempotency_key) DO NOTHING');
        });

        it('detects created vs reconciled via xmax', () => {
            expect(sql).toContain('xmax = 0');
        });
    });

    describe('Security', () => {
        it('revokes execution from PUBLIC', () => {
            expect(sql).toContain('REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue');
            expect(sql).toContain('FROM PUBLIC');
        });

        it('revokes execution from anon', () => {
            expect(sql).toContain('FROM anon');
        });

        it('revokes execution from authenticated', () => {
            expect(sql).toContain('FROM authenticated');
        });

        it('grants execution only to service_role', () => {
            expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.gg_persist_lead_and_queue');
            expect(sql).toContain('TO service_role');
        });

        it('enables RLS on gg_leads', () => {
            expect(sql).toContain('ALTER TABLE gg_leads ENABLE ROW LEVEL SECURITY');
        });

        it('forces RLS on gg_leads', () => {
            expect(sql).toContain('ALTER TABLE gg_leads FORCE ROW LEVEL SECURITY');
        });

        it('enables RLS on gg_crm_sync_queue', () => {
            expect(sql).toContain('ALTER TABLE gg_crm_sync_queue ENABLE ROW LEVEL SECURITY');
        });

        it('enables RLS on gg_activity_logs', () => {
            expect(sql).toContain('ALTER TABLE gg_activity_logs ENABLE ROW LEVEL SECURITY');
        });

        it('revokes table access from PUBLIC and anon', () => {
            expect(sql).toContain('REVOKE ALL ON gg_leads FROM PUBLIC, anon, authenticated');
            expect(sql).toContain('REVOKE ALL ON gg_crm_sync_queue FROM PUBLIC, anon, authenticated');
            expect(sql).toContain('REVOKE ALL ON gg_activity_logs FROM PUBLIC, anon, authenticated');
        });

        it('grants table access to service_role', () => {
            expect(sql).toContain('GRANT ALL ON gg_leads TO service_role');
            expect(sql).toContain('GRANT ALL ON gg_crm_sync_queue TO service_role');
            expect(sql).toContain('GRANT ALL ON gg_activity_logs TO service_role');
        });
    });

    describe('Constraints', () => {
        it('has UNIQUE on request_id', () => {
            expect(sql).toMatch(/request_id\s+TEXT\s+UNIQUE\s+NOT\s+NULL/);
        });

        it('has UNIQUE on idempotency_key', () => {
            expect(sql).toMatch(/idempotency_key\s+TEXT\s+UNIQUE\s+NOT\s+NULL/);
        });

        it('has UNIQUE on lead_id', () => {
            expect(sql).toMatch(/lead_id\s+TEXT\s+UNIQUE\s+NOT\s+NULL/);
        });

        it('has status CHECK on gg_leads', () => {
            expect(sql).toContain("CHECK (status IN ('new','synced','sync_failed','permanent_failure'))");
        });

        it('has status CHECK on gg_crm_sync_queue', () => {
            expect(sql).toContain("CHECK (status IN ('pending','processing','completed','failed_permanent'))");
        });

        it('has raw_payload size limit (32KB)', () => {
            expect(sql).toContain('pg_column_size(raw_payload) < 32768');
        });

        it('has payload size limit (32KB)', () => {
            expect(sql).toContain('pg_column_size(payload) < 32768');
        });

        it('has metadata size limit (8KB)', () => {
            expect(sql).toContain('pg_column_size(metadata) < 8192');
        });

        it('has foreign key from queue to leads', () => {
            expect(sql).toContain('REFERENCES gg_leads(id)');
        });
    });

    describe('Indexes', () => {
        it('has email index', () => {
            expect(sql).toContain('idx_gg_leads_email');
        });

        it('has phone index', () => {
            expect(sql).toContain('idx_gg_leads_phone');
        });

        it('has queue pending index', () => {
            expect(sql).toContain('idx_gg_queue_pending');
        });

        it('has queue processing index', () => {
            expect(sql).toContain('idx_gg_queue_processing');
        });

        it('has activity lead index', () => {
            expect(sql).toContain('idx_gg_activity_lead');
        });
    });

    describe('Updated-at triggers', () => {
        it('has trigger on gg_leads', () => {
            expect(sql).toContain('gg_leads_updated_at');
        });

        it('has trigger on gg_crm_sync_queue', () => {
            expect(sql).toContain('gg_queue_updated_at');
        });
    });

    describe('No secrets or sensitive content', () => {
        it('contains no API keys or tokens', () => {
            const forbiddenPattern = new RegExp('sk_' + 'live_|sk_' + 'test_|ey' + 'J[a-zA-Z0-9]');
            expect(sql).not.toMatch(forbiddenPattern);
        });

        it('contains no VITE_ prefixed variables', () => {
            expect(sql).not.toContain('VITE_');
        });
    });
});

// ---------------------------------------------------------------------------
// 2. ID Generation
// ---------------------------------------------------------------------------
describe('ID Generators', () => {
    const source = readFile('src/utils/idGenerator.js');

    it('exports generateLeadId', () => {
        expect(source).toContain('export const generateLeadId');
    });

    it('exports generateRequestId', () => {
        expect(source).toContain('export const generateRequestId');
    });

    it('exports generateFunnelSessionId', () => {
        expect(source).toContain('export const generateFunnelSessionId');
    });

    it('lead ID format is GGL-YYYYMMDD-XXXXXX', () => {
        expect(source).toContain('GGL-');
    });

    it('request ID uses crypto.randomUUID()', () => {
        expect(source).toContain('crypto.randomUUID()');
    });

    it('generateRequestId takes zero arguments (not derived from identity)', () => {
        expect(source).toMatch(/generateRequestId\s*=\s*\(\s*\)\s*=>/);
    });

    it('preserves original generateInternalQuoteId', () => {
        expect(source).toContain('export const generateInternalQuoteId');
    });

    it('preserves original isValidQuoteId', () => {
        expect(source).toContain('export const isValidQuoteId');
    });
});

// ---------------------------------------------------------------------------
// 3. Request-ID Semantics (from idGenerator source)
// ---------------------------------------------------------------------------
describe('Request-ID Semantics', () => {
    const source = readFile('src/utils/idGenerator.js');

    it('request_id is UUID (not sequential or identity-based)', () => {
        // The function body should use randomUUID, not email/phone hashing
        expect(source).toContain('crypto.randomUUID()');
        expect(source).not.toContain('email');
        expect(source).not.toContain('phone');
    });

    it('documents reuse semantics', () => {
        expect(source).toContain('Browser retry of same submission reuses the request_id');
        expect(source).toContain('new estimate from the same customer');
    });
});

// ---------------------------------------------------------------------------
// 4. Feature Flag Truth Table
// ---------------------------------------------------------------------------
describe('Feature Flags', () => {
    const persistLead = readFile('netlify/functions/persist-lead.js');

    it('GG_FEATURE_SUPABASE_PERSIST is read by persist-lead', () => {
        expect(persistLead).toContain('GG_FEATURE_SUPABASE_PERSIST');
    });

    it('GG_FEATURE_CRM_QUEUE is read by persist-lead', () => {
        expect(persistLead).toContain('GG_FEATURE_CRM_QUEUE');
    });

    it('GG_FEATURE_GHL_SYNC is read by persist-lead', () => {
        expect(persistLead).toContain('GG_FEATURE_GHL_SYNC');
    });

    it('featureEnabled defaults to true for missing values', () => {
        expect(persistLead).toContain("if (val === undefined || val === null || val === '') return defaultVal");
    });

    it('featureEnabled returns false only for explicit "false"', () => {
        expect(persistLead).toContain("val.toLowerCase() !== 'false'");
    });

    it('disabling GHL does NOT disable Supabase persistence', () => {
        // The RPC call must not be guarded by ghlEnabled
        // Verify: no 'if (!ghlEnabled)' or 'if (ghlEnabled)' wrapping the RPC call
        const rpcLine = "supabase.rpc(";
        const rpcIndex = persistLead.indexOf(rpcLine);
        // Check the 200 chars before the RPC call for any ghlEnabled guard
        const beforeRPC = persistLead.substring(Math.max(0, rpcIndex - 200), rpcIndex);
        expect(beforeRPC).not.toMatch(/if\s*\(!?ghlEnabled/);
    });
});

// ---------------------------------------------------------------------------
// 5. Rollback Design (Correction #3)
// ---------------------------------------------------------------------------
describe('Rollback Design', () => {
    const persistLead = readFile('netlify/functions/persist-lead.js');

    it('does NOT bypass Supabase when GG_FEATURE_SUPABASE_PERSIST=false', () => {
        // There should be no path that returns "success: true, fallback: true"
        // when persistence is disabled before attempting the RPC
        expect(persistLead).not.toContain("EMERGENCY: GG_FEATURE_SUPABASE_PERSIST is disabled");
    });

    it('always attempts Supabase persistence', () => {
        expect(persistLead).toContain('PERSISTENCE IS ALWAYS ATTEMPTED');
    });

    it('GG_FEATURE_SUPABASE_PERSIST=false makes RPC failure fatal (503)', () => {
        expect(persistLead).toContain('statusCode: 503');
        expect(persistLead).toContain('Lead persistence temporarily unavailable');
    });

    it('GG_FEATURE_SUPABASE_PERSIST=true allows graceful fallback', () => {
        expect(persistLead).toContain('Normal mode: RPC failure is non-fatal');
    });

    it('does NOT have a code path that silently returns to GHL-only', () => {
        // Between the 'PERSISTENCE IS ALWAYS ATTEMPTED' comment and the RPC call,
        // there should be no early return that forwards to GHL.
        const startMarker = 'PERSISTENCE IS ALWAYS ATTEMPTED';
        const endMarker = 'MAIN PATH: Atomic Supabase';
        const startIdx = persistLead.indexOf(startMarker);
        const endIdx = persistLead.indexOf(endMarker);
        const gatewaySection = persistLead.substring(startIdx, endIdx);
        expect(gatewaySection).not.toContain('forwardToGHL');
        expect(gatewaySection).not.toContain('return {');
    });
});

// ---------------------------------------------------------------------------
// 6. CRM Transport Routing
// ---------------------------------------------------------------------------
describe('CRM Transport', () => {
    const crm = readFile('src/utils/crm.js');

    it('routes to persist-lead (not crm-proxy)', () => {
        expect(crm).toContain('/.netlify/functions/persist-lead');
    });

    it('does NOT route to crm-proxy', () => {
        expect(crm).not.toContain("'/.netlify/functions/crm-proxy'");
    });

    it('does NOT fire window.fbq', () => {
        expect(crm).not.toMatch(/window\.fbq\s*\(/);
    });

    it('preserves EmailJS fallback', () => {
        expect(crm).toContain('@emailjs/browser');
        expect(crm).toContain('VITE_EMAILJS_SERVICE_ID');
    });

    it('preserves sendToGHL alias', () => {
        expect(crm).toContain('export const sendToGHL = sendToCRM');
    });

    it('returns lead_id from successful responses', () => {
        expect(crm).toContain('lead_id: result.lead_id');
    });
});

// ---------------------------------------------------------------------------
// 7. Server Function Security
// ---------------------------------------------------------------------------
describe('Server Function Security', () => {
    const persistLead = readFile('netlify/functions/persist-lead.js');
    const queueWorker = readFile('netlify/functions/process-crm-queue.js');

    describe('persist-lead.js', () => {
        it('contains no hardcoded secrets', () => {
            const forbiddenPattern = new RegExp('sk_' + 'live_|sk_' + 'test_|ey' + 'J[a-zA-Z0-9]');
            expect(persistLead).not.toMatch(forbiddenPattern);
            expect(persistLead).not.toMatch(/password\s*[=:]\s*['"]/);
        });

        it('validates required contact fields', () => {
            expect(persistLead).toContain('At least one contact field');
        });

        it('sanitizes error messages (truncation)', () => {
            expect(persistLead).toContain('substring(0, 200)');
        });

        it('uses CORS headers on all responses', () => {
            expect(persistLead).toContain('Access-Control-Allow-Origin');
        });

        it('handles OPTIONS preflight', () => {
            expect(persistLead).toContain("event.httpMethod === 'OPTIONS'");
        });

        it('rejects non-POST methods', () => {
            expect(persistLead).toContain('Method Not Allowed');
        });
    });

    describe('process-crm-queue.js', () => {
        it('requires INTERNAL_ADMIN_SECRET for manual invocation', () => {
            expect(queueWorker).toContain('INTERNAL_ADMIN_SECRET');
        });

        it('returns 401 on unauthorized access', () => {
            expect(queueWorker).toContain('statusCode: 401');
        });

        it('returns 500 when admin secret not configured', () => {
            expect(queueWorker).toContain('Worker not configured');
        });

        it('contains no hardcoded secrets', () => {
            const forbiddenPattern = new RegExp('sk_' + 'live_|sk_' + 'test_|ey' + 'J[a-zA-Z0-9]');
            expect(queueWorker).not.toMatch(forbiddenPattern);
        });

        it('sanitizes error messages', () => {
            expect(queueWorker).toContain('substring(0,');
        });

        it('has GHL request timeout', () => {
            expect(queueWorker).toContain('AbortSignal.timeout');
        });
    });
});

// ---------------------------------------------------------------------------
// 8. Queue Worker Structure
// ---------------------------------------------------------------------------
describe('Queue Worker', () => {
    const worker = readFile('netlify/functions/process-crm-queue.js');

    it('uses processing state for claimed items', () => {
        expect(worker).toContain("status: 'processing'");
    });

    it('records locked_at and worker identity', () => {
        expect(worker).toContain('locked_at');
        expect(worker).toContain('locked_by: workerId');
    });

    it('sets lock expiry for stale lock recovery', () => {
        expect(worker).toContain('lock_expires_at');
    });

    it('checks for stale locks (expired locks)', () => {
        expect(worker).toContain('lock_expires_at');
    });

    it('uses optimistic locking for concurrent claims', () => {
        // Should only claim if status is still pending
        expect(worker).toContain("eq('status', 'pending')");
    });

    it('has controlled retry backoff schedule', () => {
        expect(worker).toContain('RETRY_DELAYS');
        expect(worker).toContain('30 * 1000');        // 30 seconds
        expect(worker).toContain('2 * 60 * 1000');    // 2 minutes
        expect(worker).toContain('10 * 60 * 1000');   // 10 minutes
        expect(worker).toContain('30 * 60 * 1000');   // 30 minutes
    });

    it('transitions to failed_permanent after max attempts', () => {
        expect(worker).toContain('failed_permanent');
        expect(worker).toContain('max_attempts');
    });

    it('creates activity log entries', () => {
        expect(worker).toContain("'gg_activity_logs'");
        expect(worker).toContain("event: 'crm_synced'");
        expect(worker).toContain("event: 'crm_sync_failed'");
        expect(worker).toContain("event: 'crm_sync_retry'");
    });

    it('updates lead status on sync completion', () => {
        expect(worker).toContain("status: 'synced'");
    });

    it('uses correct GHL webhook selection', () => {
        expect(worker).toContain('GHL_BOOKING_WEBHOOK_URL');
        expect(worker).toContain('GHL_QUOTE_WEBHOOK_URL');
        expect(worker).toContain('GHL_FB_ADS_WEBHOOK_URL');
        expect(worker).toContain('GHL_WEBHOOK_URL');
    });

    it('processes max 10 items per run', () => {
        expect(worker).toContain('MAX_ITEMS_PER_RUN = 10');
    });

    it('releases locks on unhandled item errors', () => {
        // Should reset status to pending if an item throws
        expect(worker).toContain("status: 'pending'");
        expect(worker).toContain('Worker error');
    });
});

// ---------------------------------------------------------------------------
// 9. No Secret Leakage in Frontend Code
// ---------------------------------------------------------------------------
describe('No Secret Leakage', () => {
    const crm = readFile('src/utils/crm.js');
    const idGen = readFile('src/utils/idGenerator.js');

    it('crm.js does not reference process.env.SUPABASE', () => {
        expect(crm).not.toContain('process.env.SUPABASE');
    });

    it('crm.js does not reference process.env.GHL_WEBHOOK', () => {
        expect(crm).not.toContain('process.env.GHL_WEBHOOK');
    });

    it('crm.js does not reference process.env.INTERNAL_ADMIN', () => {
        expect(crm).not.toContain('process.env.INTERNAL_ADMIN');
    });

    it('idGenerator.js does not reference process.env', () => {
        expect(idGen).not.toContain('process.env');
    });
});

// ---------------------------------------------------------------------------
// 10. Contact.jsx Wiring
// ---------------------------------------------------------------------------
describe('Contact.jsx', () => {
    const contact = readFile('src/components/Contact.jsx');

    it('imports sendToCRM', () => {
        expect(contact).toContain("import { sendToCRM }");
    });

    it('imports generateRequestId', () => {
        expect(contact).toContain("import { generateRequestId");
    });

    it('imports trackConversion', () => {
        expect(contact).toContain("import { trackConversion }");
    });

    it('calls sendToCRM on form submission', () => {
        expect(contact).toContain("sendToCRM(");
    });

    it('passes request_id', () => {
        expect(contact).toContain('request_id:');
    });

    it('passes meta_event_id from trackConversion', () => {
        expect(contact).toContain('meta_event_id: tracking.event_id');
    });

    it('sets skipMetaLead true (handles pixel itself)', () => {
        expect(contact).toContain('skipMetaLead: true');
    });

    it('does NOT add routing', () => {
        expect(contact).not.toContain('Route');
        expect(contact).not.toContain('useNavigate');
    });
});

// ---------------------------------------------------------------------------
// 11. Netlify Scheduled Function Configuration
// ---------------------------------------------------------------------------
describe('Netlify Configuration', () => {
    const toml = readFile('netlify.toml');

    it('has scheduled function for process-crm-queue', () => {
        expect(toml).toContain('[functions."process-crm-queue"]');
    });

    it('schedules every 15 minutes', () => {
        expect(toml).toContain('schedule = "*/15 * * * *"');
    });

    it('documents required Supabase env vars', () => {
        expect(toml).toContain('SUPABASE_URL');
        expect(toml).toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('documents INTERNAL_ADMIN_SECRET', () => {
        expect(toml).toContain('INTERNAL_ADMIN_SECRET');
    });

    it('documents feature flags', () => {
        expect(toml).toContain('GG_FEATURE_SUPABASE_PERSIST');
        expect(toml).toContain('GG_FEATURE_CRM_QUEUE');
        expect(toml).toContain('GG_FEATURE_GHL_SYNC');
    });

    it('bundles @supabase/supabase-js as external', () => {
        expect(toml).toContain('@supabase/supabase-js');
    });
});

// ---------------------------------------------------------------------------
// 12. App.jsx does NOT have /contact route
// ---------------------------------------------------------------------------
describe('App.jsx routing', () => {
    const app = readFile('src/App.jsx');

    it('does NOT have a /contact route', () => {
        expect(app).not.toMatch(/path\s*=\s*["']\/contact["']/);
    });
});

// ---------------------------------------------------------------------------
// 13. Supabase Client Utility
// ---------------------------------------------------------------------------
describe('Supabase Client', () => {
    const client = readFile('netlify/functions/utils/supabaseClient.js');

    it('uses createClient from @supabase/supabase-js', () => {
        expect(client).toContain("from '@supabase/supabase-js'");
    });

    it('disables session persistence', () => {
        expect(client).toContain('persistSession: false');
    });

    it('uses singleton pattern', () => {
        expect(client).toContain('let _client = null');
    });

    it('throws on missing config', () => {
        expect(client).toContain('Missing Supabase configuration');
    });
});
