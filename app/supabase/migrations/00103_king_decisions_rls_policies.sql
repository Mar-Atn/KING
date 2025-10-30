-- RLS Policies for king_decisions table
-- Allows King to create/update own decisions, Facilitator to view/reveal, all participants to view revealed

-- Enable RLS
ALTER TABLE king_decisions ENABLE ROW LEVEL SECURITY;

-- Policy 1: King can insert their own decisions
CREATE POLICY "King can create own decisions"
ON king_decisions
FOR INSERT
TO authenticated
WITH CHECK (
  king_role_id IN (
    SELECT role_id
    FROM roles
    WHERE run_id = king_decisions.run_id
    AND assigned_user_id = auth.uid()
  )
);

-- Policy 2: King can update own decisions (before reveal)
CREATE POLICY "King can update own decisions before reveal"
ON king_decisions
FOR UPDATE
TO authenticated
USING (
  revealed = FALSE
  AND king_role_id IN (
    SELECT role_id
    FROM roles
    WHERE run_id = king_decisions.run_id
    AND assigned_user_id = auth.uid()
  )
)
WITH CHECK (
  revealed = FALSE
  AND king_role_id IN (
    SELECT role_id
    FROM roles
    WHERE run_id = king_decisions.run_id
    AND assigned_user_id = auth.uid()
  )
);

-- Policy 3: King can view own decisions
CREATE POLICY "King can view own decisions"
ON king_decisions
FOR SELECT
TO authenticated
USING (
  king_role_id IN (
    SELECT role_id
    FROM roles
    WHERE run_id = king_decisions.run_id
    AND assigned_user_id = auth.uid()
  )
);

-- Policy 4: Facilitator can view all decisions in their simulations
CREATE POLICY "Facilitator can view decisions in own sims"
ON king_decisions
FOR SELECT
TO authenticated
USING (
  run_id IN (
    SELECT run_id
    FROM sim_runs
    WHERE facilitator_id = auth.uid()
  )
);

-- Policy 5: Facilitator can update reveal status
CREATE POLICY "Facilitator can reveal decisions"
ON king_decisions
FOR UPDATE
TO authenticated
USING (
  run_id IN (
    SELECT run_id
    FROM sim_runs
    WHERE facilitator_id = auth.uid()
  )
)
WITH CHECK (
  run_id IN (
    SELECT run_id
    FROM sim_runs
    WHERE facilitator_id = auth.uid()
  )
);

-- Policy 6: All participants can view revealed decisions in their simulation
CREATE POLICY "Participants can view revealed decisions"
ON king_decisions
FOR SELECT
TO authenticated
USING (
  revealed = TRUE
  AND run_id IN (
    SELECT run_id
    FROM roles
    WHERE assigned_user_id = auth.uid()
  )
);

-- Comments
COMMENT ON POLICY "King can create own decisions" ON king_decisions IS 'Allows King to submit their royal decree';
COMMENT ON POLICY "King can update own decisions before reveal" ON king_decisions IS 'Allows King to edit decisions before admin reveals them';
COMMENT ON POLICY "King can view own decisions" ON king_decisions IS 'King can always see their own decisions';
COMMENT ON POLICY "Facilitator can view decisions in own sims" ON king_decisions IS 'Facilitator can review all decisions in simulations they manage';
COMMENT ON POLICY "Facilitator can reveal decisions" ON king_decisions IS 'Facilitator can set revealed=true to announce to all';
COMMENT ON POLICY "Participants can view revealed decisions" ON king_decisions IS 'All participants see revealed decisions in their simulation';
