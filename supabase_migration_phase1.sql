-- G&G Internal Quote Console: Phase 1 Schema Migration

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create CUSTOMERS table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ghl_contact_id TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT,
    phone TEXT,
    normalized_phone TEXT UNIQUE,
    service_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    lead_source TEXT DEFAULT 'Internal Quote Desk',
    sync_status TEXT DEFAULT 'pending',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create QUOTES table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internal_quote_id TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    sales_ghl_opportunity_id TEXT,
    cleaning_ghl_opportunity_id TEXT, -- Future use
    quote_status TEXT DEFAULT 'draft',
    quote_total NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) NOT NULL,
    balance_due NUMERIC(10, 2) NOT NULL,
    quote_data JSONB NOT NULL DEFAULT '{}',
    sync_status TEXT DEFAULT 'pending',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Future fields (nullable)
    proposal_pdf_url TEXT,
    agreement_url TEXT,
    deposit_payment_url TEXT,
    final_invoice_url TEXT
);

-- 4. Create SYNC_EVENTS table
CREATE TABLE IF NOT EXISTS sync_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL, -- 'customer', 'quote'
    entity_id UUID,
    internal_quote_id TEXT,
    provider TEXT DEFAULT 'GHL',
    action TEXT NOT NULL, -- 'contact_upsert', 'opportunity_upsert'
    status TEXT NOT NULL, -- 'success', 'failed'
    request_summary JSONB,
    response_summary JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create AUDIT_LOGS table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_type TEXT DEFAULT 'staff',
    actor_id TEXT, -- Staff PIN or ID
    entity_type TEXT NOT NULL,
    entity_id UUID,
    internal_quote_id TEXT,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_quotes_modtime BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 7. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_internal_quote_id ON sync_events(internal_quote_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_internal_quote_id ON audit_logs(internal_quote_id);
