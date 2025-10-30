/**
 * King Decision Review (Admin)
 *
 * Allows facilitator to review King's decisions and reveal them to all participants
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { KingDecision, Role, Clan } from '../../types/database'

interface KingDecisionReviewProps {
  runId: string
  kingRole: Role | null
  allRoles: Role[]
  clans: Clan[]
}

export function KingDecisionReview({ runId, kingRole, allRoles, clans }: KingDecisionReviewProps) {
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState<KingDecision | null>(null)
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    loadDecision()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`king_decisions:${runId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'king_decisions',
          filter: `run_id=eq.${runId}`
        },
        () => {
          loadDecision()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [runId])

  const loadDecision = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('king_decisions')
      .select('*')
      .eq('run_id', runId)
      .single()

    if (!error && data) {
      setDecision(data)
    } else {
      setDecision(null)
    }

    setLoading(false)
  }

  const handleReveal = async () => {
    if (!decision) return

    if (!confirm('Are you sure you want to reveal the King\'s decisions to all participants? This cannot be undone.')) {
      return
    }

    setRevealing(true)

    const { error } = await supabase
      .from('king_decisions')
      .update({ revealed: true })
      .eq('decision_id', decision.decision_id)

    setRevealing(false)

    if (error) {
      console.error('Error revealing decisions:', error)
      alert('Failed to reveal decisions: ' + error.message)
      return
    }

    alert('✅ Decisions revealed to all participants!')
  }

  if (loading) {
    return (
      <div className="bg-amber-50 border-4 border-amber-400 rounded-xl p-8 text-center">
        <div className="text-amber-700">Loading King's decisions...</div>
      </div>
    )
  }

  if (!kingRole) {
    return (
      <div className="bg-amber-50 border-4 border-amber-400 rounded-xl p-8 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="text-amber-900 font-semibold">No King elected yet</div>
        <div className="text-amber-700 text-sm mt-2">Waiting for Vote 2 results...</div>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="bg-amber-50 border-4 border-amber-400 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <div className="text-xl font-heading font-bold text-amber-900 mb-2">
          Awaiting King's Decisions
        </div>
        <div className="text-amber-700">
          {kingRole.name} has not yet submitted the royal decree
        </div>
      </div>
    )
  }

  // Parse JSONB fields
  const taxes = decision.taxes as any
  const budgetPriorities = decision.budget_priorities as any
  const appointments = decision.appointments as any
  const intlAffairs = decision.international_affairs as any

  // Helper to get role name
  const getRoleName = (roleId: string | null) => {
    if (!roleId) return 'Not appointed'
    const role = allRoles.find(r => r.role_id === roleId)
    return role ? `${role.name} (${role.title})` : 'Unknown'
  }

  // Helper to get clan for a role
  const getClanForRole = (roleId: string | null) => {
    if (!roleId) return null
    const role = allRoles.find(r => r.role_id === roleId)
    if (!role) return null
    return clans.find(c => c.clan_id === role.clan_id) || null
  }

  const economicAdvisorClan = getClanForRole(appointments?.economic_advisor)
  const seniorJudgeClan = getClanForRole(appointments?.senior_judge)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-3xl font-heading font-bold text-amber-900">
                King's Decisions
              </h3>
            </div>
            <div className="text-amber-800 text-lg">
              Submitted by {kingRole.name}
            </div>
          </div>

          <div>
            {decision.revealed ? (
              <div className="px-6 py-3 bg-amber-100 text-amber-900 border-4 border-amber-600 rounded-lg font-bold">
                ✅ Revealed to All
              </div>
            ) : (
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors font-bold text-lg"
              >
                {revealing ? 'Revealing...' : '📢 Reveal to All Participants'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tax Policy */}
      <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
        <h4 className="text-xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Tax Policy</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-1">🌾 Agriculture</div>
            <div className="font-bold text-amber-900 capitalize">{taxes?.agriculture || 'same'}</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-1">⛵ Trade</div>
            <div className="font-bold text-amber-900 capitalize">{taxes?.trade || 'same'}</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-1">🏦 Banking</div>
            <div className="font-bold text-amber-900 capitalize">{taxes?.banking || 'same'}</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-1">🔨 Craft</div>
            <div className="font-bold text-amber-900 capitalize">{taxes?.craft || 'same'}</div>
          </div>
        </div>
      </div>

      {/* Budget Priorities */}
      <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
        <h4 className="text-xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span>💰</span>
          <span>Budget Priorities</span>
        </h4>
        <ol className="space-y-3">
          <li className="flex items-center gap-3 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
            <span className="text-2xl font-bold text-amber-600">1.</span>
            <span className="text-lg font-semibold text-amber-900 capitalize">
              {budgetPriorities?.priority_1?.replace('_', ' ')}
            </span>
          </li>
          <li className="flex items-center gap-3 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
            <span className="text-2xl font-bold text-amber-600">2.</span>
            <span className="text-lg font-semibold text-amber-900 capitalize">
              {budgetPriorities?.priority_2?.replace('_', ' ')}
            </span>
          </li>
          <li className="flex items-center gap-3 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
            <span className="text-2xl font-bold text-amber-600">3.</span>
            <span className="text-lg font-semibold text-amber-900 capitalize">
              {budgetPriorities?.priority_3?.replace('_', ' ')}
            </span>
          </li>
        </ol>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
        <h4 className="text-xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span>🏛️</span>
          <span>Key Appointments</span>
        </h4>
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-2">Economic Advisor</div>
            <div className="font-bold text-amber-900">{getRoleName(appointments?.economic_advisor)}</div>
            {economicAdvisorClan && (
              <div className="text-sm mt-1" style={{ color: economicAdvisorClan.primary_color }}>
                {economicAdvisorClan.name}
              </div>
            )}
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-2">Senior Judge</div>
            <div className="font-bold text-amber-900">{getRoleName(appointments?.senior_judge)}</div>
            {seniorJudgeClan && (
              <div className="text-sm mt-1" style={{ color: seniorJudgeClan.primary_color }}>
                {seniorJudgeClan.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* International Affairs */}
      <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
        <h4 className="text-xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span>⚔️</span>
          <span>International Affairs</span>
        </h4>
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-2">Alliance</div>
            <div className="font-bold text-amber-900 text-lg">
              {intlAffairs?.alliance === 'none' ? 'No Alliance' : `Alliance with ${intlAffairs?.alliance}`}
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-700 mb-2">War Declarations</div>
            {intlAffairs?.war_declarations?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {intlAffairs.war_declarations.map((target: string) => (
                  <span key={target} className="px-3 py-1 bg-red-100 text-red-800 border-2 border-red-400 rounded-lg font-semibold">
                    ⚔️ {target}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-amber-700 italic">No wars declared</div>
            )}
          </div>
        </div>
      </div>

      {/* Other Decisions */}
      {decision.other_decisions && (
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h4 className="text-xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
            <span>📝</span>
            <span>Other Decisions</span>
          </h4>
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
            <p className="text-amber-900 whitespace-pre-wrap">{decision.other_decisions}</p>
          </div>
        </div>
      )}

      {/* Final Speech */}
      {decision.final_speech_transcript && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-6">
          <h4 className="text-2xl font-heading font-bold text-amber-900 mb-4 flex items-center gap-2">
            <span>📜</span>
            <span>Final Speech</span>
          </h4>
          <div className="bg-white p-6 rounded-lg border-2 border-amber-400">
            <p className="text-amber-900 text-lg leading-relaxed font-serif whitespace-pre-wrap">
              {decision.final_speech_transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
