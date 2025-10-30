import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePhaseStore } from '../stores/phaseStore'
import { usePhaseSync } from '../hooks/usePhaseSync'
import { PhaseControls } from '../components/PhaseControls'
import { VotingControls } from '../components/voting/VotingControls'
import { ClanNominationsControls } from '../components/voting/ClanNominationsControls'
import { ElectionRoundControls } from '../components/voting/ElectionRoundControls'
import { ClanAllegianceControls } from '../components/voting/ClanAllegianceControls'
import { KingDecisionReview } from '../components/decisions/KingDecisionReview'
import type { SimRun, Clan, Role } from '../types/database'

export function FacilitatorSimulation() {
  const { runId } = useParams<{ runId: string }>()
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [clans, setClans] = useState<Clan[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [electionCandidates, setElectionCandidates] = useState<Role[]>([])
  const [kingRole, setKingRole] = useState<Role | null>(null)

  const { loadPhases, allPhases, currentPhase } = usePhaseStore()
  const { connectionStatus } = usePhaseSync(runId || null)

  // Cancel registration - clear all role assignments
  const handleCancelRegistration = async () => {
    if (!runId) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel the registration? This will remove all participant assignments.'
    )

    if (!confirmed) return

    try {
      // Clear all assigned_user_id for this simulation's roles
      const { error } = await supabase
        .from('roles')
        .update({ assigned_user_id: null })
        .eq('run_id', runId)

      if (error) throw error

      // Reload simulation data to reflect changes
      await loadSimulation()
    } catch (err: any) {
      console.error('Error canceling registration:', err)
      setError(err.message || 'Failed to cancel registration')
    }
  }

  // Restart current phase - reset phase voting and timer
  const handleRestartPhase = async () => {
    if (!runId || !currentPhase) return

    const confirmed = window.confirm(
      '⚠️ Restart Current Phase?\n\n' +
      'This will:\n' +
      '• Delete all votes for this phase\n' +
      '• Delete all voting sessions\n' +
      '• Delete King\'s Decisions (if any)\n' +
      '• Reset the phase timer\n' +
      '• Reset the phase to fresh state\n\n' +
      'Continue?'
    )

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Restarting current phase...')

      // Get all vote sessions for this phase
      const { data: phaseSessions } = await supabase
        .from('vote_sessions')
        .select('session_id')
        .eq('phase_id', currentPhase.phase_id)

      if (phaseSessions && phaseSessions.length > 0) {
        // Delete all votes for sessions in this phase
        for (const session of phaseSessions) {
          await supabase
            .from('votes')
            .delete()
            .eq('session_id', session.session_id)

          await supabase
            .from('vote_results')
            .delete()
            .eq('session_id', session.session_id)
        }

        // Delete all vote sessions for this phase
        await supabase
          .from('vote_sessions')
          .delete()
          .eq('phase_id', currentPhase.phase_id)
      }

      // Delete King's Decisions for this run
      await supabase
        .from('king_decisions')
        .delete()
        .eq('run_id', runId)

      // Reset the phase timer and status
      const newStartedAt = new Date().toISOString()
      console.log('📝 Updating phase started_at to:', newStartedAt)

      const { error: updateError } = await supabase
        .from('phases')
        .update({
          started_at: newStartedAt,
          ended_at: null,
          status: 'active'
        })
        .eq('phase_id', currentPhase.phase_id)

      if (updateError) {
        console.error('❌ Failed to update phase:', updateError)
        throw updateError
      }

      console.log('✅ Phase reset complete - started_at updated to NOW')
      alert('Phase has been reset successfully!')

      // Reload the page to refresh all data
      window.location.reload()

    } catch (err: any) {
      console.error('Error restarting phase:', err)
      setError(err.message || 'Failed to restart phase')
    } finally {
      setLoading(false)
    }
  }

  // Re-Start simulation - reset to beginning and clean all data
  const handleRestartSimulation = async () => {
    if (!runId) return

    const confirmed = window.confirm(
      '⚠️ WARNING: This will RESET the entire simulation to the beginning!\n\n' +
      'This will:\n' +
      '• Delete ALL votes and voting sessions\n' +
      '• Delete ALL meeting records\n' +
      '• Delete ALL event logs\n' +
      '• Reset ALL phases to "pending" status\n' +
      '• Clear current phase\n\n' +
      'Participant role assignments will be preserved.\n\n' +
      'This action cannot be undone. Continue?'
    )

    if (!confirmed) return

    // Double confirmation for safety
    const doubleConfirmed = window.confirm(
      '⚠️ FINAL CONFIRMATION\n\n' +
      'Are you absolutely sure you want to restart this simulation?\n\n' +
      'Click OK to proceed with the reset.'
    )

    if (!doubleConfirmed) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Starting simulation restart...')

      // First, get all vote session IDs for this run
      const { data: voteSessions } = await supabase
        .from('vote_sessions')
        .select('session_id')
        .eq('run_id', runId)

      const sessionIds = voteSessions?.map(s => s.session_id) || []

      // Get all meeting IDs for this run
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('meeting_id')
        .eq('run_id', runId)

      const meetingIds = meetingData?.map(m => m.meeting_id) || []

      // 1. Delete all votes (if any sessions exist)
      if (sessionIds.length > 0) {
        const { error: votesError } = await supabase
          .from('votes')
          .delete()
          .in('session_id', sessionIds)

        if (votesError) {
          console.warn('Error deleting votes:', votesError)
        }
      }

      // 2. Delete all vote results (if any sessions exist)
      if (sessionIds.length > 0) {
        const { error: resultsError } = await supabase
          .from('vote_results')
          .delete()
          .in('session_id', sessionIds)

        if (resultsError) {
          console.warn('Error deleting vote results:', resultsError)
        }
      }

      // 3. Delete all vote sessions
      const { error: sessionsError } = await supabase
        .from('vote_sessions')
        .delete()
        .eq('run_id', runId)

      if (sessionsError) throw sessionsError

      // 4. Delete all meeting invitations (if any meetings exist)
      if (meetingIds.length > 0) {
        const { error: invitesError } = await supabase
          .from('meeting_invitations')
          .delete()
          .in('meeting_id', meetingIds)

        if (invitesError) {
          console.warn('Error deleting meeting invitations:', invitesError)
        }
      }

      // 5. Delete all meetings
      const { error: meetingsError } = await supabase
        .from('meetings')
        .delete()
        .eq('run_id', runId)

      if (meetingsError) {
        console.warn('Error deleting meetings:', meetingsError)
      }

      // 6. Delete all event logs
      const { error: eventsError } = await supabase
        .from('event_log')
        .delete()
        .eq('run_id', runId)

      if (eventsError) {
        console.warn('Error deleting event logs:', eventsError)
      }

      // 7. Reset all phases to pending
      const { error: phasesError } = await supabase
        .from('phases')
        .update({
          status: 'pending',
          started_at: null,
          ended_at: null
        })
        .eq('run_id', runId)

      if (phasesError) throw phasesError

      // 8. Reset simulation status
      const { error: simError } = await supabase
        .from('sim_runs')
        .update({
          status: 'setup',
          current_phase_id: null,
          started_at: null,
          completed_at: null
        })
        .eq('run_id', runId)

      if (simError) throw simError

      console.log('✅ Simulation restart complete')

      // Reload all data
      await loadSimulation()

      alert('✅ Simulation has been reset to the beginning!\n\nYou can now start from Phase 1.')

    } catch (err: any) {
      console.error('Error restarting simulation:', err)
      setError(err.message || 'Failed to restart simulation')
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch election candidates for Vote 1 or Vote 2
  const fetchElectionCandidates = async (phaseName: string) => {
    if (!runId) return []

    try {
      if (phaseName === 'Vote 1') {
        // Get nominees from clan nominations phase
        // Find the "Clans nominate candidates (decision)" phase
        const nominationPhase = allPhases.find(p => {
          const name = p.name.toLowerCase()
          return name.includes('nominate') && name.includes('decision')
        })

        if (!nominationPhase) {
          console.error('No nomination decision phase found. Available phases:', allPhases.map(p => p.name))
          return []
        }

        console.log('✓ Found nomination phase:', nominationPhase.name, nominationPhase.phase_id)

        // Get all vote sessions from nomination phase
        const { data: sessions } = await supabase
          .from('vote_sessions')
          .select('session_id')
          .eq('phase_id', nominationPhase.phase_id)
          .eq('status', 'announced')

        if (!sessions || sessions.length === 0) {
          console.error('No announced nomination sessions found')
          return []
        }

        // Get results from all sessions
        const { data: results } = await supabase
          .from('vote_results')
          .select('results_data')
          .in('session_id', sessions.map(s => s.session_id))

        if (!results || results.length === 0) {
          console.error('No winners found from clan nominations')
          return []
        }

        // Extract winner role_ids from results_data JSONB
        const winnerRoleIds = results
          .map(r => r.results_data?.winner?.role_id)
          .filter(Boolean) as string[]

        if (winnerRoleIds.length === 0) {
          console.error('No valid winners in results_data')
          return []
        }

        // Get role details for all winners
        const { data: nominees } = await supabase
          .from('roles')
          .select('*')
          .in('role_id', winnerRoleIds)

        return nominees || []

      } else if (phaseName === 'Vote 2') {
        // Get top candidates from Vote 1
        // Find Vote 1 phase
        const vote1Phase = allPhases.find(p => p.name === 'Vote 1')

        if (!vote1Phase) {
          console.error('No Vote 1 phase found')
          return []
        }

        // Get Vote 1 session
        const { data: session } = await supabase
          .from('vote_sessions')
          .select('session_id')
          .eq('phase_id', vote1Phase.phase_id)
          .eq('status', 'announced')
          .maybeSingle()

        if (!session) {
          console.error('No announced Vote 1 session found')
          return []
        }

        // Get result
        const { data: result } = await supabase
          .from('vote_results')
          .select('results_data')
          .eq('session_id', session.session_id)
          .single()

        if (!result || !result.results_data) {
          console.error('No Vote 1 result found')
          return []
        }

        let topCandidateIds: string[] = []

        if (result.results_data.threshold_met && result.results_data.winner) {
          // Winner found in Vote 1 - shouldn't happen, but handle it
          topCandidateIds = [result.results_data.winner.role_id]
        } else {
          // Get top 2 candidates from all_candidates array
          const allCandidates = result.results_data.all_candidates || []
          const sorted = allCandidates
            .sort((a: any, b: any) => b.vote_count - a.vote_count)
            .slice(0, 2)
            .map((c: any) => c.role_id)

          topCandidateIds = sorted
        }

        // Get role details
        const { data: topCandidates } = await supabase
          .from('roles')
          .select('*')
          .in('role_id', topCandidateIds)

        return topCandidates || []
      }

      return []
    } catch (err) {
      console.error('Error fetching election candidates:', err)
      return []
    }
  }

  // Load simulation data
  const loadSimulation = async () => {
    if (!runId) return

    setLoading(true)
    setError(null)

    try {
      console.log('⏱️  [FacilitatorSimulation] Starting load...')
      const loadStart = Date.now()

      // ✅ Execute all 3 queries in PARALLEL using Promise.all
      console.log('   📍 Step 1: Fetching parallel queries...')
      const parallelStart = Date.now()

      // Track individual query times
      const simStart = Date.now()
      const simPromise = supabase
        .from('sim_runs')
        .select('run_id, run_name, version, status, created_at, started_at, completed_at, facilitator_id, current_phase_id, total_participants, human_participants, ai_participants, notes, learning_objectives, vote_1_threshold, vote_2_threshold')
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

      const [simResult, clansResult, rolesResult] = await Promise.all([
        simPromise,
        clansPromise,
        rolesPromise
      ])

      console.log(`   ✅ Step 1 complete: ${Date.now() - parallelStart}ms`)

      // Check for errors
      if (simResult.error) throw simResult.error
      if (clansResult.error) throw clansResult.error
      if (rolesResult.error) throw rolesResult.error

      // Set data immediately
      setSimulation(simResult.data)
      setClans(clansResult.data || [])
      setRoles(rolesResult.data || [])

      // Query 4: Load phases (can run after we have the data)
      // This loads phases AND subscribes to real-time updates
      console.log('   📍 Step 2: Loading phases...')
      const phasesStart = Date.now()
      await loadPhases(runId)
      console.log(`   ✅ Step 2 complete: ${Date.now() - phasesStart}ms`)

      const totalDuration = Date.now() - loadStart
      console.log(`✅ [FacilitatorSimulation] TOTAL LOAD TIME: ${totalDuration}ms`)

      setLoading(false)
    } catch (err: any) {
      console.error('Error loading simulation:', err)
      setError(err.message || 'Failed to load simulation')
      setLoading(false)
    }
  }

  // ✅ OPTIMIZED: Load simulation data with PARALLEL QUERIES
  useEffect(() => {
    loadSimulation()
  }, [runId, loadPhases])

  // Fetch election candidates when phase is Vote 1 or Vote 2
  useEffect(() => {
    if (!currentPhase || !allPhases.length) return

    const phaseName = currentPhase.name

    if (phaseName === 'Vote 1' || phaseName === 'Vote 2') {
      fetchElectionCandidates(phaseName).then(candidates => {
        setElectionCandidates(candidates)
      })
    } else {
      setElectionCandidates([])
    }
  }, [currentPhase, allPhases])

  // Detect elected King from Vote 2 results
  useEffect(() => {
    if (!runId || !allPhases.length || !roles.length) return

    const detectKing = async () => {
      try {
        // Find Vote 2 phase
        const vote2Phase = allPhases.find(p => p.name === 'Vote 2')
        if (!vote2Phase) {
          setKingRole(null)
          return
        }

        // Get Vote 2 session
        const { data: session } = await supabase
          .from('vote_sessions')
          .select('session_id')
          .eq('phase_id', vote2Phase.phase_id)
          .eq('status', 'announced')
          .maybeSingle()

        if (!session) {
          setKingRole(null)
          return
        }

        // Get Vote 2 result
        const { data: result } = await supabase
          .from('vote_results')
          .select('results_data')
          .eq('session_id', session.session_id)
          .single()

        if (!result || !result.results_data) {
          setKingRole(null)
          return
        }

        // Check if King was elected (threshold met)
        const resultsData = result.results_data as any
        if (resultsData.threshold_met && resultsData.winner) {
          const kingRoleId = resultsData.winner.role_id
          const king = roles.find(r => r.role_id === kingRoleId)
          setKingRole(king || null)
          console.log('👑 King detected:', king?.name)
        } else {
          setKingRole(null)
        }
      } catch (err) {
        console.error('Error detecting King:', err)
        setKingRole(null)
      }
    }

    detectKing()
  }, [runId, allPhases, roles])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-neutral-600">Loading simulation...</div>
        </div>
      </div>
    )
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-error mb-4">
            {error || 'Simulation not found'}
          </div>
          <Link
            to="/dashboard"
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const humanRoles = roles.filter((r) => r.participant_type === 'human')
  const aiRoles = roles.filter((r) => r.participant_type === 'ai')
  const assignedHumanRoles = humanRoles.filter((r) => r.assigned_user_id !== null)
  const allHumanRolesAssigned = humanRoles.length > 0 && assignedHumanRoles.length === humanRoles.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b-2 border-neutral-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Link
                to="/dashboard"
                className="text-sm text-primary hover:underline mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="font-heading text-3xl text-primary">
                {simulation.run_name}
              </h1>
              <p className="text-neutral-600">
                Version: {simulation.version} • Language: {simulation.language}
              </p>
            </div>

            <div className="text-right">
              <div
                className={`inline-block px-4 py-2 rounded-lg font-medium ${
                  simulation.status === 'in_progress'
                    ? 'bg-success bg-opacity-10 text-success'
                    : simulation.status === 'completed'
                    ? 'bg-neutral-400 bg-opacity-10 text-neutral-600'
                    : simulation.status === 'setup'
                    ? 'bg-warning bg-opacity-10 text-warning'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {simulation.status.toUpperCase()}
              </div>
              <div className="text-sm text-neutral-500 mt-2">
                Connection:{' '}
                <span
                  className={`font-medium ${
                    connectionStatus === 'connected'
                      ? 'text-success'
                      : connectionStatus === 'connecting'
                      ? 'text-warning'
                      : 'text-error'
                  }`}
                >
                  {connectionStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Phase Controls */}
          <div className="lg:col-span-2">
            {/* Registration Status Banner - Show when no active phase */}
            {!currentPhase && allPhases.length > 0 && (
              <>
                {!allHumanRolesAssigned ? (
                  <div className="bg-warning bg-opacity-10 border-2 border-warning rounded-lg p-6 mb-6">
                    <h3 className="font-heading text-lg text-warning mb-3">
                      ⚠️ No Active Phase - Registration Required
                    </h3>
                    <p className="text-neutral-700 mb-4">
                      Register participants before starting the simulation.
                    </p>
                    <Link
                      to={`/facilitator/simulation/${runId}/register`}
                      className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                    >
                      Register Participants
                    </Link>
                  </div>
                ) : (
                  <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-6 mb-6">
                    <h3 className="font-heading text-lg text-success mb-3">
                      ✅ Registration Complete, Ready to Start
                    </h3>
                    <p className="text-neutral-700 mb-2">
                      All human participants have been assigned roles. You can now start the simulation.
                    </p>
                    <p className="text-sm text-neutral-600 mb-4">
                      Participants: {assignedHumanRoles.length} humans assigned, {aiRoles.length} AI participants ready
                    </p>
                    <button
                      onClick={handleCancelRegistration}
                      className="px-4 py-2 bg-white border-2 border-error text-error rounded-lg font-medium hover:bg-error hover:text-white transition-colors"
                    >
                      Cancel Registration
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* King's Decisions Review - Show when King is elected */}
            {kingRole && (
              <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-6">
                <h2 className="text-2xl font-heading font-bold text-amber-900 mb-6">
                  King's Decisions
                </h2>
                <KingDecisionReview
                  runId={runId!}
                  kingRole={kingRole}
                  allRoles={roles}
                  clans={clans}
                />
              </div>
            )}

            {/* Clan Nominations Voting (appears only in nomination phase) */}
            {currentPhase && currentPhase.name.toLowerCase().includes('nominate') ? (
              <>
                <ClanNominationsControls
                  runId={runId!}
                  phaseId={currentPhase.phase_id}
                  phaseName={currentPhase.name}
                  clans={clans}
                  roles={roles}
                />
              </>
            ) : null}

            {/* Election Round Voting (Vote 1 or Vote 2) */}
            {currentPhase && (currentPhase.name === 'Vote 1' || currentPhase.name === 'Vote 2') && simulation ? (
              <ElectionRoundControls
                runId={runId!}
                phaseId={currentPhase.phase_id}
                phaseName={currentPhase.name}
                roundNumber={currentPhase.name === 'Vote 1' ? 1 : 2}
                threshold={
                  currentPhase.name === 'Vote 1'
                    ? simulation.vote_1_threshold || Math.ceil((simulation.total_participants || 12) * 2 / 3)
                    : simulation.vote_2_threshold || Math.ceil((simulation.total_participants || 12) * 2 / 3)
                }
                candidates={electionCandidates}
                allRoles={roles}
                clans={clans}
              />
            ) : null}

            {/* Clan Allegiance Voting (Final Phase) */}
            {currentPhase && currentPhase.name.toLowerCase().includes('clan') && currentPhase.name.toLowerCase().includes('allegiance') ? (
              <div className="mb-6">
                <ClanAllegianceControls
                  runId={runId!}
                  clans={clans}
                />
              </div>
            ) : null}

            <PhaseControls runId={runId!} />

            {/* Voting Management - HIDE during nomination/election phases (specialized controls handle them) */}
            {currentPhase &&
              !currentPhase.name.toLowerCase().includes('nominate') &&
              currentPhase.name !== 'Vote 1' &&
              currentPhase.name !== 'Vote 2' && (
              <div className="mt-6">
                <VotingControls
                  runId={runId!}
                  phaseId={currentPhase.phase_id}
                  phaseDurationMinutes={currentPhase.actual_duration_minutes || currentPhase.default_duration_minutes}
                  allRoles={roles}
                  allClans={clans}
                />
              </div>
            )}

            {/* Current Phase Details */}
            {currentPhase && (
              <div className="mt-6 bg-white rounded-lg border-2 border-neutral-200 p-6">
                <h3 className="font-heading text-lg text-primary mb-4">
                  Current Phase Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-neutral-700">Name:</span>
                    <span className="ml-2 text-neutral-900">{currentPhase.name}</span>
                  </div>
                  {currentPhase.description && (
                    <div>
                      <span className="text-sm font-medium text-neutral-700">
                        Description:
                      </span>
                      <p className="text-neutral-600 text-sm mt-1">
                        {currentPhase.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-neutral-700">
                      Duration:
                    </span>
                    <span className="ml-2 text-neutral-900">
                      {currentPhase.actual_duration_minutes ||
                        currentPhase.default_duration_minutes}{' '}
                      minutes
                    </span>
                  </div>
                  {currentPhase.started_at && (
                    <div>
                      <span className="text-sm font-medium text-neutral-700">
                        Started at:
                      </span>
                      <span className="ml-2 text-neutral-900">
                        {new Date(currentPhase.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Simulation Overview */}
          <div className="space-y-6">
            {/* Participants Summary */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
              <h3 className="font-heading text-lg text-primary mb-4">
                Participants
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Total Roles:</span>
                  <span className="font-medium text-neutral-900">{roles.length}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                  <span className="text-neutral-600">Human Participants:</span>
                  <span className="font-medium text-neutral-900">
                    {humanRoles.length}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-4">
                  <span className="text-neutral-600 text-sm">Out of which assigned:</span>
                  <span className={`font-medium ${assignedHumanRoles.length === humanRoles.length ? 'text-success' : 'text-warning'}`}>
                    {assignedHumanRoles.length}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                  <span className="text-neutral-600">AI Participants:</span>
                  <span className="font-medium text-neutral-900">{aiRoles.length}</span>
                </div>
              </div>
            </div>

            {/* Clans Summary */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
              <h3 className="font-heading text-lg text-primary mb-4">Clans</h3>
              <div className="space-y-2">
                {clans.map((clan) => (
                  <div
                    key={clan.clan_id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-neutral-50"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: clan.color_hex || '#8B7355' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-900">{clan.name}</div>
                      <div className="text-xs text-neutral-500">
                        {roles.filter((r) => r.clan_id === clan.clan_id).length} roles
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Progress */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
              <h3 className="font-heading text-lg text-primary mb-4">
                Phase Progress
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-neutral-600 mb-2">
                  <span>Completed:</span>
                  <span className="font-medium">
                    {allPhases.filter((p) => p.status === 'completed').length} /{' '}
                    {allPhases.length}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="h-2 bg-success rounded-full transition-all"
                    style={{
                      width: `${
                        (allPhases.filter((p) => p.status === 'completed').length /
                          allPhases.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
              <h3 className="font-heading text-lg text-primary mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-left">
                  📊 View Analytics
                </button>
                <button className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-left">
                  📝 View Event Log
                </button>
                <button className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-left">
                  💬 View Discussions
                </button>
                <button className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-left">
                  🗳️ View Voting Results
                </button>

                {/* Divider */}
                <div className="border-t-2 border-neutral-200 my-4" />

                {/* Restart Phase */}
                <button
                  onClick={handleRestartPhase}
                  disabled={loading || !currentPhase}
                  className="w-full px-4 py-2 bg-accent bg-opacity-10 border-2 border-accent text-accent rounded-lg hover:bg-accent hover:text-white transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 Restart Phase
                </button>
                <p className="text-xs text-neutral-500 mt-1 px-2">
                  Reset current phase voting (for testing)
                </p>

                {/* Re-Start Simulation */}
                <button
                  onClick={handleRestartSimulation}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-warning bg-opacity-10 border-2 border-warning text-warning rounded-lg hover:bg-warning hover:text-white transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  🔄 Re-Start Simulation
                </button>
                <p className="text-xs text-neutral-500 mt-1 px-2">
                  Reset to beginning (for testing)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
