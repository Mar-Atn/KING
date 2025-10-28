-- ============================================================================
-- Migration: 00030_fix_is_facilitator_function.sql
-- Description: Revert is_facilitator to plpgsql (sql STABLE breaks RLS)
-- Purpose: Fix "new row violates row-level security policy" on sim_runs insert
-- ============================================================================
-- Date: 2025-10-27
-- Issue: is_facilitator() changed to LANGUAGE sql in 00021, breaks in RLS context
-- Root Cause: sql STABLE functions evaluate differently than plpgsql in RLS
-- ============================================================================

-- Revert to original plpgsql version that works with RLS
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'facilitator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'is_facilitator() function reverted to plpgsql';
  RAISE NOTICE 'This should fix RLS policy evaluation';
  RAISE NOTICE 'Facilitators can now create simulations';
END $$;
