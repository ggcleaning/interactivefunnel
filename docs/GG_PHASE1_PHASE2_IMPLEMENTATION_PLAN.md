# G&G Cleaning — Phase 1/2 Implementation Plan (Finalized)

**Date**: 2026-07-17  
**Baseline**: Safety commit `be5f3c4` on `safety/lead-first-live-state-2026-07-16`  
**Parent**: `dc07e2c` on `main`  
**Status**: Schema audit blocked → All design work complete → Ready to finalize on audit receipt

---

## 1. Actual Schema Findings

### From Code Analysis (4 migration files + 2 Netlify functions)

**Live schema uses unprefixed tables**: `customers`, `quotes`, `sync_events`, `audit_logs`  
**Zero `gg_`-prefixed references exist anywhere in the codebase.**

The live schema has been manually altered beyond any migration file. `ghl-sync.js` uses columns that exist in neither the versioned nor root migration:

| Column Used in Code | Expected By | Exists in Migrations? |
|---------------------|-------------|----------------------|
| `address_line_1` | `ghl-sync.js` L211, L230 | ❌ Neither |
| `estimated_total` | `ghl-sync.js` L261 | ❌ Neither |
| `quote_payload` | `ghl-sync.js` L262 | ❌ Neither |
| `request_payload` | `ghl-sync.js` L443 | ❌ (root has `request_summary`) |
| `response_payload` | `ghl-sync.js` L443 | ❌ (root has `response_summary`) |
| `source` | `ghl-sync.js` L233 | ❌ (root has `lead_source`) |

### Awaiting Live Verification

Seven SQL queries are prepared in `docs/GG_SUPABASE_SCHEMA_AUDIT_2026-07-16.md`. Once results are provided:

1. Confirm/deny existence of `gg_`-prefixed tables
2. Confirm actual column names on `customers`, `quotes`
3. Determine RLS status
4. Determine row counts (migration impact)
5. Finalize migration SQL accordingly

**Unprefixed tables will NOT be altered.** New `gg_` tables sit alongside them. The existing `ghl-sync.js` → unprefixed tables path remains untouched.

---

## 2. Atomic RPC Design

### Function: `gg_persist_lead_and_queue`

