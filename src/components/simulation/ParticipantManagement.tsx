/**
 * Participant Management Component
 *
 * Allows facilitator to:
 * - View all registered users
 * - Filter by email domain, online status
 * - Manually select participants
 * - Pre-assign specific users to specific roles
 * - Start role assignment (random + manual)
 */

import { useState, useEffect, useMemo } from 'react'
import {
  getRegisteredUsers,
  getAllHumanRoles,
  assignRolesToUsers,
  randomlyAssignRoles,
  getRoleAssignmentStats,
  type RoleAssignment
} from '../../lib/data/participants'
import type { User, Role } from '../../types/database'

interface ParticipantManagementProps {
  runId: string
  onClose: () => void
  onAssignmentComplete: () => void
}

export function ParticipantManagement({
  runId,
  onClose,
  onAssignmentComplete
}: ParticipantManagementProps) {
  console.log('🎭 ParticipantManagement component mounted, runId:', runId)

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [manualAssignments, setManualAssignments] = useState<Map<string, string>>(new Map()) // user_id -> role_id
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [emailDomainFilter, setEmailDomainFilter] = useState('')
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)

  // Assignment stats
  const [stats, setStats] = useState({ total: 0, assigned: 0, unassigned: 0 })

  // Load users and roles
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [usersData, rolesData, statsData] = await Promise.all([
          getRegisteredUsers(runId),
          getAllHumanRoles(runId),
          getRoleAssignmentStats(runId)
        ])
        setUsers(usersData)
        setRoles(rolesData)
        setStats(statsData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [runId])

  // Extract unique email domains
  const emailDomains = useMemo(() => {
    const domains = new Set(users.map(u => u.email.split('@')[1]))
    return Array.from(domains).sort()
  }, [users])

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          user.display_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Email domain filter
      if (emailDomainFilter) {
        if (!user.email.endsWith(`@${emailDomainFilter}`)) return false
      }

      // Online status filter (placeholder - real online status requires Supabase Presence)
      // For MVP, show all users when this filter is off
      if (showOnlineOnly) {
        // TODO: Implement real-time online status with Supabase Presence
        // For now, show all users
      }

      return true
    })
  }, [users, searchQuery, emailDomainFilter, showOnlineOnly])

  // Get unassigned roles
  const unassignedRoles = useMemo(() => {
    return roles.filter(r => !r.assigned_user_id && !Array.from(manualAssignments.values()).includes(r.role_id))
  }, [roles, manualAssignments])

  // Toggle user selection
  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
      // Also remove any manual assignment
      const newAssignments = new Map(manualAssignments)
      newAssignments.delete(userId)
      setManualAssignments(newAssignments)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  // Select all filtered users
  const selectAll = () => {
    const allIds = new Set(filteredUsers.map(u => u.id))
    setSelectedUserIds(allIds)
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedUserIds(new Set())
    setManualAssignments(new Map())
  }

  // Assign role to user (pre-assignment)
  const assignRoleToUser = (userId: string, roleId: string) => {
    const newAssignments = new Map(manualAssignments)
    newAssignments.set(userId, roleId)
    setManualAssignments(newAssignments)
  }

  // Remove manual assignment
  const removeAssignment = (userId: string) => {
    const newAssignments = new Map(manualAssignments)
    newAssignments.delete(userId)
    setManualAssignments(newAssignments)
  }

  // Start role assignment
  const handleStartAssignment = async () => {
    const selectedCount = selectedUserIds.size
    const availableRolesCount = stats.unassigned

    if (selectedCount !== availableRolesCount) {
      setError(`Please select exactly ${availableRolesCount} users (${selectedCount} selected)`)
      return
    }

    setAssigning(true)
    setError(null)

    try {
      // Separate manual assignments from users needing random assignment
      const manualAssignmentsList: RoleAssignment[] = []
      const usersForRandomAssignment: string[] = []

      selectedUserIds.forEach(userId => {
        const manualRole = manualAssignments.get(userId)
        if (manualRole) {
          manualAssignmentsList.push({ user_id: userId, role_id: manualRole })
        } else {
          usersForRandomAssignment.push(userId)
        }
      })

      // Step 1: Apply manual assignments
      if (manualAssignmentsList.length > 0) {
        await assignRolesToUsers(manualAssignmentsList)
      }

      // Step 2: Randomly assign remaining users to remaining unassigned roles
      if (usersForRandomAssignment.length > 0) {
        await randomlyAssignRoles(runId, usersForRandomAssignment)
      }

      // Success!
      onAssignmentComplete()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
          <div className="text-center text-neutral-600">Loading participants...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl text-primary">Participant Management</h2>
            <p className="text-neutral-600 text-sm mt-1">
              Select {stats.unassigned} participants for role assignment
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{users.length}</div>
            <div className="text-sm text-neutral-600">Registered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{selectedUserIds.size}</div>
            <div className="text-sm text-neutral-600">Selected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{stats.unassigned}</div>
            <div className="text-sm text-neutral-600">Roles Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{manualAssignments.size}</div>
            <div className="text-sm text-neutral-600">Pre-assigned</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or email..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Email Domain */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Domain
              </label>
              <select
                value={emailDomainFilter}
                onChange={(e) => setEmailDomainFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All domains</option>
                {emailDomains.map(domain => (
                  <option key={domain} value={domain}>@{domain}</option>
                ))}
              </select>
            </div>

            {/* Online Status */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-neutral-700">Show online only</span>
              </label>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
            >
              Select All ({filteredUsers.length})
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* User List */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-neutral-100 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-neutral-700">
            <div className="col-span-1 text-center">Select</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Assigned Role</div>
          </div>

          <div className="divide-y divide-neutral-200 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => {
              const isSelected = selectedUserIds.has(user.id)
              const assignedRole = manualAssignments.get(user.id)
              const roleData = assignedRole ? roles.find(r => r.role_id === assignedRole) : null

              return (
                <div
                  key={user.id}
                  className={`px-4 py-3 grid grid-cols-12 gap-4 items-center ${
                    isSelected ? 'bg-primary bg-opacity-5' : 'hover:bg-neutral-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUser(user.id)}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-3">
                    <div className="font-medium text-neutral-900">{user.display_name}</div>
                    {user.full_name && (
                      <div className="text-xs text-neutral-500">{user.full_name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-span-3 text-sm text-neutral-600">
                    {user.email}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.status === 'registered' ? 'bg-neutral-100 text-neutral-600' :
                      user.status === 'role_assigned' ? 'bg-success bg-opacity-10 text-success' :
                      user.status === 'active' ? 'bg-primary bg-opacity-10 text-primary' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {user.status}
                    </span>
                  </div>

                  {/* Role Assignment */}
                  <div className="col-span-3">
                    {isSelected && (
                      <div className="flex gap-2 items-center">
                        <select
                          value={assignedRole || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              assignRoleToUser(user.id, e.target.value)
                            } else {
                              removeAssignment(user.id)
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Random</option>
                          {unassignedRoles.map(role => (
                            <option key={role.role_id} value={role.role_id}>
                              {role.name} ({(role as any).clans?.name})
                            </option>
                          ))}
                          {roleData && (
                            <option value={roleData.role_id}>
                              {roleData.name} ({(roleData as any).clans?.name})
                            </option>
                          )}
                        </select>
                        {assignedRole && (
                          <button
                            onClick={() => removeAssignment(user.id)}
                            className="text-error hover:text-error-dark text-sm"
                            title="Remove assignment"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="px-4 py-8 text-center text-neutral-500">
              No users match your filters
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-600">
              {selectedUserIds.size === stats.unassigned ? (
                <span className="text-success font-medium">✓ Ready to assign</span>
              ) : (
                <span>
                  Select {stats.unassigned - selectedUserIds.size} more user(s)
                </span>
              )}
            </div>

            <button
              onClick={handleStartAssignment}
              disabled={selectedUserIds.size !== stats.unassigned || assigning}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedUserIds.size === stats.unassigned && !assigning
                  ? 'bg-primary text-white hover:bg-opacity-90'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {assigning ? 'Assigning Roles...' : 'Start Role Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
