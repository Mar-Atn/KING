/**
 * useVoting Hook
 *
 * Provides voting functionality for both facilitators and participants.
 * Handles vote session management, vote submission, and results retrieval.
 *
 * Sprint 1: Voting System Implementation
 * Date: October 29, 2025
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type VoteSession = Database['public']['Tables']['vote_sessions']['Row']
type Vote = Database['public']['Tables']['votes']['Row']
type VoteResult = Database['public']['Tables']['vote_results']['Row']

type VoteSessionInsert = Database['public']['Tables']['vote_sessions']['Insert']
type VoteInsert = Database['public']['Tables']['votes']['Insert']

interface UseVotingOptions {
  runId?: string
  phaseId?: string
  roleId?: string // Current user's role
}

interface VoteSessionWithCounts extends VoteSession {
  vote_count?: number
  total_eligible?: number
}

export function useVoting(options: UseVotingOptions = {}) {
  const { runId, phaseId, roleId } = options

  const [sessions, setSessions] = useState<VoteSessionWithCounts[]>([])
  const [currentSession, setCurrentSession] = useState<VoteSessionWithCounts | null>(null)
  const [myVote, setMyVote] = useState<Vote | null>(null)
  const [results, setResults] = useState<VoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // FACILITATOR FUNCTIONS
  // ============================================================================

  /**
   * Create a new vote session
   * Used by facilitator to start a vote
   */
  const createVoteSession = async (sessionData: VoteSessionInsert): Promise<VoteSession | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: createError } = await supabase
        .from('vote_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (createError) throw createError

      // Refresh sessions list
      if (runId) {
        await fetchSessions()
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create vote session'
      setError(message)
      console.error('Error creating vote session:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * End a vote session (close voting)
   * Used by facilitator to stop accepting votes
   */
  const endVoteSession = async (sessionId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('vote_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      if (updateError) throw updateError

      // Refresh sessions
      if (runId) {
        await fetchSessions()
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end vote session'
      setError(message)
      console.error('Error ending vote session:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate and store vote results
   * Used by facilitator after closing a vote
   */
  const calculateResults = async (sessionId: string): Promise<VoteResult | null> => {
    try {
      setLoading(true)
      setError(null)

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('vote_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // Get all votes for this session
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('session_id', sessionId)

      if (votesError) throw votesError

      // Calculate results based on vote_format
      let resultsData: any = {}

      if (session.vote_format === 'choose_person') {
        // Count votes by chosen_role_id
        const voteCounts = new Map<string, number>()
        votes.forEach(vote => {
          if (vote.chosen_role_id) {
            const count = voteCounts.get(vote.chosen_role_id) || 0
            voteCounts.set(vote.chosen_role_id, count + 1)
          }
        })

        // Get role names for candidates
        const roleIds = Array.from(voteCounts.keys())
        const { data: roles, error: rolesError } = await supabase
          .from('roles')
          .select('role_id, name')
          .in('role_id', roleIds)

        if (rolesError) throw rolesError

        const roleMap = new Map(roles.map(r => [r.role_id, r.name]))

        // Build candidates array
        const totalVotes = votes.length
        const allCandidates = Array.from(voteCounts.entries())
          .map(([roleId, voteCount]) => ({
            role_id: roleId,
            name: roleMap.get(roleId) || 'Unknown',
            vote_count: voteCount,
            percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100 * 10) / 10 : 0
          }))
          .sort((a, b) => b.vote_count - a.vote_count)

        const winner = allCandidates[0] || null
        const tie = allCandidates.length > 1 && allCandidates[0].vote_count === allCandidates[1].vote_count

        resultsData = {
          winner,
          all_candidates: allCandidates,
          total_votes: totalVotes,
          tie
        }

      } else if (session.vote_format === 'yes_no') {
        // Count yes/no/abstain
        const counts = { yes: 0, no: 0, abstain: 0 }
        votes.forEach(vote => {
          if (vote.yes_no_choice && vote.yes_no_choice in counts) {
            counts[vote.yes_no_choice as keyof typeof counts]++
          }
        })

        const total = counts.yes + counts.no + counts.abstain

        resultsData = {
          yes: counts.yes,
          no: counts.no,
          abstain: counts.abstain,
          total,
          yes_percentage: total > 0 ? Math.round((counts.yes / total) * 100 * 10) / 10 : 0,
          no_percentage: total > 0 ? Math.round((counts.no / total) * 100 * 10) / 10 : 0,
          abstain_percentage: total > 0 ? Math.round((counts.abstain / total) * 100 * 10) / 10 : 0,
          passed: counts.yes > counts.no
        }
      }

      // Store results
      const { data: result, error: resultError } = await supabase
        .from('vote_results')
        .upsert({
          session_id: sessionId,
          results_data: resultsData,
          calculated_at: new Date().toISOString(),
          animation_shown: true
        })
        .select()
        .single()

      if (resultError) throw resultError

      setResults(result)
      return result

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate results'
      setError(message)
      console.error('Error calculating results:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Vote on behalf of a participant (Admin override for technical issues)
   * AUDIT LOGGED
   */
  const voteOnBehalf = async (
    sessionId: string,
    participantRoleId: string,
    participantClanId: string,
    choice: { chosenRoleId?: string; yesNoChoice?: 'yes' | 'no' | 'abstain' },
    reason: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Submit vote as the participant
      const voteData: VoteInsert = {
        session_id: sessionId,
        voter_role_id: participantRoleId,
        voter_clan_id: participantClanId,
        chosen_role_id: choice.chosenRoleId || null,
        yes_no_choice: choice.yesNoChoice || null
      }

      const { error: insertError } = await supabase
        .from('votes')
        .insert(voteData)

      if (insertError) throw insertError

      // Log admin action in event_log
      await supabase.from('event_log').insert({
        run_id: runId,
        event_type: 'vote_on_behalf',
        event_data: {
          session_id: sessionId,
          participant_role_id: participantRoleId,
          choice,
          reason,
          admin_role_id: roleId
        }
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vote on behalf'
      setError(message)
      console.error('Error voting on behalf:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Override vote results and manually declare winner
   * AUDIT LOGGED
   */
  const overrideWinner = async (
    sessionId: string,
    winnerId: string | null,
    winnerName: string,
    reason: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Get current results
      const { data: currentResult, error: fetchError } = await supabase
        .from('vote_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (fetchError) throw fetchError

      // Update results with override
      const overriddenData = {
        ...(currentResult?.results_data as any || {}),
        override: {
          winner_role_id: winnerId,
          winner_name: winnerName,
          reason,
          overridden_at: new Date().toISOString(),
          overridden_by: roleId
        }
      }

      const { error: updateError } = await supabase
        .from('vote_results')
        .upsert({
          session_id: sessionId,
          results_data: overriddenData,
          calculated_at: currentResult?.calculated_at || new Date().toISOString()
        })

      if (updateError) throw updateError

      // Log admin action
      await supabase.from('event_log').insert({
        run_id: runId,
        event_type: 'override_vote_winner',
        event_data: {
          session_id: sessionId,
          winner_role_id: winnerId,
          winner_name: winnerName,
          reason,
          admin_role_id: roleId
        }
      })

      // Refresh results
      await fetchResults(sessionId)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to override winner'
      setError(message)
      console.error('Error overriding winner:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate vote time limit based on phase duration
   * Formula: phase_duration_minutes - 2, minimum 2 minutes
   */
  const calculateTimeLimit = (phaseDurationMinutes: number | null): number => {
    if (!phaseDurationMinutes) return 10 // Default 10 minutes if no phase duration

    const timeLimit = phaseDurationMinutes - 2
    return Math.max(timeLimit, 2) // Minimum 2 minutes
  }

  /**
   * Announce results to participants
   * Used by facilitator to reveal results
   */
  const announceResults = async (sessionId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Update session status
      const { error: sessionError } = await supabase
        .from('vote_sessions')
        .update({
          status: 'announced',
          announced_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      if (sessionError) throw sessionError

      // Update results announced_at
      const { error: resultError } = await supabase
        .from('vote_results')
        .update({
          announced_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      if (resultError) throw resultError

      // Refresh data
      if (runId) {
        await fetchSessions()
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to announce results'
      setError(message)
      console.error('Error announcing results:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // PARTICIPANT FUNCTIONS
  // ============================================================================

  /**
   * Submit a vote
   * Used by participant to cast their vote
   */
  const submitVote = async (
    sessionId: string,
    voterRoleId: string,
    voterClanId: string,
    choice: { chosenRoleId?: string; yesNoChoice?: 'yes' | 'no' | 'abstain' }
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const voteData: VoteInsert = {
        session_id: sessionId,
        voter_role_id: voterRoleId,
        voter_clan_id: voterClanId,
        chosen_role_id: choice.chosenRoleId || null,
        yes_no_choice: choice.yesNoChoice || null
      }

      const { error: insertError } = await supabase
        .from('votes')
        .insert(voteData)

      if (insertError) throw insertError

      // Refresh my vote
      if (roleId) {
        await fetchMyVote(sessionId)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit vote'
      setError(message)
      console.error('Error submitting vote:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if user has voted in a session
   */
  const hasVoted = (sessionId: string): boolean => {
    return myVote?.session_id === sessionId
  }

  /**
   * Get user's vote for a session
   */
  const fetchMyVote = async (sessionId: string): Promise<Vote | null> => {
    if (!roleId) return null

    try {
      const { data, error: voteError } = await supabase
        .from('votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('voter_role_id', roleId)
        .maybeSingle()

      if (voteError) throw voteError

      setMyVote(data)
      return data
    } catch (err) {
      console.error('Error fetching my vote:', err)
      return null
    }
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all vote sessions for a run
   */
  const fetchSessions = async () => {
    if (!runId) return

    try {
      setLoading(true)

      const query = supabase
        .from('vote_sessions')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: false })

      if (phaseId) {
        query.eq('phase_id', phaseId)
      }

      const { data, error: sessionsError } = await query

      if (sessionsError) throw sessionsError

      // Get vote counts for each session
      const sessionsWithCounts = await Promise.all(
        data.map(async (session) => {
          const { count, error: countError } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.session_id)

          return {
            ...session,
            vote_count: countError ? 0 : (count || 0)
          }
        })
      )

      setSessions(sessionsWithCounts)
    } catch (err) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch a single vote session
   */
  const fetchSession = async (sessionId: string) => {
    try {
      setLoading(true)

      const { data, error: sessionError } = await supabase
        .from('vote_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (sessionError) throw sessionError

      setCurrentSession(data)

      // Fetch results if available
      const { data: resultData, error: resultError } = await supabase
        .from('vote_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (!resultError && resultData) {
        setResults(resultData)
      }

      // Fetch my vote if roleId provided
      if (roleId) {
        await fetchMyVote(sessionId)
      }

    } catch (err) {
      console.error('Error fetching session:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch results for a session
   */
  const fetchResults = async (sessionId: string): Promise<VoteResult | null> => {
    try {
      const { data, error: resultError } = await supabase
        .from('vote_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (resultError) throw resultError

      setResults(data)
      return data
    } catch (err) {
      console.error('Error fetching results:', err)
      return null
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  useEffect(() => {
    if (!runId) return

    fetchSessions()

    // Subscribe to vote session changes
    const sessionChannel = supabase
      .channel(`vote_sessions_${runId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vote_sessions',
          filter: `run_id=eq.${runId}`
        },
        () => {
          console.log('🔔 Vote session changed, refreshing...')
          fetchSessions()
        }
      )
      .subscribe()

    // Subscribe to votes table for real-time vote count updates
    const votesChannel = supabase
      .channel(`votes_${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          console.log('🔔 New vote cast, refreshing sessions...')
          fetchSessions()

          // If this is my vote and I have a roleId, refresh my vote
          if (roleId && payload.new.voter_role_id === roleId) {
            fetchMyVote(payload.new.session_id)
          }
        }
      )
      .subscribe()

    // Subscribe to vote_results table for results announcements
    const resultsChannel = supabase
      .channel(`vote_results_${runId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vote_results'
        },
        (payload) => {
          console.log('🔔 Vote results updated, refreshing...')
          fetchSessions()

          // Update results state if we're viewing this session
          if (currentSession && payload.new.session_id === currentSession.session_id) {
            setResults(payload.new as VoteResult)
          }
        }
      )
      .subscribe()

    return () => {
      sessionChannel.unsubscribe()
      votesChannel.unsubscribe()
      resultsChannel.unsubscribe()
    }
  }, [runId, phaseId, roleId, currentSession])

  return {
    // State
    sessions,
    currentSession,
    myVote,
    results,
    loading,
    error,

    // Facilitator actions
    createVoteSession,
    endVoteSession,
    calculateResults,
    announceResults,
    voteOnBehalf,
    overrideWinner,

    // Participant actions
    submitVote,
    hasVoted,

    // Utilities
    calculateTimeLimit,

    // Data fetching
    fetchSession,
    fetchSessions,
    fetchMyVote,
    fetchResults
  }
}
