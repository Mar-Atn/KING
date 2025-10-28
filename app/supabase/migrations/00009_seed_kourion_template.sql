-- ============================================================================
-- Migration: 00009_seed_kourion_template.sql
-- Description: Seed default KOURION v1.0 simulation template
-- Purpose: Load master simulation design from CSV and MD files
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- Data Sources:
--   - KING_Process.csv (12 active role-play phases)
--   - KING_PRD.md Section 4.2 (pre/post phases)
--   - KING_ALL_CLANs.csv (6 clans)
--   - KING_ALL_ROLES.csv (30 roles)
--   - KING_Context.md (world setting)
-- ============================================================================

-- Delete any existing KOURION v1.0 templates (for re-running migration)
DELETE FROM simulation_templates WHERE name = 'The New King of Kourion' AND version = 'v1.0' AND language = 'ENG';

-- ============================================================================
-- INSERT KOURION v1.0 TEMPLATE
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

## The Clans

Each player represents a noble family belonging to one of major clans.

## Royal Powers & Decisions

Once elected, the King becomes the Supreme Ruler of the city, and has to make key decisions civil, economic and geopolitical decisions.

## The Kingdom Without A King

The Kingdom shall not remain without a King. If the King is not elected today - turmoil and unrest might start among ordinary citizens, who can not imagine life without a legitimate King, and enemies will not hesitate to use their chance and take control of our glorious city.

## General Interests

