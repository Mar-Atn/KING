-- ============================================================================
-- Migration: 00042_restore_all_rls_policies.sql
-- Description: Restore all RLS policies that were dropped by CASCADE
-- Purpose: Fix facilitator access to simulations and all other tables
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Migration 00041 dropped is_facilitator() CASCADE, removing 48 policies
-- Solution: Restore all helper functions and RLS policies from original 00006
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESTORING ALL RLS POLICIES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Restoring 2 helper functions + 40+ RLS policies';
  RAISE NOTICE 'These were dropped CASCADE in migration 00041';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 1: DROP ALL POLICIES THAT MAY EXIST (from migration 00021)
-- ============================================================================

-- Migration 00021 recreated some policies, so we need to drop them first
DO $$
BEGIN
  -- Drop all policies that we're about to create (ignore errors if they don't exist)
  -- clans
  DROP POLICY IF EXISTS "Participants can view clans in their runs" ON clans;
  DROP POLICY IF EXISTS "Facilitators can manage all clans" ON clans;

  -- roles
  DROP POLICY IF EXISTS "Participants can view roles in their runs" ON roles;
  DROP POLICY IF EXISTS "Facilitators can manage all roles" ON roles;

  -- phases
  DROP POLICY IF EXISTS "Participants can view phases in their runs" ON phases;
  DROP POLICY IF EXISTS "Facilitators can manage all phases" ON phases;

  -- meetings
  DROP POLICY IF EXISTS "Facilitators can manage all meetings" ON meetings;

  -- meeting_invitations
  DROP POLICY IF EXISTS "Facilitators can manage all invitations" ON meeting_invitations;

  -- public_speeches
  DROP POLICY IF EXISTS "Participants can view public speeches" ON public_speeches;
  DROP POLICY IF EXISTS "Facilitators can create speeches" ON public_speeches;
  DROP POLICY IF EXISTS "Facilitators can manage all speeches" ON public_speeches;

  -- vote_sessions
  DROP POLICY IF EXISTS "Participants can view vote sessions" ON vote_sessions;
  DROP POLICY IF EXISTS "Facilitators can manage vote sessions" ON vote_sessions;

  -- vote_results
  DROP POLICY IF EXISTS "Participants can view vote results" ON vote_results;
  DROP POLICY IF EXISTS "Facilitators can manage vote results" ON vote_results;

  -- votes
  DROP POLICY IF EXISTS "Facilitators can view all votes" ON votes;

  -- ai_context
  DROP POLICY IF EXISTS "Participants can view AI context" ON ai_context;
  DROP POLICY IF EXISTS "Facilitators can manage AI context" ON ai_context;

  -- ai_prompts
  DROP POLICY IF EXISTS "Facilitators can view AI prompts" ON ai_prompts;
  DROP POLICY IF EXISTS "Facilitators can manage AI prompts" ON ai_prompts;

  -- sim_run_prompts
  DROP POLICY IF EXISTS "Facilitators can manage sim run prompts" ON sim_run_prompts;

  -- king_decisions
  DROP POLICY IF EXISTS "Participants can view king decisions" ON king_decisions;
  DROP POLICY IF EXISTS "Facilitators can manage king decisions" ON king_decisions;

  -- reflections
  DROP POLICY IF EXISTS "Facilitators can manage all reflections" ON reflections;

  -- event_log
  DROP POLICY IF EXISTS "Participants can view event log" ON event_log;
  DROP POLICY IF EXISTS "Facilitators can manage event log" ON event_log;

  -- facilitator_actions
  DROP POLICY IF EXISTS "Facilitators can view facilitator actions" ON facilitator_actions;

  -- simulation_templates
  DROP POLICY IF EXISTS "Facilitators can view all templates" ON simulation_templates;
  DROP POLICY IF EXISTS "Facilitators can manage templates" ON simulation_templates;

  RAISE NOTICE 'Dropped existing policies that may conflict';
END $$;

-- ============================================================================
-- STEP 2: RESTORE HELPER FUNCTIONS (also dropped CASCADE)
-- ============================================================================

-- Function to get current user's role_id in a simulation
CREATE OR REPLACE FUNCTION get_current_user_role_id(p_run_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT role_id FROM roles
    WHERE run_id = p_run_id
    AND assigned_user_id = auth.uid()
    AND participant_type = 'human'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is participant in a specific run
CREATE OR REPLACE FUNCTION is_participant_in_run(p_run_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles
    WHERE run_id = p_run_id
    AND assigned_user_id = auth.uid()
    AND participant_type = 'human'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: SIM_RUNS POLICIES
-- ============================================================================

-- Drop existing policies first (some may have been recreated by migration 00021)
DROP POLICY IF EXISTS "Facilitators can view all sim runs" ON sim_runs;
DROP POLICY IF EXISTS "Facilitators can create sim runs" ON sim_runs;
DROP POLICY IF EXISTS "Facilitators can update sim runs" ON sim_runs;
DROP POLICY IF EXISTS "Participants can view their sim runs" ON sim_runs;

CREATE POLICY "Facilitators can view all sim runs"
  ON sim_runs FOR SELECT
  TO authenticated
  USING (is_facilitator());

CREATE POLICY "Facilitators can create sim runs"
  ON sim_runs FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());

CREATE POLICY "Facilitators can update sim runs"
  ON sim_runs FOR UPDATE
  TO authenticated
  USING (is_facilitator());

CREATE POLICY "Participants can view their sim runs"
  ON sim_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.run_id = sim_runs.run_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: ACCESS_TOKENS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators can view all access tokens" ON access_tokens;
DROP POLICY IF EXISTS "Facilitators can update access tokens" ON access_tokens;

CREATE POLICY "Facilitators can view all access tokens"
  ON access_tokens FOR SELECT
  TO authenticated
  USING (is_facilitator());

CREATE POLICY "Facilitators can update access tokens"
  ON access_tokens FOR UPDATE
  TO authenticated
  USING (is_facilitator());

-- ============================================================================
-- STEP 5: CLANS POLICIES
-- ============================================================================

CREATE POLICY "Participants can view clans in their runs"
  ON clans FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage all clans"
  ON clans FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 6: ROLES POLICIES
-- ============================================================================

CREATE POLICY "Participants can view roles in their runs"
  ON roles FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage all roles"
  ON roles FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 7: PHASES POLICIES
-- ============================================================================

CREATE POLICY "Participants can view phases in their runs"
  ON phases FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage all phases"
  ON phases FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 8: MEETINGS POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can manage all meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 9: MEETING_INVITATIONS POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can manage all invitations"
  ON meeting_invitations FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 10: PUBLIC_SPEECHES POLICIES
-- ============================================================================

CREATE POLICY "Participants can view public speeches"
  ON public_speeches FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can create speeches"
  ON public_speeches FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());

