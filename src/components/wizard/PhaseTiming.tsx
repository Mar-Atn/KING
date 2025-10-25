/**
 * Phase Timing Adjustment Component
 * Step 4 of Simulation Creation Wizard
 *
 * Allows facilitator to customize duration of each phase
 * Shows default timing from template, allows override
 */

import { useSimulationStore } from '../../stores/simulationStore'

export function PhaseTiming() {
  const {
    wizard,
    setPhaseDuration,
    setTotalDuration,
    resetPhaseDurations,
  } = useSimulationStore()

  const template = wizard.selectedTemplate
  const stages = template?.process_stages as any[] || []

  // Calculate current total duration
  const totalDuration = stages.reduce((sum, stage) => {
    const customDuration = wizard.phaseDurations[stage.sequence]
    return sum + (customDuration ?? stage.default_duration_minutes)
  }, 0)

  // Calculate default total from template
  const defaultTotal = stages.reduce((sum, stage) => sum + stage.default_duration_minutes, 0)

  const hasCustomizations = Object.keys(wizard.phaseDurations).length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-2xl text-primary">Phase Timing</h2>
        {hasCustomizations && (
          <button
            onClick={resetPhaseDurations}
            className="text-sm text-secondary hover:text-secondary-hover underline"
          >
            Reset to Defaults
          </button>
        )}
      </div>
      <p className="text-neutral-600 mb-6">
        Set your total simulation duration, and we'll proportionally distribute time across phases. You can also adjust individual phases below.
      </p>

      {/* Total Duration Input */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-neutral-900 mb-3">
          Total Simulation Duration
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="number"
              min="30"
              max="300"
              value={totalDuration}
              onChange={(e) => {
                const newTotal = parseInt(e.target.value)
                if (!isNaN(newTotal) && newTotal >= 30 && newTotal <= 300) {
                  setTotalDuration(newTotal)
                }
              }}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-center text-2xl font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <span className="text-lg text-neutral-600">minutes</span>
          {hasCustomizations && totalDuration !== defaultTotal && (
            <span className="text-sm text-neutral-500">
              (default: {defaultTotal} min)
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-600 mt-2">
          Time will be distributed proportionally across all phases, rounded to 5-minute increments (5, 10, 15, 20, 25 min).
        </p>
      </div>

      {/* Phase List */}
      <div className="space-y-3">
        {stages.map((stage: any) => {
          const customDuration = wizard.phaseDurations[stage.sequence]
          const currentDuration = customDuration ?? stage.default_duration_minutes
          const isModified = customDuration !== undefined

          return (
            <div
              key={stage.sequence}
              className={`border rounded-lg p-4 transition-colors ${
                isModified
                  ? 'border-warning bg-warning/5'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Stage Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium text-sm">
                  {stage.sequence}
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{stage.name}</div>
                  <div className="text-sm text-neutral-600">{stage.description}</div>
                  {isModified && (
                    <div className="text-xs text-warning mt-1">
                      Default: {stage.default_duration_minutes} minutes
                    </div>
                  )}
                </div>

                {/* Duration Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={currentDuration}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value)
                      if (!isNaN(newDuration) && newDuration >= 1 && newDuration <= 60) {
                        setPhaseDuration(stage.sequence, newDuration)
                      }
                    }}
                    className="w-20 px-3 py-2 border border-neutral-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-neutral-600">min</span>

                  {/* Reset Individual Phase */}
                  {isModified && (
                    <button
                      onClick={() => {
                        // Reset to default by removing from customizations
                        const { [stage.sequence]: _, ...rest } = wizard.phaseDurations
                        wizard.phaseDurations = rest
                        setPhaseDuration(stage.sequence, stage.default_duration_minutes)
                      }}
                      className="ml-2 text-xs text-neutral-500 hover:text-neutral-700"
                      title="Reset to default"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Phase Type Badge */}
              <div className="mt-2 flex flex-wrap gap-2">
                {stage.phase_type && (
                  <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
                    {stage.phase_type.replace('_', ' ')}
                  </span>
                )}
                {stage.allows_private_meetings && (
                  <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    Private Meetings
                  </span>
                )}
                {stage.allows_public_discussion && (
                  <span className="inline-block px-2 py-1 bg-secondary/10 text-secondary rounded text-xs">
                    Public Discussion
                  </span>
                )}
                {stage.requires_facilitator_action && (
                  <span className="inline-block px-2 py-1 bg-warning/10 text-warning rounded text-xs">
                    Facilitator Action Required
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="font-medium text-neutral-900 mb-2 text-sm">How It Works:</h4>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            <span>Set your desired total duration above (e.g., 90, 120, 150 minutes)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            <span>System automatically distributes time proportionally across all 12 phases</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            <span>All phase times are rounded to 5-minute increments (5, 10, 15, 20, 25 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            <span>You can then manually adjust any individual phase as needed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Modified phases are highlighted in yellow</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