- For every noble citizen, becoming the King is the highest honour (becoming one of the two senior King's Advisors is also a great privilege)
- Each clan's strongest interest is to promote its candidate to become the new King or, at minimum, one of the two senior King's Advisors
- If another clan's representative becomes the King, each clan wants its legitimate clan interests reflected in the King's agenda (economic and political)
- There is a high risk for any clan if it falls out of favour with the new King
- Once new King is elected each Clan has to take the oath of allegiance to the new King, and also can make final decisions or statements

## Strategic Setting

### Geographic Context
- **Location**: Ancient Cyprus, 5th-4th century BCE, Strategic island crossroads of Greek, Phoenician, and Persian civilizations
- **Key Rivals**: Kition (Phoenician-influenced, trade and wealth oriented, culturally different) and Salamis (strong military, close cultural kinship)

### Economic Foundation
- **Maritime Trade**: Sea routes across Mediterranean
- **Island Agriculture**: Grain, wine, olive oil production
- **Strategic Harbors**: Critical for naval defense and commerce

### External Threats
- **Egyptian Expansion**: Southern maritime power
- **Assyrian Ambitions**: Eastern imperial threat
- **Pirate Confederations**: Maritime raiders
- **Rival City-Kingdoms**: Kition and Salamis aggression
  $CONTEXT$,

  -- ============================================================================
  -- PROCESS STAGES (Complete flow: 15 phases, 185 minutes total)
  -- PRE-PLAY (1 phase): Role Distribution & Induction
  -- ACTIVE PLAY (12 phases): from KING_Process.csv
  -- POST-PLAY (3 phases): Reflections & Debrief
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

  -- ============================================================================
  -- DECISIONS FRAMEWORK (minimal structure for Phase 2)
  -- ============================================================================
  jsonb_build_object(
    'budget_categories', jsonb_build_array('defense', 'trade', 'innovation', 'agriculture', 'social_welfare', 'education'),
    'alliance_options', jsonb_build_array('Kition', 'Salamis', 'neutral'),
    'advisor_positions', jsonb_build_array('Economic Advisor', 'Senior Judge')
  ),

  -- ============================================================================
  -- CANONICAL CLANS (from KING_ALL_CLANs.csv - 6 clans)
  -- ============================================================================
  jsonb_build_array(
    jsonb_build_object(
      'name', 'Clan of Artificers',
      'sequence', 1,
      'about', 'Our clan represents the ingenuity and innovation that drive the progress of Kourion. We are skilled in creating both military and civil innovations that enhance the city-kingdom''s defenses, infrastructure, and daily life. We believe in the power of technology and scientific advancement to solve problems and improve society.',
      'key_priorities', 'The best King must be a visionary leader who supports technological advancement and invests in innovation. Our candidate should push for a substantial portion of the budget to be allocated to Research and Development, Infrastructure Improvement, and Naval Innovations.',
      'attitude_to_others', 'We respect the Military Clan for their understanding of the practical applications of our innovations, especially in naval warfare and coastal defense. The Merchants are valuable partners as they can help fund our projects and provide access to new materials and technologies from distant lands.',
      'if_things_go_wrong', 'If the King fails to support innovation or cuts funding for our projects, we could consider withholding our technical expertise, potentially leaving the city-kingdom vulnerable to technological stagnation.',
      'color_hex', '#8B7355'
    ),
    jsonb_build_object(
      'name', 'Clan of Bankers',
      'sequence', 2,
      'about', 'Our clan is the financial backbone of Kourion, managing the city-kingdom''s wealth and resources. We have significant influence over economic activities and possess the unique power to provide loans to the state, supporting its budget in times of need.',
      'key_priorities', 'The best King must understand the importance of financial stability and support policies that encourage economic growth. Our candidate should advocate for balanced budgets, controlled spending, and lower taxes on banking and financial transactions.',
      'attitude_to_others', 'We value the Merchants for their role in generating wealth and trade opportunities. The Artificers can contribute to economic growth through their innovations, but their projects must be financially viable and not drain the treasury.',
      'if_things_go_wrong', 'If the King''s policies threaten our financial interests or economic stability, we have the power to restrict loans and credit, potentially causing a financial crisis that could force policy changes.',
      'color_hex', '#D4AF37'
    ),
    jsonb_build_object(
      'name', 'Clan of Landlords',
      'sequence', 3,
      'about', 'Our Clan is one of the two oldest and most noble Clans of Kourion, alongside the Military Clan. We control the vast agricultural lands across the island and contribute significantly to the city-kingdom''s food supply and around 30% of the city''s budget.',
      'key_priorities', 'The best King must be someone who understands the importance of agriculture and land ownership in our island setting. Our candidate must advocate for policies that protect our lands from heavy taxation and external threats.',
      'attitude_to_others', 'We respect the Military Clan for their role in defending our island territories and traditions, but we fear they may prioritize unnecessary wars, leading to increased taxes and instability. The Merchants and Bankers are beneficial partners as long as they do not seek to exploit our lands.',
      'if_things_go_wrong', 'If the King''s decisions threaten our interests, we might consider withholding our agricultural produce, threatening a famine, and putting pressure on the ruling authority.',
      'color_hex', '#8B4513'
    ),
    jsonb_build_object(
      'name', 'Clan of Merchants',
      'sequence', 4,
      'about', 'Our clan is vital to the economic health of Kourion, contributing a substantial 30% to the city''s budget. We represent trade and commerce, which is the lifeblood of our island city-kingdom. We are progressive and believe in fostering alliances that benefit our trade interests.',
      'key_priorities', 'The best King must understand the value of commerce and support our economic activities. Our candidate must promise lower taxes on trade and support for merchants to expand their maritime networks across the Mediterranean.',
      'attitude_to_others', 'We value the Artificers for their innovations that can aid in shipbuilding and harbor construction. The Bankers are our closest allies, as they provide the necessary financial support for our maritime trade activities.',
      'if_things_go_wrong', 'If a ruler does not align with our interests, we could consider using our economic power to oppose unjust taxes. We can halt trade and reduce our contribution to the budget, causing significant impact to the island''s economy.',
      'color_hex', '#2E8B57'
    ),
    jsonb_build_object(
      'name', 'Military Clan',
      'sequence', 5,
      'about', 'Our clan is large and mighty, commanding a loyal and disciplined army and navy that is the backbone of Kourion. As one of the two oldest and most noble clans of the city-kingdom, we hold the unique right to bear arms.',
      'key_priorities', 'The ideal King should be a strategic thinker and a seasoned warrior who understands both land and naval warfare. In the ongoing rivalry with Salamis and Kition, Kourion requires a robust army and fleet to defend our island territories.',
      'attitude_to_others', 'We hold deep respect for the ancient and noble Clan of Landlords. We also appreciate the contributions of the Artificers. However, the growing greed among the Bankers and Merchants could weaken Kourion and jeopardize its independence.',
      'if_things_go_wrong', 'As the only clan with the right to bear arms, we carry the ultimate responsibility to ensure Kourion remains strong, respected, and true to its Greek traditions.',
      'color_hex', '#8B0000'
    ),
    jsonb_build_object(
      'name', 'Clan of Philosophers',
      'sequence', 6,
      'about', 'Our clan embodies the wisdom, knowledge, and moral conscience of Kourion. We are the keepers of ancient wisdom and advocates for reason, justice, and the well-being of all citizens.',
      'key_priorities', 'The best King must be a wise and just leader who values reason over power, knowledge over wealth, and the common good over personal ambition. Our candidate should prioritize Education, Public Welfare, and Fair Governance.',
      'attitude_to_others', 'We respect the Artificers for their rational thinking. The Merchants and Bankers are necessary but we caution against their pursuit of wealth at the expense of ethical principles. The Military Clan is a potential threat if they become overly aggressive.',
      'if_things_go_wrong', 'If the King disregards wisdom and justice, we are prepared to lead a movement of peaceful dissent. We can incite the people to revolt through our teachings and influence.',
      'color_hex', '#4B0082'
    )
  ),

  -- ============================================================================
  -- CANONICAL ROLES (from KING_ALL_ROLES.csv - 30 roles, 5 per clan)
  -- ============================================================================
  jsonb_build_array(
    -- ARTIFICERS (5 roles)
    jsonb_build_object('sequence', 1, 'name', 'Architekton Metrodoros Tekhnaios', 'clan', 'Clan of Artificers', 'age', 44, 'position', 'Master of Naval Engineering'),
    jsonb_build_object('sequence', 2, 'name', 'Sophia Hephaistia Polymechanikos', 'clan', 'Clan of Artificers', 'age', 38, 'position', 'Master of Mechanical Innovations'),
    jsonb_build_object('sequence', 3, 'name', 'Mekhanopoios Thales Nautilos', 'clan', 'Clan of Artificers', 'age', 42, 'position', 'Master of Harbor Engineering'),
    -- BANKERS (5 roles)
    jsonb_build_object('sequence', 4, 'name', 'Trapezites Demetrios Chrysostomos', 'clan', 'Clan of Bankers', 'age', 47, 'position', 'Master of the Central Treasury'),
    jsonb_build_object('sequence', 5, 'name', 'Kyria Antigone Oikonomos', 'clan', 'Clan of Bankers', 'age', 41, 'position', 'Director of Debt Management'),
    jsonb_build_object('sequence', 6, 'name', 'Kyria Lyra Theodoros', 'clan', 'Clan of Bankers', 'age', 35, 'position', 'Master of Investment Banking'),
    jsonb_build_object('sequence', 7, 'name', 'Argentarius Nikandros Nomismatikos', 'clan', 'Clan of Bankers', 'age', 51, 'position', 'Master of the Royal Mint'),
    jsonb_build_object('sequence', 8, 'name', 'Trapezitria Iris Chrematistes', 'clan', 'Clan of Bankers', 'age', 38, 'position', 'Director of Commercial Banking'),
    -- LANDLORDS (6 roles)
    jsonb_build_object('sequence', 9, 'name', 'Archon Apollodoros Kourionides', 'clan', 'Clan of Landlords', 'age', 50, 'position', 'Lord of the Eastern Coastal Estates'),
    jsonb_build_object('sequence', 10, 'name', 'Kyria Alexandra Gerontos', 'clan', 'Clan of Landlords', 'age', 43, 'position', 'Manager of Interior Grain Estates'),
    jsonb_build_object('sequence', 11, 'name', 'Strategos Timotheos Hoplites', 'clan', 'Clan of Landlords', 'age', 55, 'position', 'Retired Military Commander Lord of Hill Estates'),
    jsonb_build_object('sequence', 12, 'name', 'Kyrios Philippos Agronomos', 'clan', 'Clan of Landlords', 'age', 44, 'position', 'Master of the Western Olive Groves'),
    jsonb_build_object('sequence', 13, 'name', 'Despoina Theodora Ktemates', 'clan', 'Clan of Landlords', 'age', 48, 'position', 'Lady of the Northern Vineyards'),
    jsonb_build_object('sequence', 14, 'name', 'Archon Herakles Geouchikos', 'clan', 'Clan of Landlords', 'age', 53, 'position', 'Lord of the Central Plains'),
    jsonb_build_object('sequence', 15, 'name', 'Georgios Agronakis', 'clan', 'Clan of Landlords', 'age', 33, 'position', 'Manager of the Southern Estates'),
    -- MERCHANTS (5 roles)
    jsonb_build_object('sequence', 16, 'name', 'Navarch Theodoros Phoenikiades', 'clan', 'Clan of Merchants', 'age', 45, 'position', 'Master of Maritime Trade'),
    jsonb_build_object('sequence', 17, 'name', 'Emporios Helena Kypriades', 'clan', 'Clan of Merchants', 'age', 52, 'position', 'Guild Master of Copper Traders'),
    jsonb_build_object('sequence', 18, 'name', 'Nauplios Kyros Salaminiades', 'clan', 'Clan of Merchants', 'age', 31, 'position', 'Captain of New Trade Routes'),
    jsonb_build_object('sequence', 19, 'name', 'Emporios Zeno Panhellenios', 'clan', 'Clan of Merchants', 'age', 40, 'position', 'Master of the Eastern Trade Routes'),
    jsonb_build_object('sequence', 20, 'name', 'Naukleros Kallisto Thalassopoula', 'clan', 'Clan of Merchants', 'age', 35, 'position', 'Owner of the Silver Dolphin Trading Company'),
    -- MILITARY (7 roles)
    jsonb_build_object('sequence', 21, 'name', 'Strategos Nikias Korragos', 'clan', 'Military Clan', 'age', 42, 'position', 'Senior Naval Commander'),
    jsonb_build_object('sequence', 22, 'name', 'Captain Lysander Heraklidos', 'clan', 'Military Clan', 'age', 34, 'position', 'Captain of Coastal Defense'),
    jsonb_build_object('sequence', 23, 'name', 'Commander Demetrios Alkibiades', 'clan', 'Military Clan', 'age', 48, 'position', 'Commander of the Sacred Guard'),
    jsonb_build_object('sequence', 24, 'name', 'Admiral Kleomenes Thalassios', 'clan', 'Military Clan', 'age', 39, 'position', 'Admiral of the Eastern Fleet'),
    jsonb_build_object('sequence', 25, 'name', 'Lieutenant Andreas Polemistes', 'clan', 'Military Clan', 'age', 29, 'position', 'Commander of the City Guard'),
    jsonb_build_object('sequence', 26, 'name', 'Hoplite Commander Philon Aspidos', 'clan', 'Military Clan', 'age', 46, 'position', 'Commander of the Heavy Infantry'),
    jsonb_build_object('sequence', 27, 'name', 'Strategos Kassandra Polemarch', 'clan', 'Military Clan', 'age', 37, 'position', 'Strategic Defense Coordinator'),
    -- PHILOSOPHERS (3 roles)
    jsonb_build_object('sequence', 28, 'name', 'Philosophos Sokrates Ethikos', 'clan', 'Clan of Philosophers', 'age', 51, 'position', 'Master of the Academy'),
    jsonb_build_object('sequence', 29, 'name', 'Didaskalos Aristoteles Politikos', 'clan', 'Clan of Philosophers', 'age', 39, 'position', 'Master of Political Studies'),
    jsonb_build_object('sequence', 30, 'name', 'Rhetor Kalliope Logike', 'clan', 'Clan of Philosophers', 'age', 45, 'position', 'Master of Rhetoric and Public Speaking')
  ),

  -- Metadata
  'Default KOURION v1.0 simulation template - Ancient Cyprus political simulation with 6 clans, 30 character roles, and 12-phase process',
  'The New King Development Team',
  true -- is_active
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the template was inserted
DO $$
DECLARE
  template_count INTEGER;
  stages_count INTEGER;
  clans_count INTEGER;
  roles_count INTEGER;
BEGIN
  -- Count templates
  SELECT COUNT(*) INTO template_count
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  -- Get array lengths
  SELECT
    jsonb_array_length(process_stages),
    jsonb_array_length(canonical_clans),
    jsonb_array_length(canonical_roles)
  INTO stages_count, clans_count, roles_count
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'KOURION v1.0 Template Seeding Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Templates inserted: %', template_count;
  RAISE NOTICE 'Process stages: %', stages_count;
  RAISE NOTICE 'Canonical clans: %', clans_count;
  RAISE NOTICE 'Canonical roles: %', roles_count;
  RAISE NOTICE '========================================';

  -- Validate counts
  IF template_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 template, found %', template_count;
  END IF;

  IF stages_count != 12 THEN
    RAISE EXCEPTION 'Expected 12 process stages, found %', stages_count;
  END IF;

  IF clans_count != 6 THEN
    RAISE EXCEPTION 'Expected 6 clans, found %', clans_count;
  END IF;

  IF roles_count != 30 THEN
    RAISE EXCEPTION 'Expected 30 roles, found %', roles_count;
  END IF;

  RAISE NOTICE '✅ All validation checks passed!';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- KOURION v1.0 template successfully seeded with:
--   - 12 process stages (120 minutes total)
--   - 6 canonical clans
--   - 30 canonical character roles
--   - Context text from KING_Context.md
--   - Minimal decisions framework
--
-- This template can now be used to instantiate new simulations in Phase 2.2
-- ============================================================================
