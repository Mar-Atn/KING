-- ============================================================================
-- Migration: 00033_audit_and_fix_all_is_facilitator_policies.sql
-- Description: Comprehensive fix for ALL policies using broken is_facilitator()
-- Purpose: Replace all is_facilitator() calls with direct role checks
-- ============================================================================
-- Date: 2025-10-27
-- Issue: is_facilitator() broken in ALL RLS policies (INSERT/UPDATE/DELETE/SELECT)
-- Root Cause: Migration 00021 changed from plpgsql to LANGUAGE sql STABLE
--             SECURITY DEFINER + auth.uid() don't work in RLS context
-- Solution: Inline the role check directly in ALL policies
-- ============================================================================

-- ============================================================================
-- PART 1: AUDIT - List all policies using is_facilitator()
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
  policy_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDIT: Policies Using is_facilitator()';
  RAISE NOTICE '========================================';

  FOR policy_record IN
    SELECT
      tablename,
      policyname,
      cmd as action
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
      qual::text LIKE '%is_facilitator%'
      OR with_check::text LIKE '%is_facilitator%'
    )
    ORDER BY tablename, cmd
  LOOP
    policy_count := policy_count + 1;
    RAISE NOTICE '% | % | %', policy_record.tablename, policy_record.action, policy_record.policyname;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total policies affected: %', policy_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PART 2: CREATE INLINE HELPER FOR CLEANER POLICIES
-- ============================================================================

-- Note: We can't fix the function itself due to SECURITY DEFINER limitations
-- Instead, we'll use this inline pattern in all policies:
-- EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'facilitator')

DO $$
BEGIN
  RAISE NOTICE 'Inline pattern to use in policies:';
  RAISE NOTICE 'EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = ''facilitator'')';
END $$;

-- ============================================================================
-- PART 3: FIX CRITICAL TABLES (Already done for sim_runs)
-- ============================================================================

-- sim_runs INSERT - Already fixed in 00031
-- sim_runs DELETE - Already fixed in 00032

-- ============================================================================
-- PART 4: FIX REMAINING HIGH-PRIORITY TABLES
-- ============================================================================

-- For SELECT policies: Most use "id = auth.uid() OR is_facilitator()"
-- Pattern: These typically work because auth.uid() check happens first
-- BUT for consistency and to avoid future issues, we should still fix them

-- For INSERT/UPDATE/DELETE policies: CRITICAL - these are broken

-- We need to systematically update:
-- 1. clans (INSERT, UPDATE, DELETE)
-- 2. roles (INSERT, UPDATE, DELETE)
-- 3. phases (INSERT, UPDATE, DELETE)
-- 4. meetings (INSERT, UPDATE, DELETE)
-- 5. votes (INSERT, UPDATE, DELETE)
-- 6. vote_sessions (INSERT, UPDATE, DELETE)
-- 7. public_speeches (INSERT, UPDATE, DELETE)
-- 8. ai_context (INSERT, UPDATE, DELETE)
-- 9. ai_prompts (INSERT, UPDATE, DELETE, SELECT)
-- 10. sim_run_prompts (INSERT, UPDATE, DELETE)
-- 11. event_log (INSERT, UPDATE, DELETE)
-- 12. facilitator_actions (INSERT, UPDATE, DELETE, SELECT)
-- 13. reflections (UPDATE, DELETE)
-- 14. king_decisions (INSERT, UPDATE, DELETE)
-- 15. users (SELECT with OR clause - might work but needs review)

-- Let's start with the most critical ones used by the app

-- ============================================================================
-- CLANS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators insert clans" ON clans;
CREATE POLICY "Facilitators insert clans"
  ON clans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators update clans" ON clans;
CREATE POLICY "Facilitators update clans"
  ON clans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators delete clans" ON clans;
CREATE POLICY "Facilitators delete clans"
  ON clans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

-- ============================================================================
-- ROLES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators insert roles" ON roles;
CREATE POLICY "Facilitators insert roles"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators update roles" ON roles;
CREATE POLICY "Facilitators update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators delete roles" ON roles;
CREATE POLICY "Facilitators delete roles"
  ON roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

-- ============================================================================
-- PHASES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators insert phases" ON phases;
CREATE POLICY "Facilitators insert phases"
  ON phases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators update phases" ON phases;
CREATE POLICY "Facilitators update phases"
  ON phases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators delete phases" ON phases;
CREATE POLICY "Facilitators delete phases"
  ON phases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CRITICAL FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed policies for:';
  RAISE NOTICE '  ✅ sim_runs (INSERT/DELETE) - migrations 00031/00032';
  RAISE NOTICE '  ✅ clans (INSERT/UPDATE/DELETE)';
  RAISE NOTICE '  ✅ roles (INSERT/UPDATE/DELETE)';
  RAISE NOTICE '  ✅ phases (INSERT/UPDATE/DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE 'REMAINING TABLES NEED FIXING:';
  RAISE NOTICE '  ⚠️  meetings, votes, vote_sessions, public_speeches';
  RAISE NOTICE '  ⚠️  ai_context, ai_prompts, sim_run_prompts';
  RAISE NOTICE '  ⚠️  event_log, facilitator_actions';
  RAISE NOTICE '  ⚠️  reflections, king_decisions';
  RAISE NOTICE '';
  RAISE NOTICE 'These will be fixed in follow-up migration 00034';
  RAISE NOTICE '========================================';
END $$;
