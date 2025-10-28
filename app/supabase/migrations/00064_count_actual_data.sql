-- ============================================================================
-- Check if database has any data
-- ============================================================================

DO $$
DECLARE
  users_count BIGINT;
  sim_runs_count BIGINT;
  clans_count BIGINT;
  roles_count BIGINT;
  phases_count BIGINT;
BEGIN
  -- Count bypassing RLS
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO sim_runs_count FROM sim_runs;
  SELECT COUNT(*) INTO clans_count FROM clans;
  SELECT COUNT(*) INTO roles_count FROM roles;
  SELECT COUNT(*) INTO phases_count FROM phases;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE CONTENTS (BYPASSING RLS)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'users: % rows', users_count;
  RAISE NOTICE 'sim_runs: % rows', sim_runs_count;
  RAISE NOTICE 'clans: % rows', clans_count;
  RAISE NOTICE 'roles: % rows', roles_count;
  RAISE NOTICE 'phases: % rows', phases_count;
  RAISE NOTICE '';

  IF sim_runs_count = 0 THEN
    RAISE NOTICE '⚠️  NO SIMULATIONS IN DATABASE!';
    RAISE NOTICE '   This explains why dashboard shows "loading..." forever';
    RAISE NOTICE '   The frontend is waiting for data that does not exist';
  ELSE
    RAISE NOTICE '✅ Simulations exist in database';
    RAISE NOTICE '   If users cannot see them, RLS is blocking access';
  END IF;

  RAISE NOTICE '========================================';
END $$;