```sql
CREATE OR REPLACE FUNCTION gg_persist_lead_and_queue(
    p_lead_id TEXT,
    p_request_id TEXT,            -- Stable request/event ID for idempotency
    p_source TEXT,
    p_event_type TEXT,
    p_lead_stage TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_zip_code TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_service_category TEXT DEFAULT NULL,
    p_frequency TEXT DEFAULT NULL,
    p_bedrooms INTEGER DEFAULT NULL,
    p_bathrooms INTEGER DEFAULT NULL,
    p_sqft INTEGER DEFAULT NULL,
    p_clutter_level TEXT DEFAULT NULL,
    p_has_pets BOOLEAN DEFAULT NULL,
    p_estimate_min NUMERIC DEFAULT NULL,
    p_estimate_max NUMERIC DEFAULT NULL,
    p_quote_session_id TEXT DEFAULT NULL,
    p_internal_quote_id TEXT DEFAULT NULL,
    p_utm_source TEXT DEFAULT NULL,
    p_utm_medium TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_fbp TEXT DEFAULT NULL,
    p_fbc TEXT DEFAULT NULL,
    p_meta_event_id TEXT DEFAULT NULL,
    p_raw_payload JSONB DEFAULT '{}'::JSONB,
    p_tags TEXT[] DEFAULT '{}'::TEXT[],
    p_enable_crm_queue BOOLEAN DEFAULT TRUE,
    p_crm_integration TEXT DEFAULT 'ghl',
    p_crm_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_id UUID;
    v_queue_id UUID;
    v_lead_created BOOLEAN := FALSE;
    v_queue_created BOOLEAN := FALSE;
    v_idempotency_key TEXT;
BEGIN
    -- 1. Upsert lead (ON CONFLICT on request_id for idempotency)
    INSERT INTO gg_leads (
        lead_id, request_id, source, event_type, lead_stage,
        first_name, last_name, email, phone, zip_code, address, city,
        service_category, frequency, bedrooms, bathrooms, sqft,
        clutter_level, has_pets, estimate_min, estimate_max,
        quote_session_id, internal_quote_id,
        utm_source, utm_medium, utm_campaign, page_url,
        fbp, fbc, meta_event_id,
        raw_payload, tags, status
    ) VALUES (
        p_lead_id, p_request_id, p_source, p_event_type, p_lead_stage,
        p_first_name, p_last_name, p_email, p_phone, p_zip_code, p_address, p_city,
        p_service_category, p_frequency, p_bedrooms, p_bathrooms, p_sqft,
        p_clutter_level, p_has_pets, p_estimate_min, p_estimate_max,
        p_quote_session_id, p_internal_quote_id,
        p_utm_source, p_utm_medium, p_utm_campaign, p_page_url,
        p_fbp, p_fbc, p_meta_event_id,
        p_raw_payload, p_tags, 'new'
    )
    ON CONFLICT (request_id) DO UPDATE SET
        event_type = EXCLUDED.event_type,
        lead_stage = COALESCE(EXCLUDED.lead_stage, gg_leads.lead_stage),
        first_name = COALESCE(EXCLUDED.first_name, gg_leads.first_name),
        last_name = COALESCE(EXCLUDED.last_name, gg_leads.last_name),
        email = COALESCE(EXCLUDED.email, gg_leads.email),
        phone = COALESCE(EXCLUDED.phone, gg_leads.phone),
        raw_payload = EXCLUDED.raw_payload,
        tags = EXCLUDED.tags,
        updated_at = NOW()
    RETURNING id, (xmax = 0) INTO v_lead_id, v_lead_created;

    -- 2. Create CRM queue entry if enabled (with deterministic idempotency key)
    IF p_enable_crm_queue AND p_crm_payload IS NOT NULL THEN
        v_idempotency_key := p_lead_id || '::' || p_crm_integration || '::' || p_event_type;

        INSERT INTO gg_crm_sync_queue (
            lead_id, integration, event_type, payload,
            idempotency_key, status, max_attempts, next_retry_at
        ) VALUES (
            v_lead_id, p_crm_integration, p_event_type, p_crm_payload,
            v_idempotency_key, 'pending', 5, NOW()
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_queue_id;

        v_queue_created := (v_queue_id IS NOT NULL);
    END IF;

    -- 3. Create activity log entry
    INSERT INTO gg_activity_logs (
        lead_id, event, integration,
        queue_id, metadata
    ) VALUES (
        v_lead_id,
        CASE WHEN v_lead_created THEN 'lead_created' ELSE 'lead_updated' END,
        p_crm_integration,
        v_queue_id,
        jsonb_build_object(
            'source', p_source,
            'event_type', p_event_type,
            'queue_created', v_queue_created
        )
    );

    -- 4. Return result
    RETURN jsonb_build_object(
        'lead_id', p_lead_id,
        'lead_uuid', v_lead_id,
        'lead_created', v_lead_created,
        'queue_id', v_queue_id,
        'queue_created', v_queue_created
    );
END;
$$;
```

### Concurrency Strategy

- **Lead idempotency**: `UNIQUE(request_id)` + `INSERT ... ON CONFLICT DO UPDATE`
- **Queue idempotency**: `UNIQUE(idempotency_key)` + `INSERT ... ON CONFLICT DO NOTHING`
- **Idempotency key format**: `{lead_id}::{integration}::{event_type}` — deterministic from request data
- **Atomicity**: All three inserts in a single PostgreSQL function = single transaction
- **A failure in any step rolls back all steps**

---

## 3. Finalized Table Definitions

### `gg_leads`

