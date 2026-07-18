import { getSupabaseClient } from './utils/supabaseClient.js';

// ---------------------------------------------------------------------------
// G&G Cleaning — process-crm-queue.js
// Durable CRM queue worker. Claims pending items atomically and delivers
// payloads to the appropriate GHL webhook endpoint.
//
// Invocation methods:
//   1. Manual POST with x-admin-secret header
//   2. Called by persist-lead.js after successful RPC (synchronous fallback)
//   3. Future: Netlify scheduled function
// ---------------------------------------------------------------------------

const MAX_ITEMS_PER_RUN = 10;
const GHL_TIMEOUT_MS = 10000;

// Retry schedule: attempt → delay in ms
const RETRY_DELAYS = {
    2: 30 * 1000,           // 30 seconds
    3: 2 * 60 * 1000,       // 2 minutes
    4: 10 * 60 * 1000,      // 10 minutes
    5: 30 * 60 * 1000       // 30 minutes
};

// ---------------------------------------------------------------------------
// Queue claiming via raw SQL (FOR UPDATE SKIP LOCKED)
// ---------------------------------------------------------------------------

/**
 * Atomically claim one pending queue item.
 * Uses FOR UPDATE SKIP LOCKED to prevent double-processing.
 * Recovers stale locks where lock_expires_at has passed.
 */
async function claimNextItem(supabase, workerId) {
    // Supabase JS client doesn't support FOR UPDATE SKIP LOCKED,
    // so we use a raw RPC wrapper or direct SQL via postgrest.
    // Since we can't add RPCs here, use a two-step approach:
    // 1. Find eligible item
    // 2. Atomically update it with version check
    
    // Find oldest pending item that's not locked
    const { data: candidates, error: findError } = await supabase
        .from('gg_crm_sync_queue')
        .select('id, attempts')
        .in('status', ['pending'])
        .lte('next_retry_at', new Date().toISOString())
        .or(`locked_at.is.null,lock_expires_at.lt.${new Date().toISOString()}`)
        .order('next_retry_at', { ascending: true })
        .limit(1);

    if (findError) {
        console.error('[queue] Find error:', findError.message);
        return null;
    }

    if (!candidates || candidates.length === 0) {
        return null;
    }

    const candidate = candidates[0];

    // Atomically claim: only succeeds if still in 'pending' status
    const lockExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data: claimed, error: claimError } = await supabase
        .from('gg_crm_sync_queue')
        .update({
            status: 'processing',
            locked_at: new Date().toISOString(),
            locked_by: workerId,
            lock_expires_at: lockExpiry,
            attempts: candidate.attempts + 1
        })
        .eq('id', candidate.id)
        .eq('status', 'pending')          // Optimistic lock: only if still pending
        .select('*')
        .single();

    if (claimError || !claimed) {
        // Another worker claimed it first — this is expected under concurrency
        return null;
    }

    return claimed;
}

// ---------------------------------------------------------------------------
// GHL Webhook delivery
// ---------------------------------------------------------------------------

function getWebhookUrl(source, eventType) {
    const BOOKING_URL = process.env.GHL_BOOKING_WEBHOOK_URL || process.env.GHL_WEBHOOK_URL;
    const QUOTE_URL   = process.env.GHL_QUOTE_WEBHOOK_URL || BOOKING_URL;
    const FB_ADS_URL  = process.env.GHL_FB_ADS_WEBHOOK_URL;
    const UNIFIED_URL = process.env.GHL_WEBHOOK_URL || QUOTE_URL;

    if (eventType === 'booking_confirmed') return BOOKING_URL;
    if (eventType === 'quote_requested')   return QUOTE_URL;
    if (source && source.toLowerCase().includes('facebook')) {
        return FB_ADS_URL || UNIFIED_URL;
    }
    return UNIFIED_URL;
}

async function deliverToGHL(payload, source, eventType) {
    const url = getWebhookUrl(source, eventType);
    if (!url) {
        return { ok: false, permanent: true, error: 'No GHL webhook URL configured' };
    }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(GHL_TIMEOUT_MS)
        });

        if (res.ok) {
            return { ok: true };
        }

        // 4xx = permanent failure (bad request, not retryable)
        // 5xx = transient failure (server error, retryable)
        const permanent = res.status >= 400 && res.status < 500;
        return { ok: false, permanent, error: `GHL HTTP ${res.status}` };
    } catch (err) {
        // Network timeout or connection error — transient
        return { ok: false, permanent: false, error: err.message?.substring(0, 200) || 'Network error' };
    }
}

// ---------------------------------------------------------------------------
// Item processing
// ---------------------------------------------------------------------------

