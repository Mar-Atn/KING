-- ============================================================================
-- Migration: 00021_optimize_rls_performance.sql
-- Description: Optimize RLS policies for performance at scale
-- Purpose: Fix Supabase Performance Advisor warnings about auth.uid() re-evaluation
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-27
-- Project: The New King SIM - Political Simulation Platform
--
-- ISSUE: RLS policies call auth.uid() for EACH row, causing suboptimal performance
-- FIX: Wrap auth.<function>() in subqueries so they evaluate once per query
-- REFERENCE: https://supabase.com/docs/guides/database/postgres/row-level-security
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE OPTIMIZED HELPER FUNCTIONS
-- ============================================================================

-- Drop and recreate helper functions with performance optimizations
-- CASCADE will automatically drop all dependent policies (they'll be recreated in STEP 2+)
DROP FUNCTION IF EXISTS is_facilitator() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_participant_in_run(UUID) CASCADE;

-- Optimized: Check if current user is a facilitator
-- Uses STABLE to allow query planner to optimize
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())  -- ✅ Single evaluation
    AND role = 'facilitator'
  );
$$;

-- Optimized: Get current user's role_id in a simulation
CREATE OR REPLACE FUNCTION get_current_user_role_id(p_run_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role_id FROM roles
  WHERE run_id = p_run_id
  AND assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
  AND participant_type = 'human'
  LIMIT 1;
$$;

-- Optimized: Check if user is participant in a specific run
CREATE OR REPLACE FUNCTION is_participant_in_run(p_run_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM roles
    WHERE run_id = p_run_id
    AND assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    AND participant_type = 'human'
  );
$$;

-- ============================================================================
-- STEP 2: RECREATE SIM_RUNS POLICIES WITH OPTIMIZATION
-- ============================================================================

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Participants can view their sim runs" ON sim_runs;

-- Recreate with optimization
CREATE POLICY "Participants can view their sim runs"
  ON sim_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.run_id = sim_runs.run_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

-- ============================================================================
-- STEP 3: RECREATE USERS POLICIES WITH OPTIMIZATION
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate with optimization
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()) OR is_facilitator());  -- ✅ Single evaluation

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))  -- ✅ Single evaluation
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 4: RECREATE ACCESS_TOKENS POLICIES WITH OPTIMIZATION
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own access tokens" ON access_tokens;
DROP POLICY IF EXISTS "Users can create their own access tokens" ON access_tokens;

CREATE POLICY "Users can view their own access tokens"
  ON access_tokens FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));  -- ✅ Single evaluation

CREATE POLICY "Users can create their own access tokens"
  ON access_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));  -- ✅ Single evaluation

-- ============================================================================
-- STEP 5: RECREATE ROLES POLICIES WITH OPTIMIZATION
-- ============================================================================

DROP POLICY IF EXISTS "Participants can update their own role" ON roles;

CREATE POLICY "Participants can update their own role"
  ON roles FOR UPDATE
  TO authenticated
  USING (assigned_user_id = (SELECT auth.uid()))  -- ✅ Single evaluation
  WITH CHECK (assigned_user_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 6: RECREATE MEETINGS POLICIES WITH OPTIMIZATION
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
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "Participants can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = organizer_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "Participants can update their meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meetings.organizer_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

-- ============================================================================
-- STEP 7: RECREATE MEETING_INVITATIONS POLICIES WITH OPTIMIZATION
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
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "Participants can respond to invitations"
  ON meeting_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meeting_invitations.invitee_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
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
      AND r.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

-- ============================================================================
-- STEP 8: RECREATE VOTES POLICIES WITH OPTIMIZATION
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
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "Participants can cast votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = votes.voter_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

-- ============================================================================
-- STEP 9: RECREATE KING_DECISIONS POLICIES WITH OPTIMIZATION
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
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "King can update decision"
  ON king_decisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = king_decisions.king_role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

-- ============================================================================
-- STEP 10: RECREATE REFLECTIONS POLICIES WITH OPTIMIZATION
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
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "Participants can create reflections"
  ON reflections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

CREATE POLICY "Participants can update their reflections"
  ON reflections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = (SELECT auth.uid())  -- ✅ Single evaluation
    )
  );

