-- ============================================================================
-- G&G Cleaning Services — Phase 3A.0 Staff Auth Foundation Migration
-- File: supabase/migrations/20260721000001_gg_staff_auth.sql
-- Description: Idempotent migration creating public.gg_staff_profiles table
--              with strict Row Level Security (RLS) and role constraints.
-- ============================================================================

-- 1. Create gg_staff_profiles table
CREATE TABLE IF NOT EXISTS public.gg_staff_profiles (
    user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT NOT NULL UNIQUE,
    display_name  TEXT,
    role          TEXT NOT NULL CHECK (role IN ('owner_admin', 'staff')),
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    UUID NULL REFERENCES auth.users(id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.gg_staff_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Revoke direct access from PUBLIC, anon, and authenticated roles
REVOKE ALL ON TABLE public.gg_staff_profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.gg_staff_profiles FROM anon;
REVOKE ALL ON TABLE public.gg_staff_profiles FROM authenticated;

-- 4. Grant explicit server-side access to service_role ONLY
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gg_staff_profiles TO service_role;

-- 5. Updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.gg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gg_staff_profiles_updated_at ON public.gg_staff_profiles;
CREATE TRIGGER trg_gg_staff_profiles_updated_at
    BEFORE UPDATE ON public.gg_staff_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.gg_set_updated_at();

-- 6. Indexing
CREATE INDEX IF NOT EXISTS idx_gg_staff_profiles_role ON public.gg_staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_gg_staff_profiles_is_active ON public.gg_staff_profiles(is_active);
