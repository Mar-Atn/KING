-- ============================================================================
-- Migration: 00015_complete_seed_6_clans_30_roles.sql
-- Description: Complete KOURION v1.0 template with all 6 clans and 30 roles
-- Purpose: Populate template with full seed data from KING_ALL_CLANs.csv and KING_ALL_ROLES.csv
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
--
-- SOURCE DATA:
--   - KING_ALL_CLANs.csv (6 clans)
--   - KING_ALL_ROLES.csv (30 roles, 5 per clan)
--   - KING_Process.csv (16 phases)
-- ============================================================================

-- ============================================================================
-- STEP 1: DELETE EXISTING TEMPLATE
-- ============================================================================

DELETE FROM simulation_templates
WHERE name = 'The New King of Kourion' AND version = 'v1.0';

-- ============================================================================
-- STEP 2: INSERT COMPLETE TEMPLATE WITH 6 CLANS AND 30 ROLES
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
  -- PROCESS STAGES (Complete 16-phase flow)
  -- PRE-PLAY (1 phase): Role Distribution & Induction
  -- ACTIVE PLAY (12 phases): Councils, Consultations, Speeches, Votes
  -- POST-PLAY (3 phases): Individual → Group → Plenary Reflections
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

    -- POST-PLAY (FINAL SEQUENCE)
    jsonb_build_object('sequence', 13, 'name', 'Individual Reflections', 'description', 'Participants reflect individually or with AI (optional) on their personal experience, decisions, and learnings', 'default_duration_minutes', 15, 'phase_category', 'post_play'),
    jsonb_build_object('sequence', 14, 'name', 'Group Reflections', 'description', 'Participants share perspectives and explore different viewpoints in a facilitated group reflection sessions', 'default_duration_minutes', 20, 'phase_category', 'post_play'),
    jsonb_build_object('sequence', 15, 'name', 'Plenary Debriefing', 'description', 'Facilitator leads final synthesis discussion, connects simulation to learning objectives, and answers questions', 'default_duration_minutes', 20, 'phase_category', 'post_play')
  ),

  -- ============================================================================
  -- DECISIONS FRAMEWORK (from KING_Decisions.md)
  -- ============================================================================
  jsonb_build_object(
    'taxes', jsonb_build_array('lower', 'same', 'higher'),
    'budget_priorities', jsonb_build_array('defense', 'culture', 'agriculture', 'trade'),
    'appointments', jsonb_build_array('economic_advisor', 'senior_judge'),
    'international_affairs', jsonb_build_object(
      'alliances', jsonb_build_array('Salamis', 'Kition', 'none'),
      'wars', jsonb_build_array('none', 'defensive', 'conquest')
    )
  ),

  -- ============================================================================
  -- CANONICAL CLANS (6 clans from KING_ALL_CLANs.csv)
  -- ============================================================================
  jsonb_build_array(
    -- 1. ARTIFICERS
    jsonb_build_object(
      'sequence', 1,
      'name', 'Artificers',
      'about', 'Engineers, inventors, and master craftspeople who advance Kourion through innovation',
      'key_priorities', jsonb_build_array(
        'Technological advancement and innovation',
        'Infrastructure development',
        'Recognition for technical expertise',
        'Investment in engineering projects'
      ),
      'attitude_to_others', jsonb_build_object(
        'Bankers', 'Respect their financial power but frustrated by conservative lending',
        'Landlords', 'See them as traditionalists resistant to beneficial innovations',
        'Merchants', 'Natural allies - innovations enable profitable trade',
        'Military', 'Appreciate their understanding of engineering''s strategic value',
        'Philosophers', 'Respect wisdom but prefer practical solutions over abstract theory'
      ),
      'if_things_go_wrong', 'Focus on critical infrastructure projects, build alliances with clans that value innovation, demonstrate how technology solves practical problems',
      'color_hex', '#FF6B35'
    ),

    -- 2. BANKERS
    jsonb_build_object(
      'sequence', 2,
      'name', 'Bankers',
      'about', 'Financial experts and wealth managers who control Kourion''s economy',
      'key_priorities', jsonb_build_array(
        'Financial stability and fiscal responsibility',
        'Debt management and creditworthiness',
        'Sound currency and banking practices',
        'Economic growth through smart investment'
      ),
      'attitude_to_others', jsonb_build_object(
        'Artificers', 'Valuable but risky - some projects succeed, others fail',
        'Landlords', 'Traditional allies - land is reliable collateral',
        'Merchants', 'Essential clients - trade generates wealth to manage',
        'Military', 'Expensive but necessary - must balance defense and finances',
        'Philosophers', 'Idealistic but impractical about economic realities'
      ),
      'if_things_go_wrong', 'Tighten lending, prioritize fiscal conservatism, protect currency stability, ensure whoever leads understands financial consequences',
      'color_hex', '#F7C744'
    ),

    -- 3. LANDLORDS
    jsonb_build_object(
      'sequence', 3,
      'name', 'Landlords',
      'about', 'Noble families and agricultural estate owners who control the land',
      'key_priorities', jsonb_build_array(
        'Preservation of land rights and social order',
        'Agricultural prosperity and sustainable practices',
        'Protection of traditional values and hierarchy',
        'Fair treatment balanced with maintaining authority'
      ),
      'attitude_to_others', jsonb_build_object(
        'Artificers', 'Useful when innovations serve agriculture, dangerous when they disrupt tradition',
        'Bankers', 'Necessary partners but sometimes too focused on profit over heritage',
        'Merchants', 'Commercial partners but lack connection to the land',
        'Military', 'Natural allies - both value tradition, hierarchy, and stability',
        'Philosophers', 'Respect wisdom but wary of radical ideas that threaten order'
      ),
      'if_things_go_wrong', 'Retreat to estates, protect local interests, resist destabilizing changes, maintain food supplies as leverage',
      'color_hex', '#8B4513'
    ),

    -- 4. MERCHANTS
    jsonb_build_object(
      'sequence', 4,
      'name', 'Merchants',
      'about', 'Traders and commercial leaders who connect Kourion to Mediterranean markets',
      'key_priorities', jsonb_build_array(
        'Trade freedom and commercial prosperity',
        'Port access and maritime infrastructure',
        'Favorable international relationships',
        'Market stability and predictable regulations'
      ),
      'attitude_to_others', jsonb_build_object(
        'Artificers', 'Valuable allies - innovations create new trade opportunities',
        'Bankers', 'Essential partners but sometimes too conservative with credit',
        'Landlords', 'Suppliers of trade goods but can be resistant to change',
        'Military', 'Necessary for protecting trade routes and maritime security',
        'Philosophers', 'Interesting but often impractical about commercial realities'
      ),
      'if_things_go_wrong', 'Shift trade to other ports, leverage international connections, protect merchant interests, ensure profitable conditions continue',
      'color_hex', '#9370DB'
    ),

    -- 5. MILITARY
    jsonb_build_object(
      'sequence', 5,
      'name', 'Military',
      'about', 'Warriors and commanders who defend Kourion and project its power',
      'key_priorities', jsonb_build_array(
        'Military strength and readiness',
        'Defense of Kourion''s independence',
        'Honor and warrior traditions',
        'Strategic security and territorial integrity'
      ),
      'attitude_to_others', jsonb_build_object(
        'Artificers', 'Valuable allies - engineering enhances military capability',
        'Bankers', 'Necessary but frustrating - always questioning military spending',
        'Landlords', 'Traditional allies - both value hierarchy and order',
        'Merchants', 'Useful for logistics and naval cooperation',
        'Philosophers', 'Impractical idealists who don''t understand hard realities of power'
      ),
      'if_things_go_wrong', 'Prepare for conflict, seek military allies, maintain readiness, ensure Kourion can defend itself against external threats',
      'color_hex', '#DC143C'
    ),

    -- 6. PHILOSOPHERS
    jsonb_build_object(
      'sequence', 6,
      'name', 'Philosophers',
      'about', 'Scholars and teachers who guide Kourion through wisdom and ethical reasoning',
      'key_priorities', jsonb_build_array(
        'Justice and ethical governance',
        'Education and learning',
        'Long-term thinking and wisdom',
        'Common good over narrow interests'
      ),
      'attitude_to_others', jsonb_build_object(
        'Artificers', 'Admire practical problem-solving but worry about unintended consequences',
        'Bankers', 'Respect financial expertise but concerned about greed over ethics',
        'Landlords', 'Understand tradition''s value but oppose rigid hierarchy',
        'Merchants', 'Appreciate their cosmopolitan perspective but wary of pure profit motive',
        'Military', 'Respect courage but question whether force should dominate decisions'
      ),
      'if_things_go_wrong', 'Advocate for ethical principles, mediate between factions, educate citizens about long-term consequences, promote wisdom over expediency',
      'color_hex', '#4169E1'
    )
  ),

  -- ============================================================================
  -- CANONICAL ROLES (30 roles from KING_ALL_ROLES.csv, 5 per clan)
  -- ============================================================================
  jsonb_build_array(
    -- ARTIFICERS (3 roles)
    jsonb_build_object(
      'sequence', 1,
      'name', 'Architekton Metrodoros Tekhnaios',
      'clan', 'Artificers',
      'age', 44,
      'position', 'Master of Naval Engineering',
      'background', 'Metrodoros has designed and built the most advanced harbor fortifications and naval vessels in the eastern Mediterranean, earning recognition from military leaders and merchants alike for his innovative engineering solutions.',
      'character_traits', 'Brilliant and innovative, skilled at combining different techniques, respected across clan lines, focused on practical solutions, passionate about technological advancement',
      'interests', 'I believe my proven ability to create innovations that strengthen our city-kingdom makes me the ideal candidate to serve as King during these times of technological opportunity.'
    ),
    jsonb_build_object(
      'sequence', 2,
      'name', 'Sophia Hephaistia Polymechanikos',
      'clan', 'Artificers',
      'age', 38,
      'position', 'Master of Mechanical Innovations',
      'background', 'Sophia has developed practical innovations that have improved daily life throughout our city-kingdom, from improved water systems to more efficient copper mining techniques.',
      'character_traits', 'Practical and problem-solving oriented, concerned with improving daily life, skilled at making complex ideas accessible, collaborative and inclusive, focused on sustainable solutions',
      'interests', 'I am willing to serve as King if our clan believes my practical approach to innovation and my understanding of how technology affects ordinary citizens would benefit our city-kingdom.'
    ),
    jsonb_build_object(
      'sequence', 3,
      'name', 'Mekhanopoios Thales Nautilos',
      'clan', 'Artificers',
      'age', 42,
      'position', 'Master of Harbor Engineering',
      'background', 'Thales specializes in designing and building the complex harbor infrastructure that makes Kourion''s maritime commerce possible - breakwaters, docks, loading cranes, and ship repair facilities.',
      'character_traits', 'Practical problem-solver, synthesizes diverse knowledge, results-focused, respected by multiple clans, diplomatic engineer',
      'interests', 'I aspire to become King because I understand that our city-kingdom''s prosperity depends on infrastructure and capability, not just tradition and talk.'
    ),

    -- BANKERS (5 roles)
    jsonb_build_object(
      'sequence', 4,
      'name', 'Trapezites Demetrios Chrysostomos',
      'clan', 'Bankers',
      'age', 47,
      'position', 'Master of the Central Treasury',
      'background', 'Demetrios controls the largest banking operation in Kourion and has personal relationships with financial leaders across the Mediterranean.',
      'character_traits', 'Sophisticated and internationally minded, skilled in complex financial negotiations, pragmatic and analytical, confident in his expertise, protective of financial stability',
      'interests', 'I believe my deep understanding of financial systems and international economics makes me the natural choice to serve as King during these financially challenging times.'
    ),
    jsonb_build_object(
      'sequence', 5,
      'name', 'Kyria Antigone Oikonomos',
      'clan', 'Bankers',
      'age', 41,
      'position', 'Director of Debt Management',
      'background', 'Antigone specializes in managing the city-kingdom''s debt obligations and has developed a reputation for careful, conservative financial management that prioritizes stability over rapid growth.',
      'character_traits', 'Conservative and risk-averse, skilled at identifying financial risks, focused on long-term stability, careful and methodical, protective of fiscal responsibility',
      'interests', 'I genuinely believe my approach to strategic planning and resource management make me a strong candidate to become the new King, not for myself, but for the benefits of the entire kingdom.'
    ),
    jsonb_build_object(
      'sequence', 6,
      'name', 'Kyria Lyra Theodoros',
      'clan', 'Bankers',
      'age', 35,
      'position', 'Master of Investment Banking',
      'background', 'Lyra represents the new generation of bankers who specialize in financing large-scale projects and international investments rather than traditional lending.',
      'character_traits', 'Innovative and opportunistic, skilled at structuring complex deals, ambitious and confident, focused on growth and expansion, comfortable with calculated risks',
      'interests', 'I am eager to serve as Queen if our clan believes my modern understanding of finance and investment would benefit our city-kingdom during these times of economic opportunity.'
    ),
    jsonb_build_object(
      'sequence', 7,
      'name', 'Argentarius Nikandros Nomismatikos',
      'clan', 'Bankers',
      'age', 51,
      'position', 'Master of the Royal Mint',
      'background', 'Nikandros oversees Kourion''s mint and currency operations, controlling the production and quality of our coinage - a position of immense power and responsibility.',
      'character_traits', 'Meticulous and precise, incorruptible, deep financial knowledge, conservative on currency matters, respected across political lines',
      'interests', 'I believe I would serve excellently as King because I understand that financial credibility is the foundation of all political power.'
    ),
    jsonb_build_object(
      'sequence', 8,
      'name', 'Trapezitria Iris Chrematistes',
      'clan', 'Bankers',
      'age', 38,
      'position', 'Director of Commercial Banking',
      'background', 'Iris oversees the commercial banking operations that provide credit to merchants, shipbuilders, and other businesses throughout Kourion.',
      'character_traits', 'Analytically brilliant, risk-aware but not risk-averse, growth-oriented, skilled at reading people and situations, balances profit and prudence',
      'interests', 'I seek to ensure that whoever becomes King understands that smart lending and financial facilitation are essential for economic prosperity.'
    ),

    -- LANDLORDS (7 roles)
    jsonb_build_object(
      'sequence', 9,
      'name', 'Archon Apollodoros Kourionides',
      'clan', 'Landlords',
      'age', 50,
      'position', 'Lord of the Eastern Coastal Estates',
      'background', 'Apollodoros comes from one of the most ancient noble families in Kourion, with estates that have been in his family since the founding of our city-kingdom.',
      'character_traits', 'Noble and dignified, deeply rooted in tradition, fair and just in his dealings, protective of established order, wise in agricultural matters',
      'interests', 'As a member of one of the oldest and most respected families in Kourion, I believe I have both the birthright and the responsibility to serve as King during these turbulent times.'
    ),
    jsonb_build_object(
      'sequence', 10,
      'name', 'Kyria Alexandra Gerontos',
      'clan', 'Landlords',
      'age', 43,
      'position', 'Manager of Interior Grain Estates',
      'background', 'Alexandra has transformed her family''s inland estates into the most productive agricultural operations on the island through careful management and innovative farming techniques.',
      'character_traits', 'Practical and efficient, innovative in agricultural methods, skilled negotiator, results-oriented, adaptable to changing circumstances',
      'interests', 'I am willing to serve as King if our clan believes my practical experience and proven ability to manage resources effectively would benefit our city-kingdom.'
    ),
    jsonb_build_object(
      'sequence', 11,
      'name', 'Strategos Timotheos Hoplites',
      'clan', 'Landlords',
      'age', 55,
      'position', 'Retired Military Commander Lord of Hill Estates',
      'background', 'Timotheos served with distinction in the military before inheriting his family''s hill estates, which produce some of the finest wine and olive oil on the island.',
      'character_traits', 'Experienced in both military and agricultural matters, wise and strategic in thinking, skilled at building alliances, protective of island security',
      'interests', 'The crown is not a perk, but a highest of responsibilities. I''m ready to take this responsibility, and use my talents and relations to make our city strong and prosperous.'
    ),
    jsonb_build_object(
      'sequence', 12,
      'name', 'Kyrios Philippos Agronomos',
      'clan', 'Landlords',
      'age', 44,
      'position', 'Master of the Western Olive Groves',
      'background', 'Philippos oversees the most productive olive groves in western Kourion, lands that have been in his family for eight generations.',
      'character_traits', 'Practical and results-oriented, quality-focused, open to proven innovations, commercially savvy, dignified but approachable',
      'interests', 'I believe I would make an excellent King because I understand both the traditional values that have sustained Kourion and the practical realities of competing in Mediterranean markets.'
    ),
    jsonb_build_object(
      'sequence', 13,
      'name', 'Despoina Theodora Ktemates',
      'clan', 'Landlords',
      'age', 48,
      'position', 'Lady of the Northern Vineyards',
      'background', 'Theodora controls the extensive vineyards of northern Kourion, producing wines that are celebrated across the Mediterranean.',
      'character_traits', 'Diplomatic and wise, skilled mediator, socially conscious, strong but compassionate, bridge-builder',
      'interests', 'I seek to ensure that whoever becomes King understands that the prosperity of Kourion rests not just on the wealth of nobles but on the wellbeing of all people connected to the land.'
    ),
    jsonb_build_object(
      'sequence', 14,
      'name', 'Archon Herakles Geouchikos',
      'clan', 'Landlords',
      'age', 53,
      'position', 'Lord of the Central Plains',
      'background', 'Herakles controls the vast grain fields of central Kourion, the breadbasket that feeds our city-kingdom.',
      'character_traits', 'Deeply conservative, suspicious of innovation, politically powerful but subtle, protector of tradition, proud of ancient lineage',
      'interests', 'I do not actively seek the crown, but if the clans called upon me, I would accept out of duty to preserve the traditions and values that have sustained Kourion.'
    ),
    jsonb_build_object(
      'sequence', 15,
      'name', 'Georgios Agronakis',
      'clan', 'Landlords',
      'age', 33,
      'position', 'Manager of the Southern Estates',
      'background', 'Georgios represents a younger generation of landlords who inherited smaller estates and have built them into profitable enterprises through hard work and practical innovation.',
      'character_traits', 'Hardworking and practical, open to useful innovation, entrepreneurial mindset, bridge between tradition and progress, ambitious but grounded',
      'interests', 'I am determined to prove that the Landlords clan can adapt to changing times without abandoning our core values.'
    ),

    -- MERCHANTS (5 roles)
    jsonb_build_object(
      'sequence', 16,
      'name', 'Navarch Theodoros Phoenikiades',
      'clan', 'Merchants',
      'age', 45,
      'position', 'Master of Maritime Trade',
      'background', 'Theodoros has built the largest trading fleet in Kourion, with ships that regularly sail to Egyptian ports, Phoenician cities, and Persian markets across the Mediterranean.',
      'character_traits', 'Shrewd and diplomatically skilled, visionary about trade opportunities, pragmatic and results-oriented, confident and persuasive',
      'interests', 'I have proven my leadership abilities through building our trade networks and contributing substantially to our city-kingdom''s prosperity.'
    ),
    jsonb_build_object(
      'sequence', 17,
      'name', 'Emporios Helena Kypriades',
      'clan', 'Merchants',
      'age', 52,
      'position', 'Guild Master of Copper Traders',
      'background', 'Helena controls the most established copper trading routes and has maintained steady relationships with traditional Greek trading partners for over two decades.',
      'character_traits', 'Cautious and conservative, skilled at building consensus, loyal to traditional trading partners, risk-averse but steady, wise and experienced',
      'interests', 'I''m not one of those seeking the crown just for their own glory and flatter self-esteem. But I know I might be a great ruler for our city in these troubled times.'
    ),
    jsonb_build_object(
      'sequence', 18,
      'name', 'Nauplios Kyros Salaminiades',
      'clan', 'Merchants',
      'age', 31,
      'position', 'Captain of New Trade Routes',
      'background', 'Kyros represents the new generation of merchants who are eager to expand into unexplored markets and experiment with innovative trading methods.',
      'character_traits', 'Innovative and ambitious, adaptable and opportunistic, enthusiastic about new possibilities, competitive and driven',
      'interests', 'I am eager to serve as King if our clan believes I can best advance our commercial interests, though I recognize that my youth might make some prefer more experienced candidates.'
    ),
    jsonb_build_object(
      'sequence', 19,
      'name', 'Emporios Zeno Panhellenios',
      'clan', 'Merchants',
      'age', 40,
      'position', 'Master of the Eastern Trade Routes',
      'background', 'Zeno built his fortune by establishing and maintaining the complex network of trade relationships connecting Kourion to the eastern Mediterranean markets.',
      'character_traits', 'Cosmopolitan and culturally aware, multilingual diplomat, skilled negotiator, comfortable with foreign customs',
      'interests', 'I aspire to become King because I understand the interconnected nature of the Mediterranean world in ways that more insular leaders cannot.'
    ),
    jsonb_build_object(
      'sequence', 20,
      'name', 'Naukleros Kallisto Thalassopoula',
      'clan', 'Merchants',
      'age', 35,
      'position', 'Owner of the Silver Dolphin Trading Company',
      'background', 'Kallisto inherited a modest shipping business from her father and transformed it into one of Kourion''s most successful trading companies through bold decisions and calculated risks.',
      'character_traits', 'Bold and entrepreneurial, market-savvy, determined to prove herself, fair but competitive, understands luxury markets',
      'interests', 'I am determined to demonstrate that leadership ability, not gender or ancient family lineage, should determine who guides our city-kingdom.'
    ),

    -- MILITARY (7 roles)
    jsonb_build_object(
      'sequence', 21,
      'name', 'Strategos Nikias Korragos',
      'clan', 'Military',
      'age', 42,
      'position', 'Senior Naval Commander',
      'background', 'Nikias comes from a distinguished military family that has served Kourion for three generations, with his grandfather having fought in the great naval battles that secured our island''s independence.',
      'character_traits', 'Honorable and decisive, strategically brilliant but sometimes rigid, protective of Kourion''s traditions, charismatic leader',
      'interests', 'I have dedicated my life to serving Kourion, and I believe the time has come for me to serve as King.'
    ),
    jsonb_build_object(
      'sequence', 22,
      'name', 'Captain Lysander Heraklidos',
      'clan', 'Military',
      'age', 34,
      'position', 'Captain of Coastal Defense',
      'background', 'Lysander is a rising star in the military, having distinguished himself by successfully integrating new naval technologies with traditional Greek fighting methods.',
      'character_traits', 'Innovative and adaptable, respectful of tradition but open to change, diplomatic and pragmatic, ambitious but patient',
      'interests', 'While I respect the experience of my senior colleagues, I believe our clan needs fresh leadership that can navigate the complex challenges facing Kourion.'
    ),
    jsonb_build_object(
      'sequence', 23,
      'name', 'Commander Demetrios Alkibiades',
      'clan', 'Military',
      'age', 48,
      'position', 'Commander of the Sacred Guard',
      'background', 'Demetrios is a veteran warrior who has served in the elite Sacred Guard that protects Kourion''s temples and ceremonial traditions for over two decades.',
      'character_traits', 'Deeply traditional and conservative, fiercely loyal to clan and city, uncompromising in matters of honor, skilled warrior and disciplinarian',
      'interests', 'I do not seek the crown for personal glory, but I would accept it if my clan brothers believe I can best serve our military interests and preserve our ancient traditions.'
    ),
    jsonb_build_object(
      'sequence', 24,
      'name', 'Admiral Kleomenes Thalassios',
      'clan', 'Military',
      'age', 39,
      'position', 'Admiral of the Eastern Fleet',
      'background', 'Kleomenes commands the eastern naval squadron responsible for protecting Kourion''s trade routes from pirates and foreign threats.',
      'character_traits', 'Strategic and adaptable, diplomatic yet firm, understands economic-military balance, respected by both military and merchants',
      'interests', 'I seek to become King because I understand that true strength comes from both military power and economic prosperity - you cannot have one without the other.'
    ),
    jsonb_build_object(
      'sequence', 25,
      'name', 'Lieutenant Andreas Polemistes',
      'clan', 'Military',
      'age', 29,
      'position', 'Commander of the City Guard',
      'background', 'Andreas is the youngest officer to ever command Kourion''s prestigious City Guard, earning his position through exceptional skill in urban defense tactics.',
      'character_traits', 'Young and ambitious, meritocratic and fair, popular with common soldiers, energetic and reform-minded',
      'interests', 'I am determined to prove that youth and merit can serve Kourion as well as age and noble lineage.'
    ),
    jsonb_build_object(
      'sequence', 26,
      'name', 'Hoplite Commander Philon Aspidos',
      'clan', 'Military',
      'age', 46,
      'position', 'Commander of the Heavy Infantry',
      'background', 'Philon commands Kourion''s elite hoplite phalanx, the backbone of our land-based military power.',
      'character_traits', 'Traditional and disciplined, uncompromising on standards, veteran warrior, deeply honorable, somewhat inflexible',
      'interests', 'I do not seek the crown for myself - I am a soldier, not a politician. However, I am absolutely committed to ensuring that whoever becomes King understands that military strength is foundational.'
    ),
    jsonb_build_object(
      'sequence', 27,
      'name', 'Strategos Kassandra Polemarch',
      'clan', 'Military',
      'age', 37,
      'position', 'Strategic Defense Coordinator',
      'background', 'Kassandra is one of the few women to achieve high military rank in Kourion, earning her position through exceptional strategic brilliance.',
      'character_traits', 'Brilliant strategist, analytical and forward-thinking, determined to prove herself, bridges tradition and innovation',
      'interests', 'I am determined to prove that leadership ability, not gender, should determine who guides our city-kingdom.'
    ),

    -- PHILOSOPHERS (3 roles)
    jsonb_build_object(
      'sequence', 28,
      'name', 'Philosophos Sokrates Ethikos',
      'clan', 'Philosophers',
      'age', 51,
      'position', 'Master of the Academy',
      'background', 'Sokrates leads the most respected school of philosophy in Kourion and has trained many of the young leaders who now serve in various clan positions.',
      'character_traits', 'Wise and thoughtful, committed to ethical principles, skilled at seeing long-term consequences, respected across clan lines',
      'interests', 'I do not seek the crown for personal ambition, but I would accept it to ensure that our city-kingdom''s decisions are guided by wisdom and ethical principles.'
    ),
    jsonb_build_object(
      'sequence', 29,
      'name', 'Didaskalos Aristoteles Politikos',
      'clan', 'Philosophers',
      'age', 39,
      'position', 'Master of Political Studies',
      'background', 'Aristoteles has studied the governmental systems of city-kingdoms throughout the Mediterranean and has developed practical theories about governance.',
      'character_traits', 'Intellectually rigorous, skilled at practical applications of theory, balanced and moderate in approach, focused on effective governance',
      'interests', 'I am willing to serve as King if our clan believes my understanding of political theory and practical governance would benefit our city-kingdom.'
    ),
    jsonb_build_object(
      'sequence', 30,
      'name', 'Rhetor Kalliope Logike',
      'clan', 'Philosophers',
      'age', 45,
      'position', 'Master of Rhetoric and Public Speaking',
      'background', 'Kalliope teaches rhetoric at Kourion''s academy and serves as an advisor to citizens navigating legal and political matters.',
      'character_traits', 'Eloquent and persuasive, analytical and logical, pragmatic philosopher, skilled mediator, understands politics and rhetoric',
      'interests', 'I seek to ensure that whoever becomes King understands the power of words and ideas in maintaining social cohesion and effective governance.'
    )
  ),

  'Complete 16-phase simulation with 6 clans and 30 detailed character profiles from seed data',
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
  clan_names TEXT[];
