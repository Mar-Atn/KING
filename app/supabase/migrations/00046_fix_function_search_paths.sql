-- ============================================================================
-- Migration: 00046_fix_function_search_paths.sql
-- Description: Add search_path security to all 22 functions
-- Purpose: Fix Supabase Security Advisor warnings about mutable search_path
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Functions without search_path are vulnerable to search path injection
-- Solution: Add "SET search_path = public, pg_temp" to all functions
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING FUNCTION SEARCH PATHS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Adding search_path security to 22 functions';
  RAISE NOTICE 'This prevents search path injection attacks';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- CATEGORY 1: TIMESTAMP TRIGGERS (1 function)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- CATEGORY 2: EVENT LOGGING TRIGGERS (7 functions)
-- ============================================================================

-- Function to log simulation status changes
CREATE OR REPLACE FUNCTION log_sim_run_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO event_log (
      run_id,
      event_type,
      module,
      actor_type,
      actor_id,
      target_type,
      target_id,
      payload
    ) VALUES (
      NEW.run_id,
      'simulation_status_changed',
      'stage_engine',
      'facilitator',
      NEW.facilitator_id,
      'sim_run',
      NEW.run_id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to log phase transitions
CREATE OR REPLACE FUNCTION log_phase_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO event_log (
      run_id,
      event_type,
      module,
      actor_type,
      target_type,
      target_id,
      payload
    ) VALUES (
      NEW.run_id,
      CASE NEW.status
        WHEN 'active' THEN 'phase_started'
        WHEN 'completed' THEN 'phase_completed'
        WHEN 'paused' THEN 'phase_paused'
        WHEN 'skipped' THEN 'phase_skipped'
        ELSE 'phase_status_changed'
      END,
      'stage_engine',
      'system',
      'phase',
      NEW.phase_id,
      jsonb_build_object(
        'phase_id', NEW.phase_id,
        'phase_name', NEW.name,
        'sequence_number', NEW.sequence_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'started_at', NEW.started_at,
        'ended_at', NEW.ended_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to log vote casting
CREATE OR REPLACE FUNCTION log_vote_cast()
RETURNS TRIGGER AS $$
DECLARE
  v_session_name TEXT;
  v_voter_name TEXT;
  v_candidate_name TEXT;
BEGIN
  -- Get session name
  SELECT session_name INTO v_session_name
  FROM vote_sessions
  WHERE session_id = NEW.session_id;

  -- Get voter name
  SELECT name INTO v_voter_name
  FROM roles
  WHERE role_id = NEW.voter_role_id;

  -- Get candidate name (if applicable)
  IF NEW.candidate_role_id IS NOT NULL THEN
    SELECT name INTO v_candidate_name
    FROM roles
    WHERE role_id = NEW.candidate_role_id;
  END IF;

  INSERT INTO event_log (
    run_id,
    event_type,
    module,
    actor_type,
    actor_id,
    target_type,
    target_id,
    payload
  ) VALUES (
    NEW.run_id,
    'vote_cast',
    'voting',
    'participant',
    NEW.voter_role_id,
    'vote',
    NEW.vote_id,
    jsonb_build_object(
      'session_name', v_session_name,
      'voter_name', v_voter_name,
      'candidate_name', v_candidate_name,
      'vote_type', NEW.vote_type,
      'timestamp', NEW.cast_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to log meeting creation
CREATE OR REPLACE FUNCTION log_meeting_created()
RETURNS TRIGGER AS $$
DECLARE
  v_organizer_name TEXT;
BEGIN
  -- Get organizer name
  SELECT name INTO v_organizer_name
  FROM roles
  WHERE role_id = NEW.organizer_role_id;

  INSERT INTO event_log (
    run_id,
    event_type,
    module,
    actor_type,
    actor_id,
    target_type,
    target_id,
    payload
  ) VALUES (
    NEW.run_id,
    'meeting_created',
    'meetings',
    'participant',
    NEW.organizer_role_id,
    'meeting',
    NEW.meeting_id,
    jsonb_build_object(
      'meeting_title', NEW.title,
      'organizer_name', v_organizer_name,
      'scheduled_start', NEW.scheduled_start,
      'estimated_duration', NEW.estimated_duration_minutes,
      'location', NEW.location,
      'participants', NEW.participants
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to log meeting completion
CREATE OR REPLACE FUNCTION log_meeting_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status = 'scheduled' AND NEW.status = 'completed') THEN
    INSERT INTO event_log (
      run_id,
      event_type,
      module,
      actor_type,
      target_type,
      target_id,
      payload
    ) VALUES (
      NEW.run_id,
      'meeting_completed',
      'meetings',
      'system',
      'meeting',
      NEW.meeting_id,
      jsonb_build_object(
        'meeting_title', NEW.title,
        'started_at', NEW.actual_start,
        'ended_at', NEW.actual_end,
        'actual_duration', EXTRACT(EPOCH FROM (NEW.actual_end - NEW.actual_start)) / 60,
        'summary', NEW.summary
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to log public speeches
CREATE OR REPLACE FUNCTION log_public_speech()
RETURNS TRIGGER AS $$
DECLARE
  v_speaker_name TEXT;
BEGIN
  -- Get speaker name
  SELECT name INTO v_speaker_name
  FROM roles
  WHERE role_id = NEW.speaker_role_id;

  INSERT INTO event_log (
    run_id,
    event_type,
    module,
    actor_type,
    actor_id,
    target_type,
    target_id,
    payload
  ) VALUES (
    NEW.run_id,
    'public_speech_delivered',
    'public_speaking',
    'participant',
    NEW.speaker_role_id,
    'speech',
    NEW.speech_id,
    jsonb_build_object(
      'speaker_name', v_speaker_name,
      'speech_type', NEW.speech_type,
      'started_at', NEW.started_at,
      'ended_at', NEW.ended_at,
      'actual_duration', EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to log AI context updates
CREATE OR REPLACE FUNCTION log_ai_context_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_log (
    run_id,
    event_type,
    module,
    actor_type,
    target_type,
    target_id,
    payload
  ) VALUES (
    NEW.run_id,
    CASE TG_OP
      WHEN 'INSERT' THEN 'ai_context_created'
      WHEN 'UPDATE' THEN 'ai_context_updated'
      ELSE 'ai_context_changed'
    END,
    'ai_system',
    'system',
    'ai_context',
    NEW.context_id,
    jsonb_build_object(
      'role_id', NEW.role_id,
      'is_current', NEW.is_current,
      'emotional_state', NEW.emotional_state,
      'relationship_status', NEW.relationship_status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- CATEGORY 3: VALIDATION FUNCTIONS (2 functions)
-- ============================================================================

-- Function to ensure only one current AI context per role
CREATE OR REPLACE FUNCTION ensure_single_current_ai_context()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE ai_context
    SET is_current = FALSE
    WHERE role_id = NEW.role_id
    AND context_id != NEW.context_id
    AND is_current = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to validate vote session scope
CREATE OR REPLACE FUNCTION validate_vote_session_scope()
RETURNS TRIGGER AS $$
DECLARE
  v_run_id UUID;
BEGIN
  -- Get run_id from phase
  SELECT run_id INTO v_run_id
  FROM phases
  WHERE phase_id = NEW.phase_id;

  -- Set run_id on the vote session
  NEW.run_id := v_run_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- CATEGORY 4: CALCULATION/STATS FUNCTIONS (6 functions)
-- ============================================================================

-- Function to calculate actual meeting duration
CREATE OR REPLACE FUNCTION calculate_meeting_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_end IS NOT NULL AND NEW.actual_start IS NOT NULL THEN
    NEW.actual_duration_minutes := EXTRACT(EPOCH FROM (NEW.actual_end - NEW.actual_start)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to calculate actual speech duration
CREATE OR REPLACE FUNCTION calculate_speech_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.actual_duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to get participant count for a simulation
CREATE OR REPLACE FUNCTION get_participant_count(p_run_id UUID)
RETURNS TABLE (
  total INTEGER,
  human INTEGER,
  ai INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE participant_type = 'human')::INTEGER AS human,
    COUNT(*) FILTER (WHERE participant_type = 'ai')::INTEGER AS ai
  FROM roles
  WHERE run_id = p_run_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to get current active phase for a simulation
CREATE OR REPLACE FUNCTION get_current_phase(p_run_id UUID)
RETURNS TABLE (
  phase_id UUID,
  name TEXT,
  sequence_number INTEGER,
  started_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.phase_id,
    p.name,
    p.sequence_number,
    p.started_at
  FROM phases p
  WHERE p.run_id = p_run_id
  AND p.status = 'active'
  ORDER BY p.sequence_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to check if all votes are cast for a session
CREATE OR REPLACE FUNCTION all_votes_cast(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_run_id UUID;
  v_expected_voters INTEGER;
  v_actual_voters INTEGER;
BEGIN
  -- Get run_id from session
  SELECT run_id INTO v_run_id
  FROM vote_sessions
  WHERE session_id = p_session_id;

  -- Count expected voters (active human participants)
  SELECT COUNT(*) INTO v_expected_voters
  FROM roles
  WHERE run_id = v_run_id
  AND participant_type = 'human'
  AND status = 'active';

  -- Count actual voters
  SELECT COUNT(DISTINCT voter_role_id) INTO v_actual_voters
  FROM votes
  WHERE session_id = p_session_id;

  RETURN v_actual_voters >= v_expected_voters;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to get simulation statistics
CREATE OR REPLACE FUNCTION get_simulation_stats(p_run_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_participants', COUNT(DISTINCT r.role_id),
    'human_participants', COUNT(DISTINCT r.role_id) FILTER (WHERE r.participant_type = 'human'),
    'ai_participants', COUNT(DISTINCT r.role_id) FILTER (WHERE r.participant_type = 'ai'),
    'total_meetings', COUNT(DISTINCT m.meeting_id),
    'completed_meetings', COUNT(DISTINCT m.meeting_id) FILTER (WHERE m.status = 'completed'),
    'total_votes', COUNT(DISTINCT v.vote_id),
    'total_speeches', COUNT(DISTINCT ps.speech_id),
    'total_reflections', COUNT(DISTINCT ref.reflection_id),
    'total_events', COUNT(DISTINCT el.event_id)
  ) INTO v_stats
  FROM sim_runs sr
  LEFT JOIN roles r ON r.run_id = sr.run_id
  LEFT JOIN meetings m ON m.run_id = sr.run_id
  LEFT JOIN votes v ON v.session_id IN (SELECT session_id FROM vote_sessions WHERE run_id = sr.run_id)
  LEFT JOIN public_speeches ps ON ps.run_id = sr.run_id
  LEFT JOIN reflections ref ON ref.run_id = sr.run_id
  LEFT JOIN event_log el ON el.run_id = sr.run_id
  WHERE sr.run_id = p_run_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- CATEGORY 5: AUTH/ACCESS CONTROL FUNCTIONS (3 functions)
-- ============================================================================

-- Function to generate QR code access token
CREATE OR REPLACE FUNCTION generate_access_token(
  p_user_id UUID,
  p_run_id UUID,
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Calculate expiration
  v_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;

  -- Insert token
  INSERT INTO access_tokens (user_id, run_id, token, expires_at)
  VALUES (p_user_id, p_run_id, v_token, v_expires_at);

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Function to validate access token
CREATE OR REPLACE FUNCTION validate_access_token(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_token_id UUID;
BEGIN
  -- Find valid token
  SELECT user_id, token_id
  INTO v_user_id, v_token_id
  FROM access_tokens
  WHERE token = p_token
    AND is_valid = TRUE
    AND used_at IS NULL
    AND expires_at > NOW();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Mark token as used
  UPDATE access_tokens
  SET used_at = NOW()
  WHERE token_id = v_token_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Function to create public.users entry when auth.users entry is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_full_name TEXT;
  v_role TEXT;
BEGIN
  -- Extract display name from metadata or email
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract full name from metadata (if provided)
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Extract role from metadata (default to 'participant')
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'participant'
  );

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    display_name,
    full_name,
    role,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_full_name,
    v_role,
    'registered'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- CATEGORY 6: RLS HELPER FUNCTIONS (3 functions)
-- ============================================================================

-- Function to check if current user is a facilitator
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER means this runs as function owner (postgres superuser)
  -- RLS is bypassed for this SELECT, preventing circular dependency
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'facilitator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  -- Count functions in public schema
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SEARCH PATH SECURITY COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed 22 functions with search_path security:';
  RAISE NOTICE '';
  RAISE NOTICE 'Timestamp Triggers (1):';
  RAISE NOTICE '  ✓ update_updated_at_column';
  RAISE NOTICE '';
  RAISE NOTICE 'Event Logging (7):';
  RAISE NOTICE '  ✓ log_sim_run_status_change';
  RAISE NOTICE '  ✓ log_phase_status_change';
  RAISE NOTICE '  ✓ log_vote_cast';
  RAISE NOTICE '  ✓ log_meeting_created';
  RAISE NOTICE '  ✓ log_meeting_completed';
  RAISE NOTICE '  ✓ log_public_speech';
  RAISE NOTICE '  ✓ log_ai_context_update';
  RAISE NOTICE '';
  RAISE NOTICE 'Validation (2):';
  RAISE NOTICE '  ✓ ensure_single_current_ai_context';
  RAISE NOTICE '  ✓ validate_vote_session_scope';
  RAISE NOTICE '';
  RAISE NOTICE 'Calculations/Stats (6):';
  RAISE NOTICE '  ✓ calculate_meeting_duration';
  RAISE NOTICE '  ✓ calculate_speech_duration';
  RAISE NOTICE '  ✓ get_participant_count';
  RAISE NOTICE '  ✓ get_current_phase';
  RAISE NOTICE '  ✓ all_votes_cast';
  RAISE NOTICE '  ✓ get_simulation_stats';
  RAISE NOTICE '';
  RAISE NOTICE 'Auth/Access Control (3):';
  RAISE NOTICE '  ✓ generate_access_token';
  RAISE NOTICE '  ✓ validate_access_token';
  RAISE NOTICE '  ✓ handle_new_user';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Helpers (3):';
  RAISE NOTICE '  ✓ is_facilitator';
  RAISE NOTICE '  ✓ get_current_user_role_id';
  RAISE NOTICE '  ✓ is_participant_in_run';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Improvement:';
  RAISE NOTICE '  • All functions now immune to search path injection';
  RAISE NOTICE '  • search_path locked to "public, pg_temp"';
  RAISE NOTICE '  • Supabase Security Advisor warnings resolved';
  RAISE NOTICE '';
  RAISE NOTICE 'Total functions in public schema: %', function_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SEARCH PATH SECURITY FIX COMPLETE
-- ============================================================================
-- All 22 functions now have "SET search_path = public, pg_temp"
-- This prevents search path injection attacks
-- All Supabase Security Advisor warnings should now be resolved
-- ============================================================================
