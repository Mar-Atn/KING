# Dashboard Phase Display Enhancement

**Date:** October 27, 2025
**Issue:** Dashboard shows "Not Started" for all simulations despite active phases
**Status:** Implementation Complete - Awaiting User Testing

---

## Problem

**User Report:**
> "When i go back to the main facilitator's dashboard - i see My simulations - all with status tag Not Started. Despite two of the SIM runs are already at stages 2-3."
>
> "Still shows all as 'Not Started'. All simple - I'd prefer to just see the stage of the SIM run there, and Not STarted - only before any phase was initiated."

---

## Solution Implemented

### Enhanced Dashboard.tsx

**File:** `src/pages/Dashboard.tsx`

#### 1. Refactored Phase Loading (lines 46-104)

Created reusable `loadSimulationsWithPhases()` function:

```typescript
const loadSimulationsWithPhases = async () => {
  if (!user?.id) return

  try {
    // Get simulations
    const { data: sims, error: simError } = await supabase
      .from('sim_runs')
      .select('*')
      .eq('facilitator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (simError) throw simError

    console.log('📊 Loaded simulations:', sims?.length || 0)

    // For each simulation, get current phase and total phases
    const simsWithPhases = await Promise.all(
      (sims || []).map(async (sim) => {
        // Get phases for this simulation
        const { data: phases, error: phaseError } = await supabase
          .from('phases')
          .select('*')
          .eq('run_id', sim.run_id)
          .order('sequence_number', { ascending: true })

        // Handle errors gracefully
        if (phaseError) {
          console.error(`❌ Error loading phases for ${sim.run_name}:`, phaseError)
          return {
            ...sim,
            current_phase: null,
            total_phases: 0,
          }
        }

        // Find active phase or last completed phase
        const activePhase = phases?.find((p) => p.status === 'active')
        const completedPhases = phases?.filter((p) => p.status === 'completed') || []
        const lastCompleted = completedPhases[completedPhases.length - 1]

        const currentPhase = activePhase || lastCompleted || null

        // Debug log for each simulation
        console.log(`📍 ${sim.run_name}: ${phases?.length || 0} phases, current: ${currentPhase?.name || 'none'} (status: ${currentPhase?.status || 'N/A'})`)

        return {
          ...sim,
          current_phase: currentPhase,
          total_phases: phases?.length || 0,
        }
      })
    )

    setSimulations(simsWithPhases)
  } catch (error) {
    console.error('❌ Error fetching simulations:', error)
  } finally {
    setLoadingSimulations(false)
  }
}
```

**Benefits:**
- Individual error handling per simulation
- Debug logging for troubleshooting
- Reusable function (no code duplication)
- Graceful degradation if phase query fails

#### 2. Status Display Logic (lines 14-36)

```typescript
function getDetailedStatus(sim: SimRunWithPhase): { label: string; color: string } {
  // If simulation completed
  if (sim.status === 'completed') {
    return { label: 'Completed', color: 'bg-neutral-400/20 text-neutral-600' }
  }

  // If we have an active or recent phase, show it
  if (sim.current_phase) {
    const phaseName = sim.current_phase.name
    const phaseSeq = sim.current_phase.sequence_number
    const totalPhases = sim.total_phases || '?'

    // Show phase name and number
    return {
      label: `${phaseName} (${phaseSeq}/${totalPhases})`,
      color: 'bg-success/20 text-success'
    }
  }

  // No phases started yet
  return { label: 'Not Started', color: 'bg-warning/20 text-warning' }
}
```

**Display Format:**
- **Active simulation:** "Opening Phase (1/16)" (green badge)
- **Completed simulation:** "Completed" (gray badge)
- **Not started:** "Not Started" (yellow badge)

#### 3. Eliminated Code Duplication

**Before:** 80+ lines of duplicate phase-fetching code in two places
**After:** Single reusable function (lines 46-104)

Used in:
- Initial load (line 110)
- After deletion (line 130)

---

## How It Works

### Data Flow:

1. **Dashboard loads** → triggers `useEffect`
2. **Fetch simulations** → query `sim_runs` table (facilitator's sims only)
3. **For each simulation:**
   - Query `phases` table where `run_id` matches
   - Find active phase: `phases.find(p => p.status === 'active')`
   - If no active, find last completed: `phases.filter(p => p.status === 'completed').last()`
   - Attach `current_phase` and `total_phases` to simulation object
4. **Render status badges:**
   - If `current_phase` exists → show phase name
   - If completed → show "Completed"
   - Otherwise → show "Not Started"

### Phase Status Priority:

1. **Active phase** (status = 'active') → Display this
2. **Last completed phase** (status = 'completed') → Display as fallback
3. **No phases started** → Display "Not Started"

---

## Debug Logging

### Console Output Format:

**Successful Load:**
```
📊 Loaded simulations: 3
📍 Kourion Simulation: 16 phases, current: Opening Phase (status: active)
📍 Test Sim 2: 16 phases, current: Public Speech Phase (status: active)
📍 New Sim: 16 phases, current: none (status: N/A)
```

**Error Case:**
```
📊 Loaded simulations: 3
❌ Error loading phases for Kourion Simulation: [error details]
📍 Kourion Simulation: 0 phases, current: none (status: N/A)
```

---

## Testing Instructions

### Step 1: Hard Refresh Browser
- **Mac:** `Cmd + Shift + R`
- **Windows/Linux:** `Ctrl + Shift + R`

This clears JavaScript cache and loads new code.

### Step 2: Open Browser Console
- Press `F12` or right-click → Inspect
- Go to **Console** tab

### Step 3: Navigate to Dashboard
- Go to facilitator dashboard
- Look at "My Simulations" section

### Step 4: Check Console Output
Look for debug logs like:
```
📊 Loaded simulations: X
📍 [Sim Name]: Y phases, current: [Phase Name] (status: [status])
```

### Step 5: Verify Display

**Expected Results:**

| Simulation State | Status Badge | Color |
|-----------------|--------------|-------|
| Phase 0 active | "Opening Phase (0/16)" | Green |
| Phase 2 active | "Public Speech Phase (2/16)" | Green |
| Phase 15 completed | "Resolution (15/16)" | Green |
| All phases done | "Completed" | Gray |
| No phases started | "Not Started" | Yellow |

---

## Troubleshooting

### If Still Shows "Not Started" After Refresh:

Check console logs:

**Scenario 1: No phases loaded**
```
📍 Sim Name: 0 phases, current: none (status: N/A)
```
→ **Issue:** Phases not in database or RLS blocking query

**Scenario 2: Phases loaded but wrong status**
```
📍 Sim Name: 16 phases, current: none (status: N/A)
```
→ **Issue:** Phases have status 'pending' instead of 'active'/'completed'

**Scenario 3: Error loading phases**
```
❌ Error loading phases for Sim Name: [error]
```
→ **Issue:** Database error or RLS policy blocking

---

## Code Quality Improvements

### Before:
- 160+ lines with duplicate code
- No error handling per simulation
- No debug logging
- Code duplication in 2 places

### After:
- Single reusable function
- Individual error handling
- Comprehensive debug logging
- Clean, maintainable code

**Lines Changed:** ~50 lines
**Lines Removed:** ~80 lines (duplication)
**Net Change:** -30 lines (more concise)

---

## Database Dependencies

### Tables Used:
1. **sim_runs** (simulation metadata)
2. **phases** (phase data for each simulation)

### Required Indexes (already exist):
- `idx_phases_run_id` on `phases(run_id)` ✅
- `idx_phases_run_status` on `phases(run_id, status)` ✅
- `idx_sim_runs_facilitator_created` on `sim_runs(facilitator_id, created_at DESC)` ✅

### Required RLS Policies (already exist):
- Facilitators can SELECT their sim_runs ✅
- Facilitators can SELECT phases for their simulations ✅

---

## Related Fixes

This fix builds on previous improvements:

1. **Migration 00027** - Added simulation loading indexes
2. **Migration 00028** - Fixed event_log RLS policies
3. **phaseStore.ts fix** - Dynamic phase sequence validation
4. **Dashboard status fix v1** - Used sim.status (didn't work)
5. **Dashboard status fix v2** - Fetch actual phase data (current)

---

## Summary

**Problem:** Dashboard always shows "Not Started"
**Root Cause:** Previous fix used sim.status but it wasn't reliable
**Solution:** Fetch actual phase data and display current phase name
**Status:** ✅ Implementation complete
**Next:** User testing required

---

**Implementation:** Claude Code
**File Modified:** `src/pages/Dashboard.tsx`
**Lines Changed:** ~50 lines (net -30 due to refactoring)
**Breaking Changes:** None
**Backward Compatible:** Yes ✅

---

**Test it now by hard refreshing your browser and checking the Dashboard!**

If you still see "Not Started", please share the console output from the debug logs.