```sql
CREATE TABLE gg_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT UNIQUE NOT NULL,              -- GGL-YYYYMMDD-XXXXXX
    request_id TEXT UNIQUE NOT NULL,           -- Stable per-request ID for idempotency
    source TEXT NOT NULL,                       -- concierge, estimate_widget, quote_form, commercial, photo_quote, contact, success_page
    event_type TEXT NOT NULL,                   -- quote_started, quote_completed, booking_confirmed, contact_inquiry, etc.
    lead_stage TEXT,                            -- GHL-compatible label
    status TEXT DEFAULT 'new' CHECK (status IN ('new','synced','sync_failed','permanent_failure')),

    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    zip_code TEXT,
    address TEXT,
    city TEXT,

    service_category TEXT,
    frequency TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    sqft INTEGER,
    clutter_level TEXT,
    has_pets BOOLEAN,
    estimate_min NUMERIC(10,2),
    estimate_max NUMERIC(10,2),

    quote_session_id TEXT,
    internal_quote_id TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    page_url TEXT,
    fbp TEXT,
    fbc TEXT,
    meta_event_id TEXT,

    stripe_payment_intent_id TEXT,
    deposit_amount NUMERIC(10,2),
    payment_status TEXT,

    ghl_contact_id TEXT,
    ghl_opportunity_id TEXT,

    raw_payload JSONB NOT NULL DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**: email, phone, quote_session_id, status, created_at, stripe_payment_intent_id, request_id (implicit from UNIQUE).

**RLS**: Enabled. Service-role only. No anon policies. No authenticated-user policies.

**Fields not forced**: `address`, `city`, `sqft`, `bedrooms`, `bathrooms`, `frequency`, `clutter_level`, `has_pets` — all nullable. A Contact.jsx submission needs only `source`, `event_type`, `first_name`, `email`.

### `gg_crm_sync_queue`

```sql
CREATE TABLE gg_crm_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES gg_leads(id) ON DELETE SET NULL,
    integration TEXT NOT NULL DEFAULT 'ghl',
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed_permanent')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    last_error TEXT,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    lock_expires_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**: status, next_retry_at (partial: WHERE status IN ('pending','processing')), locked_at (partial: WHERE locked_at IS NOT NULL), lead_id.

**RLS**: Enabled. Service-role only.

### `gg_activity_logs`

