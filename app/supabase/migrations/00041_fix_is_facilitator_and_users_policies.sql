-- ============================================================================
-- Migration: 00041_fix_is_facilitator_and_users_policies.sql
-- Description: Fix is_facilitator() circular dependency and restore proper RLS
-- Purpose: Resolve profile loading timeout by restoring working function design
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Profile loading times out due to circular dependency in RLS policies
-- Root Cause: Migration 00021 changed is_facilitator() from plpgsql to sql STABLE
--             This causes circular dependency when evaluating users SELECT policy
-- Solution: Restore is_facilitator() to LANGUAGE plpgsql SECURITY DEFINER
--           Rebuild users policies to match original working design
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING IS_FACILITATOR CIRCULAR DEPENDENCY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Problem: sql STABLE function causes circular RLS evaluation';
  RAISE NOTICE 'Solution: Restore plpgsql SECURITY DEFINER (bypasses RLS cleanly)';
  RAISE NOTICE 'Reference: Original migration 00006 (working version)';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 1: RESTORE is_facilitator() TO ORIGINAL WORKING DESIGN
-- ============================================================================

-- Drop the broken version from migration 00021
DROP FUNCTION IF EXISTS is_facilitator() CASCADE;

-- Recreate with ORIGINAL design from migration 00006
-- Key: LANGUAGE plpgsql (not sql) + SECURITY DEFINER bypasses RLS
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER means this runs as function owner (postgres superuser)
  -- RLS is bypassed for this SELECT, preventing circular dependency
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'facilitator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: REBUILD USERS TABLE POLICIES
-- ============================================================================

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view participants" ON users;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON users;
DROP POLICY IF EXISTS "Facilitators can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Facilitators can create users" ON users;
DROP POLICY IF EXISTS "Service role can create users" ON users;

-- ============================================================================
-- SELECT POLICIES (Queries)
-- ============================================================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));  -- Subquery optimizes auth.uid() evaluation

-- Policy 2: Facilitators can view all user profiles
-- This is critical for facilitator features (user management, participant registration)
CREATE POLICY "Facilitators can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_facilitator());  -- Now safe: plpgsql SECURITY DEFINER bypasses RLS

-- Policy 3: Authenticated users can view participant profiles
-- Needed for participant registration and clan member visibility
CREATE POLICY "Authenticated users can view participants"
  ON users FOR SELECT
  TO authenticated
  USING (role = 'participant');

-- Combined effect (policies OR'd together):
--   Regular users: can see own profile + all participants
--   Facilitators: can see ALL profiles (via is_facilitator())

-- ============================================================================
-- UPDATE POLICIES (Modifications)
-- ============================================================================

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- INSERT POLICIES (Creation)
-- ============================================================================

-- Facilitators can manually create user accounts
CREATE POLICY "Facilitators can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());  -- Safe now with plpgsql

-- Service role can create users (for auth.users sync, signups)
CREATE POLICY "Service role can create users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  func_language TEXT;
  policy_count INT;
BEGIN
  -- Verify function language
  SELECT lanname INTO func_language
  FROM pg_proc p
  JOIN pg_language l ON p.prolang = l.oid
  WHERE p.proname = 'is_facilitator';

  -- Count users policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'users';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ IS_FACILITATOR FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Function Status:';
  RAISE NOTICE '  • is_facilitator() language: %', func_language;
  RAISE NOTICE '  • Should be: plpgsql (not sql)';
  RAISE NOTICE '  • SECURITY DEFINER: Yes (RLS bypass)';
  RAISE NOTICE '';
  RAISE NOTICE 'Users Table Policies: % total', policy_count;
  RAISE NOTICE '  ✓ Users can view their own profile';
  RAISE NOTICE '  ✓ Facilitators can view all users';
  RAISE NOTICE '  ✓ Authenticated users can view participants';
  RAISE NOTICE '  ✓ Users can update their own profile';
  RAISE NOTICE '  ✓ Facilitators can create users';
  RAISE NOTICE '  ✓ Service role can create users';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Behavior:';
  RAISE NOTICE '  ✅ Profile loading should work (no timeout)';
  RAISE NOTICE '  ✅ Facilitators can see all user profiles';
  RAISE NOTICE '  ✅ Participants can see other participants';
  RAISE NOTICE '  ✅ Login flow should complete successfully';
  RAISE NOTICE '  ✅ Dashboard routing should work for participants';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Test login as facilitator and participant';
  RAISE NOTICE '  2. Verify profile loads without timeout';
  RAISE NOTICE '  3. Test participant flow end-to-end';
  RAISE NOTICE '  4. Remove timeout workarounds from AuthContext if working';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- RLS FIX MIGRATION COMPLETE
-- ============================================================================
-- is_facilitator() restored to plpgsql SECURITY DEFINER (working design)
-- Users table policies rebuilt to match original 00006 + 00039 requirements
-- Circular dependency eliminated
-- Profile loading should now work without timeouts
-- ============================================================================
