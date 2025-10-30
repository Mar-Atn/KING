/**
 * AI Context Types - 4-Block Cognitive System
 */

/**
 * Block 1: Fixed Context (never changes during simulation)
 */
export interface Block1Fixed {
  simulation_rules: string;
  available_actions: string;
  behavioral_framework: string;
  cognitive_architecture_explanation: string;
}

/**
 * Block 2: Identity (mostly stable, updates only after significant events)
 */
export interface Block2Identity {
  // Basic info
  name: string;
  age: number;
  clan: string;
  position: string;

  // Personality
  core_traits: string[];
  strengths: string[];
  weaknesses: string[];

  // Clan & loyalty
  clan_alignment: number; // 0-100
  clan_priorities: string[];

  // Emotional state
  current_mood: string;
  current_concerns: string[];
  hopes_and_dreams: string[];

  // Voice characteristics (for voice conversations)
  speaking_style: string;
  common_phrases: string[];
}

/**
 * Block 3: Memory (dynamic, bounded to ≤2500 words)
 */
export interface Block3Memory {
  // Recent interactions
  recent_conversations: Array<{
    with_whom: string;
    when: string;
    key_points: string[];
  }>;

  // Relationships
  relationships: Record<string, {
    trust_level: number; // -100 to 100
    notes: string;
    promises_made: string[];
    promises_received: string[];
  }>;

  // Strategic insights
  strategic_insights: string[];
  observed_patterns: string[];

  // Conflicts & alliances
  conflicts: string[];
  alliances: string[];

  // Other important facts
  important_events: string[];
}

/**
 * Block 4: Goals & Strategy (dynamic, updates after each event)
 */
export interface Block4Goals {
  // Primary goal
  primary_goal: {
    objective: string;
    motivation: string;
    progress: string; // How close to achieving it
  };

  // Secondary goals
  secondary_goals: Array<{
    objective: string;
    priority: number; // 1-10
  }>;

  // Strategy
  current_strategy: {
    approach: string;
    tactics: string[];
    risks: string[];
    backup_plan: string;
  };

  // Next actions
  next_actions: Array<{
    action: string;
    priority: number;
    reasoning: string;
  }>;

  // Learning
  what_worked: string[];
  what_didnt_work: string[];
  adjustments_needed: string[];
}

/**
 * Complete AI Context (all 4 blocks)
 */
export interface AIContext {
  context_id: string;
  run_id: string;
  role_id: string;
  version: number;
  is_current: boolean;

  block_1_fixed: Block1Fixed;
  block_2_identity: Block2Identity;
  block_3_memory: Block3Memory;
  block_4_goals: Block4Goals;

  updated_trigger?: string;
  updated_reason?: string;
  created_at: string;
}

/**
 * Reflection input for updating blocks
 */
export interface ReflectionInput {
  characterId: string;
  trigger: 'conversation_end' | 'event' | 'scenario_injection';
  input: {
    transcript?: string;
    event_description?: string;
    currentBlocks: {
      block_1_fixed: Block1Fixed;
      block_2_identity: Block2Identity;
      block_3_memory: Block3Memory;
      block_4_goals: Block4Goals;
    };
  };
}

/**
 * Reflection result
 */
export interface ReflectionResult {
  before: AIContext;
  after: AIContext;
  changes: {
    identity: 'NO_CHANGE' | 'UPDATED';
    memory: {
      added: number;
      removed: number;
      compressed: boolean;
      final_word_count: number;
    };
    goals: {
      updated: boolean;
      reason: string;
    };
  };
}
