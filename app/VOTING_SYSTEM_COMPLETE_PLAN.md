# Complete Voting System Implementation Plan
**Goal:** Make ALL voting types work with clan nominations logic
**Deadline:** Ready for live test in the morning

---

## Current Status

### ✅ What Works
- Session creation (auto-creates sessions when phase starts)
- "Start Voting" button (sets `started_at` timestamp)
- Participants see "Vote Now" banner when `started_at` is set
- Real-time subscriptions (participants get updates automatically)
- Vote submission and "Vote Submitted" confirmation
- "Stop Voting" closes sessions
- "Reveal Results" updates sessions to `status='announced'`

### ❌ Current Bugs
1. **"Start Voting" shows again after reveal** - Need `announced` state
2. **Reveal animation not triggering on participant side** - Sessions not being detected or localStorage blocking

### 🔄 Vote Types to Implement

Based on process definition, we need:

1. **Clan Nominations** (CURRENT) - ✅ Mostly working
   - Each clan votes to nominate 1 candidate
   - Vote format: `choose_person`
   - Scope: `clan_only` (4 separate sessions)
   - Reveal: Show all 4 nominees in sequence

2. **Vote 1: Election Round 1** - 🔴 TODO
   - All participants vote for King
   - Candidates: All 4 nominees from clan nominations
   - Vote format: `choose_person`
   - Scope: `all` (1 session for everyone)
   - Threshold: 2/3 majority (from `vote_1_threshold` or default)
   - Reveal: Show winner if threshold met, else show tie/runoff message

3. **Vote 2: Election Round 2** (if needed) - 🔴 TODO
   - All participants vote for King (runoff)
   - Candidates: Top 2-3 from Vote 1
   - Vote format: `choose_person`
   - Scope: `all` (1 session for everyone)
   - Threshold: 2/3 majority (from `vote_2_threshold` or default)
   - Reveal: Show winner

4. **Yes/No Votes** (Future - not urgent)
   - Vote on proposals, decisions
   - Vote format: `yes_no_abstain`

---

## Technical Architecture

### Database Flow

```
1. Phase Starts
   ↓
2. Auto-create sessions (status='open', started_at=NULL)
   ↓
3. Facilitator clicks "Start Voting"
   → Update started_at = NOW()
   ↓
4. Real-time fires → Participants refresh sessions
   ↓
5. Participants see "Vote Now" (check: status='open' AND started_at IS NOT NULL)
   ↓
6. Participant votes
   → Insert into votes table
   → Check myVoteStatus shows "Vote Submitted"
   ↓
7. Facilitator clicks "Stop Voting"
   → Update status='closed', closed_at=NOW()
   ↓
8. Facilitator clicks "Reveal Results"
   → Calculate winner/results
   → Insert into vote_results
   → Update status='announced', announced_at=NOW()
   ↓
9. Real-time fires → Participants refresh sessions
   ↓
10. Participant side detects status='announced'
    → Fetch vote_results
    → Show reveal animation
    → Mark as seen in localStorage
```

### State Management

**Facilitator Controls:**
```typescript
{
  votingActive: boolean       // true when started_at set
  votingClosed: boolean       // true when status='closed'
  announced: boolean          // true when status='announced'
  timeRemaining: number       // countdown timer
  sessions: VoteSession[]     // all sessions for this phase
  clanStatuses: ClanVoteStatus[] // calculated from sessions + votes
}
```

**Participant Dashboard:**
```typescript
{
  sessions: VoteSession[]              // subscribed via useVoting
  myVoteStatus: Record<string, boolean> // session_id → hasVoted
  showReveal: boolean                  // trigger reveal animation
  reveals: ClanReveal[]                // data for reveal animation
}
```

---

## Implementation Steps

### Phase 1: Fix Current Bugs (30 mins)

1. **Add `announced` state to ClanNominationsControls**
   - `const [announced, setAnnounced] = useState(false)`
   - After handleReveal completes: `setAnnounced(true)`
   - Button logic: `{votingClosed && !announced && (...)}`

2. **Debug reveal animation not triggering**
   - Add comprehensive logging (already added)
   - Check if `status='announced'` is being set correctly
   - Check if localStorage is blocking re-shows
   - Verify real-time subscription is working
   - Test: Clear localStorage and try again

### Phase 2: Generalize Voting Controls (1 hour)

Create `UniversalVotingControls.tsx` that works for ALL vote types:

```typescript
interface UniversalVotingControlsProps {
  runId: string
  phaseId: string
  phaseName: string
  voteType: 'clan_nomination' | 'election_round' | 'yes_no'
  voteConfig: {
    candidates?: Role[]        // For choose_person votes
    scope: 'all' | 'clan_only'
    scopeClanId?: string       // If clan_only
    threshold?: number         // For election rounds
    question?: string          // For yes/no votes
  }
}
```

**Key differences by vote type:**
- **Clan Nominations**: Create 4 sessions (one per clan)
- **Election Rounds**: Create 1 session (all participants)
- **Yes/No**: Create 1 session (all participants)

### Phase 3: Implement Vote 1 (Election Round 1) (1 hour)

1. Create `ElectionRoundControls.tsx` (or use Universal)
   - Auto-create 1 session with all nominees as candidates
   - Scope: `all`
   - Threshold: `simulation.vote_1_threshold` or default 2/3

