-- Add confirmed_runoff_candidates column to vote_results table
-- This stores the final list of candidates confirmed by admin to advance to next round

ALTER TABLE vote_results
ADD COLUMN IF NOT EXISTS confirmed_runoff_candidates TEXT[];

COMMENT ON COLUMN vote_results.confirmed_runoff_candidates IS 'Array of role_ids for candidates confirmed to advance to the next voting round';
