-- ============================================================================
-- Migration: 00014_update_final_post_play_phases.sql
-- Description: Update post-play phases with final sequence from KING_Process.csv
-- Purpose: Adjust post-play reflection flow: Individual → Group → Plenary
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
--
-- CHANGES:
--   Phase 13: "Individual Reflections" (15 min) - personal/AI reflection
--   Phase 14: "Group Reflections" (20 min) - facilitated group sessions
--   Phase 15: "Plenary Debriefing" (20 min) - final synthesis (unchanged)
-- ============================================================================

UPDATE simulation_templates
SET
  process_stages = jsonb_build_array(
    -- PRE-PLAY
    jsonb_build_object('sequence', 0, 'name', 'Role Distribution & Induction', 'description', 'Facilitator distributes roles with animation, participants read their character profiles and clan information', 'default_duration_minutes', 10, 'phase_category', 'pre_play'),

    -- ACTIVE ROLE-PLAY
    jsonb_build_object('sequence', 1, 'name', 'Clan Councils 1', 'description', 'Each clan meets privately to choose strategy and nominate candidates', 'default_duration_minutes', 10, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 2, 'name', 'Free Consultations 1', 'description', 'All clans may discuss negotiate form alliances', 'default_duration_minutes', 15, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 3, 'name', 'Clans nominate candidates (decision)', 'description', 'Each clan announces their nominated candidate', 'default_duration_minutes', 5, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 4, 'name', 'Candidate Speeches 1', 'description', 'Each candidate has 2 minutes to present their program', 'default_duration_minutes', 15, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 5, 'name', 'Vote 1', 'description', 'Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed', 'default_duration_minutes', 10, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 6, 'name', 'Clan Councils 2', 'description', 'Each clan meets privately to discuss strategy for second round', 'default_duration_minutes', 10, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 7, 'name', 'Free Consultations 2', 'description', 'Final discussions between clans', 'default_duration_minutes', 15, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 8, 'name', 'Candidate Speeches 2', 'description', 'Top 2 candidates get 3 minutes each for final speeches', 'default_duration_minutes', 10, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 9, 'name', 'Vote 2', 'description', 'Open voting between final 2 candidates', 'default_duration_minutes', 5, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 10, 'name', 'King''s Decisions and Final Speech (if elected)', 'description', 'New King announces key decisions and policies', 'default_duration_minutes', 10, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 11, 'name', 'Clan Councils 3', 'description', 'Each clan meets to discuss their response to King''s decisions', 'default_duration_minutes', 8, 'phase_category', 'active_play'),
    jsonb_build_object('sequence', 12, 'name', 'Clan''s Final Decisions', 'description', 'Final comments and clan reactions to King''s announcements', 'default_duration_minutes', 7, 'phase_category', 'active_play'),

    -- POST-PLAY (UPDATED SEQUENCE)
    jsonb_build_object('sequence', 13, 'name', 'Individual Reflections', 'description', 'Participants reflect individually or with AI (optional) on their personal experience, decisions, and learnings', 'default_duration_minutes', 15, 'phase_category', 'post_play'),
    jsonb_build_object('sequence', 14, 'name', 'Group Reflections', 'description', 'Participants share perspectives and explore different viewpoints in a facilitated group reflection sessions', 'default_duration_minutes', 20, 'phase_category', 'post_play'),
    jsonb_build_object('sequence', 15, 'name', 'Plenary Debriefing', 'description', 'Facilitator leads final synthesis discussion, connects simulation to learning objectives, and answers questions', 'default_duration_minutes', 20, 'phase_category', 'post_play')
  ),
  updated_at = now()
WHERE
  name = 'The New King of Kourion'
  AND version = 'v1.0';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  stages_count INTEGER;
  phase_13_name TEXT;
  phase_14_name TEXT;
  phase_15_name TEXT;
BEGIN
  -- Get phase count
  SELECT jsonb_array_length(process_stages) INTO stages_count
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  -- Get post-play phase names
  SELECT
    process_stages->13->>'name',
    process_stages->14->>'name',
    process_stages->15->>'name'
  INTO phase_13_name, phase_14_name, phase_15_name
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Post-Play Phases Updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total stages: %', stages_count;
  RAISE NOTICE 'Phase 13: %', phase_13_name;
  RAISE NOTICE 'Phase 14: %', phase_14_name;
  RAISE NOTICE 'Phase 15: %', phase_15_name;
  RAISE NOTICE '========================================';

  -- Validation
  IF stages_count != 16 THEN
    RAISE EXCEPTION 'Expected 16 stages, found %', stages_count;
  END IF;

  IF phase_13_name != 'Individual Reflections' THEN
    RAISE EXCEPTION 'Phase 13 should be "Individual Reflections", found "%"', phase_13_name;
  END IF;

  IF phase_14_name != 'Group Reflections' THEN
    RAISE EXCEPTION 'Phase 14 should be "Group Reflections", found "%"', phase_14_name;
  END IF;

  IF phase_15_name != 'Plenary Debriefing' THEN
    RAISE EXCEPTION 'Phase 15 should be "Plenary Debriefing", found "%"', phase_15_name;
  END IF;

  RAISE NOTICE '✅ All validation checks passed!';
  RAISE NOTICE '✅ Post-play sequence: Individual → Group → Plenary';
END $$;
