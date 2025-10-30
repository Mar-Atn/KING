/**
 * Clan Allegiance Controls (Admin)
 *
 * Monitor clan voting progress and reveal final decisions
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Clan, ClanVote } from '../../types/database'

interface ClanAllegianceControlsProps {
  runId: string
  clans: Clan[]
}

export function ClanAllegianceControls({ runId, clans }: ClanAllegianceControlsProps) {
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [votes, setVotes] = useState<ClanVote[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    loadVotes()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`clan_votes_admin:${runId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clan_votes',
          filter: `run_id=eq.${runId}`
        },
        () => {
          console.log('📊 Clan vote update')
          loadVotes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [runId])

  const loadVotes = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('clan_votes')
      .select('*')
      .eq('run_id', runId)

    if (!error && data) {
      setVotes(data)
      // Check if any vote has been revealed
      if (data.length > 0 && data[0].revealed) {
        setRevealed(true)
      }
    }

    setLoading(false)
  }

  const handleReveal = async () => {
    if (!confirm('⚠️ Reveal clan decisions to all participants?\n\nThis will show:\n• Each clan\'s oath of allegiance\n• Any rebellion votes\n\nThis cannot be undone.')) {
      return
    }

    setRevealing(true)

    // Update all votes to revealed
    const { error } = await supabase
      .from('clan_votes')
      .update({
        revealed: true,
        revealed_at: new Date().toISOString()
      })
      .eq('run_id', runId)

    setRevealing(false)

    if (error) {
      console.error('Error revealing votes:', error)
      alert('Failed to reveal votes: ' + error.message)
      return
    }

    alert('✅ Clan decisions revealed to all participants!')
  }

  const getClanVote = (clanId: string): ClanVote | undefined => {
    return votes.find(v => v.clan_id === clanId)
  }

  const getVotedCount = () => votes.length
  const getTotalCount = () => clans.length

  if (loading) {
    return (
      <div className="bg-amber-50 border-4 border-amber-400 rounded-xl p-8 text-center">
        <div className="text-amber-700">Loading clan votes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Reveal Button */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-3xl font-heading font-bold text-amber-900 mb-2">
              Clan Allegiance Votes
            </h3>
            <div className="text-xl text-amber-800">
              Final clan decisions on the King's rule
            </div>
          </div>

          <div>
            {revealed ? (
              <div className="px-6 py-3 bg-amber-100 text-amber-900 border-4 border-amber-600 rounded-lg font-bold">
                ✅ Revealed to All
              </div>
            ) : (
              <button
                onClick={handleReveal}
                disabled={revealing || votes.length === 0}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors font-bold text-lg"
              >
                {revealing ? 'Revealing...' : '📢 Reveal Decisions'}
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-900">Voting Progress</span>
            <span className="text-amber-800">
              {getVotedCount()} / {getTotalCount()} clans voted
            </span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-amber-600 h-full transition-all duration-500"
              style={{ width: `${(getVotedCount() / getTotalCount()) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clan Voting Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clans.map(clan => {
          const vote = getClanVote(clan.clan_id)
          const hasVoted = !!vote

          return (
            <div
              key={clan.clan_id}
              className={`bg-white rounded-xl border-4 p-5 ${
                hasVoted ? 'border-green-500' : 'border-amber-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Clan Emblem */}
                {clan.emblem_url && (
                  <img
                    src={clan.emblem_url}
                    alt={clan.name}
                    className="w-16 h-16 object-contain"
                  />
                )}

                <div className="flex-1">
                  {/* Clan Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className="text-xl font-heading font-bold"
                      style={{ color: clan.color_hex }}
                    >
                      {clan.name}
                    </h4>
                    {hasVoted && (
                      <span className="text-green-600 text-2xl">✓</span>
                    )}
                  </div>

                  {/* Vote Status */}
                  {!hasVoted ? (
                    <div className="text-amber-700 italic">Awaiting vote...</div>
                  ) : revealed ? (
                    <div className="space-y-2">
                      {/* Oath of Allegiance */}
                      <div className={`p-3 rounded-lg ${
                        vote.oath_of_allegiance
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-red-50 border-2 border-red-500'
                      }`}>
                        <div className="font-semibold text-sm mb-1">
                          {vote.oath_of_allegiance ? '✅ Pledged Allegiance' : '❌ Refused Allegiance'}
                        </div>
                      </div>

                      {/* Contingency Actions */}
                      {clan.if_things_go_wrong && (
                        <div className={`p-3 rounded-lg ${
                          vote.initiate_actions
                            ? 'bg-red-100 border-2 border-red-600'
                            : 'bg-green-50 border-2 border-green-500'
                        }`}>
                          <div className="font-semibold text-sm">
                            {vote.initiate_actions ? '⚔️ Vote to Act Against King' : '🕊️ Vote for Peace'}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-green-700 font-semibold">
                      ✓ Vote Submitted
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Warning if not all voted */}
      {!revealed && votes.length < clans.length && (
        <div className="bg-amber-100 border-2 border-amber-500 rounded-lg p-4 text-center">
          <div className="text-amber-900 font-semibold">
            ⚠️ Not all clans have voted yet
          </div>
          <div className="text-amber-700 text-sm mt-1">
            You can reveal results now, or wait for all clans to vote
          </div>
        </div>
      )}

      {/* Summary */}
      {revealed && votes.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-6">
          <h4 className="text-2xl font-heading font-bold text-amber-900 mb-4">
            Summary
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border-2 border-green-500">
              <div className="text-sm text-green-700 mb-1">Pledged Allegiance</div>
              <div className="text-3xl font-bold text-green-800">
                {votes.filter(v => v.oath_of_allegiance === true).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-red-500">
              <div className="text-sm text-red-700 mb-1">Refused Allegiance</div>
              <div className="text-3xl font-bold text-red-800">
                {votes.filter(v => v.oath_of_allegiance === false).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-red-600">
              <div className="text-sm text-red-700 mb-1">Voted to Act Against King</div>
              <div className="text-3xl font-bold text-red-900">
                {votes.filter(v => v.initiate_actions === true).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-green-500">
              <div className="text-sm text-green-700 mb-1">Voted for Peace</div>
              <div className="text-3xl font-bold text-green-800">
                {votes.filter(v => v.initiate_actions === false).length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
