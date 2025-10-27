-- Diagnostic: Check policy roles to understand the remaining duplicate
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'POLICY ANALYSIS BY ROLE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check users INSERT policies in detail
  RAISE NOTICE 'USERS INSERT POLICIES:';
  FOR rec IN
    SELECT
      policyname,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
    AND cmd = 'INSERT'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'Policy: %', rec.policyname;
    RAISE NOTICE '  Roles: %', rec.roles;
    RAISE NOTICE '  Command: %', rec.cmd;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECKING FOR DUPLICATES BY ROLE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check for duplicates scoped to the SAME role
  FOR rec IN
    SELECT
      tablename,
      cmd,
      roles,
      array_agg(policyname ORDER BY policyname) as policy_names,
      COUNT(*) as count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd, roles
    HAVING COUNT(*) > 1
    ORDER BY tablename, cmd
  LOOP
    RAISE NOTICE 'DUPLICATE FOUND:';
    RAISE NOTICE 'Table: % | Action: % | Role: %', rec.tablename, rec.cmd, rec.roles;
    RAISE NOTICE 'Policies: %', rec.policy_names;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
END $$;
