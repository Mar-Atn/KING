/**
 * Data Access Layer - Simulations
 *
 * Provides reusable functions for sim_runs table operations
 * Extracted from simulationStore.ts and Dashboard.tsx
 */

import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type SimRun = Database['public']['Tables']['sim_runs']['Row']
type SimRunInsert = Database['public']['Tables']['sim_runs']['Insert']
type SimRunUpdate = Database['public']['Tables']['sim_runs']['Update']

/**
 * Get all simulations for a specific facilitator
 * Ordered by created_at (newest first)
 */
export async function getSimulationsByFacilitator(facilitatorId: string): Promise<SimRun[]> {
  const { data, error } = await supabase
    .from('sim_runs')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch simulations: ${error.message}`)
  return data || []
}

/**
 * Get a single simulation by run_id
 */
export async function getSimulationById(runId: string): Promise<SimRun> {
  const { data, error } = await supabase
    .from('sim_runs')
    .select('*')
    .eq('run_id', runId)
    .single()

  if (error) throw new Error(`Failed to fetch simulation: ${error.message}`)
  return data
}

/**
 * Create a new simulation
 */
export async function createSimulation(simulation: SimRunInsert): Promise<SimRun> {
  const { data, error } = await supabase
    .from('sim_runs')
    .insert(simulation)
    .select()
    .single()

  if (error) throw new Error(`Failed to create simulation: ${error.message}`)
  return data
}

/**
 * Update simulation basic information
 */
export async function updateSimulation(runId: string, updates: SimRunUpdate): Promise<SimRun> {
  const { data, error } = await supabase
    .from('sim_runs')
    .update(updates)
    .eq('run_id', runId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update simulation: ${error.message}`)
  return data
}

/**
 * Update simulation status
 */
export async function updateSimulationStatus(
  runId: string,
  status: SimRun['status'],
  timestamps?: { started_at?: string; completed_at?: string }
): Promise<void> {
  const updates: SimRunUpdate = { status, ...timestamps }

  const { error } = await supabase
    .from('sim_runs')
    .update(updates)
    .eq('run_id', runId)

  if (error) throw new Error(`Failed to update simulation status: ${error.message}`)
}

/**
 * Delete a simulation
 * CASCADE will automatically delete related clans, roles, phases, etc.
 */
export async function deleteSimulation(runId: string): Promise<void> {
  const { error } = await supabase
    .from('sim_runs')
    .delete()
    .eq('run_id', runId)

  if (error) throw new Error(`Failed to delete simulation: ${error.message}`)
}

/**
 * Get recent simulations with limit
 * Used in Dashboard for quick overview
 */
export async function getRecentSimulations(
  facilitatorId: string,
  limit: number = 10
): Promise<SimRun[]> {
  const { data, error } = await supabase
    .from('sim_runs')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch recent simulations: ${error.message}`)
  return data || []
}

/**
 * Get simulation with full details (includes clans, roles, phases)
 * Used in edit/view scenarios
 */
export async function getSimulationWithDetails(runId: string): Promise<{
  simulation: SimRun
  clans: Array<any>
  roles: Array<any>
  phases: Array<any>
}> {
  // Get simulation
  const simulation = await getSimulationById(runId)

  // Get clans
  const { data: clans, error: clansError } = await supabase
    .from('clans')
    .select('*')
    .eq('run_id', runId)
    .order('sequence_number')

  if (clansError) throw new Error(`Failed to fetch clans: ${clansError.message}`)

  // Get roles with clan names
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*, clans(name)')
    .eq('run_id', runId)

  if (rolesError) throw new Error(`Failed to fetch roles: ${rolesError.message}`)

  // Get phases
  const { data: phases, error: phasesError } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .order('sequence_number')

  if (phasesError) throw new Error(`Failed to fetch phases: ${phasesError.message}`)

  return {
    simulation,
    clans: clans || [],
    roles: roles || [],
    phases: phases || []
  }
}

/**
 * Check if a simulation exists
 */
export async function simulationExists(runId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('sim_runs')
    .select('run_id')
    .eq('run_id', runId)
    .single()

  return !error && !!data
}

/**
 * Get simulation count for a facilitator
 */
export async function getSimulationCount(facilitatorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('sim_runs')
    .select('*', { count: 'exact', head: true })
    .eq('facilitator_id', facilitatorId)

  if (error) throw new Error(`Failed to count simulations: ${error.message}`)
  return count || 0
}

/**
 * Get simulations by status
 */
export async function getSimulationsByStatus(
  facilitatorId: string,
  status: SimRun['status']
): Promise<SimRun[]> {
  const { data, error } = await supabase
    .from('sim_runs')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch simulations by status: ${error.message}`)
  return data || []
}
