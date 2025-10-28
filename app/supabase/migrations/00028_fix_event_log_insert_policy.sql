-- ============================================================================
-- Migration: 00028_fix_event_log_insert_policy.sql
-- Description: Fix event_log RLS policy to allow facilitators to insert events
-- Purpose: Fix "new row violates row-level security policy" error
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-27
-- Project: The New King SIM - Political Simulation Platform
--
-- ISSUE: Facilitators cannot insert events into event_log when starting phases
-- ERROR: "new row violates row-level security policy for table event_log"
-- CAUSE: Missing INSERT policy for facilitators
-- FIX: Add INSERT policy for facilitators
-- ============================================================================

-- ============================================================================
-- CHECK CURRENT POLICIES
-- ============================================================================

-- List all current event_log policies
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT EVENT_LOG POLICIES:';
  RAISE NOTICE '========================================';

  FOR policy_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'event_log'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | Action: % | Roles: %',
      policy_rec.policyname, policy_rec.cmd, policy_rec.roles;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIX: ADD MISSING INSERT POLICY FOR FACILITATORS
-- ============================================================================

-- Drop existing INSERT policies to recreate them properly
DROP POLICY IF EXISTS "Service creates events" ON event_log;
DROP POLICY IF EXISTS "Facilitators can create events" ON event_log;
DROP POLICY IF EXISTS "System can log events" ON event_log;

-- Policy 1: Facilitators can insert events (for phase transitions, actions, etc.)
CREATE POLICY "Facilitators can insert events"
  ON event_log FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Facilitator can create events if they're the facilitator of the simulation
    EXISTS (
      SELECT 1 FROM sim_runs
      WHERE sim_runs.run_id = event_log.run_id
      AND sim_runs.facilitator_id = (SELECT auth.uid())
    )
    OR
    -- Or if they're creating an event about themselves (as actor)
    actor_id = (SELECT auth.uid())
  );

-- Policy 2: Service role can always insert (for system events, triggers, etc.)
CREATE POLICY "Service role can insert events"
  ON event_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- VERIFY: Check updated policies
-- ============================================================================

DO $$
DECLARE
  insert_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'event_log'
  AND cmd = 'INSERT';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'EVENT_LOG INSERT POLICY FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXES APPLIED:';
  RAISE NOTICE '- Added INSERT policy for facilitators';
  RAISE NOTICE '- Facilitators can log events for their simulations';
  RAISE NOTICE '- Service role can always log events';
  RAISE NOTICE '';
  RAISE NOTICE 'INSERT POLICIES COUNT: % (should be 2)', insert_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'FACILITATORS CAN NOW:';
  RAISE NOTICE '- Start phases (logs phase_started event)';
  RAISE NOTICE '- End phases (logs phase_ended event)';
  RAISE NOTICE '- Pause/resume phases (logs phase_paused/resumed events)';
  RAISE NOTICE '- Perform any action that requires event logging';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT: Test phase start - should work now!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Event log INSERT policy fixed
-- Facilitators can now create events for their simulations
-- Phase start/end/pause/resume operations should work
-- ============================================================================
