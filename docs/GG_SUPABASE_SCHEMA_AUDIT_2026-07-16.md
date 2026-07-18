# G&G Supabase Schema Audit — 2026-07-17

**Status**: ⛔ **BLOCKED** — No `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` found in any `.env` file on disk (searched `gg-cleaning-web`, DigiFacil, and all Desktop projects recursively).

---

## What We Know From Code Analysis

### Migration Files Inventory

Four migration files exist with **two competing schemas**:

| File | Location | Tables | UUID Function | Trigger Function |
|------|----------|--------|---------------|-----------------|
| `supabase/migrations/20260503000000_phase1_foundation.sql` | Versioned | `customers`, `quotes`, `sync_events`, `audit_logs` | `gen_random_uuid()` | `update_updated_at_column()` |
| `supabase/migrations/20260503000001_phase2_documents.sql` | Versioned | Alters `quotes` | — | — |
| `supabase_migration_phase1.sql` | Root | `customers`, `quotes`, `sync_events`, `audit_logs` | `uuid_generate_v4()` | `update_modified_column()` |
| `supabase_migration_phase2.sql` | Root | Alters `quotes` | — | — |

### Customers Table — Column Comparison

| Column | Versioned Migration | Root Migration | ghl-sync.js Uses |
|--------|-------------------|----------------|-----------------|
| `id` | ✅ UUID PK | ✅ UUID PK | ✅ |
| `first_name` | ✅ TEXT NOT NULL | ✅ TEXT NOT NULL | ✅ |
| `last_name` | ✅ TEXT | ✅ TEXT NOT NULL | ✅ |
| `email` | ✅ TEXT UNIQUE | ✅ TEXT | ✅ |
| `phone` | ✅ TEXT UNIQUE | ✅ TEXT | ✅ |
| `normalized_phone` | ❌ | ✅ TEXT UNIQUE | ✅ (search key) |
| `full_name` | ❌ | ✅ GENERATED | ❌ |
| `ghl_contact_id` | ✅ TEXT | ✅ TEXT | ✅ |
| `stripe_customer_id` | ✅ TEXT | ❌ | ❌ |
| `service_address` | ❌ | ✅ TEXT | ❌ |
| `address_line_1` | ❌ | ❌ | **✅ USED** (L211, L230) |
| `city` | ❌ | ✅ TEXT | ✅ |
| `state` | ❌ | ✅ TEXT | ❌ |
| `postal_code` | ❌ | ✅ TEXT | ✅ |
| `source` / `lead_source` | ❌ | ✅ `lead_source` | ✅ as `source` |
| `sync_status` | ❌ | ✅ TEXT | ❌ |
| `sync_error` | ❌ | ✅ TEXT | ❌ |
| `last_synced_at` | ❌ | ✅ TIMESTAMPTZ | ✅ |

**CRITICAL**: `address_line_1` is used by `ghl-sync.js` (lines 211, 230) but exists in **neither** migration file. The root migration uses `service_address`. The versioned migration has no address column at all. **The live schema must have `address_line_1`** for the Internal Quote Desk to function.

### Quotes Table — Column Comparison

| Column | Versioned Migration | Root Migration | ghl-sync.js Uses |
|--------|-------------------|----------------|-----------------|
| `id` | ✅ UUID PK | ✅ UUID PK | ✅ |
| `internal_quote_id` | ✅ TEXT UNIQUE | ✅ TEXT UNIQUE | ✅ |
| `customer_id` | ✅ UUID FK | ✅ UUID FK | ✅ |
| `status` / `quote_status` | ✅ `status` DEFAULT 'draft' | ✅ `quote_status` DEFAULT 'draft' | ✅ as `status` |
| `total_amount` | ✅ NUMERIC | ❌ | ❌ |
| `quote_total` | ❌ | ✅ NUMERIC NOT NULL | ❌ |
| `estimated_total` | ❌ | ❌ | **✅ USED** (L261) |
| `deposit_amount` | ✅ NUMERIC | ✅ NUMERIC NOT NULL | ❌ |
| `balance_due` | ❌ | ✅ NUMERIC NOT NULL | ❌ |
| `ghl_opportunity_id` | ✅ TEXT | ❌ | ❌ |
| `sales_ghl_opportunity_id` | ❌ | ✅ TEXT | ✅ (L142) |
| `quote_data` | ✅ JSONB NOT NULL | ✅ JSONB NOT NULL | ❌ |
| `quote_payload` | ❌ | ❌ | **✅ USED** (L262) |
| `sync_status` | ✅ TEXT | ✅ TEXT | ❌ |
| `proposal_pdf_url` | via Phase 2 ALTER | ✅ TEXT | ❌ |
| `agreement_url` | via Phase 2 ALTER | ✅ TEXT | ❌ |

**CRITICAL**: `estimated_total` and `quote_payload` are used by `ghl-sync.js` but exist in **neither** migration file. **The live schema has been manually altered.**

### Sync Events — ghl-sync.js uses `request_payload`/`response_payload` but migration defines `request_summary`/`response_summary`

### Audit Logs — ghl-sync.js uses `metadata` but migration defines `details`

---

## Table Naming: All Unprefixed

**Every table reference in the codebase uses unprefixed names.** Zero references to `gg_`-prefixed tables exist anywhere in the repository.

| Table | Referenced By |
|-------|--------------|
| `customers` | `ghl-sync.js`, `generate-document.js` |
| `quotes` | `ghl-sync.js`, `generate-document.js` |
| `sync_events` | `ghl-sync.js` |
| `audit_logs` | `ghl-sync.js`, `generate-document.js` |

---

## Queries for Supabase Dashboard

Please run these 7 queries in the Supabase SQL Editor and paste results:

### Query 1 — Table discovery
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE schemaname = 'public'
AND (tablename LIKE 'gg_%' OR tablename IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY tablename;
```

### Query 2 — Columns
```sql
SELECT table_name, ordinal_position, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_schema = 'public'
AND (table_name LIKE 'gg_%' OR table_name IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY table_name, ordinal_position;
```

### Query 3 — Indexes
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
AND (tablename LIKE 'gg_%' OR tablename IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY tablename, indexname;
```

### Query 4 — Constraints
```sql
SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
AND (tc.table_name LIKE 'gg_%' OR tc.table_name IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY tc.table_name, tc.constraint_type;
```

### Query 5 — RLS policies
```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies WHERE schemaname = 'public'
AND (tablename LIKE 'gg_%' OR tablename IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY tablename;
```

### Query 6 — Triggers
```sql
SELECT event_object_table, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers WHERE event_object_schema = 'public'
AND (event_object_table LIKE 'gg_%' OR event_object_table IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY event_object_table;
```

### Query 7 — Row counts
```sql
SELECT relname, n_live_tup AS approx_rows
FROM pg_stat_user_tables WHERE schemaname = 'public'
AND (relname LIKE 'gg_%' OR relname IN ('quotes','customers','sync_events','audit_logs','leads','payments'))
ORDER BY relname;
```
