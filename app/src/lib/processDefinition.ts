/**
 * KING Process Definition
 *
 * Defines the complete 15-phase flow of The New King simulation
 * Based on KING_PRD.md Section 4.2 and KING_Process.csv
 *
 * Phase 0: Pre-Play (Role Distribution & Induction)
 * Phases 1-12: Active Role-Play (from KING_Process.csv)
 * Phases 13-15: Post-Play (Reflections & Debrief)
 *
 * Source: /DOCS/KING_SIM_BASE/KING_Process.csv + KING_PRD.md Section 4.2
 * Last Updated: October 26, 2025
 */

export interface ProcessPhase {
  /** Phase number (0-15) */
  stage_number: number

  /** Display name of the phase */
  stage_name: string

  /** Detailed description of what happens in this phase */
  description: string

  /** Default duration in minutes */
  default_duration_minutes: number

  /** Phase category for grouping */
  phase_category: 'pre_play' | 'active_play' | 'post_play'

  /** Phase type categorization */
  phase_type: 'induction' | 'clan_council' | 'consultation' | 'nomination' | 'speech' | 'vote' | 'decision' | 'reaction' | 'reflection' | 'personal_feedback' | 'debrief'

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
 * This defines the complete flow for The New King simulation.
 * Total duration: 185 minutes (~3 hours)
 * - Pre-Play: 10 min
 * - Active Play: 120 min
 * - Post-Play: 55 min
 */
export const KING_PROCESS_PHASES: ProcessPhase[] = [
  // ========================================================================
  // PRE-PLAY PHASE (1 phase)
  // ========================================================================
  {
    stage_number: 0,
    stage_name: 'Role Distribution & Induction',
    description: 'Facilitator distributes roles with animation, participants read their character profiles and clan information',
    default_duration_minutes: 10,
    phase_category: 'pre_play',
    phase_type: 'induction',
    allows_private_meetings: false,
    allows_public_discussion: false,
    requires_facilitator_action: true,
  },

  // ========================================================================
  // ACTIVE ROLE-PLAY PHASES (12 phases)
  // ========================================================================
  {
    stage_number: 1,
    stage_name: 'Clan Councils 1',
    description: 'Each clan meets privately to choose strategy and nominate candidates',
    default_duration_minutes: 10,
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
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
    phase_category: 'active_play',
    phase_type: 'reaction',
    allows_private_meetings: false,
    allows_public_discussion: true,
    requires_facilitator_action: true,
  },

  // ========================================================================
  // POST-PLAY PHASES (3 phases)
  // ========================================================================
  {
    stage_number: 13,
    stage_name: 'Individual Reflections',
    description: 'Participants reflect individually or with AI (optional) on their personal experience, decisions, and learnings',
    default_duration_minutes: 15,
    phase_category: 'post_play',
    phase_type: 'personal_feedback',
    allows_private_meetings: true,
    allows_public_discussion: false,
    requires_facilitator_action: false,
  },
  {
    stage_number: 14,
    stage_name: 'Group Reflections',
    description: 'Participants share perspectives and explore different viewpoints in a facilitated group reflection sessions',
    default_duration_minutes: 20,
    phase_category: 'post_play',
    phase_type: 'reflection',
    allows_private_meetings: false,
    allows_public_discussion: true,
    requires_facilitator_action: true,
  },
  {
    stage_number: 15,
    stage_name: 'Plenary Debriefing',
    description: 'Facilitator leads final synthesis discussion, connects simulation to learning objectives, and answers questions',
    default_duration_minutes: 20,
    phase_category: 'post_play',
    phase_type: 'debrief',
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
  if (currentStage < 0) return 0
  if (currentStage >= KING_PROCESS_PHASES.length) return 100
  return Math.round(((currentStage + 1) / KING_PROCESS_PHASES.length) * 100)
}

/**
 * Get phases by category
 */
export const getPhasesByCategory = (category: ProcessPhase['phase_category']): ProcessPhase[] => {
  return KING_PROCESS_PHASES.filter(phase => phase.phase_category === category)
}

/**
 * Get pre-play phases
 */
export const getPrePlayPhases = (): ProcessPhase[] => {
  return getPhasesByCategory('pre_play')
}

/**
 * Get active play phases
 */
export const getActivePlayPhases = (): ProcessPhase[] => {
  return getPhasesByCategory('active_play')
}

/**
 * Get post-play phases
 */
export const getPostPlayPhases = (): ProcessPhase[] => {
  return getPhasesByCategory('post_play')
}

/**
 * Check if phase is in active role-play section
 */
export const isActivePlayPhase = (stageNumber: number): boolean => {
  const phase = getPhaseByNumber(stageNumber)
  return phase?.phase_category === 'active_play'
}

/**
 * Get category label for display
 */
export const getCategoryLabel = (category: ProcessPhase['phase_category']): string => {
  switch (category) {
    case 'pre_play':
      return 'Pre-Play'
    case 'active_play':
      return 'Active Role-Play'
    case 'post_play':
      return 'Post-Play Reflection'
    default:
      return category
  }
}
