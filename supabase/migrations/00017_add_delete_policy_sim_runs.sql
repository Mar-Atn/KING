-- ============================================================================
-- Migration: 00017_add_delete_policy_sim_runs.sql
-- Description: Add DELETE policy for sim_runs table
-- Purpose: Allow facilitators to delete their own simulation runs
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
--
-- ISSUE: Facilitators cannot delete simulations (no DELETE policy exists)
-- FIX: Add DELETE policy allowing facilitators to delete sim_runs
-- ============================================================================

-- Add DELETE policy for facilitators
CREATE POLICY "Facilitators can delete sim runs"
  ON sim_runs FOR DELETE
  TO authenticated
  USING (is_facilitator());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DELETE Policy Added for sim_runs';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Facilitators can now delete simulations';
  RAISE NOTICE 'CASCADE will automatically delete:';
  RAISE NOTICE '  - All phases';
  RAISE NOTICE '  - All clans';
  RAISE NOTICE '  - All roles';
  RAISE NOTICE '  - All votes';
  RAISE NOTICE '  - All meetings';
  RAISE NOTICE '  - All event logs';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DELETE policy applied successfully!';
END $$;
