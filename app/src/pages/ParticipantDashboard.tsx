/**
 * Participant Dashboard Page
 *
 * Main participant interface after role confirmation:
 * - My Role: Character details, background, traits, interests
 * - My Clan: Clan info, members, other clans overview
 * - Election Process: Sacred tradition phases with voting requirements
 * - Our Glorious City: Kourion context, King's decisions, strategic setting
 * - Induction Advisor: AI conversation placeholder
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getRoleForUser } from '../lib/data/participants'
import { PhaseChangeModal } from '../components/PhaseChangeModal'
import { PhaseTimer } from '../components/PhaseTimer'
import { Ballot } from '../components/voting/Ballot'
import { ResultsDisplay } from '../components/voting/ResultsDisplay'
import { ClanNominationsReveal } from '../components/voting/ClanNominationsReveal'
import { ElectionWinnerReveal } from '../components/voting/ElectionWinnerReveal'
import { useVoting } from '../hooks/useVoting'
import type { Role, Clan, Phase, SimRun, VoteResult } from '../types/database'

type Tab = 'role' | 'clan' | 'process' | 'materials'

export function ParticipantDashboard() {
  const { runId } = useParams<{ runId: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('role')
  const [role, setRole] = useState<Role | null>(null)
  const [clanMembers, setClanMembers] = useState<Role[]>([])
  const [allClans, setAllClans] = useState<Clan[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Phase change modal state
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [newPhaseForModal, setNewPhaseForModal] = useState<Phase | null>(null)
  const [previousPhaseName, setPreviousPhaseName] = useState<string | undefined>()
  const previousPhaseIdRef = useRef<string | null>(null)
  const currentPhaseStartedAtRef = useRef<string | null>(null)

  // Helper to check if role reveal has been seen (uses localStorage with simulation timestamp)
  const getHasSeenRoleReveal = (startedAt: string | null): boolean => {
    if (!user || !runId || !startedAt) {
      console.log('❌ getHasSeenRoleReveal: Missing required data', { user: !!user, runId: !!runId, startedAt: !!startedAt })
      return false
    }
    const key = `hasSeenRoleReveal_${user.id}_${runId}_${startedAt}`
    const value = localStorage.getItem(key)
    console.log('🔍 getHasSeenRoleReveal:', { key, value, result: value === 'true' })
    return value === 'true'
  }

  const setHasSeenRoleReveal = (startedAt: string | null) => {
    if (!user || !runId || !startedAt) return
    const key = `hasSeenRoleReveal_${user.id}_${runId}_${startedAt}`
    localStorage.setItem(key, 'true')
    console.log('✅ setHasSeenRoleReveal:', key)
  }

  // Voting state
  const [showBallot, setShowBallot] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedResultSession, setSelectedResultSession] = useState<any>(null)
  const [myVoteStatus, setMyVoteStatus] = useState<Record<string, boolean>>({}) // session_id -> has voted
  const { sessions, fetchSessions, fetchResults } = useVoting({
    runId: runId || undefined,
    phaseId: simulation?.current_phase_id || undefined,
    roleId: role?.role_id
  })

  // Reveal state
  const [showReveal, setShowReveal] = useState(false)
  const [revealType, setRevealType] = useState<'clan_nomination' | 'election'>('clan_nomination')
  const [reveals, setReveals] = useState<Array<{
    clan: Clan
    nominee: Role
    session: any
    result: VoteResult
  }>>([])
  const [electionReveal, setElectionReveal] = useState<{
    session: any
    result: VoteResult
    winner: Role | null
    clan: Clan | null
    roundNumber: 1 | 2
    thresholdMet: boolean
    topCandidates?: { role: Role; voteCount: number }[]
  } | null>(null)

  // Load all data (run only once on mount)
  useEffect(() => {
    console.log('🔄 [ParticipantDashboard useEffect] Triggered', {
      hasUser: !!user,
      userId: user?.id,
      runId
    })

    // Check if user exists (authLoading is already handled in render)
    if (!user || !runId) {
      console.log('❌ [ParticipantDashboard] Redirecting to login - missing user or runId')
      navigate('/login')
      return
    }

    // Prevent multiple loads
    let mounted = true

    const loadData = async () => {
      if (!mounted) return

      try {
        console.log('⏱️  [ParticipantDashboard] Starting data load...')
        const loadStart = Date.now()

        // Step 1: Get user's role first (needed for clan_id)
        console.log('   📍 Step 1: Fetching role...')
        const roleStart = Date.now()
        const roleData = await getRoleForUser(user.id, runId)
        console.log(`   ✅ Step 1 complete: ${Date.now() - roleStart}ms`)

        if (!roleData) {
          navigate(`/waiting-room/${runId}`)
          return
        }

        setRole(roleData)

        // Step 2: Run ALL remaining queries in PARALLEL (5-10x faster!)
        console.log('   📍 Step 2: Fetching parallel queries...')
        const parallelStart = Date.now()

        // Time each query individually
        const simStart = Date.now()
        const simPromise = supabase
          .from('sim_runs')
          .select('run_id, run_name, version, status, created_at, started_at, completed_at, facilitator_id, current_phase_id, total_participants, human_participants, ai_participants, notes')
          .eq('run_id', runId)
          .single()
          .then(r => { console.log(`      sim_runs: ${Date.now() - simStart}ms`); return r })

        const clansStart = Date.now()
        const clansPromise = supabase
          .from('clans')
          .select('*')
          .eq('run_id', runId)
          .order('sequence_number', { ascending: true })
          .then(r => { console.log(`      clans: ${Date.now() - clansStart}ms`); return r })

        const rolesStart = Date.now()
        const rolesPromise = supabase
          .from('roles')
          .select('role_id, run_id, clan_id, participant_type, assigned_user_id, name, age, position, avatar_url, status, created_at')
          .eq('run_id', runId)
          .then(r => { console.log(`      roles: ${Date.now() - rolesStart}ms`); return r })

        const phasesStart = Date.now()
        const phasesPromise = supabase
          .from('phases')
          .select('*')
          .eq('run_id', runId)
          .order('sequence_number', { ascending: true })
          .then(r => { console.log(`      phases: ${Date.now() - phasesStart}ms`); return r })

        const [simResult, clansResult, allRolesResult, phasesResult] = await Promise.all([
          simPromise,
          clansPromise,
          rolesPromise,
          phasesPromise
        ])

        console.log(`   ✅ Step 2 complete: ${Date.now() - parallelStart}ms`)

        // Check for errors in parallel queries
        if (simResult.error) throw simResult.error
        if (clansResult.error) throw clansResult.error
        if (allRolesResult.error) throw allRolesResult.error
        if (phasesResult.error) throw phasesResult.error

        console.log('   📍 Step 3: Processing data...')
        // Set all state
        setSimulation(simResult.data)
        setAllClans(clansResult.data || [])
        setAllRoles(allRolesResult.data || [])
        setPhases(phasesResult.data || [])

        // Filter clan members from allRoles (no extra query needed)
        const clanMembersFiltered = (allRolesResult.data || [])
          .filter(r => r.clan_id === roleData.clan_id)
          .sort((a, b) => a.name.localeCompare(b.name))
        setClanMembers(clanMembersFiltered)

        // Initialize the phase ref with current phase (for detecting changes later)
        if (simResult.data?.current_phase_id) {
          previousPhaseIdRef.current = simResult.data.current_phase_id
          // Also track current phase's started_at to detect restarts
          const currentPhase = phasesResult.data?.find(p => p.phase_id === simResult.data.current_phase_id)
          if (currentPhase?.started_at) {
            currentPhaseStartedAtRef.current = currentPhase.started_at
          }
        }

        const totalDuration = Date.now() - loadStart
        console.log(`✅ [ParticipantDashboard] TOTAL LOAD TIME: ${totalDuration}ms`)
        console.log(`   - Role query: ${Date.now() - roleStart}ms`)
        console.log(`   - Parallel queries: ${Date.now() - parallelStart}ms`)

        // Check if we need to redirect to role reveal (Phase 1 just started)
        const currentPhaseId = simResult.data?.current_phase_id
        if (currentPhaseId && simResult.data?.started_at) {
          const hasSeenReveal = getHasSeenRoleReveal(simResult.data.started_at)

          // Find the current phase
          const currentPhaseData = phasesResult.data?.find(p => p.phase_id === currentPhaseId)

          console.log('🔍 [Role Reveal Check on Load]', {
            currentPhaseId,
            currentPhaseName: currentPhaseData?.name,
            sequenceNumber: currentPhaseData?.sequence_number,
            startedAt: simResult.data?.started_at,
            hasSeenReveal,
            willRedirect: currentPhaseData?.sequence_number === 0 && !hasSeenReveal
          })

          // If this is Phase 0 (Role Distribution) and user hasn't seen the reveal yet, redirect
          if (currentPhaseData && currentPhaseData.sequence_number === 0 && !hasSeenReveal) {
            console.log('🎭 Phase 0 (Role Distribution) detected on load! Redirecting to role reveal...')
            navigate(`/role-reveal/${runId}`)
            return // Don't set loading to false, we're redirecting
          }
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()

    // Set up real-time subscriptions for instant updates
    const simRunsSubscription = supabase
      .channel(`sim_runs:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sim_runs',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log('Simulation updated:', payload.new)
          const newSimData = payload.new as SimRun

          // Check if phase changed
          const newPhaseId = newSimData.current_phase_id
          const oldPhaseId = previousPhaseIdRef.current

          if (newPhaseId && newPhaseId !== oldPhaseId && oldPhaseId !== null) {
            // Phase changed! Show modal
            console.log('🎉 Phase changed!', { from: oldPhaseId, to: newPhaseId })

            // Find the new phase details
            supabase
              .from('phases')
              .select('*')
              .eq('phase_id', newPhaseId)
              .single()
              .then(({ data: phaseData }) => {
                if (phaseData) {
                  // Check if this is the first phase (Phase 1) and user hasn't seen role reveal
                  const hasSeenReveal = getHasSeenRoleReveal(newSimData.started_at)

                  console.log('🔍 [Role Reveal Check in Subscription]', {
                    newPhaseName: phaseData.name,
                    sequenceNumber: phaseData.sequence_number,
                    startedAt: newSimData.started_at,
                    hasSeenReveal,
                    willRedirect: phaseData.sequence_number === 0 && !hasSeenReveal
                  })

                  if (phaseData.sequence_number === 0 && !hasSeenReveal) {
                    console.log('🎭 Phase 0 (Role Distribution) started! Redirecting to role reveal...')
                    setHasSeenRoleReveal(newSimData.started_at)
                    navigate(`/role-reveal/${runId}`)
                  } else {
                    // For all other phases, show the phase change modal
                    const prevPhase = phases.find(p => p.phase_id === oldPhaseId)
                    setNewPhaseForModal(phaseData)
                    setPreviousPhaseName(prevPhase?.name)
                    setShowPhaseModal(true)
                  }
                }
              })
          }

          // Special case: If this is the FIRST phase ever (no old phase), redirect to role reveal
          if (newPhaseId && oldPhaseId === null) {
            const hasSeenReveal = getHasSeenRoleReveal(newSimData.started_at)

            if (!hasSeenReveal) {
              supabase
                .from('phases')
                .select('*')
                .eq('phase_id', newPhaseId)
                .single()
                .then(({ data: phaseData }) => {
                  if (phaseData && phaseData.sequence_number === 0) {
                    console.log('🎭 Phase 0 detected in subscription (first phase ever)! Redirecting to role reveal...')
                    setHasSeenRoleReveal(newSimData.started_at)
                    navigate(`/role-reveal/${runId}`)
                  }
                })
            }
          }

          // Update the ref to track current phase
          previousPhaseIdRef.current = newPhaseId

          setSimulation(newSimData)
        }
      )
      .subscribe()

    const phasesSubscription = supabase
      .channel(`phases:${runId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phases',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log('Phase updated:', payload)

          // Check if this is the current phase being restarted
          if (payload.eventType === 'UPDATE' && simulation?.current_phase_id) {
            const updatedPhase = payload.new as Phase

            // If the updated phase is the current phase
            if (updatedPhase.phase_id === simulation.current_phase_id) {
              const oldStartedAt = currentPhaseStartedAtRef.current
              const newStartedAt = updatedPhase.started_at

              // If started_at changed, phase was restarted
              if (oldStartedAt && newStartedAt && oldStartedAt !== newStartedAt) {
                console.log('🔄 Current phase restarted!', {
                  phase: updatedPhase.name,
                  oldStartedAt,
                  newStartedAt
                })

                // Show notification modal
                setNewPhaseForModal(updatedPhase)
                setPreviousPhaseName(updatedPhase.name) // Same phase name
                setShowPhaseModal(true)

                // Update ref
                currentPhaseStartedAtRef.current = newStartedAt
              }
            }
          }

          // Reload phases to get fresh data
          supabase
            .from('phases')
            .select('*')
            .eq('run_id', runId)
            .order('sequence_number', { ascending: true })
            .then(({ data }) => {
              if (data) setPhases(data)
            })
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      mounted = false
      simRunsSubscription.unsubscribe()
      phasesSubscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, runId]) // Effect runs when user or runId changes

  // Check if participant has already voted in current sessions
  useEffect(() => {
    if (!role || sessions.length === 0) return

    const checkVoteStatus = async () => {
      const statusMap: Record<string, boolean> = {}

      for (const session of sessions) {
        const { data } = await supabase
          .from('votes')
          .select('vote_id')
          .eq('session_id', session.session_id)
          .eq('voter_role_id', role.role_id)
          .limit(1)

        statusMap[session.session_id] = (data && data.length > 0) || false
      }

      setMyVoteStatus(statusMap)
    }

    checkVoteStatus()
  }, [sessions, role])

  // Detect announced sessions and trigger reveal animation
  useEffect(() => {
    if (!role || sessions.length === 0 || allClans.length === 0 || allRoles.length === 0) {
      console.log('🔍 [Reveal Detection] Skipping - missing data:', {
        hasRole: !!role,
        sessionsCount: sessions.length,
        clansCount: allClans.length,
        rolesCount: allRoles.length
      })
      return
    }

    const fetchAnnouncedResults = async () => {
      console.log('🔍 [Reveal Detection] Checking sessions:', sessions.map(s => ({
        id: s.session_id,
        title: s.proposal_title,
        status: s.status,
        scope: s.scope,
        announced_at: s.announced_at
      })))

      const announcedSessions = sessions.filter(s => {
        const isAnnounced = s.status === 'announced'
        console.log(`  Session ${s.proposal_title}: status=${s.status}, scope=${s.scope}, isAnnounced=${isAnnounced}`)
        return isAnnounced
      })

      if (announcedSessions.length === 0) {
        console.log('❌ [Reveal Detection] No announced sessions found')
        setShowReveal(false)
        return
      }

      console.log('🎉 [Reveal Detection] Detected announced sessions:', announcedSessions.length)

      // Check if we've already shown these reveals
      const seenKey = `revealed_${runId}_${announcedSessions.map(s => s.session_id).join('_')}`
      if (localStorage.getItem(seenKey)) {
        console.log('⏭️ [Reveal Detection] Already shown these reveals, skipping')
        return
      }

      // Detect reveal type: clan nomination (scope=clan_only) or election (scope=all)
      const firstSession = announcedSessions[0]

      if (firstSession.scope === 'all') {
        // Election reveal (Vote 1 or Vote 2)
        console.log('🏛️ [Reveal Detection] Election reveal detected')

        const session = firstSession

        // Get vote result
        const { data: resultData, error } = await supabase
          .from('vote_results')
          .select('*')
          .eq('session_id', session.session_id)
          .single()

        if (error || !resultData) {
          console.error('❌ Error fetching election result:', error)
          return
        }

        console.log('✅ Found election result:', resultData)

        // Parse results_data JSONB
        const resultsData = resultData.results_data as any
        if (!resultsData) {
          console.error('❌ No results_data in vote_results')
          return
        }

        // Determine round number from phase name
        const roundNumber = (session.proposal_title === 'Vote 1' ? 1 : 2) as 1 | 2
        const thresholdMet = resultsData.threshold_met || false

        let winner: Role | null = null
        let winnerClan: Clan | null = null
        let topCandidates: { role: Role; voteCount: number }[] | undefined

        if (thresholdMet && resultsData.winner) {
          // Winner found
          winner = allRoles.find(r => r.role_id === resultsData.winner.role_id) || null
          if (winner) {
            winnerClan = allClans.find(c => c.clan_id === winner.clan_id) || null
          }
        } else {
          // No threshold met - get top candidates for runoff from all_candidates
          const allCandidates = resultsData.all_candidates as Array<{ role_id: string; vote_count: number }>
          const sorted = allCandidates
            .sort((a, b) => b.vote_count - a.vote_count)
            .slice(0, 2)

          topCandidates = sorted.map(candidate => {
            const role = allRoles.find(r => r.role_id === candidate.role_id)!
            return { role, voteCount: candidate.vote_count }
          }).filter(tc => tc.role)
        }

        setElectionReveal({
          session,
          result: resultData,
          winner,
          clan: winnerClan,
          roundNumber,
          thresholdMet,
          topCandidates
        })
        setRevealType('election')
        setShowReveal(true)
        localStorage.setItem(seenKey, 'true')

      } else {
        // Clan nomination reveal (scope=clan_only)
        console.log('🏛️ [Reveal Detection] Clan nomination reveal detected')

        const revealsData = []

        for (const session of announcedSessions) {
          console.log(`  📊 Fetching results for session: ${session.proposal_title}`)

          // Get vote result
          const { data: resultData, error } = await supabase
            .from('vote_results')
            .select('*')
            .eq('session_id', session.session_id)
            .single()

          if (error) {
            console.error(`  ❌ Error fetching result for ${session.proposal_title}:`, error)
            continue
          }

          if (!resultData) {
            console.log(`  ⚠️ No result data for ${session.proposal_title}`)
            continue
          }

          console.log(`  ✅ Found result:`, resultData)

          // Parse results_data JSONB
          const resultsData = resultData.results_data as any
          if (!resultsData || !resultsData.winner) {
            console.log(`  ⚠️ No winner in results_data`)
            continue
          }

          // Find nominee
          const nominee = allRoles.find(r => r.role_id === resultsData.winner.role_id)
          if (!nominee) {
            console.log(`  ⚠️ Nominee not found: ${resultsData.winner.role_id}`)
            continue
          }

          // Find clan
          const clan = allClans.find(c => c.clan_id === session.scope_clan_id)
          if (!clan) {
            console.log(`  ⚠️ Clan not found: ${session.scope_clan_id}`)
            continue
          }

          console.log(`  ✅ Reveal data complete: ${clan.name} → ${nominee.name}`)

          revealsData.push({
            clan,
            nominee,
            session,
            result: resultData
          })
        }

        if (revealsData.length > 0) {
          console.log('🎊 [Reveal Detection] Showing clan nomination reveal with', revealsData.length, 'clans')
          setReveals(revealsData)
          setRevealType('clan_nomination')
          setShowReveal(true)
          localStorage.setItem(seenKey, 'true')
        } else {
          console.log('❌ [Reveal Detection] No complete reveal data found')
        }
      }
    }

    fetchAnnouncedResults()
  }, [sessions, role, allClans, allRoles, runId])

  // Show loading screen while auth is loading (prevents premature redirects)
  if (authLoading) {
    console.log('⏳ [ParticipantDashboard render] Auth is loading, showing spinner...')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neutral-600">Loading authentication...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neutral-600">Loading your dashboard...</div>
      </div>
    )
  }

  if (error || !role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-error mb-4">{error || 'Role not found'}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Find clan data from allClans array (since we no longer JOIN in the query)
  const clanData = allClans.find(c => c.clan_id === role.clan_id)

  // Get current phase if any
  const currentPhase = simulation?.current_phase_id
    ? phases.find(p => p.phase_id === simulation.current_phase_id)
    : null

  // Debug logging
  console.log('🔍 Participant Dashboard - Current Phase Debug:', {
    simulation_current_phase_id: simulation?.current_phase_id,
    phases_count: phases.length,
    currentPhase_found: !!currentPhase,
    currentPhase_name: currentPhase?.name
  })

  // Find open vote for this participant
  console.log('[ParticipantDashboard] Checking for open votes', {
    totalSessions: sessions.length,
    roleClanId: role?.clan_id,
    sessionsData: sessions.map(s => ({
      id: s.session_id,
      title: s.proposal_title,
      status: s.status,
      scope: s.scope,
      scope_clan_id: s.scope_clan_id
    }))
  })

  const openVote = sessions.find(s => {
    console.log('[ParticipantDashboard] Checking session:', {
      title: s.proposal_title,
      status: s.status,
      // @ts-ignore
      started_at: s.started_at,
      scope: s.scope,
      scope_clan_id: s.scope_clan_id,
      my_clan_id: role?.clan_id
    })

    if (s.status !== 'open') {
      console.log('  ❌ Rejected: status is not open')
      return false
    }

    // Check if voting has been started by facilitator
    // @ts-ignore - started_at will exist after manual migration
    if (!s.started_at) {
      console.log('  ❌ Rejected: started_at is null (voting not started by facilitator)')
      return false
    }

    // Check if participant is eligible to vote
    if (s.scope === 'all') {
      console.log('  ✅ Accepted: scope is all')
      return true
    }

    if (s.scope === 'clan_only' && role) {
      const eligible = s.scope_clan_id === role.clan_id
      console.log(`  ${eligible ? '✅' : '❌'} Clan scope: my clan ${role.clan_id} ${eligible ? 'matches' : 'does not match'} ${s.scope_clan_id}`)
      return eligible
    }

    console.log('  ❌ Rejected: scope check failed')
    return false
  })

  console.log('[ParticipantDashboard] Open vote result:', {
    found: !!openVote,
    title: openVote?.proposal_title,
    totalSessions: sessions.length
  })

  // Find announced results for this participant
  const announcedSessions = sessions.filter(s => {
    if (s.status !== 'announced') return false

    // Check if participant was eligible to see these results
    if (s.scope === 'all') return true

    if (s.scope === 'clan_only' && role) {
      return s.scope_clan_id === role.clan_id
    }

    return false
  })

  // Check if simulation hasn't started yet
  const simulationNotStarted = simulation?.status === 'setup' && !currentPhase

  // If simulation hasn't started, show waiting room
  if (simulationNotStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Waiting Room Card */}
          <div className="bg-white rounded-xl shadow-2xl border-4 border-primary p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl text-primary mb-4">
              Waiting Room
            </h1>

            {/* Simulation Name */}
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-600 mb-1">Simulation:</p>
              <p className="font-semibold text-xl text-neutral-900">{simulation?.run_name}</p>
            </div>

            {/* Message */}
            <div className="space-y-4 mb-8">
              <p className="text-lg text-neutral-700">
                You have been registered for this simulation.
              </p>
              <p className="text-neutral-600">
                The facilitator will start the simulation soon. Once the simulation begins,
                you will receive your role and all the information you need to participate.
              </p>
              <p className="text-sm text-neutral-500 italic">
                Please wait for the facilitator to begin Phase 1...
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-3 text-neutral-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
              <span className="text-sm font-medium">Waiting to start</span>
            </div>

            {/* Logout Link */}
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-neutral-600 hover:text-primary text-sm underline"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-white border-b-4 py-6"
        style={{ borderColor: clanData?.color_hex || '#8B7355' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            {role.avatar_url ? (
              <img
                src={role.avatar_url}
                alt={role.name}
                className="w-24 h-24 rounded-full object-cover border-4 shadow-lg"
                style={{ borderColor: clanData?.color_hex || '#8B7355' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg"
                style={{
                  borderColor: clanData?.color_hex || '#8B7355',
                  backgroundColor: `${clanData?.color_hex || '#8B7355'}20`
                }}
              >
                <span className="text-4xl font-heading" style={{ color: clanData?.color_hex }}>
                  {role.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Name & Title */}
            <div className="flex-1">
              <h1 className="font-heading text-3xl text-primary mb-1">
                {role.name}
              </h1>
              {role.position && (
                <p className="text-lg text-neutral-600">{role.position}</p>
              )}
            </div>

            {/* Clan Badge */}
            {clanData && (
              <div className="flex items-center gap-3">
                {clanData.emblem_url && (
                  <img
                    src={clanData.emblem_url}
                    alt={clanData.name}
                    className="w-24 h-24 rounded-full object-cover border-4 shadow-lg"
                    style={{ borderColor: clanData.color_hex || '#8B7355' }}
                  />
                )}
                <div
                  className="text-2xl font-heading font-bold"
                  style={{ color: clanData.color_hex }}
                >
                  {clanData.name}
                </div>
              </div>
            )}
          </div>

          {/* Current Phase Display - Prominent */}
          <div className="mt-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl px-6 py-5 border-2 border-amber-200 shadow-md relative">
              {currentPhase ? (
                <div>
                  {/* Compact Timer - Upper Right */}
                  <div className="absolute top-4 right-4">
                    <PhaseTimer phase={currentPhase} compact={true} />
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-amber-700 uppercase tracking-wider">
                      Current Phase
                    </span>
                  </div>
                  <h2 className="text-4xl font-heading font-bold text-amber-900 mb-2 pr-32">
                    {currentPhase.name}
                  </h2>
                  {currentPhase.description && (
                    <p className="text-lg text-amber-800 leading-relaxed mb-4">
                      {currentPhase.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl font-heading font-semibold text-amber-800">
                    Simulation Not Started
                  </div>
                  <p className="text-amber-700 mt-2">
                    Waiting for facilitator to begin...
                  </p>
                </div>
              )}
            </div>
            <div className="text-center text-sm text-neutral-500 mt-2">
              {simulation?.run_name}
            </div>
          </div>
        </div>
      </div>

      {/* Vote Notification Banner */}
      {openVote && role && (
        <div className="bg-amber-50 border-b-2 border-amber-300">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {myVoteStatus[openVote.session_id] ? (
                    <>
                      <div className="w-2 h-2 bg-amber-700 rounded-full" />
                      <h3 className="font-semibold text-amber-900">
                        Vote Submitted: {openVote.proposal_title}
                      </h3>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                      <h3 className="font-semibold text-amber-900">
                        🗳️ Vote Now: {openVote.proposal_title}
                      </h3>
                    </>
                  )}
                </div>
                {openVote.proposal_description && (
                  <p className="text-sm text-amber-700">
                    {openVote.proposal_description}
                  </p>
                )}
              </div>
              {myVoteStatus[openVote.session_id] ? (
                <div className="px-6 py-3 bg-amber-700 text-white rounded-lg font-semibold shadow-md">
                  Submitted
                </div>
              ) : (
                <button
                  onClick={() => setShowBallot(true)}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold shadow-md"
                >
                  Cast Vote
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Removed "View Results Announced" banner - reveal animation shows automatically */}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('role')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'role'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-primary'
              }`}
            >
              My Role
            </button>
            <button
              onClick={() => setActiveTab('clan')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'clan'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-primary'
              }`}
            >
              My Clan
            </button>
            <button
              onClick={() => setActiveTab('process')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'process'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-primary'
              }`}
            >
              Election Process
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'materials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-primary'
              }`}
            >
              Our Glorious City
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tab: My Role */}
            {activeTab === 'role' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl text-primary">Your Character</h2>

                {role.age && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-2">Age</h3>
                    <p className="text-neutral-700">{role.age}</p>
                  </div>
                )}

                {role.background && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-4">Background</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                      {role.background}
                    </p>
                  </div>
                )}

                {role.character_traits && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-4">Character Traits</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                      {role.character_traits}
                    </p>
                  </div>
                )}

                {role.interests && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-4">
                      Interests & Motivations
                    </h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                      {role.interests}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: My Clan */}
            {activeTab === 'clan' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl text-primary">
                  {clanData?.name || 'Your Clan'}
                </h2>

                {/* Clan About */}
                {clanData?.about && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-4">About Your Clan</h3>
                    <p className="text-neutral-700 leading-relaxed">{clanData.about}</p>
                  </div>
                )}

                {/* Key Priorities */}
                {clanData?.key_priorities && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-4">Key Priorities</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                      {clanData.key_priorities}
                    </p>
                  </div>
                )}

                {/* Emergency Plan */}
                {clanData?.if_things_go_wrong && (
                  <div className="bg-warning bg-opacity-10 border-2 border-warning rounded-lg p-6">
                    <h3 className="font-heading text-lg text-warning mb-4">
                      ⚠️ If Things Go Wrong
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      {clanData.if_things_go_wrong}
                    </p>
                  </div>
                )}

                {/* Clan Members */}
                <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                  <h3 className="font-heading text-lg text-primary mb-4">Your Clan Members</h3>
                  <div className="space-y-2">
                    {clanMembers.map(member => (
                      <div
                        key={member.role_id}
                        className={`p-3 rounded-lg border ${
                          member.role_id === role.role_id
                            ? 'bg-primary bg-opacity-10 border-primary'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-neutral-900">
                              {member.name}
                              {member.role_id === role.role_id && (
                                <span className="ml-2 text-xs text-primary">(You)</span>
                              )}
                            </div>
                            {member.position && (
                              <div className="text-xs text-neutral-500">{member.position}</div>
                            )}
                          </div>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: member.participant_type === 'ai'
                                ? '#9CA3AF'
                                : clanData?.color_hex || '#8B7355'
                            }}
                            title={member.participant_type === 'ai' ? 'AI Character' : 'Human Player'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Clans */}
                {allClans.length > 1 && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h3 className="font-heading text-lg text-primary mb-4">
                      Other Clans in the Simulation
                    </h3>
                    <div className="space-y-3">
                      {allClans
                        .filter(clan => clan.clan_id !== role.clan_id)
                        .map(clan => (
                          <div
                            key={clan.clan_id}
                            className="p-3 rounded-lg border bg-neutral-50 border-neutral-200"
                          >
                            <div className="flex items-center gap-3">
                              {clan.emblem_url && (
                                <img
                                  src={clan.emblem_url}
                                  alt={clan.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div
                                  className="font-heading font-medium"
                                  style={{ color: clan.color_hex || '#8B7355' }}
                                >
                                  {clan.name}
                                </div>
                                {clan.about && (
                                  <div className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                    {clan.about}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Election Process */}
            {activeTab === 'process' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl text-primary">
                  Election of the New King (Sacred Tradition)
                </h2>

                <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                  <p className="text-neutral-600 italic mb-6">
                    According to the ancient traditions of Kourion, the election of a new King follows a sacred process
                    that ensures wisdom, fairness, and the will of the noble clans.
                  </p>

                  <div className="space-y-3">
                    {phases.slice(1, 13).map((phase, idx) => {
                      const phaseNumber = idx + 1
                      const phaseName = phase.name.toLowerCase()

                      // Calculate voting requirements
                      let votingReq = ''
                      if (phaseName.includes('vote')) {
                        let voteNumber: 1 | 2 = 1

                        if (phaseName.includes('vote 1') || phaseName.includes('first')) {
                          voteNumber = 1
                        } else if (phaseName.includes('vote 2') || phaseName.includes('second')) {
                          voteNumber = 2
                        } else {
                          const votesBeforeThisOne = phases.slice(1, idx + 1).filter(p =>
                            p.name.toLowerCase().includes('vote') && p.sequence_number < phase.sequence_number
                          ).length
                          voteNumber = votesBeforeThisOne === 0 ? 1 : 2
                        }

                        const totalVotes = simulation?.total_participants || 0
                        const defaultThreshold = Math.ceil(totalVotes * 2 / 3)
                        const votesNeeded = voteNumber === 1
                          ? (simulation?.vote_1_threshold || defaultThreshold)
                          : (simulation?.vote_2_threshold || defaultThreshold)

                        votingReq = ` — ${votesNeeded} votes out of ${totalVotes} needed`
                      }

                      const duration = phase.default_duration_minutes
                        ? ` (${phase.default_duration_minutes} minutes)`
                        : ''

                      return (
                        <div
                          key={phase.phase_id}
                          className="p-4 rounded-lg bg-neutral-50 border-l-4 border-primary"
                        >
                          <h3 className="font-heading font-medium text-neutral-900 mb-1">
                            Phase {phaseNumber}: {phase.name}{duration}{votingReq}
                          </h3>
                          {phase.description && (
                            <p className="text-sm text-neutral-600">{phase.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <p className="text-neutral-600 italic mt-6">
                    Through this time-honored process, the noble citizens of Kourion shall choose their new sovereign.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Our Glorious City */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl text-primary">Our Glorious City of Kourion</h2>

                <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                  {/* Main Context */}
                  <div className="bg-primary bg-opacity-5 border-l-4 border-primary p-4 mb-6">
                    <h3 className="font-heading text-xl text-primary mb-3">Kourion Needs a New KING!</h3>
                    <div className="space-y-3 text-neutral-700 leading-relaxed">
                      <p>
                        Ancient Cyprus, 5th-4th century BCE. Cyprus is a strategic island crossroads of Greek, Phoenician, and Persian civilizations.
                        Three city-kingdoms (Kourion, Kition, Salamis) are on the brink of conflict. External threats loom from Egyptian, Persian,
                        and Assyrian powers, as well as pirates getting out of control.
                      </p>
                      <p>
                        The mighty city-kingdom of Kourion has lost its King without a heir. You are the noble citizens of Kourion, representing
                        the most noble families belonging to one of the major clans. You gather here today to elect a new supreme ruler, following
                        the ancient sacred tradition.
                      </p>
                      <p>
                        The Kingdom shall not remain without a King. If the King is not elected today - turmoil and unrest might start among
                        ordinary citizens, who can not imagine life without a legitimate King, and enemies will not hesitate to use their chance
                        and take control of our glorious city.
                      </p>
                    </div>
                  </div>

                  {/* King's Main Decisions */}
                  <div className="mb-6">
                    <h3 className="font-heading text-lg text-primary mb-3">King's Main Decisions</h3>
                    <p className="text-neutral-700 mb-3">
                      Once elected the new King will have lifelong powers as supreme ruler of our glorious city. His first order is expected
                      to have these decisions:
                    </p>
                    <ol className="space-y-2 text-neutral-700 list-decimal list-inside">
                      <li>
                        <strong>Taxes (next year):</strong> the King must decide on taxes for Agriculture, Trade, Banking and Craft, setting
                        each lower, higher or keeping as is.
                      </li>
                      <li>
                        <strong>Budget (next year):</strong> the King will set Priority #1, Priority #2 and Priority #3, each one selected
                        out of 6 priorities: defense, culture, agriculture, banking, trade, craft
                      </li>
                      <li>
                        <strong>Appointments:</strong> The King will appoint his <em>Economic Advisor</em> and <em>Senior Judge</em>
                      </li>
                      <li>
                        <strong>International Affairs:</strong> The King can declare New Alliances (with Salamis or Kition) or declare War
                        (Salamis, Kition, Egypt, Assyria, Pirates)
                      </li>
                      <li>
                        <strong>Other King's decisions:</strong> as the supreme ruler the King can reward, appoint, arrest, send to exile...
                      </li>
                    </ol>
                  </div>

                  {/* General Interests */}
                  <div className="mb-6">
                    <h3 className="font-heading text-lg text-primary mb-3">General Interests</h3>
                    <p className="text-neutral-700">
                      For every noble citizen, becoming the King is the highest honour. Becoming one of the two senior King's Advisors is also
                      a great privilege. Each clan's strongest interest is to promote its candidate to become the new King or, at minimum, one
                      of the two senior King's Advisors. If another clan's representative becomes the King, each clan wants its legitimate clan
                      interests reflected in the King's agenda. There is a high risk for any clan if it falls out of favour with the new King.
                      Once new King is elected each Clan has to take the oath of allegiance to the new King, and also can make final decisions
                      or statements
                    </p>
                  </div>

                  {/* Strategic Setting */}
                  <div className="mb-6">
                    <h3 className="font-heading text-lg text-primary mb-3">Strategic Setting</h3>
                    <ul className="space-y-2 text-neutral-700 list-disc list-inside">
                      <li>
                        <strong>Key Rivals in Cyprus:</strong> Kition (Phoenician-influenced, trade and wealth oriented, culturally different)
                        and Salamis (strong military, close cultural kinship)
                      </li>
                      <li>
                        <strong>Economic Foundations:</strong> Maritime trade; Grain, wine, olive oil production; Strategic Harbors critical
                        for naval defense and commerce.
                      </li>
                    </ul>
                  </div>

                  {/* Clans Overview */}
                  <div>
                    <h3 className="font-heading text-lg text-primary mb-3">The Noble Clans of Kourion</h3>
                    <p className="text-neutral-700 mb-4">
                      <strong>There are {allClans.length} clans in Kourion:</strong>
                    </p>
                    <div className="space-y-2">
                      {allClans.map((clan) => {
                        const clanSize = allRoles.filter(r => r.clan_id === clan.clan_id).length
                        return (
                          <div
                            key={clan.clan_id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                              clan.clan_id === role.clan_id
                                ? 'border-primary bg-primary bg-opacity-5'
                                : 'border-neutral-200 bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {clan.emblem_url && (
                                <img
                                  src={clan.emblem_url}
                                  alt={clan.name}
                                  className="w-12 h-12 rounded-full object-cover border-2"
                                  style={{ borderColor: clan.color_hex || '#8B7355' }}
                                />
                              )}
                              <span className="font-heading font-medium" style={{ color: clan.color_hex || '#8B7355' }}>
                                {clan.name}
                              </span>
                              {clan.clan_id === role.clan_id && (
                                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                  Your Clan
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-neutral-600">
                              {clanSize} {clanSize === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Induction Advisor */}
            <div
              className="bg-white rounded-lg border-2 p-6 text-center"
              style={{ borderColor: clanData?.color_hex || '#8B7355' }}
            >
              <div
                className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${clanData?.color_hex || '#8B7355'}20`
                }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: clanData?.color_hex || '#8B7355' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-lg text-primary mb-2">
                Induction Advisor
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Chat with your AI advisor to prepare for the simulation
              </p>
              <button
                onClick={() => {
                  alert('AI Induction Advisor coming soon! This will help you understand your role and prepare for the simulation.')
                }}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
              >
                Start Conversation
              </button>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
              <h3 className="font-heading text-sm text-primary mb-3 uppercase tracking-wide">
                Quick Access
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('role')}
                  className="w-full text-left px-3 py-2 rounded hover:bg-neutral-50 text-sm text-neutral-700"
                >
                  My Role
                </button>
                <button
                  onClick={() => setActiveTab('clan')}
                  className="w-full text-left px-3 py-2 rounded hover:bg-neutral-50 text-sm text-neutral-700"
                >
                  My Clan
                </button>
                <button
                  onClick={() => setActiveTab('process')}
                  className="w-full text-left px-3 py-2 rounded hover:bg-neutral-50 text-sm text-neutral-700"
                >
                  Process
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className="w-full text-left px-3 py-2 rounded hover:bg-neutral-50 text-sm text-neutral-700"
                >
                  Print Materials
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Change Modal */}
      <PhaseChangeModal
        isOpen={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
        newPhase={newPhaseForModal}
        previousPhaseName={previousPhaseName}
      />

      {/* Ballot Modal */}
      {showBallot && openVote && role && (
        <Ballot
          session={openVote}
          myRoleId={role.role_id}
          myClanId={role.clan_id}
          allRoles={allRoles}
          onVoteSubmitted={async () => {
            // Mark as voted immediately
            setMyVoteStatus(prev => ({ ...prev, [openVote.session_id]: true }))
            // Refresh vote sessions to update status
            await fetchSessions()
            setShowBallot(false)
          }}
          onClose={() => setShowBallot(false)}
        />
      )}

      {/* Results Display Modal */}
      {showResults && selectedResultSession && (
        <ResultsDisplay
          session={selectedResultSession}
          result={selectedResultSession.results}
          allRoles={allRoles}
          onClose={() => {
            setShowResults(false)
            setSelectedResultSession(null)
          }}
        />
      )}

      {/* Clan Nominations Reveal Animation */}
      {showReveal && revealType === 'clan_nomination' && reveals.length > 0 && (
        <ClanNominationsReveal
          reveals={reveals}
          onComplete={() => {
            setShowReveal(false)
            setReveals([])
          }}
        />
      )}

      {/* Election Winner Reveal Animation */}
      {showReveal && revealType === 'election' && electionReveal && (
        <ElectionWinnerReveal
          revealData={electionReveal}
          onComplete={() => {
            setShowReveal(false)
            setElectionReveal(null)
          }}
        />
      )}
    </div>
  )
}
