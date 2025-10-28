import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePhaseStore } from '../stores/phaseStore'
import type { Phase } from '../types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================================================
// HOOK: usePhaseSync
// ============================================================================
// Subscribes to real-time phase updates from Supabase and syncs with local store
// Automatically loads phases on mount and cleans up subscriptions on unmount

export function usePhaseSync(runId: string | null) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const { loadPhases, setCurrentPhase, allPhases } = usePhaseStore()

  useEffect(() => {
    if (!runId) {
      setConnectionStatus('disconnected')
      return
    }

    // Initial load
    loadPhases(runId)

    let channel: RealtimeChannel

    // Subscribe to phase updates
    const subscribe = async () => {
      channel = supabase
        .channel(`sim_run:${runId}:phases`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'phases',
            filter: `run_id=eq.${runId}`,
          },
          (payload) => {
            const updatedPhase = payload.new as Phase

            // Update the phase in the local store
            const phaseIndex = allPhases.findIndex(
              (p) => p.phase_id === updatedPhase.phase_id
            )

            if (phaseIndex !== -1) {
              // If this phase became active, set it as current
              if (updatedPhase.status === 'active') {
                setCurrentPhase(updatedPhase)
              }

              // Reload all phases to ensure consistency
              loadPhases(runId)
            }
          }
        )
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'phases',
          filter: `run_id=eq.${runId}`,
        }, () => {
          // New phase added, reload all
          loadPhases(runId)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected')
          }
        })
    }

    subscribe()

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe()
      }
      setConnectionStatus('disconnected')
    }
  }, [runId])

  return { connectionStatus }
}

// ============================================================================
// HOOK: useSimRunSync
// ============================================================================
// Subscribes to sim_run updates for overall simulation status changes

export function useSimRunSync(runId: string | null) {
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!runId) {
      setConnectionStatus('disconnected')
      return
    }

    let channel: RealtimeChannel

    // Load initial status
    const loadInitialStatus = async () => {
      const { data } = await supabase
        .from('sim_runs')
        .select('status')
        .eq('run_id', runId)
        .single()

      if (data) {
        setSimulationStatus(data.status)
      }
    }

    loadInitialStatus()

    // Subscribe to sim_runs updates
    const subscribe = async () => {
      channel = supabase
        .channel(`sim_run:${runId}:status`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sim_runs',
            filter: `run_id=eq.${runId}`,
          },
          (payload) => {
            const updatedRun = payload.new as any
            setSimulationStatus(updatedRun.status)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected')
          }
        })
    }

    subscribe()

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe()
      }
      setConnectionStatus('disconnected')
    }
  }, [runId])

  return { simulationStatus, connectionStatus }
}