```sql
CREATE TABLE gg_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES gg_leads(id) ON DELETE SET NULL,
    event TEXT NOT NULL,
    integration TEXT,
    queue_id UUID,
    retry_count INTEGER,
    error_code TEXT,
    message TEXT,
    metadata JSONB DEFAULT '{}' CHECK (pg_column_size(metadata) < 8192),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**: lead_id, created_at.

**RLS**: Enabled. Service-role only.

**Size limit**: `metadata` capped at 8KB per row via CHECK constraint.

---

## 4. Idempotency Strategy

### Lead Idempotency

| Scenario | Mechanism | Behavior |
|----------|-----------|----------|
| Same request retried (network retry) | `UNIQUE(request_id)` + `ON CONFLICT DO UPDATE` | Updates enrichable fields, returns existing lead |
| Same user starts new funnel session | Different `request_id` generated | Creates new lead row |
| Same user submits same form twice | Same `request_id` (browser-generated) | Upserts, no duplicate |

**`request_id` generation**: Browser generates `gg_req_{timestamp}_{random5}` once per form submission attempt. Stored in component state. If user clicks submit twice rapidly, same `request_id` is sent.

### Queue Idempotency

| Scenario | Mechanism | Behavior |
|----------|-----------|----------|
| Same lead+integration+event retried | `UNIQUE(idempotency_key)` + `ON CONFLICT DO NOTHING` | Silently skips duplicate |
| Same lead, different event (quote_started → quote_completed) | Different `idempotency_key` | Creates new queue entry |
| Queue worker picks up same item twice | `locked_at` + `locked_by` + `lock_expires_at` | Second worker skips locked item |

---

## 5. Feature-Flag Truth Table

All flags are **server-side only** (Netlify env vars, NOT `VITE_` prefix).

| Flag | `true` | `false` | Missing | Malformed |
|------|--------|---------|---------|-----------|
| `GG_FEATURE_SUPABASE_PERSIST` | Lead persisted to `gg_leads` before CRM | **Emergency only**: Falls through to `crm-proxy`, logs warning, sends emergency owner notification | Treated as `true` (default enabled) | Treated as `true` |
| `GG_FEATURE_CRM_QUEUE` | CRM delivery via `gg_crm_sync_queue` | Direct `crm-proxy` call (legacy behavior), lead still persisted | Treated as `true` when schema exists | Treated as `true` |
| `GG_FEATURE_GHL_SYNC` | GHL webhook delivery enabled | Queue items for GHL are created but immediately marked `completed` with note `ghl_disabled` | Treated as `true` | Treated as `false` (safe skip) |
| `GG_FEATURE_META_CAPI` | Server-side Meta CAPI events fire | Meta CAPI skipped, browser pixel still fires | Treated as `false` (opt-in) | Treated as `false` |

**Critical invariant**: There is no flag combination that sends leads to GHL without durable persistence. `GG_FEATURE_SUPABASE_PERSIST=false` triggers emergency notification, NOT silent GHL-only delivery.

---

## 6. Failure-Mode Truth Table

| Scenario | Customer Flow | Lead State | CRM Queue | Activity Log | Notification | UI Response |
|----------|--------------|------------|-----------|-------------|-------------|-------------|
| **Supabase ✅, GHL ✅** | Succeeds | `synced` | `completed` | `lead_created` + `crm_synced` | None needed | `{ success: true, lead_id }` |
| **Supabase ✅, GHL ❌** | Succeeds | `new` | `pending` (retries) | `lead_created` + `crm_sync_failed` (sanitized error) | None (queue handles) | `{ success: true, lead_id }` |
| **Supabase ✅, EmailJS ❌** | Succeeds | Persisted | Unaffected | `notification_failed` | Failure logged | `{ success: true, lead_id }` |
| **Supabase ✅, Meta ❌** | Succeeds | Persisted | Unaffected | `meta_capi_failed` | None | `{ success: true, lead_id }` |
| **Supabase ❌** | **Shows fallback** | Not persisted | N/A | N/A | **Emergency owner notification** (EmailJS with lead data) | `{ success: false, fallback: true, message: 'saved via backup' }` |
| **Supabase ❌, EmailJS ❌** | **Shows phone number** | Not persisted | N/A | N/A | None possible | `{ success: false, error: 'call_us' }` → UI shows business phone |

### Supabase Failure UI Response

`persist-lead.js` returns:
```json
{
    "success": false,
    "fallback": true,
    "message": "We could not securely save your request. Our team has been notified. Please call us at the number below if you don't hear back within 24 hours."
}
```

Browser `sendToCRM` shows a non-blocking notice but does NOT prevent the user from continuing the funnel.

---

## 7. Meta Event Design

### Deduplication Architecture

```
Browser Pixel                    Server CAPI
    │                                │
    ├─ fbq('track', 'Lead',         ├─ fb-capi.js receives
    │   { value, currency },        │   { eventId, email, phone,
    │   { eventID: meta_event_id }) │     fbp, fbc, value }
    │                                │
    └── Same meta_event_id ─────────┘
         │
         Meta deduplicates
