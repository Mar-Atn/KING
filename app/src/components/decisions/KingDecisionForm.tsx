/**
 * King's Decision Form
 *
 * Allows the elected King to make key decisions during Phase 10:
 * - Tax policy for 4 sectors
 * - 3 budget priorities
 * - Appointments (Economic Advisor, Senior Judge)
 * - International affairs (alliances, war declarations)
 * - Other decisions and final speech
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Role, Clan } from '../../types/database'

interface KingDecisionFormProps {
  runId: string
  kingRoleId: string
  allRoles: Role[]
  clans: Clan[]
  onSubmitSuccess: () => void
}

interface DecisionFormData {
  // Taxes: 'lower' | 'same' | 'higher' for each sector
  tax_agriculture: string
  tax_trade: string
  tax_banking: string
  tax_craft: string

  // Budget priorities (defense, culture, infrastructure, research, public_welfare, etc.)
  budget_priority_1: string
  budget_priority_2: string
  budget_priority_3: string

  // Appointments (role_ids)
  economic_advisor: string
  senior_judge: string

  // International affairs
  alliance: string // 'Salamis' | 'Kition' | 'none'
  war_declarations: string[] // Array of city-kingdom names

  // Free text
  other_decisions: string
}

const TAX_OPTIONS = [
  { value: 'lower', label: 'Lower Taxes' },
  { value: 'same', label: 'Keep Same' },
  { value: 'higher', label: 'Raise Taxes' }
]

const BUDGET_OPTIONS = [
  { value: 'defense', label: '⚔️ Defense & Military' },
  { value: 'culture', label: '🏛️ Culture & Arts' },
  { value: 'infrastructure', label: '🏗️ Infrastructure' },
  { value: 'research', label: '📚 Research & Development' },
  { value: 'public_welfare', label: '🏥 Public Welfare' },
  { value: 'trade', label: '⛵ Trade & Commerce' },
  { value: 'agriculture', label: '🌾 Agriculture' }
]

const ALLIANCE_OPTIONS = [
  { value: 'none', label: 'No Alliance' },
  { value: 'Salamis', label: 'Alliance with Salamis' },
  { value: 'Kition', label: 'Alliance with Kition' }
]

const WAR_TARGETS = ['Salamis', 'Kition', 'Egypt', 'Persia', 'Assyria']

export function KingDecisionForm({ runId, kingRoleId, allRoles, clans, onSubmitSuccess }: KingDecisionFormProps) {
  const [loading, setLoading] = useState(false)
  const [existingDecision, setExistingDecision] = useState<any>(null)
  const [formData, setFormData] = useState<DecisionFormData>({
    tax_agriculture: 'same',
    tax_trade: 'same',
    tax_banking: 'same',
    tax_craft: 'same',
    budget_priority_1: 'defense',
    budget_priority_2: 'infrastructure',
    budget_priority_3: 'public_welfare',
    economic_advisor: '',
    senior_judge: '',
    alliance: 'none',
    war_declarations: [],
    other_decisions: ''
  })

  // Load existing decision if any
  useEffect(() => {
    const loadExistingDecision = async () => {
      const { data, error } = await supabase
        .from('king_decisions')
        .select('*')
        .eq('run_id', runId)
        .eq('king_role_id', kingRoleId)
        .single()

      if (data && !error) {
        setExistingDecision(data)
        // Populate form with existing data
        const taxes = data.taxes as any
        const budgetPriorities = data.budget_priorities as any
        const appointments = data.appointments as any
        const intl = data.international_affairs as any

        setFormData({
          tax_agriculture: taxes?.agriculture || 'same',
          tax_trade: taxes?.trade || 'same',
          tax_banking: taxes?.banking || 'same',
          tax_craft: taxes?.craft || 'same',
          budget_priority_1: budgetPriorities?.priority_1 || 'defense',
          budget_priority_2: budgetPriorities?.priority_2 || 'infrastructure',
          budget_priority_3: budgetPriorities?.priority_3 || 'public_welfare',
          economic_advisor: appointments?.economic_advisor || '',
          senior_judge: appointments?.senior_judge || '',
          alliance: intl?.alliance || 'none',
          war_declarations: intl?.war_declarations || [],
          other_decisions: data.other_decisions || ''
        })
      }
    }

    loadExistingDecision()
  }, [runId, kingRoleId])

  const handleWarDeclarationToggle = (target: string) => {
    setFormData(prev => ({
      ...prev,
      war_declarations: prev.war_declarations.includes(target)
        ? prev.war_declarations.filter(t => t !== target)
        : [...prev.war_declarations, target]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Prepare JSONB structures
    const taxes = {
      agriculture: formData.tax_agriculture,
      trade: formData.tax_trade,
      banking: formData.tax_banking,
      craft: formData.tax_craft
    }

    const budget_priorities = {
      priority_1: formData.budget_priority_1,
      priority_2: formData.budget_priority_2,
      priority_3: formData.budget_priority_3
    }

    const appointments = {
      economic_advisor: formData.economic_advisor || null,
      senior_judge: formData.senior_judge || null
    }

    const international_affairs = {
      alliance: formData.alliance,
      war_declarations: formData.war_declarations
    }

    const decisionData = {
      run_id: runId,
      king_role_id: kingRoleId,
      taxes,
      budget_priorities,
      appointments,
      international_affairs,
      other_decisions: formData.other_decisions || null,
      final_speech_transcript: null
    }

    let error

    if (existingDecision) {
      // Update existing decision
      const result = await supabase
        .from('king_decisions')
        .update(decisionData)
        .eq('decision_id', existingDecision.decision_id)
      error = result.error
    } else {
      // Insert new decision
      const result = await supabase
        .from('king_decisions')
        .insert(decisionData)
      error = result.error
    }

    setLoading(false)

    if (error) {
      console.error('Error saving King decisions:', error)
      alert('Failed to save decisions: ' + error.message)
      return
    }

    alert('✅ Your Decisions Are Clear!')
    onSubmitSuccess()
  }

  // Get eligible roles for appointments (excluding the King)
  const eligibleRoles = allRoles.filter(r => r.role_id !== kingRoleId)

  // Helper to get clan name for a role
  const getClanName = (role: Role): string => {
    const clan = clans.find(c => c.clan_id === role.clan_id)
    return clan ? clan.name : 'Unknown Clan'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-4 border-amber-600 p-8 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-heading font-bold text-amber-900 mb-2">
            King's Decisions
          </h2>
          <p className="text-xl text-amber-800">
            As the newly elected King, you must now make the key decisions for Kourion
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tax Policy */}
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h3 className="text-2xl font-heading font-bold text-amber-900 mb-1 flex items-center gap-2">
            <span>📊</span>
            <span>Tax Policy</span>
          </h3>
          <p className="text-amber-700 mb-6">Set tax levels for each economic sector</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agriculture */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                🌾 Agriculture
              </label>
              <select
                value={formData.tax_agriculture}
                onChange={(e) => setFormData({ ...formData, tax_agriculture: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {TAX_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Trade */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                ⛵ Trade
              </label>
              <select
                value={formData.tax_trade}
                onChange={(e) => setFormData({ ...formData, tax_trade: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {TAX_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Banking */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                🏦 Banking
              </label>
              <select
                value={formData.tax_banking}
                onChange={(e) => setFormData({ ...formData, tax_banking: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {TAX_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Craft */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                🔨 Craft & Artisans
              </label>
              <select
                value={formData.tax_craft}
                onChange={(e) => setFormData({ ...formData, tax_craft: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {TAX_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budget Priorities */}
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h3 className="text-2xl font-heading font-bold text-amber-900 mb-1 flex items-center gap-2">
            <span>💰</span>
            <span>Budget Priorities</span>
          </h3>
          <p className="text-amber-700 mb-6">Rank your top 3 budget priorities</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Priority #1 (Highest)
              </label>
              <select
                value={formData.budget_priority_1}
                onChange={(e) => setFormData({ ...formData, budget_priority_1: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {BUDGET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Priority #2
              </label>
              <select
                value={formData.budget_priority_2}
                onChange={(e) => setFormData({ ...formData, budget_priority_2: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {BUDGET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Priority #3
              </label>
              <select
                value={formData.budget_priority_3}
                onChange={(e) => setFormData({ ...formData, budget_priority_3: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {BUDGET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h3 className="text-2xl font-heading font-bold text-amber-900 mb-1 flex items-center gap-2">
            <span>🏛️</span>
            <span>Key Appointments</span>
          </h3>
          <p className="text-amber-700 mb-6">Appoint trusted advisors to key positions</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Economic Advisor
              </label>
              <select
                value={formData.economic_advisor}
                onChange={(e) => setFormData({ ...formData, economic_advisor: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                <option value="">-- Select Advisor --</option>
                {eligibleRoles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.name} ({role.title}) - {getClanName(role)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Senior Judge
              </label>
              <select
                value={formData.senior_judge}
                onChange={(e) => setFormData({ ...formData, senior_judge: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                <option value="">-- Select Judge --</option>
                {eligibleRoles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.name} ({role.title}) - {getClanName(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* International Affairs */}
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h3 className="text-2xl font-heading font-bold text-amber-900 mb-1 flex items-center gap-2">
            <span>⚔️</span>
            <span>International Affairs</span>
          </h3>
          <p className="text-amber-700 mb-6">Choose alliances and declare conflicts</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Form Alliance
              </label>
              <select
                value={formData.alliance}
                onChange={(e) => setFormData({ ...formData, alliance: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50"
              >
                {ALLIANCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-3">
                Declare War (optional)
              </label>
              <div className="space-y-2">
                {WAR_TARGETS.map(target => (
                  <label key={target} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border-2 border-amber-200 hover:border-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.war_declarations.includes(target)}
                      onChange={() => handleWarDeclarationToggle(target)}
                      className="w-5 h-5"
                    />
                    <span className="text-amber-900 font-medium">{target}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Other Decisions */}
        <div className="bg-white rounded-xl border-4 border-amber-400 p-6">
          <h3 className="text-2xl font-heading font-bold text-amber-900 mb-1 flex items-center gap-2">
            <span>📝</span>
            <span>Other Decisions</span>
          </h3>
          <p className="text-amber-700 mb-4">Any additional policies or decrees</p>

          <textarea
            value={formData.other_decisions}
            onChange={(e) => setFormData({ ...formData, other_decisions: e.target.value })}
            rows={4}
            placeholder="Enter any other decisions, policies, or royal decrees..."
            className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50 resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-amber-600 text-white text-xl font-heading font-bold rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors shadow-lg"
          >
            {loading ? 'Saving...' : existingDecision ? '✅ Update Decisions' : 'Submit Decisions'}
          </button>
        </div>
      </form>
    </div>
  )
}
