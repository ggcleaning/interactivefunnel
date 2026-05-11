-- Phase 1 Foundation: G&G Cleaning Services Internal Ops

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    ghl_contact_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_quote_id TEXT UNIQUE NOT NULL, -- Format: GGQ-YYYY-XXXXXX
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft', -- 'draft', 'synced', 'failed'
    total_amount NUMERIC(10, 2),
    deposit_amount NUMERIC(10, 2),
    ghl_opportunity_id TEXT,
    quote_data JSONB NOT NULL, -- Full snapshot of the quote parameters
    sync_status TEXT DEFAULT 'pending',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sync Events (Log every outbound request to GHL)
CREATE TABLE IF NOT EXISTS sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'contact', 'opportunity'
    event_type TEXT NOT NULL, -- 'search', 'create', 'update'
    payload JSONB,
    response JSONB,
    status TEXT, -- 'success', 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs (Log staff actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'quote', 'customer'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'synced'
    actor_id TEXT, -- Staff PIN or ID
    changes JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_quotes_internal_id ON quotes(internal_quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_quote_id ON sync_events(quote_id);

-- Updated at triggers (Optional but good practice)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
