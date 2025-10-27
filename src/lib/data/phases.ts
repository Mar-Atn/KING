/**
 * Data Access Layer - Phases
 *
 * Provides reusable functions for phases table operations
 * Extracted from phaseStore.ts and Dashboard.tsx
 */

import { supabase } from '../supabase'
import type { Database } from '../../types/database'
import type { Phase, PhaseStatus } from '../../types/database'

type PhaseInsert = Database['public']['Tables']['phases']['Insert']
type PhaseUpdate = Database['public']['Tables']['phases']['Update']

/**
 * Get all phases for a simulation run
 * Ordered by sequence_number (ascending)
 */
export async function getPhasesByRunId(runId: string): Promise<Phase[]> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .order('sequence_number', { ascending: true })

  if (error) throw new Error(`Failed to fetch phases: ${error.message}`)
  return data || []
}

/**
 * Get a single phase by phase_id
 */
export async function getPhaseById(phaseId: string): Promise<Phase> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('phase_id', phaseId)
    .single()

  if (error) throw new Error(`Failed to fetch phase: ${error.message}`)
  return data
}

/**
 * Get phase by run_id and sequence_number
 */
export async function getPhaseBySequence(runId: string, sequenceNumber: number): Promise<Phase | null> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .eq('sequence_number', sequenceNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch phase by sequence: ${error.message}`)
  }
  return data
}

/**
 * Get the currently active phase for a simulation
 */
export async function getActivePhase(runId: string): Promise<Phase | null> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No active phase
    throw new Error(`Failed to fetch active phase: ${error.message}`)
  }
  return data
}

/**
 * Get the most recently completed phase for a simulation
 */
export async function getLastCompletedPhase(runId: string): Promise<Phase | null> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .eq('status', 'completed')
    .order('sequence_number', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No completed phases
    throw new Error(`Failed to fetch last completed phase: ${error.message}`)
  }
  return data
}

/**
 * Get current phase (active or last completed)
 * Used in Dashboard and phase tracking
 */
export async function getCurrentPhase(runId: string): Promise<Phase | null> {
  const phases = await getPhasesByRunId(runId)

  const activePhase = phases.find(p => p.status === 'active')
  if (activePhase) return activePhase

  const completedPhases = phases
    .filter(p => p.status === 'completed')
    .sort((a, b) => b.sequence_number - a.sequence_number)

  return completedPhases[0] || null
}

/**
 * Update phase status
 */
export async function updatePhaseStatus(
  phaseId: string,
  status: PhaseStatus,
  timestamps?: { started_at?: string; ended_at?: string }
): Promise<Phase> {
  const updates: PhaseUpdate = { status, ...timestamps }

  const { data, error } = await supabase
    .from('phases')
    .update(updates)
    .eq('phase_id', phaseId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update phase status: ${error.message}`)
  return data
}

/**
 * Update phase timing (duration and actual_duration)
 */
export async function updatePhaseTiming(
  phaseId: string,
  actualDurationMinutes: number
): Promise<Phase> {
  const { data, error } = await supabase
    .from('phases')
    .update({ actual_duration_minutes: actualDurationMinutes })
    .eq('phase_id', phaseId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update phase timing: ${error.message}`)
  return data
}

/**
 * Update phase with custom updates
 */
export async function updatePhase(phaseId: string, updates: PhaseUpdate): Promise<Phase> {
  const { data, error } = await supabase
    .from('phases')
    .update(updates)
    .eq('phase_id', phaseId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update phase: ${error.message}`)
  return data
}

/**
 * Create multiple phases (bulk insert)
 * Used during simulation creation
 */
export async function createPhases(phases: PhaseInsert[]): Promise<Phase[]> {
  const { data, error } = await supabase
    .from('phases')
    .insert(phases)
    .select()

  if (error) throw new Error(`Failed to create phases: ${error.message}`)
  return data || []
}

/**
 * Create a single phase
 */
export async function createPhase(phase: PhaseInsert): Promise<Phase> {
  const { data, error } = await supabase
    .from('phases')
    .insert(phase)
    .select()
    .single()

  if (error) throw new Error(`Failed to create phase: ${error.message}`)
  return data
}

/**
 * Delete all phases for a simulation
 * Used when updating simulation configuration
 */
export async function deletePhasesByRunId(runId: string): Promise<void> {
  const { error } = await supabase
    .from('phases')
    .delete()
    .eq('run_id', runId)

  if (error) throw new Error(`Failed to delete phases: ${error.message}`)
}

/**
 * Delete a single phase
 */
export async function deletePhase(phaseId: string): Promise<void> {
  const { error } = await supabase
    .from('phases')
    .delete()
    .eq('phase_id', phaseId)

  if (error) throw new Error(`Failed to delete phase: ${error.message}`)
}

/**
 * Get phase count for a simulation
 */
export async function getPhaseCount(runId: string): Promise<number> {
  const { count, error } = await supabase
    .from('phases')
    .select('*', { count: 'exact', head: true })
    .eq('run_id', runId)

  if (error) throw new Error(`Failed to count phases: ${error.message}`)
  return count || 0
}

/**
 * Get phases by status
 */
export async function getPhasesByStatus(runId: string, status: PhaseStatus): Promise<Phase[]> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .eq('status', status)
    .order('sequence_number', { ascending: true })

  if (error) throw new Error(`Failed to fetch phases by status: ${error.message}`)
  return data || []
}

/**
 * Check if any phases have been started
 * Used to determine if simulation has begun
 */
export async function hasStartedPhases(runId: string): Promise<boolean> {
  const phases = await getPhasesByRunId(runId)
  return phases.some(p => p.status === 'active' || p.status === 'completed')
}

/**
 * Get next pending phase
 * Returns the first phase with status 'pending' in sequence order
 */
export async function getNextPendingPhase(runId: string): Promise<Phase | null> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .eq('status', 'pending')
    .order('sequence_number', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No pending phases
    throw new Error(`Failed to fetch next pending phase: ${error.message}`)
  }
  return data
}