```

### Event ID Lifecycle

1. **Browser generates** `meta_event_id` via `generateEventId('Lead')` from `metaTracking.js`
2. **Browser fires** `fbq('track', 'Lead', params, { eventID: meta_event_id })`
3. **Browser sends** `meta_event_id` in the `persist-lead` payload
4. **Server stores** `meta_event_id` in `gg_leads.meta_event_id`
5. **Queue worker** sends same `meta_event_id` to `fb-capi.js` for server-side event

### Scope of Browser Deduplication

| Current (broken) | Proposed |
|------------------|----------|
| `sessionStorage.setItem('gg_lead_tracked', 'true')` — permanent for entire session | Scoped to `request_id`: `sessionStorage.setItem('gg_meta_' + request_id, 'true')` |
| One Lead event blocks ALL future Lead events | Each distinct lead submission can fire its own Lead event |
| No eventID on most pixel calls | All pixel calls include `eventID` |

### Events by Entry Point

| Entry Point | Browser Event | Server CAPI Event | Shared eventID? |
|------------|--------------|-------------------|-----------------|
| Concierge Step 1 | `Lead` + `QuoteStarted` (custom) | `Lead` via queue | ✅ |
| Concierge final-quote | None (skipMetaLead) | `QuoteCompleted` (custom) via queue | ✅ |
| Concierge booking | None (skipMetaLead) | `Purchase` via queue (Phase 2) | ✅ |
| EstimateWidget contact | `Lead` via trackConversion | `Lead` via queue | ✅ |
| QuoteForm | `Lead` via trackConversion | `Lead` via queue | ✅ |
| CommercialCalculator | `Lead` via sendToCRM (to be fixed) | `Lead` via queue | ✅ (new) |
| PhotoQuoteFlow | `Lead` via trackConversion | `Lead` via queue | ✅ |
| Contact.jsx | `Lead` (new) | `Lead` via queue (new) | ✅ (new) |

**Rule**: `sendToCRM` no longer fires `window.fbq` at all. The calling component is responsible for browser pixel events. The queue worker handles server CAPI. Both use the same `meta_event_id`.

---

## 8. Entry Point Classification

### Reachability Audit Results (Verified 2026-07-17)

| Component | Status | Evidence |
|-----------|--------|----------|
| `Pricing.jsx` | **ORPHANED — unreachable** | No import, no route. `/pricing` renders `PricingPage.jsx` instead. Zero references. |
| `BookingInfoModal.jsx` | **ORPHANED — unreachable** | No import, no render site. Was designed for old `Pricing.jsx` flow. |
| `Contact.jsx` | **ORPHANED — unreachable** | No import, no `/contact` route, no nav link. Dead-end `alert()`. |
| `CommercialCalculator.jsx` | **ORPHANED — unreachable** | Not imported by `CommercialPage.jsx` or any other file. |
| `Hero.jsx`, `About.jsx`, `BeforeAfter.jsx`, `Services.jsx` | **ORPHANED** | Replaced by modular components, not imported. |

> **Pricing.jsx anonymous payment risk**: The old `Pricing.jsx` calls `create-payment-intent` with `email: ''`. This is NOT an active vulnerability because the component is unreachable. No hotfix needed. File can be deleted.

> **Contact.css dependency**: `QuoteForm.jsx` imports `Contact.css`. The CSS file must be retained or its styles absorbed into QuoteForm's own CSS before Contact.jsx is deleted.

### Active Entry Points (Reachable)

| # | Entry Point | Transport | Reachable Via |
|---|------------|-----------|---------------|
| 1 | EstimateWidget (quote started) | `sendToCRM` | Global modal — Navbar, Footer, StickyCTA, all page CTAs |
| 2 | EstimateWidget (contact captured) | `sendToCRM` | Step 2→3 transition |
| 3 | EstimateWidget (booking + payment) | `sendToCRM` + `create-payment-intent` | Step 3→4 transition |
| 4 | Concierge LeadCaptureStep | `sendToCRM` | `/quote` page step 1 |
| 5 | Concierge final-quote | `sendToCRM` | `/quote` page final step |
| 6 | Concierge booking-confirmed | `sendToCRM` | `/quote` page booking step |
| 7 | Concierge BookingSummaryStep payment | `create-payment-intent` (inline) | `/quote` page payment step |
| 8 | QuoteForm | `sendToCRM` + EmailJS (dual) | `/commercial-quote`, `/commercial-intake` |
| 9 | PhotoQuoteFlow | `sendToCRM` + `submit-photo-quote` | Inside EstimateWidget + SuccessPage |
| 10 | SuccessPage call request | `sendToCRM` | `/booking-confirmed`, `/quote-confirmed` |
| 11 | InternalQuotePage | `sendInternalQuote` → `ghl-sync` | `/internal-quote` (staff, PIN-protected) |
| 12 | ChatWidget | External GHL script | Global (excluding /quote) |

**Total active `sendToCRM` callers: 8** (EstimateWidget ×3, ConciergeFunnel ×3, QuoteForm, PhotoQuoteFlow, SuccessPage)

### Centralized Transport Change

**Only `src/utils/crm.js` needs transport modification.** The `sendToCRM` function currently calls `/.netlify/functions/crm-proxy`. It will be changed to call `/.netlify/functions/persist-lead`.

This single change automatically upgrades all 8 active callers.

**Individual component changes are limited to**:

| Component | Required Change | Reason |
|-----------|----------------|--------|
| `Contact.jsx` | Wire form to `sendToCRM`, add route in App.jsx | Currently dead-end + unreachable |
| `LeadCaptureStep.jsx` | Generate `request_id`, pass `meta_event_id` | Needs stable IDs |
| `EstimateWidget.jsx` | Add `skipMetaLead: true` to 3 non-Lead calls | Fix double Lead pixel |
| `QuoteForm.jsx` | Add `skipMetaLead: true` | Fix double Lead pixel |
| `PhotoQuoteFlow.jsx` | Add `skipMetaLead: true` | Fix double Lead pixel |

**NOT modified** (no changes needed):
- `ConciergeFunnel.jsx` (already uses `skipMetaLead`)
- `HomeSizeStep.jsx` (no sendToCRM)
- `OperationalIntelligenceStep.jsx` (no sendToCRM)
- `SuccessPage.jsx` (no Meta event needed for call requests)
- `BookingInfoModal.jsx` (orphaned — skip)
- `CommercialCalculator.jsx` (orphaned — skip)
- `Pricing.jsx` (orphaned — skip)

---

## 9. Legacy Component Reachability (Verified)

### Classification

| Component | Classification | Rationale |
|-----------|---------------|----------|
| `Pricing.jsx` | **Obsolete — safe to delete** | Fully replaced by `PricingPage.jsx`. Zero imports, zero references. Contains anonymous payment bug. |
| `BookingInfoModal.jsx` | **Obsolete — safe to delete** | Was the contact-first checkout modal for old `Pricing.jsx`. Zero imports. |
| `Contact.jsx` | **Unreachable — wire up in Phase 1** | Dead-end form. User requires it connected. Add route + sendToCRM integration. Keep `Contact.css` (used by QuoteForm). |
| `CommercialCalculator.jsx` | **Obsolete — safe to delete** | Not imported by CommercialPage. CommercialPage uses QuoteForm instead. |

### `/pricing` Route Clarification

The `/pricing` route renders `PricingPage.jsx` (not `Pricing.jsx`). `PricingPage` delegates all actions to `onOpenEstimate()` which opens the global EstimateWidget. There is NO direct Stripe integration on the active pricing page.

**User path**: Navbar "Pricing" → `/pricing` → PricingPage → "Book Your Cleaning" CTA → EstimateWidget modal (requires contact info before payment).

**Anonymous payment impossible via active routes.** All active payment flows collect contact information first.

### Orphaned File Inventory (13 files safe to delete)

| File | Size | Notes |
|------|------|-------|
| `Pricing.jsx` + `Pricing.css` | 20KB + 17KB | Old V1 pricing page |
| `BookingInfoModal.jsx` + `BookingInfoModal.css` | 11KB + 3KB | Old checkout modal |
| `CommercialCalculator.jsx` + `CommercialCalculator.css` | ~10KB | Old commercial flow |
| `Hero.jsx` + `Hero.css` | ~5KB | Replaced by HeroTemplate |
| `About.jsx` + `About.css` | ~4KB | Not imported |
| `BeforeAfter.jsx` + `BeforeAfter.css` | ~4KB | Not imported |
| `GG_Pricing_Page.html` | ~8KB | Static HTML artifact |

**Recommendation**: Delete orphaned files in a separate cleanup commit AFTER Phase 1 is verified. Not part of Phase 1 scope.

---

## 10. Final File-Change List (Phase 1 Blast Radius)

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260717000001_gg_phase1_leads.sql` | Creates `gg_leads`, `gg_crm_sync_queue`, `gg_activity_logs`, `gg_persist_lead_and_queue` RPC |
| `netlify/functions/persist-lead.js` | Canonical lead-capture endpoint (calls RPC) |
| `netlify/functions/process-crm-queue.js` | Queue worker (claims, delivers, retries) |

