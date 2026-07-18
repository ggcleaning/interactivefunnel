-- =============================================================================
-- G&G Cleaning Services — Phase 1 Lead Persistence Migration
-- File: supabase/migrations/20260717000001_gg_phase1_leads.sql
-- 
-- Creates:
--   gg_leads              — Canonical lead persistence table
--   gg_crm_sync_queue     — Durable CRM delivery queue
--   gg_activity_logs      — Audit trail for lead lifecycle events
--   gg_persist_lead_and_queue() — Atomic RPC for lead + queue + activity
--
-- Security:
--   RLS enabled on all tables, service_role only
--   RPC restricted to service_role via explicit GRANT/REVOKE
--
-- Idempotency:
--   Leads: UNIQUE(request_id) with ON CONFLICT reconciliation
--   Queue: UNIQUE(idempotency_key) with ON CONFLICT DO NOTHING
--
-- Dependencies:
--   gen_random_uuid()     — built into Supabase/PostgreSQL 13+
--   pg_column_size()      — built into PostgreSQL
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Ensure updated_at trigger function exists
--    Both migration files define similar functions with different names.
--    We create our own with IF NOT EXISTS to avoid conflicts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- 1. gg_leads — Canonical lead persistence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gg_leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    lead_id         TEXT UNIQUE NOT NULL,           -- GGL-YYYYMMDD-XXXXXX
    request_id      TEXT UNIQUE NOT NULL,           -- UUID per submission attempt (idempotency)
    funnel_session_id TEXT,                         -- Stable UUID for one funnel session

    -- Classification
    source          TEXT NOT NULL,                  -- concierge, estimate_widget, quote_form, photo_quote, contact_form, success_page
    event_type      TEXT NOT NULL,                  -- quote_started, contact_captured, quote_completed, booking_confirmed, contact_inquiry
    lead_stage      TEXT,                           -- GHL-compatible stage label
    status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','synced','sync_failed','permanent_failure')),

    -- Contact (all nullable — not every source collects every field)
    first_name      TEXT,
    last_name       TEXT,
    email           TEXT,
    phone           TEXT,
    zip_code        TEXT,
    address         TEXT,
    city            TEXT,

    -- Service details
    service_category TEXT,
    frequency       TEXT,
    bedrooms        INTEGER,
    bathrooms       INTEGER,
    sqft            INTEGER,
    clutter_level   TEXT,
    has_pets        BOOLEAN,
    estimate_min    NUMERIC(10,2),
    estimate_max    NUMERIC(10,2),

    -- Cross-references
    quote_session_id   TEXT,                        -- Links events within one pricing session
    internal_quote_id  TEXT,                        -- GGQ-YYYY-XXXXXX for internal quotes

    -- Tracking
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    page_url        TEXT,
    fbp             TEXT,                           -- Meta browser cookie (_fbp)
    fbc             TEXT,                           -- Meta click cookie (_fbc)
    meta_event_id   TEXT,                           -- Shared browser Pixel + server CAPI deduplication ID

    -- Payment (populated by Phase 2 webhook)
    stripe_payment_intent_id TEXT,
    deposit_amount  NUMERIC(10,2),
    payment_status  TEXT,

    -- CRM cross-references
    ghl_contact_id      TEXT,
    ghl_opportunity_id  TEXT,

    -- Raw payload (strict size limit: 32KB)
    raw_payload     JSONB NOT NULL DEFAULT '{}'::JSONB
                    CHECK (pg_column_size(raw_payload) < 32768),
    tags            TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gg_leads_email          ON gg_leads (email)             WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gg_leads_phone          ON gg_leads (phone)             WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gg_leads_session        ON gg_leads (funnel_session_id) WHERE funnel_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gg_leads_status         ON gg_leads (status);
CREATE INDEX IF NOT EXISTS idx_gg_leads_created        ON gg_leads (created_at);
CREATE INDEX IF NOT EXISTS idx_gg_leads_stripe         ON gg_leads (stripe_payment_intent_id)
                                                       WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gg_leads_quote_session  ON gg_leads (quote_session_id)
                                                       WHERE quote_session_id IS NOT NULL;

-- RLS
ALTER TABLE gg_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_leads FORCE ROW LEVEL SECURITY;

