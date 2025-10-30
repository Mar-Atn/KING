-- ============================================================================
-- Migration: 00047_fix_vote_1_description_comprehensive.sql
-- Description: Comprehensive fix for Vote 1 phase description across entire database
-- Purpose: Find and replace ALL occurrences of old description with new one
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-30
-- Project: The New King SIM - Political Simulation Platform
--
-- SEARCH: "Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed"
-- REPLACE: "Open voting. If no winner two candidates with highest votes proceed"
--
-- This migration searches ALL tables for the old text in both TEXT and JSONB fields
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE phases TABLE (TEXT field)
-- ============================================================================

UPDATE phases
SET description = 'Open voting. If no winner two candidates with highest votes proceed'
WHERE description = 'Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed';

-- ============================================================================
-- STEP 2: UPDATE simulation_templates TABLE (JSONB base_config.phases array)
-- ============================================================================

-- Check if simulation_templates exists and update base_config
UPDATE simulation_templates
SET base_config = jsonb_set(
  base_config,
  '{phases}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN phase->>'description' LIKE '%Open voting - need 10+ votes to win%'
        THEN jsonb_set(
          phase,
          '{description}',
          '"Open voting. If no winner two candidates with highest votes proceed"'::jsonb
        )
        ELSE phase
      END
    )
    FROM jsonb_array_elements(base_config->'phases') AS phase
  )
)
WHERE base_config->'phases' IS NOT NULL
  AND base_config::text LIKE '%Open voting - need 10+ votes to win%';

-- ============================================================================
-- STEP 3: UPDATE sim_runs TABLE (JSONB config.phases array)
-- ============================================================================

-- Update config JSONB in sim_runs if it contains phases array
UPDATE sim_runs
SET config = jsonb_set(
  config,
  '{phases}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN phase->>'description' LIKE '%Open voting - need 10+ votes to win%'
        THEN jsonb_set(
          phase,
          '{description}',
          '"Open voting. If no winner two candidates with highest votes proceed"'::jsonb
        )
        ELSE phase
      END
    )
    FROM jsonb_array_elements(config->'phases') AS phase
  )
)
WHERE config->'phases' IS NOT NULL
  AND config::text LIKE '%Open voting - need 10+ votes to win%';

-- ============================================================================
-- STEP 4: UPDATE event_log TABLE (JSONB event_data)
-- ============================================================================

-- Search and replace in event_data JSONB (if phase descriptions are logged)
UPDATE event_log
SET event_data = regexp_replace(
  event_data::text,
  'Open voting - need 10\+ votes to win\. If no winner two candidates with highest votes proceed',
  'Open voting. If no winner two candidates with highest votes proceed',
  'g'
)::jsonb
WHERE event_data::text LIKE '%Open voting - need 10+ votes to win%';

-- ============================================================================
-- STEP 5: COMPREHENSIVE SEARCH FOR ANY REMAINING OCCURRENCES
-- ============================================================================

-- This function dynamically searches ALL tables for the old text
DO $$
DECLARE
  table_record RECORD;
  column_record RECORD;
  search_query TEXT;
  found_count INT := 0;
  total_occurrences INT := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEARCHING ENTIRE DATABASE FOR OLD TEXT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Search all text columns in all tables
  FOR table_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    FOR column_record IN
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = table_record.schemaname
        AND table_name = table_record.tablename
        AND (data_type IN ('text', 'character varying') OR data_type = 'jsonb')
    LOOP
      BEGIN
        -- Build dynamic query
        IF column_record.data_type = 'jsonb' THEN
          search_query := format(
            'SELECT COUNT(*) FROM %I.%I WHERE %I::text LIKE ''%%Open voting - need 10+ votes to win%%''',
            table_record.schemaname,
            table_record.tablename,
            column_record.column_name
          );
        ELSE
          search_query := format(
            'SELECT COUNT(*) FROM %I.%I WHERE %I LIKE ''%%Open voting - need 10+ votes to win%%''',
            table_record.schemaname,
            table_record.tablename,
            column_record.column_name
          );
        END IF;

        -- Execute search
        EXECUTE search_query INTO found_count;

        IF found_count > 0 THEN
          total_occurrences := total_occurrences + found_count;
          RAISE NOTICE '⚠️  FOUND % occurrence(s) in %.%.%',
            found_count,
            table_record.schemaname,
            table_record.tablename,
            column_record.column_name;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Skip columns that can't be searched
          NULL;
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE '';
  IF total_occurrences > 0 THEN
    RAISE WARNING '⚠️  TOTAL REMAINING OCCURRENCES: % - Manual review needed!', total_occurrences;
  ELSE
    RAISE NOTICE '✅ NO REMAINING OCCURRENCES FOUND';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 6: VERIFICATION AND SUMMARY
-- ============================================================================

DO $$
DECLARE
  phases_updated INT;
  templates_updated INT;
  runs_updated INT;
  events_updated INT;
BEGIN
  -- Count updated records in each table
  SELECT COUNT(*) INTO phases_updated
  FROM phases
  WHERE description = 'Open voting. If no winner two candidates with highest votes proceed';

  SELECT COUNT(*) INTO templates_updated
  FROM simulation_templates
  WHERE base_config::text LIKE '%Open voting. If no winner two candidates with highest votes proceed%';

  SELECT COUNT(*) INTO runs_updated
  FROM sim_runs
  WHERE config::text LIKE '%Open voting. If no winner two candidates with highest votes proceed%';

  SELECT COUNT(*) INTO events_updated
  FROM event_log
  WHERE event_data::text LIKE '%Open voting. If no winner two candidates with highest votes proceed%';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPREHENSIVE UPDATE COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'RECORDS UPDATED:';
  RAISE NOTICE '  • phases table: % records', phases_updated;
  RAISE NOTICE '  • simulation_templates: % records', templates_updated;
  RAISE NOTICE '  • sim_runs: % records', runs_updated;
  RAISE NOTICE '  • event_log: % records', events_updated;
  RAISE NOTICE '';
  RAISE NOTICE 'TEXT CHANGE:';
  RAISE NOTICE '  OLD: "Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed"';
  RAISE NOTICE '  NEW: "Open voting. If no winner two candidates with highest votes proceed"';
  RAISE NOTICE '';
  RAISE NOTICE 'RATIONALE:';
  RAISE NOTICE '  Voting threshold is configurable per sim_run via vote_1_threshold field';
  RAISE NOTICE '  Hardcoded "10+ votes" was misleading and incorrect';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- COMPREHENSIVE FIX COMPLETE
-- ============================================================================
-- Searched and updated: phases, simulation_templates, sim_runs, event_log
-- Dynamic search performed across all tables and columns
-- Any remaining occurrences will be reported above for manual review
-- ============================================================================
