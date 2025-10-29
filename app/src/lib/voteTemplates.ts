/**
 * Vote Type Templates
 *
 * Provides default configurations for each vote type in the simulation.
 * These templates can be customized by the facilitator before creating a vote.
 *
 * Sprint 1: Voting System Implementation
 * Date: October 29, 2025
 */

import type { Database } from './database.types'

type VoteSessionInsert = Database['public']['Tables']['vote_sessions']['Insert']

export interface VoteTypeTemplate {
  id: string
  name: string
  description: string
  icon: string
  defaults: Partial<VoteSessionInsert>
  customizableFields: string[]
}

/**
 * Vote Type Templates
 */
export const VOTE_TEMPLATES: Record<string, VoteTypeTemplate> = {
  // ==========================================================================
  // CLAN NOMINATION
  // ==========================================================================
  clan_nomination: {
    id: 'clan_nomination',
    name: 'Clan Nomination',
    description: 'Each clan selects their candidate for King (internal clan vote)',
    icon: '👑',
    defaults: {
      vote_type: 'clan_nomination',
      vote_format: 'choose_person',
      scope: 'clan_only',
      transparency_level: 'open', // Clan sees who voted for whom
      reveal_timing: 'after_all_votes',
      animation_speed: 'normal',
      allow_skip_animation: true,
      status: 'open'
    },
    customizableFields: [
      'scope_clan_id', // Which clan is voting
      'eligible_candidates', // Clan members
      'transparency_level',
      'reveal_timing',
      'animation_speed'
    ]
  },

  // ==========================================================================
  // GENERAL ELECTION - ROUND 1
  // ==========================================================================
  election_round_1: {
    id: 'election_round_1',
    name: 'General Election - Round 1',
    description: 'All participants vote for King from nominated candidates',
    icon: '🗳️',
    defaults: {
      vote_type: 'election_round',
      vote_format: 'choose_person',
      scope: 'all',
      transparency_level: 'anonymous', // Only tallies shown
      reveal_timing: 'after_all_votes',
      animation_speed: 'normal',
      allow_skip_animation: false,
      status: 'open',
      proposal_title: 'Vote for King - Round 1',
      proposal_description: 'Select one candidate to become King. A 2/3 majority is required to win.'
    },
    customizableFields: [
      'eligible_candidates', // Nominated candidates
      'transparency_level',
      'reveal_timing',
      'animation_speed',
      'proposal_description'
    ]
  },

  // ==========================================================================
  // GENERAL ELECTION - ROUND 2 (FINAL)
  // ==========================================================================
  election_round_2: {
    id: 'election_round_2',
    name: 'General Election - Round 2 (Final)',
    description: 'Final vote for King (top candidates from Round 1)',
    icon: '👑',
    defaults: {
      vote_type: 'election_round',
      vote_format: 'choose_person',
      scope: 'all',
      transparency_level: 'anonymous',
      reveal_timing: 'after_all_votes',
      animation_speed: 'slow', // More dramatic
      allow_skip_animation: false,
      status: 'open',
      proposal_title: 'Final Vote for King - Round 2',
      proposal_description: 'This is the final round. Select one candidate to become King.'
    },
    customizableFields: [
      'eligible_candidates', // Top 2-3 from Round 1
      'transparency_level',
      'reveal_timing',
      'animation_speed',
      'proposal_description'
    ]
  },

  // ==========================================================================
  // CLAN OATH OF ALLEGIANCE
  // ==========================================================================
  clan_oath: {
    id: 'clan_oath',
    name: 'Clan Oath of Allegiance',
    description: 'Does the clan swear oath to the new King?',
    icon: '🤝',
    defaults: {
      vote_type: 'clan_oath',
      vote_format: 'yes_no',
      scope: 'clan_only',
      transparency_level: 'anonymous', // Respect clan privacy
      reveal_timing: 'after_all_votes',
      animation_speed: 'normal',
      allow_skip_animation: true,
      status: 'open'
    },
    customizableFields: [
      'scope_clan_id', // Which clan
      'proposal_title',
      'proposal_description',
      'transparency_level',
      'reveal_timing'
    ]
  },

  // ==========================================================================
  // CLAN ACTION
  // ==========================================================================
  clan_action: {
    id: 'clan_action',
    name: 'Clan Action Against King',
    description: 'Does the clan take action from "if things go wrong" scenarios?',
    icon: '⚔️',
    defaults: {
      vote_type: 'clan_action',
      vote_format: 'yes_no',
      scope: 'clan_only',
      transparency_level: 'anonymous',
      reveal_timing: 'after_all_votes',
      animation_speed: 'normal',
      allow_skip_animation: true,
      status: 'open'
    },
    customizableFields: [
      'scope_clan_id', // Which clan
      'proposal_title',
      'proposal_description', // Description of the action
      'transparency_level',
      'reveal_timing'
    ]
  },

  // ==========================================================================
  // CUSTOM ELECTION (Admin-created)
  // ==========================================================================
  custom_election: {
    id: 'custom_election',
    name: 'Custom Election',
    description: 'Create a custom "choose person" vote for any purpose',
    icon: '📋',
    defaults: {
      vote_type: 'facilitator_proposal',
      vote_format: 'choose_person',
      scope: 'all',
      transparency_level: 'anonymous',
      reveal_timing: 'after_all_votes',
      animation_speed: 'normal',
      allow_skip_animation: true,
      status: 'open'
    },
    customizableFields: [
      'scope', // all or clan_only
      'scope_clan_id',
      'eligible_candidates',
      'proposal_title',
      'proposal_description',
      'transparency_level',
      'reveal_timing',
      'animation_speed'
    ]
  },

  // ==========================================================================
  // CUSTOM PROPOSAL (Admin-created yes/no)
  // ==========================================================================
  custom_proposal: {
    id: 'custom_proposal',
    name: 'Custom Proposal',
    description: 'Create a custom yes/no/abstain vote for any purpose',
    icon: '📝',
    defaults: {
      vote_type: 'facilitator_proposal',
      vote_format: 'yes_no',
      scope: 'all',
      transparency_level: 'open',
      reveal_timing: 'after_all_votes',
      animation_speed: 'normal',
      allow_skip_animation: true,
      status: 'open'
    },
    customizableFields: [
      'scope', // all or clan_only
      'scope_clan_id',
      'proposal_title',
      'proposal_description',
      'transparency_level',
      'reveal_timing',
      'animation_speed'
    ]
  }
}

/**
 * Get template by ID
 */
export function getVoteTemplate(templateId: string): VoteTypeTemplate | null {
  return VOTE_TEMPLATES[templateId] || null
}

/**
 * Get all available templates
 */
export function getAllVoteTemplates(): VoteTypeTemplate[] {
  return Object.values(VOTE_TEMPLATES)
}

/**
 * Get templates filtered by category
 */
export function getVoteTemplatesByCategory() {
  return {
    kingElection: [
      VOTE_TEMPLATES.clan_nomination,
      VOTE_TEMPLATES.election_round_1,
      VOTE_TEMPLATES.election_round_2
    ],
    clanDecisions: [
      VOTE_TEMPLATES.clan_oath,
      VOTE_TEMPLATES.clan_action
    ],
    custom: [
      VOTE_TEMPLATES.custom_election,
      VOTE_TEMPLATES.custom_proposal
    ]
  }
}
