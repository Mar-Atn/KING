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
import type { Role } from '../types/database'

export function RoleReveal() {
  const { runId } = useParams<{ runId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stage 1: Ready modal
  const [showReadyModal, setShowReadyModal] = useState(true)
  const [revealStarted, setRevealStarted] = useState(false)

  // Stage 2: Reveal sequence
  const [showAvatar, setShowAvatar] = useState(false)
  const [showName, setShowName] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showClan, setShowClan] = useState(false)
  const [revealComplete, setRevealComplete] = useState(false)

  // Load role data
  useEffect(() => {
    if (!user || !runId) {
      navigate('/login')
      return
    }

    const loadRole = async () => {
      try {
        // Get role for this user in this simulation
        const roleData = await getRoleForUser(user.id, runId)

        if (!roleData) {
          // User doesn't have a role yet - redirect back to waiting room
          navigate(`/waiting-room/${runId}`)
          return
        }

        setRole(roleData)
        setLoading(false)
      } catch (err: any) {
        console.error('Error loading role:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadRole()
  }, [user, runId, navigate])

  // Start reveal sequence
  const handleStartReveal = () => {
    setShowReadyModal(false)
    setRevealStarted(true)

    // Sequence timing (in milliseconds)
    setTimeout(() => setShowAvatar(true), 500) // Avatar fades in
    setTimeout(() => setShowName(true), 2000) // Name appears
    setTimeout(() => setShowTitle(true), 3500) // Title appears
    setTimeout(() => setShowClan(true), 5000) // Clan appears
    setTimeout(() => setRevealComplete(true), 6500) // Show continue button
  }

  // Navigate to role briefing
  const handleContinue = () => {
    navigate(`/role-briefing/${runId}`)
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

  const clanData = (role as any).clans

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
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="w-32 h-32 mx-auto mb-6 bg-primary bg-opacity-10 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-16 h-16 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
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

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-neutral-600 text-lg mb-8"
              >
                Your character awaits in the ancient city of Kourion...
              </motion.p>

              {/* Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={handleStartReveal}
                className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105"
              >
                Yes, reveal my role!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2: Reveal Sequence (from darkness) */}
      {revealStarted && (
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

            {/* Name - Appears second */}
            <AnimatePresence>
              {showName && (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="font-heading text-6xl text-white mb-4"
                >
                  {role.name}
                </motion.h1>
              )}
            </AnimatePresence>

            {/* Title/Position - Appears third */}
            <AnimatePresence>
              {showTitle && role.position && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="mb-4"
                >
                  <p className="text-2xl text-neutral-300 font-medium">
                    {role.position}
                  </p>
                  {role.age && (
                    <p className="text-lg text-neutral-400 mt-2">
                      Age: {role.age}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clan - Appears last */}
            <AnimatePresence>
              {showClan && clanData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1 }}
                  className="mt-8 inline-block"
                >
                  <div
                    className="px-8 py-4 rounded-lg border-2 shadow-xl"
                    style={{
                      borderColor: clanData.color_hex || '#8B7355',
                      backgroundColor: `${clanData.color_hex || '#8B7355'}20`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {clanData.emblem_url && (
                        <img
                          src={clanData.emblem_url}
                          alt={clanData.name}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      <div className="text-left">
                        <div className="text-sm text-neutral-400 uppercase tracking-wide">
                          Your Clan
                        </div>
                        <div
                          className="text-3xl font-heading font-bold"
                          style={{ color: clanData.color_hex || '#8B7355' }}
                        >
                          {clanData.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue Button - Appears when reveal complete */}
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
                    className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105"
                  >
                    View Your Briefing →
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
