/**
 * Text Conversation Handler
 *
 * OpenAI Realtime API for text-based conversations
 */

import type { ConversationMessage } from '../types/conversation';
import type { ReflectionResult } from '../types/ai-context';
import { logger } from '../utils/logger';

export class CharacterConversation {
  private conversationId?: string;
  private transcript: ConversationMessage[] = [];

  /**
   * Initialize conversation session
   *
   * @TODO Implement:
   * 1. Load character's AI context
   * 2. Build system prompt from 4 blocks
   * 3. Initialize OpenAI Realtime client
   * 4. Connect WebSocket
   * 5. Set up event listeners
   * 6. Create conversation record in database
   */
  async initialize(characterId: string): Promise<void> {
    logger.conv('Initializing text conversation', { characterId });

    // TODO: Implement - Phase 2, Days 4-5
    throw new Error('Not implemented yet - Phase 2, Days 4-5');
  }

  /**
   * Send message to character
   */
  async sendMessage(text: string): Promise<void> {
    logger.conv('Sending message', { preview: text.substring(0, 50) });

    // TODO: Implement
    throw new Error('Not implemented yet - Phase 2, Days 4-5');
  }

  /**
   * End conversation and trigger reflection
   */
  async endConversation(): Promise<ReflectionResult> {
    logger.conv('Ending conversation', { messageCount: this.transcript.length });

    // TODO: Implement
    throw new Error('Not implemented yet - Phase 2, Days 6-7');
  }
}