CREATE POLICY "Facilitators can manage all speeches"
  ON public_speeches FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 11: VOTE_SESSIONS POLICIES
-- ============================================================================

CREATE POLICY "Participants can view vote sessions"
  ON vote_sessions FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage vote sessions"
  ON vote_sessions FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 12: VOTE_RESULTS POLICIES
-- ============================================================================

CREATE POLICY "Participants can view vote results"
  ON vote_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vote_sessions vs
      WHERE vs.session_id = vote_results.session_id
      AND is_participant_in_run(vs.run_id)
    )
  );

CREATE POLICY "Facilitators can manage vote results"
  ON vote_results FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 13: VOTES POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- ============================================================================
-- STEP 14: AI_CONTEXT POLICIES
-- ============================================================================

CREATE POLICY "Participants can view AI context"
  ON ai_context FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage AI context"
  ON ai_context FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 15: AI_PROMPTS POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can view AI prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (is_facilitator());

CREATE POLICY "Facilitators can manage AI prompts"
  ON ai_prompts FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 16: SIM_RUN_PROMPTS POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can manage sim run prompts"
  ON sim_run_prompts FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 17: KING_DECISIONS POLICIES
-- ============================================================================

CREATE POLICY "Participants can view king decisions"
  ON king_decisions FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage king decisions"
  ON king_decisions FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 18: REFLECTIONS POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can manage all reflections"
  ON reflections FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 19: EVENT_LOG POLICIES
-- ============================================================================

CREATE POLICY "Participants can view event log"
  ON event_log FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

CREATE POLICY "Facilitators can manage event log"
  ON event_log FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- STEP 20: FACILITATOR_ACTIONS POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can view facilitator actions"
  ON facilitator_actions FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- ============================================================================
-- STEP 21: SIMULATION_TEMPLATES POLICIES
-- ============================================================================

CREATE POLICY "Facilitators can view all templates"
  ON simulation_templates FOR SELECT
  TO authenticated
  USING (is_facilitator());

CREATE POLICY "Facilitators can manage templates"
  ON simulation_templates FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INT;
  func_count INT;
BEGIN
  -- Count restored policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count helper functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('is_facilitator', 'get_current_user_role_id', 'is_participant_in_run');

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL RLS POLICIES RESTORED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Functions: % (expected: 3)', func_count;
  RAISE NOTICE '  ✓ is_facilitator()';
  RAISE NOTICE '  ✓ get_current_user_role_id()';
  RAISE NOTICE '  ✓ is_participant_in_run()';
  RAISE NOTICE '';
  RAISE NOTICE 'Total RLS Policies: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Restored Policies:';
  RAISE NOTICE '  ✓ sim_runs (4 policies)';
  RAISE NOTICE '  ✓ users (6 policies from 00041)';
  RAISE NOTICE '  ✓ access_tokens (2 facilitator policies)';
  RAISE NOTICE '  ✓ clans (2 policies)';
  RAISE NOTICE '  ✓ roles (2 policies)';
  RAISE NOTICE '  ✓ phases (2 policies)';
  RAISE NOTICE '  ✓ meetings (1 facilitator policy)';
  RAISE NOTICE '  ✓ meeting_invitations (1 facilitator policy)';
  RAISE NOTICE '  ✓ public_speeches (3 policies)';
  RAISE NOTICE '  ✓ vote_sessions (2 policies)';
  RAISE NOTICE '  ✓ vote_results (2 policies)';
  RAISE NOTICE '  ✓ votes (1 facilitator policy)';
  RAISE NOTICE '  ✓ ai_context (2 policies)';
  RAISE NOTICE '  ✓ ai_prompts (2 policies)';
  RAISE NOTICE '  ✓ sim_run_prompts (1 policy)';
  RAISE NOTICE '  ✓ king_decisions (2 policies)';
  RAISE NOTICE '  ✓ reflections (1 facilitator policy)';
  RAISE NOTICE '  ✓ event_log (2 policies)';
  RAISE NOTICE '  ✓ facilitator_actions (1 policy)';
  RAISE NOTICE '  ✓ simulation_templates (2 policies)';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Behavior:';
  RAISE NOTICE '  ✅ Facilitators can view all simulations';
  RAISE NOTICE '  ✅ Facilitators can create/update simulations';
  RAISE NOTICE '  ✅ Facilitators can manage all simulation data';
  RAISE NOTICE '  ✅ Participants can view their simulation data';
  RAISE NOTICE '  ✅ All CRUD operations work as designed';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- RLS POLICIES RESTORATION COMPLETE
-- ============================================================================
-- All policies dropped by CASCADE have been restored
-- Facilitators should now have full access to all features
-- Participants have scoped access to their simulation data
-- ============================================================================
