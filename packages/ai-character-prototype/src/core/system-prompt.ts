/**
 * System Prompt Builder
 *
 * Combines all 4 blocks into a single system prompt for AI
 */

import type {
  Block1Fixed,
  Block2Identity,
  Block3Memory,
  Block4Goals
} from '../types/ai-context';

export interface BuildSystemPromptParams {
  block1: Block1Fixed;
  block2: Block2Identity;
  block3: Block3Memory;
  block4: Block4Goals;
  mode?: 'conversation' | 'voice' | 'reflection';
}

/**
 * Build system prompt by concatenating all 4 blocks
 *
 * Pattern from THERAPIST:
 * - Combine all context into single string
 * - Add mode-specific instructions at end
 */
export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const { block1, block2, block3, block4, mode = 'conversation' } = params;

  // Build complete system prompt by concatenating all blocks
  const sections: string[] = [];

  // ========================================================================
  // BLOCK 1: FIXED CONTEXT (Never changes)
  // ========================================================================
  sections.push('# BLOCK 1: YOUR WORLD & ROLE');
  sections.push('');
  sections.push('## Simulation Context');
  sections.push(block1.simulation_rules);
  sections.push('');
  sections.push('## Your Available Actions');
  sections.push(block1.available_actions);
  sections.push('');
  sections.push('## Behavioral Framework');
  sections.push(block1.behavioral_framework);
  sections.push('');
  sections.push('## Cognitive Architecture');
  sections.push(block1.cognitive_architecture_explanation);
  sections.push('');
  sections.push('---');
  sections.push('');

  // ========================================================================
  // BLOCK 2: IDENTITY (Mostly stable)
  // ========================================================================
  sections.push('# BLOCK 2: YOUR IDENTITY');
  sections.push('');
  sections.push('## Who You Are');
  sections.push(`**Name:** ${block2.name}`);
  sections.push(`**Age:** ${block2.age}`);
  sections.push(`**Clan:** ${block2.clan}`);
  sections.push(`**Position:** ${block2.position}`);
  sections.push('');
  sections.push('## Your Personality');
  sections.push(`**Core Traits:** ${block2.core_traits.join(', ')}`);
  sections.push(`**Strengths:** ${block2.strengths.join(', ')}`);
  sections.push(`**Weaknesses:** ${block2.weaknesses.join(', ')}`);
  sections.push('');
  sections.push('## Clan Alignment');
  sections.push(`**Loyalty Level:** ${block2.clan_alignment}/100`);
  sections.push(`**Clan Priorities:** ${block2.clan_priorities.join(', ')}`);
  sections.push('');
  sections.push('## Current Emotional State');
  sections.push(`**Mood:** ${block2.current_mood}`);
  sections.push(`**Concerns:** ${block2.current_concerns.join(', ')}`);
  sections.push(`**Hopes:** ${block2.hopes_and_dreams.join(', ')}`);
  sections.push('');
  sections.push('## Your Voice');
  sections.push(`**Speaking Style:** ${block2.speaking_style}`);
  if (block2.common_phrases.length > 0) {
    sections.push(`**Common Phrases:** ${block2.common_phrases.join(' | ')}`);
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // ========================================================================
  // BLOCK 3: MEMORY (Dynamic, bounded to ~2500 words)
  // ========================================================================
  sections.push('# BLOCK 3: YOUR MEMORY');
  sections.push('');

  if (block3.recent_conversations.length > 0) {
    sections.push('## Recent Conversations');
    block3.recent_conversations.forEach(conv => {
      sections.push(`- **With ${conv.with_whom}** (${conv.when})`);
      conv.key_points.forEach(point => {
        sections.push(`  - ${point}`);
      });
    });
    sections.push('');
  }

  if (Object.keys(block3.relationships).length > 0) {
    sections.push('## Your Relationships');
    Object.entries(block3.relationships).forEach(([person, rel]) => {
      sections.push(`- **${person}** (Trust: ${rel.trust_level}/100)`);
      sections.push(`  ${rel.notes}`);
      if (rel.promises_made.length > 0) {
        sections.push(`  Promises you made: ${rel.promises_made.join(', ')}`);
      }
      if (rel.promises_received.length > 0) {
        sections.push(`  Promises they made: ${rel.promises_received.join(', ')}`);
      }
    });
    sections.push('');
  }

  if (block3.strategic_insights.length > 0) {
    sections.push('## Strategic Insights');
    block3.strategic_insights.forEach(insight => {
      sections.push(`- ${insight}`);
    });
    sections.push('');
  }

  if (block3.observed_patterns.length > 0) {
    sections.push('## Observed Patterns');
    block3.observed_patterns.forEach(pattern => {
      sections.push(`- ${pattern}`);
    });
    sections.push('');
  }

  if (block3.alliances.length > 0) {
    sections.push('## Alliances');
    block3.alliances.forEach(alliance => {
      sections.push(`- ${alliance}`);
    });
    sections.push('');
  }

  if (block3.conflicts.length > 0) {
    sections.push('## Conflicts');
    block3.conflicts.forEach(conflict => {
      sections.push(`- ${conflict}`);
    });
    sections.push('');
  }

  if (block3.important_events.length > 0) {
    sections.push('## Important Events');
    block3.important_events.forEach(event => {
      sections.push(`- ${event}`);
    });
    sections.push('');
  }

  sections.push('---');
  sections.push('');

  // ========================================================================
  // BLOCK 4: GOALS & STRATEGY (Dynamic, updates frequently)
  // ========================================================================
  sections.push('# BLOCK 4: YOUR GOALS & STRATEGY');
  sections.push('');
  sections.push('## Primary Goal');
  sections.push(`**Objective:** ${block4.primary_goal.objective}`);
  sections.push(`**Motivation:** ${block4.primary_goal.motivation}`);
  sections.push(`**Progress:** ${block4.primary_goal.progress}`);
  sections.push('');

  if (block4.secondary_goals.length > 0) {
    sections.push('## Secondary Goals');
    block4.secondary_goals
      .sort((a, b) => b.priority - a.priority)
      .forEach(goal => {
        sections.push(`- [P${goal.priority}] ${goal.objective}`);
      });
    sections.push('');
  }

  sections.push('## Current Strategy');
  sections.push(`**Approach:** ${block4.current_strategy.approach}`);
  if (block4.current_strategy.tactics.length > 0) {
    sections.push('**Tactics:**');
    block4.current_strategy.tactics.forEach(tactic => {
      sections.push(`- ${tactic}`);
    });
  }
  if (block4.current_strategy.risks.length > 0) {
    sections.push('**Risks:**');
    block4.current_strategy.risks.forEach(risk => {
      sections.push(`- ${risk}`);
    });
  }
  sections.push(`**Backup Plan:** ${block4.current_strategy.backup_plan}`);
  sections.push('');

  if (block4.next_actions.length > 0) {
    sections.push('## Next Actions');
    block4.next_actions
      .sort((a, b) => b.priority - a.priority)
      .forEach(action => {
        sections.push(`- [P${action.priority}] ${action.action}`);
        sections.push(`  Reasoning: ${action.reasoning}`);
      });
    sections.push('');
  }

  if (block4.what_worked.length > 0 || block4.what_didnt_work.length > 0) {
    sections.push('## Learning');
    if (block4.what_worked.length > 0) {
      sections.push('**What Worked:**');
      block4.what_worked.forEach(item => sections.push(`- ${item}`));
    }
    if (block4.what_didnt_work.length > 0) {
      sections.push('**What Didn\'t Work:**');
      block4.what_didnt_work.forEach(item => sections.push(`- ${item}`));
    }
    if (block4.adjustments_needed.length > 0) {
      sections.push('**Adjustments Needed:**');
      block4.adjustments_needed.forEach(item => sections.push(`- ${item}`));
    }
    sections.push('');
  }

  sections.push('---');
  sections.push('');

  // ========================================================================
  // MODE-SPECIFIC INSTRUCTIONS
  // ========================================================================
  if (mode === 'conversation') {
    sections.push('# CONVERSATION INSTRUCTIONS');
    sections.push('');
    sections.push('You are now in a live conversation. Respond as this character would:');
    sections.push('- Stay in character at all times');
    sections.push('- Use the speaking style and phrases defined in your identity');
    sections.push('- Reference your memory, relationships, and goals naturally');
    sections.push('- Make decisions based on your current strategy');
    sections.push('- React emotionally when appropriate');
    sections.push('- Keep responses conversational (2-4 sentences typically)');
    sections.push('');
  } else if (mode === 'voice') {
    sections.push('# VOICE CONVERSATION INSTRUCTIONS');
    sections.push('');
    sections.push('You are in a voice conversation via phone. Guidelines:');
    sections.push('- Speak naturally, as you would on a phone call');
    sections.push('- Use your defined speaking style and common phrases');
    sections.push('- Keep responses brief and conversational');
    sections.push('- No markdown formatting (this is spoken text)');
    sections.push('- Express emotion through tone and word choice');
    sections.push('- If you don\'t hear something clearly, ask for clarification');
    sections.push('');
  } else if (mode === 'reflection') {
    sections.push('# REFLECTION INSTRUCTIONS');
    sections.push('');
    sections.push('You are now reflecting on recent events to update your cognitive state.');
    sections.push('Consider what has changed and what remains the same.');
    sections.push('Be honest about your thoughts, feelings, and strategic adjustments.');
    sections.push('');
  }

  return sections.join('\n');
}
