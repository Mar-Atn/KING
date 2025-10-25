-- ============================================================================
-- Migration: 00003_init_voting_tables.sql
-- Description: Create voting system tables
-- Tables: vote_sessions, vote_results, votes
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- TABLE: vote_sessions (Voting Configurations)
-- ============================================================================
-- Purpose: Define voting sessions with configuration and rules
-- Key Design: Supports multiple vote types with transparency controls
-- ============================================================================

CREATE TABLE vote_sessions (
  -- Identity
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id) ON DELETE CASCADE,

  -- Type & Structure
  vote_type TEXT NOT NULL CHECK (vote_type IN (
    'clan_nomination',      -- Clan selects 1 person to nominate (choose from clan members)
    'election_round',       -- All vote for King (choose from candidates)
    'clan_oath',            -- Oath of allegiance (yes/no/abstain)
    'clan_action',          -- Action against King (yes/no/abstain)
    'facilitator_proposal'  -- Ad-hoc proposal created by facilitator (yes/no/abstain)
  )),

  -- Format
  vote_format TEXT NOT NULL CHECK (vote_format IN (
    'choose_person',  -- Select one role_id (clan_nomination, election_round)
    'yes_no'          -- Binary choice (oath, action, facilitator_proposal)
  )),

  -- Scope (who can vote)
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN (
    'all',          -- Everyone votes (elections)
    'clan_only'     -- Only specific clan votes (nominations, oath, action)
  )),
  scope_clan_id UUID REFERENCES clans(clan_id) ON DELETE CASCADE, -- Required if scope='clan_only'

  -- Options (for choose_person votes)
  eligible_candidates JSONB, -- Array of role_ids that can be chosen
  -- Example: ["role-uuid-1", "role-uuid-2", "role-uuid-3"]

  -- Proposal Details (for facilitator_proposal)
  proposal_title TEXT, -- "Should we extend the consultation phase?"
  proposal_description TEXT, -- Full explanation

  -- Transparency & Results Reveal
  transparency_level TEXT NOT NULL DEFAULT 'open' CHECK (transparency_level IN (
    'open',      -- Show individual votes (who voted for whom)
    'anonymous', -- Show only tallies (vote counts and percentages)
    'secret'     -- Results hidden until facilitator announces
  )),

  reveal_timing TEXT NOT NULL DEFAULT 'after_all_votes' CHECK (reveal_timing IN (
    'immediate',        -- Results shown as votes come in
    'after_all_votes',  -- Results shown after all votes cast (default)
    'facilitator_manual' -- Facilitator controls when to reveal
  )),

  -- Animation Settings (for dramatic vote counting)
  animation_speed TEXT NOT NULL DEFAULT 'normal' CHECK (animation_speed IN (
    'slow',    -- 1.2 seconds per ballot
    'normal',  -- 0.8 seconds per ballot (default)
    'fast',    -- 0.4 seconds per ballot
    'instant'  -- No animation, show results immediately
  )),
  allow_skip_animation BOOLEAN NOT NULL DEFAULT FALSE, -- Let participants skip animation

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',       -- Currently accepting votes
    'closed',     -- Voting ended
    'announced'   -- Results announced to participants
  )),

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  announced_at TIMESTAMPTZ,

  -- Validation constraints
  CHECK (closed_at IS NULL OR closed_at >= created_at),
  CHECK (announced_at IS NULL OR announced_at >= created_at),
  CHECK (
    -- If scope is clan_only, scope_clan_id must be set
    (scope = 'clan_only' AND scope_clan_id IS NOT NULL) OR
    (scope = 'all' AND scope_clan_id IS NULL)
  ),
  CHECK (
    -- If vote_format is choose_person, eligible_candidates should be set
    (vote_format = 'choose_person' AND eligible_candidates IS NOT NULL) OR
    (vote_format = 'yes_no')
  )
);

-- Indexes for vote_sessions
CREATE INDEX idx_vote_sessions_run ON vote_sessions(run_id);
CREATE INDEX idx_vote_sessions_phase ON vote_sessions(phase_id);
CREATE INDEX idx_vote_sessions_status ON vote_sessions(status);
CREATE INDEX idx_vote_sessions_clan ON vote_sessions(scope_clan_id) WHERE scope = 'clan_only';
CREATE INDEX idx_vote_sessions_type ON vote_sessions(vote_type);

-- Comments
COMMENT ON TABLE vote_sessions IS 'Voting session definitions with configuration and transparency controls';
COMMENT ON COLUMN vote_sessions.vote_type IS 'Type of vote: nomination, election, oath, action, or custom proposal';
COMMENT ON COLUMN vote_sessions.vote_format IS 'Format: choose_person (select role) or yes_no (binary choice)';
COMMENT ON COLUMN vote_sessions.scope IS 'Who can vote: all participants or clan_only';
COMMENT ON COLUMN vote_sessions.transparency_level IS 'Transparency: open (show all), anonymous (tallies only), secret (hidden until announced)';
COMMENT ON COLUMN vote_sessions.reveal_timing IS 'When to show results: immediate, after_all_votes, or facilitator_manual';
COMMENT ON COLUMN vote_sessions.animation_speed IS 'Vote counting animation speed for dramatic effect';

