/**
 * Character Initialization
 *
 * Initialize a new AI character from sim_run and role data
 */

import type {
  AIContext,
  Block1Fixed,
  Block2Identity,
  Block3Memory,
  Block4Goals
} from '../types/ai-context';
import { logger } from '../utils/logger';
import { supabase } from '../database/supabase-client';
import { loadPrompt } from '../database/prompts-db';
import { saveAIContext } from '../database/ai-context-db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface InitializeCharacterParams {
  simRunId: string;
  roleId: string;
}

interface RoleData {
  role_id: string;
  run_id: string;
  clan_id: string;
  name: string;
  age: number;
  position?: string;
  background?: string;
  character_traits?: string;
  interests?: string;
  ai_config?: any;
}

interface ClanData {
  clan_id: string;
  name: string;
  about: string;
  key_priorities: string;
}

/**
 * Initialize AI character from database
 *
 * Steps:
 * 1. Load role from database (roles table)
 * 2. Load clan info (clans table)
 * 3. Build Block 1 (Fixed Context) from prompts
 * 4. Build Block 2 (Identity) from role + clan data
 * 5. Initialize Block 3 (Memory) as empty
 * 6. Generate Block 4 (Goals) using AI
 * 7. Save to ai_context table
 */
export async function initializeCharacter(
  params: InitializeCharacterParams
): Promise<AIContext> {
  const { simRunId, roleId } = params;
  logger.init('Initializing character', params);

  // ========================================================================
  // STEP 1: Load role data
  // ========================================================================
  logger.info('Loading role data...');
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('role_id', roleId)
    .single();

  if (roleError || !roleData) {
    throw new Error(`Failed to load role: ${roleError?.message || 'Not found'}`);
  }

  const role = roleData as RoleData;
  logger.success('Role loaded', { name: role.name });

  // ========================================================================
  // STEP 2: Load clan info
  // ========================================================================
  logger.info('Loading clan data...');
  const { data: clanData, error: clanError } = await supabase
    .from('clans')
    .select('*')
    .eq('clan_id', role.clan_id)
    .single();

  if (clanError || !clanData) {
    throw new Error(`Failed to load clan: ${clanError?.message || 'Not found'}`);
  }

  const clan = clanData as ClanData;
  logger.success('Clan loaded', { clan: clan.name });

  // ========================================================================
  // STEP 3: Build Block 1 (Fixed Context)
  // ========================================================================
  logger.info('Building Block 1 (Fixed Context)...');

  const simulationRulesPrompt = await loadPrompt('block_1_simulation_rules');
  const availableActionsPrompt = await loadPrompt('block_1_available_actions');
  const behavioralFrameworkPrompt = await loadPrompt('block_1_behavioral_framework');

  if (!simulationRulesPrompt || !availableActionsPrompt || !behavioralFrameworkPrompt) {
    throw new Error('Missing required Block 1 prompts in database');
  }

  const block1: Block1Fixed = {
    simulation_rules: simulationRulesPrompt.system_prompt,
    available_actions: availableActionsPrompt.system_prompt,
    behavioral_framework: behavioralFrameworkPrompt.system_prompt,
    cognitive_architecture_explanation: `
# YOUR COGNITIVE ARCHITECTURE

Your mind is organized into 4 blocks:

**Block 1 (Fixed Context):** The rules of this world, your available actions, and how you should behave. This never changes.

**Block 2 (Identity):** Who you are - your personality, clan, position, speaking style. This is mostly stable but can evolve after major events.

**Block 3 (Memory):** What you remember - recent conversations, relationships, promises, insights, events. This updates frequently and is bounded to ~2500 words. Your memory compression system decides what to keep and what to forget.

**Block 4 (Goals & Strategy):** Your current objectives, strategy, tactics, and next actions. This updates after every significant event based on what you've learned.

After each conversation or event, you reflect and update Blocks 2-4 as needed. Your strategic intelligence decides what changes and why.
    `.trim()
  };

  logger.success('Block 1 built', {
    simulation_rules_length: block1.simulation_rules.length,
    available_actions_length: block1.available_actions.length,
    behavioral_framework_length: block1.behavioral_framework.length
  });

  // ========================================================================
  // STEP 4: Build Block 2 (Identity)
  // ========================================================================
  logger.info('Building Block 2 (Identity)...');

  const aiConfig = role.ai_config || {};
  const clanPriorities = clan.key_priorities
    ? clan.key_priorities.split(',').map(p => p.trim())
    : ['Clan prosperity', 'Honor'];

  // Parse character traits from comma-separated string
  const traitsList = role.character_traits
    ? role.character_traits.split(',').map(t => t.trim())
    : ['Loyal', 'Strategic', 'Pragmatic'];

  const block2: Block2Identity = {
    name: role.name,
    age: role.age,
    clan: clan.name,
    position: role.position || 'Clan Member',

    core_traits: aiConfig.core_traits || traitsList.slice(0, 3),
    strengths: aiConfig.strengths || ['Good negotiator', 'Clear thinker'],
    weaknesses: aiConfig.weaknesses || ['Can be stubborn', 'Slow to trust'],

    clan_alignment: 80, // Default high clan loyalty
    clan_priorities: clanPriorities,

    current_mood: 'Focused and cautious',
    current_concerns: ['The upcoming election', 'Clan unity'],
    hopes_and_dreams: ['See my clan thrive', 'Gain influence in Kourion'],

    speaking_style: aiConfig.speaking_style || 'Direct and measured, occasionally using metaphors',
    common_phrases: aiConfig.common_phrases || []
  };

  logger.success('Block 2 built', { character: block2.name, clan: block2.clan });

  // ========================================================================
  // STEP 5: Initialize Block 3 (Memory) - Empty at start
  // ========================================================================
  logger.info('Initializing Block 3 (Memory)...');

  const block3: Block3Memory = {
    recent_conversations: [],
    relationships: {},
    strategic_insights: [],
    observed_patterns: [],
    conflicts: [],
    alliances: [],
    important_events: []
  };

  logger.success('Block 3 initialized (empty)');

  // ========================================================================
  // STEP 6: Generate Block 4 (Goals) using AI
  // ========================================================================
  logger.info('Generating Block 4 (Goals) with AI...');

  const initialGoalsPrompt = await loadPrompt('initial_goals_generation');
  if (!initialGoalsPrompt) {
    throw new Error('Missing initial_goals_generation prompt');
  }

  // Prepare context for AI
  const contextForAI = `
# Character Profile

**Name:** ${block2.name}
**Age:** ${block2.age}
**Clan:** ${block2.clan}
**Position:** ${block2.position}

**Personality:**
- Core Traits: ${block2.core_traits.join(', ')}
- Strengths: ${block2.strengths.join(', ')}
- Weaknesses: ${block2.weaknesses.join(', ')}

**Clan About:** ${clan.about || 'Unknown'}
**Clan Priorities:** ${block2.clan_priorities.join(', ')}

# Task

Generate initial goals and strategy for this character at the start of the simulation.
Return ONLY valid JSON matching this structure:

{
  "primary_goal": {
    "objective": "string",
    "motivation": "string",
    "progress": "Just starting"
  },
  "secondary_goals": [
    {"objective": "string", "priority": number}
  ],
  "current_strategy": {
    "approach": "string",
    "tactics": ["string"],
    "risks": ["string"],
    "backup_plan": "string"
  },
  "next_actions": [
    {"action": "string", "priority": number, "reasoning": "string"}
  ],
  "what_worked": [],
  "what_didnt_work": [],
  "adjustments_needed": []
}
  `.trim();

  const completion = await openai.chat.completions.create({
    model: initialGoalsPrompt.default_llm_model || 'gpt-4o',
    messages: [
      { role: 'system', content: initialGoalsPrompt.system_prompt },
      { role: 'user', content: contextForAI }
    ],
    temperature: initialGoalsPrompt.default_temperature || 0.8,
    max_tokens: initialGoalsPrompt.default_max_tokens || 4096,
    response_format: { type: 'json_object' }
  });

  const goalsJson = completion.choices[0].message.content;
  if (!goalsJson) {
    throw new Error('AI did not return goals JSON');
  }

  const block4: Block4Goals = JSON.parse(goalsJson);
  logger.success('Block 4 generated by AI', {
    primary_goal: block4.primary_goal.objective,
    secondary_goals_count: block4.secondary_goals.length
  });

  // ========================================================================
  // STEP 7: Save to ai_context table
  // ========================================================================
  logger.info('Saving AI context to database...');

  const aiContext = await saveAIContext({
    run_id: simRunId,
    role_id: roleId,
    block_1_fixed: block1 as any,
    block_2_identity: block2 as any,
    block_3_memory: block3 as any,
    block_4_goals: block4 as any,
    updated_trigger: 'initialization',
    updated_reason: 'Character created at simulation start'
  });

  logger.success('AI context saved', {
    context_id: aiContext.context_id,
    version: aiContext.version
  });

  logger.complete('Character initialization complete', {
    character: block2.name,
    clan: block2.clan,
    context_id: aiContext.context_id
  });

  return aiContext;
}
