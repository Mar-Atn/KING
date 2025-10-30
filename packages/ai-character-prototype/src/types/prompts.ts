/**
 * Prompt Types
 */

/**
 * Prompt type identifier
 */
export type PromptType =
  | 'block_1_simulation_rules'
  | 'block_1_available_actions'
  | 'block_1_behavioral_framework'
  | 'block_2_identity_update'
  | 'block_3_memory_compression'
  | 'block_4_goals_adaptation'
  | 'text_conversation_system'
  | 'initial_goals_generation'
  | 'voice_agent_system'
  | 'intent_notes_generation';

/**
 * AI Prompt template
 */
export interface AIPrompt {
  prompt_id: string;
  prompt_type: PromptType;
  version: string;
  is_active: boolean;

  // Prompt content
  system_prompt: string;
  user_prompt_template?: string;

  // Model configuration
  default_llm_model: string;
  default_temperature: number;
  default_max_tokens: number;

  // Metadata
  name: string;
  description: string;
  created_at: string;
}

/**
 * Intent notes for voice conversations
 */
export interface IntentNotes {
  goal: string;
  tone: string;
  tactics: string[];
  boundaries: string[];
  time_limit: string;
  opening_statement?: string;
}
