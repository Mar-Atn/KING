-- Update ai_prompts check constraint to include new prompt types for AI Character Prototype
-- This allows us to use more granular Block 1 prompts and new conversation prompts

-- Drop the old constraint
ALTER TABLE ai_prompts DROP CONSTRAINT IF EXISTS ai_prompts_prompt_type_check;

-- Add the new constraint with all prompt types
ALTER TABLE ai_prompts ADD CONSTRAINT ai_prompts_prompt_type_check
  CHECK (prompt_type IN (
    -- Original prompt types (keep for backward compatibility)
    'block_1_fixed',
    'block_2_identity_update',
    'block_3_memory_update',
    'block_4_goals_update',
    'action_decision',
    'public_speech',
    'personal_feedback',
    'debrief_analysis',
    'induction_assistant',

    -- NEW: AI Character Prototype prompt types
    -- Block 1 broken into 3 separate prompts
    'block_1_simulation_rules',
    'block_1_available_actions',
    'block_1_behavioral_framework',

    -- Block 2 (renamed for clarity)
    -- 'block_2_identity_update' already exists above

    -- Block 3 (renamed from memory_update to memory_compression)
    'block_3_memory_compression',

    -- Block 4 (renamed from goals_update to goals_adaptation)
    'block_4_goals_adaptation',

    -- NEW: Conversation system prompts
    'text_conversation_system',
    'initial_goals_generation',
    'voice_agent_system',
    'intent_notes_generation'
  ));

COMMENT ON CONSTRAINT ai_prompts_prompt_type_check ON ai_prompts IS
  'Allowed prompt types for both original system and AI Character Prototype';
