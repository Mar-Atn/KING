-- Find remaining duplicate policies
SELECT
  tablename,
  cmd as action,
  array_agg(policyname ORDER BY policyname) as policy_names,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;
