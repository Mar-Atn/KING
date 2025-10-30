-- ============================================================================
-- Enable Supabase Realtime for King's Decisions and Vote Results
-- ============================================================================
--
-- This migration enables real-time subscriptions on king_decisions and
-- vote_results tables to allow instant updates without refreshing.
--
-- When King submits decisions:
-- - king_decisions updates → Admin sees submission instantly
--
-- When Vote 2 is announced:
-- - vote_results updates → Elected King detects status instantly
-- - King decision form appears automatically
--
-- When admin reveals decisions:
-- - king_decisions.revealed updates → Participants see reveal instantly
--
-- Without this, users would need to manually refresh the page.

-- Enable realtime on king_decisions table
-- Admin subscribes to see King's submissions
-- Participants subscribe to see reveals
ALTER PUBLICATION supabase_realtime ADD TABLE king_decisions;

-- Enable realtime on vote_results table
-- Participants subscribe to detect when they become King
ALTER PUBLICATION supabase_realtime ADD TABLE vote_results;

-- Note: The client-side subscriptions are already implemented in:
-- - src/components/decisions/KingDecisionReview.tsx (lines 26-41)
-- - src/pages/ParticipantDashboard.tsx (lines 648-662, 677-705)
--
-- This migration simply enables the server-side broadcasting of changes.
