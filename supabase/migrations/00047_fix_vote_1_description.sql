-- ============================================================================
-- Migration: 00047_fix_vote_1_description.sql
-- Description: Fix incorrect Vote 1 phase description to remove hardcoded threshold
-- Purpose: Remove "need 10+ votes to win" from Vote 1 description since threshold is per-run
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-30
-- Project: The New King SIM - Political Simulation Platform
--
-- ISSUE: Vote 1 description incorrectly mentions "need 10+ votes to win"
--        when threshold is actually configurable per sim_run via vote_1_threshold
-- FIX: Update description in phases table and sim_templates.base_config
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE PHASES TABLE
-- ============================================================================

-- Update all existing Vote 1 phase descriptions
UPDATE phases
SET description = 'Open voting. If no winner two candidates with highest votes proceed'
WHERE phase_name = 'Vote 1'
  AND description = 'Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed';

-- ============================================================================
-- STEP 2: UPDATE SIM_TEMPLATES BASE_CONFIG
-- ============================================================================

-- Update sim_templates where base_config contains phases array with old Vote 1 description
-- This uses JSONB functions to find and replace the description within the phases array

UPDATE sim_templates
SET base_config = jsonb_set(
  base_config,
  '{phases}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN phase->>'phase_name' = 'Vote 1'
          AND phase->>'description' = 'Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed'
        THEN jsonb_set(
          phase,
          '{description}',
          '"Open voting. If no winner two candidates with highest votes proceed"'
        )
        ELSE phase
      END
    )
    FROM jsonb_array_elements(base_config->'phases') AS phase
  )
)
WHERE base_config->'phases' IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(base_config->'phases') AS phase
    WHERE phase->>'phase_name' = 'Vote 1'
      AND phase->>'description' = 'Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed'
  );

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  phases_updated INT;
  templates_updated INT;
BEGIN
  -- Count updated phases
  SELECT COUNT(*) INTO phases_updated
  FROM phases
  WHERE phase_name = 'Vote 1'
    AND description = 'Open voting. If no winner two candidates with highest votes proceed';

  -- Count templates with updated phases
  SELECT COUNT(*) INTO templates_updated
  FROM sim_templates
  WHERE base_config->'phases' IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(base_config->'phases') AS phase
      WHERE phase->>'phase_name' = 'Vote 1'
        AND phase->>'description' = 'Open voting. If no winner two candidates with highest votes proceed'
    );

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VOTE 1 DESCRIPTION FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'UPDATES APPLIED:';
  RAISE NOTICE '✓ Phases table: % Vote 1 records updated', phases_updated;
  RAISE NOTICE '✓ Sim templates: % templates updated', templates_updated;
  RAISE NOTICE '';
  RAISE NOTICE 'OLD: "Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed"';
  RAISE NOTICE 'NEW: "Open voting. If no winner two candidates with highest votes proceed"';
  RAISE NOTICE '';
  RAISE NOTICE 'RATIONALE: Threshold is configured per sim_run via vote_1_threshold field';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIX VOTE 1 DESCRIPTION MIGRATION COMPLETE
-- ============================================================================
-- All Vote 1 phase descriptions updated to remove hardcoded threshold
-- Changes applied to: phases table and sim_templates.base_config JSONB
-- ============================================================================
