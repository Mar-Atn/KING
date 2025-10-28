-- ============================================================================
-- TEMPORARY: Open ALL remaining tables for testing
-- ============================================================================
-- If this fixes the slow sim loading, we know RLS policies are the issue
-- Then we can identify which specific table was slow
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OPENING ALL TABLES (TEMPORARY)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'This is for testing only!';
  RAISE NOTICE 'We will add proper security after diagnosis';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- CLANS - Currently "clans_open" (should already be open from 00057)
-- ============================================================================
DROP POLICY IF EXISTS "clans_open" ON clans;
DROP POLICY IF EXISTS "Participants can view clans in their runs" ON clans;
DROP POLICY IF EXISTS "Facilitators can manage all clans" ON clans;

CREATE POLICY "clans_test_open"
  ON clans FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- ROLES - Currently "roles_open" (should already be open from 00057)
-- ============================================================================
DROP POLICY IF EXISTS "roles_open" ON roles;
DROP POLICY IF EXISTS "Participants can view roles in their runs" ON roles;
DROP POLICY IF EXISTS "Participants can update their own role" ON roles;
DROP POLICY IF EXISTS "Facilitators can manage all roles" ON roles;

CREATE POLICY "roles_test_open"
  ON roles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASES - Currently "phases_open" (should already be open from 00057)
-- ============================================================================
DROP POLICY IF EXISTS "phases_open" ON phases;
DROP POLICY IF EXISTS "Participants can view phases in their runs" ON phases;
DROP POLICY IF EXISTS "Facilitators can manage all phases" ON phases;

CREATE POLICY "phases_test_open"
  ON phases FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- MEETINGS - Currently "meetings_open" (should already be open from 00057)
-- ============================================================================
DROP POLICY IF EXISTS "meetings_open" ON meetings;
DROP POLICY IF EXISTS "Participants can view their meetings" ON meetings;
DROP POLICY IF EXISTS "Participants can create meetings" ON meetings;
DROP POLICY IF EXISTS "Participants can update their meetings" ON meetings;
DROP POLICY IF EXISTS "Facilitators can manage all meetings" ON meetings;

CREATE POLICY "meetings_test_open"
  ON meetings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- VOTES - Currently "votes_open" (should already be open from 00057)
-- ============================================================================
DROP POLICY IF EXISTS "votes_open" ON votes;
DROP POLICY IF EXISTS "Participants can view their own votes" ON votes;
DROP POLICY IF EXISTS "Participants can cast votes" ON votes;
DROP POLICY IF EXISTS "Facilitators can view all votes" ON votes;

CREATE POLICY "votes_test_open"
  ON votes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- VOTE_SESSIONS - Consolidated in 00057
-- ============================================================================
DROP POLICY IF EXISTS "vote_sessions_open" ON vote_sessions;
DROP POLICY IF EXISTS "Participants can view vote sessions" ON vote_sessions;
DROP POLICY IF EXISTS "Facilitators can manage vote sessions" ON vote_sessions;

CREATE POLICY "vote_sessions_test_open"
  ON vote_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- PUBLIC_SPEECHES - Consolidated in 00057
-- ============================================================================
DROP POLICY IF EXISTS "public_speeches_open" ON public_speeches;
DROP POLICY IF EXISTS "Participants can view public speeches" ON public_speeches;
DROP POLICY IF EXISTS "Facilitators can create speeches" ON public_speeches;
DROP POLICY IF EXISTS "Facilitators can manage all speeches" ON public_speeches;

CREATE POLICY "public_speeches_test_open"
  ON public_speeches FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- MEETING_INVITATIONS - Consolidated in 00061
-- ============================================================================
DROP POLICY IF EXISTS "meeting_invitations_unified" ON meeting_invitations;
DROP POLICY IF EXISTS "Facilitators can manage all invitations" ON meeting_invitations;
DROP POLICY IF EXISTS "Meeting organizers can create invitations" ON meeting_invitations;
DROP POLICY IF EXISTS "Participants can view their invitations" ON meeting_invitations;
DROP POLICY IF EXISTS "Participants can respond to invitations" ON meeting_invitations;

CREATE POLICY "meeting_invitations_test_open"
  ON meeting_invitations FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  total_policies INT;
BEGIN
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL TABLES NOW FULLY OPEN';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total policies: %', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY WARNING: All tables fully open!';
  RAISE NOTICE '   This is for testing only';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST NOW:';
  RAISE NOTICE '  1. Refresh browser';
  RAISE NOTICE '  2. Log in';
  RAISE NOTICE '  3. Load a simulation';
  RAISE NOTICE '  4. Report how long it takes';
  RAISE NOTICE '';
  RAISE NOTICE 'If fast now: RLS was the issue';
  RAISE NOTICE 'If still slow: Issue is elsewhere (network, frontend, etc)';
  RAISE NOTICE '========================================';
END $$;