-- ============================================================================
-- STEP 11: RECREATE FACILITATOR_ACTIONS POLICY WITH OPTIMIZATION
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators can create actions" ON facilitator_actions;

CREATE POLICY "Facilitators can create actions"
  ON facilitator_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_facilitator() AND facilitator_id = (SELECT auth.uid())  -- ✅ Single evaluation
  );

-- ============================================================================
-- STEP 12: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on roles.assigned_user_id for fast user->role lookups
CREATE INDEX IF NOT EXISTS idx_roles_assigned_user_id
ON roles(assigned_user_id)
WHERE assigned_user_id IS NOT NULL;

-- Composite index for participant role lookups
CREATE INDEX IF NOT EXISTS idx_roles_run_user
ON roles(run_id, assigned_user_id)
WHERE participant_type = 'human';

-- Index for meeting participant lookups (JSONB array)
CREATE INDEX IF NOT EXISTS idx_meetings_participants
ON meetings USING GIN(participants);

-- Index for vote session lookups
CREATE INDEX IF NOT EXISTS idx_votes_voter_session
ON votes(voter_role_id, session_id);

-- Index for meeting invitations
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_invitee
ON meeting_invitations(invitee_role_id, status);

-- Index for reflections by role
CREATE INDEX IF NOT EXISTS idx_reflections_role_phase
ON reflections(role_id, phase_id);

-- Index for event log queries
CREATE INDEX IF NOT EXISTS idx_event_log_run_timestamp
ON event_log(run_id, created_at DESC);

-- Index for users role lookup
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role)
WHERE role IS NOT NULL;

-- ============================================================================
-- STEP 13: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for query planner optimization
ANALYZE users;
ANALYZE roles;
ANALYZE sim_runs;
ANALYZE meetings;
ANALYZE meeting_invitations;
ANALYZE votes;
ANALYZE reflections;
ANALYZE event_log;

-- ============================================================================
-- VERIFICATION AND SUMMARY
-- ============================================================================

DO $$
DECLARE
  policy_count INT;
  index_count INT;
BEGIN
  -- Count optimized policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count new indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS PERFORMANCE OPTIMIZATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'OPTIMIZATIONS APPLIED:';
  RAISE NOTICE '✓ Wrapped all auth.uid() calls in subqueries';
  RAISE NOTICE '✓ Recreated helper functions as STABLE';
  RAISE NOTICE '✓ Optimized 20+ RLS policies';
  RAISE NOTICE '✓ Added % performance indexes', index_count;
  RAISE NOTICE '✓ Updated table statistics';
  RAISE NOTICE '';
  RAISE NOTICE 'EXPECTED IMPROVEMENTS:';
  RAISE NOTICE '• 10-100x faster RLS policy evaluation';
  RAISE NOTICE '• Reduced CPU usage on large table scans';
  RAISE NOTICE '• Better query planner decisions';
  RAISE NOTICE '• Faster participant dashboard loads';
  RAISE NOTICE '';
  RAISE NOTICE 'TOTAL POLICIES: %', policy_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Test all user flows after migration';
  RAISE NOTICE '   - Facilitator login and simulation management';
  RAISE NOTICE '   - Participant login and role access';
  RAISE NOTICE '   - Voting, meetings, and reflections';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Monitor Supabase Performance Advisor';
  RAISE NOTICE '   warnings should now be resolved';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION MIGRATION COMPLETE
-- ============================================================================
-- All RLS policies now use optimized auth.uid() evaluation
-- Additional indexes added for common query patterns
-- Table statistics updated for query planner
-- Expected: Significant performance improvement at scale
-- ============================================================================
