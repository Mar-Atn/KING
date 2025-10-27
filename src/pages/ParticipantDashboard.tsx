/**
 * Participant Dashboard Page
 *
 * Main participant interface after role confirmation:
 * - My Role: Character details, background, traits, interests
 * - My Clan: Clan info, members, other clans overview
 * - Process Overview: Phases and current status
 * - Printable Materials: Link to printable brief
 * - Induction Advisor: AI conversation placeholder
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getRoleForUser } from '../lib/data/participants'
import type { Role, Clan, Phase, SimRun } from '../types/database'

type Tab = 'role' | 'clan' | 'process' | 'materials'

export function ParticipantDashboard() {
  const { runId } = useParams<{ runId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('role')
  const [role, setRole] = useState<Role | null>(null)
  const [clanMembers, setClanMembers] = useState<Role[]>([])
  const [allClans, setAllClans] = useState<Clan[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all data
  useEffect(() => {
    if (!user || !runId) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      try {
        // Get role
        const roleData = await getRoleForUser(user.id, runId)

        if (!roleData) {
          navigate(`/waiting-room/${runId}`)
          return
        }

        setRole(roleData)

        // Get simulation info
        const { data: simData, error: simError } = await supabase
          .from('sim_runs')
          .select('*')
          .eq('run_id', runId)
          .single()

        if (simError) throw simError
        setSimulation(simData)

        // Get all clan members (including this role)
        const { data: membersData, error: membersError } = await supabase
          .from('roles')
          .select('*, users!roles_assigned_user_id_fkey(display_name)')
          .eq('clan_id', roleData.clan_id)
          .order('name', { ascending: true })

        if (membersError) throw membersError
        setClanMembers(membersData || [])

        // Get all clans for this simulation
        const { data: clansData, error: clansError } = await supabase
          .from('clans')
          .select('*')
          .eq('run_id', runId)
          .order('sequence_number', { ascending: true })

        if (clansError) throw clansError
        setAllClans(clansData || [])

        // Get all phases for this simulation
        const { data: phasesData, error: phasesError } = await supabase
          .from('phases')
          .select('*')
          .eq('run_id', runId)
          .order('sequence_number', { ascending: true })

        if (phasesError) throw phasesError
        setPhases(phasesData || [])

        setLoading(false)
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [user, runId, navigate])

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

  const clanData = (role as any).clans

  // Get current phase if any
  const currentPhase = simulation?.current_phase_id
    ? phases.find(p => p.phase_id === simulation.current_phase_id)
    : null

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
              <div
                className="px-4 py-3 rounded-lg border-2"
                style={{
                  borderColor: clanData.color_hex || '#8B7355',
                  backgroundColor: `${clanData.color_hex || '#8B7355'}15`
                }}
              >
                {clanData.emblem_url && (
                  <img
                    src={clanData.emblem_url}
                    alt={clanData.name}
                    className="w-12 h-12 object-contain mx-auto mb-1"
                  />
                )}
                <div className="text-center">
                  <div className="text-xs text-neutral-600 uppercase tracking-wide">
                    Clan
                  </div>
                  <div
                    className="text-xl font-heading font-bold"
                    style={{ color: clanData.color_hex }}
                  >
                    {clanData.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-sm text-neutral-600">
                {currentPhase ? `Current Phase: ${currentPhase.phase_name}` : 'Simulation not started'}
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              {simulation?.run_name}
            </div>
          </div>
        </div>
      </div>

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
              Process Overview
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'materials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-primary'
              }`}
            >
              Printable Materials
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
                                  className="w-8 h-8 object-contain"
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

            {/* Tab: Process Overview */}
            {activeTab === 'process' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl text-primary">Simulation Process</h2>

                <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                  <h3 className="font-heading text-lg text-primary mb-4">Phases</h3>
                  <div className="space-y-4">
                    {phases.map((phase, index) => {
                      const isCurrent = phase.phase_id === simulation?.current_phase_id
                      const isPast = simulation?.current_phase_id
                        ? phases.findIndex(p => p.phase_id === simulation.current_phase_id) > index
                        : false

                      return (
                        <div
                          key={phase.phase_id}
                          className={`p-4 rounded-lg border-2 ${
                            isCurrent
                              ? 'border-primary bg-primary bg-opacity-5'
                              : isPast
                              ? 'border-neutral-300 bg-neutral-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                isCurrent
                                  ? 'bg-primary text-white'
                                  : isPast
                                  ? 'bg-neutral-400 text-white'
                                  : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-heading font-medium text-neutral-900">
                                  {phase.phase_name}
                                </h4>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              {phase.description && (
                                <p className="text-sm text-neutral-600">{phase.description}</p>
                              )}
                              {phase.duration_minutes && (
                                <p className="text-xs text-neutral-500 mt-1">
                                  Duration: {phase.duration_minutes} minutes
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Printable Materials */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl text-primary">Printable Materials</h2>

                <div className="bg-white rounded-lg border-2 border-neutral-200 p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <h3 className="font-heading text-xl text-primary mb-2">
                    Your Character Brief
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Access a printable version of your character information, clan details, and process overview.
                  </p>

                  <button
                    onClick={() => window.open(`/printable-materials/${runId}/${role.role_id}`, '_blank')}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
                  >
                    Open Printable Materials
                  </button>
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
    </div>
  )
}
