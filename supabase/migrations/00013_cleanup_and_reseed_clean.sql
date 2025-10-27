-- ============================================================================
-- Migration: 00013_cleanup_and_reseed_clean.sql
-- Description: Clean up all test data and reseed with clean KOURION v1.0 template
-- Purpose: Remove all test simulations and templates, start fresh
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- STEP 1: DELETE ALL TEST DATA
-- ============================================================================

-- Delete all simulation runs (cascades to phases, clans, roles, votes, meetings, etc.)
DELETE FROM sim_runs;

-- Delete all simulation templates
DELETE FROM simulation_templates;

-- Delete all event logs
DELETE FROM event_log;

-- Delete all access tokens
DELETE FROM access_tokens;

-- Verify cleanup
DO $$
DECLARE
  sim_runs_count INTEGER;
  templates_count INTEGER;
  phases_count INTEGER;
  clans_count INTEGER;
  roles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sim_runs_count FROM sim_runs;
  SELECT COUNT(*) INTO templates_count FROM simulation_templates;
  SELECT COUNT(*) INTO phases_count FROM phases;
  SELECT COUNT(*) INTO clans_count FROM clans;
  SELECT COUNT(*) INTO roles_count FROM roles;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database Cleanup Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Remaining sim_runs: %', sim_runs_count;
  RAISE NOTICE 'Remaining templates: %', templates_count;
  RAISE NOTICE 'Remaining phases: %', phases_count;
  RAISE NOTICE 'Remaining clans: %', clans_count;
  RAISE NOTICE 'Remaining roles: %', roles_count;
  RAISE NOTICE '========================================';

  IF sim_runs_count != 0 OR templates_count != 0 THEN
    RAISE EXCEPTION 'Cleanup failed - data still exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: RESEED CLEAN KOURION v1.0 TEMPLATE (16 PHASES)
-- ============================================================================

