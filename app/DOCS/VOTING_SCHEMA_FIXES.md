# Voting System Schema Fixes

## Problem Summary

The clan nominations voting system was failing to create vote sessions due to database schema mismatches. After the user reported "DO NOT RUSH. FIX IT SISTEMICALY," we systematically identified and resolved all schema-related issues.

## Database Schema Reference

From `supabase/migrations/00003_init_voting_tables.sql`, the `vote_sessions` table has these constraints:

### Timestamp Fields (What Actually Exists)
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
closed_at TIMESTAMPTZ
announced_at TIMESTAMPTZ
-- ❌ NO started_at field
```

### Enum Field Constraints

**vote_type** - Must be one of:
- `clan_nomination` ✅ (NOT 'nomination')
- `election_round`
- `clan_oath`
- `clan_action`
- `facilitator_proposal`

**transparency_level** - Must be one of:
- `open`
- `anonymous`
- `secret` ✅ (NOT 'closed')

**status** - Must be one of:
- `open` ✅ (accepting votes)
- `closed` (voting stopped)
- `announced` (results revealed)
- ❌ NOT 'active' or 'pending'

## Issues Fixed

### Issue 1: Invalid transparency_level
**Error**: `"new row for relation \"vote_sessions\" violates check constraint \"vote_sessions_transparency_level_check\""`

**Before**:
```typescript
transparency_level: 'closed' // ❌ Invalid
```

**After**:
```typescript
transparency_level: 'secret' as const // ✅ Valid
```

### Issue 2: Invalid vote_type
**Error**: `"new row for relation \"vote_sessions\" violates check constraint \"vote_sessions_vote_type_check\""`

**Before**:
```typescript
vote_type: 'nomination' // ❌ Invalid
```

**After**:
```typescript
vote_type: 'clan_nomination' as const // ✅ Valid
```

### Issue 3: Non-existent started_at column
**Error**: `"Could not find the 'started_at' column of 'vote_sessions' in the schema cache"`

**Before**:
```typescript
const sessionData = {
  // ...
  started_at: null, // ❌ Column doesn't exist
  closed_at: null,
  announced_at: null
}

const handleStart = async () => {
  await supabase
    .from('vote_sessions')
    .update({
      started_at: new Date().toISOString() // ❌ Column doesn't exist
    })
}

const anyActive = sessions.some(s =>
  s.status === 'open' && s.started_at !== null // ❌ Column doesn't exist
)
```

**After**:
```typescript
const sessionData = {
  // ...
  // ✅ Only include fields that exist in schema
  status: 'open' as const
}

const handleStart = async () => {
  // ✅ No database update needed
  // Sessions with status='open' are already accepting votes
  setVotingActive(true)
  setTimeRemaining(300)
}

// ✅ Use component state to track if timer is active
// votingActive is managed by handleStart/handleStop
```

### Issue 4: Invalid status 'active'
**Error**: 400 error when updating status to 'active'

**Before**:
```typescript
await supabase
  .from('vote_sessions')
  .update({ status: 'active' }) // ❌ Invalid