CREATE POLICY gg_leads_service_role ON gg_leads
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Updated-at trigger
CREATE TRIGGER gg_leads_updated_at
    BEFORE UPDATE ON gg_leads
    FOR EACH ROW
    EXECUTE FUNCTION gg_update_timestamp();


-- ---------------------------------------------------------------------------
-- 2. gg_crm_sync_queue — Durable CRM delivery queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gg_crm_sync_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID REFERENCES gg_leads(id) ON DELETE SET NULL,

    -- Routing
    integration     TEXT NOT NULL DEFAULT 'ghl',    -- ghl, meta_capi, emailjs
    event_type      TEXT NOT NULL,                  -- concierge_lead, quote_requested, booking_confirmed, etc.

    -- Payload (strict size limit: 32KB)
    payload         JSONB NOT NULL
                    CHECK (pg_column_size(payload) < 32768),

    -- Idempotency
    idempotency_key TEXT UNIQUE NOT NULL,           -- lead_id::integration::event_type

    -- Processing state
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed_permanent')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    max_attempts    INTEGER NOT NULL DEFAULT 5,
    last_error      TEXT,                           -- Sanitized error message only

    -- Locking
    locked_at       TIMESTAMPTZ,
    locked_by       TEXT,                           -- Worker instance identifier
    lock_expires_at TIMESTAMPTZ,

    -- Scheduling
    next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gg_queue_pending     ON gg_crm_sync_queue (next_retry_at)
                                                    WHERE status IN ('pending');
CREATE INDEX IF NOT EXISTS idx_gg_queue_processing  ON gg_crm_sync_queue (lock_expires_at)
                                                    WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_gg_queue_lead        ON gg_crm_sync_queue (lead_id);

-- RLS
ALTER TABLE gg_crm_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_crm_sync_queue FORCE ROW LEVEL SECURITY;

CREATE POLICY gg_queue_service_role ON gg_crm_sync_queue
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Updated-at trigger
CREATE TRIGGER gg_queue_updated_at
    BEFORE UPDATE ON gg_crm_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION gg_update_timestamp();


-- ---------------------------------------------------------------------------
-- 3. gg_activity_logs — Lead lifecycle audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gg_activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID REFERENCES gg_leads(id) ON DELETE SET NULL,

    -- Event
    event           TEXT NOT NULL,                  -- lead_created, lead_updated, crm_synced, crm_sync_failed, etc.
    integration     TEXT,                           -- ghl, meta_capi, emailjs, stripe, system
    queue_id        UUID,                           -- References gg_crm_sync_queue(id) if relevant
    retry_count     INTEGER,
    error_code      TEXT,                           -- Sanitized error code (e.g. 'ghl_502', 'timeout')
    message         TEXT,                           -- Sanitized human-readable message

    -- Metadata (strict size limit: 8KB)
    metadata        JSONB DEFAULT '{}'::JSONB
                    CHECK (pg_column_size(metadata) < 8192),

    -- Timestamp
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gg_activity_lead    ON gg_activity_logs (lead_id);
CREATE INDEX IF NOT EXISTS idx_gg_activity_created ON gg_activity_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_gg_activity_event   ON gg_activity_logs (event);

-- RLS
ALTER TABLE gg_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_activity_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY gg_activity_service_role ON gg_activity_logs
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');


