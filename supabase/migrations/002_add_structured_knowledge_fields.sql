-- Migration: Add structured fields to knowledges table for Knowledge V2
-- Description: Adds columns for background, rationale (JSONB), examples (JSONB), and common_mistakes (TEXT[]).

ALTER TABLE public.knowledges 
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS rationale JSONB DEFAULT '{"laws": [], "internal_rules": []}'::jsonb,
ADD COLUMN IF NOT EXISTS examples JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS common_mistakes TEXT[] DEFAULT '{}';

-- Optional: Add a column for source_url if not exists (referenced in some docs)
ALTER TABLE public.knowledges
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update updated_at trigger logic if needed (Assuming standard Supabase triggers might be there)
-- If there's an updated_at column, ensure it's handled.
