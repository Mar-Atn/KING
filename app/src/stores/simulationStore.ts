/**
 * Simulation State Management Store
 *
 * Manages simulation CRUD operations, template management, and basic configuration.
 * This store focuses on data persistence and simulation lifecycle management.
 *
 * For wizard-specific state, see wizardStore.ts
 * For role/clan assignment logic, see roleSelectionStore.ts
 */

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useWizardStore } from './wizardStore'
import { useRoleSelectionStore } from './roleSelectionStore'
import type { RoleAssignment } from './roleSelectionStore'

// Type aliases for cleaner code
type SimRun = Database['public']['Tables']['sim_runs']['Row']
type SimRunInsert = Database['public']['Tables']['sim_runs']['Insert']
type SimTemplate = Database['public']['Tables']['simulation_templates']['Row']

// Basic simulation configuration
export interface SimulationConfig {
  runName: string
  totalParticipants: number
  humanParticipants: number
  aiParticipants: number
  learningObjectives: string[]
  vote1Threshold: number | null
  vote2Threshold: number | null
  selectedTemplate: SimTemplate | null
}

// Store interface
interface SimulationStore {
  // State
  templates: SimTemplate[]
  currentSimulation: SimRun | null
  config: SimulationConfig

  // Template Management
  loadTemplates: () => Promise<void>
  selectTemplate: (template: SimTemplate) => void

  // Configuration
  setRunName: (name: string) => void
  setParticipantCounts: (total: number, human: number, ai: number) => void
  setLearningObjectives: (objectives: string[]) => void
  setVotingThresholds: (vote1: number | null, vote2: number | null) => void
  setConfig: (config: Partial<SimulationConfig>) => void

  // Validation
  validateCurrentStep: (currentStep: number) => boolean

  // Simulation CRUD
  createSimulation: (facilitatorId: string) => Promise<{ success: boolean; runId?: string; error?: string }>
  loadSimulation: (runId: string) => Promise<void>
  loadSimulationForEdit: (runId: string) => Promise<{ success: boolean; error?: string }>
  updateSimulation: (runId: string) => Promise<{ success: boolean; error?: string }>
  deleteSimulation: (runId: string) => Promise<{ success: boolean; error?: string }>

  // Reset
  resetConfig: () => void
}

// Initial configuration state
const initialConfig: SimulationConfig = {
  runName: '',
  totalParticipants: 18,
  humanParticipants: 15,
  aiParticipants: 3,
  learningObjectives: [],
  vote1Threshold: null,
  vote2Threshold: null,
  selectedTemplate: null,
}

/**
 * Simulation Store
 * Handles simulation CRUD operations and template management
 */
