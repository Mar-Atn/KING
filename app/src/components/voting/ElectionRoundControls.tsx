import { useState, useEffect } from 'react'
import { Play, Clock, StopCircle, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useVoting } from '../../hooks/useVoting'
import type { Database } from '../../lib/database.types'

type VoteSession = Database['public']['Tables']['vote_sessions']['Row']
type Role = Database['public']['Tables']['roles']['Row']
type Clan = Database['public']['Tables']['clans']['Row']

interface ElectionRoundControlsProps {
  runId: string
  phaseId: string
  phaseName: string
  roundNumber: 1 | 2
  threshold: number
  candidates: Role[]
  allRoles: Role[]
  clans: Clan[]
}

interface CandidateVoteData {
  candidate: Role
  clan: Clan | null
  voteCount: number
}

export function ElectionRoundControls({
  runId,
  phaseId,
  phaseName,
  roundNumber,
  threshold,
  candidates,
  allRoles,
  clans
}: ElectionRoundControlsProps) {
  const { sessions, fetchSessions, createVoteSession, endVoteSession } = useVoting({ runId, phaseId })
  const [session, setSession] = useState<VoteSession | null>(null)
  const [votingActive, setVotingActive] = useState(false)
  const [votingClosed, setVotingClosed] = useState(false)
  const [announced, setAnnounced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes default
  const [candidateVotes, setCandidateVotes] = useState<CandidateVoteData[]>([])
  const [totalVotesCast, setTotalVotesCast] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [nonVoters, setNonVoters] = useState<Role[]>([])
  const [runoffCandidates, setRunoffCandidates] = useState<Array<{role_id: string; name: string; vote_count: number; percentage: number}>>([])
  const [selectedRunoffCandidates, setSelectedRunoffCandidates] = useState<Set<string>>(new Set())
  const [runoffConfirmed, setRunoffConfirmed] = useState(false)

  // Calculate total participants (human roles only)
  useEffect(() => {
    const humanCount = allRoles.filter(r => r.participant_type === 'human').length
    setTotalParticipants(humanCount)
  }, [allRoles])

  // Load/sync session from sessions array
  useEffect(() => {
    if (sessions.length > 0) {
      const electionSession = sessions.find(s => s.scope === 'all')
      if (electionSession) {
        setSession(electionSession)
        setVotingActive(!!electionSession.started_at && electionSession.status === 'open')
        setVotingClosed(electionSession.status === 'closed' || electionSession.status === 'announced')
        if (electionSession.status === 'announced') {
          setAnnounced(true)
        }
      }
    }
  }, [sessions])

  // Auto-create session on mount if it doesn't exist
  useEffect(() => {
    const autoCreateSession = async () => {
      // Only auto-create if no session exists and we have candidates
      if (sessions.length === 0 && candidates.length > 0 && !loading) {
        console.log('🔧 Auto-creating voting session for', phaseName)

        const sessionData = {
          run_id: runId,
          phase_id: phaseId,
          proposal_title: phaseName,
          proposal_description: `Vote for the next King of Kourion. ${threshold} votes needed to win.`,
          vote_format: 'choose_person' as const,
          vote_type: 'election_round' as const,
          scope: 'all' as const,
          scope_clan_id: null,
          eligible_candidates: candidates.map(c => c.role_id),
          transparency_level: 'open' as const,
          status: 'open' as const,
          started_at: null
        }

        try {
          await createVoteSession(sessionData)
          console.log('✅ Voting session auto-created')
        } catch (error) {
          console.error('❌ Failed to auto-create session:', error)
        }
      }
    }

    autoCreateSession()
  }, [sessions, candidates, runId, phaseId, phaseName, threshold])

  // Poll voting stats every 2 seconds while voting is active
  useEffect(() => {
    if (!votingActive || !session) return

    const pollVotes = async () => {
      await updateVoteStats()
    }

    pollVotes() // Initial load
    const interval = setInterval(pollVotes, 2000)
    return () => clearInterval(interval)
  }, [votingActive, session])

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

  // Update vote statistics
  async function updateVoteStats() {
    if (!session) return

    try {
      // Get all votes for this session
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('chosen_role_id')
        .eq('session_id', session.session_id)
        .not('chosen_role_id', 'is', null)

      if (votesError) {
        console.error('Error fetching votes:', votesError)
        return
      }

      setTotalVotesCast(votes?.length || 0)

      // Count votes per candidate
      const voteCounts: Record<string, number> = {}
      votes?.forEach(v => {
        if (v.chosen_role_id) {
          voteCounts[v.chosen_role_id] = (voteCounts[v.chosen_role_id] || 0) + 1
        }
      })

      // Build candidate vote data with clan info
      const candidateData: CandidateVoteData[] = candidates.map(candidate => {
        const clan = clans.find(c => c.clan_id === candidate.clan_id) || null
        return {
          candidate,
          clan,
          voteCount: voteCounts[candidate.role_id] || 0
        }
      }).sort((a, b) => b.voteCount - a.voteCount) // Sort by vote count descending

      setCandidateVotes(candidateData)
    } catch (err) {
      console.error('Error updating vote stats:', err)
    }
  }

  async function handleCreateSession() {
    if (candidates.length === 0) {
      alert('No candidates available. Complete previous voting phase first.')
      return
    }

    setLoading(true)

    const sessionData = {
      run_id: runId,
      phase_id: phaseId,
      proposal_title: phaseName,
      proposal_description: `Vote for the next King of Kourion. ${threshold} votes needed to win.`,
      vote_format: 'choose_person' as const,
      vote_type: 'election_round' as const,
      scope: 'all' as const,
      scope_clan_id: null,
      eligible_candidates: candidates.map(c => c.role_id),
      transparency_level: 'open' as const,
      status: 'open' as const,
      started_at: null
    }

    const newSession = await createVoteSession(sessionData)

    setLoading(false)

    if (newSession) {
      console.log('Session created successfully')
      await fetchSessions()
    } else {
      alert('Failed to create voting session')
    }
  }

  async function handleStart() {
    if (!session) return
    setLoading(true)

    const { error } = await supabase
      .from('vote_sessions')
      .update({ started_at: new Date().toISOString() })
      .eq('session_id', session.session_id)

    setLoading(false)

    if (error) {
      console.error('Error starting voting:', error)
      alert('Failed to start voting')
      return
    }

    setVotingActive(true)
    setTimeRemaining(300) // Reset to 5 minutes
    await fetchSessions()
  }

  const handleExtend = () => {
    setTimeRemaining(prev => prev + 60) // Add 1 minute
  }

  async function handleStop() {
    if (!session) return
    setLoading(true)

    await endVoteSession(session.session_id)

    setVotingActive(false)
    setVotingClosed(true)
    setLoading(false)
    await fetchSessions()

    // Fetch non-voters after stopping
    await fetchNonVoters()
  }

  async function fetchNonVoters() {
    if (!session) return

    try {
      // Get all votes cast
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('voter_role_id')
        .eq('session_id', session.session_id)

      if (votesError) {
        console.error('Error fetching votes:', votesError)
        return
      }

      const voterIds = new Set(votes?.map(v => v.voter_role_id) || [])

      // Find human participants who haven't voted
      const humanParticipants = allRoles.filter(r => r.participant_type === 'human')
      const missingVoters = humanParticipants.filter(r => !voterIds.has(r.role_id))

      setNonVoters(missingVoters)
      console.log(`Non-voters found: ${missingVoters.length}`, missingVoters.map(r => r.name))
    } catch (err) {
      console.error('Error fetching non-voters:', err)
    }
  }

  async function handleManualVote(voterId: string, candidateId: string) {
    if (!session) return

    const voter = allRoles.find(r => r.role_id === voterId)
    const candidate = candidates.find(c => c.role_id === candidateId)

    console.log('🔍 Manual vote debug:', {
      voter,
      voterId,
      voter_clan_id: voter?.clan_id,
      allRoles_sample: allRoles[0]
    })

    if (!voter || !voter.clan_id) {
      alert('Error: Voter clan information not found')
      return
    }

    const confirmVote = confirm(`Manually cast vote for ${voter.name} → ${candidate?.name}?`)
    if (!confirmVote) return

    setLoading(true)

    try {
      // Insert vote
      const { error } = await supabase
        .from('votes')
        .insert({
          session_id: session.session_id,
          voter_role_id: voterId,
          voter_clan_id: voter.clan_id,
          chosen_role_id: candidateId,
          cast_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error casting manual vote:', error)
        alert('Failed to cast manual vote: ' + error.message)
        setLoading(false)
        return
      }

      // Refresh stats and non-voters
      await updateVoteStats()
      await fetchNonVoters()

      alert('Manual vote cast successfully!')
    } catch (err) {
      console.error('Error in manual vote:', err)
      alert('Failed to cast manual vote')
    }

    setLoading(false)
  }

  async function handleReveal() {
    if (!session) return
    setLoading(true)

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('chosen_role_id')
      .eq('session_id', session.session_id)
      .not('chosen_role_id', 'is', null)

    if (votesError || !votes) {
      console.error('Error fetching votes:', votesError)
      alert('Failed to fetch votes')
      setLoading(false)
      return
    }

    // Calculate results
    const voteCounts: Record<string, number> = {}
    votes.forEach(vote => {
      const roleId = vote.chosen_role_id
      if (roleId) {
        voteCounts[roleId] = (voteCounts[roleId] || 0) + 1
      }
    })

    const totalVotes = votes.length

    // Sort by vote count
    const sortedCandidates = Object.entries(voteCounts)
      .map(([roleId, count]) => ({ roleId, count }))
      .sort((a, b) => b.count - a.count)

    const winner = sortedCandidates[0]
    const thresholdMet = winner && winner.count >= threshold

    // Determine runoff candidates (all tied for top positions)
    let runoffCandidates: { roleId: string; count: number }[] = []
    if (!thresholdMet && sortedCandidates.length > 1) {
      const topVoteCount = sortedCandidates[0].count
      // Include all candidates with the top vote count
      runoffCandidates = sortedCandidates.filter(c => c.count === topVoteCount)

      // If multiple tied for first, include them all
      // If only one first place, check for ties in second place
      if (runoffCandidates.length === 1 && sortedCandidates.length > 1) {
        const secondPlaceCount = sortedCandidates[1].count
        const secondPlaceCandidates = sortedCandidates.filter(c => c.count === secondPlaceCount)
        runoffCandidates = [...runoffCandidates, ...secondPlaceCandidates]
      }
    }

    // Build all_candidates array with candidate details
    const allCandidates = sortedCandidates.map(({ roleId, count }) => {
      const candidate = candidates.find(c => c.role_id === roleId)
      return {
        role_id: roleId,
        name: candidate?.name || 'Unknown',
        vote_count: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
      }
    })

    // Build results_data JSONB object
    const resultsData = {
      winner: thresholdMet && winner ? {
        role_id: winner.roleId,
        name: candidates.find(c => c.role_id === winner.roleId)?.name || 'Unknown',
        vote_count: winner.count,
        percentage: totalVotes > 0 ? Math.round((winner.count / totalVotes) * 100) : 0
      } : null,
      runoff_candidates: runoffCandidates.map(({ roleId, count }) => ({
        role_id: roleId,
        name: candidates.find(c => c.role_id === roleId)?.name || 'Unknown',
        vote_count: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
      })),
      all_candidates: allCandidates,
      total_votes: totalVotes,
      tie: runoffCandidates.length > 2,
      threshold_met: thresholdMet,
      threshold_required: threshold
    }

    // Insert result
    const { error: resultError } = await supabase
      .from('vote_results')
      .insert({
        session_id: session.session_id,
        results_data: resultsData,
        calculated_at: new Date().toISOString()
      })

    if (resultError) {
      console.error('Error inserting result:', resultError)
      alert('Failed to save results: ' + resultError.message)
      setLoading(false)
      return
    }

    // Update session status to announced
    const { error: updateError } = await supabase
      .from('vote_sessions')
      .update({
        status: 'announced',
        announced_at: new Date().toISOString()
      })
      .eq('session_id', session.session_id)

    setLoading(false)

    if (updateError) {
      console.error('Error updating session:', updateError)
      alert('Failed to announce results: ' + updateError.message)
      return
    }

    console.log('Results announced! Participants will see reveal animation.')
    setAnnounced(true)
    await fetchSessions()
  }

  // Load runoff candidates from vote results when announced
  useEffect(() => {
    const loadRunoffCandidates = async () => {
      if (!announced || !session) return

      const { data: result, error } = await supabase
        .from('vote_results')
        .select('results_data, confirmed_runoff_candidates')
        .eq('session_id', session.session_id)
        .single()

      if (error) {
        console.error('Error loading results:', error)
        return
      }

      if (result?.results_data) {
        const resultsData = result.results_data as any
        if (resultsData.runoff_candidates && resultsData.runoff_candidates.length > 0) {
          setRunoffCandidates(resultsData.runoff_candidates)

          // Initialize selected candidates with all runoff candidates by default
          if (result.confirmed_runoff_candidates) {
            setSelectedRunoffCandidates(new Set(result.confirmed_runoff_candidates as string[]))
            setRunoffConfirmed(true)
          } else {
            setSelectedRunoffCandidates(new Set(resultsData.runoff_candidates.map((c: any) => c.role_id)))
          }
        }
      }
    }

    loadRunoffCandidates()
  }, [announced, session])

  const toggleRunoffCandidate = (roleId: string) => {
    if (runoffConfirmed) return // Can't change after confirmation

    setSelectedRunoffCandidates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roleId)) {
        newSet.delete(roleId)
      } else {
        newSet.add(roleId)
      }
      return newSet
    })
  }

  const confirmRunoffCandidates = async () => {
    if (!session || selectedRunoffCandidates.size === 0) {
      alert('Please select at least one candidate for the next round')
      return
    }

    setLoading(true)

    // Update vote_results with confirmed runoff candidates
    const { error } = await supabase
      .from('vote_results')
      .update({
        confirmed_runoff_candidates: Array.from(selectedRunoffCandidates)
      })
      .eq('session_id', session.session_id)

    setLoading(false)

    if (error) {
      console.error('Error confirming runoff candidates:', error)
      alert('Failed to confirm candidates: ' + error.message)
      return
    }

    setRunoffConfirmed(true)
    console.log('Runoff candidates confirmed:', Array.from(selectedRunoffCandidates))
  }

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
            {phaseName} - Round {roundNumber}
          </h2>
        </div>
        <p className="text-sm text-neutral-600 mt-2 ml-6">
          Election voting for all participants - {threshold} votes needed to win
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
        {session && !votingActive && !votingClosed && (
          <button
            onClick={handleStart}
            disabled={loading}
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
              <Clock className="w-4 h-4" />
              Extend (+1 min)
            </button>
            <button
              onClick={handleStop}
              disabled={loading}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Close Voting
            </button>
          </>
        )}

        {votingClosed && !announced && (
          <button
            onClick={handleReveal}
            disabled={loading}
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

      {/* Live Dashboard - Show during voting or after */}
      {(votingActive || votingClosed) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-neutral-600">
              {announced ? 'Final Results' : 'Live Voting Dashboard'}
            </h3>
            {!announced && (
              <div className="text-sm text-neutral-600">
                {totalVotesCast} / {totalParticipants} votes cast
              </div>
            )}
          </div>

          {/* Candidates with vote counts */}
          {candidateVotes.map((data, index) => {
            const percentage = totalVotesCast > 0 ? Math.round((data.voteCount / totalVotesCast) * 100) : 0
            const meetsThreshold = data.voteCount >= threshold

            return (
              <div
                key={data.candidate.role_id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                  meetsThreshold && announced
                    ? 'bg-success bg-opacity-10 border-success'
                    : index === 0 && data.voteCount > 0
                    ? 'bg-primary bg-opacity-5 border-primary'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                {/* Candidate Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={data.candidate.avatar_url || '/placeholder-avatar.png'}
                      alt={data.candidate.name}
                      className="w-12 h-12 rounded-full object-cover border-2"
                      style={{ borderColor: data.clan?.color_hex || '#8B7355' }}
                    />
                    {data.clan?.emblem_url && (
                      <img
                        src={data.clan.emblem_url}
                        alt={data.clan.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-900 mb-1">
                      {data.candidate.name}
                      {meetsThreshold && announced && ' 👑'}
                    </div>
                    <div className="text-sm text-neutral-600 flex items-center gap-2">
                      <span>{data.candidate.position}</span>
                      {data.clan && (
                        <>
                          <span>•</span>
                          <span style={{ color: data.clan.color_hex }}>{data.clan.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vote Count */}
                <div className="text-right">
                  {!announced ? (
                    <div className="text-2xl font-bold text-neutral-900">
                      {data.voteCount}
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">
                        {data.voteCount} votes
                      </div>
                      <div className="text-sm text-neutral-600">
                        {percentage}%
                      </div>
                    </div>
                  )}
                  {meetsThreshold && (
                    <div className="text-xs text-success font-semibold mt-1">
                      ✓ Threshold met
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Threshold indicator */}
          <div className="mt-4 p-3 bg-neutral-100 rounded-lg border border-neutral-300">
            <div className="text-sm text-neutral-700">
              <strong>Required to Win:</strong> {threshold} votes ({Math.round((threshold / totalParticipants) * 100)}% of {totalParticipants} participants)
            </div>
          </div>
        </div>
      )}

      {/* Non-Voters Section - Show after voting closed but before reveal */}
      {votingClosed && !announced && nonVoters.length > 0 && (
        <div className="mt-6 p-4 bg-warning bg-opacity-10 border-2 border-warning rounded-lg">
          <h4 className="font-semibold text-warning mb-3 flex items-center gap-2">
            <span>⚠️ Missing Votes ({nonVoters.length})</span>
          </h4>
          <p className="text-sm text-neutral-700 mb-4">
            The following participants haven't voted yet. You can manually cast votes for them if there were technical issues.
          </p>

          <div className="space-y-3">
            {nonVoters.map(voter => {
              const voterClan = clans.find(c => c.clan_id === voter.clan_id)
              return (
                <div key={voter.role_id} className="bg-white p-3 rounded-lg border border-neutral-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={voter.avatar_url || '/placeholder-avatar.png'}
                        alt={voter.name}
                        className="w-10 h-10 rounded-full object-cover"
                        style={{ borderColor: voterClan?.color_hex, borderWidth: '2px' }}
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">{voter.name}</div>
                        <div className="text-sm text-neutral-600 flex items-center gap-2">
                          {voter.position}
                          {voterClan && (
                            <>
                              <span>•</span>
                              <span style={{ color: voterClan.color_hex }}>{voterClan.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual vote dropdown */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 whitespace-nowrap">Cast vote for:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleManualVote(voter.role_id, e.target.value)
                          e.target.value = '' // Reset dropdown after selection
                        }
                      }}
                      disabled={loading}
                      className="flex-1 px-3 py-2 border-2 border-neutral-300 rounded-lg focus:border-primary focus:outline-none disabled:opacity-50 bg-white"
                    >
                      <option value="">Select nominee...</option>
                      {candidates.map(candidate => {
                        const candidateClan = clans.find(c => c.clan_id === candidate.clan_id)
                        return (
                          <option key={candidate.role_id} value={candidate.role_id}>
                            {candidate.name} ({candidateClan?.name || 'No clan'})
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Candidates Preview - Show before voting starts */}
      {!votingActive && !votingClosed && session && candidates.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-neutral-300">
          <h4 className="font-semibold text-neutral-900 mb-3">Candidates ({candidates.length}):</h4>
          <div className="grid grid-cols-2 gap-2">
            {candidates.map(candidate => {
              const clan = clans.find(c => c.clan_id === candidate.clan_id)
              return (
                <div key={candidate.role_id} className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-lg p-2">
                  <img
                    src={candidate.avatar_url || '/placeholder-avatar.png'}
                    alt={candidate.name}
                    className="w-10 h-10 rounded-full object-cover border-2"
                    style={{ borderColor: clan?.color_hex || '#8B7355' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-neutral-900 truncate">{candidate.name}</div>
                    <div className="text-xs truncate" style={{ color: clan?.color_hex }}>
                      {clan?.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Runoff Candidates Management - Show after announcement if there are runoff candidates */}
      {announced && runoffCandidates.length > 0 && (
        <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-400 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-xl text-amber-900 font-bold mb-1">
                {runoffConfirmed ? '✓ Second Round Participants Confirmed' : 'Manage Second Round Participants'}
              </h3>
              <p className="text-sm text-amber-800">
                {runoffConfirmed
                  ? `${selectedRunoffCandidates.size} candidates will advance to the next voting round`
                  : 'Select which candidates will advance to the next voting round'}
              </p>
            </div>
            {!runoffConfirmed && (
              <button
                onClick={confirmRunoffCandidates}
                disabled={loading || selectedRunoffCandidates.size === 0}
                className="px-6 py-3 bg-success text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Confirm Second Round Participants
              </button>
            )}
          </div>

          <div className="space-y-3">
            {runoffCandidates.map(candidate => {
              const candidateRole = allRoles.find(r => r.role_id === candidate.role_id)
              const candidateClan = candidateRole ? clans.find(c => c.clan_id === candidateRole.clan_id) : null
              const isSelected = selectedRunoffCandidates.has(candidate.role_id)

              return (
                <div
                  key={candidate.role_id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'bg-white border-success'
                      : 'bg-neutral-100 border-neutral-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRunoffCandidate(candidate.role_id)}
                        disabled={runoffConfirmed}
                        className="w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
                      />

                      {/* Candidate Info */}
                      <div className="flex items-center gap-3">
                        {candidateRole && (
                          <img
                            src={candidateRole.avatar_url || '/placeholder-avatar.png'}
                            alt={candidateRole.name}
                            className="w-12 h-12 rounded-full object-cover border-2"
                            style={{ borderColor: candidateClan?.color_hex || '#8B7355' }}
                          />
                        )}
                        {candidateClan?.emblem_url && (
                          <img
                            src={candidateClan.emblem_url}
                            alt={candidateClan.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900 mb-1">
                          {candidate.name}
                          {isSelected && ' ✓'}
                        </div>
                        <div className="text-sm text-neutral-600 flex items-center gap-2">
                          {candidateRole?.position}
                          {candidateClan && (
                            <>
                              <span>•</span>
                              <span style={{ color: candidateClan.color_hex }}>{candidateClan.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vote Count */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-neutral-900">
                        {candidate.vote_count} votes
                      </div>
                      <div className="text-sm text-neutral-600">
                        {candidate.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!runoffConfirmed && selectedRunoffCandidates.size > 0 && (
            <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-300">
              <div className="text-sm text-amber-900">
                <strong>{selectedRunoffCandidates.size} candidates selected</strong> for the next round. Click "Confirm" to finalize.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
