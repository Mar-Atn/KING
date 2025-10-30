-- ============================================================================
-- Clan Allegiance Votes Table
-- ============================================================================
--
-- Stores final clan votes on:
-- 1. Oath of Allegiance to the King
-- 2. Whether to initiate actions against the King ("If things go wrong")
--
-- Each clan votes as a collective (one vote per clan per simulation)

CREATE TABLE clan_votes (
  -- Identity
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,

  -- Votes (NULL until voted)
  oath_of_allegiance BOOLEAN, -- TRUE = pledge allegiance, FALSE = refuse
  initiate_actions BOOLEAN,    -- TRUE = vote to act against King, FALSE = no action

  -- Metadata
  voted_at TIMESTAMPTZ,
  revealed BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One vote per clan per simulation
  UNIQUE(run_id, clan_id)
);

-- Indexes
CREATE INDEX idx_clan_votes_run ON clan_votes(run_id);
CREATE INDEX idx_clan_votes_clan ON clan_votes(clan_id);
CREATE INDEX idx_clan_votes_revealed ON clan_votes(run_id, revealed);

-- RLS Policies
ALTER TABLE clan_votes ENABLE ROW LEVEL SECURITY;

-- Facilitators can do everything
CREATE POLICY "Facilitators can manage clan votes"
  ON clan_votes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sim_runs
      WHERE sim_runs.run_id = clan_votes.run_id
        AND sim_runs.facilitator_id = auth.uid()
    )
  );

-- Participants can view their own clan's vote
CREATE POLICY "Participants can view their clan's vote"
  ON clan_votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.clan_id = clan_votes.clan_id
        AND roles.assigned_user_id = auth.uid()
    )
  );

-- Participants can insert/update their clan's vote
CREATE POLICY "Participants can vote for their clan"
  ON clan_votes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.clan_id = clan_votes.clan_id
        AND roles.assigned_user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE clan_votes;

COMMENT ON TABLE clan_votes IS 'Final clan votes on allegiance to King and potential rebellion';
COMMENT ON COLUMN clan_votes.oath_of_allegiance IS 'TRUE = pledge allegiance, FALSE = refuse';
COMMENT ON COLUMN clan_votes.initiate_actions IS 'TRUE = vote to act against King, FALSE = no action';
