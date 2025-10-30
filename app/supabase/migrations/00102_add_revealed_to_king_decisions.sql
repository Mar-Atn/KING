-- Add revealed column to king_decisions table
-- This tracks whether admin has announced the decisions to all participants

ALTER TABLE king_decisions
ADD COLUMN IF NOT EXISTS revealed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN king_decisions.revealed IS 'Whether admin has revealed these decisions to all participants';

-- Index for quickly finding revealed decisions
CREATE INDEX IF NOT EXISTS idx_king_decisions_revealed ON king_decisions(run_id, revealed);
