-- ============================================================================
-- COMPREHENSIVE DATABASE PERFORMANCE DIAGNOSTIC
-- ============================================================================
-- Date: 2025-10-28
-- Problem: Database resource exhaustion - loading simulations takes 15-20+ seconds
-- Even with ALL RLS policies fully open (USING true), still slow!
-- ============================================================================

\timing on

-- ============================================================================
-- PART 1: IDENTIFY THE TRIGGER STORM
-- ============================================================================
-- Hypothesis: EVENT_LOG TRIGGERS are causing massive overhead
-- Every INSERT/UPDATE fires multiple triggers that log to event_log
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PART 1: TRIGGER ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Count all triggers on tables
SELECT
  tgrelid::regclass AS table_name,
  COUNT(*) AS trigger_count,
  string_agg(tgname, ', ') AS trigger_names
FROM pg_trigger
WHERE tgrelid::regclass::text LIKE '%'
  AND tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%'
GROUP BY tgrelid
ORDER BY COUNT(*) DESC;

-- Show event_log triggers specifically
SELECT
  tgrelid::regclass AS table_name,
  tgname AS trigger_name,
  tgtype AS trigger_type,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname LIKE '%log%'
  AND tgname NOT LIKE 'pg_%'
ORDER BY tgrelid::regclass::text;

-- Check event_log table size and growth
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'event_log';