### Modified Files (8)

| File | Change | Scope |
|------|--------|-------|
| `src/utils/crm.js` | `sendToCRM` transport: `crm-proxy` → `persist-lead`; remove `window.fbq` from sendToCRM | **Central — upgrades all 8 active callers** |
| `src/utils/idGenerator.js` | Add `generateLeadId()` and `generateRequestId()` | New ID formats |
| `src/components/Contact.jsx` | Wire form to `sendToCRM` with `source: 'contact_form'` | Dead-end fix |
| `src/App.jsx` | Add `/contact` route rendering Contact component | Make Contact reachable |
| `src/components/concierge/steps/LeadCaptureStep.jsx` | Generate `request_id` + `meta_event_id` | ID generation |
| `src/components/EstimateWidget.jsx` | Add `skipMetaLead: true` to 3 non-Lead calls | Meta fix |
| `src/components/QuoteForm.jsx` | Add `skipMetaLead: true` | Meta fix |
| `src/components/PhotoQuoteFlow.jsx` | Add `skipMetaLead: true` | Meta fix |

### Untouched Files

| File | Reason |
|------|--------|
| `netlify/functions/crm-proxy.js` | Kept as legacy fallback; not deleted |
| `netlify/functions/ghl-sync.js` | Internal Quote Desk path; untouched |
| `netlify/functions/generate-document.js` | Document generation; untouched |
| `netlify/functions/create-payment-intent.js` | Phase 2 only |
| `netlify/functions/fb-capi.js` | Used by queue worker; not modified |
| `src/components/concierge/ConciergeFunnel.jsx` | Already uses `skipMetaLead` correctly |
| `src/components/BookingInfoModal.jsx` | Orphaned — not modified (delete in cleanup commit) |
| `src/components/Pricing.jsx` | Orphaned — not modified (delete in cleanup commit) |
| `src/components/CommercialCalculator.jsx` | Orphaned — not modified (delete in cleanup commit) |
| `src/pages/PricingPage.jsx` | Active but no data-capture changes needed |
| `.env.local` | Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (env config only) |

