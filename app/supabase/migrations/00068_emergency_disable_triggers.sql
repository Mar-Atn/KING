-- ============================================================================
-- EMERGENCY FIX: DISABLE EVENT LOGGING TRIGGERS
-- ============================================================================
-- Date: 2025-10-28
-- Problem: Database resource exhaustion caused by trigger cascade
-- Solution: Temporarily disable all event_log triggers
-- ============================================================================
-- CRITICAL: This is an EMERGENCY FIX to restore performance NOW
-- Event logging will be disabled - re-enable after optimization
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║        EMERGENCY: DISABLING EVENT LOG TRIGGERS            ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  This will disable event logging temporarily';
  RAISE NOTICE '⚠️  Performance should improve 10-100x';
  RAISE NOTICE '⚠️  Re-enable after optimizing event_log architecture';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- DISABLE ALL EVENT LOGGING TRIGGERS
-- ============================================================================

-- 1. Simulation status changes
DO $$ BEGIN
  EXECUTE 'ALTER TABLE sim_runs DISABLE TRIGGER trigger_log_sim_run_status_change';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 2. Phase transitions
DO $$ BEGIN
  EXECUTE 'ALTER TABLE phases DISABLE TRIGGER trigger_log_phase_status_change';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 3. Vote casting
DO $$ BEGIN
  EXECUTE 'ALTER TABLE votes DISABLE TRIGGER trigger_log_vote_cast';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 4. Meeting creation
DO $$ BEGIN
  EXECUTE 'ALTER TABLE meetings DISABLE TRIGGER trigger_log_meeting_created';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 5. Meeting completion
DO $$ BEGIN
  EXECUTE 'ALTER TABLE meetings DISABLE TRIGGER trigger_log_meeting_completed';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 6. Public speeches
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public_speeches DISABLE TRIGGER trigger_log_public_speech';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 7. AI context updates
DO $$ BEGIN
  EXECUTE 'ALTER TABLE ai_context DISABLE TRIGGER trigger_log_ai_context_update';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  disabled_trigger_count INT;
  enabled_trigger_count INT;
BEGIN
  -- Count disabled triggers
  SELECT COUNT(*) INTO disabled_trigger_count
  FROM pg_trigger
  WHERE tgname LIKE '%log%'
    AND tgname NOT LIKE 'pg_%'
    AND tgenabled = 'D';

  -- Count still-enabled triggers
  SELECT COUNT(*) INTO enabled_trigger_count
  FROM pg_trigger
  WHERE tgname LIKE '%log%'
    AND tgname NOT LIKE 'pg_%'
    AND tgenabled = 'O';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TRIGGERS DISABLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Disabled triggers: %', disabled_trigger_count;
  RAISE NOTICE 'Still enabled: %', enabled_trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE 'EXPECTED RESULTS:';
  RAISE NOTICE '  • Login: instant';
  RAISE NOTICE '  • Load simulation: <1 second';
  RAISE NOTICE '  • Database CPU: drops 80-90%%';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  EVENT LOGGING IS NOW DISABLED';
  RAISE NOTICE '⚠️  No events will be recorded until triggers are re-enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST NOW:';
  RAISE NOTICE '  1. Refresh browser';
  RAISE NOTICE '  2. Log in as participant';
  RAISE NOTICE '  3. Load simulation dashboard';
  RAISE NOTICE '  4. Measure loading time';
  RAISE NOTICE '';
  RAISE NOTICE 'If fast: triggers were the issue ✓';
  RAISE NOTICE 'If still slow: check frontend or network';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- OPTIONAL: RE-ENABLE TRIGGERS (RUN MANUALLY AFTER OPTIMIZATION)
-- ============================================================================
/*
-- Uncomment these lines to re-enable triggers after optimizing event_log:

ALTER TABLE sim_runs ENABLE TRIGGER trigger_log_sim_run_status_change;
ALTER TABLE phases ENABLE TRIGGER trigger_log_phase_status_change;
ALTER TABLE votes ENABLE TRIGGER trigger_log_vote_cast;
ALTER TABLE meetings ENABLE TRIGGER trigger_log_meeting_created;
ALTER TABLE meetings ENABLE TRIGGER trigger_log_meeting_completed;
ALTER TABLE public_speeches ENABLE TRIGGER trigger_log_public_speech;
ALTER TABLE ai_context ENABLE TRIGGER trigger_log_ai_context_update;

-- After re-enabling, optimize event_log:
-- 1. Add partitioning by run_id or created_at
-- 2. Add proper retention policy (delete old events)
-- 3. Optimize trigger functions (batch inserts, async queuing)
-- 4. Consider moving to separate logging database
*/
