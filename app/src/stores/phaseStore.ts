import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Phase, PhaseStatus } from '../types/database'

// ============================================================================
// TYPES
// ============================================================================

interface PhaseTimer {
  remainingSeconds: number
  isActive: boolean
  intervalId: NodeJS.Timeout | null
}

interface PhaseStore {
  // ========================================================================
  // STATE
  // ========================================================================
  currentPhase: Phase | null
  allPhases: Phase[]
  runId: string | null
  timer: PhaseTimer
  loading: boolean
  error: string | null

  // ========================================================================
  // ACTIONS - Setup
  // ========================================================================
  loadPhases: (runId: string) => Promise<void>
  setCurrentPhase: (phase: Phase) => void
  reset: () => void

  // ========================================================================
  // ACTIONS - Phase Transitions
  // ========================================================================
  startPhase: (phaseId: string) => Promise<void>
  pausePhase: () => Promise<void>
  resumePhase: () => Promise<void>
  endPhase: () => Promise<void>
  skipPhase: (phaseId: string) => Promise<void>
  extendPhase: (additionalMinutes: number) => Promise<void>

  // ========================================================================
  // ACTIONS - Timer
  // ========================================================================
  startTimer: (durationSeconds: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  extendTimer: (additionalSeconds: number) => void

  // ========================================================================
  // COMPUTED
  // ========================================================================
  getCurrentPhaseIndex: () => number
  getNextPhase: () => Phase | null
  getPreviousPhase: () => Phase | null
  isLastPhase: () => boolean
  getPhaseBySequence: (sequence: number) => Phase | null
}

// ============================================================================
// EVENT LOGGING HELPER
// ============================================================================

async function logPhaseEvent(
  eventType: string,
  runId: string,
  phaseId: string,
  phaseName: string,
  payload: Record<string, any> = {}
) {
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('event_log').insert({
    run_id: runId,
    event_type: eventType,
    actor_id: user?.id || null,
    payload: {
      phase_id: phaseId,
      phase_name: phaseName,
      ...payload,
    },
  })
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const usePhaseStore = create<PhaseStore>((set, get) => ({
  // ========================================================================
  // INITIAL STATE
  // ========================================================================
  currentPhase: null,
  allPhases: [],
  runId: null,
  timer: {
    remainingSeconds: 0,
    isActive: false,
    intervalId: null,
  },
  loading: false,
  error: null,

  // ========================================================================
  // SETUP ACTIONS
  // ========================================================================

  loadPhases: async (runId: string) => {
    set({ loading: true, error: null, runId })

    try {
      const { data: phases, error } = await supabase
        .from('phases')
        .select('*')
        .eq('run_id', runId)
        .order('sequence_number', { ascending: true })

      if (error) throw error

      // Get current phase from sim_runs.current_phase_id (single source of truth)
      const { data: simRun } = await supabase
        .from('sim_runs')
        .select('current_phase_id')
        .eq('run_id', runId)
        .single()

      const currentPhase = simRun?.current_phase_id
        ? phases?.find((p) => p.phase_id === simRun.current_phase_id) || null
        : null

      // If current phase is active and has a started_at time, start the timer
      if (currentPhase && currentPhase.status === 'active' && currentPhase.started_at) {
        const startedAt = new Date(currentPhase.started_at)
        const now = new Date()
        const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
        const totalDurationSeconds = (currentPhase.actual_duration_minutes || currentPhase.default_duration_minutes) * 60
        const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds)

        get().startTimer(remainingSeconds)
      }

      set({
        allPhases: phases || [],
        currentPhase,
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  setCurrentPhase: (phase: Phase) => {
    set({ currentPhase: phase })
  },

  reset: () => {
    const { stopTimer } = get()
    stopTimer()
    set({
      currentPhase: null,
      allPhases: [],
      runId: null,
      loading: false,
      error: null,
    })
  },

  // ========================================================================
  // PHASE TRANSITION ACTIONS
  // ========================================================================

  startPhase: async (phaseId: string) => {
    const { allPhases, runId, getCurrentPhaseIndex, startTimer, currentPhase: localCurrentPhase } = get()
    if (!runId) throw new Error('No run_id set')

    const phase = allPhases.find((p) => p.phase_id === phaseId)
    if (!phase) throw new Error('Phase not found')

    const currentIndex = getCurrentPhaseIndex()

    console.log('🚀 Starting phase:', {
      attempting_to_start: { id: phaseId, name: phase.name, sequence: phase.sequence_number },
      current_local_phase: localCurrentPhase ? {
        id: localCurrentPhase.phase_id,
        name: localCurrentPhase.name,
        sequence: localCurrentPhase.sequence_number,
        status: localCurrentPhase.status
      } : null,
      currentIndex,
      total_phases: allPhases.length
    })

    // Validation: Can only start the next phase in sequence
    // If no phase is active yet (currentIndex = -1), allow starting the first phase (minimum sequence_number)
    // Otherwise, require sequence_number = current phase's sequence + 1
    let expectedSequence: number
    if (currentIndex === -1) {
      // No phase active yet - allow starting the first phase (find minimum sequence_number)
      expectedSequence = Math.min(...allPhases.map(p => p.sequence_number))
      console.log('✓ No current phase, allowing first phase. Expected sequence:', expectedSequence)
    } else {
      // Phase active - next phase must be current sequence_number + 1
      const currentPhase = allPhases[currentIndex]
      expectedSequence = currentPhase.sequence_number + 1
      console.log('✓ Current phase found. Expected next sequence:', expectedSequence, 'Attempting:', phase.sequence_number)
    }

    if (phase.sequence_number !== expectedSequence) {
      console.error('❌ Validation failed:', {
        expected: expectedSequence,
        attempting: phase.sequence_number,
        phase_name: phase.name
      })
      throw new Error('Cannot skip phases. Must complete phases in order.')
    }

    console.log('✓ Validation passed, proceeding with phase start')
    set({ loading: true, error: null })

    try {
      const startedAt = new Date().toISOString()

      // Check if this is the first phase being started (to update sim_runs status)
      // First phase = no other phases have been started/completed yet
      const isFirstPhase = !allPhases.some(p =>
        p.phase_id !== phaseId && (p.status === 'active' || p.status === 'completed')
      )

      // Update phase status
      const { error: phaseError } = await supabase
        .from('phases')
        .update({
          status: 'active' as PhaseStatus,
          started_at: startedAt,
        })
        .eq('phase_id', phaseId)

      if (phaseError) throw phaseError

      // Update simulation: set current_phase_id and status
      // If first phase, also update status to 'in_progress' and started_at
      const simUpdate: any = {
        current_phase_id: phaseId,
      }

      if (isFirstPhase) {
        simUpdate.status = 'in_progress'
        simUpdate.started_at = startedAt
      }

      console.log('🔄 Updating sim_runs:', { runId, simUpdate })

      const { data: updateResult, error: simError } = await supabase
        .from('sim_runs')
        .update(simUpdate)
        .eq('run_id', runId)
        .select('run_id, current_phase_id')

      console.log('✅ sim_runs update result:', {
        simError,
        updateResult,
        expected_phase_id: phaseId
      })

      if (simError) {
        console.error('❌ Failed to update sim_runs:', simError)
        throw simError
      }

      // Verify the update actually happened
      const { data: verification } = await supabase
        .from('sim_runs')
        .select('current_phase_id, run_id')
        .eq('run_id', runId)
        .single()

      console.log('🔍 Verification read from DB:', {
        run_id: verification?.run_id,
        current_phase_id_in_db: verification?.current_phase_id,
        expected_phase_id: phaseId,
        match: verification?.current_phase_id === phaseId
      })

      if (verification?.current_phase_id !== phaseId) {
        console.error('⚠️ WARNING: Database verification failed! Phase ID mismatch.')
      }

      // Log event
      await logPhaseEvent('phase_started', runId, phaseId, phase.name, {
        sequence_number: phase.sequence_number,
        started_at: startedAt,
        expected_duration_minutes: phase.default_duration_minutes,
        is_first_phase: isFirstPhase,
      })

      // Update local state
      const updatedPhase = {
        ...phase,
        status: 'active' as PhaseStatus,
        started_at: startedAt,
      }

      set({
        currentPhase: updatedPhase,
        allPhases: allPhases.map((p) =>
          p.phase_id === phaseId ? updatedPhase : p
        ),
        loading: false,
      })

      // Start timer
      startTimer(phase.default_duration_minutes * 60)
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  pausePhase: async () => {
    const { currentPhase, runId, allPhases, pauseTimer } = get()
    if (!currentPhase || !runId) return

    set({ loading: true, error: null })

    try {
      // Update database
      const { error } = await supabase
        .from('phases')
        .update({ status: 'paused' as PhaseStatus })
        .eq('phase_id', currentPhase.phase_id)

      if (error) throw error

      // Log event
      await logPhaseEvent('phase_paused', runId, currentPhase.phase_id, currentPhase.name, {
        sequence_number: currentPhase.sequence_number,
        paused_at: new Date().toISOString(),
      })

      // Update local state
      const updatedPhase = { ...currentPhase, status: 'paused' as PhaseStatus }
      set({
        currentPhase: updatedPhase,
        allPhases: allPhases.map((p) =>
          p.phase_id === currentPhase.phase_id ? updatedPhase : p
        ),
        loading: false,
      })

      // Pause timer
      pauseTimer()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  resumePhase: async () => {
    const { currentPhase, runId, allPhases, resumeTimer } = get()
    if (!currentPhase || !runId) return

    set({ loading: true, error: null })

    try {
      // Update database
      const { error } = await supabase
        .from('phases')
        .update({ status: 'active' as PhaseStatus })
        .eq('phase_id', currentPhase.phase_id)

      if (error) throw error

      // Log event
      await logPhaseEvent('phase_resumed', runId, currentPhase.phase_id, currentPhase.name, {
        sequence_number: currentPhase.sequence_number,
        resumed_at: new Date().toISOString(),
      })

      // Update local state
      const updatedPhase = { ...currentPhase, status: 'active' as PhaseStatus }
      set({
        currentPhase: updatedPhase,
        allPhases: allPhases.map((p) =>
          p.phase_id === currentPhase.phase_id ? updatedPhase : p
        ),
        loading: false,
      })

      // Resume timer
      resumeTimer()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  endPhase: async () => {
    const { currentPhase, runId, allPhases, stopTimer, timer } = get()
    if (!currentPhase || !runId) return

    set({ loading: true, error: null })

    try {
      const endedAt = new Date().toISOString()
      const startedAt = currentPhase.started_at ? new Date(currentPhase.started_at) : new Date()
      const actualDurationMinutes = Math.ceil((new Date(endedAt).getTime() - startedAt.getTime()) / 60000)

      console.log('🏁 Ending phase:', {
        phase_id: currentPhase.phase_id,
        phase_name: currentPhase.name,
        sequence: currentPhase.sequence_number
      })

      // Update phase in database
      const { error } = await supabase
        .from('phases')
        .update({
          status: 'completed' as PhaseStatus,
          ended_at: endedAt,
          actual_duration_minutes: actualDurationMinutes,
        })
        .eq('phase_id', currentPhase.phase_id)

      if (error) throw error

      // Keep current_phase_id pointing to this completed phase
      // (it will be updated when next phase starts)
      console.log('✅ Phase ended, current_phase_id still points to:', currentPhase.phase_id)

      // Log event
      await logPhaseEvent('phase_ended', runId, currentPhase.phase_id, currentPhase.name, {
        sequence_number: currentPhase.sequence_number,
        ended_at: endedAt,
        actual_duration_minutes: actualDurationMinutes,
      })

      // Update local state
      const updatedPhase = {
        ...currentPhase,
        status: 'completed' as PhaseStatus,
        ended_at: endedAt,
        actual_duration_minutes: actualDurationMinutes,
      }

      set({
        currentPhase: updatedPhase,
        allPhases: allPhases.map((p) =>
          p.phase_id === currentPhase.phase_id ? updatedPhase : p
        ),
        loading: false,
      })

      // Stop timer
      stopTimer()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  skipPhase: async (phaseId: string) => {
    const { allPhases, runId, stopTimer } = get()
    if (!runId) return

    const phase = allPhases.find((p) => p.phase_id === phaseId)
    if (!phase) throw new Error('Phase not found')

    set({ loading: true, error: null })

    try {
      // Update database
      const { error } = await supabase
        .from('phases')
        .update({ status: 'skipped' as PhaseStatus })
        .eq('phase_id', phaseId)

      if (error) throw error

      // Log event
      await logPhaseEvent('phase_skipped', runId, phaseId, phase.name, {
        sequence_number: phase.sequence_number,
        skipped_at: new Date().toISOString(),
      })

      // Update local state
      const updatedPhase = { ...phase, status: 'skipped' as PhaseStatus }
      set({
        currentPhase: updatedPhase,
        allPhases: allPhases.map((p) => (p.phase_id === phaseId ? updatedPhase : p)),
        loading: false,
      })

      // Stop timer if this was the active phase
      if (phase.status === 'active') {
        stopTimer()
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  extendPhase: async (additionalMinutes: number) => {
    const { currentPhase, runId, allPhases, extendTimer } = get()
    if (!currentPhase || !runId) return

    set({ loading: true, error: null })

    try {
      const newDuration = (currentPhase.actual_duration_minutes || currentPhase.default_duration_minutes) + additionalMinutes

      // Update database
      const { error } = await supabase
        .from('phases')
        .update({ actual_duration_minutes: newDuration })
        .eq('phase_id', currentPhase.phase_id)

      if (error) throw error

      // Log event
      await logPhaseEvent('phase_extended', runId, currentPhase.phase_id, currentPhase.name, {
        sequence_number: currentPhase.sequence_number,
        additional_minutes: additionalMinutes,
        new_duration_minutes: newDuration,
        extended_at: new Date().toISOString(),
      })

      // Update local state
      const updatedPhase = {
        ...currentPhase,
        actual_duration_minutes: newDuration,
      }

      set({
        currentPhase: updatedPhase,
        allPhases: allPhases.map((p) =>
          p.phase_id === currentPhase.phase_id ? updatedPhase : p
        ),
        loading: false,
      })

      // Extend timer
      extendTimer(additionalMinutes * 60)
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // ========================================================================
  // TIMER ACTIONS
  // ========================================================================

  startTimer: (durationSeconds: number) => {
    const { stopTimer } = get()

    // Stop any existing timer
    stopTimer()

    const intervalId = setInterval(() => {
      set((state) => {
        const newRemaining = state.timer.remainingSeconds - 1

        if (newRemaining <= 0) {
          // Timer expired
          get().stopTimer()
          // Note: We don't auto-advance phase, just stop timer
          // Facilitator must manually end the phase
          return {
            timer: {
              ...state.timer,
              remainingSeconds: 0,
              isActive: false,
            },
          }
        }

        return {
          timer: {
            ...state.timer,
            remainingSeconds: newRemaining,
          },
        }
      })
    }, 1000)

    set({
      timer: {
        remainingSeconds: durationSeconds,
        isActive: true,
        intervalId,
      },
    })
  },

  pauseTimer: () => {
    set((state) => {
      if (state.timer.intervalId) {
        clearInterval(state.timer.intervalId)
      }
      return {
        timer: {
          ...state.timer,
          isActive: false,
          intervalId: null,
        },
      }
    })
  },

  resumeTimer: () => {
    const { timer, startTimer } = get()
    if (timer.remainingSeconds > 0) {
      startTimer(timer.remainingSeconds)
    }
  },

  stopTimer: () => {
    set((state) => {
      if (state.timer.intervalId) {
        clearInterval(state.timer.intervalId)
      }
      return {
        timer: {
          remainingSeconds: 0,
          isActive: false,
          intervalId: null,
        },
      }
    })
  },

  extendTimer: (additionalSeconds: number) => {
    set((state) => ({
      timer: {
        ...state.timer,
        remainingSeconds: state.timer.remainingSeconds + additionalSeconds,
      },
    }))
  },

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  getCurrentPhaseIndex: () => {
    const { currentPhase, allPhases } = get()
    if (!currentPhase) return -1  // Return -1 when no phase is active yet
    return allPhases.findIndex((p) => p.phase_id === currentPhase.phase_id)
  },

  getNextPhase: () => {
    const { getCurrentPhaseIndex, allPhases } = get()
    const currentIndex = getCurrentPhaseIndex()
    return allPhases[currentIndex + 1] || null
  },

  getPreviousPhase: () => {
    const { getCurrentPhaseIndex, allPhases } = get()
    const currentIndex = getCurrentPhaseIndex()
    return allPhases[currentIndex - 1] || null
  },

  isLastPhase: () => {
    const { getCurrentPhaseIndex, allPhases } = get()
    const currentIndex = getCurrentPhaseIndex()
    return currentIndex === allPhases.length - 1
  },

  getPhaseBySequence: (sequence: number) => {
    const { allPhases } = get()
    return allPhases.find((p) => p.sequence_number === sequence) || null
  },
}))
