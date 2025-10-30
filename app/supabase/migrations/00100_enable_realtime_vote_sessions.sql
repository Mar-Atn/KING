-- Enable Realtime for vote_sessions table
-- This allows participants to see vote updates immediately when facilitator starts voting

ALTER PUBLICATION supabase_realtime ADD TABLE vote_sessions;

COMMENT ON TABLE vote_sessions IS 'Vote sessions table with realtime enabled for instant participant updates';
