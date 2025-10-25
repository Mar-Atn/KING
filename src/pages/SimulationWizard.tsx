/**
 * Simulation Creation Wizard
 *
 * Multi-step wizard for facilitators to create new simulations
 * Steps:
 * 1. Template Selection
 * 2. Basic Configuration
 * 3. Clan & Role Selection
 * 4. Phase Timing
 * 5. Review & Confirm
 * 6. Creating... / Create
 * 7. Success
 *
 * Note: Template editing (clans/roles) is done separately via "Edit Scenario"
 */

import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSimulationStore } from '../stores/simulationStore'
import { TemplateSelection } from '../components/wizard/TemplateSelection'
import { BasicConfiguration } from '../components/wizard/BasicConfiguration'
import { ClanRoleSelection } from '../components/wizard/ClanRoleSelection'
import { PhaseTiming } from '../components/wizard/PhaseTiming'
import { ReviewConfiguration } from '../components/wizard/ReviewConfiguration'
import { SimulationSuccess } from '../components/wizard/SimulationSuccess'

export function SimulationWizard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const {
    wizard,
    nextStep,
    previousStep,
    resetWizard,
    loadTemplates,
    createSimulation,
  } = useSimulationStore()

  // Handle creation process
  const handleCreateSimulation = async () => {
    if (!user?.id) return

    const result = await createSimulation(user.id)
    if (result.success) {
      nextStep() // Move to success screen
    }
  }

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // Redirect if not facilitator
  useEffect(() => {
    if (profile && profile.role !== 'facilitator') {
      navigate('/dashboard')
    }
  }, [profile, navigate])

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Template' },
      { num: 2, label: 'Configure' },
      { num: 3, label: 'Clans & Roles' },
      { num: 4, label: 'Timing' },
      { num: 5, label: 'Review' },
      { num: 6, label: 'Create' },
      { num: 7, label: 'Done' },
    ]

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            {/* Step Circle */}
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-colors ${
                wizard.currentStep === step.num
                  ? 'bg-primary text-white'
                  : wizard.currentStep > step.num
                  ? 'bg-success text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {wizard.currentStep > step.num ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.num
              )}
            </div>

            {/* Step Label */}
            <span
              className={`ml-2 text-sm font-medium ${
                wizard.currentStep === step.num
                  ? 'text-primary'
                  : wizard.currentStep > step.num
                  ? 'text-success'
                  : 'text-neutral-600'
              }`}
            >
              {step.label}
            </span>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-4 transition-colors ${
                  wizard.currentStep > step.num ? 'bg-success' : 'bg-neutral-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return <TemplateSelection />
      case 2:
        return <BasicConfiguration />
      case 3:
        return <ClanRoleSelection />
      case 4:
        return <PhaseTiming />
      case 5:
        return <ReviewConfiguration />
      case 6:
        // Creating step - show loading or confirmation
        return (
          <div className="text-center py-12">
            {wizard.isSaving ? (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-neutral-600">Creating your simulation...</p>
              </>
            ) : (
              <>
                <h2 className="font-heading text-2xl text-primary mb-4">Ready to Create</h2>
                <p className="text-neutral-600 mb-8">
                  Click "Create Simulation" below to finalize and create your simulation.
                </p>
                {wizard.errors.create && (
                  <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm max-w-md mx-auto">
                    {wizard.errors.create}
                  </div>
                )}
              </>
            )}
          </div>
        )
      case 7:
        return <SimulationSuccess />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-primary hover:text-primary-hover">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="font-heading text-3xl text-primary">Create New Simulation</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Configure a new simulation run for The New King SIM
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Cancel simulation creation? All progress will be lost.')) {
                  resetWizard()
                  navigate('/dashboard')
                }
              }}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-primary">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={previousStep}
            disabled={wizard.currentStep === 1 || wizard.currentStep === 7 || wizard.isSaving}
            className="px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={wizard.currentStep === 6 ? handleCreateSimulation : nextStep}
            disabled={wizard.currentStep === 7 || wizard.isSaving}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {wizard.isSaving ? 'Creating...' : wizard.currentStep === 6 ? 'Create Simulation' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  )
}
