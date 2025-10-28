-- ============================================================================
-- Migration: 00032_fix_sim_runs_delete_policy_direct.sql
-- Description: Fix sim_runs DELETE policy without using is_facilitator()
-- Purpose: Bypass SECURITY DEFINER function issue in RLS context
-- ============================================================================
-- Date: 2025-10-27
-- Issue: is_facilitator() doesn't work properly in RLS DELETE context
-- Root Cause: Same issue as INSERT - SECURITY DEFINER + auth.uid() don't mix
-- Solution: Check facilitator role directly in policy (same fix as 00031)
-- ============================================================================

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Facilitators can delete sim runs" ON sim_runs;

-- Create new policy that checks role directly (no function call)
CREATE POLICY "Facilitators can delete sim runs"
  ON sim_runs FOR DELETE
  TO authenticated
  USING (
    -- Check if user has facilitator role directly
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
    -- Also ensure facilitator owns this simulation
    AND facilitator_id = (SELECT auth.uid())
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'sim_runs DELETE policy updated';
  RAISE NOTICE 'Now checks facilitator role directly without function';
  RAISE NOTICE 'Also verifies facilitator owns the simulation';
  RAISE NOTICE 'This bypasses SECURITY DEFINER issues';
  RAISE NOTICE 'CASCADE will automatically delete related records';
END $$;
