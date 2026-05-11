-- Phase 2: Proposal & Agreement Document Support
-- Run this in the Supabase SQL Editor

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS proposal_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS proposal_status TEXT DEFAULT 'not_generated',
ADD COLUMN IF NOT EXISTS proposal_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agreement_url TEXT,
ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_generated',
ADD COLUMN IF NOT EXISTS agreement_generated_at TIMESTAMPTZ;

-- Update existing quotes to have the default status
UPDATE quotes SET proposal_status = 'not_generated' WHERE proposal_status IS NULL;
UPDATE quotes SET agreement_status = 'not_generated' WHERE agreement_status IS NULL;

-- Enable public access to the documents bucket if not already done via UI
-- Note: This requires the storage extension to be enabled
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;
