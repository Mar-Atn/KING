import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VoteSession, VoteResult, Clan, Role } from '../../types/database'

interface ClanReveal {
  clan: Clan
  nominee: Role
  session: VoteSession
  result: VoteResult
}

interface ClanNominationsRevealProps {
  reveals: ClanReveal[]
  onComplete: () => void
}

export function ClanNominationsReveal({ reveals, onComplete }: ClanNominationsRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showClan, setShowClan] = useState(false)
  const [showNominee, setShowNominee] = useState(false)

  useEffect(() => {
    if (reveals.length === 0) return

    // Step 1: Show clan logo
    const clanTimer = setTimeout(() => {
      setShowClan(true)
    }, 500)

    // Step 2: Show nominee after 2 seconds
    const nomineeTimer = setTimeout(() => {
      setShowNominee(true)
    }, 2500)

    // Step 3: Move to next clan or complete
    const nextTimer = setTimeout(() => {
      if (currentIndex < reveals.length - 1) {
        // Reset for next clan
        setShowClan(false)
        setShowNominee(false)
        setCurrentIndex(currentIndex + 1)
      } else {
        // All clans revealed, complete after a pause
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    }, 5000)

    return () => {
      clearTimeout(clanTimer)
      clearTimeout(nomineeTimer)
      clearTimeout(nextTimer)
    }
  }, [currentIndex, reveals.length, onComplete])

  if (reveals.length === 0) return null

  const current = reveals[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Clan Logo Reveal */}
        <AnimatePresence>
          {showClan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl">
                <img
                  src={current.clan.emblem_url || '/placeholder-clan.png'}
                  alt={current.clan.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-5xl font-heading font-bold text-amber-400 mb-2">
                {current.clan.name}
              </h2>
              <p className="text-2xl text-amber-200">
                has chosen their nominee
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nominee Avatar Reveal */}
        <AnimatePresence>
          {showNominee && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mt-8"
            >
              <div
                className="w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 shadow-2xl"
                style={{ borderColor: current.clan.color_hex || '#D97706' }}
              >
                <img
                  src={current.nominee.avatar_url || '/placeholder-avatar.png'}
                  alt={current.nominee.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-6xl font-heading font-bold text-white mb-4">
                {current.nominee.name}
              </h3>
              <p
                className="text-3xl font-medium"
                style={{ color: current.clan.color_hex || '#FCD34D' }}
              >
                {current.nominee.title}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        {reveals.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
            {reveals.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-amber-400'
                    : index < currentIndex
                    ? 'bg-amber-600'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
