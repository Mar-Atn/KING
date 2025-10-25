/**
 * Review Configuration Component
 * Step 5 of Simulation Creation Wizard
 *
 * Shows a summary of all configuration before creating the simulation
 */

import { useSimulationStore } from '../../stores/simulationStore'
import { getTotalDuration } from '../../lib/processDefinition'

export function ReviewConfiguration() {
  const { wizard } = useSimulationStore()

  const template = wizard.selectedTemplate
  const stages = template?.process_stages as any[] || []
  const clans = template?.canonical_clans as any[] || []

  // Calculate customization stats
  const selectedRoles = wizard.roleAssignments.filter(r => r.isSelected)
  const aiRoles = selectedRoles.filter(r => r.isAI)
  const humanRoles = selectedRoles.filter(r => !r.isAI)
  const hasTimingCustomizations = Object.keys(wizard.phaseDurations).length > 0

  // Calculate total duration with customizations
  const totalDuration = stages.reduce((sum, stage: any) => {
    const customDuration = wizard.phaseDurations[stage.sequence]
    return sum + (customDuration ?? stage.default_duration_minutes)
  }, 0)

  return (
    <div>
      <h2 className="font-heading text-2xl text-primary mb-2">Review Configuration</h2>
      <p className="text-neutral-600 mb-6">
        Review your complete simulation configuration before creating
      </p>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-neutral-600">Simulation Name:</span>
              <p className="font-medium text-neutral-900">{wizard.runName}</p>
            </div>
            <div>
              <span className="text-sm text-neutral-600">Template:</span>
              <p className="font-medium text-neutral-900">
                {template?.name} {template?.version}
              </p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-4">Participants</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {selectedRoles.length}
              </div>
              <div className="text-xs text-neutral-600">Total Roles</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {humanRoles.length}
              </div>
              <div className="text-xs text-neutral-600">Human Roles</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-secondary mb-1">
                {aiRoles.length}
              </div>
              <div className="text-xs text-neutral-600">AI Roles</div>
            </div>
          </div>
        </div>

        {/* Selected Clans & Roles */}
        <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-4">
            Selected Clans ({wizard.selectedClans.length} of {clans.length})
          </h3>
          <div className="space-y-3">
            {wizard.selectedClans.map((clanName: string) => {
              const clanRoles = selectedRoles.filter(r => r.clan === clanName)
              const clanAIRoles = clanRoles.filter(r => r.isAI)

              return (
                <div key={clanName} className="bg-white rounded-lg p-3 border border-neutral-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-900">{clanName}</span>
                    <span className="text-sm text-neutral-600">
                      {clanRoles.length} roles ({clanAIRoles.length} AI)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clanRoles.map(role => (
                      <span
                        key={role.sequence}
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          role.isAI
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {role.name} {role.isAI && '(AI)'}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Process Overview */}
        <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-4">
            Process Overview
            {hasTimingCustomizations && (
              <span className="ml-2 text-xs text-warning">(Custom Timing)</span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-neutral-600">Total Phases:</span>
              <p className="font-medium text-neutral-900">{stages.length} phases</p>
            </div>
            <div>
              <span className="text-sm text-neutral-600">Total Duration:</span>
              <p className={`font-medium ${hasTimingCustomizations ? 'text-warning' : 'text-neutral-900'}`}>
                {totalDuration} minutes
                {hasTimingCustomizations && (
                  <span className="text-xs ml-1">(was {getTotalDuration()} min)</span>
                )}
              </p>
            </div>
          </div>
          {hasTimingCustomizations ? (
            <div className="text-sm text-neutral-700 space-y-1">
              {stages.map((stage: any) => {
                const customDuration = wizard.phaseDurations[stage.sequence]
                const isModified = customDuration !== undefined

                return (
                  <div key={stage.sequence} className={`flex items-center gap-2 ${isModified ? 'text-warning' : ''}`}>
                    <span className="font-medium">{stage.sequence}.</span>
                    <span className="flex-1">{stage.name}</span>
                    <span>
                      ({customDuration ?? stage.default_duration_minutes} min
                      {isModified && ` ← was ${stage.default_duration_minutes}`})
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-neutral-700 space-y-1">
              {stages.slice(0, 4).map((stage: any) => (
                <div key={stage.sequence} className="flex items-center gap-2">
                  <span className="text-primary font-medium">{stage.sequence}.</span>
                  <span>{stage.name}</span>
                  <span className="text-neutral-500">({stage.default_duration_minutes} min)</span>
                </div>
              ))}
              <p className="text-xs text-neutral-500 pt-2">
                ... and {stages.length - 4} more phases
              </p>
            </div>
          )}
        </div>

        {/* Learning Objectives */}
        {wizard.learningObjectives.length > 0 && (
          <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
            <h3 className="font-medium text-neutral-900 mb-4">Learning Objectives</h3>
            <ul className="space-y-2">
              {wizard.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-medium">{index + 1}.</span>
                  <span className="text-neutral-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warning */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-warning-dark">
            <strong>Note:</strong> Once created, the simulation configuration cannot be changed.
            Please review carefully before proceeding.
          </p>
        </div>
      </div>
    </div>
  )
}
