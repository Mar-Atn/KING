/**
 * Simulation State Management Store
 *
 * Manages simulation creation wizard state and simulation runtime state
 * Uses Zustand for lightweight, performant state management
 */

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

// Type aliases for cleaner code
type SimRun = Database['public']['Tables']['sim_runs']['Row']
type SimRunInsert = Database['public']['Tables']['sim_runs']['Insert']
type SimTemplate = Database['public']['Tables']['simulation_templates']['Row']

// Wizard step type (7 steps total)
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

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

// Simulation creation wizard state
export interface SimulationWizardState {
  // Current step in the wizard (1-7)
  currentStep: WizardStep

  // Selected template
  selectedTemplate: SimTemplate | null

  // Basic configuration
  runName: string
  totalParticipants: number
  humanParticipants: number
  aiParticipants: number
  learningObjectives: string[]
  vote1Threshold: number | null // Number of votes needed for Vote 1 (null = default 2/3)
  vote2Threshold: number | null // Number of votes needed for Vote 2 (null = default 2/3)

  // Clan & Role Selection (Step 3)
  selectedClans: string[] // Clan names to include
  roleAssignments: RoleAssignment[] // All roles with selection and AI flags

  // Phase Timing (Step 4)
  phaseDurations: Record<number, number> // stage_number -> minutes

  // Clan Customization (Step 5)
  clanCustomizations: Record<string, ClanCustomization> // clan_name -> customization

  // Role Customization (Step 6)
  roleCustomizations: Record<number, RoleCustomization> // sequence -> customization

  // Errors
  errors: Record<string, string>

  // Loading state
  isLoading: boolean
  isSaving: boolean
}

// Store interface
interface SimulationStore {
  // Wizard state
  wizard: SimulationWizardState

  // Available templates
  templates: SimTemplate[]

  // Current simulation (if facilitator is managing one)
  currentSimulation: SimRun | null

  // Actions - Wizard Navigation
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: WizardStep) => void
  resetWizard: () => void

  // Actions - Template Selection
  loadTemplates: () => Promise<void>
  selectTemplate: (template: SimTemplate) => void

  // Actions - Configuration
  setRunName: (name: string) => void
  setParticipantCounts: (total: number, human: number, ai: number) => void
  setLearningObjectives: (objectives: string[]) => void
  setVotingThresholds: (vote1: number | null, vote2: number | null) => void

  // Actions - Clan & Role Selection
  initializeRoleAssignments: () => void
  toggleClan: (clanName: string) => void
  toggleRole: (roleSequence: number) => void
  setRoleAI: (roleSequence: number, isAI: boolean) => void

  // Actions - Phase Timing
  setPhaseDuration: (stageNumber: number, minutes: number) => void
  setTotalDuration: (totalMinutes: number) => void
  resetPhaseDurations: () => void

  // Actions - Clan Customization
  updateClanCustomization: (clanName: string, customization: Partial<ClanCustomization>) => void
  resetClanCustomizations: () => void

  // Actions - Role Customization
  updateRoleCustomization: (sequence: number, customization: Partial<RoleCustomization>) => void
  resetRoleCustomizations: () => void

  // Actions - Validation
  validateCurrentStep: () => boolean
  setError: (field: string, error: string) => void
  clearErrors: () => void

  // Actions - Simulation Creation
  createSimulation: (facilitatorId: string) => Promise<{ success: boolean; runId?: string; error?: string }>

  // Actions - Simulation Management
  loadSimulation: (runId: string) => Promise<void>
  loadSimulationForEdit: (runId: string) => Promise<{ success: boolean; error?: string }>
  updateSimulation: (runId: string) => Promise<{ success: boolean; error?: string }>
  deleteSimulation: (runId: string) => Promise<{ success: boolean; error?: string }>
}

// Initial wizard state
const initialWizardState: SimulationWizardState = {
  currentStep: 1,
  selectedTemplate: null,
  runName: '',
  totalParticipants: 18,
  humanParticipants: 15,
  aiParticipants: 3,
  learningObjectives: [],
  vote1Threshold: null, // null means use default 2/3
  vote2Threshold: null, // null means use default 2/3
  selectedClans: [],
  roleAssignments: [],
  phaseDurations: {},
  clanCustomizations: {},
  roleCustomizations: {},
  errors: {},
  isLoading: false,
  isSaving: false,
}

