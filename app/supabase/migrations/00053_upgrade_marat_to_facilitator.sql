-- ============================================================================
-- Migration: 00053_upgrade_marat_to_facilitator.sql
-- Description: Upgrade marat@marat.mar account to facilitator role
-- Purpose: Fix current user's account so they can use facilitator features
-- ============================================================================
-- Date: 2025-10-28
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPGRADING marat@marat.mar TO FACILITATOR';
  RAISE NOTICE '========================================';
END $$;

-- Upgrade marat@marat.mar to facilitator
-- The trigger will automatically set is_facilitator = true
UPDATE users
SET role = 'facilitator'
WHERE email = 'marat@marat.mar';

-- Verify the update
DO $$
DECLARE
  user_role TEXT;
  is_fac BOOLEAN;
BEGIN
  SELECT role, is_facilitator INTO user_role, is_fac
  FROM users
  WHERE email = 'marat@marat.mar';

  RAISE NOTICE '';
  RAISE NOTICE 'Verification:';
  RAISE NOTICE '  Email: marat@marat.mar';
  RAISE NOTICE '  Role: %', user_role;
  RAISE NOTICE '  is_facilitator: %', is_fac;

  IF user_role = 'facilitator' AND is_fac = true THEN
    RAISE NOTICE '  ✅ Successfully upgraded to facilitator!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You must LOG OUT and LOG BACK IN for the change to take effect!';
  ELSE
    RAISE WARNING '  ❌ Upgrade failed - please check user exists';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- UPGRADE COMPLETE
-- ============================================================================
-- The user marat@marat.mar is now a facilitator
-- NEXT STEP: User must log out and log back in to refresh their session
-- ============================================================================
