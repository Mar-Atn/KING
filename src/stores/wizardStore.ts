/**
 * Wizard Store
 *
 * Manages wizard navigation, step tracking, and validation state.
 * Handles the multi-step flow for simulation creation/editing.
 */

import { create } from 'zustand'

// Wizard step type (7 steps total)
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

// Wizard mode type
export type WizardMode = 'create' | 'edit'

// Wizard state interface
export interface WizardState {
  // Current step in the wizard (1-7)
  currentStep: WizardStep

  // Wizard mode (create or edit)
  mode: WizardMode

  // Edit mode tracking
  editingRunId: string | null

  // Validation errors by field
  errors: Record<string, string>

  // Loading state
  isLoading: boolean

  // Saving state
  isSaving: boolean
}

// Store interface
interface WizardStore {
  // State
  wizard: WizardState

  // Navigation Actions
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: WizardStep) => void
  setCurrentStep: (step: WizardStep) => void

  // Mode Management
  setWizardMode: (mode: WizardMode, runId?: string) => void

  // State Management
  setLoading: (isLoading: boolean) => void
  setSaving: (isSaving: boolean) => void

  // Validation
  setError: (field: string, error: string) => void
  clearErrors: () => void
  clearError: (field: string) => void
  hasErrors: () => boolean

  // Reset
  resetWizard: () => void
}

// Initial wizard state
const initialWizardState: WizardState = {
  currentStep: 1,
  mode: 'create',
  editingRunId: null,
  errors: {},
  isLoading: false,
  isSaving: false,
}

/**
 * Wizard Store
 * Handles wizard navigation and state management
 */
export const useWizardStore = create<WizardStore>((set, get) => ({
  // Initial state
  wizard: initialWizardState,

  // ========================================================================
  // NAVIGATION ACTIONS
  // ========================================================================

  nextStep: () => {
    const { wizard } = get()
    if (wizard.currentStep < 7) {
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

  setCurrentStep: (step: WizardStep) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        currentStep: step,
      },
    })
  },

  // ========================================================================
  // MODE MANAGEMENT
  // ========================================================================

  setWizardMode: (mode: WizardMode, runId?: string) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        mode,
        editingRunId: runId || null,
      },
    })
  },

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  setLoading: (isLoading: boolean) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        isLoading,
      },
    })
  },

  setSaving: (isSaving: boolean) => {
    const { wizard } = get()
    set({
      wizard: {
        ...wizard,
        isSaving,
      },
    })
  },

  // ========================================================================
  // VALIDATION
  // ========================================================================

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

  clearError: (field: string) => {
    const { wizard } = get()
    const { [field]: _, ...remainingErrors } = wizard.errors
    set({
      wizard: {
        ...wizard,
        errors: remainingErrors,
      },
    })
  },

  hasErrors: (): boolean => {
    const { wizard } = get()
    return Object.keys(wizard.errors).length > 0
  },

  // ========================================================================
  // RESET
  // ========================================================================

  resetWizard: () => {
    set({
      wizard: initialWizardState,
    })
  },
}))