/**
 * Simulation Store
 * Central state management for simulation creation and runtime
 */
export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  wizard: initialWizardState,
  templates: [],
  currentSimulation: null,

  // ========================================================================
  // WIZARD NAVIGATION
  // ========================================================================

  nextStep: () => {
    const { wizard } = get()
    if (get().validateCurrentStep() && wizard.currentStep < 7) {
      set({
        wizard: {
          ...wizard,
          currentStep: (wizard.currentStep + 1) as WizardStep,
        },
      })
    }
  },

  previousStep: () => {
    const { wizard } = get()
    if (wizard.currentStep > 1) {
      set({
        wizard: {
          ...wizard,
          currentStep: (wizard.currentStep - 1) as WizardStep,
        },
      })
    }
  },

  goToStep: (step: WizardStep) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        currentStep: step,
      },
    })
  },

  resetWizard: () => {
    set({
      wizard: initialWizardState,
    })
  },

  // ========================================================================
  // TEMPLATE MANAGEMENT
  // ========================================================================

  loadTemplates: async () => {
    const { wizard } = get()
    set({
      wizard: { ...wizard, isLoading: true },
    })

    try {
      const { data, error } = await supabase
        .from('simulation_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({
        templates: data || [],
        wizard: { ...get().wizard, isLoading: false },
      })
    } catch (error) {
      console.error('Error loading templates:', error)
      set({
        wizard: {
          ...get().wizard,
          isLoading: false,
          errors: { template: 'Failed to load templates' },
        },
      })
    }
  },

  selectTemplate: (template: SimTemplate) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        selectedTemplate: template,
      },
    })
  },

  // ========================================================================
  // CONFIGURATION
  // ========================================================================

  setRunName: (name: string) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        runName: name,
      },
    })
  },

  setParticipantCounts: (total: number, human: number, ai: number) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        totalParticipants: total,
        humanParticipants: human,
        aiParticipants: ai,
      },
    })
  },

  setLearningObjectives: (objectives: string[]) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        learningObjectives: objectives,
      },
    })
  },

  setVotingThresholds: (vote1: number | null, vote2: number | null) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        vote1Threshold: vote1,
        vote2Threshold: vote2,
      },
    })
  },

  // ========================================================================
  // CLAN & ROLE SELECTION
  // ========================================================================

  initializeRoleAssignments: () => {
    const { wizard } = get()
    if (!wizard.selectedTemplate) return

    const roles = wizard.selectedTemplate.canonical_roles as any[]
    const clans = wizard.selectedTemplate.canonical_clans as any[]

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

    const totalParticipants = wizard.totalParticipants
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
    const aiCount = wizard.aiParticipants
    let aiAssigned = 0

    // Create list of clans with their selected role counts
    const clanData = selectedClans.map(clanName => ({
      name: clanName,
      selectedRoleCount: roleAssignments.filter(r => r.clan === clanName && r.isSelected).length,
      roles: roleAssignments.filter(r => r.clan === clanName && r.isSelected)
    })).sort((a, b) => a.selectedRoleCount - b.selectedRoleCount) // Sort by size (smallest first)

    // Strategy 1: Try to find clans that exactly match or fit within AI count
    for (const clan of clanData) {
      if (aiAssigned >= aiCount) break

      const remainingAI = aiCount - aiAssigned

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
    if (aiAssigned < aiCount) {
      for (const role of roleAssignments) {
        if (aiAssigned >= aiCount) break
        if (role.isSelected && !role.isAI) {
          role.isAI = true
          aiAssigned++
        }
      }
    }

    set({
      wizard: {
        ...wizard,
        selectedClans,
        roleAssignments,
      },
    })
  },

  toggleClan: (clanName: string) => {
    const { wizard } = get()
    const selectedClans = wizard.selectedClans.includes(clanName)
      ? wizard.selectedClans.filter(name => name !== clanName)
      : [...wizard.selectedClans, clanName]

    // When toggling clan, update roles of that clan
    const roleAssignments = wizard.roleAssignments.map(role =>
      role.clan === clanName
        ? { ...role, isSelected: !wizard.selectedClans.includes(clanName) }
        : role
    )

    set({
      wizard: {
        ...wizard,
        selectedClans,
        roleAssignments,
      },
    })
  },

  toggleRole: (roleSequence: number) => {
    const { wizard } = get()
    const roleAssignments = wizard.roleAssignments.map(role =>
      role.sequence === roleSequence
        ? { ...role, isSelected: !role.isSelected }
        : role
    )

    set({
      wizard: {
        ...wizard,
        roleAssignments,
      },
    })
  },

  setRoleAI: (roleSequence: number, isAI: boolean) => {
    const { wizard } = get()
    const roleAssignments = wizard.roleAssignments.map(role =>
      role.sequence === roleSequence
        ? { ...role, isAI }
        : role
    )

    set({
      wizard: {
        ...wizard,
        roleAssignments,
      },
    })
  },

  // ========================================================================
  // PHASE TIMING
  // ========================================================================

  setPhaseDuration: (stageNumber: number, minutes: number) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        phaseDurations: {
          ...wizard.phaseDurations,
          [stageNumber]: minutes,
        },
      },
    })
  },

  setTotalDuration: (totalMinutes: number) => {
    const { wizard } = get()
    if (!wizard.selectedTemplate) return

    const stages = wizard.selectedTemplate.process_stages as any[]

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
      wizard: {
        ...wizard,
        phaseDurations: newDurations,
      },
    })
  },

  resetPhaseDurations: () => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        phaseDurations: {},
      },
    })
  },

  // ========================================================================
  // CLAN CUSTOMIZATION
  // ========================================================================

  updateClanCustomization: (clanName: string, customization: Partial<ClanCustomization>) => {
    const { wizard } = get()
    const existing = wizard.clanCustomizations[clanName] || { name: clanName }

    set({
      wizard: {
        ...wizard,
        clanCustomizations: {
          ...wizard.clanCustomizations,
          [clanName]: {
            ...existing,
            ...customization,
          },
        },
      },
    })
  },

  resetClanCustomizations: () => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        clanCustomizations: {},
      },
    })
  },

  // ========================================================================
  // ROLE CUSTOMIZATION
  // ========================================================================

  updateRoleCustomization: (sequence: number, customization: Partial<RoleCustomization>) => {
    const { wizard } = get()
    const existing = wizard.roleCustomizations[sequence] || { sequence }

    set({
      wizard: {
        ...wizard,
        roleCustomizations: {
          ...wizard.roleCustomizations,
          [sequence]: {
            ...existing,
            ...customization,
          },
        },
      },
    })
  },

  resetRoleCustomizations: () => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        roleCustomizations: {},
      },
    })
  },

  // ========================================================================
  // VALIDATION
  // ========================================================================

  validateCurrentStep: (): boolean => {
    const { wizard } = get()
    get().clearErrors()

    switch (wizard.currentStep) {
      case 1: // Template Selection
        if (!wizard.selectedTemplate) {
          get().setError('template', 'Please select a simulation template')
          return false
        }
        return true

      case 2: // Basic Configuration
        if (!wizard.runName.trim()) {
          get().setError('runName', 'Please enter a simulation name')
          return false
        }
        if (wizard.runName.length < 3) {
          get().setError('runName', 'Simulation name must be at least 3 characters')
          return false
        }
        if (wizard.totalParticipants < 10 || wizard.totalParticipants > 30) {
          get().setError('participants', 'Total participants must be between 10 and 30')
          return false
        }
        if (wizard.humanParticipants + wizard.aiParticipants !== wizard.totalParticipants) {
          get().setError('participants', 'Human + AI participants must equal total participants')
          return false
        }
        return true

      case 3: // Clan & Role Selection
        const selectedRoles = wizard.roleAssignments.filter(r => r.isSelected)
        const aiRoles = selectedRoles.filter(r => r.isAI)

        if (selectedRoles.length !== wizard.totalParticipants) {
          get().setError('roles', `Please select exactly ${wizard.totalParticipants} roles (currently ${selectedRoles.length} selected)`)
          return false
        }

        if (aiRoles.length !== wizard.aiParticipants) {
          get().setError('ai', `Please assign exactly ${wizard.aiParticipants} AI roles (currently ${aiRoles.length} assigned)`)
          return false
        }

        return true

      case 4: // Phase Timing
        // Optional customization, always valid
        return true

      case 5: // Review
        return true

      case 6: // Create
        return true

      case 7: // Success
        return true

      default:
        return true
    }
  },

  setError: (field: string, error: string) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        errors: {
          ...wizard.errors,
          [field]: error,
        },
      },
    })
  },

  clearErrors: () => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        errors: {},
      },
    })
  },

  // ========================================================================
  // SIMULATION CREATION
  // ========================================================================

  createSimulation: async (facilitatorId: string) => {
    const { wizard } = get()

    // Final validation
    if (!wizard.selectedTemplate) {
      return { success: false, error: 'No template selected' }
    }

    set({
      wizard: { ...wizard, isSaving: true },
    })

    try {
      // Build configuration object from template
      const config = {
        template_id: wizard.selectedTemplate.template_id,
        template_version: wizard.selectedTemplate.version,
        process_stages: wizard.selectedTemplate.process_stages,
        canonical_clans: wizard.selectedTemplate.canonical_clans,
        canonical_roles: wizard.selectedTemplate.canonical_roles,
      }

      // Calculate SHA-256 checksum of config
      const configJson = JSON.stringify(config)
      const checksum = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(configJson))
      const checksumHex = Array.from(new Uint8Array(checksum))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Create sim_run record
      const simRun: SimRunInsert = {
        run_name: wizard.runName,
        version: wizard.selectedTemplate.version,
        config,
        config_checksum: checksumHex,
        total_participants: wizard.totalParticipants,
        human_participants: wizard.humanParticipants,
        ai_participants: wizard.aiParticipants,
        status: 'setup',
        facilitator_id: facilitatorId,
        learning_objectives: wizard.learningObjectives.length > 0 ? wizard.learningObjectives : null,
        vote_1_threshold: wizard.vote1Threshold,
        vote_2_threshold: wizard.vote2Threshold,
      }

      const { data, error } = await supabase
        .from('sim_runs')
        .insert(simRun)
        .select()
        .single()

      if (error) throw error

      const runId = data.run_id

      // ========================================================================
      // INSTANTIATE CLANS from selected template clans
      // ========================================================================
      const selectedClanNames = wizard.selectedClans
      const templateClans = wizard.selectedTemplate.canonical_clans as any[]
      const clansToCreate = templateClans
        .filter((clan: any) => selectedClanNames.includes(clan.name))
        .map((clan: any) => ({
          run_id: runId,
          name: clan.name,
          sequence_number: clan.sequence || 1,
          about: clan.about,
          key_priorities: clan.key_priorities,
          attitude_to_others: clan.attitude_to_others,
          if_things_go_wrong: clan.if_things_go_wrong,
          color_hex: clan.color_hex || '#8B7355',
          emblem_url: clan.logo_url || clan.emblem_url, // Support both field names from template
        }))

      const { data: createdClans, error: clansError } = await supabase
        .from('clans')
        .insert(clansToCreate)
        .select()

      if (clansError) throw new Error(`Failed to create clans: ${clansError.message}`)

      // Create a map of clan name -> clan_id for role creation
      const clanIdMap = new Map<string, string>()
      createdClans.forEach((clan: any) => {
        clanIdMap.set(clan.name, clan.clan_id)
      })

      // ========================================================================
      // INSTANTIATE ROLES from selected template roles
      // ========================================================================
      const templateRoles = wizard.selectedTemplate.canonical_roles as any[]
      const selectedRoleAssignments = wizard.roleAssignments.filter(r => r.isSelected)

      const rolesToCreate = selectedRoleAssignments.map((assignment: any) => {
        const templateRole = templateRoles.find((r: any) => r.sequence === assignment.sequence)
        const clanId = clanIdMap.get(assignment.clan)

        if (!clanId) {
          throw new Error(`Clan ID not found for role ${assignment.name} with clan ${assignment.clan}`)
        }

        return {
          run_id: runId,
          clan_id: clanId,
          participant_type: assignment.isAI ? 'ai' : 'human',
          name: assignment.name,
          age: templateRole?.age || 35,
          position: templateRole?.position || '',
          background: templateRole?.background || '',
          character_traits: templateRole?.character_traits || '',
          interests: templateRole?.interests || '',
          avatar_url: templateRole?.avatar_url, // Copy avatar from template
          assigned_user_id: null, // Will be assigned during role distribution
        }
      })

      const { error: rolesError } = await supabase
        .from('roles')
        .insert(rolesToCreate)

      if (rolesError) throw new Error(`Failed to create roles: ${rolesError.message}`)

      // ========================================================================
      // INSTANTIATE PHASES from template process stages
      // ========================================================================
      const templateStages = wizard.selectedTemplate.process_stages as any[]
      const phasesToCreate = templateStages.map((stage: any) => {
        const customDuration = wizard.phaseDurations[stage.sequence]

        return {
          run_id: runId,
          sequence_number: stage.sequence,
          name: stage.name,
          description: stage.description || '',
          default_duration_minutes: customDuration ?? stage.default_duration_minutes,
          status: 'pending',
        }
      })

      const { error: phasesError } = await supabase
        .from('phases')
        .insert(phasesToCreate)

      if (phasesError) throw new Error(`Failed to create phases: ${phasesError.message}`)

      set({
        wizard: { ...get().wizard, isSaving: false },
        currentSimulation: data,
      })

      return { success: true, runId: data.run_id }
    } catch (error) {
      console.error('Error creating simulation:', error)
      set({
        wizard: {
          ...get().wizard,
          isSaving: false,
          errors: { create: error instanceof Error ? error.message : 'Failed to create simulation' },
        },
      })
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // ========================================================================
  // SIMULATION MANAGEMENT
  // ========================================================================

  loadSimulation: async (runId: string) => {
    try {
      const { data, error } = await supabase
        .from('sim_runs')
        .select('*')
        .eq('run_id', runId)
        .single()

      if (error) throw error

      set({
        currentSimulation: data,
      })
    } catch (error) {
      console.error('Error loading simulation:', error)
    }
  },

  deleteSimulation: async (runId: string) => {
    try {
      const { error} = await supabase
        .from('sim_runs')
        .delete()
        .eq('run_id', runId)

      if (error) throw error

      // Clear current simulation if it was the deleted one
      const { currentSimulation } = get()
      if (currentSimulation?.run_id === runId) {
        set({ currentSimulation: null })
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting simulation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete simulation',
      }
    }
  },

  loadSimulationForEdit: async (runId: string) => {
    const { wizard } = get()
    set({ wizard: { ...wizard, isLoading: true } })

    try {
      // Load simulation with all related data
      const { data: simRun, error: simError } = await supabase
        .from('sim_runs')
        .select('*')
        .eq('run_id', runId)
        .single()

      if (simError) throw simError

      // Load template
      const templateId = (simRun.config as any).template_id
      const { data: template, error: templateError } = await supabase
        .from('simulation_templates')
        .select('*')
        .eq('template_id', templateId)
        .single()

      if (templateError) throw templateError

      // Load clans
      const { data: clans, error: clansError } = await supabase
        .from('clans')
        .select('*')
        .eq('run_id', runId)
        .order('sequence_number')

      if (clansError) throw clansError

      // Load roles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*, clans(name)')
        .eq('run_id', runId)

      if (rolesError) throw rolesError

      // Load phases
      const { data: phases, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('run_id', runId)
        .order('sequence_number')

      if (phasesError) throw phasesError

      // Build role assignments from loaded roles
      const roleAssignments: RoleAssignment[] = roles.map((role: any) => ({
        sequence: (simRun.config as any).canonical_roles.find((r: any) => r.name === role.name)?.sequence || 0,
        name: role.name,
        clan: role.clans.name,
        age: role.age,
        position: role.position,
        isSelected: true,
        isAI: role.participant_type === 'ai',
      }))

      // Build phase durations
      const phaseDurations: Record<number, number> = {}
      phases.forEach((phase: any) => {
        phaseDurations[phase.sequence_number] = phase.default_duration_minutes
      })

      // Populate wizard state
      set({
        wizard: {
          ...initialWizardState,
          selectedTemplate: template,
          runName: simRun.run_name,
          totalParticipants: simRun.total_participants,
          humanParticipants: simRun.human_participants,
          aiParticipants: simRun.ai_participants,
          learningObjectives: simRun.learning_objectives || [],
          vote1Threshold: simRun.vote_1_threshold,
          vote2Threshold: simRun.vote_2_threshold,
          selectedClans: clans.map((c: any) => c.name),
          roleAssignments,
          phaseDurations,
          isLoading: false,
        },
        currentSimulation: simRun,
      })

      return { success: true }
    } catch (error) {
      console.error('Error loading simulation for edit:', error)
      set({
        wizard: {
          ...get().wizard,
          isLoading: false,
          errors: { load: 'Failed to load simulation' },
        },
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load simulation',
      }
    }
  },

  updateSimulation: async (runId: string) => {
    const { wizard } = get()

    set({ wizard: { ...wizard, isSaving: true } })

    try {
      // Delete existing clans, roles, and phases (CASCADE will handle it)
      await supabase.from('clans').delete().eq('run_id', runId)
      await supabase.from('phases').delete().eq('run_id', runId)

      // Update sim_run basic info
      const { error: updateError } = await supabase
        .from('sim_runs')
        .update({
          run_name: wizard.runName,
          total_participants: wizard.totalParticipants,
          human_participants: wizard.humanParticipants,
          ai_participants: wizard.aiParticipants,
          learning_objectives: wizard.learningObjectives.length > 0 ? wizard.learningObjectives : null,
          vote_1_threshold: wizard.vote1Threshold,
          vote_2_threshold: wizard.vote2Threshold,
        })
        .eq('run_id', runId)

      if (updateError) throw updateError

      // Re-create clans
      const templateClans = wizard.selectedTemplate!.canonical_clans as any[]
      const clansToCreate = templateClans
        .filter((clan: any) => wizard.selectedClans.includes(clan.name))
        .map((clan: any) => ({
          run_id: runId,
          name: clan.name,
          sequence_number: clan.sequence || 1,
          about: clan.about,
          key_priorities: clan.key_priorities,
          attitude_to_others: clan.attitude_to_others,
          if_things_go_wrong: clan.if_things_go_wrong,
          color_hex: clan.color_hex || '#8B7355',
        }))

      const { data: createdClans, error: clansError } = await supabase
        .from('clans')
        .insert(clansToCreate)
        .select()

      if (clansError) throw clansError

      // Create clan ID map
      const clanIdMap = new Map<string, string>()
      createdClans.forEach((clan: any) => {
        clanIdMap.set(clan.name, clan.clan_id)
      })

      // Re-create roles
      const templateRoles = wizard.selectedTemplate!.canonical_roles as any[]
      const selectedRoleAssignments = wizard.roleAssignments.filter(r => r.isSelected)

      const rolesToCreate = selectedRoleAssignments.map((assignment: any) => {
        const templateRole = templateRoles.find((r: any) => r.sequence === assignment.sequence)
        const clanId = clanIdMap.get(assignment.clan)

        return {
          run_id: runId,
          clan_id: clanId,
          participant_type: assignment.isAI ? 'ai' : 'human',
          name: assignment.name,
          age: templateRole?.age || 35,
          position: templateRole?.position || '',
          background: templateRole?.background || '',
          character_traits: templateRole?.character_traits || '',
          interests: templateRole?.interests || '',
          assigned_user_id: null,
        }
      })

      const { error: rolesError } = await supabase
        .from('roles')
        .insert(rolesToCreate)

      if (rolesError) throw rolesError

      // Re-create phases
      const templateStages = wizard.selectedTemplate!.process_stages as any[]
      const phasesToCreate = templateStages.map((stage: any) => {
        const customDuration = wizard.phaseDurations[stage.sequence]

        return {
          run_id: runId,
          sequence_number: stage.sequence,
          name: stage.name,
          description: stage.description || '',
          default_duration_minutes: customDuration ?? stage.default_duration_minutes,
          status: 'pending',
        }
      })

      const { error: phasesError } = await supabase
        .from('phases')
        .insert(phasesToCreate)

      if (phasesError) throw phasesError

      set({ wizard: { ...get().wizard, isSaving: false } })

      return { success: true }
    } catch (error) {
      console.error('Error updating simulation:', error)
      set({
        wizard: {
          ...get().wizard,
          isSaving: false,
          errors: { update: error instanceof Error ? error.message : 'Failed to update simulation' },
        },
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update simulation',
      }
    }
  },
}))