2. Calculate results with threshold checking:
   ```typescript
   const totalVotes = simulation.total_participants
   const threshold = simulation.vote_1_threshold || Math.ceil(totalVotes * 2/3)
   const winner = calculateWinner(votes)

   if (winner.voteCount >= threshold) {
     // Winner found!
     result = { winner, passed: true }
   } else {
     // No threshold met → Runoff needed
     result = { topCandidates: getTop2Or3(), passed: false }
   }
   ```

3. Reveal animation:
   - If threshold met: Show winner (similar to clan nomination)
   - If not met: Show "No winner - runoff required" message

### Phase 4: Implement Vote 2 (Election Round 2) (30 mins)

Similar to Vote 1, but:
- Candidates are top 2-3 from Vote 1 (passed as prop)
- Use `vote_2_threshold` or default 2/3

### Phase 5: Create Reveal Animations for Each Type (1 hour)

1. **ClanNominationsReveal** - ✅ Already exists
   - Shows each clan → nominee in sequence

2. **ElectionWinnerReveal** - 🔴 TODO
   - Black background
   - Show winner with crown 👑
   - Display vote count and percentage
   - If threshold met: "New King elected!"
   - If not met: "Runoff required"

3. **RunoffReveal** - 🔴 TODO
   - Show top candidates advancing to runoff
   - Display their vote counts

### Phase 6: Automatic Testing (1 hour)

Create test script `scripts/testVotingSystem.ts`:

```typescript
// Test scenarios:
1. Create simulation with 12 participants (3 per clan)
2. Advance to "Clan Nominations" phase
3. Programmatically:
   - Start voting
   - Cast votes for each participant
   - Stop voting
   - Reveal results
   - Verify sessions updated correctly
4. Advance to "Vote 1" phase
5. Repeat testing
6. Check database state after each step
```

### Phase 7: Documentation (30 mins)

Update KING_UX_GUIDE.md with:
- Voting system architecture
- How to add new vote types
- Real-time subscription patterns
- Reveal animation patterns

---

## File Structure

```
src/
├── components/voting/
│   ├── ClanNominationsControls.tsx     (current)
│   ├── UniversalVotingControls.tsx     (new - handles all types)
│   ├── ElectionRoundControls.tsx       (new - or use Universal)
│   ├── Ballot.tsx                      (current - works for all)
│   ├── ResultsDisplay.tsx              (current - needs threshold logic)
│   ├── ClanNominationsReveal.tsx       (current)
│   ├── ElectionWinnerReveal.tsx        (new)
│   └── RunoffReveal.tsx                (new)
├── hooks/
│   └── useVoting.ts                    (current - works for all)
└── pages/
    ├── FacilitatorSimulation.tsx       (render correct controls)
    └── ParticipantDashboard.tsx        (render correct reveals)
```

---

## Testing Checklist

### Clan Nominations
- [ ] Sessions auto-created when phase starts
- [ ] "Start Voting" appears (not before)
- [ ] After clicking "Start Voting", participants see "Vote Now"
- [ ] Participant can cast vote
- [ ] After voting, shows "Vote Submitted"
- [ ] Cannot vote twice
- [ ] "Stop Voting" closes sessions
- [ ] "Reveal Results" updates to announced
- [ ] Reveal animation shows on participant screen
- [ ] All 4 clans show in sequence
- [ ] After reveal, no buttons show on facilitator side

### Vote 1 (Election Round 1)
- [ ] Session auto-created with 4 nominees
- [ ] All participants eligible to vote
- [ ] Threshold calculated correctly (2/3)
- [ ] If winner meets threshold: Winner announced
- [ ] If no threshold: Runoff message shown
- [ ] Reveal animation shows result clearly

### Vote 2 (Election Round 2)
- [ ] Session created with top 2-3 candidates
- [ ] All participants eligible to vote
- [ ] Threshold calculated correctly
- [ ] Winner announced
- [ ] Reveal animation shows winner

### Real-time
- [ ] Participant updates without refresh
- [ ] Multiple participants see same state
- [ ] Voting progress updates live on facilitator screen

---

## Time Estimate

| Task | Time | Priority |
|------|------|----------|
| Fix current bugs | 30 min | HIGH |
| Universal voting controls | 1 hour | HIGH |
| Vote 1 implementation | 1 hour | HIGH |
| Vote 2 implementation | 30 min | MEDIUM |
| Reveal animations | 1 hour | HIGH |
| Automatic testing | 1 hour | MEDIUM |
| Documentation | 30 min | LOW |
| **TOTAL** | **5.5 hours** | |

---

## Questions for Morning Test

1. **Threshold behavior:** What should happen if NO candidate reaches 2/3 in Vote 2?
   - Default: Highest vote count wins (simple majority)
   - Alternative: Another runoff?

2. **Reveal timing:** Should reveals auto-complete or require facilitator acknowledgment?
   - Current: Auto-complete after animation
   - Safer: Facilitator clicks "Continue" after each reveal?

3. **Phase transitions:** After reveal, does facilitator manually advance to next phase?
   - Current: Yes (manual via FacilitatorSimulation)
   - Future: Auto-advance option?

---

## Next Steps

Starting now:
1. Fix `announced` state bug → 15 minutes
2. Debug reveal animation → 15 minutes
3. Create UniversalVotingControls → 1 hour
4. Implement Vote 1 → 1 hour
5. Implement Vote 2 → 30 minutes
6. Create reveal animations → 1 hour
7. Test manually with console → 30 minutes
8. Create automated test script → 30 minutes
9. Final testing and bug fixes → 1 hour

**TOTAL: ~5.5 hours** → Ready for morning test!

---

_Last updated: Night implementation session_
_Status: Starting implementation_
