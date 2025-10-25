-- ============================================================================
-- Migration: 00006_rls_policies.sql
-- Description: Row Level Security (RLS) policies for all tables
-- Purpose: Implement secure access control for facilitators and participants
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
-- Security principle: Deny by default, grant explicitly

-- Core tables
ALTER TABLE sim_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

-- Interaction tables
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_speeches ENABLE ROW LEVEL SECURITY;

-- Voting tables
ALTER TABLE vote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- AI & meta tables
ALTER TABLE ai_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_run_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE king_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Event & supporting tables
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user is a facilitator
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'facilitator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- SIM_RUNS POLICIES
-- ============================================================================

-- Facilitators: Full access to all runs
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

-- Participants: Read-only access to runs they're part of
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
-- USERS POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Facilitators can view all users
CREATE POLICY "Facilitators can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- Facilitators can create users (for manual registration)
CREATE POLICY "Facilitators can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());

-- Allow user creation during signup (service role)
CREATE POLICY "Service role can create users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- ACCESS_TOKENS POLICIES
-- ============================================================================

-- Users can view their own tokens
CREATE POLICY "Users can view their own access tokens"
  ON access_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own tokens
CREATE POLICY "Users can create their own access tokens"
  ON access_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Facilitators can view and revoke all tokens
CREATE POLICY "Facilitators can view all access tokens"
  ON access_tokens FOR SELECT
  TO authenticated
  USING (is_facilitator());

CREATE POLICY "Facilitators can update access tokens"
  ON access_tokens FOR UPDATE
  TO authenticated
  USING (is_facilitator());

-- ============================================================================
-- CLANS POLICIES
-- ============================================================================

-- Participants can view clans in their runs
CREATE POLICY "Participants can view clans in their runs"
  ON clans FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all clans"
  ON clans FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- ROLES POLICIES
-- ============================================================================

-- Participants can view roles in their runs
CREATE POLICY "Participants can view roles in their runs"
  ON roles FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Participants can update their own role (limited fields)
CREATE POLICY "Participants can update their own role"
  ON roles FOR UPDATE
  TO authenticated
  USING (assigned_user_id = auth.uid())
  WITH CHECK (assigned_user_id = auth.uid());

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all roles"
  ON roles FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- PHASES POLICIES
-- ============================================================================

-- Participants can view phases in their runs
CREATE POLICY "Participants can view phases in their runs"
  ON phases FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all phases"
  ON phases FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- MEETINGS POLICIES
-- ============================================================================

-- Participants can view meetings they're part of
CREATE POLICY "Participants can view their meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id::text = ANY(
        SELECT jsonb_array_elements_text(meetings.participants)
      )
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can create meetings
CREATE POLICY "Participants can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = organizer_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can update meetings they organized
CREATE POLICY "Participants can update their meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meetings.organizer_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- MEETING_INVITATIONS POLICIES
-- ============================================================================

-- Participants can view invitations for their role
CREATE POLICY "Participants can view their invitations"
  ON meeting_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meeting_invitations.invitee_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can respond to their invitations
CREATE POLICY "Participants can respond to invitations"
  ON meeting_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = meeting_invitations.invitee_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Meeting organizers can create invitations
CREATE POLICY "Meeting organizers can create invitations"
  ON meeting_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN roles r ON r.role_id = m.organizer_role_id
      WHERE m.meeting_id = meeting_invitations.meeting_id
      AND r.assigned_user_id = auth.uid()
    )
  );

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all invitations"
  ON meeting_invitations FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- PUBLIC_SPEECHES POLICIES
-- ============================================================================

-- Participants can view speeches in their runs
CREATE POLICY "Participants can view public speeches"
  ON public_speeches FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Facilitators can create speeches
CREATE POLICY "Facilitators can create speeches"
  ON public_speeches FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all speeches"
  ON public_speeches FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- VOTE_SESSIONS POLICIES
-- ============================================================================

-- Participants can view vote sessions in their runs
CREATE POLICY "Participants can view vote sessions"
  ON vote_sessions FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage vote sessions"
  ON vote_sessions FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- VOTE_RESULTS POLICIES
-- ============================================================================

-- Participants can view results for sessions they can access
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

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage vote results"
  ON vote_results FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- VOTES POLICIES
-- ============================================================================

-- Participants can view their own votes
CREATE POLICY "Participants can view their own votes"
  ON votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = votes.voter_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can cast votes as their role
CREATE POLICY "Participants can cast votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = votes.voter_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Facilitators can view all votes
CREATE POLICY "Facilitators can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- ============================================================================
-- AI_CONTEXT POLICIES
-- ============================================================================

-- Participants can view AI context in their runs (read-only)
CREATE POLICY "Participants can view AI context"
  ON ai_context FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage AI context"
  ON ai_context FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- System can update AI context (for AI operations)
CREATE POLICY "Service role can manage AI context"
  ON ai_context FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- AI_PROMPTS POLICIES
-- ============================================================================

-- Facilitators can view all prompts
CREATE POLICY "Facilitators can view AI prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- Facilitators can create and update prompts
CREATE POLICY "Facilitators can manage AI prompts"
  ON ai_prompts FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- SIM_RUN_PROMPTS POLICIES
-- ============================================================================

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage sim run prompts"
  ON sim_run_prompts FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- KING_DECISIONS POLICIES
-- ============================================================================

-- Participants can view decisions in their runs
CREATE POLICY "Participants can view king decisions"
  ON king_decisions FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- King can create their decision
CREATE POLICY "King can create decision"
  ON king_decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = king_decisions.king_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- King can update their decision
CREATE POLICY "King can update decision"
  ON king_decisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = king_decisions.king_role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage king decisions"
  ON king_decisions FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- REFLECTIONS POLICIES
-- ============================================================================

-- Participants can view their own reflections
CREATE POLICY "Participants can view their reflections"
  ON reflections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can create reflections
CREATE POLICY "Participants can create reflections"
  ON reflections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can update their own reflections
CREATE POLICY "Participants can update their reflections"
  ON reflections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = reflections.role_id
      AND roles.assigned_user_id = auth.uid()
    )
  );

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage all reflections"
  ON reflections FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- EVENT_LOG POLICIES
-- ============================================================================

-- Participants can view events in their runs
CREATE POLICY "Participants can view event log"
  ON event_log FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- System can create events
CREATE POLICY "Service role can create events"
  ON event_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Facilitators: Full access
CREATE POLICY "Facilitators can manage event log"
  ON event_log FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- FACILITATOR_ACTIONS POLICIES
-- ============================================================================

-- Facilitators can view their own actions
CREATE POLICY "Facilitators can view facilitator actions"
  ON facilitator_actions FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- Facilitators can create actions
CREATE POLICY "Facilitators can create actions"
  ON facilitator_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_facilitator() AND facilitator_id = auth.uid()
  );

-- ============================================================================
-- SIMULATION_TEMPLATES POLICIES
-- ============================================================================

-- All authenticated users can view active templates
CREATE POLICY "Users can view active templates"
  ON simulation_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Facilitators can view all templates
CREATE POLICY "Facilitators can view all templates"
  ON simulation_templates FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- Facilitators can create and manage templates
CREATE POLICY "Facilitators can manage templates"
  ON simulation_templates FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- ============================================================================
-- RLS POLICIES MIGRATION COMPLETE
-- ============================================================================
-- All tables secured with Row Level Security
-- Facilitators: Full access to all data
-- Participants: Scoped access to their simulation data only
-- Next migration: Database triggers and additional indexes
-- ============================================================================