-- ---------------------------------------------------------------------------
-- 4. gg_persist_lead_and_queue — Atomic RPC
--    SECURITY INVOKER: Runs with caller's privileges.
--    Called from server-side Netlify functions using service_role key.
--    Explicitly restricted: REVOKE from PUBLIC/anon/authenticated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gg_persist_lead_and_queue(
    p_lead_id               TEXT,
    p_request_id            TEXT,
    p_source                TEXT,
    p_event_type            TEXT,
    p_funnel_session_id     TEXT            DEFAULT NULL,
    p_lead_stage            TEXT            DEFAULT NULL,
    p_first_name            TEXT            DEFAULT NULL,
    p_last_name             TEXT            DEFAULT NULL,
    p_email                 TEXT            DEFAULT NULL,
    p_phone                 TEXT            DEFAULT NULL,
    p_zip_code              TEXT            DEFAULT NULL,
    p_address               TEXT            DEFAULT NULL,
    p_city                  TEXT            DEFAULT NULL,
    p_service_category      TEXT            DEFAULT NULL,
    p_frequency             TEXT            DEFAULT NULL,
    p_bedrooms              INTEGER         DEFAULT NULL,
    p_bathrooms             INTEGER         DEFAULT NULL,
    p_sqft                  INTEGER         DEFAULT NULL,
    p_clutter_level         TEXT            DEFAULT NULL,
    p_has_pets              BOOLEAN         DEFAULT NULL,
    p_estimate_min          NUMERIC         DEFAULT NULL,
    p_estimate_max          NUMERIC         DEFAULT NULL,
    p_quote_session_id      TEXT            DEFAULT NULL,
    p_internal_quote_id     TEXT            DEFAULT NULL,
    p_utm_source            TEXT            DEFAULT NULL,
    p_utm_medium            TEXT            DEFAULT NULL,
    p_utm_campaign          TEXT            DEFAULT NULL,
    p_page_url              TEXT            DEFAULT NULL,
    p_fbp                   TEXT            DEFAULT NULL,
    p_fbc                   TEXT            DEFAULT NULL,
    p_meta_event_id         TEXT            DEFAULT NULL,
    p_raw_payload           JSONB           DEFAULT '{}'::JSONB,
    p_tags                  TEXT[]          DEFAULT '{}'::TEXT[],
    p_enable_crm_queue      BOOLEAN         DEFAULT TRUE,
    p_crm_integration       TEXT            DEFAULT 'ghl',
    p_crm_event_type        TEXT            DEFAULT NULL,
    p_crm_payload           JSONB           DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_lead_uuid         UUID;
    v_lead_created      BOOLEAN := FALSE;
    v_queue_id          UUID;
    v_queue_created     BOOLEAN := FALSE;
    v_idempotency_key   TEXT;
    v_crm_event_type    TEXT;
BEGIN
    -- Validate required fields
    IF p_lead_id IS NULL OR p_lead_id = '' THEN
        RAISE EXCEPTION 'lead_id is required';
    END IF;
    IF p_request_id IS NULL OR p_request_id = '' THEN
        RAISE EXCEPTION 'request_id is required';
    END IF;
    IF p_source IS NULL OR p_source = '' THEN
        RAISE EXCEPTION 'source is required';
    END IF;
    IF p_event_type IS NULL OR p_event_type = '' THEN
        RAISE EXCEPTION 'event_type is required';
    END IF;

    -- 1. Upsert lead (idempotent on request_id)
    INSERT INTO gg_leads (
        lead_id, request_id, funnel_session_id,
        source, event_type, lead_stage, status,
        first_name, last_name, email, phone, zip_code, address, city,
        service_category, frequency, bedrooms, bathrooms, sqft,
        clutter_level, has_pets, estimate_min, estimate_max,
        quote_session_id, internal_quote_id,
        utm_source, utm_medium, utm_campaign, page_url,
        fbp, fbc, meta_event_id,
        raw_payload, tags
    ) VALUES (
        p_lead_id, p_request_id, p_funnel_session_id,
        p_source, p_event_type, p_lead_stage, 'new',
        p_first_name, p_last_name, p_email, p_phone, p_zip_code, p_address, p_city,
        p_service_category, p_frequency, p_bedrooms, p_bathrooms, p_sqft,
        p_clutter_level, p_has_pets, p_estimate_min, p_estimate_max,
        p_quote_session_id, p_internal_quote_id,
        p_utm_source, p_utm_medium, p_utm_campaign, p_page_url,
        p_fbp, p_fbc, p_meta_event_id,
        p_raw_payload, p_tags
    )
    ON CONFLICT (request_id) DO UPDATE SET
        -- Update enrichable fields (don't overwrite with NULLs)
        event_type      = EXCLUDED.event_type,
        lead_stage      = COALESCE(EXCLUDED.lead_stage, gg_leads.lead_stage),
        first_name      = COALESCE(EXCLUDED.first_name, gg_leads.first_name),
        last_name       = COALESCE(EXCLUDED.last_name,  gg_leads.last_name),
        email           = COALESCE(EXCLUDED.email,      gg_leads.email),
        phone           = COALESCE(EXCLUDED.phone,      gg_leads.phone),
        zip_code        = COALESCE(EXCLUDED.zip_code,   gg_leads.zip_code),
        address         = COALESCE(EXCLUDED.address,    gg_leads.address),
        city            = COALESCE(EXCLUDED.city,       gg_leads.city),
        meta_event_id   = COALESCE(EXCLUDED.meta_event_id, gg_leads.meta_event_id),
        raw_payload     = EXCLUDED.raw_payload,
        tags            = EXCLUDED.tags,
        updated_at      = NOW()
    RETURNING id, (xmax = 0) INTO v_lead_uuid, v_lead_created;

    -- 2. Create CRM queue entry if enabled (idempotent on idempotency_key)
    v_crm_event_type := COALESCE(p_crm_event_type, p_event_type);

    IF p_enable_crm_queue AND p_crm_payload IS NOT NULL THEN
        v_idempotency_key := p_lead_id || '::' || p_crm_integration || '::' || v_crm_event_type;

        INSERT INTO gg_crm_sync_queue (
            lead_id, integration, event_type,
            payload, idempotency_key,
            status, max_attempts, next_retry_at
        ) VALUES (
            v_lead_uuid, p_crm_integration, v_crm_event_type,
            p_crm_payload, v_idempotency_key,
            'pending', 5, NOW()
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_queue_id;

        v_queue_created := (v_queue_id IS NOT NULL);
    END IF;

    -- 3. Create activity log entry
    INSERT INTO gg_activity_logs (
        lead_id, event, integration, queue_id,
        metadata
    ) VALUES (
        v_lead_uuid,
        CASE WHEN v_lead_created THEN 'lead_created' ELSE 'lead_reconciled' END,
        p_crm_integration,
        v_queue_id,
        jsonb_build_object(
            'source', p_source,
            'event_type', p_event_type,
            'lead_created', v_lead_created,
            'queue_created', v_queue_created
        )
    );

    -- 4. Return canonical identifiers
    RETURN jsonb_build_object(
        'lead_id',       p_lead_id,
        'lead_uuid',     v_lead_uuid,
        'lead_created',  v_lead_created,
        'queue_id',      v_queue_id,
        'queue_created', v_queue_created
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC Security — Restrict execution to service_role only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, INTEGER, INTEGER, INTEGER,
    TEXT, BOOLEAN, NUMERIC, NUMERIC,
    TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT,
    JSONB, TEXT[],
    BOOLEAN, TEXT, TEXT, JSONB
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, INTEGER, INTEGER, INTEGER,
    TEXT, BOOLEAN, NUMERIC, NUMERIC,
    TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT,
    JSONB, TEXT[],
    BOOLEAN, TEXT, TEXT, JSONB
) FROM anon;

REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, INTEGER, INTEGER, INTEGER,
    TEXT, BOOLEAN, NUMERIC, NUMERIC,
    TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT,
    JSONB, TEXT[],
    BOOLEAN, TEXT, TEXT, JSONB
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, INTEGER, INTEGER, INTEGER,
    TEXT, BOOLEAN, NUMERIC, NUMERIC,
    TEXT, TEXT,
    TEXT, TEXT, TEXT, TEXT,
    TEXT, TEXT, TEXT,
    JSONB, TEXT[],
    BOOLEAN, TEXT, TEXT, JSONB
) TO service_role;


-- ---------------------------------------------------------------------------
-- 6. Table-level privilege grants (belt and suspenders with RLS)
-- ---------------------------------------------------------------------------
REVOKE ALL ON gg_leads FROM PUBLIC, anon, authenticated;
REVOKE ALL ON gg_crm_sync_queue FROM PUBLIC, anon, authenticated;
REVOKE ALL ON gg_activity_logs FROM PUBLIC, anon, authenticated;

GRANT ALL ON gg_leads TO service_role;
GRANT ALL ON gg_crm_sync_queue TO service_role;
GRANT ALL ON gg_activity_logs TO service_role;


-- ---------------------------------------------------------------------------
-- 7. Migration verification comment
-- ---------------------------------------------------------------------------
COMMENT ON TABLE  gg_leads IS 'G&G Phase 1: Canonical lead persistence. All customer-facing entry points must persist here before CRM delivery.';
COMMENT ON TABLE  gg_crm_sync_queue IS 'G&G Phase 1: Durable CRM delivery queue with locking, retries, and permanent-failure handling.';
COMMENT ON TABLE  gg_activity_logs IS 'G&G Phase 1: Audit trail for lead lifecycle events. Strict 8KB metadata limit per row.';
COMMENT ON FUNCTION gg_persist_lead_and_queue IS 'G&G Phase 1: Atomic RPC — creates/reconciles lead + queue entry + activity log in one transaction. service_role only.';
