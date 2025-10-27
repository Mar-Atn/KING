/**
 * Role Briefing Page
 *
 * Displays complete character information after role reveal:
 * - Character details (name, age, position, background, traits, interests)
 * - Clan information
 * - Key priorities
 * - Clan members list
 * - "I'm Ready" confirmation
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getRoleForUser, updateUserStatus } from '../lib/data/participants'
import type { Role, Clan } from '../types/database'

export function RoleBriefing() {
  const { runId } = useParams<{ runId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role | null>(null)
  const [clanMembers, setClanMembers] = useState<Role[]>([])
  const [allClans, setAllClans] = useState<Clan[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load role and clan data
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
        setLoading(false)
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [user, runId, navigate])

  // Handle ready confirmation
  const handleConfirmReady = async () => {
    if (!user || !runId) return

    setConfirming(true)
    try {
      await updateUserStatus(user.id, 'active')
      // Navigate to participant dashboard
      navigate(`/participant-dashboard/${runId}`)
    } catch (err: any) {
      console.error('Error confirming ready:', err)
      setError(err.message)
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neutral-600">Loading your briefing...</div>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-white border-b-4 py-8"
        style={{ borderColor: clanData?.color_hex || '#8B7355' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            {role.avatar_url ? (
              <img
                src={role.avatar_url}
                alt={role.name}
                className="w-32 h-32 rounded-full object-cover border-4 shadow-lg"
                style={{ borderColor: clanData?.color_hex || '#8B7355' }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-lg"
                style={{
                  borderColor: clanData?.color_hex || '#8B7355',
                  backgroundColor: `${clanData?.color_hex || '#8B7355'}20`
                }}
              >
                <span className="text-5xl font-heading" style={{ color: clanData?.color_hex }}>
                  {role.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Name & Title */}
            <div className="flex-1">
              <h1 className="font-heading text-4xl text-primary mb-2">
                {role.name}
              </h1>
              {role.position && (
                <p className="text-xl text-neutral-600 mb-1">{role.position}</p>
              )}
              {role.age && (
                <p className="text-neutral-500">Age: {role.age}</p>
              )}
            </div>

            {/* Clan Badge */}
            {clanData && (
              <div
                className="px-6 py-4 rounded-lg border-2"
                style={{
                  borderColor: clanData.color_hex || '#8B7355',
                  backgroundColor: `${clanData.color_hex || '#8B7355'}15`
                }}
              >
                {clanData.emblem_url && (
                  <img
                    src={clanData.emblem_url}
                    alt={clanData.name}
                    className="w-16 h-16 object-contain mx-auto mb-2"
                  />
                )}
                <div className="text-center">
                  <div className="text-sm text-neutral-600 uppercase tracking-wide">
                    Clan
                  </div>
                  <div
                    className="text-2xl font-heading font-bold"
                    style={{ color: clanData.color_hex }}
                  >
                    {clanData.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Character Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Background */}
            {role.background && (
              <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                <h2 className="font-heading text-xl text-primary mb-4">
                  Your Background
                </h2>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {role.background}
                </p>
              </div>
            )}

            {/* Character Traits */}
            {role.character_traits && (
              <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                <h2 className="font-heading text-xl text-primary mb-4">
                  Character Traits
                </h2>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {role.character_traits}
                </p>
              </div>
            )}

            {/* Interests & Motivations */}
            {role.interests && (
              <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                <h2 className="font-heading text-xl text-primary mb-4">
                  Interests & Motivations
                </h2>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {role.interests}
                </p>
              </div>
            )}

            {/* Ready Confirmation */}
            <div
              className="bg-white rounded-lg border-2 p-8 text-center"
              style={{ borderColor: clanData?.color_hex || '#8B7355' }}
            >
              <h2 className="font-heading text-2xl text-primary mb-4">
                Ready to Begin?
              </h2>
              <p className="text-neutral-600 mb-6">
                Once you confirm, you'll join the simulation and interact with other participants.
              </p>
              <button
                onClick={handleConfirmReady}
                disabled={confirming}
                className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? 'Confirming...' : "I'm Ready to Begin!"}
              </button>
            </div>
          </div>

          {/* Right Column - Clan Info */}
          <div className="space-y-6">
            {/* Clan Details */}
            {clanData && (
              <>
                {/* About Clan */}
                {clanData.about && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h2 className="font-heading text-lg text-primary mb-3">
                      About {clanData.name}
                    </h2>
                    <p className="text-neutral-700 text-sm leading-relaxed">
                      {clanData.about}
                    </p>
                  </div>
                )}

                {/* Key Priorities */}
                {clanData.key_priorities && (
                  <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
                    <h2 className="font-heading text-lg text-primary mb-3">
                      Key Priorities
                    </h2>
                    <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-line">
                      {clanData.key_priorities}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Clan Members */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
              <h2 className="font-heading text-lg text-primary mb-4">
                Your Clan Members
              </h2>
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
                <h2 className="font-heading text-lg text-primary mb-4">
                  Other Clans in the Simulation
                </h2>
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

            {/* Emergency Plan */}
            {clanData?.if_things_go_wrong && (
              <div className="bg-warning bg-opacity-10 border-2 border-warning rounded-lg p-6">
                <h2 className="font-heading text-lg text-warning mb-3">
                  ⚠️ If Things Go Wrong
                </h2>
                <p className="text-neutral-700 text-sm leading-relaxed">
                  {clanData.if_things_go_wrong}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
