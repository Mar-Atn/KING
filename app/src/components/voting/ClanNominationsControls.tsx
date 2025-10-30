/**
 * Clan Nominations Controls
 *
 * Specialized voting controls for the "Clans nominate candidates" phase.
 * Auto-creates voting sessions for each clan, manages simultaneous voting,
 * and handles the reveal animation.
 *
 * Features:
 * - Auto-create voting sessions when phase starts
 * - Start/Extend/Stop/Reveal buttons
 * - Live dashboard showing votes cast per clan
 * - Override UI for admin to modify nominees
 * - Reveal animation showing all nominations
 */

import { useState, useEffect, useRef } from 'react'
import { Play, Clock, StopCircle, Eye, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useVoting } from '../../hooks/useVoting'
import type { Database } from '../../lib/database.types'

type Clan = Database['public']['Tables']['clans']['Row']
type Role = Database['public']['Tables']['roles']['Row']
type VoteSession = Database['public']['Tables']['vote_sessions']['Row']

interface ClanNominationsControlsProps {
  runId: string
  phaseId: string
  phaseName: string
  clans: Clan[]
  roles: Role[]
}

interface ClanVoteStatus {
  clan: Clan
  session: VoteSession | null
  votescast: number
  totalParticipants: number
  nominee: Role | null
}