BEGIN
  -- Get counts
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

  -- Get clan names
  SELECT ARRAY(
    SELECT jsonb_array_elements(canonical_clans)->>'name'
    FROM simulation_templates
    WHERE name = 'The New King of Kourion' AND version = 'v1.0'
  ) INTO clan_names;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Complete KOURION v1.0 Template Seeded';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Templates: %', template_count;
  RAISE NOTICE 'Process stages: %', stages_count;
  RAISE NOTICE 'Canonical clans: %', clans_count;
  RAISE NOTICE 'Canonical roles: %', roles_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Clans: %', array_to_string(clan_names, ', ');
  RAISE NOTICE '========================================';

  -- Validation
  IF template_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 template, found %', template_count;
  END IF;

  IF stages_count != 16 THEN
    RAISE EXCEPTION 'Expected 16 process stages, found %', stages_count;
  END IF;

  IF clans_count != 6 THEN
    RAISE EXCEPTION 'Expected 6 clans, found %', clans_count;
  END IF;

  IF roles_count != 30 THEN
    RAISE EXCEPTION 'Expected 30 roles, found %', roles_count;
  END IF;

  RAISE NOTICE '✅ All validation checks passed!';
  RAISE NOTICE '✅ Complete seed data loaded: 6 clans, 30 roles, 16 phases';
  RAISE NOTICE '✅ Template ready for production use';
END $$;