INSERT INTO simulation_templates (
  name,
  version,
  language,
  context_text,
  process_stages,
  decisions_framework,
  canonical_clans,
  canonical_roles,
  description,
  author,
  is_active
) VALUES (
  'The New King of Kourion',
  'v1.0',
  'ENG',

  -- ============================================================================
  -- CONTEXT TEXT (from KING_Context.md)
  -- ============================================================================
  $CONTEXT$
# The New King of Kourion - Context and Rules

## Historical Setting

Ancient Cyprus, 5th-4th century BCE. The mighty city-kingdom of Kourion has lost its King without an heir. You are noble citizens who must elect a new ruler. Cyprus is strategically vital, and three city-kingdoms (Kourion, Kition, Salamis) are on the brink of conflict. External threats loom from Egyptian, Persian, and Assyrian powers.

## Your Challenge

Through negotiation, speeches, and voting, select a leader who can unite Kourion and navigate these dangerous waters. Each clan has its priorities, resources, and interests. Can you forge alliances, make compromises, and choose a King who serves both your clan and the greater good?

## Rules of the Game

1. **Clan Loyalty:** You belong to a clan with specific interests and priorities
2. **Voting Process:** All citizens vote openly for their preferred candidate
3. **Negotiation:** Private clan councils and public consultations shape decisions
4. **King's Power:** The elected King makes final decisions on critical issues
5. **Consequences:** Every choice affects your clan's prosperity and Kourion's fate

## Learning Objectives

- Experience democratic decision-making in an ancient context
- Practice negotiation and coalition-building
- Understand trade-offs between personal, clan, and city interests
- Reflect on leadership, power, and governance
$CONTEXT$,

  -- ============================================================================
  -- PROCESS STAGES (Complete 16-phase flow from KING_Process.csv + KING_PRD.md 4.2)
  -- PRE-PLAY (1 phase): Role Distribution & Induction
  -- ACTIVE PLAY (12 phases): from KING_Process.csv
  -- POST-PLAY (3 phases): Reflections & Debrief
  -- Total: 185 minutes (10 pre + 120 active + 55 post)
  -- ============================================================================
  jsonb_build_array(
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

    -- POST-PLAY
    jsonb_build_object('sequence', 13, 'name', 'Group Reflections', 'description', 'All participants discuss what happened, share perspectives, and explore different viewpoints in a facilitated group discussion', 'default_duration_minutes', 15, 'phase_category', 'post_play'),
    jsonb_build_object('sequence', 14, 'name', 'Personal Feedback & Reflections', 'description', 'Participants engage in one-on-one conversations with AI to reflect on their personal experience, decisions, and learnings', 'default_duration_minutes', 20, 'phase_category', 'post_play'),
    jsonb_build_object('sequence', 15, 'name', 'Plenary Debriefing', 'description', 'Facilitator leads final synthesis discussion, connects simulation to learning objectives, and answers questions', 'default_duration_minutes', 20, 'phase_category', 'post_play')
  ),

  -- Decisions framework (minimal - from KING_Decisions.md)
  jsonb_build_object(
    'taxes', jsonb_build_array('lower', 'same', 'higher'),
    'budget_priorities', jsonb_build_array('defense', 'culture', 'agriculture', 'trade'),
    'appointments', jsonb_build_array('economic_advisor', 'senior_judge'),
    'international_affairs', jsonb_build_object(
      'alliances', jsonb_build_array('Salamis', 'Kition', 'none'),
      'wars', jsonb_build_array('none', 'defensive', 'conquest')
    )
  ),

  -- Canonical clans (simplified - 4 main clans)
  jsonb_build_array(
    jsonb_build_object('sequence', 1, 'name', 'Kourionites', 'about', 'Ancient local aristocracy, landowners, traditionalists', 'key_priorities', jsonb_build_array('preserve traditions', 'protect land rights', 'maintain local power'), 'attitude_to_others', jsonb_build_object('Achaeans', 'suspicious of outsiders', 'Phoenicians', 'distrust their trade influence', 'Satraps', 'fear Persian control'), 'if_things_go_wrong', 'Retreat to estates, protect local interests, resist change', 'color_hex', '#8B4513'),
    jsonb_build_object('sequence', 2, 'name', 'Achaeans', 'about', 'Greek settlers, warriors, expanding influence', 'key_priorities', jsonb_build_array('military strength', 'Greek culture', 'expansion'), 'attitude_to_others', jsonb_build_object('Kourionites', 'see as weak old guard', 'Phoenicians', 'economic rivals', 'Satraps', 'existential threat'), 'if_things_go_wrong', 'Prepare for war, seek Greek allies, oppose Persian influence', 'color_hex', '#4169E1'),
    jsonb_build_object('sequence', 3, 'name', 'Phoenicians', 'about', 'Merchants and traders from eastern Mediterranean', 'key_priorities', jsonb_build_array('trade prosperity', 'port access', 'commercial freedom'), 'attitude_to_others', jsonb_build_object('Kourionites', 'potential customers', 'Achaeans', 'aggressive competitors', 'Satraps', 'useful connections'), 'if_things_go_wrong', 'Shift trade elsewhere, maintain Persian ties, protect merchant interests', 'color_hex', '#9370DB'),
    jsonb_build_object('sequence', 4, 'name', 'Satraps', 'about', 'Persian-aligned officials and supporters', 'key_priorities', jsonb_build_array('Persian alliance', 'stability through empire', 'administrative order'), 'attitude_to_others', jsonb_build_object('Kourionites', 'naive isolationists', 'Achaeans', 'dangerous warmongers', 'Phoenicians', 'pragmatic partners'), 'if_things_go_wrong', 'Request Persian intervention, warn of instability, seek protection', 'color_hex', '#DC143C')
  ),

  -- Canonical roles (minimal set - 12 roles, 3 per clan)
  jsonb_build_array(
    -- Kourionites
    jsonb_build_object('sequence', 1, 'name', 'Leonidas', 'clan', 'Kourionites', 'age', 58, 'position', 'Elder Landowner', 'background', 'Descended from original Kourion founders, vast estates', 'character_traits', 'Traditional, cautious, protective of heritage', 'interests', 'Preserve land rights, maintain social order, protect traditions'),
    jsonb_build_object('sequence', 2, 'name', 'Helena', 'clan', 'Kourionites', 'age', 42, 'position', 'Temple Priestess', 'background', 'Religious authority, respected by locals', 'character_traits', 'Wise, spiritual, mediator', 'interests', 'Religious traditions, community harmony, cultural preservation'),
    jsonb_build_object('sequence', 3, 'name', 'Alexandros', 'clan', 'Kourionites', 'age', 35, 'position', 'Estate Manager', 'background', 'Manages agricultural production, pragmatic leader', 'character_traits', 'Practical, business-minded, conservative', 'interests', 'Economic stability, agricultural prosperity, local control'),

    -- Achaeans
    jsonb_build_object('sequence', 4, 'name', 'Ajax', 'clan', 'Achaeans', 'age', 45, 'position', 'Military Commander', 'background', 'Led successful campaigns, hero status', 'character_traits', 'Bold, decisive, honor-driven', 'interests', 'Military strength, Greek unity, territorial expansion'),
    jsonb_build_object('sequence', 5, 'name', 'Sophia', 'clan', 'Achaeans', 'age', 38, 'position', 'Philosopher & Educator', 'background', 'Teaches Greek philosophy and rhetoric', 'character_traits', 'Intellectual, eloquent, idealistic', 'interests', 'Greek culture, education, enlightened governance'),
    jsonb_build_object('sequence', 6, 'name', 'Demetrios', 'clan', 'Achaeans', 'age', 40, 'position', 'Ship Captain', 'background', 'Naval officer, controls sea routes', 'character_traits', 'Strategic, ambitious, adventurous', 'interests', 'Naval power, Greek alliances, maritime trade'),

    -- Phoenicians
    jsonb_build_object('sequence', 7, 'name', 'Baal', 'clan', 'Phoenicians', 'age', 52, 'position', 'Master Merchant', 'background', 'Wealthy trader with connections across Mediterranean', 'character_traits', 'Shrewd, diplomatic, profit-minded', 'interests', 'Trade freedom, port access, commercial stability'),
    jsonb_build_object('sequence', 8, 'name', 'Astarte', 'clan', 'Phoenicians', 'age', 44, 'position', 'Guild Leader', 'background', 'Represents artisan guilds and craftspeople', 'character_traits', 'Practical, fair-minded, organized', 'interests', 'Guild rights, market access, economic growth'),
    jsonb_build_object('sequence', 9, 'name', 'Hiram', 'clan', 'Phoenicians', 'age', 36, 'position', 'Harbor Master', 'background', 'Controls port operations and shipping', 'character_traits', 'Efficient, connected, opportunistic', 'interests', 'Port prosperity, shipping routes, trade infrastructure'),

    -- Satraps
    jsonb_build_object('sequence', 10, 'name', 'Cyrus', 'clan', 'Satraps', 'age', 50, 'position', 'Persian Satrap', 'background', 'Official representative of Persian Empire', 'character_traits', 'Authoritative, calculating, diplomatic', 'interests', 'Persian alliance, imperial stability, administrative control'),
    jsonb_build_object('sequence', 11, 'name', 'Roxana', 'clan', 'Satraps', 'age', 39, 'position', 'Royal Advisor', 'background', 'Educated in Persian court, strategic thinker', 'character_traits', 'Intelligent, subtle, persuasive', 'interests', 'Strategic partnerships, Persian protection, civilized order'),
    jsonb_build_object('sequence', 12, 'name', 'Darius', 'clan', 'Satraps', 'age', 43, 'position', 'Tax Collector', 'background', 'Manages tribute and imperial administration', 'character_traits', 'Methodical, loyal to empire, pragmatic', 'interests', 'Stable taxation, Persian relations, administrative efficiency')
  ),

  'Complete 16-phase simulation: Pre-play induction, 12 active role-play phases, and 3 post-play reflection phases (185 min total)',
  'Claude Code + Human',
  true
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  template_count INTEGER;
  stages_count INTEGER;
  clans_count INTEGER;
  roles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  SELECT
    jsonb_array_length(process_stages),
    jsonb_array_length(canonical_clans),
    jsonb_array_length(canonical_roles)
  INTO stages_count, clans_count, roles_count
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Clean KOURION v1.0 Template Seeded';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Templates: %', template_count;
  RAISE NOTICE 'Process stages: %', stages_count;
  RAISE NOTICE 'Canonical clans: %', clans_count;
  RAISE NOTICE 'Canonical roles: %', roles_count;
  RAISE NOTICE '========================================';

  IF template_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 template, found %', template_count;
  END IF;

  IF stages_count != 16 THEN
    RAISE EXCEPTION 'Expected 16 process stages, found %', stages_count;
  END IF;

  IF clans_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 clans, found %', clans_count;
  END IF;

  IF roles_count != 12 THEN
    RAISE EXCEPTION 'Expected 12 roles, found %', roles_count;
  END IF;

  RAISE NOTICE '✅ All validation checks passed!';
  RAISE NOTICE '✅ Database is clean and ready for production use';
END $$;
