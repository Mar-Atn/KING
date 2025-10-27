/**
 * Clan & Role Selection Component
 * Step 3 of Simulation Creation Wizard
 *
 * Allows facilitator to:
 * - Select which clans to include (all selected by default)
 * - Select which roles to include (all selected by default)
 * - Assign which roles are AI vs Human
 */

import { useEffect, useState } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import { useRoleSelectionStore } from '../../stores/roleSelectionStore'
import { ClanDetailsModal } from './ClanDetailsModal'
import { RoleDetailsModal } from './RoleDetailsModal'

export function ClanRoleSelection() {
  const { config } = useSimulationStore()
  const {
    roleSelection,
    initializeRoleAssignments,
    toggleClan,
    toggleRole,
    setRoleAI,
  } = useRoleSelectionStore()

  // Modal state
  const [clanModalOpen, setClanModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedClanForDetails, setSelectedClanForDetails] = useState<any>(null)
  const [selectedRoleForDetails, setSelectedRoleForDetails] = useState<any>(null)

  // Handlers
  const handleClanInfoClick = (e: React.MouseEvent, clan: any) => {
    e.stopPropagation()

    // The clan object already has all the data from template.canonical_clans
    setSelectedClanForDetails(clan)
    setClanModalOpen(true)
  }

  const handleRoleInfoClick = (e: React.MouseEvent, roleFromAssignments: any) => {
    e.stopPropagation()

    // Get full role details from template's canonical_roles
    const canonicalRoles = template?.canonical_roles as any[] || []
    const fullRoleData = canonicalRoles.find(r => r.sequence === roleFromAssignments.sequence)

    // Merge assignment data with canonical data
    const completeRole = {
      ...fullRoleData,
      ...roleFromAssignments,
      // Ensure we keep canonical data for background, traits, interests
      background: fullRoleData?.background,
      character_traits: fullRoleData?.character_traits,
      interests: fullRoleData?.interests,
    }

    setSelectedRoleForDetails(completeRole)
    setRoleModalOpen(true)
  }

  // Initialize role assignments when component mounts
  useEffect(() => {
    if (roleSelection.roleAssignments.length === 0 && config.selectedTemplate) {
      initializeRoleAssignments(config.selectedTemplate, config.totalParticipants, config.aiParticipants)
    }
  }, [roleSelection.roleAssignments.length, config.selectedTemplate, config.totalParticipants, config.aiParticipants, initializeRoleAssignments])

  const template = config.selectedTemplate
  const clans = template?.canonical_clans as any[] || []

  // Calculate statistics
  const selectedClansCount = roleSelection.selectedClans.length
  const selectedRoles = roleSelection.roleAssignments.filter(r => r.isSelected)
  const selectedRolesCount = selectedRoles.length
  const aiRolesCount = selectedRoles.filter(r => r.isAI).length
  const humanRolesCount = selectedRolesCount - aiRolesCount

  // Validate counts
  const hasError = selectedRolesCount !== config.totalParticipants
  const aiMismatch = aiRolesCount !== config.aiParticipants
  const humanMismatch = humanRolesCount !== config.humanParticipants

  return (
    <div>
      <h2 className="font-heading text-2xl text-primary mb-2">Clan & Role Selection</h2>
      <p className="text-neutral-600 mb-6">
        Select which clans and roles to include in your simulation, and assign AI participants.
      </p>

      {/* Summary Statistics */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold ${selectedClansCount === 0 ? 'text-error' : 'text-primary'}`}>
              {selectedClansCount} / {clans.length}
            </div>
            <div className="text-xs text-neutral-600">Clans Selected</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${hasError ? 'text-error' : 'text-success'}`}>
              {selectedRolesCount} / {config.totalParticipants}
            </div>
            <div className="text-xs text-neutral-600">Roles Selected</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${aiMismatch ? 'text-warning' : 'text-secondary'}`}>
              {aiRolesCount} AI / {humanRolesCount} Human
            </div>
            <div className="text-xs text-neutral-600">AI vs Human</div>
          </div>
        </div>

        {/* Validation Messages */}
        {hasError && (
          <div className="mt-4 text-sm text-error text-center">
            You must select exactly {config.totalParticipants} roles to match your participant count
          </div>
        )}
        {aiMismatch && !hasError && (
          <div className="mt-4 text-sm text-warning text-center">
            You have {aiRolesCount} AI roles selected, but configured {config.aiParticipants} AI participants
          </div>
        )}
      </div>

      {/* Clan Selection */}
      <div className="space-y-6">
        {clans.map((clan: any) => {
          const clanRoles = roleSelection.roleAssignments.filter(r => r.clan === clan.name)
          const selectedClanRoles = clanRoles.filter(r => r.isSelected)
          const isClanSelected = roleSelection.selectedClans.includes(clan.name)

          return (
            <div
              key={clan.name}
              className={`border rounded-lg transition-all ${
                isClanSelected
                  ? 'border-primary bg-white'
                  : 'border-neutral-200 bg-neutral-50 opacity-60'
              }`}
            >
              {/* Clan Header */}
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isClanSelected}
                    onChange={() => toggleClan(clan.name)}
                    className="w-5 h-5 text-primary focus:ring-primary rounded"
                  />
                  <div
                    className="flex-1 cursor-pointer hover:bg-neutral-50 -m-2 p-2 rounded transition-colors"
                    onClick={(e) => handleClanInfoClick(e, clan)}
                    title="Click to view clan details"
                  >
                    <h3 className="font-medium text-neutral-900 flex items-center gap-2">
                      {clan.name}
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </h3>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {clan.about?.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {selectedClanRoles.length} / {clanRoles.length} roles
                  </div>
                </div>
              </div>

              {/* Clan Roles */}
              {isClanSelected && (
                <div className="p-4 space-y-2">
                  {clanRoles.map((role) => (
                    <div
                      key={role.sequence}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        role.isSelected
                          ? 'bg-neutral-50'
                          : 'bg-white opacity-50'
                      }`}
                    >
                      {/* Role Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={role.isSelected}
                        onChange={() => toggleRole(role.sequence)}
                        className="w-4 h-4 text-primary focus:ring-primary rounded"
                      />

                      {/* Role Information - Clickable */}
                      <div
                        className="flex-1 cursor-pointer hover:bg-white -m-1 p-1 rounded transition-colors"
                        onClick={(e) => handleRoleInfoClick(e, role)}
                        title="Click to view character details"
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-neutral-900 text-sm">
                            {role.name}
                            {role.position && (
                              <span className="ml-2 text-xs text-neutral-500">({role.position})</span>
                            )}
                          </div>
                          <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {role.age && (
                          <div className="text-xs text-neutral-600">Age: {role.age}</div>
                        )}
                      </div>

                      {/* AI Toggle */}
                      {role.isSelected && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRoleAI(role.sequence, false)
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-l-md transition-colors ${
                              !role.isAI
                                ? 'bg-primary text-white'
                                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                            }`}
                          >
                            Human
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRoleAI(role.sequence, true)
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-r-md transition-colors ${
                              role.isAI
                                ? 'bg-secondary text-white'
                                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                            }`}
                          >
                            AI
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="font-medium text-neutral-900 mb-2 text-sm">Tips:</h4>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Click on clan names or role names to view their full detailed descriptions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Uncheck a clan to exclude all its roles at once</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>You can also select/deselect individual roles within a clan</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>AI roles are auto-assigned based on your participant count, but you can adjust manually</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Total selected roles must match your total participant count ({config.totalParticipants})</span>
          </li>
        </ul>
      </div>

      {/* Modals */}
      <ClanDetailsModal
        isOpen={clanModalOpen}
        onClose={() => setClanModalOpen(false)}
        clan={selectedClanForDetails}
      />
      <RoleDetailsModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        role={selectedRoleForDetails}
      />
    </div>
  )
}
