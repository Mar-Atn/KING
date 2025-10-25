/**
 * Clan & Role Selection Component
 * Step 3 of Simulation Creation Wizard
 *
 * Allows facilitator to:
 * - Select which clans to include (all selected by default)
 * - Select which roles to include (all selected by default)
 * - Assign which roles are AI vs Human
 */

import { useEffect } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'

export function ClanRoleSelection() {
  const {
    wizard,
    initializeRoleAssignments,
    toggleClan,
    toggleRole,
    setRoleAI,
  } = useSimulationStore()

  // Initialize role assignments when component mounts
  useEffect(() => {
    if (wizard.roleAssignments.length === 0) {
      initializeRoleAssignments()
    }
  }, [wizard.roleAssignments.length, initializeRoleAssignments])

  const template = wizard.selectedTemplate
  const clans = template?.canonical_clans as any[] || []

  // Calculate statistics
  const selectedClansCount = wizard.selectedClans.length
  const selectedRoles = wizard.roleAssignments.filter(r => r.isSelected)
  const selectedRolesCount = selectedRoles.length
  const aiRolesCount = selectedRoles.filter(r => r.isAI).length
  const humanRolesCount = selectedRolesCount - aiRolesCount

  // Validate counts
  const hasError = selectedRolesCount !== wizard.totalParticipants
  const aiMismatch = aiRolesCount !== wizard.aiParticipants
  const humanMismatch = humanRolesCount !== wizard.humanParticipants

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
              {selectedRolesCount} / {wizard.totalParticipants}
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
            You must select exactly {wizard.totalParticipants} roles to match your participant count
          </div>
        )}
        {aiMismatch && !hasError && (
          <div className="mt-4 text-sm text-warning text-center">
            You have {aiRolesCount} AI roles selected, but configured {wizard.aiParticipants} AI participants
          </div>
        )}
      </div>

      {/* Clan Selection */}
      <div className="space-y-6">
        {clans.map((clan: any) => {
          const clanRoles = wizard.roleAssignments.filter(r => r.clan === clan.name)
          const selectedClanRoles = clanRoles.filter(r => r.isSelected)
          const isClanSelected = wizard.selectedClans.includes(clan.name)

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
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">{clan.name}</h3>
                    <p className="text-sm text-neutral-600">{clan.description}</p>
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
                          ? 'bg-neutral-50 hover:bg-neutral-100'
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

                      {/* Role Information */}
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 text-sm">
                          {role.name}
                          {role.position && (
                            <span className="ml-2 text-xs text-neutral-500">({role.position})</span>
                          )}
                        </div>
                        {role.age && (
                          <div className="text-xs text-neutral-600">Age: {role.age}</div>
                        )}
                      </div>

                      {/* AI Toggle */}
                      {role.isSelected && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRoleAI(role.sequence, false)}
                            className={`px-3 py-1 text-xs font-medium rounded-l-md transition-colors ${
                              !role.isAI
                                ? 'bg-primary text-white'
                                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                            }`}
                          >
                            Human
                          </button>
                          <button
                            onClick={() => setRoleAI(role.sequence, true)}
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
            <span>Total selected roles must match your total participant count ({wizard.totalParticipants})</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
