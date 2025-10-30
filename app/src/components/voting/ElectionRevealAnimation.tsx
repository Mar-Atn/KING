/**
 * Election Reveal Animation - Coin Version
 *
 * Cinematic reveal showing:
 * 1. Candidates displayed at top with their vote stacks
 * 2. Each vote appears as a coin that fades from center
 * 3. Coin flies to the chosen candidate and stacks up
 * 4. Threshold line shows how many votes needed to win
 * 5. Final announcement with "Back to Dashboard" button
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, RotateCcw } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { VoteSession, VoteResult, Role, Clan } from '../../types/database'

interface CoinAnimation {
  id: string
  candidateId: string
  stackPosition: number // Which position in the stack (0, 1, 2, ...)
  voterRole?: Role // For open voting
  voterClan?: Clan | null // For open voting
  chosenRole?: Role // Chosen candidate
}

interface ElectionRevealAnimationProps {
  session: VoteSession
  result: VoteResult
  candidates: Role[]
  allRoles: Role[]
  clans: Clan[]
  threshold: number
  onComplete: () => void
}

export function ElectionRevealAnimation({
  session,
  result,
  candidates,
  allRoles,
  clans,
  threshold,
  onComplete
}: ElectionRevealAnimationProps) {
  const [currentVoteIndex, setCurrentVoteIndex] = useState(-1)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [animatingCoins, setAnimatingCoins] = useState<CoinAnimation[]>([])
  const [showFinalAnnouncement, setShowFinalAnnouncement] = useState(false)
  const [voteSequence, setVoteSequence] = useState<Array<{candidateId: string, voterId?: string}>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpenVoting, setIsOpenVoting] = useState(false)

  // Load all votes and prepare reveal sequence
  useEffect(() => {
    const loadVotes = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')

        // Check if voting is open/public
        const isOpen = session.transparency_level === 'open' || session.transparency_level === 'public'
        setIsOpenVoting(isOpen)

        // Get all votes (with voter info if open voting)
        const { data: votes, error } = await supabase
          .from('votes')
          .select(isOpen ? 'chosen_role_id, voter_role_id' : 'chosen_role_id')
          .eq('session_id', session.session_id)
          .not('chosen_role_id', 'is', null)

        if (error) {
          console.error('Error loading votes:', error)
          setIsLoading(false)
          return
        }

        // Build sequence
        const sequence = (votes || []).map(v => ({
          candidateId: v.chosen_role_id!,
          voterId: isOpen ? v.voter_role_id : undefined
        }))

        setVoteSequence(sequence)
        setIsLoading(false)
      } catch (err) {
        console.error('Error in loadVotes:', err)
        setIsLoading(false)
      }
    }

    loadVotes()
  }, [session.session_id, session.transparency_level])

  // Animate through votes sequentially
  useEffect(() => {
    if (isLoading || voteSequence.length === 0) return

    if (currentVoteIndex < voteSequence.length - 1) {
      const timer = setTimeout(() => {
        const nextIndex = currentVoteIndex + 1
        const voteData = voteSequence[nextIndex]
        const candidateId = voteData.candidateId
        const currentCount = voteCounts[candidateId] || 0

        // Get voter info if open voting
        let voterRole: Role | undefined
        let voterClan: Clan | null | undefined
        if (isOpenVoting && voteData.voterId) {
          voterRole = allRoles.find(r => r.role_id === voteData.voterId)
          voterClan = voterRole ? clans.find(c => c.clan_id === voterRole.clan_id) || null : null
        }

        // Get chosen candidate info for display
        const chosenRole = candidates.find(c => c.role_id === candidateId)

        // Add coin animation
        const newCoin: CoinAnimation = {
          id: `coin-${nextIndex}`,
          candidateId,
          stackPosition: currentCount,
          voterRole,
          voterClan,
          chosenRole
        }

        setAnimatingCoins(prev => [...prev, newCoin])

        // Increment vote counter
        setVoteCounts(prev => ({
          ...prev,
          [candidateId]: currentCount + 1
        }))

        setCurrentVoteIndex(nextIndex)

        // Remove coin from animating list after animation completes
        setTimeout(() => {
          setAnimatingCoins(prev => prev.filter(c => c.id !== newCoin.id))
        }, 1800) // Coin animation duration

      }, 1200) // 1.2s per vote (20% slower)

      return () => clearTimeout(timer)
    } else if (currentVoteIndex === voteSequence.length - 1) {
      // All votes revealed, show final announcement after a pause
      const timer = setTimeout(() => {
        setShowFinalAnnouncement(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [currentVoteIndex, voteSequence, isLoading, voteCounts, isOpenVoting, allRoles, clans, candidates])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-2xl font-heading">Loading results...</div>
      </div>
    )
  }

  const resultsData = result.results_data as any
  const thresholdMet = resultsData?.threshold_met || false
  const winner = thresholdMet ? resultsData?.winner : null
  const totalVotes = voteSequence.length
  const progressPercent = totalVotes > 0 ? Math.round(((currentVoteIndex + 1) / totalVotes) * 100) : 0

  // Detect if this is Vote 2 (final round)
  const isVote2 = session.proposal_title?.toLowerCase().includes('vote 2') || false

  // Get runoff candidates from results_data (includes all tied candidates)
  const runoffCandidatesData = resultsData?.runoff_candidates || []
  const runoffCandidates = runoffCandidatesData.map((rc: any) => {
    const candidate = candidates.find(c => c.role_id === rc.role_id)
    return {
      candidate: candidate!,
      votes: rc.vote_count
    }
  })

  // Trigger confetti for King election in Vote 2
  useEffect(() => {
    if (showFinalAnnouncement && thresholdMet && winner && isVote2) {
      const duration = 5000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [showFinalAnnouncement, thresholdMet, winner, isVote2])

  // Function to reset animation
  const resetAnimation = () => {
    setCurrentVoteIndex(-1)
    setVoteCounts({})
    setAnimatingCoins([])
    setShowFinalAnnouncement(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 overflow-auto">
      <div className="min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-amber-400 mb-2">
            {session.proposal_title}
          </h1>
          <p className="text-amber-300 text-lg">Vote Results</p>
        </div>

        {/* Progress Bar */}
        {!showFinalAnnouncement && (
          <div className="max-w-2xl mx-auto w-full mb-8">
            <div className="flex justify-between text-sm text-neutral-400 mb-2">
              <span>Revealing votes...</span>
              <span>{currentVoteIndex + 1} / {totalVotes}</span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-3">
              <div
                className="h-3 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Spacer for announcement text (reserve space between header and candidates) */}
        {!showFinalAnnouncement && (
          <div className="h-24 mb-6"></div>
        )}

        {/* Candidates with Coin Stacks */}
        <div className="flex-1 flex items-center justify-center mt-8">
          <div className="flex flex-wrap justify-center gap-8 max-w-6xl">
            {candidates.map((candidate, index) => {
              const clan = clans.find(c => c.clan_id === candidate.clan_id)
              const votes = voteCounts[candidate.role_id] || 0
              const meetsThreshold = votes >= threshold
              const isWinner = showFinalAnnouncement && thresholdMet && winner?.role_id === candidate.role_id

              return (
                <div
                  key={candidate.role_id}
                  id={`candidate-${candidate.role_id}`}
                  className="relative"
                >
                  {/* Candidate Card */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex flex-col items-center p-6 rounded-xl border-3 transition-all min-w-[220px] ${
                      isWinner
                        ? 'bg-gradient-to-b from-amber-600 to-amber-700 border-amber-400 shadow-2xl'
                        : meetsThreshold && showFinalAnnouncement
                        ? 'bg-gradient-to-b from-amber-700 to-amber-800 border-amber-500'
                        : 'bg-neutral-800 border-neutral-600'
                    }`}
                  >
                    {/* Avatar with Crown if Winner */}
                    <div className="relative mb-3">
                      {isWinner && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-5xl animate-bounce">
                          👑
                        </div>
                      )}
                      <img
                        src={candidate.avatar_url || '/placeholder-avatar.png'}
                        alt={candidate.name}
                        className="w-24 h-24 rounded-full border-4 object-cover"
                        style={{ borderColor: clan?.color_hex || '#8B7355' }}
                      />
                      {clan?.emblem_url && (
                        <img
                          src={clan.emblem_url}
                          alt={clan.name}
                          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-3 border-neutral-900 object-cover"
                        />
                      )}
                    </div>

                    {/* Name */}
                    <div className="text-white font-heading font-bold text-lg text-center mb-1">
                      {candidate.name}
                    </div>
                    <div className="text-sm text-neutral-300 text-center mb-2">
                      {candidate.position}
                    </div>
                    <div className="text-xs text-center mb-4" style={{ color: clan?.color_hex || '#B8860B' }}>
                      {clan?.name}
                    </div>

                    {/* Vote Count Display */}
                    <div className="bg-neutral-900 bg-opacity-50 rounded-lg px-4 py-2 mb-3">
                      <div className="text-4xl font-bold text-amber-400 text-center">
                        {votes}
                      </div>
                      <div className="text-xs text-neutral-400 text-center">
                        {votes === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>

                    {/* Threshold Indicator */}
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((votes / threshold) * 100)}%</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            meetsThreshold ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-amber-600 to-amber-500'
                          }`}
                          style={{ width: `${Math.min((votes / threshold) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-neutral-500 text-center mt-1">
                        {threshold - votes > 0 ? `${threshold - votes} more needed` : '✓ Threshold met'}
                      </div>
                    </div>

                    {/* Coin Stack Visualization */}
                    <div className="mt-4 flex flex-wrap justify-center gap-1 min-h-[60px]">
                      {Array.from({ length: votes }).map((_, i) => (
                        <motion.div
                          key={`stack-${candidate.role_id}-${i}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 shadow-lg flex items-center justify-center"
                          style={{
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
                          }}
                        >
                          <span className="text-xs font-bold text-amber-900">⚜</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Animating Coins */}
                  {animatingCoins
                    .filter(coin => coin.candidateId === candidate.role_id)
                    .map(coin => (
                      <AnimatingCoin
                        key={coin.id}
                        targetId={`candidate-${candidate.role_id}`}
                        coin={coin}
                      />
                    ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Threshold Reference */}
        <div className="text-center mt-8 mb-6">
          <div className="inline-block bg-neutral-800 border-2 border-amber-600 rounded-lg px-6 py-3">
            <div className="text-amber-300 font-semibold">
              <span className="text-2xl">{threshold}</span> votes required to win
            </div>
            <div className="text-sm text-neutral-400 mt-1">
              ({Math.round((threshold / totalVotes) * 100)}% of {totalVotes} total votes)
            </div>
          </div>
        </div>

        {/* Final Announcement */}
        <AnimatePresence>
          {showFinalAnnouncement && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 z-60 bg-neutral-900 bg-opacity-95 flex items-center justify-center p-6"
            >
              <div className="max-w-3xl w-full text-center">
                {thresholdMet && winner ? (
                  // Winner Announcement
                  <div>
                    {isVote2 ? (
                      // Vote 2: Special King Election Animation
                      <>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.8 }}
                          className="text-6xl font-heading font-bold text-amber-400 mb-8"
                        >
                          🎉 We have a new King! 🎉
                        </motion.div>

                        {/* Large fading avatar and name */}
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 1 }}
                        >
                          <motion.img
                            src={candidates.find(c => c.role_id === winner.role_id)?.avatar_url || '/placeholder-avatar.png'}
                            alt={winner.name}
                            className="w-64 h-64 rounded-full border-8 border-amber-500 object-cover mx-auto mb-8 shadow-2xl"
                            animate={{
                              scale: [1, 1.05, 1],
                              boxShadow: [
                                '0 0 60px rgba(251, 191, 36, 0.5)',
                                '0 0 100px rgba(251, 191, 36, 0.8)',
                                '0 0 60px rgba(251, 191, 36, 0.5)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.h2
                            className="text-8xl font-heading font-bold text-amber-400 mb-6"
                            animate={{
                              opacity: [1, 0.8, 1],
                              textShadow: [
                                '0 0 20px rgba(251, 191, 36, 0.5)',
                                '0 0 40px rgba(251, 191, 36, 0.8)',
                                '0 0 20px rgba(251, 191, 36, 0.5)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {winner.name}
                          </motion.h2>
                          <div className="text-3xl text-amber-300 mb-8">
                            King of Kourion
                          </div>
                        </motion.div>

                        <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl p-6 border-4 border-amber-500">
                          <div className="text-5xl font-bold text-white mb-2">
                            {winner.vote_count} votes
                          </div>
                          <div className="text-xl text-neutral-300">
                            ({winner.percentage}%)
                          </div>
                        </div>
                      </>
                    ) : (
                      // Vote 1: Standard announcement
                      <>
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, type: 'spring' }}
                          className="text-9xl mb-8"
                        >
                          👑
                        </motion.div>
                        <h2 className="text-7xl font-heading font-bold text-amber-400 mb-4">
                          {winner.name}
                        </h2>
                        <div className="text-4xl text-amber-300 mb-8">
                          has been elected King of Kourion!
                        </div>
                        <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl p-8 border-4 border-amber-500 mb-8">
                          <div className="text-7xl font-bold text-white mb-3">
                            {winner.vote_count}
                          </div>
                          <div className="text-2xl text-neutral-300 mb-4">
                            votes ({winner.percentage}%)
                          </div>
                          <div className="text-lg text-green-400">
                            ✓ Exceeded threshold of {threshold} votes
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // No Winner Announcement
                  <div>
                    {isVote2 ? (
                      // Vote 2: Sad animation - no King elected
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 1 }}
                          className="text-7xl mb-8"
                        >
                          😔
                        </motion.div>
                        <motion.h2
                          className="text-5xl font-heading font-bold text-neutral-400 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5, duration: 1 }}
                        >
                          Our Glorious City State
                        </motion.h2>
                        <motion.div
                          className="text-4xl text-neutral-500 mb-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 1 }}
                        >
                          has Remained Without a King
                        </motion.div>
                        <motion.div
                          className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl p-6 border-4 border-neutral-600"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.5, duration: 0.8 }}
                        >
                          <div className="text-2xl text-neutral-400 mb-4">
                            No candidate reached the required threshold
                          </div>
                          <div className="text-xl text-neutral-500">
                            {threshold} votes needed to elect a King
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      // Vote 1: Runoff Announcement
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.6 }}
                          className="text-9xl mb-8"
                        >
                          ⚖️
                        </motion.div>
                        <h2 className="text-6xl font-heading font-bold text-amber-400 mb-6">
                          Runoff Vote Required
                        </h2>
                        <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl p-6 border-4 border-amber-600 mb-6">
                          <div className="text-xl text-neutral-300 mb-4">
                            No candidate reached {threshold} votes
                          </div>
                          <div className="text-3xl font-bold text-amber-400 mb-6">
                            {runoffCandidates.length} Candidates Advance
                          </div>
                          <div className={`grid gap-4 ${runoffCandidates.length === 2 ? 'grid-cols-2' : runoffCandidates.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {runoffCandidates.map((item, index) => {
                              const clan = clans.find(c => c.clan_id === item.candidate.clan_id)
                              const medals = ['🥇', '🥈', '🥉', '🏅', '🏅']
                              return (
                                <div
                                  key={item.candidate.role_id}
                                  className="bg-neutral-700 rounded-lg p-3 border-2 border-amber-500"
                                >
                                  <div className="text-4xl mb-2">{medals[index] || '🏅'}</div>
                                  <img
                                    src={item.candidate.avatar_url || '/placeholder-avatar.png'}
                                    alt={item.candidate.name}
                                    className="w-16 h-16 rounded-full border-3 object-cover mx-auto mb-2"
                                    style={{ borderColor: clan?.color_hex || '#8B7355' }}
                                  />
                                  <div className="text-lg font-bold text-white mb-1">
                                    {item.candidate.name}
                                  </div>
                                  <div className="text-xs text-neutral-400 mb-2">
                                    {clan?.name}
                                  </div>
                                  <div className="text-2xl font-bold text-amber-400">
                                    {item.votes} votes
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="text-xl text-neutral-400">
                          Proceed to the next voting round
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 flex gap-4 justify-center"
                >
                  <button
                    onClick={resetAnimation}
                    className="px-8 py-4 bg-accent text-white rounded-lg font-heading text-xl hover:bg-opacity-90 transition-all flex items-center gap-3 shadow-xl"
                  >
                    <RotateCcw className="w-6 h-6" />
                    Watch Again
                  </button>
                  <button
                    onClick={onComplete}
                    className="px-8 py-4 bg-primary text-white rounded-lg font-heading text-xl hover:bg-opacity-90 transition-all flex items-center gap-3 shadow-xl"
                  >
                    <Home className="w-6 h-6" />
                    Back to Dashboard
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Animated Coin Component
function AnimatingCoin({ targetId, coin }: { targetId: string, coin: CoinAnimation }) {
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Calculate target position
    const targetEl = document.getElementById(targetId)
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect()
      setTargetPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
  }, [targetId])

  const hasVoterInfo = coin.voterRole && coin.chosenRole

  return (
    <>
      {/* Vote announcement with voter avatar (left) and clan logo (right) - NO FLYING */}
      {hasVoterInfo && (
        <div className="fixed top-48 left-0 right-0 flex justify-center items-center gap-6 pointer-events-none" style={{ zIndex: 101 }}>
          {/* Voter Avatar on LEFT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 1] }}
            transition={{ duration: 2.16, ease: 'easeOut' }}
          >
            <img
              src={coin.voterRole.avatar_url || '/placeholder-avatar.png'}
              alt={coin.voterRole.name}
              className="w-24 h-24 rounded-full border-4 object-cover shadow-2xl"
              style={{ borderColor: coin.voterClan?.color_hex || '#B8860B' }}
            />
          </motion.div>

          {/* Announcement Text in CENTER */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.16, ease: 'easeOut' }}
          >
            <div className="bg-neutral-800 bg-opacity-95 border-3 border-amber-500 rounded-xl px-6 py-4 shadow-2xl">
              <div className="text-white text-2xl font-bold text-center whitespace-nowrap">
                <span style={{ color: coin.voterClan?.color_hex || '#B8860B' }}>
                  {coin.voterRole?.name}
                </span>
                {coin.voterClan && (
                  <span className="text-neutral-300"> of {coin.voterClan.name}</span>
                )}
                <br />
                <span className="text-amber-400">has given his voice to </span>
                <span className="text-amber-200 font-extrabold">{coin.chosenRole?.name}</span>
              </div>
            </div>
          </motion.div>

          {/* Voter's Clan Logo on RIGHT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 1] }}
            transition={{ duration: 2.16, ease: 'easeOut' }}
          >
            <img
              src={coin.voterClan?.emblem_url || '/placeholder-avatar.png'}
              alt={coin.voterClan?.name}
              className="w-24 h-24 rounded-full border-4 object-contain bg-neutral-800 shadow-2xl p-2"
              style={{ borderColor: coin.voterClan?.color_hex || '#B8860B' }}
            />
          </motion.div>
        </div>
      )}
    </>
  )
}
