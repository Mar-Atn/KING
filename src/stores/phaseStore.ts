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

      // Find active or most recent phase
      const activePhase = phases?.find((p) => p.status === 'active')
      const lastCompletedPhase = phases
        ?.filter((p) => p.status === 'completed')
        .sort((a, b) => b.sequence_number - a.sequence_number)[0]

      const currentPhase = activePhase || lastCompletedPhase || null

      // If there's an active phase with a started_at time, start the timer
      if (activePhase && activePhase.started_at) {
        const startedAt = new Date(activePhase.started_at)
        const now = new Date()
        const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
        const totalDurationSeconds = (activePhase.actual_duration_minutes || activePhase.default_duration_minutes) * 60
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
    const { allPhases, runId, getCurrentPhaseIndex, startTimer } = get()
    if (!runId) throw new Error('No run_id set')

    const phase = allPhases.find((p) => p.phase_id === phaseId)
    if (!phase) throw new Error('Phase not found')

    const currentIndex = getCurrentPhaseIndex()

    // Validation: Can only start the next phase in sequence
    if (phase.sequence_number !== currentIndex + 1) {
      throw new Error('Cannot skip phases. Must complete phases in order.')
    }

    set({ loading: true, error: null })

    try {
      const startedAt = new Date().toISOString()

      // Check if this is the first phase being started (to update sim_runs status)
      const isFirstPhase = allPhases.every(p =>
        p.phase_id === phaseId || p.status === 'pending' || p.status === 'skipped'
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

      // If first phase, update simulation status to 'in_progress'
      if (isFirstPhase) {
        const { error: simError } = await supabase
          .from('sim_runs')
          .update({
            status: 'in_progress',
            started_at: startedAt,
          })
          .eq('run_id', runId)

        if (simError) throw simError
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

      // Update database
      const { error } = await supabase
        .from('phases')
        .update({
          status: 'completed' as PhaseStatus,
          ended_at: endedAt,
          actual_duration_minutes: actualDurationMinutes,
        })
        .eq('phase_id', currentPhase.phase_id)

      if (error) throw error

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
