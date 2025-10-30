-- Add started_at column to vote_sessions
-- This tracks when voting actually began (when facilitator clicked "Start Voting")
-- Different from created_at (when session was created)

ALTER TABLE vote_sessions
ADD COLUMN started_at TIMESTAMPTZ;

COMMENT ON COLUMN vote_sessions.started_at IS 'When voting was started by facilitator (NULL means created but not started yet)';
