/**
 * Role Selection Store
 *
 * Manages role and clan assignment logic, including:
 * - Proportional clan distribution algorithm
 * - AI participant allocation strategy
 * - Role/clan selection and toggling
 * - Customizations for clans and roles
 */

import { create } from 'zustand'
import type { Database } from '../types/database'

// Type alias for cleaner code
type SimTemplate = Database['public']['Tables']['simulation_templates']['Row']

// Role assignment interface
export interface RoleAssignment {
  sequence: number
  name: string
  clan: string
  isSelected: boolean
  isAI: boolean
  age?: number
  position?: string
}

// Clan customization interface
export interface ClanCustomization {
  name: string
  description?: string
  priorities?: string[]
  interests?: string[]
  attitudes?: Record<string, string>
}

// Role customization interface
export interface RoleCustomization {
  sequence: number
  name?: string
  background?: string
  traits?: string[]
  position?: string
  age?: number
}

// Role selection state interface
export interface RoleSelectionState {
  // Selected clans
  selectedClans: string[]

  // All role assignments with selection and AI flags
  roleAssignments: RoleAssignment[]

  // Clan customizations
  clanCustomizations: Record<string, ClanCustomization>

  // Role customizations
  roleCustomizations: Record<number, RoleCustomization>

  // Phase durations (stage_number -> minutes)
  phaseDurations: Record<number, number>
}

// Store interface
interface RoleSelectionStore {
  // State
  roleSelection: RoleSelectionState

  // Initialization
  initializeRoleAssignments: (
    template: SimTemplate,
    totalParticipants: number,
    aiParticipants: number
  ) => void

  // Clan Selection
  toggleClan: (clanName: string) => void
  setSelectedClans: (clans: string[]) => void

  // Role Selection
  toggleRole: (roleSequence: number) => void
  setRoleAI: (roleSequence: number, isAI: boolean) => void
  setRoleAssignments: (assignments: RoleAssignment[]) => void

  // Phase Timing
  setPhaseDuration: (stageNumber: number, minutes: number) => void
  setTotalDuration: (template: SimTemplate, totalMinutes: number) => void
  resetPhaseDurations: () => void
  setPhaseDurations: (durations: Record<number, number>) => void

  // Clan Customization
  updateClanCustomization: (clanName: string, customization: Partial<ClanCustomization>) => void
  resetClanCustomizations: () => void

  // Role Customization
  updateRoleCustomization: (sequence: number, customization: Partial<RoleCustomization>) => void
  resetRoleCustomizations: () => void

  // Getters
  getSelectedRoles: () => RoleAssignment[]
  getAIRoles: () => RoleAssignment[]
  getHumanRoles: () => RoleAssignment[]

  // Reset
  resetRoleSelection: () => void
}

// Initial state
const initialRoleSelectionState: RoleSelectionState = {
  selectedClans: [],
  roleAssignments: [],
  clanCustomizations: {},
  roleCustomizations: {},
  phaseDurations: {},
}

/**
 * Role Selection Store
 * Handles clan/role selection and assignment logic
 */
