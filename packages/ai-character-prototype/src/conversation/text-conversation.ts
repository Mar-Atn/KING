/**
 * Text Conversation Handler
 *
 * OpenAI Realtime API for text-based conversations
 */

import WebSocket from 'ws';
import type { ConversationMessage } from '../types/conversation';
import type { ReflectionResult, AIContext } from '../types/ai-context';
import { logger } from '../utils/logger';
import { loadAIContext } from '../database/ai-context-db';
import { buildSystemPrompt } from '../core/system-prompt';
import { triggerReflection } from '../reflection/reflection-engine';
import { supabase } from '../database/supabase-client';
import { randomUUID } from 'crypto';

interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

export class CharacterConversation {
  private characterId: string = '';
  private conversationId: string = '';
  private transcript: ConversationMessage[] = [];
  private ws?: WebSocket;
  private aiContext?: AIContext;
  private startedAt?: Date;
  private responseBuffer: string = '';
  private isWaitingForResponse: boolean = false;
  private responseResolve?: (text: string) => void;
  private sessionId?: string;

  /**
   * Initialize conversation session
   *
   * Process:
   * 1. Load character's AI context
   * 2. Build system prompt from 4 blocks
   * 3. Connect to OpenAI Realtime API WebSocket
   * 4. Configure session for text mode
   * 5. Set up event listeners
   * 6. Create conversation record in database
   */
  async initialize(characterId: string): Promise<void> {
    this.characterId = characterId;
    this.startedAt = new Date();
    logger.conv('Initializing text conversation', { characterId });

    // ========================================================================
    // STEP 1: Load character's AI context
    // ========================================================================
    logger.info('Loading character AI context...');

    this.aiContext = await loadAIContext(characterId);
    if (!this.aiContext) {
      throw new Error(`No AI context found for character: ${characterId}`);
    }

    logger.success('AI context loaded', {
      version: this.aiContext.version,
      character: this.aiContext.block_2_identity.name
    });

    // ========================================================================
    // STEP 2: Build system prompt from 4 blocks
    // ========================================================================
    logger.info('Building system prompt...');

    const systemPrompt = buildSystemPrompt({
      block1: this.aiContext.block_1_fixed,
      block2: this.aiContext.block_2_identity,
      block3: this.aiContext.block_3_memory,
      block4: this.aiContext.block_4_goals,
      mode: 'conversation'
    });

    logger.success('System prompt built', {
      length: systemPrompt.length,
      wordCount: systemPrompt.split(/\s+/).length
    });

    // ========================================================================
    // STEP 3: Create conversation record in database
    // ========================================================================
    this.conversationId = randomUUID();

    const { error: insertError } = await supabase
      .from('conversations')
      .insert({
        conversation_id: this.conversationId,
        role_id: characterId,
        modality: 'text',
        transcript: [],
        ai_context_version_before: this.aiContext.version,
        started_at: this.startedAt.toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create conversation: ${insertError.message}`);
    }

    logger.success('Conversation record created', {
      conversationId: this.conversationId
    });

    // ========================================================================
    // STEP 4: Connect to OpenAI Realtime API WebSocket
    // ========================================================================
    logger.info('Connecting to OpenAI Realtime API...');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment');
    }

    this.ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    // Set up WebSocket event listeners
    await this.setupWebSocket(systemPrompt);

    logger.complete('Text conversation initialized', {
      characterId,
      conversationId: this.conversationId,
      character: this.aiContext.block_2_identity.name
    });
  }

  /**
   * Set up WebSocket connection and event listeners
   */
  private setupWebSocket(systemPrompt: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        return reject(new Error('WebSocket not initialized'));
      }

      this.ws.on('open', () => {
        logger.success('WebSocket connected');

        // Configure session for text mode
        this.send({
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions: systemPrompt,
            voice: null,
            input_audio_format: null,
            output_audio_format: null,
            input_audio_transcription: null,
            turn_detection: null,
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        });
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString()) as RealtimeEvent;
          this.handleEvent(event);

          if (event.type === 'session.created') {
            this.sessionId = event.session.id;
            logger.success('Session created', { sessionId: this.sessionId });
            resolve();
          }
        } catch (error) {
          logger.error('Failed to parse WebSocket message', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      this.ws.on('error', (error) => {
        logger.error('WebSocket error', {
          error: error.message
        });
        reject(error);
      });

      this.ws.on('close', () => {
        logger.info('WebSocket closed');
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.sessionId) {
          reject(new Error('Session creation timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Handle incoming WebSocket events
   */
  private handleEvent(event: RealtimeEvent): void {
    logger.db('Realtime event', { type: event.type });

    switch (event.type) {
      case 'session.created':
        // Already handled in setupWebSocket
        break;

      case 'session.updated':
        logger.success('Session updated');
        break;

      case 'response.text.delta':
        // Streaming text response
        if (event.delta) {
          this.responseBuffer += event.delta;
          process.stdout.write(event.delta); // Stream to console for visibility
        }
        break;

      case 'response.text.done':
        // Complete text response received
        if (this.responseResolve) {
          this.responseResolve(this.responseBuffer);
          this.responseResolve = undefined;
        }

        // Add AI response to transcript
        this.transcript.push({
          role: 'assistant',
          content: this.responseBuffer,
          timestamp: new Date().toISOString()
        });

        this.responseBuffer = '';
        this.isWaitingForResponse = false;
        logger.success('Response complete', {
          length: this.transcript[this.transcript.length - 1].content.length
        });
        break;

      case 'response.done':
        logger.info('Response fully completed');
        break;

      case 'error':
        logger.error('Realtime API error', {
          error: event.error
        });
        break;

      default:
        // Log other events for debugging
        logger.db('Unhandled event', { type: event.type });
    }
  }

  /**
   * Send event to OpenAI Realtime API
   */
  private send(event: RealtimeEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify(event));
  }

  /**
   * Send message to character and wait for response
   */
  async sendMessage(text: string): Promise<string> {
    logger.conv('Sending message', { preview: text.substring(0, 100) });

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Conversation not initialized or connection closed');
    }

    if (this.isWaitingForResponse) {
      throw new Error('Still waiting for previous response');
    }

    // Add user message to transcript
    this.transcript.push({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    // Create conversation item (user message)
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    });

    // Trigger response generation
    this.send({
      type: 'response.create',
      response: {
        modalities: ['text'],
        instructions: ''
      }
    });

    // Wait for response
    this.isWaitingForResponse = true;
    this.responseBuffer = '';

    return new Promise((resolve) => {
      this.responseResolve = resolve;
    });
  }

  /**
   * End conversation and trigger reflection
   *
   * Process:
   * 1. Close WebSocket connection
   * 2. Calculate conversation duration and stats
   * 3. Update conversation record in database
   * 4. Trigger reflection engine
   * 5. Update conversation with new AI context version
   * 6. Return reflection result
   */
  async endConversation(): Promise<ReflectionResult> {
    logger.conv('Ending conversation', {
      messageCount: this.transcript.length,
      conversationId: this.conversationId
    });

    // ========================================================================
    // STEP 1: Close WebSocket
    // ========================================================================
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      logger.info('WebSocket closed');
    }

    // ========================================================================
    // STEP 2: Calculate stats
    // ========================================================================
    const endedAt = new Date();
    const durationSeconds = this.startedAt
      ? Math.floor((endedAt.getTime() - this.startedAt.getTime()) / 1000)
      : 0;

    const totalMessages = this.transcript.length;

    logger.info('Conversation stats', {
      duration: durationSeconds,
      totalMessages
    });

    // ========================================================================
    // STEP 3: Update conversation record
    // ========================================================================
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        transcript: this.transcript,
        total_messages: totalMessages
      })
      .eq('conversation_id', this.conversationId);

    if (updateError) {
      logger.error('Failed to update conversation', {
        error: updateError.message
      });
    } else {
      logger.success('Conversation record updated');
    }

    // ========================================================================
    // STEP 4: Trigger reflection engine
    // ========================================================================
    logger.info('Triggering reflection engine...');

    if (!this.aiContext) {
      throw new Error('AI context not loaded');
    }

    // Build transcript as text
    const transcriptText = this.transcript
      .map(msg => `${msg.role === 'user' ? 'User' : this.aiContext!.block_2_identity.name}: ${msg.content}`)
      .join('\n\n');

    const reflectionResult = await triggerReflection({
      characterId: this.characterId,
      trigger: 'conversation_end',
      input: {
        transcript: transcriptText,
        currentBlocks: {
          block_1_fixed: this.aiContext.block_1_fixed,
          block_2_identity: this.aiContext.block_2_identity,
          block_3_memory: this.aiContext.block_3_memory,
          block_4_goals: this.aiContext.block_4_goals
        }
      }
    });

    logger.success('Reflection complete');

    // ========================================================================
    // STEP 5: Mark reflection triggered in conversation record
    // ========================================================================
    await supabase
      .from('conversations')
      .update({
        reflection_triggered: true,
        ai_context_version_after: reflectionResult.after.version
      })
      .eq('conversation_id', this.conversationId);

    logger.complete('Conversation ended and reflected', {
      conversationId: this.conversationId,
      versionBefore: reflectionResult.before.version,
      versionAfter: reflectionResult.after.version
    });

    return reflectionResult;
  }

  /**
   * Get current transcript
   */
  getTranscript(): ConversationMessage[] {
    return [...this.transcript];
  }

  /**
   * Get conversation ID
   */
  getConversationId(): string {
    return this.conversationId;
  }
}
