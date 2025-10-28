-- ============================================================================
-- Migration: 00052_fix_user_facilitator_roles.sql
-- Description: Manual repair for users who should be facilitators
-- Purpose: Fix any users who registered as facilitators but got role=participant
-- ============================================================================
-- Date: 2025-10-28
-- Issue: Some facilitators may have been created with wrong role
-- Solution: Update specific users to have facilitator role
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REPAIRING FACILITATOR ROLES';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIX 1: UPDATE USERS BY EMAIL (SAFEST METHOD)
-- ============================================================================

-- FIX: Upgrade marat@marat.mar to facilitator
UPDATE users
SET role = 'facilitator',
    is_facilitator = true
WHERE email = 'marat@marat.mar'
AND role != 'facilitator';

-- Alternative: Fix by user ID if you know it
-- UPDATE users
-- SET role = 'facilitator',
--     is_facilitator = true
-- WHERE id = 'your-user-uuid-here'
-- AND role != 'facilitator';

-- ============================================================================
-- FIX 2: SHOW ALL USERS FOR MANUAL INSPECTION
-- ============================================================================

-- List all users with their current roles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Current users in system:';
  RAISE NOTICE '';

  FOR user_record IN
    SELECT
      id,
      email,
      display_name,
      role,
      is_facilitator,
      status
    FROM users
    ORDER BY created_at
  LOOP
    RAISE NOTICE '  Email: %', user_record.email;
    RAISE NOTICE '  Display Name: %', COALESCE(user_record.display_name, '(none)');
    RAISE NOTICE '  Role: %', user_record.role;
    RAISE NOTICE '  is_facilitator: %', user_record.is_facilitator;
    RAISE NOTICE '  Status: %', user_record.status;
    RAISE NOTICE '  ID: %', user_record.id;

    IF user_record.role != 'facilitator' AND user_record.is_facilitator = false THEN
      RAISE NOTICE '  ⚠️  This user is a PARTICIPANT';
    ELSE
      RAISE NOTICE '  ✓ This user is a FACILITATOR';
    END IF;

    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TO FIX A USER:';
  RAISE NOTICE '1. Find your email in the list above';
  RAISE NOTICE '2. Edit this migration file (00052_fix_user_facilitator_roles.sql)';
  RAISE NOTICE '3. Uncomment the UPDATE statement and add your email';
  RAISE NOTICE '4. Run: supabase db push';
  RAISE NOTICE '';
  RAISE NOTICE 'Example:';
  RAISE NOTICE '  UPDATE users';
  RAISE NOTICE '  SET role = ''facilitator'', is_facilitator = true';
  RAISE NOTICE '  WHERE email = ''your.email@example.com'';';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- USER ROLE REPAIR COMPLETE
-- ============================================================================
-- This migration displays all users and provides a template to fix roles
-- Uncomment and customize the UPDATE statement above to fix specific users
-- ============================================================================
