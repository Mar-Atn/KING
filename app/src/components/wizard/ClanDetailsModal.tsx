/**
 * Clan Details Modal
 *
 * Displays detailed information about a clan including:
 * - Name and description
 * - About
 * - Key priorities
 * - Attitude to others
 * - If things go wrong
 */

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ClanLogo } from '../ClanLogo'

interface ClanDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  clan: {
    name: string
    sequence: number
    about?: string
    key_priorities?: string
    attitude_to_others?: string
    if_things_go_wrong?: string
    color_hex?: string
    logo_url?: string
  } | null
}

export function ClanDetailsModal({ isOpen, onClose, clan }: ClanDetailsModalProps) {
  if (!clan) return null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                {/* Header with clan logo and color */}
                <div className="flex items-start gap-4 mb-6">
                  <ClanLogo
                    src={clan.logo_url}
                    alt={clan.name}
                    size="lg"
                    circular
                  />
                  <div
                    className="flex-1 border-l-4 pl-4"
                    style={{ borderColor: clan.color_hex || '#2C5F7C' }}
                  >
                    <Dialog.Title className="text-2xl font-heading font-semibold text-neutral-900">
                      {clan.name}
                    </Dialog.Title>
                    <p className="text-sm text-neutral-500 mt-1">
                      Clan #{clan.sequence}
                    </p>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {/* About */}
                  {clan.about && (
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: clan.color_hex || '#2C5F7C' }}
                        />
                        About This Clan
                      </h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {clan.about}
                      </p>
                    </div>
                  )}

                  {/* Key Priorities */}
                  {clan.key_priorities && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h3 className="font-semibold text-primary mb-2">
                        Key Priorities
                      </h3>
                      {Array.isArray(clan.key_priorities) ? (
                        <ul className="space-y-1">
                          {clan.key_priorities.map((priority: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                              <span className="text-primary">•</span>
                              <span>{priority}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          {clan.key_priorities}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attitude to Others */}
                  {clan.attitude_to_others && (
                    <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                      <h3 className="font-semibold text-secondary mb-2">
                        Attitude to Other Clans
                      </h3>
                      {typeof clan.attitude_to_others === 'object' && !Array.isArray(clan.attitude_to_others) ? (
                        <div className="space-y-2">
                          {Object.entries(clan.attitude_to_others).map(([clanName, attitude]) => (
                            <div key={clanName} className="text-sm">
                              <span className="font-medium text-neutral-900">{clanName}:</span>{' '}
                              <span className="text-neutral-700">{attitude as string}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          {clan.attitude_to_others}
                        </p>
                      )}
                    </div>
                  )}

                  {/* If Things Go Wrong */}
                  {clan.if_things_go_wrong && (
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                      <h3 className="font-semibold text-warning mb-2">
                        If Things Go Wrong
                      </h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {clan.if_things_go_wrong}
                      </p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
