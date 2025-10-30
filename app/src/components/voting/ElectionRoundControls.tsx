import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { VoteSession, Role } from '../../types/database'

interface ElectionRoundControlsProps {
  runId: string
  phaseId: string
  phaseName: string
  roundNumber: 1 | 2
  threshold: number
  candidates: Role[]
}

export function ElectionRoundControls({
  runId,
  phaseId,
  phaseName,
  roundNumber,
  threshold,
  candidates
}: ElectionRoundControlsProps) {
  const [session, setSession] = useState<VoteSession | null>(null)
  const [votingActive, setVotingActive] = useState(false)
  const [votingClosed, setVotingClosed] = useState(false)
  const [announced, setAnnounced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Load session
  useEffect(() => {
    loadSession()
  }, [phaseId])

  // Update voting stats every 2 seconds
  useEffect(() => {
    if (votingActive && session) {
      const interval = setInterval(() => {
        updateVoteCount()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [votingActive, session])

  // Timer countdown
  useEffect(() => {
    if (!votingActive || !session?.started_at) return

    const updateTimer = () => {
      const startTime = new Date(session.started_at!).getTime()
      const durationMs = (session.duration_minutes || 10) * 60 * 1000
      const endTime = startTime + durationMs
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)

      setTimeRemaining(Math.ceil(remaining / 1000))

      if (remaining === 0) {
        // Auto-stop voting when time runs out
        handleStopVoting()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [votingActive, session?.started_at, session?.duration_minutes])

  async function loadSession() {
    const { data, error } = await supabase
      .from('vote_sessions')
      .select('*')
      .eq('run_id', runId)
      .eq('phase_id', phaseId)
      .eq('scope', 'all')
      .maybeSingle()

    if (error) {
      console.error('Error loading session:', error)
      return
    }

    if (data) {
      setSession(data)
      setVotingActive(!!data.started_at && data.status === 'open')
      setVotingClosed(data.status === 'closed' || data.status === 'announced')
      setAnnounced(data.status === 'announced')

      if (data.started_at) {
        updateVoteCount(data.session_id)
      }
    }
  }

  async function updateVoteCount(sessionId?: string) {
    const id = sessionId || session?.session_id
    if (!id) return

    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id)

    if (!error && count !== null) {
      setVoteCount(count)
    }
  }

  async function handleCreateSession() {
    if (candidates.length === 0) {
      alert('No candidates available. Complete previous voting phase first.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('vote_sessions')
      .insert({
        run_id: runId,
        phase_id: phaseId,
        proposal_title: phaseName,
        vote_type: 'choose_person',
        scope: 'all',
        scope_clan_id: null,
        duration_minutes: 10,
        candidate_role_ids: candidates.map(c => c.role_id),
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error('Error creating session:', error)
      alert('Failed to create voting session')
      return
    }

    setSession(data)
  }

  async function handleStartVoting() {
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
  }

  async function handleStopVoting() {
    if (!session) return
    setLoading(true)

    const { error } = await supabase
      .from('vote_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('session_id', session.session_id)

    setLoading(false)

    if (error) {
      console.error('Error stopping voting:', error)
      alert('Failed to stop voting')
      return
    }

    setVotingActive(false)
    setVotingClosed(true)
  }

  async function handleReveal() {
    if (!session) return
    setLoading(true)

    // 1. Get all votes
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

    // 2. Calculate results
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
      all_candidates: allCandidates,
      total_votes: totalVotes,
      tie: false,
      threshold_met: thresholdMet,
      threshold_required: threshold
    }

    // 3. Insert result
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

    // 4. Update session status
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

    setAnnounced(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-600 rounded-xl p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-2xl font-heading font-bold text-amber-900 mb-2">
          {phaseName} - Election Round {roundNumber}
        </h3>
        <div className="text-amber-700">
          <p className="mb-1">Candidates: {candidates.length}</p>
          <p className="mb-1">Threshold to win: {threshold} votes</p>
          {votingActive && (
            <p className="text-lg font-semibold text-amber-900">
              Votes cast: {voteCount}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {!session && (
          <button
            onClick={handleCreateSession}
            disabled={loading || candidates.length === 0}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Voting Session'}
          </button>
        )}

        {session && !votingActive && !votingClosed && (
          <button
            onClick={handleStartVoting}
            disabled={loading}
            className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Starting...' : '▶ Start Voting'}
          </button>
        )}

        {votingActive && timeRemaining !== null && (
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-amber-700 text-white rounded-lg font-bold text-xl">
              ⏳ {formatTime(timeRemaining)}
            </div>
            <button
              onClick={handleStopVoting}
              disabled={loading}
              className="px-6 py-3 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50"
            >
              {loading ? 'Stopping...' : '⏸ Stop Voting'}
            </button>
          </div>
        )}

        {votingClosed && !announced && (
          <button
            onClick={handleReveal}
            disabled={loading}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Revealing...' : '🎊 Reveal Results'}
          </button>
        )}

        {announced && (
          <div className="px-6 py-3 bg-amber-700 text-white rounded-lg font-semibold">
            ✓ Results Announced to Participants
          </div>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-amber-300">
          <h4 className="font-semibold text-amber-900 mb-2">Candidates:</h4>
          <div className="grid grid-cols-2 gap-2">
            {candidates.map(candidate => (
              <div key={candidate.role_id} className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg p-2">
                <img
                  src={candidate.avatar_url || '/placeholder-avatar.png'}
                  alt={candidate.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-sm text-amber-900">{candidate.name}</div>
                  <div className="text-xs text-amber-700">{candidate.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
