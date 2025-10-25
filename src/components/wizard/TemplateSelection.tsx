/**
 * Template Selection Component
 * Step 1 of Simulation Creation Wizard
 *
 * Displays available simulation templates and allows facilitator to select one
 */

import { useSimulationStore } from '../../stores/simulationStore'
import { KING_PROCESS_PHASES, getTotalDuration } from '../../lib/processDefinition'

export function TemplateSelection() {
  const { templates, wizard, selectTemplate } = useSimulationStore()

  if (wizard.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-600">Loading templates...</p>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600 mb-4">No simulation templates available</p>
        <p className="text-sm text-neutral-500">Contact your administrator to load templates</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-heading text-2xl text-primary mb-2">Select Simulation Template</h2>
      <p className="text-neutral-600 mb-6">
        Choose a template to use as the foundation for your simulation
      </p>

      {/* Error Message */}
      {wizard.errors.template && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm mb-6">
          {wizard.errors.template}
        </div>
      )}

      {/* Templates Grid */}
      <div className="space-y-4">
        {templates.map((template) => {
          const isSelected = wizard.selectedTemplate?.template_id === template.template_id
          const stages = template.process_stages as any[]
          const clans = template.canonical_clans as any[]
          const roles = template.canonical_roles as any[]

          return (
            <button
              key={template.template_id}
              onClick={() => selectTemplate(template)}
              className={`w-full text-left p-6 border-2 rounded-lg transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-neutral-200 hover:border-primary hover:bg-neutral-50'
              }`}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-xl text-primary mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Version {template.version} • {template.language}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary text-white text-sm rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-neutral-700 mb-4 leading-relaxed">
                {template.description}
              </p>

              {/* Template Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary mb-1">{stages?.length || 12}</div>
                  <div className="text-xs text-neutral-600">Process Phases</div>
                </div>
                <div className="bg-neutral-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-secondary mb-1">{getTotalDuration()}</div>
                  <div className="text-xs text-neutral-600">Minutes Total</div>
                </div>
                <div className="bg-neutral-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary mb-1">{clans?.length || 6}</div>
                  <div className="text-xs text-neutral-600">Clans</div>
                </div>
                <div className="bg-neutral-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-secondary mb-1">{roles?.length || 30}</div>
                  <div className="text-xs text-neutral-600">Character Roles</div>
                </div>
              </div>

              {/* Template Preview (if selected) */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <h4 className="font-medium text-neutral-900 mb-3">Process Overview:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {KING_PROCESS_PHASES.slice(0, 6).map((phase) => (
                      <div key={phase.stage_number} className="flex items-center gap-2 text-neutral-700">
                        <span className="text-primary font-medium">{phase.stage_number}.</span>
                        <span>{phase.stage_name}</span>
                        <span className="text-neutral-500">({phase.default_duration_minutes} min)</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    ... and {KING_PROCESS_PHASES.length - 6} more phases
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
