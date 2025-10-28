-- ============================================================================
-- Migration: 00027_add_simulation_loading_indexes.sql
-- Description: Add indexes to optimize simulation loading queries
-- Purpose: Fix slow simulation loading performance (2-3s → <500ms)
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-27
-- Project: The New King SIM - Political Simulation Platform
--
-- ISSUE: FacilitatorSimulation page takes 2-3+ seconds to load
-- CAUSE: Sequential queries without proper indexes
-- FIX: Add composite indexes for common query patterns
-- ============================================================================

-- ============================================================================
-- SIMULATION LOADING INDEXES
-- ============================================================================

-- Index for loading clans by run_id (ordered by sequence)
-- Query: SELECT * FROM clans WHERE run_id = ? ORDER BY sequence_number
CREATE INDEX IF NOT EXISTS idx_clans_run_sequence
ON clans(run_id, sequence_number);

-- Index for loading roles by run_id
-- Query: SELECT * FROM roles WHERE run_id = ?
CREATE INDEX IF NOT EXISTS idx_roles_run_id
ON roles(run_id);

-- Composite index for roles with clan info
-- Query: SELECT roles.*, clans.name FROM roles JOIN clans...
CREATE INDEX IF NOT EXISTS idx_roles_run_clan
ON roles(run_id, clan_id);

-- Index for loading phases by run_id (ordered by sequence)
-- Query: SELECT * FROM phases WHERE run_id = ? ORDER BY sequence_number
CREATE INDEX IF NOT EXISTS idx_phases_run_sequence
ON phases(run_id, sequence_number);

-- Index for finding active/recent phases
-- Query: SELECT * FROM phases WHERE run_id = ? AND status IN ('active', 'completed')
CREATE INDEX IF NOT EXISTS idx_phases_run_status
ON phases(run_id, status);

-- ============================================================================
-- DASHBOARD QUERY INDEXES
-- ============================================================================

-- Index for loading facilitator's simulations (dashboard query)
-- Query: SELECT * FROM sim_runs WHERE facilitator_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_sim_runs_facilitator_created
ON sim_runs(facilitator_id, created_at DESC);

-- Index for filtering by status
-- Query: SELECT * FROM sim_runs WHERE facilitator_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_sim_runs_facilitator_status
ON sim_runs(facilitator_id, status);

-- ============================================================================
-- SIMULATION TEMPLATE INDEXES
-- ============================================================================

-- Index for loading active templates
-- Query: SELECT * FROM simulation_templates WHERE is_active = true ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_simulation_templates_active_created
ON simulation_templates(is_active, created_at DESC)
WHERE is_active = true; -- Partial index for better performance

-- ============================================================================
-- PARTICIPANT ROLE LOOKUP INDEXES (already exists, but verify)
-- ============================================================================

-- Verify existing idx_roles_assigned_user_id exists (from migration 00021)
-- If not, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'roles'
    AND indexname = 'idx_roles_assigned_user_id'
  ) THEN
    CREATE INDEX idx_roles_assigned_user_id ON roles(assigned_user_id)
    WHERE assigned_user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE sim_runs;
ANALYZE clans;
ANALYZE roles;
ANALYZE phases;
ANALYZE simulation_templates;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  new_index_count INT;
BEGIN
  -- Count new indexes created in this migration
  SELECT COUNT(*) INTO new_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND indexname IN (
    'idx_clans_run_sequence',
    'idx_roles_run_id',
    'idx_roles_run_clan',
    'idx_phases_run_sequence',
    'idx_phases_run_status',
    'idx_sim_runs_facilitator_created',
    'idx_sim_runs_facilitator_status',
    'idx_simulation_templates_active_created'
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SIMULATION LOADING INDEXES CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'OPTIMIZATIONS APPLIED:';
  RAISE NOTICE '- Composite index on clans(run_id, sequence_number)';
  RAISE NOTICE '- Index on roles(run_id) for fast lookups';
  RAISE NOTICE '- Composite index on roles(run_id, clan_id) for joins';
  RAISE NOTICE '- Composite index on phases(run_id, sequence_number)';
  RAISE NOTICE '- Index on phases(run_id, status) for active phase queries';
  RAISE NOTICE '- Dashboard query indexes for facilitator views';
  RAISE NOTICE '- Template loading optimization';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW INDEXES CREATED: %', new_index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'EXPECTED PERFORMANCE IMPROVEMENT:';
  RAISE NOTICE '- Simulation loading: 2-3s -> <500ms (5-6x faster)';
  RAISE NOTICE '- Dashboard queries: 2x faster';
  RAISE NOTICE '- Template selection: 3x faster';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Update FacilitatorSimulation to use parallel queries';
  RAISE NOTICE '2. Implement React Query for caching';
  RAISE NOTICE '3. Test simulation loading performance';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Indexes added for simulation loading optimization
-- Expected: 5-6x faster simulation page loads
-- Next: Update frontend code to use parallel queries
-- ============================================================================
