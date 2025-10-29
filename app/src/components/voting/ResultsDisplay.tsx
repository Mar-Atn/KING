/**
 * ResultsDisplay Component
 *
 * Displays vote results with animations and analytics.
 * Shows winner, vote tallies, and individual votes (if transparency allows).
 *
 * Sprint 1: Voting System Implementation
 * Date: October 29, 2025
 */

import { useState, useEffect } from 'react'
import { X, Crown, TrendingUp, Users, AlertCircle } from 'lucide-react'
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
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Vote Results</h2>
            <p className="text-amber-100">
              {currentSession.proposal_title || 'Voting Results'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Override Notice */}
        {hasOverride && (
          <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-blue-900">Manual Override Applied</div>
                <div className="text-blue-700 mt-1">{hasOverride.reason}</div>
                <div className="text-blue-600 text-xs mt-1">
                  Override by facilitator on {new Date(hasOverride.overridden_at).toLocaleString()}
                </div>
              </div>
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
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-3xl font-bold text-gray-900 mb-2">{winner.name}</h3>
          <p className="text-xl text-amber-700 font-semibold">
            {winner.vote_count} votes ({winner.percentage}%)
          </p>

          {winner.percentage >= threshold ? (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <Crown className="w-4 h-4" />
              Threshold Met ({threshold}%)
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Below Threshold ({threshold}% needed)
            </div>
          )}
        </div>
      ) : tie ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Tie - No Winner</h3>
          <p className="text-red-700">Multiple candidates received equal votes. No one is nominated.</p>
        </div>
      ) : null}

      {/* All Candidates */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Vote Breakdown ({totalVotes} total votes)
        </h4>

        <div className="space-y-3">
          {candidates.map((candidate: any, index: number) => (
            <div
              key={candidate.role_id || index}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {index === 0 && !tie && (
                    <Crown className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-semibold text-gray-900">{candidate.name}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {candidate.vote_count} votes
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      index === 0 && !tie ? 'bg-amber-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${candidate.percentage}%` }}
                  />
                </div>
                <span className="absolute right-2 top-0 text-xs font-medium text-gray-700">
                  {candidate.percentage}%
                </span>
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
      <div className={`${passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'} border-2 rounded-xl p-8 text-center`}>
        <div className="text-6xl mb-4">
          {passed ? '✅' : '❌'}
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          {passed ? 'Passed' : 'Failed'}
        </h3>

        <p className={`text-xl font-semibold ${passed ? 'text-green-700' : 'text-red-700'}`}>
          {yes} Yes vs {no} No
        </p>
      </div>

      {/* Vote Breakdown */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Vote Breakdown ({total} total votes)
        </h4>

        <div className="space-y-4">
          {/* Yes */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <span className="font-semibold text-gray-900">Yes</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{yes} votes</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
              <span className="absolute right-2 top-0 text-xs font-medium text-gray-700">
                {yesPercentage}%
              </span>
            </div>
          </div>

          {/* No */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">✗</span>
                </div>
                <span className="font-semibold text-gray-900">No</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{no} votes</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${noPercentage}%` }}
                />
              </div>
              <span className="absolute right-2 top-0 text-xs font-medium text-gray-700">
                {noPercentage}%
              </span>
            </div>
          </div>

          {/* Abstain */}
          {abstain > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600">🤷</span>
                  </div>
                  <span className="font-semibold text-gray-900">Abstain</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{abstain} votes</span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gray-400 transition-all duration-1000"
                    style={{ width: `${abstainPercentage}%` }}
                  />
                </div>
                <span className="absolute right-2 top-0 text-xs font-medium text-gray-700">
                  {abstainPercentage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