---

## 11. Test Plan

### Unit Tests

```
tests/
  persist-lead.test.js          — Input validation, RPC call, response format
  process-crm-queue.test.js     — Claim logic, retry schedule, permanent failure
  crm-transport.test.js         — sendToCRM routes to persist-lead, fallback behavior
  idempotency.test.js           — Duplicate request_id, duplicate idempotency_key
```

### Integration Tests

```
tests/integration/
  lead-flow.test.js             — Browser → persist-lead → gg_leads → queue → mock GHL
  contact-flow.test.js          — Contact.jsx → sendToCRM → persist-lead → gg_leads
  ghl-unavailable.test.js       — Lead persisted, queue retries, no customer block
  supabase-unavailable.test.js  — Emergency notification fires, fallback response
  meta-dedup.test.js            — Same meta_event_id in pixel + CAPI
```

### Acceptance Criteria (First Slice)

1. ✅ Concierge LeadCaptureStep creates `gg_leads` row with correct data
2. ✅ Contact.jsx creates `gg_leads` row (no longer discards data)
3. ✅ `gg_crm_sync_queue` row created atomically with lead
4. ✅ `gg_activity_logs` row created atomically
5. ✅ Duplicate submission with same `request_id` upserts (no duplicate lead)
6. ✅ Duplicate queue entry with same idempotency key is silently skipped
7. ✅ GHL unavailable → lead persisted, queue pending, customer not blocked
8. ✅ Supabase unavailable → emergency notification sent, UI shows fallback
9. ✅ `window.fbq` no longer fires inside `sendToCRM`
10. ✅ Build passes, no console errors

---

## 12. Migration Order

1. Run `gg_leads` table creation (requires Supabase access)
2. Run `gg_crm_sync_queue` table creation
3. Run `gg_activity_logs` table creation
4. Run `gg_persist_lead_and_queue` RPC creation
5. Verify all objects via `\dt gg_*` and `\df gg_*`
6. Deploy `persist-lead.js` and `process-crm-queue.js` to Netlify preview
7. Wire Concierge LeadCaptureStep + Contact.jsx
8. Test on preview
9. Expand to remaining entry points
10. Deploy to production

---

## 13. Rollback Procedure

### Instant Rollback (< 1 minute)

Set `GG_FEATURE_SUPABASE_PERSIST=false` in Netlify env vars → triggers redeploy → all leads route through legacy `crm-proxy`.

### Code Rollback

