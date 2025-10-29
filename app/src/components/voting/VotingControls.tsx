/**
 * VotingControls Component
 *
 * Facilitator dashboard component for managing votes.
 * Shows active votes, allows starting/ending votes, calculating results, and admin overrides.
 *
 * Sprint 1: Voting System Implementation
 * Date: October 29, 2025
 */

import { useState } from 'react'
import { Plus, Play, Square, Calculator, Eye, Users, Clock, AlertCircle } from 'lucide-react'
import { useVoting } from '../../hooks/useVoting'
import { VoteWizard } from './VoteWizard'
import { ResultsDisplay } from './ResultsDisplay'
import type { Database } from '../../lib/database.types'

type VoteSession = Database['public']['Tables']['vote_sessions']['Row']

interface VotingControlsProps {
  runId: string
  phaseId: string
  phaseDurationMinutes: number | null
  allRoles: any[]
  allClans: any[]
}

export function VotingControls({
  runId,
  phaseId,
  phaseDurationMinutes,
  allRoles,
  allClans
}: VotingControlsProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const {
    sessions,
    loading,
    endVoteSession,
    calculateResults,
    announceResults,
    fetchSessions
  } = useVoting({ runId, phaseId })

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleEndVote = async (sessionId: string) => {
    if (confirm('End this vote? Participants will no longer be able to vote.')) {
      const success = await endVoteSession(sessionId)
      if (success) {
        // Automatically calculate results
        await calculateResults(sessionId)
      }
    }
  }

  const handleCalculateResults = async (sessionId: string) => {
    await calculateResults(sessionId)
  }

  const handleAnnounceResults = async (sessionId: string) => {
    if (confirm('Announce results to participants? This will reveal the vote outcome.')) {
      await announceResults(sessionId)
    }
  }

  const handleViewResults = (sessionId: string) => {
    setSelectedSession(sessionId)
    setShowResults(true)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Voting Management</h3>
          <p className="text-sm text-gray-600">Create and manage votes for this phase</p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Vote
        </button>
      </div>

      {/* Active Votes */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No votes created yet</p>
          <p className="text-sm text-gray-500 mt-1">Click "Create Vote" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <VoteSessionCard
              key={session.session_id}
              session={session}
              allRoles={allRoles}
              allClans={allClans}
              onEndVote={handleEndVote}
              onCalculateResults={handleCalculateResults}
              onAnnounceResults={handleAnnounceResults}
              onViewResults={handleViewResults}
            />
          ))}
        </div>
      )}

      {/* Wizards & Modals */}
      {showWizard && (
        <VoteWizard
          runId={runId}
          phaseId={phaseId}
          phaseDurationMinutes={phaseDurationMinutes}
          allRoles={allRoles}
          allClans={allClans}
          onClose={() => setShowWizard(false)}
          onVoteCreated={() => {
            fetchSessions()
            setShowWizard(false)
          }}
        />
      )}

      {showResults && selectedSession && (
        <ResultsDisplay
          sessionId={selectedSession}
          onClose={() => {
            setShowResults(false)
            setSelectedSession(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// VOTE SESSION CARD
// ============================================================================

interface VoteSessionCardProps {
  session: VoteSession & { vote_count?: number }
  allRoles: any[]
  allClans: any[]
  onEndVote: (sessionId: string) => void
  onCalculateResults: (sessionId: string) => void
  onAnnounceResults: (sessionId: string) => void
  onViewResults: (sessionId: string) => void
}

function VoteSessionCard({
  session,
  allRoles,
  allClans,
  onEndVote,
  onCalculateResults,
  onAnnounceResults,
  onViewResults
}: VoteSessionCardProps) {
  // Get eligible voters count
  const eligibleCount = session.scope === 'all'
    ? allRoles.length
    : allRoles.filter(r => r.clan_id === session.scope_clan_id).length

  const voteCount = session.vote_count || 0
  const progress = eligibleCount > 0 ? (voteCount / eligibleCount) * 100 : 0

  // Status badge
  const statusConfig = {
    open: { bg: 'bg-green-100', text: 'text-green-800', icon: Play, label: 'OPEN' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Square, label: 'CLOSED' },
    announced: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Eye, label: 'ANNOUNCED' }
  }

  const status = statusConfig[session.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900">
              {session.proposal_title || getVoteTypeLabel(session.vote_type)}
            </h4>
            <span className={`flex items-center gap-1 px-2 py-1 ${status.bg} ${status.text} text-xs font-medium rounded-full`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>

          {session.proposal_description && (
            <p className="text-sm text-gray-600">{session.proposal_description}</p>
          )}

          {/* Vote Info */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {voteCount} / {eligibleCount} voted
              </span>
            </div>

            {session.scope === 'clan_only' && session.scope_clan_id && (
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {allClans.find(c => c.clan_id === session.scope_clan_id)?.clan_name || 'Unknown Clan'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(session.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {progress.toFixed(0)}% participation
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
        {session.status === 'open' && (
          <button
            onClick={() => onEndVote(session.session_id)}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            <Square className="w-4 h-4" />
            End Vote
          </button>
        )}

        {session.status === 'closed' && (
          <>
            <button
              onClick={() => onCalculateResults(session.session_id)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <Calculator className="w-4 h-4" />
              Calculate Results
            </button>

            <button
              onClick={() => onAnnounceResults(session.session_id)}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              Announce Results
            </button>
          </>
        )}

        {(session.status === 'closed' || session.status === 'announced') && (
          <button
            onClick={() => onViewResults(session.session_id)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            View Results
          </button>
        )}
      </div>

      {/* Warnings */}
      {session.status === 'open' && voteCount === 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>No votes cast yet. Participants can vote now.</span>
        </div>
      )}

      {session.status === 'closed' && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Vote ended. Calculate and announce results when ready.</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function getVoteTypeLabel(voteType: string): string {
  const labels: Record<string, string> = {
    clan_nomination: 'Clan Nomination',
    election_round: 'King Election',
    clan_oath: 'Oath of Allegiance',
    clan_action: 'Clan Action',
    facilitator_proposal: 'Custom Proposal'
  }
  return labels[voteType] || 'Vote'
}
