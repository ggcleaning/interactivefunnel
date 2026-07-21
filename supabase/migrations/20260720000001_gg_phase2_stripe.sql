-- ---------------------------------------------------------------------------
-- G&G Cleaning Services — Phase 2: Stripe Webhook & Persistence Integration
-- ---------------------------------------------------------------------------

-- 1. Create a unique index on stripe_payment_intent_id to ensure database-level payment uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_gg_leads_stripe_pi_unique 
    ON public.gg_leads(stripe_payment_intent_id) 
    WHERE stripe_payment_intent_id IS NOT NULL;

-- 2. Drop the old Phase 1 function signature first to prevent conflicts during replacement
DROP FUNCTION IF EXISTS public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, NUMERIC, NUMERIC, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[], BOOLEAN, TEXT, TEXT, JSONB
);

-- 3. Re-create the function with Phase 2 parameters and dual-index programmatic upsert logic
CREATE OR REPLACE FUNCTION public.gg_persist_lead_and_queue(
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
    p_crm_payload           JSONB           DEFAULT NULL,
    -- Phase 2 payment details
    p_stripe_payment_intent_id TEXT         DEFAULT NULL,
    p_deposit_amount        NUMERIC(10,2)   DEFAULT NULL,
    p_payment_status        TEXT            DEFAULT NULL
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

    -- Programmatic upsert: Try to locate an existing lead by stripe_payment_intent_id first
    IF p_stripe_payment_intent_id IS NOT NULL AND p_stripe_payment_intent_id <> '' THEN
        SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE stripe_payment_intent_id = p_stripe_payment_intent_id LIMIT 1;
    END IF;

    -- If not found, try to locate by request_id
    IF v_lead_uuid IS NULL AND p_request_id IS NOT NULL AND p_request_id <> '' THEN
        SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE request_id = p_request_id LIMIT 1;
    END IF;

    -- Execute Upsert logic
    IF v_lead_uuid IS NOT NULL THEN
        -- Reconcile and merge incoming fields into existing row
        UPDATE public.gg_leads SET
            event_type               = p_event_type,
            lead_stage               = COALESCE(p_lead_stage, gg_leads.lead_stage),
            first_name               = COALESCE(p_first_name, gg_leads.first_name),
            last_name                = COALESCE(p_last_name,  gg_leads.last_name),
            email                    = COALESCE(p_email,      gg_leads.email),
            phone                    = COALESCE(p_phone,      gg_leads.phone),
            zip_code                 = COALESCE(p_zip_code,   gg_leads.zip_code),
            address                  = COALESCE(p_address,    gg_leads.address),
            city                     = COALESCE(p_city,       gg_leads.city),
            meta_event_id            = COALESCE(p_meta_event_id, gg_leads.meta_event_id),
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, gg_leads.stripe_payment_intent_id),
            deposit_amount           = COALESCE(p_deposit_amount, gg_leads.deposit_amount),
            payment_status           = COALESCE(p_payment_status, gg_leads.payment_status),
            raw_payload              = p_raw_payload,
            tags                     = p_tags,
            updated_at               = NOW()
        WHERE id = v_lead_uuid;
        
        v_lead_created := FALSE;
    ELSE
        -- Insert a new canonical lead row
        BEGIN
            INSERT INTO public.gg_leads (
                lead_id, request_id, funnel_session_id,
                source, event_type, lead_stage, status,
                first_name, last_name, email, phone, zip_code, address, city,
                service_category, frequency, bedrooms, bathrooms, sqft,
                clutter_level, has_pets, estimate_min, estimate_max,
                quote_session_id, internal_quote_id,
                utm_source, utm_medium, utm_campaign, page_url,
                fbp, fbc, meta_event_id,
                stripe_payment_intent_id, deposit_amount, payment_status,
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
                p_stripe_payment_intent_id, p_deposit_amount, p_payment_status,
                p_raw_payload, p_tags
            )
            RETURNING id INTO v_lead_uuid;
            v_lead_created := TRUE;
        EXCEPTION WHEN unique_violation THEN
            -- Rescue concurrent race conditions by pulling the raced row and updating it
            IF p_stripe_payment_intent_id IS NOT NULL AND p_stripe_payment_intent_id <> '' THEN
                SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE stripe_payment_intent_id = p_stripe_payment_intent_id LIMIT 1;
            END IF;
            IF v_lead_uuid IS NULL AND p_request_id IS NOT NULL AND p_request_id <> '' THEN
                SELECT id INTO v_lead_uuid FROM public.gg_leads WHERE request_id = p_request_id LIMIT 1;
            END IF;
            
            IF v_lead_uuid IS NOT NULL THEN
                UPDATE public.gg_leads SET
                    event_type               = p_event_type,
                    lead_stage               = COALESCE(p_lead_stage, gg_leads.lead_stage),
                    first_name               = COALESCE(p_first_name, gg_leads.first_name),
                    last_name                = COALESCE(p_last_name,  gg_leads.last_name),
                    email                    = COALESCE(p_email,      gg_leads.email),
                    phone                    = COALESCE(p_phone,      gg_leads.phone),
                    zip_code                 = COALESCE(p_zip_code,   gg_leads.zip_code),
                    address                  = COALESCE(p_address,    gg_leads.address),
                    city                     = COALESCE(p_city,       gg_leads.city),
                    meta_event_id            = COALESCE(p_meta_event_id, gg_leads.meta_event_id),
                    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, gg_leads.stripe_payment_intent_id),
                    deposit_amount           = COALESCE(p_deposit_amount, gg_leads.deposit_amount),
                    payment_status           = COALESCE(p_payment_status, gg_leads.payment_status),
                    raw_payload              = p_raw_payload,
                    tags                     = p_tags,
                    updated_at               = NOW()
                WHERE id = v_lead_uuid;
                v_lead_created := FALSE;
            ELSE
                RAISE;
            END IF;
        END;
    END IF;

    -- Create CRM sync queue entry if enabled (idempotent on idempotency_key)
    v_crm_event_type := COALESCE(p_crm_event_type, p_event_type);

    IF p_enable_crm_queue AND p_crm_payload IS NOT NULL THEN
        v_idempotency_key := p_lead_id || '::' || p_crm_integration || '::' || v_crm_event_type;

        INSERT INTO public.gg_crm_sync_queue (
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

    -- Log activity
    INSERT INTO public.gg_activity_logs (
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

    -- Return canonical details
    RETURN jsonb_build_object(
        'lead_id',       p_lead_id,
        'lead_uuid',     v_lead_uuid,
        'lead_created',  v_lead_created,
        'queue_id',      v_queue_id,
        'queue_created', v_queue_created
    );
END;
$$;

-- 4. RPC Security Configuration
REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, NUMERIC, NUMERIC, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[], BOOLEAN, TEXT, TEXT, JSONB,
    TEXT, NUMERIC, TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, NUMERIC, NUMERIC, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[], BOOLEAN, TEXT, TEXT, JSONB,
    TEXT, NUMERIC, TEXT
) FROM anon;

REVOKE ALL ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, NUMERIC, NUMERIC, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[], BOOLEAN, TEXT, TEXT, JSONB,
    TEXT, NUMERIC, TEXT
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.gg_persist_lead_and_queue(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, NUMERIC, NUMERIC, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[], BOOLEAN, TEXT, TEXT, JSONB,
    TEXT, NUMERIC, TEXT
) TO service_role;
