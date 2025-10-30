-- ============================================================================
-- Verification Script: Check for old Vote 1 description BEFORE applying fix
-- ============================================================================
-- Run this FIRST to see where the old text exists in your database
-- ============================================================================

DO $$
DECLARE
  phases_count INT;
  templates_count INT;
  runs_count INT;
  events_count INT;
  total_count INT := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEARCHING FOR OLD VOTE 1 DESCRIPTION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Searching for: "Open voting - need 10+ votes to win."';
  RAISE NOTICE '';

  -- Check phases table
  SELECT COUNT(*) INTO phases_count
  FROM phases
  WHERE description LIKE '%Open voting - need 10+ votes to win%';

  IF phases_count > 0 THEN
    RAISE NOTICE '📋 phases table: FOUND % occurrence(s)', phases_count;
    total_count := total_count + phases_count;
  ELSE
    RAISE NOTICE '✅ phases table: Clean';
  END IF;

  -- Check simulation_templates
  SELECT COUNT(*) INTO templates_count
  FROM simulation_templates
  WHERE base_config::text LIKE '%Open voting - need 10+ votes to win%';

  IF templates_count > 0 THEN
    RAISE NOTICE '📋 simulation_templates: FOUND % occurrence(s)', templates_count;
    total_count := total_count + templates_count;
  ELSE
    RAISE NOTICE '✅ simulation_templates: Clean';
  END IF;

  -- Check sim_runs
  SELECT COUNT(*) INTO runs_count
  FROM sim_runs
  WHERE config::text LIKE '%Open voting - need 10+ votes to win%';

  IF runs_count > 0 THEN
    RAISE NOTICE '📋 sim_runs: FOUND % occurrence(s)', runs_count;
    total_count := total_count + runs_count;
  ELSE
    RAISE NOTICE '✅ sim_runs: Clean';
  END IF;

  -- Check event_log
  SELECT COUNT(*) INTO events_count
  FROM event_log
  WHERE event_data::text LIKE '%Open voting - need 10+ votes to win%';

  IF events_count > 0 THEN
    RAISE NOTICE '📋 event_log: FOUND % occurrence(s)', events_count;
    total_count := total_count + events_count;
  ELSE
    RAISE NOTICE '✅ event_log: Clean';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  IF total_count > 0 THEN
    RAISE NOTICE '⚠️  TOTAL OCCURRENCES FOUND: %', total_count;
    RAISE NOTICE '👉 Run 00047_fix_vote_1_description_comprehensive.sql to fix';
  ELSE
    RAISE NOTICE '✅ DATABASE IS CLEAN - No fixes needed!';
  END IF;
  RAISE NOTICE '========================================';
END $$;
