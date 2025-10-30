/**
 * Phase Timer Component
 *
 * Displays a countdown timer for the current phase based on:
 * - Phase start time (started_at)
 * - Phase duration (actual_duration_minutes or default_duration_minutes)
 * - Current time
 *
 * Updates every second and shows:
 * - Time remaining in MM:SS format
 * - Visual indicator (color changes as time runs out)
 */

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import type { Phase } from '../types/database'

interface PhaseTimerProps {
  phase: Phase | null
  className?: string
  compact?: boolean // If true, shows smaller version
}

export function PhaseTimer({ phase, className = '', compact = false }: PhaseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isOvertime, setIsOvertime] = useState(false)

  useEffect(() => {
    if (!phase || !phase.started_at) {
      setTimeRemaining(null)
      return
    }

    const calculateTimeRemaining = () => {
      const startedAt = new Date(phase.started_at!).getTime()
      const durationMinutes = phase.actual_duration_minutes || phase.default_duration_minutes || 0
      const endTime = startedAt + (durationMinutes * 60 * 1000)
      const now = Date.now()
      const remaining = Math.floor((endTime - now) / 1000) // seconds

      if (remaining < 0) {
        setIsOvertime(true)
        setTimeRemaining(Math.abs(remaining)) // Show how much overtime
      } else {
        setIsOvertime(false)
        setTimeRemaining(remaining)
      }
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [phase])

  if (!phase || timeRemaining === null) {
    return null
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Determine color based on time remaining
  const getTimerColor = (): string => {
    if (isOvertime) return 'text-danger bg-danger/10 border-danger'
    if (timeRemaining <= 60) return 'text-warning bg-warning/10 border-warning' // Last minute
    if (timeRemaining <= 300) return 'text-accent bg-accent/10 border-accent' // Last 5 minutes
    return 'text-success bg-success/10 border-success' // Plenty of time
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getTimerColor()} ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="font-mono font-semibold text-sm">
          {isOvertime && '+'}{formatTime(timeRemaining)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 ${getTimerColor()} ${className}`}>
      <Clock className="w-6 h-6" />
      <div className="text-center">
        <div className="font-mono font-bold text-3xl tracking-wider">
          {isOvertime && '+'}{formatTime(timeRemaining)}
        </div>
        <div className="text-xs font-semibold mt-1 opacity-80">
          {isOvertime ? 'OVERTIME' : 'Time Remaining'}
        </div>
      </div>
    </div>
  )
}
