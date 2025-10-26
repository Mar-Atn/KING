-- ============================================================================
-- Migration: 00011_add_voting_thresholds.sql
-- Description: Add voting threshold configuration for Vote 1 and Vote 2
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- Add voting threshold fields to sim_runs table
ALTER TABLE sim_runs
ADD COLUMN vote_1_threshold INTEGER,
ADD COLUMN vote_2_threshold INTEGER;

-- Add comments
COMMENT ON COLUMN sim_runs.vote_1_threshold IS 'Number of votes required for Vote 1 (First Election Round). If NULL, defaults to 2/3 of total_participants.';
COMMENT ON COLUMN sim_runs.vote_2_threshold IS 'Number of votes required for Vote 2 (Second Election Round). If NULL, defaults to 2/3 of total_participants.';

-- Add check constraints to ensure thresholds are reasonable
ALTER TABLE sim_runs
ADD CONSTRAINT check_vote_1_threshold CHECK (
  vote_1_threshold IS NULL OR
  (vote_1_threshold > 0 AND vote_1_threshold <= total_participants)
);

ALTER TABLE sim_runs
ADD CONSTRAINT check_vote_2_threshold CHECK (
  vote_2_threshold IS NULL OR
  (vote_2_threshold > 0 AND vote_2_threshold <= total_participants)
);
