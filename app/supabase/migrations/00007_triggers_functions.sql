-- ============================================================================
-- Migration: 00007_triggers_functions.sql
-- Description: Database triggers and utility functions
-- Purpose: Automated event logging, timestamp management, validation
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER update_simulation_templates_updated_at
  BEFORE UPDATE ON simulation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EVENT LOG TRIGGERS
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_sim_run_status_change
  AFTER UPDATE ON sim_runs
  FOR EACH ROW
  EXECUTE FUNCTION log_sim_run_status_change();

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
        'phase_name', NEW.name,
        'sequence_number', NEW.sequence_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_phase_status_change
  AFTER UPDATE ON phases
  FOR EACH ROW
  EXECUTE FUNCTION log_phase_status_change();

-- Function to log vote casting
CREATE OR REPLACE FUNCTION log_vote_cast()
RETURNS TRIGGER AS $$
DECLARE
  v_run_id UUID;
BEGIN
  -- Get run_id from session
  SELECT vs.run_id INTO v_run_id
  FROM vote_sessions vs
  WHERE vs.session_id = NEW.session_id;

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
    v_run_id,
    'vote_cast',
    'voting',
    CASE
      WHEN EXISTS (
        SELECT 1 FROM roles
        WHERE role_id = NEW.voter_role_id
        AND participant_type = 'human'
      ) THEN 'human_participant'
      ELSE 'ai_participant'
    END,
    NEW.voter_role_id,
    'vote_session',
    NEW.session_id,
    jsonb_build_object(
      'vote_id', NEW.vote_id,
      'voter_role_id', NEW.voter_role_id,
      'voter_clan_id', NEW.voter_clan_id,
      'chosen_role_id', NEW.chosen_role_id,
      'yes_no_choice', NEW.yes_no_choice,
      'timestamp', NEW.cast_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_vote_cast
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION log_vote_cast();

-- Function to log meeting creation
CREATE OR REPLACE FUNCTION log_meeting_created()
RETURNS TRIGGER AS $$
BEGIN
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
    CASE
      WHEN NEW.organizer_role_id IS NULL THEN 'system'
      WHEN EXISTS (
        SELECT 1 FROM roles
        WHERE role_id = NEW.organizer_role_id
        AND participant_type = 'human'
      ) THEN 'human_participant'
      ELSE 'ai_participant'
    END,
    NEW.organizer_role_id,
    'meeting',
    NEW.meeting_id,
    jsonb_build_object(
      'meeting_type', NEW.meeting_type,
      'title', NEW.title,
      'participants', NEW.participants,
      'modality', NEW.modality,
      'timestamp', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_meeting_created
  AFTER INSERT ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION log_meeting_created();

-- Function to log meeting completion
CREATE OR REPLACE FUNCTION log_meeting_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
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
        'meeting_type', NEW.meeting_type,
        'title', NEW.title,
        'participants', NEW.participants,
        'duration_seconds', NEW.actual_duration_seconds,
        'has_transcript', (NEW.transcript IS NOT NULL),
        'timestamp', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_meeting_completed
  AFTER UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION log_meeting_completed();

-- Function to log public speeches
CREATE OR REPLACE FUNCTION log_public_speech()
RETURNS TRIGGER AS $$
BEGIN
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
    'speeches',
    CASE
      WHEN NEW.is_facilitator THEN 'facilitator'
      WHEN NEW.is_ai_speaker THEN 'ai_participant'
      ELSE 'human_participant'
    END,
    NEW.speaker_role_id,
    'speech',
    NEW.speech_id,
    jsonb_build_object(
      'speaker_role_id', NEW.speaker_role_id,
      'delivery_method', NEW.delivery_method,
      'duration_seconds', NEW.duration_seconds,
      'has_audio', (NEW.audio_url IS NOT NULL),
      'timestamp', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_public_speech
  AFTER INSERT ON public_speeches
  FOR EACH ROW
  EXECUTE FUNCTION log_public_speech();

-- Function to log AI context updates
CREATE OR REPLACE FUNCTION log_ai_context_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
      'ai_context_updated',
      'ai_system',
      'ai_participant',
      NEW.role_id,
      'ai_context',
      NEW.context_id,
      jsonb_build_object(
        'version', NEW.version,
        'updated_trigger', NEW.updated_trigger,
        'updated_reason', NEW.updated_reason,
        'timestamp', NEW.created_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_ai_context_update
  AFTER INSERT ON ai_context
  FOR EACH ROW
  EXECUTE FUNCTION log_ai_context_update();

-- ============================================================================
-- VALIDATION TRIGGERS
-- ============================================================================

-- Function to ensure only one current AI context per role
CREATE OR REPLACE FUNCTION ensure_single_current_ai_context()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    -- Set all other contexts for this role to not current
    UPDATE ai_context
    SET is_current = FALSE
    WHERE role_id = NEW.role_id
      AND context_id != NEW.context_id
      AND is_current = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_current_ai_context
  BEFORE INSERT OR UPDATE ON ai_context
  FOR EACH ROW
  WHEN (NEW.is_current = TRUE)
  EXECUTE FUNCTION ensure_single_current_ai_context();

-- Function to validate vote session scope
CREATE OR REPLACE FUNCTION validate_vote_session_scope()
RETURNS TRIGGER AS $$
BEGIN
  -- If scope is clan_only, scope_clan_id must be set
  IF NEW.scope = 'clan_only' AND NEW.scope_clan_id IS NULL THEN
    RAISE EXCEPTION 'scope_clan_id is required when scope is clan_only';
  END IF;

  -- If scope is all, scope_clan_id must be NULL
  IF NEW.scope = 'all' AND NEW.scope_clan_id IS NOT NULL THEN
    RAISE EXCEPTION 'scope_clan_id must be NULL when scope is all';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_vote_session_scope
  BEFORE INSERT OR UPDATE ON vote_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_vote_session_scope();

-- Function to calculate meeting duration on completion
CREATE OR REPLACE FUNCTION calculate_meeting_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.started_at IS NOT NULL AND NEW.ended_at IS NOT NULL THEN
    NEW.actual_duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_meeting_duration
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION calculate_meeting_duration();

-- Function to calculate speech duration
CREATE OR REPLACE FUNCTION calculate_speech_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_speech_duration
  BEFORE INSERT OR UPDATE ON public_speeches
  FOR EACH ROW
  WHEN (NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL)
  EXECUTE FUNCTION calculate_speech_duration();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get participant count in a simulation
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
$$ LANGUAGE plpgsql;

-- Function to get current phase for a simulation
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
  ORDER BY p.sequence_number
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if all votes are cast for a session
CREATE OR REPLACE FUNCTION all_votes_cast(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_expected_voters INTEGER;
  v_actual_votes INTEGER;
  v_scope TEXT;
  v_scope_clan_id UUID;
BEGIN
  -- Get session scope
  SELECT scope, scope_clan_id
  INTO v_scope, v_scope_clan_id
  FROM vote_sessions
  WHERE session_id = p_session_id;

  -- Count expected voters
  IF v_scope = 'all' THEN
    SELECT COUNT(*)
    INTO v_expected_voters
    FROM roles r
    JOIN vote_sessions vs ON vs.run_id = r.run_id
    WHERE vs.session_id = p_session_id
      AND r.status = 'active';
  ELSE
    SELECT COUNT(*)
    INTO v_expected_voters
    FROM roles r
    WHERE r.clan_id = v_scope_clan_id
      AND r.status = 'active';
  END IF;

  -- Count actual votes
  SELECT COUNT(*)
  INTO v_actual_votes
  FROM votes
  WHERE session_id = p_session_id;

  RETURN v_actual_votes >= v_expected_voters;
END;
$$ LANGUAGE plpgsql;

-- Function to generate access token
CREATE OR REPLACE FUNCTION generate_access_token(
  p_user_id UUID,
  p_device_name TEXT DEFAULT NULL,
  p_expiry_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Insert token record
  INSERT INTO access_tokens (
    user_id,
    token,
    device_name,
    expires_at
  ) VALUES (
    p_user_id,
    v_token,
    p_device_name,
    NOW() + (p_expiry_hours || ' hours')::INTERVAL
  );

  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use access token
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STATISTICS FUNCTIONS
-- ============================================================================

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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS & FUNCTIONS MIGRATION COMPLETE
-- ============================================================================
-- Created:
-- - Timestamp update triggers
-- - Event logging triggers for all major actions
-- - Validation triggers for data integrity
-- - Utility functions for common operations
-- - Statistics functions for analytics
-- ============================================================================
