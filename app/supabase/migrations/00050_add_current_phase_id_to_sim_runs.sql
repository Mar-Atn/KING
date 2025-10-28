-- ============================================================================
-- Migration: 00050_add_current_phase_id_to_sim_runs.sql
-- Date: October 28, 2025
-- Purpose: Add current_phase_id column to track active phase for real-time sync
-- ============================================================================
-- This enables participant dashboards to instantly detect phase changes via
-- Supabase Realtime subscriptions on sim_runs table updates.
-- ============================================================================

-- Add current_phase_id column to sim_runs table
ALTER TABLE sim_runs
ADD COLUMN current_phase_id UUID REFERENCES phases(phase_id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sim_runs_current_phase
ON sim_runs(current_phase_id);

-- Add comment for documentation
COMMENT ON COLUMN sim_runs.current_phase_id IS 'The currently active or most recently completed phase - updated in real-time for participant sync';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify column was added
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sim_runs'
    AND column_name = 'current_phase_id'
  ) THEN
    RAISE NOTICE '✓ Column current_phase_id added to sim_runs table';
  ELSE
    RAISE EXCEPTION '✗ Failed to add current_phase_id column';
  END IF;

  -- Verify index was created
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'sim_runs'
    AND indexname = 'idx_sim_runs_current_phase'
  ) THEN
    RAISE NOTICE '✓ Index idx_sim_runs_current_phase created';
  ELSE
    RAISE WARNING '✗ Index idx_sim_runs_current_phase not found';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Column added: sim_runs.current_phase_id';
  RAISE NOTICE 'Type: UUID (nullable)';
  RAISE NOTICE 'Foreign Key: phases(phase_id)';
  RAISE NOTICE 'Index: idx_sim_runs_current_phase';
  RAISE NOTICE '';
  RAISE NOTICE 'USAGE:';
  RAISE NOTICE '  - Set when facilitator starts a phase';
  RAISE NOTICE '  - Enables real-time phase sync via Supabase Realtime';
  RAISE NOTICE '  - Participant dashboards subscribe to sim_runs updates';
  RAISE NOTICE '  - Updates trigger instant UI refresh on all clients';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added current_phase_id column to sim_runs for real-time phase tracking
-- Enables instant synchronization between facilitator and participant screens
-- ============================================================================
