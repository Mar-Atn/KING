/**
 * Simulation Store Tests
 * Tests simulation CRUD operations, template management, and state management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSimulationStore } from '../simulationStore'
import {
  mockQuerySuccess,
  mockQueryError,
} from '@/test/utils/testSupabaseClient'
import { TEST_SIMULATION, createTestSimulation } from '@/test/fixtures/testData'

// Mock the supabase client
vi.mock('@/lib/supabase', () => {
  const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })

  const mockClient = {
    from: vi.fn(() => createMockQueryBuilder()),
  }
  return { supabase: mockClient }
})

// Mock the wizard store
vi.mock('../wizardStore', () => ({
  useWizardStore: {
    getState: vi.fn(() => ({
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
      clearErrors: vi.fn(), // Used by validateCurrentStep
      addError: vi.fn(),
      setSaving: vi.fn(), // Used by create/update
      setWizardMode: vi.fn(), // Used by loadSimulationForEdit
    })),
  },
}))

// Mock the role selection store
vi.mock('../roleSelectionStore', () => ({
  useRoleSelectionStore: {
    getState: vi.fn(() => ({
      roleAssignments: {},
      roleSelection: {
        selectedClans: [],
        phaseDurations: {},
      },
      getAssignedRoles: vi.fn(() => []),
      getSelectedRoles: vi.fn(() => []), // Used by createSimulation
      getAIRoles: vi.fn(() => []), // Used by validateCurrentStep
      initializeRoleAssignments: vi.fn(), // Used by setParticipantCounts
      setSelectedClans: vi.fn(), // Used by loadSimulationForEdit
      setRoleAssignments: vi.fn(), // Used by loadSimulationForEdit
      setPhaseDurations: vi.fn(), // Used by loadSimulationForEdit
      assignRole: vi.fn(),
      unassignRole: vi.fn(),
    })),
  },
}))

describe('Simulation Store', () => {
  let mockSupabase: any

  beforeEach(async () => {
    const { supabase } = await import('@/lib/supabase')
    mockSupabase = supabase
    vi.clearAllMocks()

    // Reset store state
    const store = useSimulationStore.getState()
    store.resetConfig()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Configuration Management', () => {
    it('should set run name', () => {
      const store = useSimulationStore.getState()
      store.setRunName('Test Simulation')

      expect(store.config.runName).toBe('Test Simulation')
    })

    it('should set participant counts', () => {
      const store = useSimulationStore.getState()
      store.setParticipantCounts(20, 15, 5)

      expect(store.config.totalParticipants).toBe(20)
      expect(store.config.humanParticipants).toBe(15)
      expect(store.config.aiParticipants).toBe(5)
    })

    it('should set learning objectives', () => {
      const store = useSimulationStore.getState()
      const objectives = ['Learn negotiation', 'Practice debate']
      store.setLearningObjectives(objectives)

      expect(store.config.learningObjectives).toEqual(objectives)
    })

    it('should set voting thresholds', () => {
      const store = useSimulationStore.getState()
      store.setVotingThresholds(10, 12)

      expect(store.config.vote1Threshold).toBe(10)
      expect(store.config.vote2Threshold).toBe(12)
    })

    it('should set partial config', () => {
      const store = useSimulationStore.getState()
      store.setConfig({
        runName: 'New Name',
        totalParticipants: 25,
      })

      expect(store.config.runName).toBe('New Name')
      expect(store.config.totalParticipants).toBe(25)
      // Other properties unchanged
      expect(store.config.humanParticipants).toBe(15) // default
    })

    it('should reset config to initial state', () => {
      const store = useSimulationStore.getState()

      // Change some values
      store.setRunName('Test')
      store.setParticipantCounts(30, 20, 10)

      // Reset
      store.resetConfig()

      expect(store.config.runName).toBe('')
      expect(store.config.totalParticipants).toBe(18)
      expect(store.config.humanParticipants).toBe(15)
    })
  })

  describe('Template Management', () => {
    it('should load templates successfully', async () => {
      const templates = [
        { template_id: '1', name: 'Template 1', description: 'Test 1' },
        { template_id: '2', name: 'Template 2', description: 'Test 2' },
      ]

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockQuerySuccess(templates)),
      } as any)

      const store = useSimulationStore.getState()
      await store.loadTemplates()

      expect(store.templates).toHaveLength(2)
      expect(store.templates[0].template_id).toBe('1')
    })

    it('should handle template load error', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockQueryError('Database error')),
      } as any)

      const store = useSimulationStore.getState()
      await store.loadTemplates()

      // Templates should be empty on error
      expect(store.templates).toHaveLength(0)
    })

    it('should select template and update config', () => {
      const template = {
        template_id: '1',
        name: 'Kourion Crisis',
        description: 'Test template',
      } as any

      const store = useSimulationStore.getState()
      store.selectTemplate(template)

      expect(store.config.selectedTemplate).toEqual(template)
    })
  })

  describe('Simulation Creation', () => {
    it('should create simulation successfully', async () => {
      const newSimulation = createTestSimulation({
        run_id: 'new-sim-id',
        title: 'New Simulation',
      })

      // Mock successful creation
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockQuerySuccess(newSimulation)),
      } as any)

      const store = useSimulationStore.getState()
      store.setRunName('New Simulation')
      store.selectTemplate({ template_id: 'template-1' } as any)

      const result = await store.createSimulation('facilitator-id')

      expect(result.success).toBe(true)
      expect(result.runId).toBe('new-sim-id')
    })

    it('should handle creation error', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue(
          mockQueryError('Failed to create simulation')
        ),
      } as any)

      const store = useSimulationStore.getState()
      store.setRunName('New Simulation')
      store.selectTemplate({ template_id: 'template-1' } as any)

      const result = await store.createSimulation('facilitator-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create simulation')
    })

    it('should validate template selection before creation', async () => {
      const store = useSimulationStore.getState()
      store.setRunName('New Simulation')
      // No template selected

      const result = await store.createSimulation('facilitator-id')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Simulation Loading', () => {
    it('should load simulation successfully', async () => {
      const simulation = TEST_SIMULATION

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockQuerySuccess(simulation)),
      } as any)

      const store = useSimulationStore.getState()
      await store.loadSimulation(simulation.run_id)

      expect(store.currentSimulation).toEqual(simulation)
    })

    it('should handle load error', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(
          mockQueryError('Simulation not found')
        ),
      } as any)

      const store = useSimulationStore.getState()
      await store.loadSimulation('nonexistent-id')

      expect(store.currentSimulation).toBeNull()
    })

    it('should load simulation for edit with full data', async () => {
      const simulation = TEST_SIMULATION

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockQuerySuccess(simulation)),
      } as any)

      const store = useSimulationStore.getState()
      const result = await store.loadSimulationForEdit(simulation.run_id)

      expect(result.success).toBe(true)
      expect(store.currentSimulation).toEqual(simulation)
      expect(store.config.runName).toBe(simulation.title)
    })
  })

  describe('Simulation Update', () => {
    it('should update simulation successfully', async () => {
      const updatedSimulation = { ...TEST_SIMULATION, title: 'Updated Title' }

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockQuerySuccess(updatedSimulation)),
      } as any)

      const store = useSimulationStore.getState()
      store.setRunName('Updated Title')
      const result = await store.updateSimulation(TEST_SIMULATION.run_id)

      expect(result.success).toBe(true)
    })

    it('should handle update error', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        update: vi.fn().mockResolvedValue(
          mockQueryError('Update failed')
        ),
      } as any)

      const store = useSimulationStore.getState()
      const result = await store.updateSimulation(TEST_SIMULATION.run_id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Update failed')
    })
  })

  describe('Simulation Deletion', () => {
    it('should delete simulation successfully', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockQuerySuccess(null)),
      } as any)

      const store = useSimulationStore.getState()
      const result = await store.deleteSimulation(TEST_SIMULATION.run_id)

      expect(result.success).toBe(true)
    })

    it('should handle deletion error', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(
          mockQueryError('Cannot delete active simulation')
        ),
      } as any)

      const store = useSimulationStore.getState()
      const result = await store.deleteSimulation(TEST_SIMULATION.run_id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to delete simulation')
    })
  })

  describe('Validation', () => {
    it('should validate step 1 (template selection)', () => {
      const store = useSimulationStore.getState()

      // Invalid: no template selected
      expect(store.validateCurrentStep(1)).toBe(false)

      // Valid: template selected
      store.selectTemplate({ template_id: '1' } as any)
      expect(store.validateCurrentStep(1)).toBe(true)
    })

    it('should validate step 2 (basic configuration)', () => {
      const store = useSimulationStore.getState()

      // Invalid: no run name
      expect(store.validateCurrentStep(2)).toBe(false)

      // Valid: run name set
      store.setRunName('Test Simulation')
      expect(store.validateCurrentStep(2)).toBe(true)
    })

    it('should validate participant counts', () => {
      const store = useSimulationStore.getState()
      store.setRunName('Test')
      store.selectTemplate({ template_id: '1' } as any)

      // Valid: human + ai = total
      store.setParticipantCounts(18, 15, 3)
      expect(store.validateCurrentStep(2)).toBe(true)

      // Invalid: human + ai ≠ total (10 + 5 = 15 ≠ 18)
      store.setParticipantCounts(18, 10, 5)
      // Validation should fail when counts don't match
      expect(store.validateCurrentStep(2)).toBe(false)
    })
  })
})
