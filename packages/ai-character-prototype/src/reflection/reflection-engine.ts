/**
 * Reflection Engine
 *
 * Updates Blocks 2-4 after conversations/events using 3 parallel AI calls
 */

import type {
  ReflectionInput,
  ReflectionResult,
  AIContext,
  Block2Identity,
  Block3Memory,
  Block4Goals
} from '../types/ai-context';
import { logger } from '../utils/logger';
import { loadAIContext, saveAIContext } from '../database/ai-context-db';
import { loadPrompt } from '../database/prompts-db';
import { validateMemorySize, countWords } from '../utils/word-counter';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Trigger reflection after conversation/event
 *
 * Process:
 * 1. Load current AI context
 * 2. Load reflection prompts (block_2_identity_update, block_3_memory_compression, block_4_goals_adaptation)
 * 3. Make 3 parallel OpenAI calls (Promise.all)
 * 4. Validate responses (JSON structure, memory ≤2500 words)
 * 5. Save new AI context version
 * 6. Return before/after comparison
 */
export async function triggerReflection(
  input: ReflectionInput
): Promise<ReflectionResult> {
  const { characterId, trigger, input: reflectionInput } = input;

  logger.reflect('Starting reflection', {
    characterId,
    trigger
  });

  // ========================================================================
  // STEP 1: Load current AI context
  // ========================================================================
  logger.info('Loading current AI context...');

  const currentContext = await loadAIContext(characterId);
  if (!currentContext) {
    throw new Error(`No AI context found for character: ${characterId}`);
  }

  logger.success('Current context loaded', {
    version: currentContext.version,
    context_id: currentContext.context_id
  });

  // ========================================================================
  // STEP 2: Load reflection prompts (3 prompts for Blocks 2-4)
  // ========================================================================
  logger.info('Loading reflection prompts...');

  const [identityPrompt, memoryPrompt, goalsPrompt] = await Promise.all([
    loadPrompt('block_2_identity_update'),
    loadPrompt('block_3_memory_compression'),
    loadPrompt('block_4_goals_adaptation')
  ]);

  if (!identityPrompt || !memoryPrompt || !goalsPrompt) {
    throw new Error('Missing required reflection prompts in database');
  }

  logger.success('Reflection prompts loaded', {
    identity: identityPrompt.name,
    memory: memoryPrompt.name,
    goals: goalsPrompt.name
  });

  // ========================================================================
  // STEP 3: Prepare context for AI
  // ========================================================================
  const contextForAI = prepareReflectionContext(reflectionInput, currentContext);

  // ========================================================================
  // STEP 4: Make 3 parallel AI calls
  // ========================================================================
  logger.info('Making 3 parallel AI calls for Blocks 2-4...');

  const startTime = Date.now();

  const [block2Result, block3Result, block4Result] = await Promise.allSettled([
    // Block 2: Identity Update (rare changes)
    updateIdentity(identityPrompt, contextForAI),

    // Block 3: Memory Compression (bounded to ≤2500 words)
    compressMemory(memoryPrompt, contextForAI),

    // Block 4: Goals Adaptation (frequent updates)
    adaptGoals(goalsPrompt, contextForAI)
  ]);

  const duration = Date.now() - startTime;
  logger.success('Parallel AI calls completed', {
    duration_ms: duration,
    block2_status: block2Result.status,
    block3_status: block3Result.status,
    block4_status: block4Result.status
  });

  // ========================================================================
  // STEP 5: Handle partial failures gracefully
  // ========================================================================
  const newBlock2 =
    block2Result.status === 'fulfilled'
      ? block2Result.value
      : currentContext.block_2_identity;

  const newBlock3 =
    block3Result.status === 'fulfilled'
      ? block3Result.value
      : currentContext.block_3_memory;

  const newBlock4 =
    block4Result.status === 'fulfilled'
      ? block4Result.value
      : currentContext.block_4_goals;

  // Log any failures
  if (block2Result.status === 'rejected') {
    logger.error('Block 2 update failed', { error: block2Result.reason.message });
  }
  if (block3Result.status === 'rejected') {
    logger.error('Block 3 update failed', { error: block3Result.reason.message });
  }
  if (block4Result.status === 'rejected') {
    logger.error('Block 4 update failed', { error: block4Result.reason.message });
  }

  // ========================================================================
  // STEP 6: Validate Block 3 memory size
  // ========================================================================
  const memoryValidation = validateMemorySize(newBlock3);

  if (!memoryValidation.valid) {
    logger.warn('Memory exceeds limit, keeping old memory', {
      wordCount: memoryValidation.wordCount,
      message: memoryValidation.message
    });
    // Revert to old memory
    Object.assign(newBlock3, currentContext.block_3_memory);
  } else {
    logger.success('Memory within limit', {
      wordCount: memoryValidation.wordCount
    });
  }

  // ========================================================================
  // STEP 7: Calculate changes summary
  // ========================================================================
  const changes = calculateChanges(
    currentContext,
    newBlock2,
    newBlock3,
    newBlock4
  );

  logger.info('Changes summary', changes);

  // ========================================================================
  // STEP 8: Save new AI context version
  // ========================================================================
  logger.info('Saving new AI context version...');

  const updatedContext = await saveAIContext({
    run_id: currentContext.run_id,
    role_id: currentContext.role_id,
    block_1_fixed: currentContext.block_1_fixed,
    block_2_identity: newBlock2 as any,
    block_3_memory: newBlock3 as any,
    block_4_goals: newBlock4 as any,
    updated_trigger: trigger,
    updated_reason: `Reflection after ${trigger}`
  });

  logger.success('New context version saved', {
    context_id: updatedContext.context_id,
    version: updatedContext.version
  });

  // ========================================================================
  // STEP 9: Return before/after comparison
  // ========================================================================
  const result: ReflectionResult = {
    before: currentContext,
    after: updatedContext,
    changes
  };

  logger.complete('Reflection complete', {
    version_before: currentContext.version,
    version_after: updatedContext.version,
    identity_changed: changes.identity === 'UPDATED',
    memory_compressed: changes.memory.compressed,
    goals_updated: changes.goals.updated
  });

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Prepare context string for AI reflection calls
 */
function prepareReflectionContext(
  reflectionInput: ReflectionInput['input'],
  currentContext: AIContext
): string {
  const sections: string[] = [];

  // Current blocks
  sections.push('# CURRENT AI CONTEXT');
  sections.push('');
  sections.push('## Block 2: Identity');
  sections.push(JSON.stringify(reflectionInput.currentBlocks.block_2_identity, null, 2));
  sections.push('');
  sections.push('## Block 3: Memory');
  sections.push(JSON.stringify(reflectionInput.currentBlocks.block_3_memory, null, 2));
  sections.push('');
  sections.push('## Block 4: Goals & Strategy');
  sections.push(JSON.stringify(reflectionInput.currentBlocks.block_4_goals, null, 2));
  sections.push('');

  // Event/conversation that triggered reflection
  if (reflectionInput.transcript) {
    sections.push('# RECENT CONVERSATION');
    sections.push('');
    sections.push(reflectionInput.transcript);
    sections.push('');
  }

  if (reflectionInput.event_description) {
    sections.push('# EVENT DESCRIPTION');
    sections.push('');
    sections.push(reflectionInput.event_description);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Update Block 2: Identity (rarely changes)
 */
async function updateIdentity(
  prompt: any,
  context: string
): Promise<Block2Identity> {
  logger.info('Updating Block 2 (Identity)...');

  const completion = await openai.chat.completions.create({
    model: prompt.default_llm_model || 'gpt-4o',
    messages: [
      { role: 'system', content: prompt.system_prompt },
      {
        role: 'user',
        content: `${context}\n\nAnalyze if the character's identity has shifted. Return JSON with the updated Block 2 structure.`
      }
    ],
    temperature: prompt.default_temperature || 0.7,
    max_tokens: prompt.default_max_tokens || 4096,
    response_format: { type: 'json_object' }
  });

  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error('No response from identity update');
  }

  const block2 = JSON.parse(result) as Block2Identity;
  logger.success('Block 2 updated', { name: block2.name });

  return block2;
}

/**
 * Update Block 3: Memory Compression (AI decides what to keep)
 */
async function compressMemory(
  prompt: any,
  context: string
): Promise<Block3Memory> {
  logger.info('Compressing Block 3 (Memory)...');

  const completion = await openai.chat.completions.create({
    model: prompt.default_llm_model || 'gpt-4o',
    messages: [
      { role: 'system', content: prompt.system_prompt },
      {
        role: 'user',
        content: `${context}\n\nCompress memory to ≤2500 words. YOU decide what's important. Return JSON with updated Block 3 structure.`
      }
    ],
    temperature: prompt.default_temperature || 0.8,
    max_tokens: prompt.default_max_tokens || 4096,
    response_format: { type: 'json_object' }
  });

  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error('No response from memory compression');
  }

  const block3 = JSON.parse(result) as Block3Memory;
  const wordCount = countWords(block3);

  logger.success('Block 3 compressed', {
    wordCount,
    conversationsCount: block3.recent_conversations.length,
    relationshipsCount: Object.keys(block3.relationships).length
  });

  return block3;
}

/**
 * Update Block 4: Goals Adaptation (strategic updates)
 */
async function adaptGoals(
  prompt: any,
  context: string
): Promise<Block4Goals> {
  logger.info('Adapting Block 4 (Goals)...');

  const completion = await openai.chat.completions.create({
    model: prompt.default_llm_model || 'gpt-4o',
    messages: [
      { role: 'system', content: prompt.system_prompt },
      {
        role: 'user',
        content: `${context}\n\nAdapt your strategy based on what you learned. Return JSON with updated Block 4 structure.`
      }
    ],
    temperature: prompt.default_temperature || 0.8,
    max_tokens: prompt.default_max_tokens || 4096,
    response_format: { type: 'json_object' }
  });

  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error('No response from goals adaptation');
  }

  const block4 = JSON.parse(result) as Block4Goals;

  logger.success('Block 4 adapted', {
    primaryGoal: block4.primary_goal.objective,
    secondaryGoalsCount: block4.secondary_goals.length,
    nextActionsCount: block4.next_actions.length
  });

  return block4;
}

