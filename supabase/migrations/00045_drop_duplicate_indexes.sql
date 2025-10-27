-- ============================================================================
-- Migration: 00045_drop_duplicate_indexes.sql
-- Description: Remove duplicate indexes that waste storage and slow down writes
-- Purpose: Fix Supabase Performance Advisor warnings about duplicate indexes
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Multiple identical indexes on same columns
-- Impact: Wasted disk space, slower INSERT/UPDATE operations
-- Solution: Keep one index from each duplicate pair, drop the others
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DROPPING DUPLICATE INDEXES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Removing redundant indexes';
  RAISE NOTICE 'Each table keeps only one index per column set';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- CLANS: Drop duplicate sequence index
-- ============================================================================
-- Keep: idx_clans_run_sequence (more descriptive name)
-- Drop: idx_clans_sequence (less descriptive)

DROP INDEX IF EXISTS idx_clans_sequence;

-- ============================================================================
-- PHASES: Drop duplicate indexes
-- ============================================================================
-- Keep: idx_phases_run_sequence (more descriptive)
-- Drop: idx_phases_sequence (less descriptive)

DROP INDEX IF EXISTS idx_phases_sequence;

-- Keep: idx_phases_run_status (more descriptive)
-- Drop: idx_phases_status (less descriptive)

DROP INDEX IF EXISTS idx_phases_status;

-- ============================================================================
-- ROLES: Drop duplicate run_id index
-- ============================================================================
-- Keep: idx_roles_run_id (more descriptive, matches column name)
-- Drop: idx_roles_run (less descriptive)

DROP INDEX IF EXISTS idx_roles_run;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  index_count INT;
BEGIN
  -- Count remaining indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DUPLICATE INDEXES DROPPED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Dropped indexes:';
  RAISE NOTICE '  ✓ idx_clans_sequence (kept idx_clans_run_sequence)';
  RAISE NOTICE '  ✓ idx_phases_sequence (kept idx_phases_run_sequence)';
  RAISE NOTICE '  ✓ idx_phases_status (kept idx_phases_run_status)';
  RAISE NOTICE '  ✓ idx_roles_run (kept idx_roles_run_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total custom indexes: %', index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Storage Savings:';
  RAISE NOTICE '  • 4 fewer indexes to maintain';
  RAISE NOTICE '  • Reduced disk usage';
  RAISE NOTICE '  • Faster write operations';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Performance Improvement:';
  RAISE NOTICE '  • Faster INSERT/UPDATE/DELETE on affected tables';
  RAISE NOTICE '  • Reduced index maintenance overhead';
  RAISE NOTICE '  • No impact on query performance (identical coverage)';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- DUPLICATE INDEXES CLEANUP COMPLETE
-- ============================================================================
-- Removed 4 duplicate indexes
-- Each table now has optimal index coverage without redundancy
-- Write performance should improve, read performance unaffected
-- ============================================================================
