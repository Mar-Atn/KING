/**
 * Clan Allegiance Reveal Animation (Participant View)
 *
 * Cinematic reveal of each clan's final decisions
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Clan, ClanVote } from '../../types/database'

interface ClanAllegianceRevealProps {
  clans: Clan[]
  votes: ClanVote[]
  onComplete: () => void
}

export function ClanAllegianceReveal({ clans, votes, onComplete }: ClanAllegianceRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showOath, setShowOath] = useState(false)
  const [showAction, setShowAction] = useState(false)

  const currentClan = clans[currentIndex]
  const currentVote = votes.find(v => v.clan_id === currentClan?.clan_id)

  useEffect(() => {
    if (!currentClan || !currentVote) return

    // Show oath after 1.5s
    const oathTimer = setTimeout(() => {
      setShowOath(true)
    }, 1500)

    // Show action after 3s
    const actionTimer = setTimeout(() => {
      setShowAction(true)
    }, 3000)

    // Move to next clan after 5s
    const nextTimer = setTimeout(() => {
      if (currentIndex < clans.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowOath(false)
        setShowAction(false)
      } else {
        // All clans shown, complete
        setTimeout(onComplete, 1500)
      }
    }, 5000)

    return () => {
      clearTimeout(oathTimer)
      clearTimeout(actionTimer)
      clearTimeout(nextTimer)
    }
  }, [currentIndex, clans.length, onComplete, currentClan, currentVote])

  if (!currentClan || !currentVote) {
    return null
  }

  const hasActions = !!currentClan.if_things_go_wrong

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl px-6">
        {/* Progress Dots */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-3">
          {clans.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx === currentIndex
                  ? 'bg-amber-400'
                  : idx < currentIndex
                  ? 'bg-amber-600'
                  : 'bg-neutral-600'
              }`}
            />
          ))}
        </div>

        {/* Clan Emblem */}
        <motion.div
          key={`emblem-${currentClan.clan_id}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-8"
        >
          {currentClan.emblem_url && (
            <img
              src={currentClan.emblem_url}
              alt={currentClan.name}
              className="w-48 h-48 object-contain drop-shadow-2xl"
            />
          )}
        </motion.div>

        {/* Clan Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-6xl font-heading font-bold mb-2"
            style={{ color: currentClan.color_hex }}
          >
            {currentClan.name}
          </h2>
        </motion.div>

        {/* Oath of Allegiance */}
        <AnimatePresence>
          {showOath && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className={`p-8 rounded-xl border-4 mb-6 ${
                currentVote.oath_of_allegiance
                  ? 'bg-green-900/40 border-green-500'
                  : 'bg-red-900/40 border-red-500'
              }`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {currentVote.oath_of_allegiance ? '✅' : '❌'}
                </div>
                <div
                  className={`text-3xl font-heading font-bold ${
                    currentVote.oath_of_allegiance ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {currentVote.oath_of_allegiance
                    ? 'Pledged Allegiance to the King'
                    : 'Refused Allegiance to the King'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contingency Actions */}
        {hasActions && (
          <AnimatePresence>
            {showAction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className={`p-8 rounded-xl border-4 ${
                  currentVote.initiate_actions
                    ? 'bg-red-900/60 border-red-600'
                    : 'bg-green-900/40 border-green-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {currentVote.initiate_actions ? '⚔️' : '🕊️'}
                  </div>
                  <div
                    className={`text-3xl font-heading font-bold ${
                      currentVote.initiate_actions ? 'text-red-300' : 'text-green-300'
                    }`}
                  >
                    {currentVote.initiate_actions
                      ? 'Voted to Act Against the King'
                      : 'Voted for Peace and Restraint'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
