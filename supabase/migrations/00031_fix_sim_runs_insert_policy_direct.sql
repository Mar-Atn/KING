-- ============================================================================
-- Migration: 00031_fix_sim_runs_insert_policy_direct.sql
-- Description: Fix sim_runs INSERT policy without using is_facilitator()
-- Purpose: Bypass SECURITY DEFINER function issue in RLS context
-- ============================================================================
-- Date: 2025-10-27
-- Issue: is_facilitator() doesn't work properly in RLS INSERT context
-- Root Cause: SECURITY DEFINER + auth.uid() don't mix well in RLS policies
-- Solution: Check facilitator role directly in policy
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Facilitators can create sim runs" ON sim_runs;

-- Create new policy that checks role directly (no function call)
CREATE POLICY "Facilitators can create sim runs"
  ON sim_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user has facilitator role directly
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'sim_runs INSERT policy updated';
  RAISE NOTICE 'Now checks facilitator role directly without function';
  RAISE NOTICE 'This bypasses SECURITY DEFINER issues';
END $$;