DO $$
DECLARE
  event_log_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO event_log_count FROM event_log;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EVENT LOG ANALYSIS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Event log rows: %', event_log_count;
  RAISE NOTICE '';
  RAISE NOTICE 'HYPOTHESIS: If event_log has triggers on 10+ tables,';
  RAISE NOTICE 'every operation cascades into multiple log writes.';
  RAISE NOTICE 'This creates exponential overhead!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PART 2: INDEX ANALYSIS - Find Missing or Unused Indexes
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PART 2: INDEX EFFECTIVENESS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Show all indexes and their usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Find tables with sequential scans (should use indexes instead)
SELECT
  schemaname,
  tablename,
  seq_scan AS sequential_scans,
  seq_tup_read AS rows_read_sequentially,
  idx_scan AS index_scans,
  n_live_tup AS live_rows,
  CASE
    WHEN seq_scan > 0 AND idx_scan > 0
    THEN ROUND((seq_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
    ELSE 0
  END AS pct_sequential_scans
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 100  -- Tables with significant sequential scans
ORDER BY seq_scan DESC
LIMIT 15;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'INTERPRETATION:';
  RAISE NOTICE '  • High sequential scans = missing indexes';
  RAISE NOTICE '  • idx_scan = 0 with large index_size = unused index (waste)';
  RAISE NOTICE '  • >50%% sequential scans = queries not using indexes';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PART 3: QUERY PERFORMANCE - Simulate Dashboard Load
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PART 3: SIMULATE PARTICIPANT DASHBOARD LOAD';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This simulates the exact queries from ParticipantDashboard.tsx';
  RAISE NOTICE '';
END $$;

-- Get a test run_id
DO $$
DECLARE
  test_run_id UUID;
  test_user_id UUID;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  elapsed_ms NUMERIC;
BEGIN
  -- Get first run_id
  SELECT run_id INTO test_run_id FROM sim_runs LIMIT 1;

  -- Get first user with a role
  SELECT assigned_user_id INTO test_user_id
  FROM roles
  WHERE assigned_user_id IS NOT NULL
  LIMIT 1;

  IF test_run_id IS NULL OR test_user_id IS NULL THEN
    RAISE NOTICE 'No test data available - cannot simulate queries';
    RETURN;
  END IF;

  RAISE NOTICE 'Testing with run_id: %', test_run_id;
  RAISE NOTICE 'Testing with user_id: %', test_user_id;
  RAISE NOTICE '';

  -- Query 1: Get user's role
  RAISE NOTICE '1. getRoleForUser() - Get user role...';
  start_time := clock_timestamp();

  PERFORM r.*
  FROM roles r
  LEFT JOIN clans c ON c.clan_id = r.clan_id
  WHERE r.run_id = test_run_id
    AND r.assigned_user_id = test_user_id;

  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '   ✓ Completed in % ms', ROUND(elapsed_ms, 2);

  -- Query 2: Get simulation
  RAISE NOTICE '2. Get simulation info...';
  start_time := clock_timestamp();

  PERFORM * FROM sim_runs WHERE run_id = test_run_id;

  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '   ✓ Completed in % ms', ROUND(elapsed_ms, 2);

  -- Query 3: Get clan members with JOIN to users
  RAISE NOTICE '3. Get clan members (JOIN roles + users)...';
  start_time := clock_timestamp();

  PERFORM r.*, u.display_name
  FROM roles r
  LEFT JOIN users u ON u.id = r.assigned_user_id
  WHERE r.clan_id = (
    SELECT clan_id FROM roles
    WHERE run_id = test_run_id
      AND assigned_user_id = test_user_id
    LIMIT 1
  )
  ORDER BY r.name;

  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '   ✓ Completed in % ms', ROUND(elapsed_ms, 2);

  -- Query 4: Get all clans
  RAISE NOTICE '4. Get all clans for simulation...';
  start_time := clock_timestamp();

  PERFORM * FROM clans
  WHERE run_id = test_run_id
  ORDER BY sequence_number;

  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '   ✓ Completed in % ms', ROUND(elapsed_ms, 2);

  -- Query 5: Get all roles
  RAISE NOTICE '5. Get all roles for simulation...';
  start_time := clock_timestamp();

  PERFORM * FROM roles WHERE run_id = test_run_id;

  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '   ✓ Completed in % ms', ROUND(elapsed_ms, 2);

  -- Query 6: Get all phases
  RAISE NOTICE '6. Get all phases for simulation...';
  start_time := clock_timestamp();

  PERFORM * FROM phases
  WHERE run_id = test_run_id
  ORDER BY sequence_number;

  end_time := clock_timestamp();
  elapsed_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  RAISE NOTICE '   ✓ Completed in % ms', ROUND(elapsed_ms, 2);

  RAISE NOTICE '';
  RAISE NOTICE 'If total time > 1000ms, there is a serious performance issue';

END $$;

-- ============================================================================
-- PART 4: CONNECTION AND RESOURCE ANALYSIS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PART 4: CONNECTION AND RESOURCE USAGE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Show active connections
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  state,
  COUNT(*) AS connection_count,
  MAX(backend_start) AS oldest_connection
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY connection_count DESC;

-- Show table bloat (dead tuples)
SELECT
  schemaname,
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE
    WHEN n_live_tup > 0
    THEN ROUND((n_dead_tup::numeric / n_live_tup) * 100, 2)
    ELSE 0
  END AS pct_dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY n_dead_tup DESC;

-- ============================================================================
-- PART 5: RLS POLICY OVERHEAD ANALYSIS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PART 5: RLS POLICY OVERHEAD';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ') AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY COUNT(*) DESC;

-- Show policies that might have complex checks
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN qual LIKE '%SELECT%' OR qual LIKE '%EXISTS%' THEN 'Complex (subquery)'
    WHEN qual = 'true' THEN 'Open (true)'
    ELSE 'Simple'
  END AS complexity_using,
  CASE
    WHEN with_check LIKE '%SELECT%' OR with_check LIKE '%EXISTS%' THEN 'Complex (subquery)'
    WHEN with_check = 'true' THEN 'Open (true)'
    ELSE 'Simple'
  END AS complexity_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FINAL DIAGNOSIS SUMMARY
-- ============================================================================

DO $$
DECLARE
  trigger_count INT;
  event_log_rows BIGINT;
  total_indexes INT;
  unused_indexes INT;
  high_seqscan_tables INT;
  total_policies INT;
  open_policies INT;
BEGIN
  SELECT COUNT(*) INTO trigger_count FROM pg_trigger
  WHERE tgname LIKE '%log%' AND tgname NOT LIKE 'pg_%';

  SELECT COUNT(*) INTO event_log_rows FROM event_log;

  SELECT COUNT(*) INTO total_indexes FROM pg_stat_user_indexes WHERE schemaname = 'public';

  SELECT COUNT(*) INTO unused_indexes FROM pg_stat_user_indexes
  WHERE schemaname = 'public' AND idx_scan = 0;

  SELECT COUNT(*) INTO high_seqscan_tables FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND seq_scan > 100;

  SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';

  SELECT COUNT(*) INTO open_policies FROM pg_policies
  WHERE schemaname = 'public' AND qual = 'true';

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           COMPREHENSIVE DIAGNOSTIC SUMMARY                 ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 TRIGGERS:';
  RAISE NOTICE '   Event logging triggers: %', trigger_count;
  RAISE NOTICE '   Event log rows: %', event_log_rows;
  RAISE NOTICE '';
  RAISE NOTICE '📊 INDEXES:';
  RAISE NOTICE '   Total indexes: %', total_indexes;
  RAISE NOTICE '   Unused indexes: %', unused_indexes;
  RAISE NOTICE '   Tables with high sequential scans: %', high_seqscan_tables;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS POLICIES:';
  RAISE NOTICE '   Total policies: %', total_policies;
  RAISE NOTICE '   Fully open policies: %', open_policies;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRIMARY SUSPECTS:';
  RAISE NOTICE '';

  IF trigger_count > 5 THEN
    RAISE NOTICE '   ⚠️  CRITICAL: % event logging triggers detected!', trigger_count;
    RAISE NOTICE '       Every query triggers cascading log writes.';
    RAISE NOTICE '       This creates EXPONENTIAL overhead.';
    RAISE NOTICE '       RECOMMENDATION: Disable triggers temporarily.';
    RAISE NOTICE '';
  END IF;

  IF unused_indexes > 5 THEN
    RAISE NOTICE '   ⚠️  WARNING: % unused indexes wasting resources', unused_indexes;
    RAISE NOTICE '       RECOMMENDATION: Drop unused indexes.';
    RAISE NOTICE '';
  END IF;

  IF high_seqscan_tables > 3 THEN
    RAISE NOTICE '   ⚠️  WARNING: % tables have high sequential scans', high_seqscan_tables;
    RAISE NOTICE '       RECOMMENDATION: Add indexes for common queries.';
    RAISE NOTICE '';
  END IF;

  IF open_policies < total_policies / 2 THEN
    RAISE NOTICE '   ℹ️  INFO: Only %/% policies are fully open', open_policies, total_policies;
    RAISE NOTICE '       Some policies still have complex checks.';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                    NEXT STEPS                              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '1. IMMEDIATE FIX: Disable event_log triggers';
  RAISE NOTICE '   ALTER TABLE [table] DISABLE TRIGGER [trigger_name];';
  RAISE NOTICE '';
  RAISE NOTICE '2. Test if performance improves';
  RAISE NOTICE '';
  RAISE NOTICE '3. If still slow, drop unused indexes';
  RAISE NOTICE '';
  RAISE NOTICE '4. Analyze EXPLAIN plans for slow queries';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

\timing off
