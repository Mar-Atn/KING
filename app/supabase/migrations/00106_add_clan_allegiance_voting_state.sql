-- Add clan allegiance voting state tracking
-- This allows admin to control when voting begins (similar to vote_sessions.started_at pattern)

ALTER TABLE sim_runs
ADD COLUMN clan_allegiance_voting_started_at TIMESTAMPTZ;

COMMENT ON COLUMN sim_runs.clan_allegiance_voting_started_at IS
'Timestamp when clan allegiance voting was started by facilitator. NULL = voting not started yet.';
