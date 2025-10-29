# Phase 2: Core Simulation Engine - Detailed Implementation Plan

**Phase:** 2 of 12
**Duration:** 5-7 days
**Priority:** P0 (Critical Path)
**Dependencies:** Phase 1 Complete ✅
**Blocks:** Phases 3, 4, 5, 6 (everything else)

---

## 🎯 Phase 2 Goals

Build the foundational simulation management system that enables:
1. Facilitators to create and configure simulations
2. System to manage the 12-phase process (KING_Process.csv)
3. Real-time phase synchronization across all participants
4. Phase-aware participant interfaces

---

## 📊 Phase 2 Sub-Tasks Breakdown

### **2.1 Data Seeding & Process Definition** (Day 1, Morning)
### **2.2 Simulation Configurator - Basic** (Day 1-2)
### **2.3 Stage Engine - Core** (Day 2-3)
### **2.4 Real-time Phase Sync** (Day 3-4)
### **2.5 Phase-Aware UI** (Day 4-5)
### **2.6 Facilitator Phase Controls** (Day 5-6)
### **2.7 Testing & Refinement** (Day 6-7)

---

## 📋 Detailed Task List

---

## **2.1 Data Seeding & Process Definition**

**Duration:** 4 hours
**Goal:** Load KING_Process.csv and create reusable templates

### Tasks:

#### 2.1.1 Parse KING_Process.csv
- [ ] Read KING_Process.csv file from /DOCS/DATA/
- [ ] Parse CSV to extract phase definitions:
  ```
  Stage #, Stage Name, Description, Default Duration (minutes)
  ```
- [ ] Validate all 12 phases present
- [ ] Create TypeScript interface for process phases

**File to create:** `src/lib/processDefinition.ts`

```typescript
export interface ProcessPhase {
  sequence_number: number
  name: string
  description: string
  default_duration_minutes: number
}

export const KING_PROCESS_PHASES: ProcessPhase[] = [
  // ... 12 phases from CSV
]
```

#### 2.1.2 Create Simulation Template Seed
- [ ] Insert default "KOURION v1.0" template into `simulation_templates`
- [ ] Include complete configuration JSON:
  - Process phases
  - Default clan definitions (6 clans)
  - Total participant counts (15-20 humans, 5-10 AI)
- [ ] Create seed script: `src/scripts/seedTemplates.ts`

**SQL Seed:**
```sql
INSERT INTO simulation_templates (name, version, description, config)
VALUES (
  'KOURION v1.0',
  '1.0.0',
  'Ancient Cyprus political simulation - default configuration',
  '{...}'::jsonb
);
```

#### 2.1.3 Default Clan Definitions
- [ ] Extract 6 clan definitions from design docs
- [ ] Create clan seed data with:
  - Name, about, priorities, attitudes, colors, emblems
- [ ] Prepare for template inclusion

**Deliverables:**
- ✅ `KING_PROCESS_PHASES` constant
- ✅ Default simulation template in database
- ✅ Clan seed data prepared

---

## **2.2 Simulation Configurator - Basic**

**Duration:** 1.5 days
**Goal:** Allow facilitators to create new simulations

### 2.2.1 Simulation List Page

**Route:** `/facilitator/simulations`

- [ ] Create `src/pages/facilitator/SimulationList.tsx`
- [ ] Fetch all simulations for current facilitator
- [ ] Display simulation cards with:
  - Simulation name
  - Status (setup, ready, in_progress, completed, cancelled)
  - Created date
  - Participant counts
  - Action buttons (View, Edit, Clone, Delete)
- [ ] Filter by status
- [ ] Sort by date
- [ ] "Create New" button

**UI Components:**
- SimulationCard
- StatusBadge
- SimulationListFilters

**Database Query:**
```typescript
const { data: simulations } = await supabase
  .from('sim_runs')
  .select('*')
  .eq('facilitator_id', user.id)
  .order('created_at', { ascending: false })
```

