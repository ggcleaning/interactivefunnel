-- =============================================================================
-- G&G Cleaning Services — Phase 2: Stripe Reconciliation Migration
-- File: supabase/migrations/20260720000001_gg_phase2_stripe.sql
-- 
-- Creates:
--   gg_stripe_webhook_events    — Event ledger for Stripe webhook idempotency
--   idx_gg_leads_stripe_pi_unique — Database-level payment uniqueness index
--   gg_reconcile_stripe_payment — Dedicated RPC for payment reconciliation
--
-- Security:
--   RLS enabled on gg_stripe_webhook_events, service_role only
--   RPC restricted to service_role via explicit GRANT/REVOKE (SECURITY INVOKER)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. gg_stripe_webhook_events — Idempotency Ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gg_stripe_webhook_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id         TEXT UNIQUE NOT NULL,
    stripe_payment_intent_id TEXT,
    event_type              TEXT NOT NULL,
    processing_status       TEXT NOT NULL DEFAULT 'received'
                            CHECK (processing_status IN ('received', 'processed', 'failed')),
    attempt_count           INTEGER NOT NULL DEFAULT 1,
    last_error              TEXT,
    received_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at            TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gg_stripe_events_pi ON public.gg_stripe_webhook_events (stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gg_stripe_events_status ON public.gg_stripe_webhook_events (processing_status);

-- RLS
ALTER TABLE public.gg_stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gg_stripe_webhook_events FORCE ROW LEVEL SECURITY;

CREATE POLICY gg_stripe_events_service_role ON public.gg_stripe_webhook_events
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');


-- ---------------------------------------------------------------------------
-- 2. Database-level payment uniqueness on gg_leads
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_gg_leads_stripe_pi_unique 
    ON public.gg_leads(stripe_payment_intent_id) 
    WHERE stripe_payment_intent_id IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 3. Dedicated Stripe Reconciliation RPC: gg_reconcile_stripe_payment
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gg_reconcile_stripe_payment(
    p_stripe_event_id           TEXT,
    p_stripe_payment_intent_id   TEXT,
    p_lead_uuid                 UUID            DEFAULT NULL,
    p_request_id                TEXT            DEFAULT NULL,
    p_amount_cents              INTEGER         DEFAULT NULL,
    p_currency                  TEXT            DEFAULT 'usd',
    p_payment_status            TEXT            DEFAULT 'succeeded',
    p_payment_flow              TEXT            DEFAULT NULL,
    p_enable_crm_queue          BOOLEAN         DEFAULT TRUE,
    p_meta_event_id             TEXT            DEFAULT NULL,
    p_raw_payload               JSONB           DEFAULT '{}'::JSONB,
    p_crm_integration           TEXT            DEFAULT 'ghl',
    p_crm_event_type            TEXT            DEFAULT 'booking_confirmed',
    p_crm_payload               JSONB           DEFAULT NULL,
    p_tags                      TEXT[]          DEFAULT '{}'::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_existing_event_status TEXT;
    v_lead_uuid             UUID := p_lead_uuid;
    v_lead_id               TEXT;
    v_request_id            TEXT := p_request_id;
    v_lead_created          BOOLEAN := FALSE;
    v_queue_id              UUID := NULL;
    v_queue_created         BOOLEAN := FALSE;
    v_idempotency_key       TEXT;
    v_deposit_amount        NUMERIC(10,2);
    v_event_type            TEXT;
    v_lead_stage            TEXT;
BEGIN
    -- Validate required parameters
    IF p_stripe_event_id IS NULL OR p_stripe_event_id = '' THEN
        RAISE EXCEPTION 'stripe_event_id is required';
    END IF;

    v_deposit_amount := CASE WHEN p_amount_cents IS NOT NULL THEN (p_amount_cents::NUMERIC / 100.0) ELSE NULL END;
    v_event_type := CASE WHEN p_payment_status = 'failed' THEN 'payment_failed' ELSE 'booking_confirmed' END;
    v_lead_stage := CASE WHEN p_payment_status = 'failed' THEN 'Payment Failed' ELSE 'Deposit Paid' END;

    -- 1. Check idempotency ledger for this Stripe Event ID
    SELECT processing_status INTO v_existing_event_status
    FROM public.gg_stripe_webhook_events
    WHERE stripe_event_id = p_stripe_event_id;

    IF v_existing_event_status = 'processed' THEN
        -- Locate existing lead to return canonical details
        IF v_lead_uuid IS NULL AND p_request_id IS NOT NULL AND p_request_id <> '' THEN
            SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE request_id = p_request_id LIMIT 1;
        END IF;
        IF v_lead_uuid IS NULL AND p_stripe_payment_intent_id IS NOT NULL AND p_stripe_payment_intent_id <> '' THEN
            SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE stripe_payment_intent_id = p_stripe_payment_intent_id LIMIT 1;
        END IF;

        RETURN jsonb_build_object(
            'stripe_event_id',  p_stripe_event_id,
            'lead_uuid',        v_lead_uuid,
            'lead_created',     FALSE,
            'reconciled',       TRUE,
            'already_processed', TRUE
        );
    END IF;

    -- Upsert/Record event entry as received/processing
    INSERT INTO public.gg_stripe_webhook_events (
        stripe_event_id, stripe_payment_intent_id, event_type, processing_status, received_at
    ) VALUES (
        p_stripe_event_id, p_stripe_payment_intent_id, v_event_type, 'received', NOW()
    )
    ON CONFLICT (stripe_event_id) DO UPDATE SET
        attempt_count = gg_stripe_webhook_events.attempt_count + 1;

    -- 2. Locate canonical lead: lead_uuid -> request_id -> stripe_payment_intent_id
    IF v_lead_uuid IS NOT NULL THEN
        PERFORM 1 FROM public.gg_leads WHERE id = v_lead_uuid;
        IF NOT FOUND THEN
            v_lead_uuid := NULL;
        END IF;
    END IF;

    IF v_lead_uuid IS NULL AND p_request_id IS NOT NULL AND p_request_id <> '' THEN
        SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE request_id = p_request_id LIMIT 1;
    END IF;

    IF v_lead_uuid IS NULL AND p_stripe_payment_intent_id IS NOT NULL AND p_stripe_payment_intent_id <> '' THEN
        SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE stripe_payment_intent_id = p_stripe_payment_intent_id LIMIT 1;
    END IF;

    -- 3. Execute Upsert logic
    IF v_lead_uuid IS NOT NULL THEN
        -- Reconcile and update payment fields without overwriting non-null lead fields with NULL
        UPDATE public.gg_leads SET
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, gg_leads.stripe_payment_intent_id),
            deposit_amount           = COALESCE(v_deposit_amount, gg_leads.deposit_amount),
            payment_status           = COALESCE(p_payment_status, gg_leads.payment_status),
            meta_event_id            = COALESCE(p_meta_event_id, gg_leads.meta_event_id),
            event_type               = COALESCE(v_event_type, gg_leads.event_type),
            lead_stage               = COALESCE(v_lead_stage, gg_leads.lead_stage),
            tags                     = ARRAY(SELECT DISTINCT unnest(gg_leads.tags || p_tags)),
            updated_at               = NOW()
        WHERE id = v_lead_uuid;
        
        v_lead_created := FALSE;
    ELSE
        -- Insert a new lead if no canonical lead exists
        v_lead_id := 'GGL-ST-' || floor(100000 + random() * 900000)::text;
        IF v_request_id IS NULL OR v_request_id = '' THEN
            v_request_id := gen_random_uuid()::text;
        END IF;

        BEGIN
            INSERT INTO public.gg_leads (
                lead_id, request_id, source, event_type, lead_stage, status,
                stripe_payment_intent_id, deposit_amount, payment_status, meta_event_id,
                raw_payload, tags
            ) VALUES (
                v_lead_id, v_request_id, 'stripe_webhook', v_event_type, v_lead_stage, 'new',
                p_stripe_payment_intent_id, v_deposit_amount, p_payment_status, p_meta_event_id,
                p_raw_payload, p_tags
            )
            RETURNING id INTO v_lead_uuid;
            v_lead_created := TRUE;
        EXCEPTION WHEN unique_violation THEN
            -- Handle race condition
            IF p_stripe_payment_intent_id IS NOT NULL AND p_stripe_payment_intent_id <> '' THEN
                SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE stripe_payment_intent_id = p_stripe_payment_intent_id LIMIT 1;
            END IF;
            IF v_lead_uuid IS NULL AND v_request_id IS NOT NULL AND v_request_id <> '' THEN
                SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE request_id = v_request_id LIMIT 1;
            END IF;

            IF v_lead_uuid IS NOT NULL THEN
                UPDATE public.gg_leads SET
                    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, gg_leads.stripe_payment_intent_id),
                    deposit_amount           = COALESCE(v_deposit_amount, gg_leads.deposit_amount),
                    payment_status           = COALESCE(p_payment_status, gg_leads.payment_status),
                    meta_event_id            = COALESCE(p_meta_event_id, gg_leads.meta_event_id),
                    tags                     = ARRAY(SELECT DISTINCT unnest(gg_leads.tags || p_tags)),
                    updated_at               = NOW()
                WHERE id = v_lead_uuid;
                v_lead_created := FALSE;
            ELSE
                RAISE;
            END IF;
        END;
    END IF;

    -- Fetch lead_id for queue key construction
    SELECT lead_id INTO v_lead_id FROM public.gg_leads WHERE id = v_lead_uuid;

    -- 4. Queue downstream CRM delivery if enabled; otherwise log crm_sync_skipped
    IF p_enable_crm_queue AND p_crm_payload IS NOT NULL AND p_payment_status <> 'failed' THEN
        v_idempotency_key := v_lead_id || '::' || p_crm_integration || '::' || p_crm_event_type;

        INSERT INTO public.gg_crm_sync_queue (
            lead_id, integration, event_type,
            payload, idempotency_key,
            status, max_attempts, next_retry_at
        ) VALUES (
            v_lead_uuid, p_crm_integration, p_crm_event_type,
            p_crm_payload, v_idempotency_key,
            'pending', 5, NOW()
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_queue_id;

        v_queue_created := (v_queue_id IS NOT NULL);
    ELSIF NOT p_enable_crm_queue THEN
        -- Log CRM sync skipped when GHL disabled
        INSERT INTO public.gg_activity_logs (
            lead_id, event, integration, metadata
        ) VALUES (
            v_lead_uuid,
            'crm_sync_skipped',
            p_crm_integration,
            jsonb_build_object(
                'reason', 'ghl_disabled',
                'stripe_event_id', p_stripe_event_id,
                'stripe_payment_intent_id', p_stripe_payment_intent_id
            )
        );
    END IF;

    -- 5. Log lifecycle activity log
    INSERT INTO public.gg_activity_logs (
        lead_id, event, integration, queue_id, metadata
    ) VALUES (
        v_lead_uuid,
        CASE WHEN v_lead_created THEN 'lead_created' ELSE 'lead_reconciled' END,
        'stripe',
        v_queue_id,
        jsonb_build_object(
            'stripe_event_id', p_stripe_event_id,
            'stripe_payment_intent_id', p_stripe_payment_intent_id,
            'deposit_amount', v_deposit_amount,
            'payment_status', p_payment_status,
            'lead_created', v_lead_created,
            'queue_created', v_queue_created
        )
    );

    -- 6. Mark Stripe event as processed in ledger
    UPDATE public.gg_stripe_webhook_events SET
        processing_status = 'processed',
        processed_at = NOW(),
        stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, gg_stripe_webhook_events.stripe_payment_intent_id)
    WHERE stripe_event_id = p_stripe_event_id;

    RETURN jsonb_build_object(
        'stripe_event_id',  p_stripe_event_id,
        'lead_uuid',        v_lead_uuid,
        'lead_id',          v_lead_id,
        'lead_created',     v_lead_created,
        'reconciled',       NOT v_lead_created,
        'queue_id',         v_queue_id,
        'queue_created',    v_queue_created,
        'already_processed', FALSE
    );
END;
$$;


-- ---------------------------------------------------------------------------
-- 4. RPC Security Configuration
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.gg_reconcile_stripe_payment(
    TEXT, TEXT, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT[]
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.gg_reconcile_stripe_payment(
    TEXT, TEXT, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT[]
) FROM anon;

REVOKE ALL ON FUNCTION public.gg_reconcile_stripe_payment(
    TEXT, TEXT, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT[]
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.gg_reconcile_stripe_payment(
    TEXT, TEXT, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT[]
) TO service_role;
