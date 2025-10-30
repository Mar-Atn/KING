/**
 * Prompts Database Operations
 */

import type { AIPrompt, PromptType } from '../types/prompts';
import { logger } from '../utils/logger';
import { supabase } from './supabase-client';

/**
 * Load active prompt by type
 */
export async function loadPrompt(promptType: PromptType): Promise<AIPrompt | null> {
  logger.db('Loading prompt', { promptType });

  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No active prompt found
      logger.warn('DB', 'No active prompt found for type', { promptType });
      return null;
    }
    logger.error('DB', 'Failed to load prompt', {
      error: error.message,
      promptType
    });
    throw new Error(`Failed to load prompt: ${error.message}`);
  }

  logger.db('Prompt loaded', {
    promptType,
    version: data.version,
    model: data.default_llm_model
  });

  return data as AIPrompt;
}

/**
 * Load all active prompts
 */
export async function loadAllActivePrompts(): Promise<Record<string, AIPrompt>> {
  logger.db('Loading all active prompts');

  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('is_active', true);

  if (error) {
    logger.error('DB', 'Failed to load all prompts', { error: error.message });
    throw new Error(`Failed to load all prompts: ${error.message}`);
  }

  // Convert array to record keyed by prompt_type
  const promptsRecord: Record<string, AIPrompt> = {};
  data.forEach((prompt) => {
    promptsRecord[prompt.prompt_type] = prompt as AIPrompt;
  });

  logger.db('All active prompts loaded', { count: data.length });

  return promptsRecord;
}

/**
 * Save new prompt version
 */
export async function savePrompt(prompt: Partial<AIPrompt>): Promise<AIPrompt> {
  const { prompt_type, is_active } = prompt;

  if (!prompt_type) {
    throw new Error('prompt_type is required');
  }

  logger.db('Saving prompt', {
    promptType: prompt_type,
    version: prompt.version,
    isActive: is_active
  });

  // If this prompt should be active, deactivate current active prompt of same type
  if (is_active) {
    const { error: updateError } = await supabase
      .from('ai_prompts')
      .update({ is_active: false })
      .eq('prompt_type', prompt_type)
      .eq('is_active', true);

    if (updateError) {
      logger.error('DB', 'Failed to deactivate old prompt', {
        error: updateError.message,
        promptType: prompt_type
      });
      throw new Error(`Failed to deactivate old prompt: ${updateError.message}`);
    }
  }

  // Insert new prompt version
  const newPrompt: Partial<AIPrompt> = {
    ...prompt,
    created_at: new Date().toISOString()
  };

  const { data, error: insertError } = await supabase
    .from('ai_prompts')
    .insert(newPrompt)
    .select()
    .single();

  if (insertError) {
    logger.error('DB', 'Failed to insert new prompt', {
      error: insertError.message,
      promptType: prompt_type
    });
    throw new Error(`Failed to save prompt: ${insertError.message}`);
  }

  logger.db('Prompt saved', {
    promptType: prompt_type,
    version: prompt.version,
    isActive: is_active
  });

  return data as AIPrompt;
}

/**
 * Get all versions of a prompt type
 */
export async function getPromptHistory(promptType: PromptType): Promise<AIPrompt[]> {
  logger.db('Loading prompt history', { promptType });

  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('prompt_type', promptType)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('DB', 'Failed to load prompt history', {
      error: error.message,
      promptType
    });
    throw new Error(`Failed to load prompt history: ${error.message}`);
  }

  logger.db('Prompt history loaded', {
    promptType,
    versions: data.length
  });

  return data as AIPrompt[];
}
