/**
 * Delete Simulation Modal Component
 *
 * Provides a two-step confirmation process for deleting simulation instances
 * Step 1: Confirm deletion intent
 * Step 2: Final confirmation with simulation name
 */

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useSimulationStore } from '../stores/simulationStore'
import type { Database } from '../types/database'

type SimRun = Database['public']['Tables']['sim_runs']['Row']

interface DeleteSimulationModalProps {
  isOpen: boolean
  onClose: () => void
  simulation: SimRun
  onDeleted?: () => void
}

export function DeleteSimulationModal({
  isOpen,
  onClose,
  simulation,
  onDeleted,
}: DeleteSimulationModalProps) {
  const [confirmationStep, setConfirmationStep] = useState<1 | 2>(1)
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { deleteSimulation } = useSimulationStore()

  // Reset modal state when closed
  const handleClose = () => {
    setConfirmationStep(1)
    setConfirmationInput('')
    setError(null)
    setIsDeleting(false)
    onClose()
  }

  // Handle first confirmation (proceed to step 2)
  const handleFirstConfirmation = () => {
    setConfirmationStep(2)
    setError(null)
  }

  // Handle back to step 1
  const handleBack = () => {
    setConfirmationStep(1)
    setConfirmationInput('')
    setError(null)
  }

  // Handle final deletion
  const handleFinalDelete = async () => {
    // Verify confirmation input matches simulation name
    if (confirmationInput !== simulation.run_name) {
      setError('Simulation name does not match. Please type it exactly.')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteSimulation(simulation.run_id)

      if (result.success) {
        // Notify parent and close
        onDeleted?.()
        handleClose()
      } else {
        setError(result.error || 'Failed to delete simulation')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                {confirmationStep === 1 ? (
                  // STEP 1: Initial Confirmation
                  <>
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 mb-4">
                      Delete Simulation?
                    </Dialog.Title>

                    <div className="mb-6">
                      <p className="text-sm text-neutral-700 mb-2">
                        You are about to delete:
                      </p>
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                        <p className="font-medium text-neutral-900">{simulation.run_name}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Version: {simulation.version} • Status: {simulation.status}
                        </p>
                      </div>

                      <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                        <p className="text-sm text-warning-900 font-medium mb-1">
                          ⚠️ Warning: This action cannot be undone
                        </p>
                        <p className="text-xs text-warning-700">
                          All associated data will be permanently deleted:
                        </p>
                        <ul className="text-xs text-warning-700 mt-2 list-disc list-inside space-y-1">
                          <li>All clans and roles</li>
                          <li>All phases and timing</li>
                          <li>All meetings and speeches</li>
                          <li>All votes and results</li>
                          <li>All event logs</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFirstConfirmation}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#C97435' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A85F2C'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C97435'}
                        disabled={isDeleting}
                      >
                        Continue to Delete
                      </button>
                    </div>
                  </>
                ) : (
                  // STEP 2: Final Confirmation with Name Input
                  <>
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 mb-4">
                      Final Confirmation Required
                    </Dialog.Title>

                    <div className="mb-6">
                      <p className="text-sm text-neutral-700 mb-4">
                        To confirm deletion, please type the exact simulation name:
                      </p>

                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-4">
                        <p className="font-mono text-sm font-medium text-neutral-900">
                          {simulation.run_name}
                        </p>
                      </div>

                      <input
                        type="text"
                        value={confirmationInput}
                        onChange={(e) => {
                          setConfirmationInput(e.target.value)
                          setError(null)
                        }}
                        placeholder="Type simulation name here"
                        className="w-full px-4 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                        disabled={isDeleting}
                      />

                      {error && (
                        <p className="mt-2 text-xs text-danger-600">
                          {error}
                        </p>
                      )}

                      <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                        <p className="text-xs text-danger-900 font-medium">
                          This is your last chance to cancel. Once deleted, this simulation cannot be recovered.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleBack}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                        disabled={isDeleting}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleFinalDelete}
                        disabled={isDeleting || confirmationInput !== simulation.run_name}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: confirmationInput === simulation.run_name && !isDeleting ? '#B94A48' : '#999' }}
                        onMouseEnter={(e) => {
                          if (confirmationInput === simulation.run_name && !isDeleting) {
                            e.currentTarget.style.backgroundColor = '#9A3E3C'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (confirmationInput === simulation.run_name && !isDeleting) {
                            e.currentTarget.style.backgroundColor = '#B94A48'
                          }
                        }}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
