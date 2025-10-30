/**
 * Clan Allegiance Controls (Admin)
 *
 * Monitor clan voting progress and reveal final decisions
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Clan, ClanVote, Role } from '../../types/database'

interface ClanAllegianceControlsProps {
  runId: string
  clans: Clan[]
  roles: Role[]
}

export function ClanAllegianceControls({ runId, clans, roles }: ClanAllegianceControlsProps) {
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [votes, setVotes] = useState<ClanVote[]>([])
  const [revealed, setRevealed] = useState(false)
  const [votingStarted, setVotingStarted] = useState(false)
  const [votingActive, setVotingActive] = useState(false)
  const [votingStopped, setVotingStopped] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes default
  const [manualVotes, setManualVotes] = useState<Record<string, { oath: boolean | null, action: boolean | null }>>({}) // roleId => {oath, action}

  useEffect(() => {
    loadVotingState()
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

  const loadVotingState = async () => {
    const { data, error } = await supabase
      .from('sim_runs')
      .select('clan_allegiance_voting_started_at')
      .eq('run_id', runId)
      .single()

    if (!error && data) {
      setVotingStarted(!!data.clan_allegiance_voting_started_at)
    }
  }

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

  // Timer countdown
  useEffect(() => {
    if (!votingActive) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleStop()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [votingActive])

  const handleStartVoting = async () => {
    setStarting(true)

    const { error } = await supabase
      .from('sim_runs')
      .update({
        clan_allegiance_voting_started_at: new Date().toISOString()
      })
      .eq('run_id', runId)

    setStarting(false)

    if (error) {
      console.error('Error starting voting:', error)
      alert('Failed to start voting: ' + error.message)
      return
    }

    setVotingStarted(true)
    setVotingActive(true)
    setTimeRemaining(300) // 5 minutes
    alert('✅ Clan allegiance voting has started! All participants can now vote.')
  }

  const handleExtend = () => {
    setTimeRemaining(prev => prev + 60) // Add 1 minute
  }

  const handleStop = async () => {
    setStopping(true)
    setVotingActive(false)
    setVotingStopped(true)
    setStopping(false)
  }

  const handleManualVote = (roleId: string, field: 'oath' | 'action', value: boolean | null) => {
    setManualVotes(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value
      }
    }))
  }

  const handleReveal = async () => {
    if (!confirm('⚠️ Reveal clan decisions to all participants?\n\nThis will show:\n• Each clan\'s oath of allegiance\n• Any rebellion votes\n\nThis cannot be undone.')) {
      return
    }

    setRevealing(true)

    // First, insert manual votes for roles that didn't vote
    for (const [roleId, manualVote] of Object.entries(manualVotes)) {
      // Check if this role already voted
      const existing = votes.find(v => v.role_id === roleId)
      if (existing) continue // Skip if already voted

      // Find the role to get its clan_id
      const role = roles.find(r => r.role_id === roleId)
      if (!role || !role.clan_id) continue

      // Only insert if admin set both values
      if (manualVote.oath !== null && manualVote.action !== null) {
        const { error } = await supabase
          .from('clan_votes')
          .insert({
            run_id: runId,
            role_id: roleId,
            clan_id: role.clan_id,
            oath_of_allegiance: manualVote.oath,
            initiate_actions: manualVote.action,
            voted_at: new Date().toISOString()
          })

        if (error) {
          console.error(`Error inserting manual vote for role ${roleId}:`, error)
        }
      }
    }

    // Reload votes to include manual ones
    await loadVotes()

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

    setRevealed(true)
    alert('✅ Clan decisions revealed to all participants!')
  }

  const getRoleVote = (roleId: string): ClanVote | undefined => {
    return votes.find(v => v.role_id === roleId)
  }

  const getClanRoles = (clanId: string): Role[] => {
    return roles.filter(r => r.clan_id === clanId && r.participant_type === 'human')
  }

  const getClanVotes = (clanId: string): ClanVote[] => {
    return votes.filter(v => v.clan_id === clanId)
  }

  const getVotedCount = () => votes.length
  const getTotalCount = () => roles.filter(r => r.participant_type === 'human').length

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="bg-amber-50 border-4 border-amber-400 rounded-xl p-8 text-center">
        <div className="text-amber-700">Loading clan votes...</div>
      </div>
    )
  }

  // Show "Start Voting" button if voting hasn't started yet
  if (!votingStarted) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-8">
        <div className="text-center">
          <h3 className="text-3xl font-heading font-bold text-amber-900 mb-4">
            Final Clan Allegiance Voting
          </h3>
          <p className="text-xl text-amber-800 mb-6">
            Each clan will vote on their allegiance to the King and potential actions
          </p>
          <button
            onClick={handleStartVoting}
            disabled={starting}
            className="px-8 py-4 bg-amber-600 text-white text-xl font-heading font-bold rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors shadow-lg"
          >
            {starting ? 'Starting...' : '▶️ Start Voting'}
          </button>
          <div className="mt-6 text-amber-700 text-sm">
            When you start voting, all {getTotalCount()} participants will be able to cast their votes
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Timer and Controls */}
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

          {/* Timer (only show when voting active) */}
          {votingActive && (
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-amber-900">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-amber-700">Time Remaining</div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3 mb-4">
          {votingActive && (
            <>
              <button
                onClick={handleExtend}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-bold"
              >
                ⏱️ Extend (+1 min)
              </button>
              <button
                onClick={handleStop}
                disabled={stopping}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors font-bold"
              >
                {stopping ? 'Stopping...' : '⏹️ Stop Voting'}
              </button>
            </>
          )}

          {votingStopped && !revealed && (
            <button
              onClick={handleReveal}
              disabled={revealing}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors font-bold text-lg"
            >
              {revealing ? 'Revealing...' : '✅ Confirm and Reveal Results'}
            </button>
          )}

          {revealed && (
            <div className="px-6 py-3 bg-green-100 text-green-900 border-4 border-green-600 rounded-lg font-bold">
              ✅ Results Announced to Participants
            </div>
          )}
        </div>

        {/* Progress */}
        {!revealed && (
          <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-amber-900">Voting Progress</span>
              <span className="text-amber-800">
                {getVotedCount()} / {getTotalCount()} roles voted
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-500"
                style={{ width: `${(getVotedCount() / getTotalCount()) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Clan Voting Status with Individual Roles */}
      <div className="space-y-6">
        {clans.map(clan => {
          const clanRoles = getClanRoles(clan.clan_id)
          const clanVotes = getClanVotes(clan.clan_id)
          const totalRoles = clanRoles.length
          const totalVoted = clanVotes.length

          // Calculate aggregate stats for oath
          const oathYes = clanVotes.filter(v => v.oath_of_allegiance === true).length
          const oathNo = clanVotes.filter(v => v.oath_of_allegiance === false).length

          // Calculate aggregate stats for actions (only if clan has contingency plans)
          const actionYes = clanVotes.filter(v => v.initiate_actions === true).length
          const actionNo = clanVotes.filter(v => v.initiate_actions === false).length

          return (
            <div key={clan.clan_id} className="bg-white rounded-xl border-4 border-amber-400 p-6">
              {/* Clan Header with Emblem and Aggregate Stats */}
              <div className="flex items-start gap-4 mb-4 pb-4 border-b-2 border-amber-200">
                {clan.emblem_url && (
                  <img
                    src={clan.emblem_url}
                    alt={clan.name}
                    className="w-20 h-20 object-contain"
                  />
                )}

                <div className="flex-1">
                  <h4
                    className="text-2xl font-heading font-bold mb-2"
                    style={{ color: clan.color_hex }}
                  >
                    {clan.name}
                  </h4>

                  {/* Aggregate Statistics */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-neutral-700">Voting Progress:</span>
                      <span className="text-amber-800">{totalVoted} / {totalRoles} voted</span>
                    </div>

                    {revealed && (
                      <>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-neutral-700">Oath of Allegiance:</span>
                          <span className="text-green-700">{oathYes} Yes</span>
                          <span className="text-red-700">{oathNo} No</span>
                        </div>

                        {clan.if_things_go_wrong && (
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-neutral-700">Initiate Actions:</span>
                            <span className="text-red-700">{actionYes} Yes</span>
                            <span className="text-green-700">{actionNo} No</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual Roles */}
              <div className="space-y-3">
                {clanRoles.map(role => {
                  const roleVote = getRoleVote(role.role_id)
                  const hasVoted = !!roleVote

                  return (
                    <div
                      key={role.role_id}
                      className={`border-2 rounded-lg p-3 ${
                        hasVoted ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Role Avatar */}
                          {role.avatar_url && (
                            <img
                              src={role.avatar_url}
                              alt={role.name}
                              className="w-10 h-10 rounded-full object-cover border-2"
                              style={{ borderColor: clan.color_hex }}
                            />
                          )}

                          <div>
                            <div className="font-semibold text-neutral-900">{role.name}</div>
                            <div className="text-xs text-neutral-600">{role.title}</div>
                          </div>
                        </div>

                        <div className="flex-1 ml-4">
                          {!hasVoted ? (
                            votingStopped && !revealed ? (
                              // Manual vote entry for roles that didn't vote
                              <div className="flex gap-3 items-center">
                                <span className="text-red-700 font-semibold text-xs whitespace-nowrap">
                                  Manual entry:
                                </span>

                                {/* Oath dropdown */}
                                <select
                                  value={manualVotes[role.role_id]?.oath === true ? 'true' : manualVotes[role.role_id]?.oath === false ? 'false' : ''}
                                  onChange={(e) => handleManualVote(role.role_id, 'oath', e.target.value === '' ? null : e.target.value === 'true')}
                                  className="text-xs border-2 border-amber-300 rounded px-2 py-1 flex-1"
                                >
                                  <option value="">Oath?</option>
                                  <option value="true">✅ Pledge</option>
                                  <option value="false">❌ Refuse</option>
                                </select>

                                {/* Actions dropdown (only if clan has contingency) */}
                                {clan.if_things_go_wrong && (
                                  <select
                                    value={manualVotes[role.role_id]?.action === true ? 'true' : manualVotes[role.role_id]?.action === false ? 'false' : ''}
                                    onChange={(e) => handleManualVote(role.role_id, 'action', e.target.value === '' ? null : e.target.value === 'true')}
                                    className="text-xs border-2 border-amber-300 rounded px-2 py-1 flex-1"
                                  >
                                    <option value="">Action?</option>
                                    <option value="true">⚔️ Act</option>
                                    <option value="false">🕊️ Peace</option>
                                  </select>
                                )}
                              </div>
                            ) : (
                              <div className="text-amber-700 italic text-sm text-right">Awaiting vote...</div>
                            )
                          ) : revealed ? (
                            <div className="flex gap-2 justify-end">
                              {/* Oath result */}
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                roleVote.oath_of_allegiance
                                  ? 'bg-green-200 text-green-900'
                                  : 'bg-red-200 text-red-900'
                              }`}>
                                {roleVote.oath_of_allegiance ? '✅ Pledged' : '❌ Refused'}
                              </span>

                              {/* Action result (only if clan has contingency) */}
                              {clan.if_things_go_wrong && (
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  roleVote.initiate_actions
                                    ? 'bg-red-200 text-red-900'
                                    : 'bg-green-200 text-green-900'
                                }`}>
                                  {roleVote.initiate_actions ? '⚔️ Act' : '🕊️ Peace'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-green-700 font-semibold text-sm text-right">
                              ✓ Voted
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Warning if not all voted */}
      {!revealed && votes.length < getTotalCount() && (
        <div className="bg-amber-100 border-2 border-amber-500 rounded-lg p-4 text-center">
          <div className="text-amber-900 font-semibold">
            ⚠️ Not all participants have voted yet
          </div>
          <div className="text-amber-700 text-sm mt-1">
            You can reveal results now, or wait for all participants to vote
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
