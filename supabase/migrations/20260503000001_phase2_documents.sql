-- Add columns for Phase 2 Document Automation
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS proposal_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS agreement_url TEXT,
ADD COLUMN IF NOT EXISTS proposal_status TEXT DEFAULT 'not_generated',
ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_generated',
ADD COLUMN IF NOT EXISTS proposal_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agreement_generated_at TIMESTAMPTZ;

-- Update valid statuses via check constraint (optional but recommended)
-- ALTER TABLE quotes ADD CONSTRAINT quote_proposal_status_check 
-- CHECK (proposal_status IN ('not_generated', 'generating', 'generated', 'generation_failed', 'synced_to_ghl'));

-- ALTER TABLE quotes ADD CONSTRAINT quote_agreement_status_check 
-- CHECK (agreement_status IN ('not_generated', 'generating', 'generated', 'generation_failed', 'synced_to_ghl'));

-- Add comment for documentation
COMMENT ON COLUMN quotes.proposal_pdf_url IS 'Public URL for the generated branded proposal PDF in Supabase Storage';
COMMENT ON COLUMN quotes.agreement_url IS 'Public URL for the generated branded service agreement PDF in Supabase Storage';
