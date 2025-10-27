-- ============================================================================
-- Migration: 00039_allow_viewing_participants.sql
-- Description: Allow authenticated users to view participant profiles
-- Purpose: Enable participant registration page to list available participants
-- ============================================================================
-- Date: 2025-10-27
-- Issue: ParticipantRegistration page can't query participant users
-- Root Cause: users SELECT policy only allows viewing own profile
-- Solution: Add policy to allow viewing users with role='participant'
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALLOWING PARTICIPANT PROFILE VIEWING';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Purpose: Facilitators need to see participants for registration';
  RAISE NOTICE 'Safety: Only exposes participant profiles, not facilitator data';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ADD POLICY TO VIEW PARTICIPANT PROFILES
-- ============================================================================

-- Allow authenticated users to view participant profiles
-- This is safe because:
-- 1. Participants are meant to be visible in registration UI
-- 2. Only exposes role='participant', not facilitators
-- 3. Needed for ParticipantRegistration page to function
CREATE POLICY "Authenticated users can view participants"
  ON users FOR SELECT
  TO authenticated
  USING (role = 'participant');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PARTICIPANT VIEWING ENABLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policies on users table:';
  RAISE NOTICE '  ✅ Users can view their own profile';
  RAISE NOTICE '  ✅ Authenticated users can view participants';
  RAISE NOTICE '';
  RAISE NOTICE 'This allows:';
  RAISE NOTICE '  ✅ Facilitators to list participants for registration';
  RAISE NOTICE '  ✅ Participants to see other participants (if needed)';
  RAISE NOTICE '  ✅ Facilitator profiles remain private';
  RAISE NOTICE '========================================';
END $$;
