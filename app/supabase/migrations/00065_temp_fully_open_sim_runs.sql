-- ============================================================================
-- TEMPORARY: Fully open sim_runs policy for testing
-- ============================================================================
-- This will help us determine if the WITH CHECK clause is causing issues
-- even though it should only apply to writes, not reads
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CREATING FULLY OPEN POLICY (TEMPORARY)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'This is for testing only!';
  RAISE NOTICE 'We will restrict it again after diagnosis';
  RAISE NOTICE '========================================';
END $$;

-- Drop current policy
DROP POLICY IF EXISTS "sim_runs_unified" ON sim_runs;

-- Create completely open policy - NO checks at all
CREATE POLICY "sim_runs_test_open"
  ON sim_runs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);  -- ← Changed to true (no user table query)

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ sim_runs now has FULLY OPEN policy';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST NOW:';
  RAISE NOTICE '  1. Try loading dashboard - should be instant';
  RAISE NOTICE '  2. If it works, the WITH CHECK clause was the problem';
  RAISE NOTICE '  3. Report back and we will add proper security';
  RAISE NOTICE '';
  RAISE NOTICE 'SECURITY WARNING: Everyone can now modify sim_runs!';
  RAISE NOTICE 'This is temporary for testing only';
  RAISE NOTICE '========================================';
END $$;
