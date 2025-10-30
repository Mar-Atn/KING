-- Change clan_votes to store individual role votes instead of clan-level votes
-- This allows tracking which specific roles voted and enables proper aggregation

-- Drop the existing table and recreate with role_id
DROP TABLE IF EXISTS clan_votes CASCADE;

CREATE TABLE clan_votes (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,
  oath_of_allegiance BOOLEAN,  -- TRUE = pledge, FALSE = refuse
  initiate_actions BOOLEAN,     -- TRUE = act against King, FALSE = peace
  voted_at TIMESTAMPTZ,
  revealed BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id, role_id)  -- One vote per role per simulation
);

-- Create index on clan_id for aggregation queries
CREATE INDEX idx_clan_votes_clan_id ON clan_votes(clan_id);
CREATE INDEX idx_clan_votes_run_id ON clan_votes(run_id);

-- RLS Policies
ALTER TABLE clan_votes ENABLE ROW LEVEL SECURITY;

-- Facilitators can do everything
CREATE POLICY "Facilitators have full access to clan votes"
  ON clan_votes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sim_runs
      WHERE sim_runs.run_id = clan_votes.run_id
        AND sim_runs.facilitator_id = auth.uid()
    )
  );

-- Participants can view and vote for their own role
CREATE POLICY "Participants can manage their own votes"
  ON clan_votes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.role_id = clan_votes.role_id
        AND roles.assigned_user_id = auth.uid()
    )
  );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE clan_votes;

COMMENT ON TABLE clan_votes IS 'Individual role votes for clan allegiance (changed from clan-level to role-level in migration 00107)';
COMMENT ON COLUMN clan_votes.role_id IS 'The specific role (person) who voted';
COMMENT ON COLUMN clan_votes.clan_id IS 'The clan this role belongs to (for aggregation)';