### 2.2.2 Simulation Creation Wizard - Step 1: Basic Info

**Route:** `/facilitator/simulations/new`

- [ ] Create multi-step wizard component
- [ ] Step 1: Basic Information
  - Simulation name (required)
  - Version tag (default: "KOURION v1.0")
  - Notes (optional)
  - Learning objectives (up to 3, optional)
  - Template selection (dropdown)

**Form Fields:**
```typescript
interface SimulationBasicInfo {
  run_name: string
  version: string
  notes?: string
  learning_objectives?: string[]
  template_id?: string
}
```

- [ ] Form validation
- [ ] Save as draft functionality
- [ ] Next/Previous navigation

### 2.2.3 Simulation Creation Wizard - Step 2: Participants

- [ ] Step 2: Participant Configuration
  - Total participants (15-25, default: 20)
  - Human participants (10-20, default: 15)
  - AI participants (auto-calculated: total - human)
  - Participant count validation (must match)

**Form Component:**
```tsx
<ParticipantCountSelector
  total={totalParticipants}
  human={humanParticipants}
  ai={aiParticipants}
  onChange={handleParticipantChange}
/>
```

- [ ] Real-time validation
- [ ] Visual feedback (pie chart or bars)

### 2.2.4 Simulation Creation Wizard - Step 3: Clans

- [ ] Load default 6 clans from template
- [ ] Display clan configuration cards
- [ ] Allow editing (optional for v1):
  - Clan name
  - Description
  - Color
- [ ] Clan preview

**Data Structure:**
```typescript
interface ClanConfig {
  name: string
  sequence_number: number
  about?: string
  key_priorities?: string
  color_hex: string
}
```

- [ ] Validate minimum 2 clans

### 2.2.5 Simulation Creation Wizard - Step 4: Phases

- [ ] Load 12 phases from KING_PROCESS_PHASES
- [ ] Display phase timeline
- [ ] Allow duration adjustments (optional)
- [ ] Calculate total simulation time
- [ ] Phase timeline visualizer

**Component:**
```tsx
<PhaseTimelineEditor
  phases={phases}
  onUpdateDuration={handleDurationUpdate}
  totalDuration={calculateTotalDuration(phases)}
/>
```

### 2.2.6 Simulation Creation Wizard - Step 5: Review & Create

- [ ] Configuration summary display
- [ ] All settings preview
- [ ] Edit links for each section
- [ ] Generate config JSON
- [ ] Calculate config checksum (MD5)
- [ ] "Create Simulation" button

**Creation Flow:**
1. Insert `sim_runs` record
2. Insert `clans` records (6 clans)
3. Insert `phases` records (12 phases)
4. Set status to 'setup'
5. Redirect to simulation detail page

**Database Transaction:**
```typescript
async function createSimulation(config: SimulationConfig) {
  // 1. Create sim_run
  const { data: simRun } = await supabase
    .from('sim_runs')
    .insert({
      run_name: config.name,
      version: config.version,
      config: config,
      config_checksum: md5(JSON.stringify(config)),
      total_participants: config.totalParticipants,
      human_participants: config.humanParticipants,
      ai_participants: config.aiParticipants,
      facilitator_id: user.id,
      status: 'setup'
    })
    .select()
    .single()

  // 2. Create clans
  await supabase.from('clans').insert(
    config.clans.map(clan => ({
      run_id: simRun.run_id,
      ...clan
    }))
  )

  // 3. Create phases
  await supabase.from('phases').insert(
    config.phases.map(phase => ({
      run_id: simRun.run_id,
      ...phase,
      status: 'pending'
    }))
  )

  return simRun
}
```

**Deliverables:**
- ✅ 5-step wizard component
- ✅ Simulation creation flow
- ✅ Database transaction logic
- ✅ Redirect to simulation detail

---

## **2.3 Stage Engine - Core**

**Duration:** 1.5 days
**Goal:** Build phase state machine and progression logic

### 2.3.1 Phase State Management (Zustand Store)

