-- ============================================================================
-- Find Corrupted JSON in Database
-- ============================================================================

DO $$
DECLARE
  sim_rec RECORD;
  json_valid BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECKING FOR CORRUPTED JSON';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check each sim_run
  FOR sim_rec IN SELECT run_id, run_name, config, ai_config FROM sim_runs LOOP
    -- Try to validate config JSON
    BEGIN
      json_valid := (sim_rec.config::text)::jsonb IS NOT NULL;
      RAISE NOTICE '✅ sim_run: % - config JSON valid', sim_rec.run_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ sim_run: % - config JSON CORRUPT!', sim_rec.run_name;
    END;

    -- Try to validate ai_config JSON
    IF sim_rec.ai_config IS NOT NULL THEN
      BEGIN
        json_valid := (sim_rec.ai_config::text)::jsonb IS NOT NULL;
        RAISE NOTICE '✅ sim_run: % - ai_config JSON valid', sim_rec.run_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ sim_run: % - ai_config JSON CORRUPT!', sim_rec.run_name;
      END;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- Also check if config is a valid JSON string (not corrupted text)
SELECT
  run_id,
  run_name,
  CASE
    WHEN config IS NULL THEN 'NULL'
    WHEN jsonb_typeof(config) = 'string' THEN 'STRING (possibly corrupt)'
    WHEN jsonb_typeof(config) = 'object' THEN 'OBJECT (valid)'
    ELSE 'OTHER: ' || jsonb_typeof(config)
  END as config_type,
  length(config::text) as config_length
FROM sim_runs
ORDER BY run_name;