```bash
git switch main           # Return to pre-Phase-1 code
netlify deploy --prod     # Redeploy main branch
```

### Schema Rollback

New `gg_` tables are independent. They can be dropped without affecting any existing functionality:

```sql
DROP FUNCTION IF EXISTS gg_persist_lead_and_queue;
DROP TABLE IF EXISTS gg_activity_logs;
DROP TABLE IF EXISTS gg_crm_sync_queue;
DROP TABLE IF EXISTS gg_leads;
```

No unprefixed tables are modified at any point.

---

## 14. Queue Worker Safety

### Atomic Claim Process

```sql
UPDATE gg_crm_sync_queue
SET status = 'processing',
    locked_at = NOW(),
    locked_by = $1,          -- Worker instance ID
    lock_expires_at = NOW() + INTERVAL '5 minutes',
    attempts = attempts + 1
WHERE id = (
    SELECT id FROM gg_crm_sync_queue
    WHERE status IN ('pending')
      AND next_retry_at <= NOW()
      AND (locked_at IS NULL OR lock_expires_at < NOW())  -- Stale lock recovery
    ORDER BY next_retry_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

### Retry Schedule

| Attempt | Delay | Cumulative |
|---------|-------|-----------|
| 1 | Immediate | 0 |
| 2 | 30 seconds | 30s |
| 3 | 2 minutes | 2.5min |
| 4 | 10 minutes | 12.5min |
| 5 | 30 minutes | 42.5min |
| 6+ | `failed_permanent` | — |

### Security

- `process-crm-queue.js` requires `INTERNAL_ADMIN_SECRET` header OR is invoked as a Netlify scheduled function
- No unauthenticated public endpoint capable of draining or replaying the queue
- Worker ID format: `worker_{hostname}_{pid}_{timestamp}`
- GHL request timeout: 10 seconds
- Error messages sanitized before storage (no raw stack traces, no PII in error column)

---

## 15. Production Source Verification

**Status: BLOCKED** — Netlify MCP returns 401, CLI unauthorized.

**Does not block**: Migration preparation, local development, preview deployments.

**Does block**: Production deployment, environment variable configuration.

**Once access is available**, verify:
- Linked repository
- Production branch
- Deployed commit
- Build command / publish directory
- Deployed function list
- Scheduled worker status
- Environment variable names (not values)
- Deploy context overrides

---

## Risks, Blockers, Recommended First Commit

### Blockers

| Blocker | Required Action | Blocks |
|---------|----------------|--------|
| **Supabase schema query results** | Run 7 queries in Dashboard | Migration finalization |
| **Supabase env vars** | Add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and Netlify | persist-lead.js function |
| **Netlify auth** | Provide Dashboard access or API token | Production deployment |

### Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Live schema differs from migration expectations | Medium | Audit queries will confirm; migration uses `IF NOT EXISTS` |
| Multi-tenant collision on shared Supabase | Low | All new tables use `gg_` prefix |
| Queue worker doesn't run (no scheduled function) | Medium | Worker can be triggered by persist-lead.js synchronously as fallback |
| EmailJS rate limit during Supabase outage | Low | Emergency notification is one-time per lead, not per retry |

### Recommended First Implementation Commit

```
feature/gg-lead-persistence (branch from safety/lead-first-live-state-2026-07-16)

Commit 1: schema + RPC
  - supabase/migrations/20260717000001_gg_phase1_leads.sql

Commit 2: server functions
  - netlify/functions/persist-lead.js
  - netlify/functions/process-crm-queue.js

Commit 3: transport + Contact.jsx fix + route
  - src/utils/crm.js (transport change)
  - src/utils/idGenerator.js (new ID generators)
  - src/components/Contact.jsx (wire to sendToCRM)
  - src/App.jsx (add /contact route)
  - src/components/concierge/steps/LeadCaptureStep.jsx (request_id + meta_event_id)

Commit 4: Meta pixel fixes
  - src/components/EstimateWidget.jsx (skipMetaLead on non-Lead calls)
  - src/components/QuoteForm.jsx (skipMetaLead)
  - src/components/PhotoQuoteFlow.jsx (skipMetaLead)
```
