-- Allow all authenticated users to view revealed clan votes
-- This enables the reveal animation to show all clan decisions to participants

CREATE POLICY "Anyone can view revealed clan votes"
  ON clan_votes FOR SELECT TO authenticated
  USING (revealed = true);

COMMENT ON POLICY "Anyone can view revealed clan votes" ON clan_votes IS
  'Allows participants to see all votes after admin reveals results for the cinematic reveal animation';
