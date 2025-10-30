/**
 * Conversations Database Operations
 */

import type { Conversation } from '../types/conversation';
import { logger } from '../utils/logger';

/**
 * Create new conversation record
 */
export async function createConversation(
  conversation: Partial<Conversation>
): Promise<Conversation> {
  logger.db('Creating conversation', { roleId: conversation.role_id, modality: conversation.modality });

  // TODO: Insert into conversations table
  throw new Error('Not implemented yet - Phase 2, Days 4-5');
}

/**
 * Update conversation (end time, reflection results, etc.)
 */
export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<Conversation> {
  logger.db('Updating conversation', { conversationId });

  // TODO: Update conversations table
  throw new Error('Not implemented yet - Phase 2, Days 4-5');
}

/**
 * Load conversation history for a role
 */
export async function loadConversationHistory(roleId: string): Promise<Conversation[]> {
  logger.db('Loading conversation history', { roleId });

  // TODO: Query conversations where role_id = roleId, order by started_at DESC
  throw new Error('Not implemented yet - Phase 4, Days 13-17');
}
