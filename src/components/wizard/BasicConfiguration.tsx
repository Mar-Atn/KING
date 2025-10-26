/**
 * Basic Configuration Component
 * Step 2 of Simulation Creation Wizard
 *
 * Configure basic simulation parameters: name, participant counts, objectives
 */

import { useState } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

export function BasicConfiguration() {
  const {
    wizard,
    setRunName,
    setParticipantCounts,
    setLearningObjectives,
    setVotingThresholds,
  } = useSimulationStore()

  const [objectiveInput, setObjectiveInput] = useState('')

  // Calculate default voting thresholds (2/3 majority)
  const defaultVote1Threshold = Math.ceil(wizard.totalParticipants * 2 / 3)
  const defaultVote2Threshold = Math.ceil(wizard.totalParticipants * 2 / 3)

  const handleVote1Change = (value: string) => {
    const num = parseInt(value)
    setVotingThresholds(isNaN(num) ? null : num, wizard.vote2Threshold)
  }

  const handleVote2Change = (value: string) => {
    const num = parseInt(value)
    setVotingThresholds(wizard.vote1Threshold, isNaN(num) ? null : num)
  }

  const handleAddObjective = () => {
    if (objectiveInput.trim() && wizard.learningObjectives.length < 3) {
      setLearningObjectives([...wizard.learningObjectives, objectiveInput.trim()])
      setObjectiveInput('')
    }
  }

  const handleRemoveObjective = (index: number) => {
    setLearningObjectives(wizard.learningObjectives.filter((_, i) => i !== index))
  }

  const handleTotalParticipantsChange = (total: number) => {
    // Maintain ratio when total changes
    const ratio = wizard.humanParticipants / wizard.totalParticipants || 0.8
    const human = Math.round(total * ratio)
    const ai = total - human
    setParticipantCounts(total, human, ai)
  }

  const handleHumanParticipantsChange = (human: number) => {
    const ai = wizard.totalParticipants - human
    setParticipantCounts(wizard.totalParticipants, human, ai)
  }

  return (
    <div>
      <h2 className="font-heading text-2xl text-primary mb-2">Configure Simulation</h2>
      <p className="text-neutral-600 mb-6">
        Set up the basic parameters for your simulation run
      </p>

      <div className="space-y-6">
        {/* Simulation Name */}
        <div>
          <label htmlFor="runName" className="block text-sm font-medium text-neutral-700 mb-2">
            Simulation Name *
          </label>
          <input
            id="runName"
            type="text"
            value={wizard.runName}
            onChange={(e) => setRunName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
              wizard.errors.runName ? 'border-error' : 'border-neutral-300'
            }`}
            placeholder="e.g., Cyprus Leadership Summit 2025"
          />
          {wizard.errors.runName && (
            <p className="mt-1 text-sm text-error">{wizard.errors.runName}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Choose a descriptive name to identify this simulation run
          </p>
        </div>

        {/* Participant Configuration */}
        <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-4">Participant Configuration</h3>

          {/* Total Participants */}
          <div className="mb-4">
            <label htmlFor="totalParticipants" className="block text-sm font-medium text-neutral-700 mb-2">
              Total Participants *
            </label>
            <div className="flex items-center gap-4">
              <input
                id="totalParticipants"
                type="range"
                min="10"
                max="30"
                value={wizard.totalParticipants}
                onChange={(e) => handleTotalParticipantsChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-primary w-12 text-center">
                {wizard.totalParticipants}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Recommended: 15-20 participants for best experience
            </p>
          </div>

          {/* Human vs AI Split */}
          <div className="grid grid-cols-2 gap-4">
            {/* Human Participants */}
            <div>
              <label htmlFor="humanParticipants" className="block text-sm font-medium text-neutral-700 mb-2">
                Human Participants
              </label>
              <input
                id="humanParticipants"
                type="number"
                min="0"
                max={wizard.totalParticipants}
                value={wizard.humanParticipants}
                onChange={(e) => handleHumanParticipantsChange(Number(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* AI Participants */}
            <div>
              <label htmlFor="aiParticipants" className="block text-sm font-medium text-neutral-700 mb-2">
                AI Participants
              </label>
              <input
                id="aiParticipants"
                type="number"
                value={wizard.aiParticipants}
                disabled
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600"
              />
            </div>
          </div>

          {wizard.errors.participants && (
            <p className="mt-2 text-sm text-error">{wizard.errors.participants}</p>
          )}

          {/* Participant Distribution Visualization */}
          <div className="mt-4">
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden flex">
              <div
                className="bg-primary transition-all"
                style={{ width: `${(wizard.humanParticipants / wizard.totalParticipants) * 100}%` }}
              />
              <div
                className="bg-secondary transition-all"
                style={{ width: `${(wizard.aiParticipants / wizard.totalParticipants) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-600">
              <span>
                <span className="inline-block w-3 h-3 bg-primary rounded-full mr-1" />
                Human ({wizard.humanParticipants})
              </span>
              <span>
                <span className="inline-block w-3 h-3 bg-secondary rounded-full mr-1" />
                AI ({wizard.aiParticipants})
              </span>
            </div>
          </div>
        </div>

        {/* Voting Thresholds (Sacred Tradition) */}
        <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
          <h3 className="font-medium text-neutral-900 mb-2">⚖️ Voting Thresholds (Sacred Tradition)</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Set the number of votes required for a candidate to be elected King.
            Default is 2/3 majority ({defaultVote1Threshold} votes out of {wizard.totalParticipants}).
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Vote 1 Threshold */}
            <div>
              <label htmlFor="vote1Threshold" className="block text-sm font-medium text-neutral-700 mb-2">
                Vote 1 Threshold
              </label>
              <input
                id="vote1Threshold"
                type="number"
                min="1"
                max={wizard.totalParticipants}
                value={wizard.vote1Threshold ?? defaultVote1Threshold}
                onChange={(e) => handleVote1Change(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={`Default: ${defaultVote1Threshold}`}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Votes needed in first election round
              </p>
            </div>

            {/* Vote 2 Threshold */}
            <div>
              <label htmlFor="vote2Threshold" className="block text-sm font-medium text-neutral-700 mb-2">
                Vote 2 Threshold
              </label>
              <input
                id="vote2Threshold"
                type="number"
                min="1"
                max={wizard.totalParticipants}
                value={wizard.vote2Threshold ?? defaultVote2Threshold}
                onChange={(e) => handleVote2Change(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={`Default: ${defaultVote2Threshold}`}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Votes needed in second election round
              </p>
            </div>
          </div>
        </div>

        {/* Learning Objectives (Optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Learning Objectives <span className="text-neutral-500">(Optional, up to 3)</span>
          </label>

          {/* Existing Objectives */}
          {wizard.learningObjectives.length > 0 && (
            <div className="space-y-2 mb-3">
              {wizard.learningObjectives.map((objective, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2"
                >
                  <span className="flex-1 text-sm text-neutral-900">{objective}</span>
                  <button
                    onClick={() => handleRemoveObjective(index)}
                    className="text-error hover:text-error/80 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Objective Input */}
          {wizard.learningObjectives.length < 3 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Develop strategic negotiation skills"
              />
              <button
                onClick={handleAddObjective}
                disabled={!objectiveInput.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}

          <p className="mt-1 text-xs text-neutral-500">
            Define what participants should learn from this simulation
          </p>
        </div>

        {/* Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-medium text-primary mb-2">Configuration Summary</h4>
          <ul className="space-y-1 text-sm text-neutral-700">
            <li>
              <strong>Name:</strong> {wizard.runName || '(Not set)'}
            </li>
            <li>
              <strong>Participants:</strong> {wizard.totalParticipants} total ({wizard.humanParticipants} human,{' '}
              {wizard.aiParticipants} AI)
            </li>
            <li>
              <strong>Vote 1 Threshold:</strong> {wizard.vote1Threshold ?? defaultVote1Threshold} votes
            </li>
            <li>
              <strong>Vote 2 Threshold:</strong> {wizard.vote2Threshold ?? defaultVote2Threshold} votes
            </li>
            <li>
              <strong>Template:</strong> {wizard.selectedTemplate?.name} {wizard.selectedTemplate?.version}
            </li>
            <li>
              <strong>Objectives:</strong> {wizard.learningObjectives.length || 'None specified'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
