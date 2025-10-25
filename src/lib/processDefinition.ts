/**
 * KING Process Definition
 *
 * Defines the 12 phases of The New King simulation based on KING_Process.csv
 *
 * Source: /DOCS/KING_SIM_BASE/KING_Process.csv
 * Last Updated: October 25, 2025
 */

export interface ProcessPhase {
  /** Phase number (1-12) */
  stage_number: number

  /** Display name of the phase */
  stage_name: string

  /** Detailed description of what happens in this phase */
  description: string

  /** Default duration in minutes */
  default_duration_minutes: number

  /** Phase type categorization */
  phase_type: 'clan_council' | 'consultation' | 'nomination' | 'speech' | 'vote' | 'decision' | 'reaction'

  /** Whether this phase allows private clan meetings */
  allows_private_meetings: boolean

  /** Whether this phase allows open discussion between clans */
  allows_public_discussion: boolean

  /** Whether this phase requires facilitator action to complete */
  requires_facilitator_action: boolean
}

/**
 * Complete KOURION v1.0 Process Definition
 *
 * This defines the standard flow for The New King simulation.
 * Total duration: 120 minutes (2 hours)
 */
export const KING_PROCESS_PHASES: ProcessPhase[] = [
  {
    stage_number: 1,
    stage_name: 'Clan Councils 1',
    description: 'Each clan meets privately to choose strategy and nominate candidates',
    default_duration_minutes: 10,
    phase_type: 'clan_council',
    allows_private_meetings: true,
    allows_public_discussion: false,
    requires_facilitator_action: false,
  },
  {
    stage_number: 2,
    stage_name: 'Free Consultations 1',
    description: 'All clans may discuss negotiate form alliances',
    default_duration_minutes: 15,
    phase_type: 'consultation',
    allows_private_meetings: false,
    allows_public_discussion: true,
    requires_facilitator_action: false,
  },
  {
    stage_number: 3,
    stage_name: 'Clans nominate candidates (decision)',
    description: 'Each clan announces their nominated candidate',
    default_duration_minutes: 5,
    phase_type: 'nomination',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },
  {
    stage_number: 4,
    stage_name: 'Candidate Speeches 1',
    description: 'Each candidate has 2 minutes to present their program',
    default_duration_minutes: 15,
    phase_type: 'speech',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },
  {
    stage_number: 5,
    stage_name: 'Vote 1',
    description: 'Open voting - need 10+ votes to win. If no winner two candidates with highest votes proceed',
    default_duration_minutes: 10,
    phase_type: 'vote',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },
  {
    stage_number: 6,
    stage_name: 'Clan Councils 2',
    description: 'Each clan meets privately to discuss strategy for second round',
    default_duration_minutes: 10,
    phase_type: 'clan_council',
    allows_private_meetings: true,
    allows_public_discussion: false,
    requires_facilitator_action: false,
  },
  {
    stage_number: 7,
    stage_name: 'Free Consultations 2',
    description: 'Final discussions between clans',
    default_duration_minutes: 15,
    phase_type: 'consultation',
    allows_private_meetings: false,
    allows_public_discussion: true,
    requires_facilitator_action: false,
  },
  {
    stage_number: 8,
    stage_name: 'Candidate Speeches 2',
    description: 'Top 2 candidates get 3 minutes each for final speeches',
    default_duration_minutes: 10,
    phase_type: 'speech',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },
  {
    stage_number: 9,
    stage_name: 'Vote 2',
    description: 'Open voting between final 2 candidates',
    default_duration_minutes: 5,
    phase_type: 'vote',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },
  {
    stage_number: 10,
    stage_name: "King's Decisions and Final Speech (if elected)",
    description: "New King announces key decisions and policies",
    default_duration_minutes: 10,
    phase_type: 'decision',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },
  {
    stage_number: 11,
    stage_name: 'Clan Councils 3',
    description: "Each clan meets to discuss their response to King's decisions",
    default_duration_minutes: 8,
    phase_type: 'clan_council',
    allows_private_meetings: true,
    allows_public_discussion: false,
    requires_facilitator_action: false,
  },
  {
    stage_number: 12,
    stage_name: "Clan's Final Decisions",
    description: "Final comments and clan reactions to King's announcements",
    default_duration_minutes: 7,
    phase_type: 'reaction',
    allows_private_meetings: false,
    allows_public_discussion: true,
    requires_facilitator_action: true,
  },
]

/**
 * Calculate total simulation duration in minutes
 */
export const getTotalDuration = (): number => {
  return KING_PROCESS_PHASES.reduce((total, phase) => total + phase.default_duration_minutes, 0)
}

/**
 * Get phase by stage number
 */
export const getPhaseByNumber = (stageNumber: number): ProcessPhase | undefined => {
  return KING_PROCESS_PHASES.find(phase => phase.stage_number === stageNumber)
}

/**
 * Get phases by type
 */
export const getPhasesByType = (phaseType: ProcessPhase['phase_type']): ProcessPhase[] => {
  return KING_PROCESS_PHASES.filter(phase => phase.phase_type === phaseType)
}

/**
 * Validate if a stage number is valid
 */
export const isValidStageNumber = (stageNumber: number): boolean => {
  return stageNumber >= 1 && stageNumber <= KING_PROCESS_PHASES.length
}

/**
 * Get next phase after current stage
 */
export const getNextPhase = (currentStage: number): ProcessPhase | null => {
  const nextStage = currentStage + 1
  return isValidStageNumber(nextStage) ? getPhaseByNumber(nextStage)! : null
}

/**
 * Get previous phase before current stage
 */
export const getPreviousPhase = (currentStage: number): ProcessPhase | null => {
  const prevStage = currentStage - 1
  return isValidStageNumber(prevStage) ? getPhaseByNumber(prevStage)! : null
}

/**
 * Check if simulation is complete
 */
export const isSimulationComplete = (currentStage: number): boolean => {
  return currentStage > KING_PROCESS_PHASES.length
}

/**
 * Get progress percentage
 */
export const getProgressPercentage = (currentStage: number): number => {
  if (currentStage <= 0) return 0
  if (currentStage > KING_PROCESS_PHASES.length) return 100
  return Math.round((currentStage / KING_PROCESS_PHASES.length) * 100)
}
