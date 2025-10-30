import { motion, AnimatePresence } from 'framer-motion'
import { X, PlayCircle, Clock } from 'lucide-react'
import type { Phase } from '../types/database'

interface PhaseChangeModalProps {
  isOpen: boolean
  onClose: () => void
  newPhase: Phase | null
  previousPhaseName?: string
}

export function PhaseChangeModal({
  isOpen,
  onClose,
  newPhase,
  previousPhaseName,
}: PhaseChangeModalProps) {
  if (!newPhase) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-amber-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-amber-600 hover:text-amber-800 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Animated icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    duration: 0.6,
                    delay: 0.2,
                    bounce: 0.5
                  }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    {/* Pulsing background circle */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.2, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-amber-400 rounded-full blur-xl"
                    />

                    {/* Icon */}
                    <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-full p-4 shadow-lg">
                      <PlayCircle className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-amber-900 mb-2"
                >
                  {previousPhaseName === newPhase.name ? 'Phase Restarted!' : 'New Phase Started!'}
                </motion.h2>

                {/* Previous phase (if exists and different) */}
                {previousPhaseName && previousPhaseName !== newPhase.name && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-amber-700 mb-4"
                  >
                    {previousPhaseName} → <strong>{newPhase.name}</strong>
                  </motion.p>
                )}

                {/* Phase restart message */}
                {previousPhaseName === newPhase.name && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-amber-700 mb-4"
                  >
                    The facilitator has reset this phase. Timer and voting have been restarted.
                  </motion.p>
                )}

                {/* Current phase name */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-6 border border-amber-200 shadow-inner"
                >
                  <h3 className="text-2xl font-bold text-amber-900 mb-3">
                    {newPhase.name}
                  </h3>

                  {/* Phase duration */}
                  <div className="flex items-center justify-center gap-2 text-amber-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Duration: {newPhase.actual_duration_minutes || newPhase.default_duration_minutes} minutes
                    </span>
                  </div>

                  {/* Phase description if exists */}
                  {newPhase.description && (
                    <p className="text-sm text-amber-800 mt-3 leading-relaxed">
                      {newPhase.description}
                    </p>
                  )}
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-200"
                >
                  Let's Go!
                </motion.button>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