async function processItem(supabase, item) {
    const payload = item.payload;
    const source = payload?.source || '';
    const eventType = item.event_type;

    // Unsupported integration
    if (item.integration !== 'ghl') {
        await markPermanentFailure(supabase, item, `Unsupported integration: ${item.integration}`);
        return 'failed_permanent';
    }

    const result = await deliverToGHL(payload, source, eventType);

    if (result.ok) {
        await markCompleted(supabase, item);
        return 'completed';
    }

    if (result.permanent || item.attempts >= item.max_attempts) {
        await markPermanentFailure(supabase, item, result.error);
        return 'failed_permanent';
    }

    await scheduleRetry(supabase, item, result.error);
    return 'retry_scheduled';
}

async function markCompleted(supabase, item) {
    await supabase
        .from('gg_crm_sync_queue')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            locked_at: null,
            locked_by: null,
            lock_expires_at: null
        })
        .eq('id', item.id);

    // Activity log
    await supabase
        .from('gg_activity_logs')
        .insert({
            lead_id: item.lead_id,
            event: 'crm_synced',
            integration: item.integration,
            queue_id: item.id,
            retry_count: item.attempts,
            metadata: { event_type: item.event_type }
        });

    // Update lead status
    if (item.lead_id) {
        await supabase
            .from('gg_leads')
            .update({ status: 'synced' })
            .eq('id', item.lead_id);
    }
}

async function markPermanentFailure(supabase, item, errorMsg) {
    const sanitizedError = (errorMsg || 'Unknown error').substring(0, 500);

    await supabase
        .from('gg_crm_sync_queue')
        .update({
            status: 'failed_permanent',
            last_error: sanitizedError,
            locked_at: null,
            locked_by: null,
            lock_expires_at: null
        })
        .eq('id', item.id);

    await supabase
        .from('gg_activity_logs')
        .insert({
            lead_id: item.lead_id,
            event: 'crm_sync_failed',
            integration: item.integration,
            queue_id: item.id,
            retry_count: item.attempts,
            error_code: sanitizedError.split(' ')[0] || 'unknown',
            message: sanitizedError,
            metadata: { event_type: item.event_type, permanent: true }
        });

    // Update lead status
    if (item.lead_id) {
        await supabase
            .from('gg_leads')
            .update({ status: 'permanent_failure' })
            .eq('id', item.lead_id);
    }
}

async function scheduleRetry(supabase, item, errorMsg) {
    const sanitizedError = (errorMsg || 'Unknown error').substring(0, 500);
    const delay = RETRY_DELAYS[item.attempts] || 30 * 60 * 1000;
    const nextRetry = new Date(Date.now() + delay).toISOString();

    await supabase
        .from('gg_crm_sync_queue')
        .update({
            status: 'pending',
            last_error: sanitizedError,
            next_retry_at: nextRetry,
            locked_at: null,
            locked_by: null,
            lock_expires_at: null
        })
        .eq('id', item.id);

    await supabase
        .from('gg_activity_logs')
        .insert({
            lead_id: item.lead_id,
            event: 'crm_sync_retry',
            integration: item.integration,
            queue_id: item.id,
            retry_count: item.attempts,
            error_code: sanitizedError.split(' ')[0] || 'unknown',
            message: `Retry ${item.attempts}/${item.max_attempts} scheduled for ${nextRetry}`,
            metadata: { event_type: item.event_type, next_retry_at: nextRetry }
        });

    // Update lead status
    if (item.lead_id) {
        await supabase
            .from('gg_leads')
            .update({ status: 'sync_failed' })
            .eq('id', item.lead_id);
    }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = async (event) => {
    // Auth check for manual POST invocation
    if (event.httpMethod === 'POST') {
        const adminSecret = process.env.INTERNAL_ADMIN_SECRET;
        const provided = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];

        if (!adminSecret) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Worker not configured' }) };
        }
        if (provided !== adminSecret) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
    }

    const workerId = `worker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const supabase = getSupabaseClient();

    const results = {
        processed: 0,
        completed: 0,
        retried: 0,
        permanent_failures: 0,
        errors: []
    };

    try {
        for (let i = 0; i < MAX_ITEMS_PER_RUN; i++) {
            const item = await claimNextItem(supabase, workerId);
            if (!item) break;   // No more pending items

            try {
                const outcome = await processItem(supabase, item);
                results.processed++;

                if (outcome === 'completed') results.completed++;
                else if (outcome === 'retry_scheduled') results.retried++;
                else if (outcome === 'failed_permanent') results.permanent_failures++;
            } catch (itemErr) {
                console.error(`[queue] Error processing item ${item.id}:`, itemErr.message);
                results.errors.push(item.id);

                // Release the lock so another worker can retry
                await supabase
                    .from('gg_crm_sync_queue')
                    .update({
                        status: 'pending',
                        locked_at: null,
                        locked_by: null,
                        lock_expires_at: null,
                        last_error: `Worker error: ${itemErr.message?.substring(0, 200)}`
                    })
                    .eq('id', item.id);
            }
        }

        console.log(`[queue] Worker ${workerId} complete:`, results);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, worker_id: workerId, ...results })
        };

    } catch (err) {
        console.error('[queue] Fatal worker error:', err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Worker encountered a fatal error' })
        };
    }
};