export function ClanNominationsControls({
  runId,
  phaseId,
  phaseName,
  clans,
  roles
}: ClanNominationsControlsProps) {
  const { sessions, fetchSessions, createVoteSession, endVoteSession } = useVoting({ runId, phaseId })
  const [clanStatuses, setClanStatuses] = useState<ClanVoteStatus[]>([])
  const [votingActive, setVotingActive] = useState(false)
  const [votingClosed, setVotingClosed] = useState(false)
  const [announced, setAnnounced] = useState(false) // Results announced to participants
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes default
  const [overrides, setOverrides] = useState<Record<string, string>>({}) // clanId => roleId
  const [showReveal, setShowReveal] = useState(false)

  // ============================================================================
  // AUTO-CREATE VOTING SESSIONS - useEffect approach (proper React pattern)
  // ============================================================================

  // Track which phase we've initialized for
  const initializedPhaseId = useRef<string | null>(null)
  const isCreating = useRef(false)

  useEffect(() => {
    // Skip if missing required data
    if (!runId || !phaseId || clans.length === 0 || roles.length === 0) {
      return
    }

    // Skip if already creating or already initialized this phase
    if (isCreating.current || initializedPhaseId.current === phaseId) {
      return
    }

    const initializeSessions = async () => {
      try {
        isCreating.current = true

        // Check if sessions already exist
        const { data: existingSessions, error: fetchError } = await supabase
          .from('vote_sessions')
          .select('*')
          .eq('run_id', runId)
          .eq('phase_id', phaseId)

        if (fetchError) {
          console.error('❌ Error fetching vote sessions:', fetchError)
          isCreating.current = false
          return
        }

        // If sessions already exist, just fetch them and done
        if (existingSessions && existingSessions.length > 0) {
          initializedPhaseId.current = phaseId
          await fetchSessions()
          isCreating.current = false
          return
        }

        console.log('🗳️ Creating clan nomination sessions...')
        initializedPhaseId.current = phaseId

        for (const clan of clans) {
          const clanMembers = roles.filter(r => r.clan_id === clan.clan_id && r.participant_type === 'human')
          if (clanMembers.length === 0) continue

          const sessionData = {
            run_id: runId,
            phase_id: phaseId,
            proposal_title: `${clan.name} Nomination`,
            proposal_description: `Choose your clan's nominee for King`,
            vote_format: 'choose_person' as const,
            vote_type: 'clan_nomination' as const,
            scope: 'clan_only' as const,
            scope_clan_id: clan.clan_id,
            eligible_candidates: clanMembers.map(r => r.role_id),
            transparency_level: 'secret' as const,
            status: 'open' as const,
            started_at: null // Explicitly NULL - voting not started yet
          }

          const session = await createVoteSession(sessionData)

          if (session) {
            console.log(`✅ Created ${clan.name} voting session`)
          } else {
            console.error(`❌ Failed to create ${clan.name} session`)
          }
        }

        console.log('✅ All voting sessions created!')
        await fetchSessions()
        isCreating.current = false
      } catch (err) {
        console.error('❌ Initialization error:', err)
        initializedPhaseId.current = null
        isCreating.current = false
      }
    }

    initializeSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, phaseId, clans, roles])
  // Note: createVoteSession and fetchSessions intentionally omitted to prevent infinite loop
  // They are used but not dependencies since they can change on every render

  // ============================================================================
  // RESET STATES WHEN PHASE CHANGES
  // ============================================================================

  useEffect(() => {
    // Reset all voting states when phase changes
    setVotingActive(false)
    setVotingClosed(false)
    setAnnounced(false)
    setTimeRemaining(300)
    setOverrides({})
  }, [phaseId])

  // ============================================================================
  // LOAD CLAN STATUSES (with real-time polling)
  // ============================================================================

  useEffect(() => {
    const loadClanStatuses = async () => {
      const statuses: ClanVoteStatus[] = []

      for (const clan of clans) {
        // Find session for this clan
        const session = sessions.find(s =>
          s.proposal_title?.includes(clan.name)
        ) || null

        // Count votes cast
        let votesCount = 0
        let nominee: Role | null = null

        if (session) {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.session_id)

          votesCount = count || 0

          // Get nominee (most voted person)
          const { data: voteData } = await supabase
            .from('votes')
            .select('chosen_role_id')
            .eq('session_id', session.session_id)
            .not('chosen_role_id', 'is', null)

          if (voteData && voteData.length > 0) {
            // Count votes for each candidate
            const voteCounts: Record<string, number> = {}
            voteData.forEach(v => {
              if (v.chosen_role_id) {
                voteCounts[v.chosen_role_id] = (voteCounts[v.chosen_role_id] || 0) + 1
              }
            })

            // Find winner
            const winnerId = Object.keys(voteCounts).reduce((a, b) =>
              voteCounts[a] > voteCounts[b] ? a : b
            , '')

            nominee = roles.find(r => r.role_id === winnerId) || null
          }
        }

        // Count total participants in clan
        const totalParticipants = roles.filter(r =>
          r.clan_id === clan.clan_id && r.participant_type === 'human'
        ).length

        statuses.push({
          clan,
          session,
          votescast: votesCount,
          totalParticipants,
          nominee: overrides[clan.clan_id]
            ? roles.find(r => r.role_id === overrides[clan.clan_id]) || nominee
            : nominee
        })
      }

      setClanStatuses(statuses)

      // Update status flags
      // Note: We don't check started_at anymore (column doesn't exist)
      // votingActive is managed by component state only
      const allClosed = sessions.length > 0 && sessions.every(s => s.status === 'closed')
      const allAnnounced = sessions.length > 0 && sessions.every(s => s.status === 'announced')
      setVotingClosed(allClosed || allAnnounced) // Closed if either status
      // Only set announced to true, never reset it to false (prevents race conditions)
      if (allAnnounced) {
        setAnnounced(true)
      }
    }

    if (sessions.length > 0) {
      loadClanStatuses()
    }

    // Poll every 2 seconds for live updates while voting is active
    let pollInterval: NodeJS.Timeout | null = null
    if (votingActive && sessions.length > 0) {
      pollInterval = setInterval(() => {
        loadClanStatuses()
      }, 2000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [sessions, clans, roles, overrides, votingActive])

  // ============================================================================
  // TIMER
  // ============================================================================

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

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleStart = async () => {
    console.log('🎬 Starting voting for', sessions.length, 'sessions...')

    // Sessions are already 'open' status (accepting votes)
    // Set started_at to signal participants they can vote
    for (const session of sessions) {
      console.log('  Setting started_at for session:', session.proposal_title)

      const { data, error } = await supabase
        .from('vote_sessions')
        .update({
          started_at: new Date().toISOString()
        })
        .eq('session_id', session.session_id)
        .select()

      if (error) {
        console.error('  ❌ Error updating session:', error)
      } else {
        console.log('  ✅ Updated session:', data)
      }
    }

    setVotingActive(true)
    setTimeRemaining(300) // 5 minutes

    console.log('📡 Fetching sessions to confirm updates...')
    await fetchSessions()
  }

  const handleExtend = () => {
    setTimeRemaining(prev => prev + 60) // Add 1 minute
  }

  const handleStop = async () => {
    console.log('⏹️  Stopping clan nominations voting...')

    // Close all sessions
    for (const session of sessions) {
      await endVoteSession(session.session_id)
    }

    setVotingActive(false)
    await fetchSessions()
  }

  const handleReveal = async () => {
    console.log('🎬 Revealing results to participants...')

    // Save all nominees to database and announce results
    for (const status of clanStatuses) {
      if (status.session && status.nominee) {
        // Fetch all votes for this session to build complete results
        const { data: voteData, error: voteError } = await supabase
          .from('votes')
          .select('chosen_role_id')
          .eq('session_id', status.session.session_id)
          .not('chosen_role_id', 'is', null)

        if (voteError) {
          console.error(`❌ Error fetching votes for ${status.clan.name}:`, voteError)
          alert(`Failed to fetch votes for ${status.clan.name}: ${voteError.message}`)
          continue
        }

        // Count votes for each candidate
        const voteCounts: Record<string, number> = {}
        voteData?.forEach(v => {
          if (v.chosen_role_id) {
            voteCounts[v.chosen_role_id] = (voteCounts[v.chosen_role_id] || 0) + 1
          }
        })

        const totalVotes = voteData?.length || 0

        // Get all roles in this clan to build candidate list
        const { data: clanRoles } = await supabase
          .from('roles')
          .select('*')
          .eq('clan_id', status.clan.clan_id)
          .eq('participant_type', 'human')

        // Build all_candidates array with vote counts
        const allCandidates = (clanRoles || []).map(role => ({
          role_id: role.role_id,
          name: role.name,
          vote_count: voteCounts[role.role_id] || 0,
          percentage: totalVotes > 0 ? Math.round((voteCounts[role.role_id] || 0) / totalVotes * 100) : 0
        })).sort((a, b) => b.vote_count - a.vote_count) // Sort by vote count descending

        // Build results_data JSONB object
        const resultsData = {
          winner: {
            role_id: status.nominee.role_id,
            name: status.nominee.name,
            vote_count: voteCounts[status.nominee.role_id] || 0,
            percentage: totalVotes > 0 ? Math.round((voteCounts[status.nominee.role_id] || 0) / totalVotes * 100) : 0
          },
          all_candidates: allCandidates,
          total_votes: totalVotes,
          tie: false // For clan nominations, we always pick a winner (no ties)
        }

        // Record result in vote_results table
        const { error: resultError } = await supabase
          .from('vote_results')
          .insert({
            session_id: status.session.session_id,
            results_data: resultsData,
            calculated_at: new Date().toISOString()
          })

        if (resultError) {
          console.error(`❌ Error inserting result for ${status.clan.name}:`, resultError)
          alert(`Failed to save results for ${status.clan.name}: ${resultError.message}`)
          continue
        }

        // Announce results - this triggers participant reveal
        const { error: updateError } = await supabase
          .from('vote_sessions')
          .update({
            status: 'announced',
            announced_at: new Date().toISOString()
          })
          .eq('session_id', status.session.session_id)

        if (updateError) {
          console.error(`❌ Error announcing results for ${status.clan.name}:`, updateError)
          alert(`Failed to announce results for ${status.clan.name}: ${updateError.message}`)
          continue
        }

        console.log(`✅ Announced results for ${status.clan.name}`)
      }
    }

    console.log('🎉 All results announced! Participants will see reveal animation.')
    setAnnounced(true) // Mark as announced to hide "Reveal Results" button
    await fetchSessions()
  }

  const handleOverride = (clanId: string, roleId: string) => {
    setOverrides(prev => ({
      ...prev,
      [clanId]: roleId
    }))
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg border-2 border-primary p-6 mb-6 shadow-lg">
      {/* Header Banner */}
      <div className="bg-primary bg-opacity-10 -m-6 mb-6 p-4 rounded-t-lg border-b-2 border-primary">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          <h2 className="font-heading text-2xl text-primary font-bold">
            Clan Nominations Voting System
          </h2>
        </div>
        <p className="text-sm text-neutral-600 mt-2 ml-6">
          Automatic voting for all clans with human participants
        </p>
      </div>

      {/* Timer Header - Only show during voting */}
      {!announced && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg text-primary">Voting Status</h3>

          {votingActive && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-neutral-500">Time Remaining</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        {!votingActive && !votingClosed && !announced && (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-success text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Voting
          </button>
        )}

        {votingActive && (
          <>
            <button
              onClick={handleExtend}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Extend (+1 min)
            </button>
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Stop Voting
            </button>
          </>
        )}

        {votingClosed && !announced && (
          <button
            onClick={handleReveal}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Confirm and Reveal Results
          </button>
        )}

        {announced && (
          <div className="px-4 py-2 bg-amber-700 text-white rounded-lg font-semibold">
            ✓ Results Announced to Participants
          </div>
        )}
      </div>

      {/* Clan Status Dashboard */}
      <div className="space-y-3">
        <h3 className="text-sm text-neutral-600 mb-2">
          {announced ? 'Final Results' : 'Voting Progress'}
        </h3>

        {clanStatuses
          .filter(status => status.totalParticipants > 0) // Only show clans with participants
          .map(status => {
          const isComplete = status.votescast === status.totalParticipants && status.votescast > 0
          const progressPercent = status.totalParticipants > 0
            ? (status.votescast / status.totalParticipants) * 100
            : 0

          return (
            <div
              key={status.clan.clan_id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                isComplete
                  ? 'bg-success bg-opacity-5 border-success'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              {/* Clan Info with Progress */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full overflow-hidden relative"
                  style={{
                    backgroundColor: `${status.clan.color_hex}20`,
                    borderColor: status.clan.color_hex,
                    borderWidth: 2
                  }}
                >
                  {status.clan.emblem_url && (
                    <img src={status.clan.emblem_url} alt={status.clan.name} className="w-full h-full object-cover" />
                  )}
                  {/* Green checkmark overlay when complete */}
                  {isComplete && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900 mb-1">{status.clan.name}</div>
                  {!announced && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-neutral-600">
                        {status.votescast} / {status.totalParticipants} votes
                      </div>
                      {/* Progress bar */}
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isComplete ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {announced && (
                    <div className="text-sm text-neutral-500">
                      {status.totalParticipants} participants
                    </div>
                  )}
                </div>
              </div>

              {/* Nominee or Status */}
              <div className="text-right">
                {announced ? (
                  // Final results - show nominee with avatar
                  <div className="flex items-center gap-3">
                    {status.nominee && (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-neutral-900">
                            {status.nominee.name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {status.nominee.title}
                          </div>
                        </div>
                        <img
                          src={status.nominee.avatar_url || '/placeholder-avatar.png'}
                          alt={status.nominee.name}
                          className="w-12 h-12 rounded-full object-cover border-2"
                          style={{ borderColor: status.clan.color_hex }}
                        />
                      </>
                    )}
                    {!status.nominee && (
                      <div className="text-sm text-neutral-400">No nominee</div>
                    )}
                  </div>
                ) : votingClosed ? (
                  // Voting closed - show nominee with override option
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-neutral-900">
                      {status.nominee?.name || 'No nominee'}
                    </div>
                    {!votingActive && (
                      <select
                        value={overrides[status.clan.clan_id] || status.nominee?.role_id || ''}
                        onChange={(e) => handleOverride(status.clan.clan_id, e.target.value)}
                        className="text-xs border border-neutral-300 rounded px-2 py-1"
                      >
                        <option value="">No nominee</option>
                        {roles
                          .filter(r => r.clan_id === status.clan.clan_id && r.participant_type === 'human')
                          .map(r => (
                            <option key={r.role_id} value={r.role_id}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                ) : votingActive ? (
                  // Voting in progress
                  <div className={`text-sm font-medium ${isComplete ? 'text-success' : 'text-neutral-500'}`}>
                    {isComplete ? '✓ Complete' : 'Voting...'}
                  </div>
                ) : (
                  // Before voting starts
                  <div className="text-sm font-medium text-neutral-400">
                    Ready
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reveal happens on participant screens now */}
    </div>
  )
}

// Reveal Animation Component
function NominationsReveal({
  clanStatuses,
  onComplete
}: {
  clanStatuses: ClanVoteStatus[]
  onComplete: () => void
}) {
  const [revealedIndex, setRevealedIndex] = useState(-1)

  useEffect(() => {
    if (revealedIndex < clanStatuses.length) {
      const timer = setTimeout(() => {
        setRevealedIndex(prev => prev + 1)
      }, 2000) // 2 seconds per clan

      return () => clearTimeout(timer)
    } else {
      // All revealed, wait 3 seconds then close
      const timer = setTimeout(() => {
        onComplete()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [revealedIndex, clanStatuses.length])

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="max-w-4xl w-full px-8">
        <h1 className="text-4xl font-heading text-white text-center mb-12">
          Clan Nominations
        </h1>

        <div className="space-y-6">
          {clanStatuses
            .filter(status => status.totalParticipants > 0) // Only show clans with participants
            .map((status, index) => (
            <div
              key={status.clan.clan_id}
              className={`transition-all duration-1000 ${
                index <= revealedIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-between p-6 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
                {/* Clan */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white">
                    {status.clan.emblem_url && (
                      <img src={status.clan.emblem_url} alt={status.clan.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="text-2xl font-heading text-white">
                    {status.clan.name}
                  </div>
                </div>

                {/* Nominee */}
                <div className="text-right">
                  <div className="text-sm text-white text-opacity-70 mb-1">Nominee</div>
                  <div className="text-3xl font-bold text-white">
                    {status.nominee?.name || 'No Nominee'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
