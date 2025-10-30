/**
 * Conversation Types
 */

/**
 * Conversation modality
 */
export type ConversationModality = 'text' | 'voice' | 'combined';

/**
 * Message in conversation
 */
export interface ConversationMessage {
  speaker: 'Admin' | 'Character';
  text: string;
  timestamp: string;
}

/**
 * Conversation metadata
 */
export interface Conversation {
  conversation_id: string;
  role_id: string;

  // Timestamps
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;

  // Mode
  modality: ConversationModality;

  // Content
  transcript: ConversationMessage[];

  // Voice-specific
  elevenlabs_conversation_id?: string;

  // Reflection
  reflection_triggered: boolean;
  ai_context_version_before?: number;
  ai_context_version_after?: number;

  // Metrics
  total_messages: number;
  avg_response_time_seconds?: number;
  total_tokens_used?: number;
  estimated_cost_usd?: number;

  // Testing
  scenario_injected?: Record<string, any>;
  notes?: string;

  created_at: string;
}

/**
 * OpenAI Realtime session configuration
 */
export interface RealtimeSessionConfig {
  model: 'gpt-4o-realtime-preview-2024-10-01';
  modalities: ['text'] | ['audio'] | ['text', 'audio'];
  instructions: string;

  // Voice settings
  voice?: 'alloy' | 'echo' | 'shimmer';
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';

  // Turn detection
  turn_detection?: {
    type: 'server_vad';
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };

  // Model parameters
  temperature: number;
  max_response_output_tokens: number;
}

/**
 * Conversation metrics
 */
export interface ConversationMetrics {
  totalTokens: {
    text_input: number;
    text_output: number;
    audio_input: number;
    audio_output: number;
  };
  totalCost: number;
  avgResponseTime: number;
}