export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  templates: [],
  currentSimulation: null,
  config: initialConfig,

  // ========================================================================
  // TEMPLATE MANAGEMENT
  // ========================================================================

  loadTemplates: async () => {
    const wizardStore = useWizardStore.getState()
    wizardStore.setLoading(true)

    try {
      const { data, error } = await supabase
        .from('simulation_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ templates: data || [] })
      wizardStore.setLoading(false)
    } catch (error) {
      console.error('Error loading templates:', error)
      wizardStore.setError('template', 'Failed to load templates')
      wizardStore.setLoading(false)
    }
  },

  selectTemplate: (template: SimTemplate) => {
    const { config } = get()
    set({
      config: {
        ...config,
        selectedTemplate: template,
      },
    })
  },

  // ========================================================================
  // CONFIGURATION
  // ========================================================================

  setRunName: (name: string) => {
    const { config } = get()
    set({
      config: {
        ...config,
        runName: name,
      },
    })
  },

  setParticipantCounts: (total: number, human: number, ai: number) => {
    const { config } = get()
    set({
      config: {
        ...config,
        totalParticipants: total,
        humanParticipants: human,
        aiParticipants: ai,
      },
    })

    // Re-initialize role assignments if template is selected
    if (config.selectedTemplate) {
      const roleStore = useRoleSelectionStore.getState()
      roleStore.initializeRoleAssignments(config.selectedTemplate, total, ai)
    }
  },

  setLearningObjectives: (objectives: string[]) => {
    const { config } = get()
    set({
      config: {
        ...config,
        learningObjectives: objectives,
      },
    })
  },

  setVotingThresholds: (vote1: number | null, vote2: number | null) => {
    const { config } = get()
    set({
      config: {
        ...config,
        vote1Threshold: vote1,
        vote2Threshold: vote2,
      },
    })
  },

  setConfig: (configUpdate: Partial<SimulationConfig>) => {
    const { config } = get()
    set({
      config: {
        ...config,
        ...configUpdate,
      },
    })
  },

  // ========================================================================
  // VALIDATION
  // ========================================================================

  validateCurrentStep: (currentStep: number): boolean => {
    const { config } = get()
    const wizardStore = useWizardStore.getState()
    const roleStore = useRoleSelectionStore.getState()

    wizardStore.clearErrors()

    switch (currentStep) {
      case 1: // Template Selection
        if (!config.selectedTemplate) {
          wizardStore.setError('template', 'Please select a simulation template')
          return false
        }
        return true

      case 2: // Basic Configuration
        if (!config.runName.trim()) {
          wizardStore.setError('runName', 'Please enter a simulation name')
          return false
        }
        if (config.runName.length < 3) {
          wizardStore.setError('runName', 'Simulation name must be at least 3 characters')
          return false
        }
        if (config.totalParticipants < 10 || config.totalParticipants > 30) {
          wizardStore.setError('participants', 'Total participants must be between 10 and 30')
          return false
        }
        if (config.humanParticipants + config.aiParticipants !== config.totalParticipants) {
          wizardStore.setError('participants', 'Human + AI participants must equal total participants')
          return false
        }
        return true

      case 3: // Clan & Role Selection
        const selectedRoles = roleStore.getSelectedRoles()
        const aiRoles = roleStore.getAIRoles()

        if (selectedRoles.length !== config.totalParticipants) {
          wizardStore.setError('roles', `Please select exactly ${config.totalParticipants} roles (currently ${selectedRoles.length} selected)`)
          return false
        }

        if (aiRoles.length !== config.aiParticipants) {
          wizardStore.setError('ai', `Please assign exactly ${config.aiParticipants} AI roles (currently ${aiRoles.length} assigned)`)
          return false
        }

        return true

      case 4: // Phase Timing
      case 5: // Review
      case 6: // Create
      case 7: // Success
        return true

      default:
        return true
    }
  },

  // ========================================================================
  // SIMULATION CREATION
  // ========================================================================

  createSimulation: async (facilitatorId: string) => {
    const { config } = get()
    const wizardStore = useWizardStore.getState()
    const roleStore = useRoleSelectionStore.getState()

    // Final validation
    if (!config.selectedTemplate) {
      return { success: false, error: 'No template selected' }
    }

    wizardStore.setSaving(true)

    try {
      // Build configuration object from template
      const simConfig = {
        template_id: config.selectedTemplate.template_id,
        template_version: config.selectedTemplate.version,
        process_stages: config.selectedTemplate.process_stages,
        canonical_clans: config.selectedTemplate.canonical_clans,
        canonical_roles: config.selectedTemplate.canonical_roles,
      }

      // Calculate SHA-256 checksum of config
      const configJson = JSON.stringify(simConfig)
      const checksum = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(configJson))
      const checksumHex = Array.from(new Uint8Array(checksum))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Create sim_run record
      const simRun: SimRunInsert = {
        run_name: config.runName,
        version: config.selectedTemplate.version,
        config: simConfig,
        config_checksum: checksumHex,
        total_participants: config.totalParticipants,
        human_participants: config.humanParticipants,
        ai_participants: config.aiParticipants,
        status: 'setup',
        facilitator_id: facilitatorId,
        learning_objectives: config.learningObjectives.length > 0 ? config.learningObjectives : null,
        vote_1_threshold: config.vote1Threshold,
        vote_2_threshold: config.vote2Threshold,
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
      const selectedClanNames = roleStore.roleSelection.selectedClans
      const templateClans = config.selectedTemplate.canonical_clans as any[]
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
      const templateRoles = config.selectedTemplate.canonical_roles as any[]
      const selectedRoleAssignments = roleStore.getSelectedRoles()

      const rolesToCreate = selectedRoleAssignments.map((assignment: RoleAssignment) => {
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
      const templateStages = config.selectedTemplate.process_stages as any[]
      const phaseDurations = roleStore.roleSelection.phaseDurations

      const phasesToCreate = templateStages.map((stage: any) => {
        const customDuration = phaseDurations[stage.sequence]

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

      set({ currentSimulation: data })
      wizardStore.setSaving(false)

      return { success: true, runId: data.run_id }
    } catch (error) {
      console.error('Error creating simulation:', error)
      wizardStore.setError('create', error instanceof Error ? error.message : 'Failed to create simulation')
      wizardStore.setSaving(false)
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

      set({ currentSimulation: data })
    } catch (error) {
      console.error('Error loading simulation:', error)
    }
  },

  deleteSimulation: async (runId: string) => {
    try {
      const { error } = await supabase
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
    const wizardStore = useWizardStore.getState()
    const roleStore = useRoleSelectionStore.getState()

    wizardStore.setLoading(true)

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

      // Update simulation config
      set({
        config: {
          selectedTemplate: template,
          runName: simRun.run_name,
          totalParticipants: simRun.total_participants,
          humanParticipants: simRun.human_participants,
          aiParticipants: simRun.ai_participants,
          learningObjectives: simRun.learning_objectives || [],
          vote1Threshold: simRun.vote_1_threshold,
          vote2Threshold: simRun.vote_2_threshold,
        },
        currentSimulation: simRun,
      })

      // Update role selection store
      roleStore.setSelectedClans(clans.map((c: any) => c.name))
      roleStore.setRoleAssignments(roleAssignments)
      roleStore.setPhaseDurations(phaseDurations)

      wizardStore.setLoading(false)
      wizardStore.setWizardMode('edit', runId)

      return { success: true }
    } catch (error) {
      console.error('Error loading simulation for edit:', error)
      wizardStore.setError('load', 'Failed to load simulation')
      wizardStore.setLoading(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load simulation',
      }
    }
  },

  updateSimulation: async (runId: string) => {
    const { config } = get()
    const wizardStore = useWizardStore.getState()
    const roleStore = useRoleSelectionStore.getState()

    wizardStore.setSaving(true)

    try {
      // Delete existing clans, roles, and phases (CASCADE will handle it)
      await supabase.from('clans').delete().eq('run_id', runId)
      await supabase.from('phases').delete().eq('run_id', runId)

      // Update sim_run basic info
      const { error: updateError } = await supabase
        .from('sim_runs')
        .update({
          run_name: config.runName,
          total_participants: config.totalParticipants,
          human_participants: config.humanParticipants,
          ai_participants: config.aiParticipants,
          learning_objectives: config.learningObjectives.length > 0 ? config.learningObjectives : null,
          vote_1_threshold: config.vote1Threshold,
          vote_2_threshold: config.vote2Threshold,
        })
        .eq('run_id', runId)

      if (updateError) throw updateError

      // Re-create clans
      const templateClans = config.selectedTemplate!.canonical_clans as any[]
      const selectedClanNames = roleStore.roleSelection.selectedClans

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
      const templateRoles = config.selectedTemplate!.canonical_roles as any[]
      const selectedRoleAssignments = roleStore.getSelectedRoles()

      const rolesToCreate = selectedRoleAssignments.map((assignment: RoleAssignment) => {
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
      const templateStages = config.selectedTemplate!.process_stages as any[]
      const phaseDurations = roleStore.roleSelection.phaseDurations

      const phasesToCreate = templateStages.map((stage: any) => {
        const customDuration = phaseDurations[stage.sequence]

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

      wizardStore.setSaving(false)

      return { success: true }
    } catch (error) {
      console.error('Error updating simulation:', error)
      wizardStore.setError('update', error instanceof Error ? error.message : 'Failed to update simulation')
      wizardStore.setSaving(false)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update simulation',
      }
    }
  },

  // ========================================================================
  // RESET
  // ========================================================================

  resetConfig: () => {
    set({
      config: initialConfig,
      currentSimulation: null,
    })
  },
}))
