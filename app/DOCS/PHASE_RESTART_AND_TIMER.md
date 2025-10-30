# Phase Restart Detection & Countdown Timer

## Summary

Implemented two new features for the participant experience:
1. **Phase Restart Detection** - Participants see a notification modal when facilitator restarts current phase
2. **Countdown Timer** - Real-time countdown showing time remaining in current phase

## Feature 1: Phase Restart Detection

### How It Works

**Facilitator Side** (FacilitatorSimulation.tsx):
- Click "Restart Phase" button
- Deletes all votes/sessions for current phase
- Updates `phases.started_at` to current timestamp
- Reloads facilitator page

**Participant Side** (ParticipantDashboard.tsx):
- Subscribes to `phases` table via Supabase real-time
- Detects when current phase's `started_at` timestamp changes
- Shows PhaseChangeModal with special "Phase Restarted!" message
- Automatically updates timer to reflect new phase start time

### Implementation Details

#### ParticipantDashboard.tsx (Lines 45, 182-185, 313-365)

**Added ref to track phase started_at**:
```typescript
const currentPhaseStartedAtRef = useRef<string | null>(null)

// Initialize on load
const currentPhase = phasesResult.data?.find(p => p.phase_id === simResult.data.current_phase_id)
if (currentPhase?.started_at) {
  currentPhaseStartedAtRef.current = currentPhase.started_at
}
```

**Enhanced phases subscription**:
```typescript
const phasesSubscription = supabase
  .channel(`phases:${runId}`)
  .on('postgres_changes', { event: '*', table: 'phases' }, (payload) => {
    // Check if current phase being restarted
    if (payload.eventType === 'UPDATE' && simulation?.current_phase_id) {
      const updatedPhase = payload.new as Phase

      if (updatedPhase.phase_id === simulation.current_phase_id) {
        const oldStartedAt = currentPhaseStartedAtRef.current
        const newStartedAt = updatedPhase.started_at

        // If started_at changed, phase was restarted
        if (oldStartedAt && newStartedAt && oldStartedAt !== newStartedAt) {
          console.log('🔄 Current phase restarted!')

          // Show notification modal
          setNewPhaseForModal(updatedPhase)
          setPreviousPhaseName(updatedPhase.name) // Same phase name
          setShowPhaseModal(true)

          // Update ref
          currentPhaseStartedAtRef.current = newStartedAt
        }
      }
    }

    // Reload phases data
    fetchPhases()
  })
  .subscribe()
```

#### PhaseChangeModal.tsx (Lines 88-120)

**Detects phase restart and shows appropriate message**:
```typescript
// Title changes based on restart vs new phase
<h2>
  {previousPhaseName === newPhase.name ? 'Phase Restarted!' : 'New Phase Started!'}
</h2>

// Different messages for restart vs transition
{previousPhaseName === newPhase.name && (
  <p>
    The facilitator has reset this phase. Timer and voting have been restarted.
  </p>
)}

{previousPhaseName && previousPhaseName !== newPhase.name && (
  <p>
    {previousPhaseName} → <strong>{newPhase.name}</strong>
  </p>
)}
```

## Feature 2: Countdown Timer

### Visual Design

The timer displays:
- **Time Format**: MM:SS (e.g., "5:00", "0:45")
- **Color Coding**:
  - 🟢 **Green**: More than 5 minutes remaining
  - 🟡 **Accent**: 1-5 minutes remaining
  - 🟠 **Warning**: Less than 1 minute remaining
  - 🔴 **Danger**: Overtime (shows "+MM:SS")

### Implementation

#### PhaseTimer.tsx (New Component)

```typescript
interface PhaseTimerProps {
  phase: Phase | null
  className?: string
  compact?: boolean // Smaller version for tight spaces
}

export function PhaseTimer({ phase, className, compact }: PhaseTimerProps)
```

**Core Logic**:
```typescript
useEffect(() => {
  if (!phase || !phase.started_at) return

  const calculateTimeRemaining = () => {
    const startedAt = new Date(phase.started_at!).getTime()
    const durationMinutes = phase.actual_duration_minutes || phase.default_duration_minutes || 0
    const endTime = startedAt + (durationMinutes * 60 * 1000)
    const now = Date.now()
    const remaining = Math.floor((endTime - now) / 1000) // seconds

    if (remaining < 0) {
      setIsOvertime(true)
      setTimeRemaining(Math.abs(remaining))
    } else {
      setIsOvertime(false)
      setTimeRemaining(remaining)
    }
  }

  calculateTimeRemaining()
  const interval = setInterval(calculateTimeRemaining, 1000)
  return () => clearInterval(interval)
}, [phase])
```

