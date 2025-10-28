/**
 * Waiting Room Page
 *
 * Displayed to participants after registration while waiting for facilitator
 * to start role assignment
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { SimRun } from '../types/database'

export function WaitingRoom() {
  const { runId } = useParams<{ runId: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [simulation, setSimulation] = useState<SimRun | null>(null)
  const [registeredCount, setRegisteredCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load simulation and participant count
  useEffect(() => {
    if (!user || !runId) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      try {
        // Check if current user already has a role assigned
        const { data: myRole, error: myRoleError } = await supabase
          .from('roles')
          .select('*')
          .eq('run_id', runId)
          .eq('assigned_user_id', user.id)
          .maybeSingle()

        if (myRoleError) {
          console.error('Error checking role:', myRoleError)
        }

        // If user already has role assigned, navigate to role reveal
        if (myRole && myRole.assigned_user_id === user.id) {
          console.log('🎭 Role already assigned! Redirecting to reveal...')
          navigate(`/role-reveal/${runId}`)
          return
        }

        // Get simulation info
        const { data: simResult, error: simError } = await supabase
          .from('sim_runs')
          .select('*')
          .eq('run_id', runId)
          .single()

        if (simError) throw simError
        setSimulation(simResult)

        // Count registered participants (roles with assigned_user_id)
        const { count, error: countError } = await supabase
          .from('roles')
          .select('*', { count: 'exact', head: true })
          .eq('run_id', runId)
          .eq('participant_type', 'human')
          .not('assigned_user_id', 'is', null)

        if (!countError) {
          setRegisteredCount(count || 0)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setLoading(false)
      }
    }

    loadData()
  }, [user, runId, navigate])

  // Subscribe to role assignment changes
  useEffect(() => {
    if (!user || !runId) return

    const channel = supabase
      .channel('role-assignment-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'roles',
          filter: `run_id=eq.${runId}`
        },
        (payload) => {
          const updatedRole = payload.new as any

          // If this role was assigned to current user, navigate to role reveal
          if (updatedRole.assigned_user_id === user.id) {
            console.log('🎭 Role assigned! Redirecting to reveal...')
            navigate(`/role-reveal/${runId}`)
          }

          // Update registered count
          loadData()
        }
      )
      .subscribe()

    const loadData = async () => {
      const { count } = await supabase
        .from('roles')
        .select('*', { count: 'exact', head: true })
        .eq('run_id', runId!)
        .eq('participant_type', 'human')
        .not('assigned_user_id', 'is', null)

      setRegisteredCount(count || 0)
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, runId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-neutral-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-error mb-4">Simulation not found</div>
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        {/* Main Card */}
        <div className="bg-white rounded-lg border-2 border-neutral-200 p-8 text-center">
          {/* Logo/Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="font-heading text-3xl text-primary mb-4">
            Welcome, {profile?.display_name}!
          </h1>
          <p className="text-neutral-600 mb-6">
            {simulation.run_name}
          </p>

          {/* Status */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning bg-opacity-10 text-warning rounded-lg font-medium mb-4">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Waiting for simulation to start...</span>
            </div>

            <p className="text-neutral-600 text-lg">
              The facilitator will begin the role assignment shortly.
            </p>
          </div>

          {/* Participant Count */}
          <div className="bg-neutral-50 rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              {registeredCount}
            </div>
            <div className="text-neutral-600">
              Participants Registered
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-neutral-50 rounded-lg p-6 text-left">
            <h3 className="font-heading text-lg text-primary mb-3">
              What happens next?
            </h3>
            <ol className="space-y-2 text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>The facilitator will select participants and assign roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>You'll see an exciting role reveal animation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Learn about your character and clan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>Join the simulation when it begins</span>
              </li>
            </ol>
          </div>

          {/* Real-time Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>Connected - Updates in real-time</span>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>Please keep this window open and stay nearby.</p>
          <p className="mt-1">You'll be notified when your role is ready!</p>
        </div>
      </div>
    </div>
  )
}
