/**
 * Clan Customization Component
 * Step 5 of Simulation Creation Wizard
 *
 * Allows facilitator to customize clan details:
 * - Description
 * - Priorities
 * - Interests
 * - Attitudes toward other clans
 */

import { useState } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

export function ClanCustomization() {
  const {
    wizard,
    updateClanCustomization,
    resetClanCustomizations,
  } = useSimulationStore()

  const template = wizard.selectedTemplate
  const clans = (template?.canonical_clans as any[]) || []
  const selectedClans = wizard.selectedClans

  const [expandedClan, setExpandedClan] = useState<string | null>(selectedClans[0] || null)

  const getClanData = (clanName: string) => {
    const templateClan = clans.find((c: any) => c.name === clanName)
    const customization = wizard.clanCustomizations[clanName]

    return {
      name: clanName,
      description: customization?.description ?? templateClan?.description ?? '',
      priorities: customization?.priorities ?? templateClan?.priorities ?? [],
      interests: customization?.interests ?? templateClan?.interests ?? [],
      attitudes: customization?.attitudes ?? templateClan?.attitudes ?? {},
    }
  }

  const hasCustomizations = Object.keys(wizard.clanCustomizations).length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-2xl text-primary">Clan Customization</h2>
        {hasCustomizations && (
          <button
            onClick={resetClanCustomizations}
            className="text-sm text-secondary hover:text-secondary-hover underline"
          >
            Reset to Defaults
          </button>
        )}
      </div>
      <p className="text-neutral-600 mb-6">
        Customize clan characteristics. Default values from the template are shown. Changes are optional.
      </p>

      {selectedClans.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No clans selected. Please go back to Step 3 to select clans.
        </div>
      ) : (
        <div className="space-y-3">
          {selectedClans.map((clanName) => {
            const clanData = getClanData(clanName)
            const isExpanded = expandedClan === clanName
            const isCustomized = !!wizard.clanCustomizations[clanName]

            return (
              <div
                key={clanName}
                className={`border rounded-lg transition-all ${
                  isCustomized ? 'border-warning bg-warning/5' : 'border-neutral-200 bg-white'
                }`}
              >
                {/* Clan Header */}
                <button
                  onClick={() => setExpandedClan(isExpanded ? null : clanName)}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-neutral-900">{clanName}</span>
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

                {/* Clan Details (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-neutral-200">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2 mt-4">
                        Description
                      </label>
                      <textarea
                        value={clanData.description}
                        onChange={(e) =>
                          updateClanCustomization(clanName, { description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="Describe this clan's role and characteristics..."
                      />
                    </div>

                    {/* Priorities */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Priorities
                        <span className="ml-2 text-xs text-neutral-500">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={clanData.priorities.join(', ')}
                        onChange={(e) => {
                          const priorities = e.target.value
                            .split(',')
                            .map(p => p.trim())
                            .filter(p => p.length > 0)
                          updateClanCustomization(clanName, { priorities })
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="e.g., Defense, Territory, Honor"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {clanData.priorities.map((priority, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                          >
                            {priority}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Interests
                        <span className="ml-2 text-xs text-neutral-500">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={clanData.interests.join(', ')}
                        onChange={(e) => {
                          const interests = e.target.value
                            .split(',')
                            .map(i => i.trim())
                            .filter(i => i.length > 0)
                          updateClanCustomization(clanName, { interests })
                        }}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="e.g., Warfare, Strategy, Resources"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {clanData.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 bg-secondary/10 text-secondary rounded text-xs"
                          >
                            {interest}
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
      )}

      {/* Help Text */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="font-medium text-neutral-900 mb-2 text-sm">Tips:</h4>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Customization is optional - default template values work great</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Click a clan to expand and edit its details</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Modified clans are highlighted in yellow</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Use priorities and interests to guide AI behavior and participant understanding</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