- [ ] Create `src/stores/phaseStore.ts`
- [ ] Phase state interface
- [ ] Current phase tracking
- [ ] Phase history
- [ ] Timer state

**Store Structure:**
```typescript
interface PhaseStore {
  // State
  currentPhase: Phase | null
  allPhases: Phase[]
  runId: string | null
  timerActive: boolean
  timeRemainingSeconds: number

  // Actions
  setCurrentPhase: (phase: Phase) => void
  loadPhases: (runId: string) => Promise<void>
  startPhase: (phaseId: string) => Promise<void>
  pausePhase: () => Promise<void>
  resumePhase: () => Promise<void>
  endPhase: () => Promise<void>
  skipPhase: (phaseId: string) => Promise<void>
  extendPhase: (additionalMinutes: number) => Promise<void>

  // Computed
  getCurrentPhaseIndex: () => number
  getNextPhase: () => Phase | null
  getPreviousPhase: () => Phase | null
  isLastPhase: () => boolean
}
```

### 2.3.2 Phase Progression Logic

- [ ] Enforce phase sequence (no skipping ahead without facilitator)
- [ ] Phase validation before transition
- [ ] Phase lifecycle hooks (onStart, onEnd, onPause, onResume)
- [ ] Database updates on phase transitions

**Phase Transition Rules:**
- Can only start phase if previous phase is completed/skipped
- Cannot go backwards (except facilitator override)
- Must be facilitator to control phases
- Log all transitions to `event_log`

**Implementation:**
```typescript
async function startPhase(phaseId: string) {
  const phase = phases.find(p => p.phase_id === phaseId)
  const currentIndex = getCurrentPhaseIndex()

  // Validation
  if (phase.sequence_number !== currentIndex + 1) {
    throw new Error('Cannot skip phases')
  }

  // Update database
  await supabase
    .from('phases')
    .update({
      status: 'active',
      started_at: new Date().toISOString()
    })
    .eq('phase_id', phaseId)

  // Log event
  await logEvent('phase_started', { phase_id: phaseId })

  // Start timer
  startTimer(phase.default_duration_minutes * 60)
}
```

### 2.3.3 Phase Timer System

