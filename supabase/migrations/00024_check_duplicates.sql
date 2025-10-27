-- Diagnostic: Check for remaining duplicate policies
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECKING FOR DUPLICATE POLICIES';
  RAISE NOTICE '========================================';

  FOR rec IN
    SELECT
      tablename,
      cmd as action,
      array_agg(policyname ORDER BY policyname) as policy_names,
      COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
    ORDER BY tablename, cmd
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'Table: % | Action: % | Count: %', rec.tablename, rec.action, rec.policy_count;
    RAISE NOTICE 'Policies: %', rec.policy_names;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
