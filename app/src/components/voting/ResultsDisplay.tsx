/**
 * ResultsDisplay Component
 *
 * Displays vote results in Mediterranean style without modern icons.
 * Shows winner, vote tallies using clean text-based design.
 *
 * Sprint 1: Voting System Implementation
 * Updated: October 29, 2025 - Mediterranean style
 */

import { useState, useEffect } from 'react'
import { useVoting } from '../../hooks/useVoting'

interface ResultsDisplayProps {
  sessionId: string
  onClose: () => void
}

export function ResultsDisplay({ sessionId, onClose }: ResultsDisplayProps) {
  const { currentSession, results, fetchSession, fetchResults, loading } = useVoting()

  useEffect(() => {
    fetchSession(sessionId)
    fetchResults(sessionId)
  }, [sessionId])

  if (loading || !currentSession || !results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  const resultsData = results.results_data as any

  // Check if there was an override
  const hasOverride = resultsData.override

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-amber-600">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-amber-50 to-orange-50 border-b-4 border-amber-600 p-6">
          <div className="text-center">
            <h2 className="text-3xl font-heading font-bold text-amber-900 mb-2">Vote Results</h2>
            <p className="text-lg text-amber-800">
              {currentSession.proposal_title || 'Voting Results'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>

        {/* Override Notice */}
        {hasOverride && (
          <div className="mx-6 mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <div className="font-heading font-bold text-amber-900 mb-2">⚠️ Manual Override Applied</div>
            <div className="text-amber-800 mb-2">{hasOverride.reason}</div>
            <div className="text-sm text-amber-700">
              Override by facilitator on {new Date(hasOverride.overridden_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Results Content */}
        <div className="p-6">
          {currentSession.vote_format === 'choose_person' ? (
            <ChoosePersonResults
              resultsData={resultsData}
              hasOverride={hasOverride}
              threshold={currentSession.vote_type === 'election_round' ? 67 : 50}
            />
          ) : (
            <YesNoResults
              resultsData={resultsData}
              hasOverride={hasOverride}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CHOOSE PERSON RESULTS
// ============================================================================

interface ChoosePersonResultsProps {
  resultsData: any
  hasOverride: any
  threshold: number
}

function ChoosePersonResults({ resultsData, hasOverride, threshold }: ChoosePersonResultsProps) {
  const winner = hasOverride?.winner_name
    ? { name: hasOverride.winner_name, role_id: hasOverride.winner_role_id }
    : resultsData.winner

  const candidates = resultsData.all_candidates || []
  const totalVotes = resultsData.total_votes || 0
  const tie = resultsData.tie || false

  return (
    <div className="space-y-6">
      {/* Winner Card */}
      {winner && !tie ? (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-400 rounded-xl p-8 text-center">
          <div className="mb-4">
            <div className="text-6xl mb-2">👑</div>
          </div>

          <h3 className="text-4xl font-heading font-bold text-amber-900 mb-3">{winner.name}</h3>
          <p className="text-2xl text-amber-800 font-semibold mb-4">
            {winner.vote_count} votes ({winner.percentage}%)
          </p>

          {winner.percentage >= threshold ? (
            <div className="mt-4 inline-block px-6 py-3 bg-amber-700 text-white rounded-lg text-lg font-medium">
              Threshold Met ({threshold}%)
            </div>
          ) : (
            <div className="mt-4 inline-block px-6 py-3 bg-orange-600 text-white rounded-lg text-lg font-medium">
              Below Threshold ({threshold}% needed)
            </div>
          )}
        </div>
      ) : tie ? (
        <div className="bg-amber-50 border-4 border-amber-400 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <h3 className="text-3xl font-heading font-bold text-amber-900 mb-3">Tie - No Winner</h3>
          <p className="text-lg text-amber-800">Multiple candidates received equal votes. No one is nominated.</p>
        </div>
      ) : null}

      {/* All Candidates */}
      <div>
        <h4 className="text-xl font-heading font-bold text-amber-900 mb-4">
          Vote Breakdown ({totalVotes} total votes)
        </h4>

        <div className="space-y-3">
          {candidates.map((candidate: any, index: number) => (
            <div
              key={candidate.role_id || index}
              className={`rounded-lg p-5 border-2 ${
                index === 0 && !tie
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && !tie && <span className="text-xl">👑</span>}
                    <span className={`text-lg font-semibold ${
                      index === 0 && !tie ? 'text-amber-900' : 'text-neutral-900'
                    }`}>
                      {candidate.name}
                    </span>
                  </div>
                  <div className={`text-sm ${
                    index === 0 && !tie ? 'text-amber-700' : 'text-neutral-600'
                  }`}>
                    {candidate.percentage}% of votes
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  index === 0 && !tie ? 'text-amber-900' : 'text-neutral-900'
                }`}>
                  {candidate.vote_count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// YES/NO RESULTS
// ============================================================================

interface YesNoResultsProps {
  resultsData: any
  hasOverride: any
}

function YesNoResults({ resultsData, hasOverride }: YesNoResultsProps) {
  const yes = resultsData.yes || 0
  const no = resultsData.no || 0
  const abstain = resultsData.abstain || 0
  const total = resultsData.total || 0
  const passed = resultsData.passed || false

  const yesPercentage = resultsData.yes_percentage || 0
  const noPercentage = resultsData.no_percentage || 0
  const abstainPercentage = resultsData.abstain_percentage || 0

  return (
    <div className="space-y-6">
      {/* Result Card */}
      <div className={`${passed ? 'bg-amber-50 border-amber-600' : 'bg-orange-50 border-orange-600'} border-4 rounded-xl p-8 text-center`}>
        <div className="text-6xl mb-4">
          {passed ? '📜' : '⚠️'}
        </div>

        <h3 className="text-4xl font-heading font-bold text-neutral-900 mb-3">
          {passed ? 'Passed' : 'Failed'}
        </h3>

        <p className={`text-2xl font-semibold ${passed ? 'text-amber-800' : 'text-orange-800'}`}>
          {yes} Yes vs {no} No
        </p>
      </div>

      {/* Vote Breakdown */}
      <div>
        <h4 className="text-xl font-heading font-bold text-amber-900 mb-4">
          Vote Breakdown ({total} total votes)
        </h4>

        <div className="space-y-4">
          {/* Yes */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold text-neutral-900">Yes</span>
                </div>
                <div className="text-sm text-amber-700">
                  {yesPercentage}% of votes
                </div>
              </div>
              <div className="text-2xl font-bold text-neutral-900">{yes}</div>
            </div>
          </div>

          {/* No */}
          <div className="bg-amber-50 border-2 border-amber-600 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">❌</span>
                  <span className="text-lg font-semibold text-neutral-900">No</span>
                </div>
                <div className="text-sm text-amber-700">
                  {noPercentage}% of votes
                </div>
              </div>
              <div className="text-2xl font-bold text-neutral-900">{no}</div>
            </div>
          </div>

          {/* Abstain */}
          {abstain > 0 && (
            <div className="bg-neutral-50 border-2 border-neutral-300 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">⚪</span>
                    <span className="text-lg font-semibold text-neutral-900">Abstain</span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {abstainPercentage}% of votes
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900">{abstain}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
