-- ============================================================================
-- Inspection: Show current RLS policies
-- ============================================================================

DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT RLS POLICIES ON SIM_RUNS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOR policy_rec IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sim_runs'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: %', policy_rec.policyname;
    RAISE NOTICE '  Command: %', policy_rec.cmd;
    RAISE NOTICE '  USING: %', policy_rec.qual;
    RAISE NOTICE '  WITH CHECK: %', policy_rec.with_check;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
END $$;