export const useRoleSelectionStore = create<RoleSelectionStore>((set, get) => ({
  // Initial state
  roleSelection: initialRoleSelectionState,

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  initializeRoleAssignments: (
    template: SimTemplate,
    totalParticipants: number,
    aiParticipants: number
  ) => {
    const roles = template.canonical_roles as any[]
    const clans = template.canonical_clans as any[]

    // Group roles by clan and calculate clan sizes
    const rolesByClan: Record<string, any[]> = {}
    const clanSizes: Record<string, number> = {}

    roles.forEach((role: any) => {
      if (!rolesByClan[role.clan]) {
        rolesByClan[role.clan] = []
        clanSizes[role.clan] = 0
      }
      rolesByClan[role.clan].push(role)
      clanSizes[role.clan]++
    })

    const totalRoles = roles.length

    // Calculate proportional allocation for each clan
    const clanAllocations: Record<string, number> = {}
    let allocatedCount = 0

    // First pass: proportional allocation
    clans.forEach((clan: any) => {
      const clanSize = clanSizes[clan.name] || 0
      const proportion = clanSize / totalRoles
      const allocated = Math.round(proportion * totalParticipants)
      clanAllocations[clan.name] = Math.min(allocated, clanSize) // Can't exceed clan's total roles
      allocatedCount += clanAllocations[clan.name]
    })

    // Second pass: adjust to hit exact participant count
    const difference = totalParticipants - allocatedCount
    if (difference !== 0) {
      // Sort clans by size (descending) to adjust larger clans first
      const sortedClans = [...clans].sort((a: any, b: any) =>
        (clanSizes[b.name] || 0) - (clanSizes[a.name] || 0)
      )

      let remaining = Math.abs(difference)
      for (const clan of sortedClans) {
        if (remaining === 0) break

        const clanName = clan.name
        const currentAllocation = clanAllocations[clanName]
        const clanSize = clanSizes[clanName] || 0

        if (difference > 0 && currentAllocation < clanSize) {
          // Need to add more roles
          const canAdd = Math.min(remaining, clanSize - currentAllocation)
          clanAllocations[clanName] += canAdd
          remaining -= canAdd
        } else if (difference < 0 && currentAllocation > 0) {
          // Need to remove roles
          const canRemove = Math.min(remaining, currentAllocation)
          clanAllocations[clanName] -= canRemove
          remaining -= canRemove
        }
      }
    }

    // Build role assignments
    let roleAssignments: RoleAssignment[] = []
    let selectedClans: string[] = []

    clans.forEach((clan: any) => {
      const clanRoles = rolesByClan[clan.name] || []
      const rolesToSelect = clanAllocations[clan.name] || 0

      if (rolesToSelect > 0) {
        selectedClans.push(clan.name)
      }

      clanRoles.forEach((role: any, index: number) => {
        roleAssignments.push({
          sequence: role.sequence,
          name: role.name,
          clan: role.clan,
          age: role.age,
          position: role.position,
          isSelected: index < rolesToSelect,
          isAI: false, // Will assign AI in next step
        })
      })
    })

    // Sort by sequence to maintain order
    roleAssignments.sort((a, b) => a.sequence - b.sequence)

    // AI Assignment Strategy: Try to assign ENTIRE clans to AI
    let aiAssigned = 0

    // Create list of clans with their selected role counts
    const clanData = selectedClans
      .map(clanName => ({
        name: clanName,
        selectedRoleCount: roleAssignments.filter(r => r.clan === clanName && r.isSelected).length,
        roles: roleAssignments.filter(r => r.clan === clanName && r.isSelected),
      }))
      .sort((a, b) => a.selectedRoleCount - b.selectedRoleCount) // Sort by size (smallest first)

    // Strategy 1: Try to find clans that exactly match or fit within AI count
    for (const clan of clanData) {
      if (aiAssigned >= aiParticipants) break

      const remainingAI = aiParticipants - aiAssigned

      // If this clan fits perfectly or we can assign the whole clan
      if (clan.selectedRoleCount <= remainingAI) {
        // Assign entire clan to AI
        clan.roles.forEach(role => {
          role.isAI = true
        })
        aiAssigned += clan.selectedRoleCount
      }
    }

    // Strategy 2: If we still have AI slots to fill, fill remaining roles in smallest clan
    if (aiAssigned < aiParticipants) {
      for (const role of roleAssignments) {
        if (aiAssigned >= aiParticipants) break
        if (role.isSelected && !role.isAI) {
          role.isAI = true
          aiAssigned++
        }
      }
    }

    set({
      roleSelection: {
        ...get().roleSelection,
        selectedClans,
        roleAssignments,
      },
    })
  },

  // ========================================================================
  // CLAN SELECTION
  // ========================================================================

  toggleClan: (clanName: string) => {
    const { roleSelection } = get()
    const selectedClans = roleSelection.selectedClans.includes(clanName)
      ? roleSelection.selectedClans.filter(name => name !== clanName)
      : [...roleSelection.selectedClans, clanName]

    // When toggling clan, update roles of that clan
    const roleAssignments = roleSelection.roleAssignments.map(role =>
      role.clan === clanName
        ? { ...role, isSelected: !roleSelection.selectedClans.includes(clanName) }
        : role
    )

    set({
      roleSelection: {
        ...roleSelection,
        selectedClans,
        roleAssignments,
      },
    })
  },

  setSelectedClans: (clans: string[]) => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        selectedClans: clans,
      },
    })
  },

  // ========================================================================
  // ROLE SELECTION
  // ========================================================================

  toggleRole: (roleSequence: number) => {
    const { roleSelection } = get()
    const roleAssignments = roleSelection.roleAssignments.map(role =>
      role.sequence === roleSequence
        ? { ...role, isSelected: !role.isSelected }
        : role
    )

    set({
      roleSelection: {
        ...roleSelection,
        roleAssignments,
      },
    })
  },

  setRoleAI: (roleSequence: number, isAI: boolean) => {
    const { roleSelection } = get()
    const roleAssignments = roleSelection.roleAssignments.map(role =>
      role.sequence === roleSequence
        ? { ...role, isAI }
        : role
    )

    set({
      roleSelection: {
        ...roleSelection,
        roleAssignments,
      },
    })
  },

  setRoleAssignments: (assignments: RoleAssignment[]) => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        roleAssignments: assignments,
      },
    })
  },

  // ========================================================================
  // PHASE TIMING
  // ========================================================================

  setPhaseDuration: (stageNumber: number, minutes: number) => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        phaseDurations: {
          ...roleSelection.phaseDurations,
          [stageNumber]: minutes,
        },
      },
    })
  },

  setTotalDuration: (template: SimTemplate, totalMinutes: number) => {
    const stages = template.process_stages as any[]

    // Calculate original total from template
    const originalTotal = stages.reduce((sum, stage) => sum + stage.default_duration_minutes, 0)

    // Smart rounding function - always rounds to multiples of 5 (5, 10, 15, 20, 25, 30...)
    const smartRound = (value: number): number => {
      // Round to nearest 5
      const rounded = Math.round(value / 5) * 5
      // Ensure minimum of 5 minutes
      return Math.max(5, rounded)
    }

    // Calculate proportional durations
    const newDurations: Record<number, number> = {}
    let allocatedTotal = 0

    stages.forEach((stage) => {
      const proportion = stage.default_duration_minutes / originalTotal
      const proportionalMinutes = totalMinutes * proportion
      const rounded = smartRound(proportionalMinutes)

      newDurations[stage.sequence] = rounded
      allocatedTotal += rounded
    })

    // Adjust for rounding errors to hit exact total
    const difference = totalMinutes - allocatedTotal

    if (difference !== 0) {
      // Sort stages by duration (descending) to adjust larger phases
      const sortedStages = [...stages].sort((a, b) =>
        (newDurations[b.sequence] || 0) - (newDurations[a.sequence] || 0)
      )

      let remaining = Math.abs(difference)

      for (const stage of sortedStages) {
        if (remaining === 0) break

        const current = newDurations[stage.sequence]

        if (difference > 0) {
          // Need to add time - add 5 minutes at a time
          const toAdd = Math.min(remaining, 5)
          newDurations[stage.sequence] = current + toAdd
          remaining -= toAdd
        } else if (current > 5) {
          // Need to remove time - remove 5 minutes at a time (but keep minimum 5)
          const toRemove = Math.min(remaining, current - 5)
          newDurations[stage.sequence] = current - toRemove
          remaining -= toRemove
        }
      }
    }

    set({
      roleSelection: {
        ...get().roleSelection,
        phaseDurations: newDurations,
      },
    })
  },

  resetPhaseDurations: () => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        phaseDurations: {},
      },
    })
  },

  setPhaseDurations: (durations: Record<number, number>) => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        phaseDurations: durations,
      },
    })
  },

  // ========================================================================
  // CLAN CUSTOMIZATION
  // ========================================================================

  updateClanCustomization: (clanName: string, customization: Partial<ClanCustomization>) => {
    const { roleSelection } = get()
    const existing = roleSelection.clanCustomizations[clanName] || { name: clanName }

    set({
      roleSelection: {
        ...roleSelection,
        clanCustomizations: {
          ...roleSelection.clanCustomizations,
          [clanName]: {
            ...existing,
            ...customization,
          },
        },
      },
    })
  },

  resetClanCustomizations: () => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        clanCustomizations: {},
      },
    })
  },

  // ========================================================================
  // ROLE CUSTOMIZATION
  // ========================================================================

  updateRoleCustomization: (sequence: number, customization: Partial<RoleCustomization>) => {
    const { roleSelection } = get()
    const existing = roleSelection.roleCustomizations[sequence] || { sequence }

    set({
      roleSelection: {
        ...roleSelection,
        roleCustomizations: {
          ...roleSelection.roleCustomizations,
          [sequence]: {
            ...existing,
            ...customization,
          },
        },
      },
    })
  },

  resetRoleCustomizations: () => {
    const { roleSelection } = get()
    set({
      roleSelection: {
        ...roleSelection,
        roleCustomizations: {},
      },
    })
  },

  // ========================================================================
  // GETTERS
  // ========================================================================

  getSelectedRoles: (): RoleAssignment[] => {
    const { roleSelection } = get()
    return roleSelection.roleAssignments.filter(r => r.isSelected)
  },

  getAIRoles: (): RoleAssignment[] => {
    const { roleSelection } = get()
    return roleSelection.roleAssignments.filter(r => r.isSelected && r.isAI)
  },

  getHumanRoles: (): RoleAssignment[] => {
    const { roleSelection } = get()
    return roleSelection.roleAssignments.filter(r => r.isSelected && !r.isAI)
  },

  // ========================================================================
  // RESET
  // ========================================================================

  resetRoleSelection: () => {
    set({
      roleSelection: initialRoleSelectionState,
    })
  },
}))
