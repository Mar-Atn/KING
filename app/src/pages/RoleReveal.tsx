/**
 * Role Reveal Page
 *
 * Two-stage animation for role reveal:
 * 1. Modal: "Are you ready to discover your role?"
 * 2. Gradual fade-in from darkness: avatar → name → title → clan
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getRoleForUser } from '../lib/data/participants'
import type { Role, SimRun, Clan } from '../types/database'

export function RoleReveal() {
  const { runId } = useParams<{ runId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  console.log('🎭 [RoleReveal] Component loaded', { runId, userId: user?.id })

  const [role, setRole] = useState<Role | null>(null)
  const [clan, setClan] = useState<Clan | null>(null)
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stage 1: Ready modal
  const [showReadyModal, setShowReadyModal] = useState(true)

  // Stage 2: Clan reveal (first)
  const [showClanReveal, setShowClanReveal] = useState(false)
  const [clanRevealed, setClanRevealed] = useState(false)

  // Stage 3: Character reveal (after clan click)
  const [showCharacterReveal, setShowCharacterReveal] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [showCharacterDetails, setShowCharacterDetails] = useState(false)
  const [revealComplete, setRevealComplete] = useState(false)

  // Load role data and simulation info
  useEffect(() => {
    if (!user || !runId) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      try {
        // Get role for this user in this simulation
        const roleData = await getRoleForUser(user.id, runId)

        if (!roleData) {
          // User doesn't have a role yet - redirect back to waiting room
          navigate(`/waiting-room/${runId}`)
          return
        }

        console.log('🔍 [RoleReveal] Role data loaded:', roleData)

        // Get simulation data (need started_at for localStorage key)
        const { data: simData, error: simError } = await supabase
          .from('sim_runs')
          .select('*')
          .eq('run_id', runId)
          .single()

        if (simError) throw simError

        // Get clan data
        const { data: clanData, error: clanError } = await supabase
          .from('clans')
          .select('*')
          .eq('clan_id', roleData.clan_id)
          .single()

        if (clanError) {
          console.error('Error loading clan:', clanError)
          throw clanError
        }

        console.log('🔍 [RoleReveal] Clan data loaded:', clanData)

        setRole(roleData)
        setClan(clanData)
        setSimulation(simData)
        setLoading(false)
      } catch (err: any) {
        console.error('Error loading role:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [user, runId, navigate])

  // Stage 1 -> Stage 2: Show clan reveal
  const handleStartReveal = () => {
    setShowReadyModal(false)
    setShowClanReveal(true)

    // Clan appears from darkness
    setTimeout(() => setClanRevealed(true), 500)
  }

  // Stage 2 -> Stage 3: User clicks after seeing clan, show character
  const handleClanContinue = () => {
    setShowClanReveal(false)
    setShowCharacterReveal(true)

    // Character reveal sequence
    setTimeout(() => setShowAvatar(true), 500)           // Avatar fades in
    setTimeout(() => setShowCharacterDetails(true), 2000) // Name + title + age all together
    setTimeout(() => setRevealComplete(true), 3500)      // Show continue button
  }

  // Navigate to participant dashboard
  const handleContinue = () => {
    // Mark role reveal as seen in localStorage
    if (user && runId && simulation?.started_at) {
      const key = `hasSeenRoleReveal_${user.id}_${runId}_${simulation.started_at}`
      localStorage.setItem(key, 'true')
      console.log('✅ Role reveal marked as seen:', key)
    }

    navigate(`/participant/${runId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading your role...</div>
      </div>
    )
  }

  if (error || !role) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">{error || 'Role not found'}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Stage 1: Ready Modal */}
      <AnimatePresence>
        {showReadyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-12 max-w-2xl mx-4 text-center"
            >
              {/* App Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-2xl border-4 border-primary"
              >
                <img
                  src="/olive.jpg"
                  alt="The New King SIM"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Message */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="font-heading text-4xl text-primary mb-4"
              >
                Are you ready to discover your role?
              </motion.h1>


              {/* Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleStartReveal}
                className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-xl"
              >
                Yes, reveal my role!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2: Clan Reveal (from darkness) */}
      <AnimatePresence>
        {showClanReveal && clan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
          >
            <div className="text-center max-w-2xl mx-4">
              <AnimatePresence>
                {clanRevealed && (
                  <>
                    {/* Clan Emblem - Large and centered in circle */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 2, type: 'spring' }}
                      className="mb-8"
                    >
                      {clan.emblem_url && (
                        <div className="w-48 h-48 mx-auto rounded-full overflow-hidden bg-white shadow-2xl border-4 flex items-center justify-center p-4"
                          style={{
                            borderColor: clan.color_hex || '#8B7355',
                            boxShadow: `0 0 60px ${clan.color_hex || '#8B7355'}80, 0 20px 40px rgba(0,0,0,0.3)`
                          }}
                        >
                          <img
                            src={clan.emblem_url}
                            alt={clan.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </motion.div>

                    {/* Clan Name - Large and dramatic */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.5, delay: 1 }}
                      className="text-6xl font-heading font-bold mb-8"
                      style={{
                        color: clan.color_hex || '#8B7355',
                        textShadow: `0 0 60px ${clan.color_hex || '#8B7355'}80`
                      }}
                    >
                      {clan.name}
                    </motion.div>

                    {/* Click to continue */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 2 }}
                      onClick={handleClanContinue}
                      className="px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
                      style={{
                        backgroundColor: clan.color_hex || '#8B7355',
                        color: 'white'
                      }}
                    >
                      Discover Your Role →
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 3: Character Reveal */}
      {showCharacterReveal && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-2xl mx-4">
            {/* Avatar - Fades in first */}
            <AnimatePresence>
              {showAvatar && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5 }}
                  className="mb-8"
                >
                  {role.avatar_url ? (
                    <img
                      src={role.avatar_url}
                      alt={role.name}
                      className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-primary shadow-2xl"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-full mx-auto bg-primary bg-opacity-20 flex items-center justify-center border-4 border-primary shadow-2xl">
                      <span className="text-6xl text-primary font-heading">
                        {role.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name + Title + Age - All appear together */}
            <AnimatePresence>
              {showCharacterDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  {/* Name */}
                  <h1 className="font-heading text-6xl text-white mb-4">
                    {role.name}
                  </h1>

                  {/* Title/Position */}
                  {role.position && (
                    <p className="text-2xl text-neutral-300 font-medium">
                      {role.position}
                    </p>
                  )}

                  {/* Age */}
                  {role.age && (
                    <p className="text-lg text-neutral-400 mt-2">
                      Age: {role.age}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue Button */}
            <AnimatePresence>
              {revealComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-12"
                >
                  <button
                    onClick={handleContinue}
                    className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-xl"
                  >
                    Enter the SIM!
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 115, 85, 0.3) 0%, transparent 70%)'
          }}
        />
      </div>
    </div>
  )
}
