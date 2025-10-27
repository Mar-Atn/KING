import { useState } from 'react'
import { usePhaseStore } from '../stores/phaseStore'
import type { Phase } from '../types/database'
import { getCategoryLabel } from '../lib/processDefinition'

interface PhaseControlsProps {
  runId: string
  className?: string
}

export function PhaseControls({ runId, className = '' }: PhaseControlsProps) {
  const {
    currentPhase,
    allPhases,
    timer,
    getNextPhase,
    startPhase,
    pausePhase,
    resumePhase,
    endPhase,
    skipPhase,
    extendPhase,
  } = usePhaseStore()

  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendMinutes, setExtendMinutes] = useState(5)
  const [loading, setLoading] = useState(false)

  const nextPhase = getNextPhase()

  const handleStartPhase = async (phase: Phase) => {
    if (!confirm(`Start "${phase.name}"? This will begin the timer.`)) return

    setLoading(true)
    try {
      await startPhase(phase.phase_id)
    } catch (error: any) {
      alert(`Error starting phase: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePausePhase = async () => {
    setLoading(true)
    try {
      await pausePhase()
    } catch (error: any) {
      alert(`Error pausing phase: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResumePhase = async () => {
    setLoading(true)
    try {
      await resumePhase()
    } catch (error: any) {
      alert(`Error resuming phase: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEndPhase = async () => {
    if (!currentPhase) return
    if (!confirm(`End "${currentPhase.name}"? This will complete the phase.`)) return

    setLoading(true)
    try {
      await endPhase()
    } catch (error: any) {
      alert(`Error ending phase: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkipPhase = async () => {
    if (!currentPhase) return
    if (
      !confirm(
        `Skip "${currentPhase.name}"? This phase will be marked as skipped and you'll move to the next one.`
      )
    )
      return

    setLoading(true)
    try {
      await skipPhase(currentPhase.phase_id)
    } catch (error: any) {
      alert(`Error skipping phase: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExtendPhase = async () => {
    if (!currentPhase) return

    setLoading(true)
    try {
      await extendPhase(extendMinutes)
      setShowExtendModal(false)
    } catch (error: any) {
      alert(`Error extending phase: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-white rounded-lg border-2 border-neutral-200 p-6 ${className}`}>
      <h3 className="font-heading text-lg text-primary mb-4">Phase Controls</h3>

      {/* Current Phase Display */}
      {currentPhase ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium text-neutral-900">
                Phase {currentPhase.sequence_number}: {currentPhase.name}
              </div>
              <div className="text-sm text-neutral-600">
                Status:{' '}
                <span
                  className={`font-medium ${
                    currentPhase.status === 'active'
                      ? 'text-success'
                      : currentPhase.status === 'paused'
                      ? 'text-warning'
                      : currentPhase.status === 'completed'
                      ? 'text-neutral-400'
                      : 'text-neutral-600'
                  }`}
                >
                  {currentPhase.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Timer Display */}
            {currentPhase.status === 'active' || currentPhase.status === 'paused' ? (
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(timer.remainingSeconds)}
                </div>
                <div className="text-xs text-neutral-500">
                  {timer.remainingSeconds <= 0 ? 'Time expired' : 'remaining'}
                </div>
              </div>
            ) : null}
          </div>

          {/* Progress Bar */}
          {(currentPhase.status === 'active' || currentPhase.status === 'paused') && (
            <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all ${
                  currentPhase.status === 'active' ? 'bg-success' : 'bg-warning'
                }`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      ((currentPhase.default_duration_minutes * 60 - timer.remainingSeconds) /
                        (currentPhase.default_duration_minutes * 60)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 flex-wrap">
            {currentPhase.status === 'active' && (
              <>
                <button
                  onClick={handlePausePhase}
                  disabled={loading}
                  className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={handleEndPhase}
                  disabled={loading}
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  ✓ End Phase
                </button>
                <button
                  onClick={() => setShowExtendModal(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  ⏲ Extend
                </button>
              </>
            )}

            {currentPhase.status === 'paused' && (
              <>
                <button
                  onClick={handleResumePhase}
                  disabled={loading}
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  ▶ Resume
                </button>
                <button
                  onClick={handleEndPhase}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  ✓ End Phase
                </button>
              </>
            )}

            {(currentPhase.status === 'active' || currentPhase.status === 'paused') && (
              <button
                onClick={handleSkipPhase}
                disabled={loading}
                className="px-4 py-2 bg-neutral-400 text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                ⏭ Skip
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 text-neutral-500">
          No active phase. Start the first phase to begin.
        </div>
      )}

      {/* Next Phase */}
      {nextPhase && (
        <div className="pt-4 border-t border-neutral-200">
          <div className="text-sm text-neutral-600 mb-2">Next Phase:</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-900">
                Phase {nextPhase.sequence_number}: {nextPhase.name}
              </div>
              <div className="text-sm text-neutral-500">
                {nextPhase.default_duration_minutes} minutes
              </div>
            </div>
            <button
              onClick={() => handleStartPhase(nextPhase)}
              disabled={loading || (currentPhase?.status === 'active')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶ Start
            </button>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-heading text-lg text-primary mb-4">Extend Phase</h3>
            <p className="text-neutral-600 mb-4">
              Add more time to the current phase. This will extend the timer and notify all
              participants.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Additional Minutes
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExtendPhase}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                Extend by {extendMinutes} min
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase List with Grouping */}
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="text-sm font-medium text-neutral-700 mb-3">Simulation Phases:</div>

        {/* Helper function to infer category from sequence number for backward compatibility */}
        {(() => {
          // Infer category if phase_category is missing (for old simulations)
          const phasesWithCategory = allPhases.map((p: any) => {
            if (p.phase_category) return p

            // Infer category based on sequence number
            // Phase 0: pre_play
            // Phases 1-12: active_play
            // Phases 13+: post_play
            let inferredCategory = 'active_play'
            if (p.sequence_number === 0) {
              inferredCategory = 'pre_play'
            } else if (p.sequence_number >= 13) {
              inferredCategory = 'post_play'
            }

            return { ...p, phase_category: inferredCategory }
          })

          // Group phases by category
          return ['pre_play', 'active_play', 'post_play'].map((category) => {
            const categoryPhases = phasesWithCategory.filter(
              (p: any) => p.phase_category === category
            )

            if (categoryPhases.length === 0) return null

            return (
              <div key={category} className="mb-4">
                {/* Category Header */}
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span
                    className={`w-3 h-0.5 ${
                      category === 'pre_play'
                        ? 'bg-accent'
                        : category === 'active_play'
                        ? 'bg-primary'
                        : 'bg-secondary'
                    }`}
                  />
                  {getCategoryLabel(category as any)}
                </div>

                {/* Phase Items */}
                <div className="space-y-1">
                  {categoryPhases.map((phase: any) => (
                    <div
                      key={phase.phase_id}
                      className={`text-sm flex items-center justify-between py-1.5 px-2 rounded ${
                        phase.phase_id === currentPhase?.phase_id
                          ? 'bg-primary bg-opacity-10 border border-primary/20'
                          : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            phase.status === 'completed'
                              ? 'bg-success'
                              : phase.status === 'active'
                              ? 'bg-primary'
                              : phase.status === 'paused'
                              ? 'bg-warning'
                              : phase.status === 'skipped'
                              ? 'bg-neutral-400'
                              : 'bg-neutral-200'
                          }`}
                        />
                        <span className="text-neutral-900 text-xs">
                          {phase.sequence_number}. {phase.name}
                        </span>
                      </span>
                      <span className="text-neutral-500 text-xs">{phase.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}
