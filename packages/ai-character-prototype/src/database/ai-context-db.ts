/**
 * AI Context Database Operations
 */

import type { AIContext } from '../types/ai-context';
import { logger } from '../utils/logger';
import { supabase } from './supabase-client';

/**
 * Load current AI context for a role
 */
export async function loadAIContext(roleId: string): Promise<AIContext | null> {
  logger.db('Loading AI context', { roleId });

  const { data, error } = await supabase
    .from('ai_context')
    .select('*')
    .eq('role_id', roleId)
    .eq('is_current', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - character not initialized yet
      logger.db('No current AI context found', { roleId });
      return null;
    }
    logger.error('DB', 'Failed to load AI context', { error: error.message, roleId });
    throw new Error(`Failed to load AI context: ${error.message}`);
  }

  logger.db('AI context loaded', { roleId, version: data.version });
  return data as AIContext;
}

/**
 * Save new AI context version
 */
export async function saveAIContext(context: Partial<AIContext>): Promise<AIContext> {
  const { role_id, run_id } = context;

  if (!role_id) {
    throw new Error('role_id is required');
  }

  logger.db('Saving AI context', { roleId: role_id, version: context.version });

  // Start a transaction-like operation
  // Step 1: Get current version to determine next version number
  const currentContext = await loadAIContext(role_id);
  const nextVersion = currentContext ? currentContext.version + 1 : 1;

  // Step 2: Mark current version as no longer current
  if (currentContext) {
    const { error: updateError } = await supabase
      .from('ai_context')
      .update({ is_current: false })
      .eq('role_id', role_id)
      .eq('is_current', true);

    if (updateError) {
      logger.error('DB', 'Failed to mark old version as not current', {
        error: updateError.message,
        roleId: role_id
      });
      throw new Error(`Failed to update old context: ${updateError.message}`);
    }
  }

  // Step 3: Insert new version
  const newContext: Partial<AIContext> = {
    ...context,
    version: nextVersion,
    is_current: true,
    created_at: new Date().toISOString()
  };

  const { data, error: insertError } = await supabase
    .from('ai_context')
    .insert(newContext)
    .select()
    .single();

  if (insertError) {
    logger.error('DB', 'Failed to insert new AI context', {
      error: insertError.message,
      roleId: role_id
    });
    throw new Error(`Failed to save AI context: ${insertError.message}`);
  }

  logger.db('AI context saved', {
    roleId: role_id,
    version: nextVersion,
    trigger: context.updated_trigger
  });

  return data as AIContext;
}

/**
 * Get AI context version history
 */
export async function getContextHistory(roleId: string): Promise<AIContext[]> {
  logger.db('Loading context history', { roleId });

  const { data, error } = await supabase
    .from('ai_context')
    .select('*')
    .eq('role_id', roleId)
    .order('version', { ascending: false });

  if (error) {
    logger.error('DB', 'Failed to load context history', {
      error: error.message,
      roleId
    });
    throw new Error(`Failed to load context history: ${error.message}`);
  }

  logger.db('Context history loaded', {
    roleId,
    versions: data.length
  });

  return data as AIContext[];
}

/**
 * Get specific version of AI context
 */
export async function getContextVersion(
  roleId: string,
  version: number
): Promise<AIContext | null> {
  logger.db('Loading specific context version', { roleId, version });

  const { data, error } = await supabase
    .from('ai_context')
    .select('*')
    .eq('role_id', roleId)
    .eq('version', version)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      logger.db('Context version not found', { roleId, version });
      return null;
    }
    logger.error('DB', 'Failed to load context version', {
      error: error.message,
      roleId,
      version
    });
    throw new Error(`Failed to load context version: ${error.message}`);
  }

  return data as AIContext;
}
