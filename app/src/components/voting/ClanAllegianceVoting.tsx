/**
 * Clan Allegiance Voting (Participant View)
 *
 * Final phase where clans vote on:
 * 1. Oath of Allegiance to the King
 * 2. Whether to initiate actions against the King
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Clan, ClanVote } from '../../types/database'

interface ClanAllegianceVotingProps {
  runId: string
  userRoleId: string
  userClan: Clan
  votingStarted: boolean
  onVoteSuccess: () => void
}

export function ClanAllegianceVoting({ runId, userRoleId, userClan, votingStarted, onVoteSuccess }: ClanAllegianceVotingProps) {
  const [loading, setLoading] = useState(false)
  const [existingVote, setExistingVote] = useState<ClanVote | null>(null)
  const [oathVote, setOathVote] = useState<boolean | null>(null)
  const [actionVote, setActionVote] = useState<boolean | null>(null)

  useEffect(() => {
    loadExistingVote()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`clan_votes:${runId}:${userRoleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clan_votes',
          filter: `role_id=eq.${userRoleId}`
        },
        () => {
          loadExistingVote()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [runId, userRoleId])

  // Show "waiting for voting to start" message if voting hasn't begun
  if (!votingStarted && !existingVote) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-4xl font-heading font-bold text-amber-900 mb-4">
            Awaiting Facilitator
          </h2>
          <p className="text-xl text-amber-800 mb-2" style={{ color: userClan.color_hex }}>
            {userClan.name}
          </p>
          <p className="text-amber-700">
            Voting will begin soon. Please wait for the facilitator to start the final clan allegiance vote.
          </p>
        </div>
      </div>
    )
  }

  const loadExistingVote = async () => {
    const { data, error } = await supabase
      .from('clan_votes')
      .select('*')
      .eq('run_id', runId)
      .eq('role_id', userRoleId)
      .single()

    if (data && !error) {
      setExistingVote(data)
      setOathVote(data.oath_of_allegiance)
      setActionVote(data.initiate_actions)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (oathVote === null || actionVote === null) {
      alert('Please answer both questions')
      return
    }

    setLoading(true)

    const voteData = {
      run_id: runId,
      role_id: userRoleId,
      clan_id: userClan.clan_id,
      oath_of_allegiance: oathVote,
      initiate_actions: actionVote,
      voted_at: new Date().toISOString()
    }

    let error

    if (existingVote) {
      // Update existing vote
      const result = await supabase
        .from('clan_votes')
        .update(voteData)
        .eq('vote_id', existingVote.vote_id)
      error = result.error
    } else {
      // Insert new vote
      const result = await supabase
        .from('clan_votes')
        .insert([voteData])
      error = result.error
    }

    setLoading(false)

    if (error) {
      console.error('Error submitting clan vote:', error)
      alert('Failed to submit vote: ' + error.message)
      return
    }

    alert('✅ Your vote has been recorded!')
    onVoteSuccess()
  }

  // If already voted, show confirmation
  if (existingVote) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-4xl font-heading font-bold text-amber-900 mb-4">
            You Have Voted
          </h2>
          <p className="text-xl text-amber-800 mb-6" style={{ color: userClan.color_hex }}>
            {userClan.name}
          </p>
          <div className="text-amber-700">
            Awaiting the reveal of all clan decisions
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-8 mb-6">
        <h2 className="text-4xl font-heading font-bold text-amber-900 mb-4 text-center">
          Final Clan Decision
        </h2>
        <p className="text-xl text-amber-800 text-center mb-2" style={{ color: userClan.color_hex }}>
          {userClan.name}
        </p>
        <p className="text-amber-700 text-center">
          Your clan must decide its stance on the King's rule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Oath of Allegiance */}
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h3 className="text-2xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
            <span>⚖️</span>
            <span>Oath of Allegiance</span>
          </h3>
          <p className="text-amber-800 mb-6">
            Does your clan pledge allegiance to the newly crowned King?
          </p>

          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 border-2 border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="radio"
                name="oath"
                checked={oathVote === true}
                onChange={() => setOathVote(true)}
                className="mt-1 w-5 h-5 text-amber-600"
                required
              />
              <div>
                <div className="font-bold text-amber-900 text-lg">✅ Yes, We Pledge Allegiance</div>
                <div className="text-amber-700 text-sm">Our clan honors the King and supports his rule</div>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 border-2 border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="radio"
                name="oath"
                checked={oathVote === false}
                onChange={() => setOathVote(false)}
                className="mt-1 w-5 h-5 text-amber-600"
                required
              />
              <div>
                <div className="font-bold text-amber-900 text-lg">❌ No, We Do Not Pledge</div>
                <div className="text-amber-700 text-sm">Our clan withholds its allegiance</div>
              </div>
            </label>
          </div>
        </div>

        {/* If Things Go Wrong */}
        {userClan.if_things_go_wrong && (
          <div className="bg-white rounded-xl border-4 border-red-400 p-6">
            <h3 className="text-2xl font-heading font-bold text-red-900 mb-4 flex items-center gap-2">
              <span>⚔️</span>
              <span>Contingency Actions</span>
            </h3>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
              <div className="font-bold text-red-900 mb-2">Your Clan's Planned Response:</div>
              <p className="text-red-800 whitespace-pre-wrap">{userClan.if_things_go_wrong}</p>
            </div>

            <p className="text-red-800 mb-6 font-semibold">
              Do you vote to initiate these actions against the King?
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  checked={actionVote === true}
                  onChange={() => setActionVote(true)}
                  className="mt-1 w-5 h-5 text-red-600"
                  required
                />
                <div>
                  <div className="font-bold text-red-900 text-lg">⚔️ Yes, Initiate Actions</div>
                  <div className="text-red-700 text-sm">Our clan votes to proceed with these actions</div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  checked={actionVote === false}
                  onChange={() => setActionVote(false)}
                  className="mt-1 w-5 h-5 text-red-600"
                  required
                />
                <div>
                  <div className="font-bold text-red-900 text-lg">🕊️ No, Take No Action</div>
                  <div className="text-red-700 text-sm">Our clan chooses peace and restraint</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || oathVote === null || actionVote === null}
            className="px-12 py-4 bg-amber-600 text-white text-xl font-heading font-bold rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors shadow-lg"
          >
            {loading ? 'Submitting...' : 'Cast Your Vote'}
          </button>
        </div>
      </form>
    </div>
  )
}