```

**After**:
```typescript
// ✅ Sessions are created with status='open'
// No need to update status when starting voting timer
// The timer is purely UI state
```

## Current Architecture

### Session Lifecycle
1. **Creation**: Sessions created with `status: 'open'` when phase starts
2. **Voting Active**: UI timer managed by component state (`votingActive`)
3. **Voting Closed**: Sessions updated to `status: 'closed'` when facilitator stops
4. **Results Announced**: Sessions updated to `status: 'announced'` when revealed

### Database Fields
```typescript
const sessionData = {
  run_id: string,
  phase_id: string,
  proposal_title: string,
  proposal_description: string,
  vote_format: 'choose_person',
  vote_type: 'clan_nomination', // Must match schema enum
  scope: 'clan_only',
  scope_clan_id: string,
  eligible_candidates: string[],
  transparency_level: 'secret', // Must match schema enum
  status: 'open' // Must match schema enum
  // NO started_at, closed_at, or announced_at
  // These are set automatically by database or later updates
}
```

### UI State vs Database State
- **Database**: `status: 'open'` means "accepting votes"
- **UI State**: `votingActive: true` means "timer is running"
- **Separation**: Timer can be paused/extended without database changes

## Files Changed

### `/Users/maratatnashev/Desktop/CODING/KING/app/src/components/voting/ClanNominationsControls.tsx`

**Lines 108-120**: Fixed session creation data
```typescript
const sessionData = {
  run_id: runId,
  phase_id: phaseId,
  proposal_title: `${clan.name} Nomination`,
  proposal_description: `Choose your clan's nominee for King`,
  vote_format: 'choose_person' as const,
  vote_type: 'clan_nomination' as const, // Fixed: was 'nomination'
  scope: 'clan_only' as const,
  scope_clan_id: clan.clan_id,
  eligible_candidates: clanMembers.map(r => r.role_id),
  transparency_level: 'secret' as const, // Fixed: was 'closed'
  status: 'open' as const
  // Removed: started_at, closed_at, announced_at
}
```

**Lines 213-217**: Removed started_at check
```typescript
// Update status flags
// Note: We don't check started_at anymore (column doesn't exist)
// votingActive is managed by component state only
const allClosed = sessions.length > 0 && sessions.every(s => s.status === 'closed')
setVotingClosed(allClosed)
// Removed: setVotingActive(anyActive) based on database
```

**Lines 261-266**: Simplified handleStart
```typescript
const handleStart = async () => {
  // Sessions are already 'open' status (accepting votes)
  // No database update needed - just activate timer in UI
  setVotingActive(true)
  setTimeRemaining(300) // 5 minutes
}
// Removed: database update to set started_at
```

### `/Users/maratatnashev/Desktop/CODING/KING/app/src/pages/ParticipantDashboard.tsx`

**Line 405**: Already correct - checks for `status === 'open'`
```typescript
const openVote = sessions.find(s => {
  if (s.status !== 'open') return false // ✅ Correct
  // ... eligibility checks
})
```

## Testing

Created `/Users/maratatnashev/Desktop/CODING/KING/app/scripts/testSessionCreation.ts` to verify fixes:

### Test Results
```
✅ Found 6 clans
✅ Found 12 roles
✅ Created 4 sessions successfully:
   • Military Clan Nomination
   • Clan of Bankers Nomination
   • Clan of Landlords Nomination
   • Clan of Merchants Nomination

All sessions have:
✅ Status: open
✅ Type: clan_nomination
✅ Transparency: secret
✅ Scope: clan_only
✅ Candidates properly set
```

## User Testing Instructions

1. **Restart the phase** to clear old sessions:
   - Click "Restart Phase" button in FacilitatorSimulation
   - This deletes all vote_sessions for the current phase

2. **Verify automatic session creation**:
   - Sessions should be created automatically when component loads
   - Console should show: `✅ Created [Clan Name] voting session`
   - Check database: 4 sessions should exist with `status='open'`

3. **Start voting**:
   - Click "Start Voting" button
   - Timer should start (5:00)
   - Status should remain "open" in database
   - Participants should immediately see vote banner

4. **Participant side**:
   - Participants in clans with sessions should see vote notification
   - Banner: "🗳️ Vote Now: [Clan Name] Nomination"
   - Click "Cast Vote" to open ballot

5. **Stop voting**:
   - Click "Stop Voting" button
   - Sessions updated to `status='closed'`
   - Participants no longer see vote banner

6. **Reveal results**:
   - Click "Reveal Results" button
   - Sessions updated to `status='announced'`
   - Reveal animation plays

## Summary

All `started_at` references have been systematically removed. The voting system now correctly uses:
- Database `status` field for voting state
- UI component state for timer display
- Proper enum values matching database schema

**Key Principle**: Database schema is the source of truth. All field values must match CHECK constraints defined in migrations.
