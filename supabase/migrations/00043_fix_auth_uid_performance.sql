-- ============================================================================
-- Migration: 00043_fix_auth_uid_performance.sql
-- Description: Wrap auth.uid() calls in SELECT to prevent per-row evaluation
-- Purpose: Fix Supabase Performance Advisor warning about auth RLS initialization
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Policies calling auth.uid() directly cause re-evaluation for each row
-- Solution: Wrap all auth.uid() calls in subquery: (SELECT auth.uid())
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING AUTH.UID() PERFORMANCE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Wrapping auth.uid() in SELECT subqueries';
  RAISE NOTICE 'This prevents per-row re-evaluation';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIX SIM_RUNS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can view their sim runs" ON sim_runs;

CREATE POLICY "Participants can view their sim runs"
  ON sim_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.run_id = sim_runs.run_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

-- ============================================================================
-- FIX ROLES POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Participants can update their own role" ON roles;

CREATE POLICY "Participants can update their own role"
  ON roles FOR UPDATE
  TO authenticated
  USING (assigned_user_id = (SELECT auth.uid()))  -- ✅ Wrapped in SELECT
  WITH CHECK (assigned_user_id = (SELECT auth.uid()));

-- ============================================================================
-- FIX MEETINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can view their meetings" ON meetings;
DROP POLICY IF EXISTS "Participants can create meetings" ON meetings;
DROP POLICY IF EXISTS "Participants can update their meetings" ON meetings;

CREATE POLICY "Participants can view their meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id::text = ANY(
        SELECT jsonb_array_elements_text(meetings.participants)
      )
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Participants can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = organizer_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Participants can update their meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meetings.organizer_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

-- ============================================================================
-- FIX MEETING_INVITATIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can view their invitations" ON meeting_invitations;
DROP POLICY IF EXISTS "Participants can respond to invitations" ON meeting_invitations;
DROP POLICY IF EXISTS "Meeting organizers can create invitations" ON meeting_invitations;

CREATE POLICY "Participants can view their invitations"
  ON meeting_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meeting_invitations.invitee_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Participants can respond to invitations"
  ON meeting_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meeting_invitations.invitee_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Meeting organizers can create invitations"
  ON meeting_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN roles r ON r.role_id = m.organizer_role_id
      WHERE m.meeting_id = meeting_invitations.meeting_id
      AND r.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

-- ============================================================================
-- FIX VOTES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can view their own votes" ON votes;
DROP POLICY IF EXISTS "Participants can cast votes" ON votes;

CREATE POLICY "Participants can view their own votes"
  ON votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = votes.voter_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Participants can cast votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = votes.voter_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

-- ============================================================================
-- FIX KING_DECISIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "King can create decision" ON king_decisions;
DROP POLICY IF EXISTS "King can update decision" ON king_decisions;

CREATE POLICY "King can create decision"
  ON king_decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = king_decisions.king_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "King can update decision"
  ON king_decisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = king_decisions.king_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

-- ============================================================================
-- FIX REFLECTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can view their reflections" ON reflections;
DROP POLICY IF EXISTS "Participants can create reflections" ON reflections;
DROP POLICY IF EXISTS "Participants can update their reflections" ON reflections;

CREATE POLICY "Participants can view their reflections"
  ON reflections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Participants can create reflections"
  ON reflections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

CREATE POLICY "Participants can update their reflections"
  ON reflections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
    )
  );

-- ============================================================================
-- FIX FACILITATOR_ACTIONS POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators can create actions" ON facilitator_actions;

CREATE POLICY "Facilitators can create actions"
  ON facilitator_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_facilitator() AND facilitator_id = (SELECT auth.uid())  -- ✅ Wrapped in SELECT
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AUTH.UID() PERFORMANCE FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed policies that now use (SELECT auth.uid()):';
  RAISE NOTICE '  ✓ sim_runs: Participants can view their sim runs';
  RAISE NOTICE '  ✓ roles: Participants can update their own role';
  RAISE NOTICE '  ✓ meetings: 3 participant policies';
  RAISE NOTICE '  ✓ meeting_invitations: 3 policies';
  RAISE NOTICE '  ✓ votes: 2 policies';
  RAISE NOTICE '  ✓ king_decisions: 2 policies';
  RAISE NOTICE '  ✓ reflections: 3 policies';
  RAISE NOTICE '  ✓ facilitator_actions: 1 policy';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Performance Improvement:';
  RAISE NOTICE '  • Faster query execution (no per-row auth.uid() evaluation)';
  RAISE NOTICE '  • Profile loading should be instant';
  RAISE NOTICE '  • Dashboard queries significantly faster';
  RAISE NOTICE '';
  RAISE NOTICE 'Supabase Performance Advisor warnings should be resolved';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- AUTH.UID() PERFORMANCE FIX COMPLETE
-- ============================================================================
-- All auth.uid() calls now wrapped in SELECT subqueries
-- Query planner can optimize and evaluate once per query instead of per row
-- This should resolve the 5-second profile loading timeout
-- ============================================================================
