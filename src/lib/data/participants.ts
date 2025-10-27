/**
 * Data Access Layer - Participants
 *
 * Provides functions for participant management and role assignment
 * Handles user registration, selection, and role distribution
 */

import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type User = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']
type Role = Database['public']['Tables']['roles']['Row']
type RoleUpdate = Database['public']['Tables']['roles']['Update']

export interface RoleAssignment {
  role_id: string
  user_id: string
}

/**
 * Get all registered users for a specific event (sim run)
 * Note: Using current_event_code which should match run_id
 */
export async function getRegisteredUsers(eventCode: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('current_event_code', eventCode)
    .eq('role', 'participant')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch registered users: ${error.message}`)
  return data || []
}

/**
 * Get all users with specific status for event
 */
export async function getUsersByStatus(
  eventCode: string,
  status: Database['public']['Enums']['user_status']
): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('current_event_code', eventCode)
    .eq('status', status)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch users by status: ${error.message}`)
  return data || []
}

/**
 * Get all human roles for a simulation (not assigned yet)
 */
export async function getUnassignedHumanRoles(runId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*, clans(name, color_hex, emblem_url)')
    .eq('run_id', runId)
    .eq('participant_type', 'human')
    .is('assigned_user_id', null)
    .order('clan_id', { ascending: true })

  if (error) throw new Error(`Failed to fetch unassigned roles: ${error.message}`)
  return data || []
}

/**
 * Get all human roles for a simulation (including assigned)
 */
export async function getAllHumanRoles(runId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*, clans(name, color_hex, emblem_url)')
    .eq('run_id', runId)
    .eq('participant_type', 'human')
    .order('clan_id', { ascending: true })

  if (error) throw new Error(`Failed to fetch human roles: ${error.message}`)
  return data || []
}

/**
 * Assign roles to users (bulk operation)
 * Updates both roles table (assigned_user_id) and users table (status)
 */
export async function assignRolesToUsers(
  assignments: RoleAssignment[]
): Promise<void> {
  // Update roles with assigned_user_id
  const roleUpdates = assignments.map(({ role_id, user_id }) =>
    supabase
      .from('roles')
      .update({ assigned_user_id: user_id })
      .eq('role_id', role_id)
  )

  // Update users status to 'role_assigned'
  const userUpdates = assignments.map(({ user_id }) =>
    supabase
      .from('users')
      .update({ status: 'role_assigned' })
      .eq('id', user_id)
  )

  // Execute all updates
  const results = await Promise.all([...roleUpdates, ...userUpdates])

  // Check for errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    throw new Error(`Failed to assign roles: ${errors.map(e => e.error?.message).join(', ')}`)
  }
}

/**
 * Randomly assign unassigned roles to selected users
 * Returns the assignments made
 */
export async function randomlyAssignRoles(
  runId: string,
  userIds: string[]
): Promise<RoleAssignment[]> {
  // Get unassigned human roles
  const roles = await getUnassignedHumanRoles(runId)

  if (roles.length !== userIds.length) {
    throw new Error(
      `Mismatch: ${userIds.length} users but ${roles.length} unassigned roles`
    )
  }

  // Shuffle users for random assignment
  const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5)

  // Create assignments
  const assignments: RoleAssignment[] = roles.map((role, index) => ({
    role_id: role.role_id,
    user_id: shuffledUsers[index]
  }))

  // Perform assignments
  await assignRolesToUsers(assignments)

  return assignments
}

/**
 * Update user status
 */
export async function updateUserStatus(
  userId: string,
  status: Database['public']['Enums']['user_status']
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId)

  if (error) throw new Error(`Failed to update user status: ${error.message}`)
}

/**
 * Get role assigned to a specific user
 */
export async function getRoleForUser(userId: string, runId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('*, clans(name, about, key_priorities, color_hex, emblem_url)')
    .eq('run_id', runId)
    .eq('assigned_user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch role for user: ${error.message}`)
  return data
}

/**
 * Get all assigned roles for a simulation with user details
 */
export async function getAssignedRoles(runId: string): Promise<(Role & { user?: User })[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*, clans(name, color_hex, emblem_url), users!roles_assigned_user_id_fkey(*)')
    .eq('run_id', runId)
    .eq('participant_type', 'human')
    .not('assigned_user_id', 'is', null)

  if (error) throw new Error(`Failed to fetch assigned roles: ${error.message}`)
  return data || []
}

/**
 * Check if a user has been assigned a role for a simulation
 */
export async function hasRoleAssignment(userId: string, runId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('roles')
    .select('role_id')
    .eq('run_id', runId)
    .eq('assigned_user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to check role assignment: ${error.message}`)
  return data !== null
}

/**
 * Unassign a role from a user
 */
export async function unassignRole(roleId: string): Promise<void> {
  const { error } = await supabase
    .from('roles')
    .update({ assigned_user_id: null })
    .eq('role_id', roleId)

  if (error) throw new Error(`Failed to unassign role: ${error.message}`)
}

/**
 * Get count of assigned vs total human roles
 */
export async function getRoleAssignmentStats(runId: string): Promise<{
  total: number
  assigned: number
  unassigned: number
}> {
  const { data, error } = await supabase
    .from('roles')
    .select('role_id, assigned_user_id')
    .eq('run_id', runId)
    .eq('participant_type', 'human')

  if (error) throw new Error(`Failed to get assignment stats: ${error.message}`)

  const total = data?.length || 0
  const assigned = data?.filter(r => r.assigned_user_id !== null).length || 0
  const unassigned = total - assigned

  return { total, assigned, unassigned }
}
