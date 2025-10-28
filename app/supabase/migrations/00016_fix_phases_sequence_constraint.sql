-- ============================================================================
-- Migration: 00016_fix_phases_sequence_constraint.sql
-- Description: Fix sequence_number constraint to allow Phase 0 (pre-play)
-- Purpose: Allow sequence_number >= 0 instead of > 0 for pre-play phase support
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
--
-- ISSUE: Current constraint CHECK (sequence_number > 0) prevents Phase 0
-- FIX: Change to CHECK (sequence_number >= 0) to support Phase 0 (pre-play)
-- ============================================================================

-- Drop the old constraint
ALTER TABLE phases
DROP CONSTRAINT phases_sequence_number_check;

-- Add the new constraint that allows 0
ALTER TABLE phases
ADD CONSTRAINT phases_sequence_number_check CHECK (sequence_number >= 0);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phases Constraint Updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'sequence_number now allows: >= 0';
  RAISE NOTICE 'Phase 0 (pre-play) is now supported';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Constraint fix applied successfully!';
END $$;
