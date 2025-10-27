-- ============================================================================
-- Migration: 00037_fix_users_select_policy.sql
-- Description: Fix users SELECT policy to replace broken is_facilitator()
-- Purpose: Allow users to log in and load their profiles
-- ============================================================================
-- Date: 2025-10-27
-- Issue: users table SELECT policy uses broken is_facilitator() function
-- Root Cause: is_facilitator() doesn't work in RLS context (see 00030, 00033)
-- Symptom: Users can't log in - profile query hangs or returns nothing
-- Solution: Replace is_facilitator() with inline role check
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING CRITICAL LOGIN ISSUE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Problem: users table SELECT policy uses broken is_facilitator()';
  RAISE NOTICE 'Impact: Users cannot log in - profile loading fails';
  RAISE NOTICE 'Solution: Inline the facilitator check';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIX USERS SELECT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON users;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR
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
  RAISE NOTICE '✅ USERS SELECT POLICY FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  ✅ Log in successfully';
  RAISE NOTICE '  ✅ Load their own profile';
  RAISE NOTICE '  ✅ Facilitators can view all user profiles';
  RAISE NOTICE '  ✅ Participants can only view their own profile';
  RAISE NOTICE '========================================';
END $$;
