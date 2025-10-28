/**
 * Role Details Modal
 *
 * Displays detailed information about a character role including:
 * - Name, position, age, clan
 * - Background
 * - Character traits
 * - Interests/aspirations
 */

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Avatar } from '../Avatar'

interface RoleDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  role: {
    sequence: number
    name: string
    clan: string
    age?: number
    position?: string
    background?: string
    character_traits?: string
    interests?: string
    avatar_url?: string
  } | null
}

export function RoleDetailsModal({ isOpen, onClose, role }: RoleDetailsModalProps) {
  if (!role) return null

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
                {/* Header with avatar */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar
                    src={role.avatar_url}
                    alt={role.name}
                    size="lg"
                  />
                  <div className="flex-1 border-l-4 border-primary pl-4">
                    <Dialog.Title className="text-2xl font-heading font-semibold text-neutral-900">
                      {role.name}
                    </Dialog.Title>
                    <div className="mt-2 space-y-1">
                      {role.position && (
                        <p className="text-sm text-neutral-600">
                          <span className="font-medium">Position:</span> {role.position}
                        </p>
                      )}
                      {role.age && (
                        <p className="text-sm text-neutral-600">
                          <span className="font-medium">Age:</span> {role.age} years
                        </p>
                      )}
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">Clan:</span> {role.clan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Background */}
                  {role.background && (
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Background
                      </h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {role.background}
                      </p>
                    </div>
                  )}

                  {/* Character Traits */}
                  {role.character_traits && (
                    <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                      <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Character Traits
                      </h3>
                      <div className="space-y-2">
                        {role.character_traits.split(',').map((trait, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-secondary mt-1">•</span>
                            <span className="text-sm text-neutral-700 flex-1">
                              {trait.trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests / Aspirations */}
                  {role.interests && (
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Interests & Aspirations
                      </h3>
                      <p className="text-sm text-neutral-700 leading-relaxed italic">
                        {role.interests}
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
