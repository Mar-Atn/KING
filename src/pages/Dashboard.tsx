import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SimRun, Phase } from '../types/database'
import { DeleteSimulationModal } from '../components/DeleteSimulationModal'

// Extended type to include phase info
type SimRunWithPhase = SimRun & {
  current_phase?: Phase | null
  total_phases?: number
}

// Helper function to get status label with phase information
function getDetailedStatus(sim: SimRunWithPhase): { label: string; color: string } {
  // If simulation completed
  if (sim.status === 'completed') {
    return { label: 'Completed', color: 'bg-neutral-400/20 text-neutral-600' }
  }

  // If we have an active or recent phase, show it
  if (sim.current_phase) {
    const phaseName = sim.current_phase.name
    const phaseSeq = sim.current_phase.sequence_number
    const totalPhases = sim.total_phases || '?'

    // Show phase name and number
    return {
      label: `${phaseName} (${phaseSeq}/${totalPhases})`,
      color: 'bg-success/20 text-success'
    }
  }

  // No phases started yet
  return { label: 'Not Started', color: 'bg-warning/20 text-warning' }
}

export function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [simulations, setSimulations] = useState<SimRunWithPhase[]>([])
  const [loadingSimulations, setLoadingSimulations] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedSimulation, setSelectedSimulation] = useState<SimRun | null>(null)

  // Helper function to load simulations with phase info
  const loadSimulationsWithPhases = async () => {
    if (!user?.id) return

    try {
      // Get simulations
      const { data: sims, error: simError } = await supabase
        .from('sim_runs')
        .select('*')
        .eq('facilitator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (simError) throw simError

      console.log('📊 Loaded simulations:', sims?.length || 0)

      // For each simulation, get current phase (active or last completed) and phase count
      const simsWithPhases = await Promise.all(
        (sims || []).map(async (sim) => {
          // Get active phase (if any)
          const { data: activePhase } = await supabase
            .from('phases')
            .select('*')
            .eq('run_id', sim.run_id)
            .eq('status', 'active')
            .maybeSingle()

          let currentPhase = activePhase

          // If no active phase, get last completed phase
          if (!currentPhase) {
            const { data: lastCompleted } = await supabase
              .from('phases')
              .select('*')
              .eq('run_id', sim.run_id)
              .eq('status', 'completed')
              .order('sequence_number', { ascending: false })
              .limit(1)
              .maybeSingle()

            currentPhase = lastCompleted
          }

          // Get total phase count (cached query, should be fast)
          const { count } = await supabase
            .from('phases')
            .select('*', { count: 'exact', head: true })
            .eq('run_id', sim.run_id)

          console.log(`📍 ${sim.run_name}: ${count || 0} phases, current: ${currentPhase?.name || 'none'} (status: ${currentPhase?.status || 'N/A'})`)

          return {
            ...sim,
            current_phase: currentPhase,
            total_phases: count || 0,
          }
        })
      )

      setSimulations(simsWithPhases)
    } catch (error) {
      console.error('❌ Error fetching simulations:', error)
    } finally {
      setLoadingSimulations(false)
    }
  }

  // Route participants to appropriate page based on their status
  useEffect(() => {
    const routeParticipant = async () => {
      if (!user?.id) {
        return
      }

      try {
        // Check if user has a role assignment (determines if they're a participant in a simulation)
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('run_id')
          .eq('assigned_user_id', user.id)
          .maybeSingle()

        if (roleError) {
          console.error('❌ Error fetching role:', roleError)
          return
        }

        // If no role assignment, check if user is a participant
        if (!roleData?.run_id) {
          // Query users table directly to check role (don't depend on profile context)
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

          if (userData?.role === 'participant') {
            console.log('ℹ️ Participant not assigned to any simulation yet - staying on dashboard')
          }
          // If facilitator or no role data, stay on dashboard (will show facilitator UI or empty state)
          return
        }

        // User has a role assignment - they're a participant in a simulation
        console.log('🎭 Participant detected, checking role assignment...')
        const runId = roleData.run_id

        // Get user status directly from users table (don't rely on profile context)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('status')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('❌ Error fetching user status:', userError)
          return
        }

        const status = userData.status
        console.log(`✅ Found role assignment for run: ${runId}, status: ${status}`)

        // Route based on status
        if (status === 'registered') {
          console.log(`→ Routing to waiting room`)
          navigate(`/waiting-room/${runId}`)
        } else if (status === 'role_assigned') {
          console.log(`→ Routing to role reveal`)
          navigate(`/role-reveal/${runId}`)
        } else if (status === 'active') {
          console.log(`→ Routing to participant dashboard`)
          navigate(`/participant-dashboard/${runId}`)
        }
      } catch (err) {
        console.error('❌ Exception routing participant:', err)
      }
    }

    routeParticipant()
  }, [user?.id, navigate])

  // Load user's simulations if they're a facilitator
  useEffect(() => {
    if (profile?.role === 'facilitator' && user?.id) {
      setLoadingSimulations(true)
      loadSimulationsWithPhases()
    }
  }, [profile?.role, user?.id])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleDeleteClick = (e: React.MouseEvent, sim: SimRun) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()
    setSelectedSimulation(sim)
    setDeleteModalOpen(true)
  }

  const handleDeleteSuccess = async () => {
    // Reload simulations after deletion
    if (profile?.role === 'facilitator' && user?.id) {
      setLoadingSimulations(true)
      await loadSimulationsWithPhases()
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-heading text-3xl text-primary">The New King SIM</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Welcome, {profile?.display_name}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary mb-6">
          <h2 className="font-heading text-xl text-primary mb-4">Your Profile</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Email:</span>
              <span className="text-sm text-neutral-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Display Name:</span>
              <span className="text-sm text-neutral-900">{profile?.display_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Role:</span>
              <span className="text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile?.role === 'facilitator'
                    ? 'bg-secondary/20 text-secondary'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {profile?.role}
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-neutral-600">Status:</span>
              <span className="text-sm">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                  {profile?.status}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-secondary">
          <h2 className="font-heading text-xl text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role === 'facilitator' ? (
              <>
                <Link to="/simulation/create" className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left block">
                  <div className="font-medium text-neutral-900 mb-1">Create Simulation</div>
                  <div className="text-sm text-neutral-600">Set up a new simulation run</div>
                </Link>
                <Link to="/scenario/edit" className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left block">
                  <div className="font-medium text-neutral-900 mb-1">Edit Scenario</div>
                  <div className="text-sm text-neutral-600">Customize templates, clans & roles</div>
                </Link>
                <div className="p-4 border-2 border-neutral-200 rounded-lg bg-neutral-50 text-left opacity-60">
                  <div className="font-medium text-neutral-700 mb-1">Manage Participants</div>
                  <div className="text-sm text-neutral-500">Open a simulation to manage participants →</div>
                </div>
              </>
            ) : (
              <>
                <button className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
                  <div className="font-medium text-neutral-900 mb-1">My Role</div>
                  <div className="text-sm text-neutral-600">View your character assignment</div>
                </button>
                <Link to="/settings" className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left block">
                  <div className="font-medium text-neutral-900 mb-1">Device Access</div>
                  <div className="text-sm text-neutral-600">Generate QR code for quick login</div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* My Simulations (Facilitator Only) */}
        {profile?.role === 'facilitator' && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6 border-l-4 border-accent">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-xl text-primary">My Simulations</h2>
              <Link
                to="/simulation/create"
                className="text-sm text-primary hover:underline"
              >
                + Create New
              </Link>
            </div>

            {loadingSimulations ? (
              <div className="text-center py-8 text-neutral-500">
                Loading simulations...
              </div>
            ) : simulations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500 mb-4">
                  You haven't created any simulations yet.
                </p>
                <Link
                  to="/simulation/create"
                  className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Create Your First Simulation
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {simulations.map((sim) => (
                  <div
                    key={sim.run_id}
                    className="relative p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <Link
                      to={`/facilitator/simulation/${sim.run_id}`}
                      className="block"
                    >
                      {/* Reserve space for action buttons (3 buttons) */}
                      <div className="pr-32">
                        <div className="font-medium text-neutral-900 mb-1">
                          {sim.run_name}
                        </div>
                        <div className="text-sm text-neutral-600 mb-2">
                          {sim.version} • {sim.language} •{' '}
                          {new Date(sim.created_at).toLocaleDateString()}
                        </div>
                        {/* Status badge below metadata */}
                        <div className="flex items-center gap-2">
                          {(() => {
                            const status = getDetailedStatus(sim)
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                              >
                                {status.label}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </Link>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Print Button */}
                      <Link
                        to={`/simulation/${sim.run_id}/print`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-secondary hover:bg-secondary/10 rounded-lg"
                        title="Print participant materials"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </Link>

                      {/* Edit Button */}
                      <Link
                        to={`/simulation/edit/${sim.run_id}?mode=edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-primary hover:bg-primary-light rounded-lg"
                        title="Edit simulation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteClick(e, sim)}
                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg"
                        title="Delete simulation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Coming Soon */}
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
          <p className="text-primary font-medium mb-2">Phase 2.3 - Stage Engine Complete</p>
          <p className="text-sm text-neutral-600">
            Phase management with real-time controls is now available!
          </p>
        </div>
      </main>

      {/* Delete Simulation Modal */}
      {selectedSimulation && (
        <DeleteSimulationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setSelectedSimulation(null)
          }}
          simulation={selectedSimulation}
          onDeleted={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
