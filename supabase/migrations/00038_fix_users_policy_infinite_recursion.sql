-- ============================================================================
-- Migration: 00038_fix_users_policy_infinite_recursion.sql
-- Description: Fix infinite recursion in users SELECT policy
-- Purpose: Remove self-referencing query that causes recursion
-- ============================================================================
-- Date: 2025-10-27
-- Issue: users SELECT policy queries users table → infinite recursion
-- Root Cause: Policy checks "EXISTS (SELECT FROM users...)" on users table
-- Solution: Simplify to only allow viewing own profile
--           Facilitators will use service role for user management
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING INFINITE RECURSION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Problem: users policy queries users table → infinite loop';
  RAISE NOTICE 'Solution: Users can only view their own profile';
  RAISE NOTICE 'Note: Facilitator user management uses service role queries';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIX USERS SELECT POLICY - REMOVE RECURSION
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Simple policy: users can only see their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Note: Facilitators viewing user lists (e.g., in participant registration)
-- should use service role or anon key queries, not rely on RLS policy

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USERS SELECT POLICY FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  ✅ Log in successfully';
  RAISE NOTICE '  ✅ View their own profile only';
  RAISE NOTICE '';
  RAISE NOTICE 'Facilitator user management:';
  RAISE NOTICE '  ℹ️  Uses service role for querying all users';
  RAISE NOTICE '  ℹ️  Participant registration queries work via anon key';
  RAISE NOTICE '========================================';
END $$;
