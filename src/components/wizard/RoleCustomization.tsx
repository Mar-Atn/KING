/**
 * Role Customization Component
 * Step 6 of Simulation Creation Wizard
 *
 * Allows facilitator to customize role details:
 * - Name
 * - Background story
 * - Traits/characteristics
 * - Position/title
 * - Age
 */

import { useState } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

export function RoleCustomization() {
  const {
    wizard,
    updateRoleCustomization,
    resetRoleCustomizations,
  } = useSimulationStore()

  const template = wizard.selectedTemplate
  const roles = (template?.canonical_roles as any[]) || []
  const selectedRoles = wizard.roleAssignments.filter(r => r.isSelected)

  const [selectedClan, setSelectedClan] = useState<string>('all')
  const [expandedRole, setExpandedRole] = useState<number | null>(null)

  const getRoleData = (sequence: number) => {
    const templateRole = roles.find((r: any) => r.sequence === sequence)
    const customization = wizard.roleCustomizations[sequence]
    const assignment = wizard.roleAssignments.find(r => r.sequence === sequence)

    return {
      sequence,
      name: customization?.name ?? assignment?.name ?? templateRole?.name ?? '',
      clan: assignment?.clan ?? templateRole?.clan ?? '',
      background: customization?.background ?? templateRole?.background ?? '',
      traits: customization?.traits ?? templateRole?.traits ?? [],
      position: customization?.position ?? assignment?.position ?? templateRole?.position ?? '',
      age: customization?.age ?? assignment?.age ?? templateRole?.age,
      isAI: assignment?.isAI ?? false,
    }
  }

  // Filter roles by clan
  const filteredRoles = selectedRoles.filter(role =>
    selectedClan === 'all' || role.clan === selectedClan
  )

  // Get unique clans from selected roles
  const clansInSelection = Array.from(new Set(selectedRoles.map(r => r.clan)))

  const hasCustomizations = Object.keys(wizard.roleCustomizations).length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-2xl text-primary">Role Customization</h2>
        {hasCustomizations && (
          <button
            onClick={resetRoleCustomizations}
            className="text-sm text-secondary hover:text-secondary-hover underline"
          >
            Reset to Defaults
          </button>
        )}
      </div>
      <p className="text-neutral-600 mb-6">
        Customize individual character roles. Default template values are shown. Changes are optional.
      </p>

      {selectedRoles.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No roles selected. Please go back to Step 3 to select roles.
        </div>
      ) : (
        <>
          {/* Clan Filter */}
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-neutral-900">Filter by clan:</label>
            <select
              value={selectedClan}
              onChange={(e) => {
                setSelectedClan(e.target.value)
                setExpandedRole(null)
              }}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">All Clans ({selectedRoles.length} roles)</option>
              {clansInSelection.map(clan => {
                const count = selectedRoles.filter(r => r.clan === clan).length
                return (
                  <option key={clan} value={clan}>
                    {clan} ({count} roles)
                  </option>
                )
              })}
            </select>
          </div>

          {/* Roles List */}
          <div className="space-y-2">
            {filteredRoles.map((role) => {
              const roleData = getRoleData(role.sequence)
              const isExpanded = expandedRole === role.sequence
              const isCustomized = !!wizard.roleCustomizations[role.sequence]

              return (
                <div
                  key={role.sequence}
                  className={`border rounded-lg transition-all ${
                    isCustomized ? 'border-warning bg-warning/5' : 'border-neutral-200 bg-white'
                  }`}
                >
                  {/* Role Header */}
                  <button
                    onClick={() => setExpandedRole(isExpanded ? null : role.sequence)}
                    className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-neutral-900">{roleData.name}</span>
                      <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded">
                        {roleData.clan}
                      </span>
                      {roleData.isAI && (
                        <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                          AI
                        </span>
                      )}
                      {isCustomized && (
                        <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded">
                          Modified
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-neutral-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Role Details (Expanded) */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-neutral-200">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {/* Position */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
                            Position/Title
                          </label>
                          <input
                            type="text"
                            value={roleData.position}
                            onChange={(e) =>
                              updateRoleCustomization(role.sequence, { position: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="e.g., General, Elder, Merchant"
                          />
                        </div>

                        {/* Age */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            min="18"
                            max="80"
                            value={roleData.age || ''}
                            onChange={(e) => {
                              const age = parseInt(e.target.value)
                              if (!isNaN(age)) {
                                updateRoleCustomization(role.sequence, { age })
                              }
                            }}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Age"
                          />
                        </div>
                      </div>

                      {/* Background */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-1">
                          Background Story
                        </label>
                        <textarea
                          value={roleData.background}
                          onChange={(e) =>
                            updateRoleCustomization(role.sequence, { background: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder="Character's backstory, motivations, and history..."
                        />
                      </div>

                      {/* Traits */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-1">
                          Traits/Characteristics
                          <span className="ml-2 text-xs text-neutral-500">(comma-separated)</span>
                        </label>
                        <input
                          type="text"
                          value={roleData.traits.join(', ')}
                          onChange={(e) => {
                            const traits = e.target.value
                              .split(',')
                              .map(t => t.trim())
                              .filter(t => t.length > 0)
                            updateRoleCustomization(role.sequence, { traits })
                          }}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder="e.g., Strategic, Honorable, Ambitious"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {roleData.traits.map((trait, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="font-medium text-neutral-900 mb-2 text-sm">Tips:</h4>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Customization is optional - template defaults provide rich characters</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Use the clan filter to focus on specific groups</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>AI roles use background and traits to guide behavior</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Backgrounds help participants understand character motivations</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
