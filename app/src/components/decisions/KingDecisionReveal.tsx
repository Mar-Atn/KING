/**
 * King Decision Reveal (Participant View)
 *
 * Displays the King's revealed decisions to all participants with cinematic presentation
 */

import { motion } from 'framer-motion'
import type { KingDecision, Role, Clan } from '../../types/database'

interface KingDecisionRevealProps {
  decision: KingDecision
  kingRole: Role
  kingClan: Clan | null
  allRoles: Role[]
  clans: Clan[]
  onClose: () => void
}

export function KingDecisionReveal({
  decision,
  kingRole,
  kingClan,
  allRoles,
  clans,
  onClose
}: KingDecisionRevealProps) {
  // Parse JSONB fields
  const taxes = decision.taxes as any
  const budgetPriorities = decision.budget_priorities as any
  const appointments = decision.appointments as any
  const intlAffairs = decision.international_affairs as any

  // Helper to get role name
  const getRoleName = (roleId: string | null) => {
    if (!roleId) return 'Not appointed'
    const role = allRoles.find(r => r.role_id === roleId)
    return role ? `${role.name}` : 'Unknown'
  }

  // Helper to get role details
  const getRole = (roleId: string | null) => {
    if (!roleId) return null
    return allRoles.find(r => r.role_id === roleId) || null
  }

  // Helper to get clan for a role
  const getClanForRole = (roleId: string | null) => {
    if (!roleId) return null
    const role = allRoles.find(r => r.role_id === roleId)
    if (!role) return null
    return clans.find(c => c.clan_id === role.clan_id) || null
  }

  const economicAdvisor = getRole(appointments?.economic_advisor)
  const seniorJudge = getRole(appointments?.senior_judge)
  const economicAdvisorClan = getClanForRole(appointments?.economic_advisor)
  const seniorJudgeClan = getClanForRole(appointments?.senior_judge)

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 overflow-auto">
      <div className="min-h-screen flex flex-col p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="text-8xl mb-4">👑</div>
          <h1 className="text-5xl font-heading font-bold text-amber-400 mb-4">
            Royal Decree
          </h1>
          <div className="flex items-center justify-center gap-4 mb-2">
            {kingRole.avatar_url && (
              <img
                src={kingRole.avatar_url}
                alt={kingRole.name}
                className="w-20 h-20 rounded-full border-4 border-amber-500 object-cover"
              />
            )}
            <div>
              <div className="text-3xl font-heading font-bold text-amber-300">
                {kingRole.name}
              </div>
              <div className="text-xl text-amber-500">King of Kourion</div>
            </div>
          </div>
          {kingClan && (
            <div className="text-lg" style={{ color: kingClan.primary_color }}>
              {kingClan.name}
            </div>
          )}
        </motion.div>

        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Tax Policy */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-xl border-4 border-amber-500 p-6 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-heading font-bold text-amber-300 mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>Tax Policy</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-1">🌾 Agriculture</div>
                <div className="font-bold text-amber-200 text-lg capitalize">{taxes?.agriculture || 'same'}</div>
              </div>
              <div className="bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-1">⛵ Trade</div>
                <div className="font-bold text-amber-200 text-lg capitalize">{taxes?.trade || 'same'}</div>
              </div>
              <div className="bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-1">🏦 Banking</div>
                <div className="font-bold text-amber-200 text-lg capitalize">{taxes?.banking || 'same'}</div>
              </div>
              <div className="bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-1">🔨 Craft</div>
                <div className="font-bold text-amber-200 text-lg capitalize">{taxes?.craft || 'same'}</div>
              </div>
            </div>
          </motion.div>

          {/* Budget Priorities */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-xl border-4 border-amber-500 p-6 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-heading font-bold text-amber-300 mb-4 flex items-center gap-2">
              <span>💰</span>
              <span>Budget Priorities</span>
            </h3>
            <ol className="space-y-3">
              <li className="flex items-center gap-3 bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <span className="text-2xl font-bold text-amber-400">1.</span>
                <span className="text-xl font-semibold text-amber-200 capitalize">
                  {budgetPriorities?.priority_1?.replace('_', ' ')}
                </span>
              </li>
              <li className="flex items-center gap-3 bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <span className="text-2xl font-bold text-amber-400">2.</span>
                <span className="text-xl font-semibold text-amber-200 capitalize">
                  {budgetPriorities?.priority_2?.replace('_', ' ')}
                </span>
              </li>
              <li className="flex items-center gap-3 bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <span className="text-2xl font-bold text-amber-400">3.</span>
                <span className="text-xl font-semibold text-amber-200 capitalize">
                  {budgetPriorities?.priority_3?.replace('_', ' ')}
                </span>
              </li>
            </ol>
          </motion.div>

          {/* Appointments */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-xl border-4 border-amber-500 p-6 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-heading font-bold text-amber-300 mb-4 flex items-center gap-2">
              <span>🏛️</span>
              <span>Key Appointments</span>
            </h3>
            <div className="space-y-4">
              <div className="bg-amber-800/30 p-5 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-3">Economic Advisor</div>
                {economicAdvisor ? (
                  <div className="flex items-center gap-3">
                    {economicAdvisor.avatar_url && (
                      <img
                        src={economicAdvisor.avatar_url}
                        alt={economicAdvisor.name}
                        className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"
                      />
                    )}
                    <div>
                      <div className="font-bold text-amber-200 text-lg">{economicAdvisor.name}</div>
                      <div className="text-amber-400 text-sm">{economicAdvisor.title}</div>
                      {economicAdvisorClan && (
                        <div className="text-sm mt-1" style={{ color: economicAdvisorClan.primary_color }}>
                          {economicAdvisorClan.name}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-400 italic">Not appointed</div>
                )}
              </div>

              <div className="bg-amber-800/30 p-5 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-3">Senior Judge</div>
                {seniorJudge ? (
                  <div className="flex items-center gap-3">
                    {seniorJudge.avatar_url && (
                      <img
                        src={seniorJudge.avatar_url}
                        alt={seniorJudge.name}
                        className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"
                      />
                    )}
                    <div>
                      <div className="font-bold text-amber-200 text-lg">{seniorJudge.name}</div>
                      <div className="text-amber-400 text-sm">{seniorJudge.title}</div>
                      {seniorJudgeClan && (
                        <div className="text-sm mt-1" style={{ color: seniorJudgeClan.primary_color }}>
                          {seniorJudgeClan.name}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-400 italic">Not appointed</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* International Affairs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-xl border-4 border-amber-500 p-6 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-heading font-bold text-amber-300 mb-4 flex items-center gap-2">
              <span>⚔️</span>
              <span>International Affairs</span>
            </h3>
            <div className="space-y-4">
              <div className="bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-2">Alliance</div>
                <div className="font-bold text-amber-200 text-xl">
                  {intlAffairs?.alliance === 'none' ? 'No Alliance' : `Alliance with ${intlAffairs?.alliance}`}
                </div>
              </div>
              <div className="bg-amber-800/30 p-4 rounded-lg border-2 border-amber-600">
                <div className="text-sm text-amber-400 mb-2">War Declarations</div>
                {intlAffairs?.war_declarations?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {intlAffairs.war_declarations.map((target: string) => (
                      <span key={target} className="px-4 py-2 bg-red-900/60 text-red-300 border-2 border-red-500 rounded-lg font-semibold text-lg">
                        ⚔️ {target}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-amber-400 italic">No wars declared</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Other Decisions */}
          {decision.other_decisions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-xl border-4 border-amber-500 p-6 backdrop-blur-sm"
            >
              <h3 className="text-2xl font-heading font-bold text-amber-300 mb-4 flex items-center gap-2">
                <span>📝</span>
                <span>Other Decisions</span>
              </h3>
              <div className="bg-amber-800/30 p-5 rounded-lg border-2 border-amber-600">
                <p className="text-amber-200 text-lg leading-relaxed whitespace-pre-wrap">{decision.other_decisions}</p>
              </div>
            </motion.div>
          )}

          {/* Final Speech */}
          {decision.final_speech_transcript && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="bg-gradient-to-br from-amber-800/50 to-orange-800/50 rounded-xl border-4 border-amber-400 p-8 backdrop-blur-sm"
            >
              <h3 className="text-3xl font-heading font-bold text-amber-300 mb-6 text-center flex items-center justify-center gap-2">
                <span>📜</span>
                <span>Final Speech to the People</span>
              </h3>
              <div className="bg-neutral-900/60 p-8 rounded-lg border-2 border-amber-500">
                <p className="text-amber-100 text-xl leading-relaxed font-serif whitespace-pre-wrap">
                  {decision.final_speech_transcript}
                </p>
              </div>
            </motion.div>
          )}

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="flex justify-center pt-6 pb-12"
          >
            <button
              onClick={onClose}
              className="px-10 py-4 bg-amber-600 text-white text-xl font-heading font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
            >
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