-- ============================================================================
-- TABLE: vote_results (Calculated Results)
-- ============================================================================
-- Purpose: Store calculated tallies and winners
-- Key Design: Separate from individual votes, tracks announcement
-- ============================================================================

CREATE TABLE vote_results (
  -- Identity
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id) ON DELETE CASCADE,

  -- Results Data
  results_data JSONB NOT NULL,
  -- Format for 'choose_person' votes:
  -- {
  --   "winner": {"role_id": "...", "name": "Marcus", "vote_count": 6, "percentage": 40},
  --   "all_candidates": [
  --     {"role_id": "...", "name": "Marcus", "vote_count": 6, "percentage": 40},
  --     {"role_id": "...", "name": "Dimitri", "vote_count": 5, "percentage": 33},
  --     {"role_id": "...", "name": "Sofia", "vote_count": 4, "percentage": 27}
  --   ],
  --   "total_votes": 15,
  --   "tie": false
  -- }

  -- Format for 'yes_no' votes:
  -- {
  --   "yes": 8, "no": 5, "abstain": 2,
  --   "total": 15,
  --   "yes_percentage": 53.3,
  --   "no_percentage": 33.3,
  --   "abstain_percentage": 13.3,
  --   "passed": true
  -- }

  -- Timeline
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  announced_at TIMESTAMPTZ, -- When results were revealed to participants

  -- Animation
  animation_shown BOOLEAN NOT NULL DEFAULT TRUE,
  animation_duration_seconds INTEGER CHECK (animation_duration_seconds > 0), -- Actual time animation took

  -- Audit
  calculated_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Facilitator who triggered calculation

  -- Validation constraints
  CHECK (announced_at IS NULL OR announced_at >= calculated_at),

  -- Constraint: one result record per session
  UNIQUE(session_id)
);

-- Indexes for vote_results
CREATE INDEX idx_vote_results_session ON vote_results(session_id);
CREATE INDEX idx_vote_results_calculated ON vote_results(calculated_at DESC);
CREATE INDEX idx_vote_results_announced ON vote_results(announced_at DESC);

-- GIN index for results_data queries
CREATE INDEX idx_vote_results_data ON vote_results USING GIN (results_data);

-- Comments
COMMENT ON TABLE vote_results IS 'Calculated vote tallies and winners - one per session';
COMMENT ON COLUMN vote_results.results_data IS 'JSONB containing winner, tallies, percentages - flexible structure';
COMMENT ON COLUMN vote_results.calculated_at IS 'When results were calculated';
COMMENT ON COLUMN vote_results.announced_at IS 'When results were revealed to participants (may differ from calculation)';
COMMENT ON COLUMN vote_results.animation_shown IS 'Whether dramatic vote counting animation was shown';

-- ============================================================================
-- TABLE: votes (Individual Vote Records)
-- ============================================================================
-- Purpose: Store individual vote choices
-- Key Design: One vote per participant per session, flexible format
-- ============================================================================

CREATE TABLE votes (
  -- Identity
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id) ON DELETE CASCADE,

  -- Voter
  voter_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  voter_clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,

  -- Choice (one of these will be set based on vote_format)

  -- For 'choose_person' format:
  chosen_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL, -- The person they voted for

  -- For 'yes_no' format:
  yes_no_choice TEXT CHECK (yes_no_choice IN ('yes', 'no', 'abstain')),

  -- Timing
  cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CHECK (
    -- Exactly one choice must be set
    (chosen_role_id IS NOT NULL AND yes_no_choice IS NULL) OR
    (chosen_role_id IS NULL AND yes_no_choice IS NOT NULL)
  ),

  -- Uniqueness: one vote per session per voter
  UNIQUE(session_id, voter_role_id)
);

-- Indexes for votes
CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_votes_voter ON votes(voter_role_id);
CREATE INDEX idx_votes_chosen ON votes(chosen_role_id);
CREATE INDEX idx_votes_choice ON votes(yes_no_choice) WHERE yes_no_choice IS NOT NULL;
CREATE INDEX idx_votes_cast ON votes(cast_at DESC);

-- Comments
COMMENT ON TABLE votes IS 'Individual vote records - one per participant per session';
COMMENT ON COLUMN votes.chosen_role_id IS 'For choose_person format - the role_id they voted for';
COMMENT ON COLUMN votes.yes_no_choice IS 'For yes_no format - their choice (yes/no/abstain)';
COMMENT ON COLUMN votes.voter_clan_id IS 'Voter clan for efficient filtering and analytics';

-- ============================================================================
-- VOTING TABLES MIGRATION COMPLETE
-- ============================================================================
-- Tables created: vote_sessions, vote_results, votes
-- Next migration: AI & meta tables (ai_context, ai_prompts, king_decisions, reflections)
-- ============================================================================