/**
 * Calculate what changed between before/after
 */
function calculateChanges(
  before: AIContext,
  newBlock2: Block2Identity,
  newBlock3: Block3Memory,
  newBlock4: Block4Goals
): ReflectionResult['changes'] {
  // Check if identity changed (deep comparison would be better, but simple check for now)
  const identityChanged =
    JSON.stringify(before.block_2_identity) !== JSON.stringify(newBlock2);

  // Memory stats
  const memoryBefore = countWords(before.block_3_memory);
  const memoryAfter = countWords(newBlock3);
  const memoryCompressed = memoryAfter < memoryBefore;

  const conversationsBefore = before.block_3_memory.recent_conversations?.length || 0;
  const conversationsAfter = newBlock3.recent_conversations?.length || 0;

  // Goals changed
  const goalsChanged =
    JSON.stringify(before.block_4_goals) !== JSON.stringify(newBlock4);

  return {
    identity: identityChanged ? 'UPDATED' : 'NO_CHANGE',
    memory: {
      added: Math.max(0, conversationsAfter - conversationsBefore),
      removed: Math.max(0, conversationsBefore - conversationsAfter),
      compressed: memoryCompressed,
      final_word_count: memoryAfter
    },
    goals: {
      updated: goalsChanged,
      reason: goalsChanged
        ? 'Goals adapted based on recent events'
        : 'No strategic changes needed'
    }
  };
}
