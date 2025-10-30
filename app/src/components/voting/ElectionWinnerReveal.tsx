import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VoteSession, VoteResult, Role, Clan } from '../../types/database'

interface ElectionRevealData {
  session: VoteSession
  result: VoteResult
  winner: Role | null
  clan: Clan | null
  roundNumber: 1 | 2
  thresholdMet: boolean
  topCandidates?: { role: Role; voteCount: number }[]
}

interface ElectionWinnerRevealProps {
  revealData: ElectionRevealData
  onComplete: () => void
}

export function ElectionWinnerReveal({ revealData, onComplete }: ElectionWinnerRevealProps) {
  const [showBackground, setShowBackground] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showWinner, setShowWinner] = useState(false)

  useEffect(() => {
    // Step 1: Show background
    const bgTimer = setTimeout(() => {
      setShowBackground(true)
    }, 300)

    // Step 2: Show result announcement
    const resultTimer = setTimeout(() => {
      setShowResult(true)
    }, 1000)

    // Step 3: Show winner or runoff message
    const winnerTimer = setTimeout(() => {
      setShowWinner(true)
    }, 2500)

    // Step 4: Complete after showing everything
    const completeTimer = setTimeout(() => {
      onComplete()
    }, revealData.thresholdMet ? 7000 : 6000)

    return () => {
      clearTimeout(bgTimer)
      clearTimeout(resultTimer)
      clearTimeout(winnerTimer)
      clearTimeout(completeTimer)
    }
  }, [revealData.thresholdMet, onComplete])

  const totalVotes = revealData.result.total_votes_cast || 0
  const winnerVotes = revealData.winner
    ? (revealData.result.vote_counts as Record<string, number>)?.[revealData.winner.role_id] || 0
    : 0
  const winnerPercentage = totalVotes > 0 ? Math.round((winnerVotes / totalVotes) * 100) : 0

  return (
    <AnimatePresence>
      {showBackground && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
          <div className="text-center max-w-4xl px-8">
            {/* Round Announcement */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-5xl font-heading font-bold text-amber-400 mb-8">
                    Vote {revealData.roundNumber} Results
                  </h2>
                  <div className="text-2xl text-amber-200 mb-12">
                    {totalVotes} votes cast
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Winner or Runoff Announcement */}
            <AnimatePresence>
              {showWinner && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                  {revealData.thresholdMet && revealData.winner ? (
                    // Winner Announcement
                    <div>
                      <div className="text-8xl mb-8">👑</div>
                      <h3 className="text-7xl font-heading font-bold text-white mb-6">
                        {revealData.winner.name}
                      </h3>
                      {revealData.clan && (
                        <p
                          className="text-4xl font-medium mb-6"
                          style={{ color: revealData.clan.color_hex || '#FCD34D' }}
                        >
                          {revealData.winner.title}
                        </p>
                      )}
                      <div className="bg-amber-900 bg-opacity-50 rounded-2xl p-8 border-4 border-amber-400">
                        <div className="text-5xl font-bold text-white mb-2">
                          {winnerVotes} votes
                        </div>
                        <div className="text-3xl text-amber-200">
                          {winnerPercentage}% of all votes
                        </div>
                      </div>
                      <div className="mt-8 text-3xl font-semibold text-amber-300">
                        New King Elected!
                      </div>
                    </div>
                  ) : (
                    // Runoff Announcement
                    <div>
                      <div className="text-6xl mb-8">⚖️</div>
                      <h3 className="text-6xl font-heading font-bold text-amber-300 mb-8">
                        No Clear Winner
                      </h3>
                      <div className="bg-amber-900 bg-opacity-50 rounded-2xl p-8 border-4 border-amber-600 mb-8">
                        <div className="text-3xl text-amber-200 mb-4">
                          No candidate reached the required threshold
                        </div>
                        <div className="text-5xl font-bold text-white">
                          Runoff Required
                        </div>
                      </div>
                      {revealData.topCandidates && revealData.topCandidates.length > 0 && (
                        <div className="space-y-4">
                          <div className="text-2xl text-amber-200 mb-4">
                            Advancing to Vote 2:
                          </div>
                          {revealData.topCandidates.map(({ role, voteCount }) => (
                            <div
                              key={role.role_id}
                              className="bg-amber-900 bg-opacity-30 rounded-xl p-6 border-2 border-amber-500"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={role.avatar_url || '/placeholder-avatar.png'}
                                    alt={role.name}
                                    className="w-20 h-20 rounded-full border-4 border-amber-400"
                                  />
                                  <div className="text-left">
                                    <div className="text-3xl font-bold text-white">
                                      {role.name}
                                    </div>
                                    <div className="text-xl text-amber-300">
                                      {role.title}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-4xl font-bold text-amber-400">
                                  {voteCount} votes
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
