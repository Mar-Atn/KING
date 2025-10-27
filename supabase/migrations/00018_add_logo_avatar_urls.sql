-- Migration: Add logo URL support to clans table
-- Description: Add logo_url to clans table for printable materials
-- Note: avatar_url already exists in roles table

-- Add logo_url to clans table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clans' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE clans ADD COLUMN logo_url TEXT;
        COMMENT ON COLUMN clans.logo_url IS 'URL to clan logo/emblem image for printable materials';
    END IF;
END $$;

-- Note: For simulation_templates, logo_url and avatar_url will be stored within
-- the canonical_clans and canonical_roles JSONB fields, not as separate columns.
-- The template JSONB structure should include these fields for each clan/role.
