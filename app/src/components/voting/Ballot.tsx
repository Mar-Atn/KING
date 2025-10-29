/**
 * Ballot Component
 *
 * Voting interface for participants. Displays vote options and handles submission.
 * Supports both "choose person" and "yes/no/abstain" formats.
 *
 * Sprint 1: Voting System Implementation
 * Date: October 29, 2025
 */

import { useState } from 'react'
import { Check, X, Clock, AlertCircle } from 'lucide-react'
import { useVoting } from '../../hooks/useVoting'
import type { Database } from '../../lib/database.types'

type VoteSession = Database['public']['Tables']['vote_sessions']['Row']

interface BallotProps {
  session: VoteSession
  myRoleId: string
  myClanId: string
  allRoles: any[]
  onVoteSubmitted: () => void
  onClose: () => void
}

export function Ballot({
  session,
  myRoleId,
  myClanId,
  allRoles,
  onVoteSubmitted,
  onClose
}: BallotProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const { submitVote, hasVoted, myVote, loading } = useVoting({ roleId: myRoleId })

  // Check if already voted
  const alreadyVoted = hasVoted(session.session_id)

  // Get eligible candidates for choose_person format
  const eligibleRoles = session.vote_format === 'choose_person'
    ? allRoles.filter(role => (session.eligible_candidates as string[])?.includes(role.role_id))
    : []

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleSubmit = async () => {
    if (!selectedChoice) return

    const choice =
      session.vote_format === 'choose_person'
        ? { chosenRoleId: selectedChoice }
        : { yesNoChoice: selectedChoice as 'yes' | 'no' | 'abstain' }

    const success = await submitVote(session.session_id, myRoleId, myClanId, choice)

    if (success) {
      onVoteSubmitted()
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (alreadyVoted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Vote Submitted</h3>
            <p className="text-gray-600 mb-6">Your vote has been recorded successfully.</p>

            {session.transparency_level === 'open' && myVote && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">You voted for:</p>
                <p className="font-semibold text-gray-900">
                  {myVote.chosen_role_id
                    ? allRoles.find(r => r.role_id === myVote.chosen_role_id)?.name || 'Unknown'
                    : myVote.yes_no_choice?.toUpperCase()}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">
              {session.proposal_title || 'Cast Your Vote'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {session.proposal_description && (
            <p className="text-amber-100">{session.proposal_description}</p>
          )}

          {/* Timer (if applicable) */}
          <div className="flex items-center gap-2 mt-4 bg-white bg-opacity-20 rounded-lg px-3 py-2 w-fit">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Vote is open</span>
          </div>
        </div>

        {/* Ballot Options */}
        <div className="p-6 space-y-4">
          {session.vote_format === 'choose_person' ? (
            // Choose Person Format
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Select one candidate:</h3>

              {eligibleRoles.map(role => (
                <button
                  key={role.role_id}
                  onClick={() => setSelectedChoice(role.role_id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedChoice === role.role_id
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {role.avatar_url ? (
                      <img
                        src={role.avatar_url}
                        alt={role.role_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                        {role.role_name.charAt(0)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{role.role_name}</div>
                      {role.position && (
                        <div className="text-sm text-gray-600">{role.position}</div>
                      )}
                      {role.clan_name && (
                        <div className="text-sm text-gray-500">Clan: {role.clan_name}</div>
                      )}
                    </div>

                    {/* Check mark */}
                    {selectedChoice === role.role_id && (
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {/* Abstain Option */}
              <button
                onClick={() => setSelectedChoice('abstain')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedChoice === 'abstain'
                    ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl">🤷</span>
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Abstain</div>
                    <div className="text-sm text-gray-600">I choose not to vote</div>
                  </div>

                  {selectedChoice === 'abstain' && (
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          ) : (
            // Yes/No/Abstain Format
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Choose your answer:</h3>

              {/* Yes */}
              <button
                onClick={() => setSelectedChoice('yes')}
                className={`w-full p-6 border-2 rounded-lg transition-all ${
                  selectedChoice === 'yes'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold text-gray-900">Yes</div>
                    <div className="text-sm text-gray-600">I support this</div>
                  </div>

                  {selectedChoice === 'yes' && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* No */}
              <button
                onClick={() => setSelectedChoice('no')}
                className={`w-full p-6 border-2 rounded-lg transition-all ${
                  selectedChoice === 'no'
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-600" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold text-gray-900">No</div>
                    <div className="text-sm text-gray-600">I oppose this</div>
                  </div>

                  {selectedChoice === 'no' && (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* Abstain */}
              <button
                onClick={() => setSelectedChoice('abstain')}
                className={`w-full p-6 border-2 rounded-lg transition-all ${
                  selectedChoice === 'abstain'
                    ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🤷</span>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold text-gray-900">Abstain</div>
                    <div className="text-sm text-gray-600">I choose not to vote</div>
                  </div>

                  {selectedChoice === 'abstain' && (
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Important:</strong> Once you submit your vote, you cannot change it. Please choose carefully.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedChoice || loading || selectedChoice === 'abstain' && session.vote_format === 'choose_person'}
            className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Submitting...' : 'Submit Vote'}
          </button>
        </div>
      </div>
    </div>
  )
}
