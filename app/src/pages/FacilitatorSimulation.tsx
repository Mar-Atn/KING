import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePhaseStore } from '../stores/phaseStore'
import { usePhaseSync } from '../hooks/usePhaseSync'
import { PhaseControls } from '../components/PhaseControls'
import type { SimRun, Clan, Role } from '../types/database'

export function FacilitatorSimulation() {
  const { runId } = useParams<{ runId: string }>()
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [clans, setClans] = useState<Clan[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Load simulation data
  const loadSimulation = async () => {
    if (!runId) return

    setLoading(true)
    setError(null)

    try {
      // ✅ Execute all 3 queries in PARALLEL using Promise.all
      const [simResult, clansResult, rolesResult] = await Promise.all([
        // Query 1: Load sim_run
        supabase
          .from('sim_runs')
          .select('*')
          .eq('run_id', runId)
          .single(),

        // Query 2: Load clans (runs in parallel with Query 1)
        supabase
          .from('clans')
          .select('*')
          .eq('run_id', runId)
          .order('sequence_number', { ascending: true }),

        // Query 3: Load roles (runs in parallel with Query 1 & 2)
        supabase
          .from('roles')
          .select('*')
          .eq('run_id', runId),
      ])

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
      await loadPhases(runId)

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

            <PhaseControls runId={runId!} />

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
