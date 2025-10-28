-- ============================================================================
-- Migration: 00054_increase_statement_timeout.sql
-- Description: Increase statement timeout for complex simulation creation
-- Purpose: Fix timeout errors when creating simulations with many clans/roles
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Simulation creation times out after default 2 seconds
-- Solution: Increase statement timeout to 60 seconds for complex operations
-- ============================================================================

-- Increase statement timeout for authenticated role (used by RLS)
ALTER ROLE authenticated SET statement_timeout = '60s';

-- Also set for anon role (used by public API)
ALTER ROLE anon SET statement_timeout = '60s';

-- Increase for the current database
ALTER DATABASE postgres SET statement_timeout = '60s';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ STATEMENT TIMEOUT INCREASED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New timeout: 60 seconds (was 2 seconds default)';
  RAISE NOTICE 'Applies to: authenticated, anon, and postgres roles';
  RAISE NOTICE '';
  RAISE NOTICE 'This allows complex simulation creation operations';
  RAISE NOTICE 'to complete without timing out.';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- TIMEOUT INCREASE COMPLETE
-- ============================================================================
-- Statement timeout increased from 2s to 60s
-- This should fix timeout errors during simulation creation
-- ============================================================================
