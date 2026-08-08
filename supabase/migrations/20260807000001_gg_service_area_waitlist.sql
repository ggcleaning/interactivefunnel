-- =============================================================================
-- G&G Cleaning Services — Service Area Expansion Waitlist Migration
-- File: supabase/migrations/20260807000001_gg_service_area_waitlist.sql
-- 
-- Creates:
--   gg_service_area_waitlist — Isolated storage for out-of-area notification requests
--
-- Security:
--   RLS enabled & forced, service_role access ONLY
--   PUBLIC, anon, and authenticated roles strictly REVOKED
-- =============================================================================

CREATE TABLE IF NOT EXISTS gg_service_area_waitlist (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   TEXT NOT NULL,
    phone                   TEXT,
    zip_code                TEXT NOT NULL,
    marketing_consent       BOOLEAN NOT NULL DEFAULT TRUE,
    consent_timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_policy_version  TEXT NOT NULL DEFAULT 'v1.0-2026',
    ip_address              TEXT,
    user_agent              TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_waitlist_email_zip UNIQUE (email, zip_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_zip ON gg_service_area_waitlist(zip_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON gg_service_area_waitlist(email);

-- Row Level Security (RLS)
ALTER TABLE gg_service_area_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_service_area_waitlist FORCE ROW LEVEL SECURITY;

CREATE POLICY gg_waitlist_service_role ON gg_service_area_waitlist
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Strict Privilege Grants
REVOKE ALL ON gg_service_area_waitlist FROM PUBLIC, anon, authenticated;
GRANT ALL ON gg_service_area_waitlist TO service_role;

-- Table Comment
COMMENT ON TABLE gg_service_area_waitlist IS 'G&G: Isolated out-of-area expansion waitlist storage. service_role access ONLY.';