- [ ] Countdown timer (seconds)
- [ ] Auto-pause when phase paused
- [ ] Auto-resume when phase resumed
- [ ] Timer extension logic
- [ ] Timer expiry handling (notify facilitator, don't auto-advance)

**Timer Implementation:**
```typescript
class PhaseTimer {
  private intervalId: NodeJS.Timeout | null = null
  private remainingSeconds: number = 0

  start(durationSeconds: number) {
    this.remainingSeconds = durationSeconds
    this.intervalId = setInterval(() => {
      this.remainingSeconds--
      updateTimerDisplay(this.remainingSeconds)

      if (this.remainingSeconds <= 0) {
        this.stop()
        onTimerExpiry()
      }
    }, 1000)
  }

  pause() {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  resume() {
    this.start(this.remainingSeconds)
  }

  extend(additionalSeconds: number) {
    this.remainingSeconds += additionalSeconds
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = null
  }
}
```

### 2.3.4 Phase Event Logging

- [ ] Log all phase transitions to `event_log`
- [ ] Event types:
  - `phase_started`
  - `phase_paused`
  - `phase_resumed`
  - `phase_ended`
  - `phase_skipped`
  - `phase_extended`

**Event Payload:**
```typescript
{
  event_type: 'phase_started',
  run_id: string,
  actor_id: string, // facilitator_id
  payload: {
    phase_id: string,
    phase_name: string,
    sequence_number: number,
    started_at: timestamp,
    expected_end_at: timestamp
  }
}
```

**Deliverables:**
- ✅ Phase state management store
- ✅ Phase progression logic
- ✅ Timer system
- ✅ Event logging

---

## **2.4 Real-time Phase Sync**

**Duration:** 1 day
**Goal:** Synchronize phase state across all connected clients

### 2.4.1 Supabase Realtime Setup

- [ ] Create `src/lib/realtimeSync.ts`
- [ ] Subscribe to `phases` table changes
- [ ] Subscribe to `sim_runs` table changes
- [ ] Handle connection/disconnection gracefully

**Subscription Setup:**
```typescript
export function subscribeToPhaseUpdates(runId: string, callback: (phase: Phase) => void) {
  const channel = supabase
    .channel(`sim_run:${runId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'phases',
        filter: `run_id=eq.${runId}`
      },
      (payload) => {
        callback(payload.new as Phase)
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}
```

### 2.4.2 React Hook for Phase Sync

- [ ] Create `src/hooks/usePhaseSync.ts`
- [ ] Auto-subscribe when component mounts
- [ ] Auto-update local state on remote changes
- [ ] Handle reconnection

**Hook:**
```typescript
export function usePhaseSync(runId: string) {
  const { setCurrentPhase, loadPhases } = usePhaseStore()

  useEffect(() => {
    // Initial load
    loadPhases(runId)

    // Subscribe to updates
    const unsubscribe = subscribeToPhaseUpdates(runId, (phase) => {
      if (phase.status === 'active') {
        setCurrentPhase(phase)
      }
    })

    return unsubscribe
  }, [runId])
}
```

### 2.4.3 Optimistic UI Updates

- [ ] Update UI immediately on user action
- [ ] Revert if server update fails
- [ ] Show loading states during sync

### 2.4.4 Connection Status Indicator

- [ ] Display connection status to user
- [ ] Show "Connecting...", "Connected", "Disconnected"
- [ ] Retry logic on disconnect

**Deliverables:**
- ✅ Real-time sync infrastructure
- ✅ Phase update subscriptions
- ✅ React hooks for sync
- ✅ Connection monitoring

---

## **2.5 Phase-Aware UI**

**Duration:** 1 day
**Goal:** Build participant interface that adapts to current phase

### 2.5.1 Phase Header Component

**Component:** `src/components/PhaseHeader.tsx`

- [ ] Display current phase name
- [ ] Show phase description
- [ ] Display timer countdown
- [ ] Phase status indicator
- [ ] Phase number (X of 12)

**UI Design:**
```
┌────────────────────────────────────────┐
│ Phase 3: Clan Council Meetings        │
│ Discuss strategy with your clan       │
│                                        │
│ ⏱️  15:32 remaining                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [████████████░░░░░░░░] Phase 3 of 12  │
└────────────────────────────────────────┘
```

### 2.5.2 Phase-Specific Content Renderer

**Component:** `src/components/PhaseContent.tsx`

- [ ] Switch component based on phase type
- [ ] Render appropriate UI for each phase:
  - Welcome & Waiting
  - Clan Council
  - Public Speeches
  - Voting Round 1
  - Voting Round 2
  - King's Decision
  - Clan Final Vote
  - Results & Debrief

**Implementation:**
```typescript
function PhaseContent({ phase }: { phase: Phase }) {
  switch (phase.sequence_number) {
    case 1:
      return <WelcomePhase />
    case 2:
      return <ClanCouncilPhase />
    case 3:
      return <PublicSpeechPhase />
    // ... etc
    default:
      return <GenericPhase phase={phase} />
  }
}
```

### 2.5.3 Placeholder Phase Components

Create basic versions of each phase component:

- [ ] `WelcomePhase.tsx` - Waiting for simulation to start
- [ ] `ClanCouncilPhase.tsx` - Clan meeting interface (placeholder)
- [ ] `PublicSpeechPhase.tsx` - Speech viewing interface (placeholder)
- [ ] `VotingPhase.tsx` - Voting interface (placeholder)
- [ ] `ResultsPhase.tsx` - Results display (placeholder)

Each should display:
- Phase name and description
- Phase-specific instructions
- Timer
- Relevant actions (to be implemented later)

**Deliverables:**
- ✅ Phase header component
- ✅ Phase content renderer
- ✅ 5+ placeholder phase components

---

## **2.6 Facilitator Phase Controls**

**Duration:** 1 day
**Goal:** Build facilitator control panel for phase management

### 2.6.1 Simulation Detail Page (Facilitator)

**Route:** `/facilitator/simulations/:runId`

- [ ] Create `src/pages/facilitator/SimulationDetail.tsx`
- [ ] Display simulation overview
- [ ] Show current phase
- [ ] List all phases with status
- [ ] Phase control panel
- [ ] Participant list (preview)
- [ ] Quick stats

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Simulation: Ancient Cyprus Test Run        │
│ Status: In Progress                         │
├─────────────────────────────────────────────┤
│ Current Phase: Clan Council Meetings       │
│ ⏱️  12:45 remaining                         │
│                                             │
│ [⏸️ Pause] [⏭️ Skip] [⏲️ Extend +5min]      │
├─────────────────────────────────────────────┤
│ Phase Timeline:                             │
│ ✅ Phase 1: Welcome                         │
│ ✅ Phase 2: Role Assignment                 │
│ ▶️ Phase 3: Clan Council (active)           │
│ ⏳ Phase 4: Public Speeches                 │
│ ... (8 more)                                │
└─────────────────────────────────────────────┘
```

### 2.6.2 Phase Control Buttons

- [ ] **Start Phase** button
  - Only enabled if previous phase complete
  - Confirm dialog before starting
  - Update phase status to 'active'
  - Start timer

- [ ] **Pause Phase** button
  - Only enabled if phase is active
  - Update status to 'paused'
  - Pause timer
  - Broadcast to all participants

- [ ] **Resume Phase** button
  - Only visible if phase is paused
  - Update status to 'active'
  - Resume timer

- [ ] **End Phase** button
  - Confirm dialog
  - Update status to 'completed'
  - Stop timer
  - Move to next phase (optional)

- [ ] **Skip Phase** button
  - Confirm dialog with warning
  - Update status to 'skipped'
  - Move to next phase

- [ ] **Extend Phase** button
  - Modal to input additional minutes
  - Add time to timer
  - Update `actual_duration_minutes`
  - Notify participants

**Component:**
```tsx
<PhaseControls
  phase={currentPhase}
  onStart={() => handleStartPhase(nextPhase.phase_id)}
  onPause={() => handlePausePhase()}
  onResume={() => handleResumePhase()}
  onEnd={() => handleEndPhase()}
  onSkip={() => handleSkipPhase()}
  onExtend={(minutes) => handleExtendPhase(minutes)}
/>
```

### 2.6.3 Phase Timeline Component

- [ ] Visual timeline of all 12 phases
- [ ] Color-coded by status:
  - Green: completed
  - Blue: active
  - Yellow: paused
  - Gray: pending
  - Orange: skipped
- [ ] Click to view phase details
- [ ] Hover to see phase description

**Deliverables:**
- ✅ Facilitator simulation detail page
- ✅ Phase control panel
- ✅ Phase timeline visualization

---

## **2.7 Testing & Refinement**

**Duration:** 1 day
**Goal:** Test phase system end-to-end and fix issues

### 2.7.1 Manual Testing Scenarios

**Test 1: Full Phase Progression**
- [ ] Create new simulation
- [ ] Start Phase 1
- [ ] Timer starts and counts down
- [ ] End Phase 1
- [ ] Start Phase 2
- [ ] Verify phase 1 marked complete
- [ ] Continue through all 12 phases

**Test 2: Phase Pause/Resume**
- [ ] Start a phase
- [ ] Pause mid-timer
- [ ] Verify timer stops
- [ ] Verify participants see "Paused" status
- [ ] Resume phase
- [ ] Verify timer continues from paused time

**Test 3: Phase Extension**
- [ ] Start a phase
- [ ] Let timer run down to < 5 minutes
- [ ] Extend phase by 10 minutes
- [ ] Verify timer updates
- [ ] Verify participants see extended time

**Test 4: Phase Skip**
- [ ] Start Phase 1
- [ ] Skip to Phase 3 (should fail - can't skip)
- [ ] Skip Phase 1 (should succeed)
- [ ] Verify Phase 1 marked 'skipped'
- [ ] Verify Phase 2 is now startable

**Test 5: Multi-User Real-time Sync**
- [ ] Open facilitator view in Browser A
- [ ] Open participant view in Browser B
- [ ] Start phase in Browser A
- [ ] Verify Browser B updates immediately
- [ ] Pause phase in Browser A
- [ ] Verify Browser B shows paused state

### 2.7.2 Edge Cases

- [ ] What if facilitator closes browser mid-phase?
- [ ] What if timer expires but facilitator doesn't end phase?
- [ ] What if network disconnects during phase transition?
- [ ] What if two facilitators try to control same simulation?
- [ ] What if database update fails?

### 2.7.3 Refinements

- [ ] Add loading states
- [ ] Add error messages
- [ ] Add confirmation dialogs
- [ ] Add undo option (if needed)
- [ ] Polish animations
- [ ] Improve mobile layout
- [ ] Add keyboard shortcuts (space to pause/resume?)

**Deliverables:**
- ✅ Tested phase system
- ✅ Fixed critical bugs
- ✅ Polished user experience

---

## 📦 Phase 2 Deliverables Summary

### Files Created:
- `src/lib/processDefinition.ts` - KING process phase definitions
- `src/stores/phaseStore.ts` - Phase state management
- `src/lib/realtimeSync.ts` - Real-time sync utilities
- `src/hooks/usePhaseSync.ts` - Phase sync React hook
- `src/pages/facilitator/SimulationList.tsx` - Simulation list
- `src/pages/facilitator/SimulationNew.tsx` - Simulation wizard
- `src/pages/facilitator/SimulationDetail.tsx` - Sim detail + controls
- `src/components/PhaseHeader.tsx` - Phase header component
- `src/components/PhaseContent.tsx` - Phase content renderer
- `src/components/PhaseControls.tsx` - Phase control buttons
- `src/components/PhaseTimeline.tsx` - Phase timeline viz
- `src/components/phases/WelcomePhase.tsx` - Welcome phase UI
- `src/components/phases/ClanCouncilPhase.tsx` - Clan council UI
- `src/components/phases/PublicSpeechPhase.tsx` - Speech UI
- `src/components/phases/VotingPhase.tsx` - Voting UI
- `src/components/phases/ResultsPhase.tsx` - Results UI

### Database Updates:
- Seed `simulation_templates` table
- Create helper functions for phase transitions
- Optimize real-time subscriptions

### Features Complete:
✅ Simulation creation wizard (5 steps)
✅ Simulation list and management
✅ Phase state machine (12 phases)
✅ Phase progression logic
✅ Real-time phase synchronization
✅ Phase timer system
✅ Facilitator phase controls
✅ Phase-aware participant UI
✅ Event logging

---

## 🎯 Success Criteria

Phase 2 is complete when:
- [ ] Facilitator can create a new simulation
- [ ] Facilitator can start, pause, resume, end, skip phases
- [ ] All 12 phases progress in correct order
- [ ] Timer counts down accurately
- [ ] Phase changes sync to all connected users in real-time (<1 second)
- [ ] Phase state persists in database
- [ ] All phase transitions logged to event_log
- [ ] Participant UI updates based on current phase
- [ ] No critical bugs in phase system

---

## 🚀 Ready to Begin?

**Suggested Implementation Order:**
1. Day 1 AM: Data seeding (2.1)
2. Day 1 PM - Day 2: Simulation wizard (2.2)
3. Day 2-3: Stage engine core (2.3)
4. Day 3-4: Real-time sync (2.4)
5. Day 4-5: Phase-aware UI (2.5)
6. Day 5-6: Facilitator controls (2.6)
7. Day 6-7: Testing & polish (2.7)

**Next Step:** Start with 2.1 - Data Seeding? 🎯
