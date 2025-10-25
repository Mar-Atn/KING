/**
 * Simulation Success Component
 * Step 5 of Simulation Creation Wizard
 *
 * Shows success confirmation and next steps
 */

import { Link } from 'react-router-dom'
import { useSimulationStore } from '../../stores/simulationStore'

export function SimulationSuccess() {
  const { currentSimulation } = useSimulationStore()

  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="font-heading text-3xl text-primary mb-3">Simulation Created Successfully!</h2>
      <p className="text-neutral-600 mb-8">
        Your simulation has been created and is ready to configure.
      </p>

      {/* Simulation Details */}
      {currentSimulation && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
          <h3 className="font-medium text-neutral-900 mb-4">Simulation Details</h3>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <span className="text-sm text-neutral-600">Name:</span>
              <p className="font-medium text-neutral-900">{currentSimulation.run_name}</p>
            </div>
            <div>
              <span className="text-sm text-neutral-600">Status:</span>
              <p className="font-medium text-success capitalize">{currentSimulation.status}</p>
            </div>
            <div>
              <span className="text-sm text-neutral-600">Participants:</span>
              <p className="font-medium text-neutral-900">
                {currentSimulation.total_participants} ({currentSimulation.human_participants} human,{' '}
                {currentSimulation.ai_participants} AI)
              </p>
            </div>
            <div>
              <span className="text-sm text-neutral-600">Created:</span>
              <p className="font-medium text-neutral-900">
                {new Date(currentSimulation.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto text-left">
        <h3 className="font-medium text-neutral-900 mb-3">Next Steps:</h3>
        <ol className="space-y-2 text-sm text-neutral-700">
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">1.</span>
            <span>Assign participants to clans and roles</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">2.</span>
            <span>Review and adjust phase timings if needed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">3.</span>
            <span>Configure AI participants (if any)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">4.</span>
            <span>Set simulation to 'ready' status to lock configuration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">5.</span>
            <span>Launch the simulation when ready</span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
        <button
          disabled
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg opacity-50 cursor-not-allowed"
        >
          Configure Simulation (Coming Soon)
        </button>
      </div>
    </div>
  )
}
