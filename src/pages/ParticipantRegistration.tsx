/**
 * Participant Registration Page
 *
 * Full workflow for registering participants to a simulation:
 * 1. View all users in system (non-facilitators)
 * 2. Filter/sort by name, email, registration date
 * 3. Check-in users for this sim (up to available roles)
 * 4. Pre-assign specific roles (optional)
 * 5. Auto-assign remaining roles
 * 6. Swap role assignments
 * 7. Confirm and return to phases dashboard
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getAllHumanRoles, assignRolesToUsers, type RoleAssignment } from '../lib/data/participants'
import type { User, Role, SimRun } from '../types/database'

type SortField = 'name' | 'email' | 'created_at'
type SortDirection = 'asc' | 'desc'

export function ParticipantRegistration() {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()

  // Data
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [busyUserIds, setBusyUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Registration state
  const [checkedInUserIds, setCheckedInUserIds] = useState<Set<string>>(new Set())
  const [roleAssignments, setRoleAssignments] = useState<Map<string, string>>(new Map()) // user_id -> role_id
  const [autoAssigned, setAutoAssigned] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [swapMode, setSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState<string | null>(null)

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Load data
  useEffect(() => {
    if (!runId) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [simResult, usersResult, rolesData, busyUsersResult] = await Promise.all([
          supabase.from('sim_runs').select('*').eq('run_id', runId).single(),
          supabase.from('users').select('*').eq('role', 'participant').order('display_name'),
          getAllHumanRoles(runId),
          // Query for users who are busy (assigned to roles in active simulations, excluding current sim)
          supabase
            .from('roles')
            .select('assigned_user_id, run_id, sim_runs!inner(status)')
            .not('assigned_user_id', 'is', null)
            .neq('run_id', runId)
            .in('sim_runs.status', ['setup', 'ready', 'in_progress'])
        ])

        if (simResult.error) throw simResult.error
        if (usersResult.error) throw usersResult.error
        if (busyUsersResult.error) throw busyUsersResult.error

        setSimulation(simResult.data)
        setAllUsers(usersResult.data || [])
        setRoles(rolesData)

        // Extract busy user IDs
        const busyIds = new Set(
          busyUsersResult.data
            .filter(r => r.assigned_user_id)
            .map(r => r.assigned_user_id as string)
        )
        setBusyUserIds(busyIds)

        // Pre-populate with already assigned roles
        const existingAssignments = new Map<string, string>()
        const existingCheckedIn = new Set<string>()
        rolesData.forEach(role => {
          if (role.assigned_user_id) {
            existingAssignments.set(role.assigned_user_id, role.role_id)
            existingCheckedIn.add(role.assigned_user_id)
          }
        })
        setRoleAssignments(existingAssignments)
        setCheckedInUserIds(existingCheckedIn)
        if (existingAssignments.size > 0) {
          setAutoAssigned(true)
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [runId])

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = allUsers.filter(user => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          user.display_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        )
      }
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal
      if (sortField === 'name') {
        aVal = a.display_name.toLowerCase()
        bVal = b.display_name.toLowerCase()
      } else if (sortField === 'email') {
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
      } else {
        aVal = a.created_at
        bVal = b.created_at
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [allUsers, searchQuery, sortField, sortDirection])

  // Stats
  const totalHumanRoles = roles.length
  const registeredCount = checkedInUserIds.size
  const canRegisterMore = registeredCount < totalHumanRoles

  // Toggle check-in
  const toggleCheckIn = (userId: string) => {
    const newCheckedIn = new Set(checkedInUserIds)
    if (newCheckedIn.has(userId)) {
      newCheckedIn.delete(userId)
      // Remove role assignment if exists
      const newAssignments = new Map(roleAssignments)
      newAssignments.delete(userId)
      setRoleAssignments(newAssignments)
    } else {
      if (canRegisterMore || newCheckedIn.has(userId)) {
        newCheckedIn.add(userId)
      }
    }
    setCheckedInUserIds(newCheckedIn)
    setAutoAssigned(false) // Reset auto-assign state
  }

  // Pre-assign role
  const assignRole = (userId: string, roleId: string) => {
    const newAssignments = new Map(roleAssignments)
    newAssignments.set(userId, roleId)
    setRoleAssignments(newAssignments)
  }

  // Auto-assign remaining roles
  const handleAutoAssign = () => {
    const unassignedUsers = Array.from(checkedInUserIds).filter(
      userId => !roleAssignments.has(userId)
    )
    const unassignedRoles = roles.filter(
      role => !Array.from(roleAssignments.values()).includes(role.role_id)
    )

    // Shuffle and assign
    const shuffled = [...unassignedUsers].sort(() => Math.random() - 0.5)
    const newAssignments = new Map(roleAssignments)
    shuffled.forEach((userId, index) => {
      if (unassignedRoles[index]) {
        newAssignments.set(userId, unassignedRoles[index].role_id)
      }
    })

    setRoleAssignments(newAssignments)
    setAutoAssigned(true)
  }

  // Swap two role assignments
  const swapRoles = (userId1: string, userId2: string) => {
    const role1 = roleAssignments.get(userId1)
    const role2 = roleAssignments.get(userId2)
    if (!role1 || !role2) return

    const newAssignments = new Map(roleAssignments)
    newAssignments.set(userId1, role2)
    newAssignments.set(userId2, role1)
    setRoleAssignments(newAssignments)
  }

  // Handle swap mode
  const handleSwapClick = (userId: string) => {
    if (!selectedForSwap) {
      // First selection
      setSelectedForSwap(userId)
    } else if (selectedForSwap === userId) {
      // Cancel selection
      setSelectedForSwap(null)
    } else {
      // Second selection - perform swap
      swapRoles(selectedForSwap, userId)
      setSelectedForSwap(null)
      setSwapMode(false)
    }
  }

  // Get available (unassigned) roles
  const getAvailableRoles = () => {
    const assignedRoleIds = new Set(roleAssignments.values())
    return roles.filter(role => !assignedRoleIds.has(role.role_id))
  }

  // Confirm registration
  const handleConfirm = async () => {
    if (!runId) return

    setConfirming(true)
    setError(null)

    try {
      // Convert Map to assignments array
      const assignments: RoleAssignment[] = Array.from(roleAssignments.entries()).map(
        ([user_id, role_id]) => ({ user_id, role_id })
      )

      await assignRolesToUsers(assignments)

      // Navigate back to simulation page
      navigate(`/facilitator/simulation/${runId}`)
    } catch (err: any) {
      setError(err.message)
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neutral-600">Loading registration...</div>
      </div>
    )
  }

  if (error && !simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-error mb-4">{error}</div>
          <Link to="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const unassignedCount = totalHumanRoles - roleAssignments.size

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b-2 border-neutral-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to={`/facilitator/simulation/${runId}`}
                className="text-sm text-primary hover:underline mb-2 inline-block"
              >
                ← Back to Simulation
              </Link>
              <h1 className="font-heading text-3xl text-primary">
                Participant Registration
              </h1>
              <p className="text-neutral-600">
                {simulation?.run_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="bg-white rounded-lg border-2 border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalHumanRoles}</div>
              <div className="text-sm text-neutral-600">Total Participants</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${registeredCount === totalHumanRoles ? 'text-success' : 'text-warning'}`}>
                {registeredCount}
              </div>
              <div className="text-sm text-neutral-600">Registered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">{roleAssignments.size}</div>
              <div className="text-sm text-neutral-600">Assigned Roles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-500">{unassignedCount}</div>
              <div className="text-sm text-neutral-600">Unassigned</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!autoAssigned ? (
          /* Step 1: Check-in Users */
          <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-primary">
                Step 1: Check-in Participants
              </h2>
              {busyUserIds.size > 0 && (
                <div className="text-sm text-warning">
                  {busyUserIds.size} user{busyUserIds.size !== 1 ? 's' : ''} busy in other simulations
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg"
              />
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-')
                  setSortField(field as SortField)
                  setSortDirection(dir as SortDirection)
                }}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="created_at-desc">Newest First</option>
              </select>
            </div>

            {/* User List */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-neutral-100 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium">
                <div className="col-span-1">Check-in</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-3">Assign Role</div>
              </div>
              <div className="divide-y divide-neutral-200 max-h-96 overflow-y-auto">
                {filteredUsers.map(user => {
                  const isCheckedIn = checkedInUserIds.has(user.id)
                  const roleId = roleAssignments.get(user.id)
                  const role = roleId ? roles.find(r => r.role_id === roleId) : null
                  const availableRoles = getAvailableRoles()
                  const isBusy = busyUserIds.has(user.id)

                  return (
                    <div
                      key={user.id}
                      className={`px-4 py-3 grid grid-cols-12 gap-4 items-center ${
                        isCheckedIn ? 'bg-success bg-opacity-5' : isBusy ? 'bg-neutral-100' : ''
                      }`}
                    >
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={isCheckedIn}
                          onChange={() => toggleCheckIn(user.id)}
                          disabled={isBusy || (!isCheckedIn && !canRegisterMore)}
                          className="rounded border-neutral-300 text-success focus:ring-success disabled:opacity-50"
                        />
                      </div>
                      <div className={`col-span-2 font-medium ${isBusy ? 'text-neutral-400' : ''}`}>
                        {user.display_name}
                      </div>
                      <div className={`col-span-3 text-sm ${isBusy ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {user.email}
                      </div>
                      <div className="col-span-1">
                        {isBusy ? (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-warning mr-2" />
                            <span className="text-xs text-warning font-medium">Busy</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-neutral-400 mr-2" />
                            <span className="text-xs text-neutral-500">Offline</span>
                          </>
                        )}
                      </div>
                      <div className="col-span-2 text-sm text-neutral-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div className="col-span-3">
                        {isBusy ? (
                          <span className="text-xs text-warning italic">In another simulation</span>
                        ) : isCheckedIn && !role ? (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                assignRole(user.id, e.target.value)
                              }
                            }}
                            className="w-full px-3 py-1 text-sm border border-neutral-300 rounded hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                            disabled={availableRoles.length === 0}
                          >
                            <option value="">Assign role...</option>
                            {availableRoles.map(r => (
                              <option key={r.role_id} value={r.role_id}>
                                {r.name} {r.position ? `(${r.position})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : isCheckedIn && role ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-success">{role.name}</div>
                              {role.position && (
                                <div className="text-xs text-neutral-500">{role.position}</div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const newAssignments = new Map(roleAssignments)
                                newAssignments.delete(user.id)
                                setRoleAssignments(newAssignments)
                              }}
                              className="text-xs text-error hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">Check-in first</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                {registeredCount < totalHumanRoles && (
                  <span className="text-warning">
                    Need {totalHumanRoles - registeredCount} more participants
                  </span>
                )}
                {registeredCount === totalHumanRoles && (
                  <span className="text-success">✓ All positions filled</span>
                )}
                {registeredCount > totalHumanRoles && (
                  <span className="text-error">Too many participants!</span>
                )}
              </div>
              <button
                onClick={handleAutoAssign}
                disabled={registeredCount === 0}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Registration & Auto-Assign Roles
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Review and Swap Assignments */
          <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-xl text-primary">
                  Step 2: Review Role Assignments
                </h2>
                <p className="text-neutral-600 mt-1">
                  Review assignments and swap if needed, then confirm to complete registration.
                </p>
              </div>
              <button
                onClick={() => {
                  setSwapMode(!swapMode)
                  setSelectedForSwap(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  swapMode
                    ? 'bg-warning text-white hover:bg-opacity-90'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {swapMode ? 'Cancel Swap Mode' : 'Enable Swap Mode'}
              </button>
            </div>

            {swapMode && (
              <div className="bg-warning bg-opacity-10 border border-warning rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-neutral-800">
                  {selectedForSwap
                    ? '👉 Now click on the second participant to swap roles'
                    : '👉 Click on a participant to select them for swapping'}
                </p>
              </div>
            )}

            {/* Assignments by Clan */}
            <div className="space-y-6 mb-6">
              {[...new Set(roles.map(r => r.clan_id))].map(clanId => {
                const clanRoles = roles.filter(r => r.clan_id === clanId)
                const clanData = (clanRoles[0] as any)?.clans

                return (
                  <div key={clanId} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <div
                      className="px-4 py-3 font-medium"
                      style={{ backgroundColor: `${clanData?.color_hex || '#8B7355'}20` }}
                    >
                      {clanData?.name || 'Unknown Clan'}
                    </div>
                    <div className="divide-y divide-neutral-200">
                      {clanRoles.map(role => {
                        const userId = Array.from(roleAssignments.entries()).find(
                          ([, rid]) => rid === role.role_id
                        )?.[0]
                        const user = userId ? allUsers.find(u => u.id === userId) : null
                        const isSelected = swapMode && selectedForSwap === userId

                        return (
                          <div
                            key={role.role_id}
                            className={`px-4 py-3 flex items-center justify-between transition-colors ${
                              swapMode && user
                                ? 'cursor-pointer hover:bg-primary hover:bg-opacity-5'
                                : ''
                            } ${isSelected ? 'bg-warning bg-opacity-20 border-l-4 border-warning' : ''}`}
                            onClick={() => {
                              if (swapMode && user) {
                                handleSwapClick(userId)
                              }
                            }}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{role.name}</div>
                              {role.position && (
                                <div className="text-sm text-neutral-500">{role.position}</div>
                              )}
                            </div>
                            <div className="text-right flex items-center gap-3">
                              {user ? (
                                <>
                                  <div>
                                    <div className="font-medium text-success">{user.display_name}</div>
                                    <div className="text-xs text-neutral-500">{user.email}</div>
                                  </div>
                                  {swapMode && (
                                    <div className="text-warning">
                                      {isSelected ? '✓' : '↔'}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-neutral-400 italic">Unassigned</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setAutoAssigned(false)
                  setSwapMode(false)
                  setSelectedForSwap(null)
                }}
                className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                ← Back to Check-in
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || roleAssignments.size !== totalHumanRoles || swapMode}
                className="px-8 py-3 bg-success text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? 'Confirming...' : swapMode ? 'Exit Swap Mode First' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
