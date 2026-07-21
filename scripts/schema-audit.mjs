/**
 * Queue column discovery
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
    const envPath = resolve(import.meta.dirname, '..', '.env.local');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}
loadEnvLocal();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
    // Create temp lead
    const { data: lead } = await supabase
        .from('gg_leads')
        .insert({ source: 'test', payload: {} })
        .select('id')
        .single();

    if (!lead) {
        console.log('Cannot create lead');
        return;
    }

    // Try queue with minimal columns
    console.log('=== gg_crm_sync_queue discovery ===');

    // Attempt 1: just lead_id
    const { data: q1, error: e1 } = await supabase
        .from('gg_crm_sync_queue')
        .insert({ lead_id: lead.id })
        .select('*')
        .single();

    if (e1) {
        console.log(`Attempt 1 (lead_id only): ${e1.message}`);

        // Attempt 2: lead_id + crm_payload
        const { data: q2, error: e2 } = await supabase
            .from('gg_crm_sync_queue')
            .insert({ lead_id: lead.id, crm_payload: {} })
            .select('*')
            .single();

        if (e2) {
            console.log(`Attempt 2 (+ crm_payload): ${e2.message}`);

            // Attempt 3: lead_id + event_data
            const { data: q3, error: e3 } = await supabase
                .from('gg_crm_sync_queue')
                .insert({ lead_id: lead.id, event_data: {} })
                .select('*')
                .single();

            if (e3) {
                console.log(`Attempt 3 (+ event_data): ${e3.message}`);

                // Attempt 4: just insert with empty object to see required columns
                const { data: q4, error: e4 } = await supabase
                    .from('gg_crm_sync_queue')
                    .insert({})
                    .select('*')
                    .single();

                if (e4) {
                    console.log(`Attempt 4 (empty): ${e4.message}`);
                } else if (q4) {
                    console.log(`Attempt 4 columns: ${Object.keys(q4).join(', ')}`);
                    await supabase.from('gg_crm_sync_queue').delete().eq('id', q4.id);
                }
            } else if (q3) {
                console.log(`Columns: ${Object.keys(q3).join(', ')}`);
                for (const [k, v] of Object.entries(q3)) {
                    console.log(`  ${k}: ${v === null ? 'NULL' : typeof v}`);
                }
                await supabase.from('gg_crm_sync_queue').delete().eq('id', q3.id);
            }
        } else if (q2) {
            console.log(`Columns: ${Object.keys(q2).join(', ')}`);
            for (const [k, v] of Object.entries(q2)) {
                console.log(`  ${k}: ${v === null ? 'NULL' : typeof v}`);
            }
            await supabase.from('gg_crm_sync_queue').delete().eq('id', q2.id);
        }
    } else if (q1) {
        console.log(`Columns: ${Object.keys(q1).join(', ')}`);
        for (const [k, v] of Object.entries(q1)) {
            console.log(`  ${k}: ${v === null ? 'NULL' : typeof v}`);
        }
        await supabase.from('gg_crm_sync_queue').delete().eq('id', q1.id);
    }

    // Cleanup
    await supabase.from('gg_leads').delete().eq('id', lead.id);
    console.log('Cleaned up.');
}

main().catch(err => console.error('Fatal:', err.message));