**Color Determination**:
```typescript
const getTimerColor = (): string => {
  if (isOvertime) return 'text-danger bg-danger/10 border-danger'
  if (timeRemaining <= 60) return 'text-warning bg-warning/10 border-warning'
  if (timeRemaining <= 300) return 'text-accent bg-accent/10 border-accent'
  return 'text-success bg-success/10 border-success'
}
```

#### ParticipantDashboard.tsx (Lines 18, 622-624)

**Added to Current Phase Display**:
```typescript
import { PhaseTimer } from '../components/PhaseTimer'

// Inside Current Phase Display
<div className="mt-4">
  <PhaseTimer phase={currentPhase} />
</div>
```

## Testing Instructions

### Test 1: Phase Restart Notification

1. **Setup**:
   - Have facilitator in FacilitatorSimulation page
   - Have participant in ParticipantDashboard page (different browser/incognito)
   - Start a phase (e.g., "Clans nominate candidates")

2. **Execute**:
   - Facilitator clicks "Restart Phase" button
   - Confirms the restart dialog

3. **Expected Results**:
   - ✅ Participant sees modal appear: "Phase Restarted!"
   - ✅ Modal message: "The facilitator has reset this phase. Timer and voting have been restarted."
   - ✅ Countdown timer resets to full phase duration
   - ✅ Any existing votes are cleared
   - ✅ Vote sessions are recreated automatically

### Test 2: Countdown Timer Display

1. **Setup**:
   - Start any phase with a defined duration
   - Participant views ParticipantDashboard

2. **Visual Checks**:
   - ✅ Timer displays in "Current Phase" card
   - ✅ Shows time in MM:SS format
   - ✅ Updates every second (watch for smooth countdown)
   - ✅ Color is green when >5 minutes remain
   - ✅ Color changes to accent when <5 minutes
   - ✅ Color changes to warning when <1 minute

3. **Overtime Test**:
   - Wait for timer to reach 0:00 (or set short phase duration for testing)
   - ✅ Timer shows "+MM:SS" in red
   - ✅ Shows "OVERTIME" label
   - ✅ Continues counting up

### Test 3: Timer Persists Across Page Refresh

1. **Setup**:
   - Start phase and note countdown time
   - Refresh participant dashboard

2. **Expected**:
   - ✅ Timer recalculates based on `started_at` and current time
   - ✅ Shows accurate time remaining (not reset to full duration)

### Test 4: Phase Restart Updates Timer

1. **Setup**:
   - Start phase, wait 2 minutes (timer shows ~3 minutes left)
   - Facilitator restarts phase

2. **Expected**:
   - ✅ Modal appears: "Phase Restarted!"
   - ✅ Close modal
   - ✅ Timer now shows full duration again (5 minutes)

## Files Modified

### New Files
- `/src/components/PhaseTimer.tsx` (108 lines) - Countdown timer component

### Modified Files
- `/src/pages/ParticipantDashboard.tsx`
  - Line 18: Added PhaseTimer import
  - Line 45: Added `currentPhaseStartedAtRef`
  - Lines 182-185: Initialize ref on load
  - Lines 313-365: Enhanced phases subscription to detect restarts
  - Lines 622-624: Added PhaseTimer to UI

- `/src/components/PhaseChangeModal.tsx`
  - Lines 88-120: Enhanced to detect and display restart vs new phase

## Database Dependencies

**Required Fields**:
- `phases.started_at` (TIMESTAMPTZ) - When phase was started/restarted
- `phases.actual_duration_minutes` (INT) - Custom duration for this phase
- `phases.default_duration_minutes` (INT) - Default duration from template

**Real-time Subscriptions**:
- `phases` table with `run_id` filter
- Triggers on UPDATE events

## Edge Cases Handled

1. **Phase not started yet** (`started_at = null`):
   - Timer doesn't display (returns null)

2. **No duration defined**:
   - Timer uses `actual_duration_minutes` first, then `default_duration_minutes`, then 0

3. **Participant joins mid-phase**:
   - Timer calculates remaining time based on `started_at`, not when they joined

4. **Overtime scenario**:
   - Timer shows positive value prefixed with "+"
   - Changes to red color
   - Shows "OVERTIME" label

5. **Multiple rapid restarts**:
   - Each restart triggers modal
   - Timer recalculates each time
   - Ref properly tracks latest `started_at`

## Benefits

### For Facilitators
- Can restart phases for testing/retrying without confusing participants
- Participants automatically notified of restart

### For Participants
- Always aware of time remaining in phase
- Visual urgency cues (color changes)
- Clear notification when facilitator restarts phase
- Timer always accurate (not dependent on localStorage or component state)

## Future Enhancements

Possible improvements:
1. Add audio alert when timer hits 1 minute
2. Add timer to facilitator view as well
3. Add "extend phase" button visible to participants when in overtime
4. Add phase progress bar in addition to countdown
5. Show timer in browser tab title (e.g., "(3:45) Simulation")
