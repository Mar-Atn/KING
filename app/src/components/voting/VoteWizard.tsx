/**
 * VoteWizard Component
 *
 * Multi-step wizard for facilitators to create votes with full customization.
 * Steps: 1) Select Type → 2) Configure → 3) Review → 4) Create
 *
 * Sprint 1: Voting System Implementation
 * Date: October 29, 2025
 */

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { getVoteTemplatesByCategory, type VoteTypeTemplate } from '../../lib/voteTemplates'
import { useVoting } from '../../hooks/useVoting'
import type { Database } from '../../lib/database.types'

type VoteSessionInsert = Database['public']['Tables']['vote_sessions']['Insert']

interface VoteWizardProps {
  runId: string
  phaseId: string
  phaseDurationMinutes: number | null
  allRoles: any[] // Roles in the simulation
  allClans: any[] // Clans in the simulation
  onClose: () => void
  onVoteCreated: () => void
}

export function VoteWizard({
  runId,
  phaseId,
  phaseDurationMinutes,
  allRoles,
  allClans,
  onClose,
  onVoteCreated
}: VoteWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<VoteTypeTemplate | null>(null)
  const [voteConfig, setVoteConfig] = useState<Partial<VoteSessionInsert>>({})

  const { createVoteSession, calculateTimeLimit, loading } = useVoting({ runId })

  const templates = getVoteTemplatesByCategory()

  // Calculate default time limit
  const defaultTimeLimit = calculateTimeLimit(phaseDurationMinutes)

  // ============================================================================
  // STEP 1: SELECT VOTE TYPE
  // ============================================================================

  const renderStepSelectType = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Vote Type</h3>
        <p className="text-sm text-gray-600">Choose the type of vote you want to create</p>
      </div>

      {/* King Election Votes */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">👑 King Election Process</h4>
        <div className="grid grid-cols-1 gap-3">
          {templates.kingElection.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template)
                setVoteConfig({
                  ...template.defaults,
                  run_id: runId,
                  phase_id: phaseId
                })
                setStep(2)
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Clan Decisions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">🏛️ Clan Decisions</h4>
        <div className="grid grid-cols-1 gap-3">
          {templates.clanDecisions.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template)
                setVoteConfig({
                  ...template.defaults,
                  run_id: runId,
                  phase_id: phaseId
                })
                setStep(2)
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Votes */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">📝 Custom Votes</h4>
        <div className="grid grid-cols-1 gap-3">
          {templates.custom.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template)
                setVoteConfig({
                  ...template.defaults,
                  run_id: runId,
                  phase_id: phaseId
                })
                setStep(2)
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ============================================================================
  // STEP 2: CONFIGURE VOTE
  // ============================================================================

  const renderStepConfigure = () => {
    if (!selectedTemplate) return null

    const updateConfig = (field: string, value: any) => {
      setVoteConfig(prev => ({ ...prev, [field]: value }))
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configure: {selectedTemplate.name}
          </h3>
          <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
        </div>

        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vote Title
            </label>
            <input
              type="text"
              value={voteConfig.proposal_title || ''}
              onChange={e => updateConfig('proposal_title', e.target.value)}
              placeholder="e.g., Vote for King - Round 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={voteConfig.proposal_description || ''}
              onChange={e => updateConfig('proposal_description', e.target.value)}
              placeholder="Explain what this vote is about..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Scope (for clan-specific votes) */}
        {voteConfig.scope === 'clan_only' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Clan
            </label>
            <select
              value={voteConfig.scope_clan_id || ''}
              onChange={e => updateConfig('scope_clan_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Choose a clan...</option>
              {allClans.map(clan => (
                <option key={clan.clan_id} value={clan.clan_id}>
                  {clan.clan_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Eligible Candidates (for choose_person format) */}
        {voteConfig.vote_format === 'choose_person' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eligible Candidates
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              {allRoles
                .filter(role => {
                  // Filter by clan if clan_only
                  if (voteConfig.scope === 'clan_only' && voteConfig.scope_clan_id) {
                    return role.clan_id === voteConfig.scope_clan_id
                  }
                  return true
                })
                .map(role => {
                  const eligibleIds = (voteConfig.eligible_candidates as string[]) || []
                  const isChecked = eligibleIds.includes(role.role_id)

                  return (
                    <label key={role.role_id} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const newIds = e.target.checked
                            ? [...eligibleIds, role.role_id]
                            : eligibleIds.filter(id => id !== role.role_id)
                          updateConfig('eligible_candidates', newIds)
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-900">
                        {role.role_name} ({role.clan_name || 'No clan'})
                      </span>
                    </label>
                  )
                })}
            </div>
          </div>
        )}

        {/* Transparency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transparency Level
          </label>
          <select
            value={voteConfig.transparency_level || 'anonymous'}
            onChange={e => updateConfig('transparency_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="open">Open (show who voted for whom)</option>
            <option value="anonymous">Anonymous (show only tallies)</option>
            <option value="secret">Secret (hide until announced)</option>
          </select>
        </div>

        {/* Reveal Timing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            When to Reveal Results
          </label>
          <select
            value={voteConfig.reveal_timing || 'after_all_votes'}
            onChange={e => updateConfig('reveal_timing', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="immediate">Immediate (as votes come in)</option>
            <option value="after_all_votes">After all votes cast</option>
            <option value="facilitator_manual">Manual (you control when)</option>
          </select>
        </div>

        {/* Animation Speed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Animation Speed
          </label>
          <select
            value={voteConfig.animation_speed || 'normal'}
            onChange={e => updateConfig('animation_speed', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="instant">Instant (no animation)</option>
            <option value="fast">Fast (0.4s per vote)</option>
            <option value="normal">Normal (0.8s per vote)</option>
            <option value="slow">Slow (1.2s per vote - dramatic)</option>
          </select>
        </div>
      </div>
    )
  }

  // ============================================================================
  // STEP 3: REVIEW
  // ============================================================================

  const renderStepReview = () => {
    if (!selectedTemplate) return null

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Vote Configuration</h3>
          <p className="text-sm text-gray-600">Please review before creating the vote</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <span className="text-4xl">{selectedTemplate.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{selectedTemplate.name}</div>
              <div className="text-sm text-gray-600">{selectedTemplate.description}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium text-gray-900">{voteConfig.vote_type}</span>
            </div>

            <div>
              <span className="text-gray-600">Format:</span>
              <span className="ml-2 font-medium text-gray-900">{voteConfig.vote_format}</span>
            </div>

            <div>
              <span className="text-gray-600">Scope:</span>
              <span className="ml-2 font-medium text-gray-900">
                {voteConfig.scope === 'all' ? 'All participants' : 'Clan only'}
              </span>
            </div>

            {voteConfig.scope === 'clan_only' && voteConfig.scope_clan_id && (
              <div>
                <span className="text-gray-600">Clan:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {allClans.find(c => c.clan_id === voteConfig.scope_clan_id)?.clan_name || 'Unknown'}
                </span>
              </div>
            )}

            <div>
              <span className="text-gray-600">Transparency:</span>
              <span className="ml-2 font-medium text-gray-900">{voteConfig.transparency_level}</span>
            </div>

            <div>
              <span className="text-gray-600">Reveal:</span>
              <span className="ml-2 font-medium text-gray-900">{voteConfig.reveal_timing}</span>
            </div>

            <div>
              <span className="text-gray-600">Animation:</span>
              <span className="ml-2 font-medium text-gray-900">{voteConfig.animation_speed}</span>
            </div>

            <div>
              <span className="text-gray-600">Time Limit:</span>
              <span className="ml-2 font-medium text-gray-900">{defaultTimeLimit} minutes</span>
            </div>
          </div>

          {voteConfig.proposal_title && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Title:</div>
              <div className="font-medium text-gray-900">{voteConfig.proposal_title}</div>
            </div>
          )}

          {voteConfig.proposal_description && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Description:</div>
              <div className="text-sm text-gray-700">{voteConfig.proposal_description}</div>
            </div>
          )}

          {voteConfig.vote_format === 'choose_person' && voteConfig.eligible_candidates && (
            <div>
              <div className="text-sm text-gray-600 mb-2">
                Eligible Candidates ({(voteConfig.eligible_candidates as string[]).length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {(voteConfig.eligible_candidates as string[]).map(roleId => {
                  const role = allRoles.find(r => r.role_id === roleId)
                  return role ? (
                    <span key={roleId} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                      {role.role_name}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            ⚠️ Once created, the vote will be immediately visible to participants. Make sure all settings are correct.
          </p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleCreateVote = async () => {
    const result = await createVoteSession(voteConfig as VoteSessionInsert)

    if (result) {
      onVoteCreated()
      onClose()
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Vote</h2>
            <p className="text-sm text-gray-600">
              Step {step} of 3: {step === 1 ? 'Select Type' : step === 2 ? 'Configure' : 'Review'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(stepNum => (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`w-full h-2 rounded-full ${
                    stepNum <= step ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && renderStepSelectType()}
          {step === 2 && renderStepConfigure()}
          {step === 3 && renderStepReview()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 2 && voteConfig.scope === 'clan_only' && !voteConfig.scope_clan_id) ||
                (step === 2 && voteConfig.vote_format === 'choose_person' && !(voteConfig.eligible_candidates as string[])?.length)
              }
              className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreateVote}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Vote'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
