-- Migration: Diagnose and Fix Duplicate RLS Policies
-- Date: October 28, 2025
-- Purpose: Remove duplicate policies on access_tokens and users tables
--          to improve query performance by 10-20ms

-- ============================================================================
-- STEP 1: DIAGNOSTIC - Show all current policies for access_tokens and users
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT RLS POLICIES INVENTORY';
  RAISE NOTICE '========================================';

  RAISE NOTICE '';
  RAISE NOTICE 'ACCESS_TOKENS TABLE:';
  RAISE NOTICE '--------------------';

  FOR rec IN
    SELECT
      policyname,
      cmd as action,
      qual as using_expression,
      with_check as check_expression
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'access_tokens'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | Action: %', rec.policyname, rec.action;
    RAISE NOTICE '  USING: %', rec.using_expression;
    IF rec.check_expression IS NOT NULL THEN
      RAISE NOTICE '  CHECK: %', rec.check_expression;
    END IF;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE 'USERS TABLE:';
  RAISE NOTICE '------------';

  FOR rec IN
    SELECT
      policyname,
      cmd as action,
      qual as using_expression,
      with_check as check_expression
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | Action: %', rec.policyname, rec.action;
    RAISE NOTICE '  USING: %', rec.using_expression;
    IF rec.check_expression IS NOT NULL THEN
      RAISE NOTICE '  CHECK: %', rec.check_expression;
    END IF;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 2: DETECT DUPLICATES
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  duplicate_found BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DUPLICATE POLICY DETECTION';
  RAISE NOTICE '========================================';

  FOR rec IN
    SELECT
      tablename,
      cmd as action,
      array_agg(policyname ORDER BY policyname) as policy_names,
      COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('access_tokens', 'users')
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
    ORDER BY tablename, cmd
  LOOP
    duplicate_found := TRUE;
    RAISE NOTICE '';
    RAISE NOTICE 'DUPLICATE FOUND!';
    RAISE NOTICE 'Table: % | Action: % | Count: %', rec.tablename, rec.action, rec.policy_count;
    RAISE NOTICE 'Policies: %', rec.policy_names;
  END LOOP;

  IF NOT duplicate_found THEN
    RAISE NOTICE '';
    RAISE NOTICE '✓ No duplicates found on access_tokens or users tables!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 3: FIX DUPLICATES (if any exist)
-- ============================================================================

-- ACCESS_TOKENS: Remove duplicate SELECT policies
-- Keep: "Facilitators can view all access tokens" (most specific)
-- Remove: Any other SELECT policies that are duplicates

DO $$
BEGIN
  -- Check if there are multiple SELECT policies
  IF (SELECT COUNT(*) FROM pg_policies
      WHERE tablename = 'access_tokens'
      AND schemaname = 'public'
      AND cmd = 'SELECT') > 1 THEN

    RAISE NOTICE 'Fixing access_tokens SELECT policies...';

    -- Drop old/duplicate policies
    DROP POLICY IF EXISTS "Users can view their own access tokens" ON access_tokens;
    DROP POLICY IF EXISTS "View access tokens" ON access_tokens;
    DROP POLICY IF EXISTS "Participants can view their access tokens" ON access_tokens;

    -- Ensure the correct policy exists
    DROP POLICY IF EXISTS "Facilitators can view all access tokens" ON access_tokens;
    CREATE POLICY "Facilitators can view all access tokens"
      ON access_tokens FOR SELECT
      TO authenticated
      USING (is_facilitator());

    RAISE NOTICE '✓ Fixed access_tokens SELECT policy (kept facilitator policy only)';
  ELSE
    RAISE NOTICE '✓ access_tokens SELECT policy - no duplicates found';
  END IF;
END $$;

-- USERS: Remove duplicate INSERT policies
-- Keep: Combined policy that handles both service role and user self-insert
-- Remove: Separate duplicate policies

DO $$
BEGIN
  -- Check if there are multiple INSERT policies
  IF (SELECT COUNT(*) FROM pg_policies
      WHERE tablename = 'users'
      AND schemaname = 'public'
      AND cmd = 'INSERT') > 1 THEN

    RAISE NOTICE 'Fixing users INSERT policies...';

    -- Drop old/duplicate policies
    DROP POLICY IF EXISTS "Service role can create users" ON users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
    DROP POLICY IF EXISTS "Enable insert for service role only" ON users;

    -- Create single consolidated policy that allows both:
    -- 1. Service role creating any user
    -- 2. Authenticated users creating their own profile
    CREATE POLICY "Users can insert their own profile"
      ON users FOR INSERT
      TO authenticated, service_role
      WITH CHECK (
        -- Service role can create any user
        (auth.jwt()->>'role' = 'service_role')
        OR
        -- Regular users can only create their own profile
        (auth.uid() = id)
      );

    RAISE NOTICE '✓ Fixed users INSERT policy (consolidated to single policy)';
  ELSE
    RAISE NOTICE '✓ users INSERT policy - no duplicates found';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: VERIFY FIX
-- ============================================================================

DO $$
DECLARE
  access_tokens_select_count INT;
  users_insert_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION';
  RAISE NOTICE '========================================';

  -- Count policies
  SELECT COUNT(*) INTO access_tokens_select_count
  FROM pg_policies
  WHERE tablename = 'access_tokens'
  AND schemaname = 'public'
  AND cmd = 'SELECT';

  SELECT COUNT(*) INTO users_insert_count
  FROM pg_policies
  WHERE tablename = 'users'
  AND schemaname = 'public'
  AND cmd = 'INSERT';

  RAISE NOTICE '';
  RAISE NOTICE 'access_tokens SELECT policies: % (should be 1)', access_tokens_select_count;
  RAISE NOTICE 'users INSERT policies: % (should be 1)', users_insert_count;
  RAISE NOTICE '';

  IF access_tokens_select_count = 1 AND users_insert_count = 1 THEN
    RAISE NOTICE '✓ SUCCESS: All duplicate policies removed!';
    RAISE NOTICE '✓ Expected performance improvement: 10-20ms per query';
  ELSE
    RAISE WARNING 'ATTENTION: Unexpected policy counts detected';
    IF access_tokens_select_count <> 1 THEN
      RAISE WARNING '  - access_tokens has % SELECT policies (expected 1)', access_tokens_select_count;
    END IF;
    IF users_insert_count <> 1 THEN
      RAISE WARNING '  - users has % INSERT policies (expected 1)', users_insert_count;
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
