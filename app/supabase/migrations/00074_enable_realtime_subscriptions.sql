-- ============================================================================
-- Enable Supabase Realtime for Phase Synchronization
-- ============================================================================
--
-- This migration enables real-time subscriptions on sim_runs and phases tables
-- to allow participants to see phase changes instantly without refreshing.
--
-- When facilitator advances to next phase:
-- 1. sim_runs.current_phase_id updates → participants see new phase instantly
-- 2. phases.status updates → participants see phase status changes instantly
--
-- Without this, participants would need to manually refresh the page.

-- Enable realtime on sim_runs table
-- Participants subscribe to current_phase_id changes
ALTER PUBLICATION supabase_realtime ADD TABLE sim_runs;

-- Enable realtime on phases table
-- Participants subscribe to phase status/timing updates
ALTER PUBLICATION supabase_realtime ADD TABLE phases;

-- Note: The client-side subscriptions are already implemented in:
-- - src/pages/ParticipantDashboard.tsx (lines 160-231)
-- - src/hooks/usePhaseSync.ts (lines 28-75)
--
-- This migration simply enables the server-side broadcasting of changes.
