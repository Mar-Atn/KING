-- ============================================================================
-- Migration: 00004_init_ai_meta_tables.sql
-- Description: Create AI cognitive state and meta tables
-- Tables: ai_context, ai_prompts, sim_run_prompts, king_decisions, reflections
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- TABLE: ai_context (AI Participant Cognitive State)
-- ============================================================================
-- Purpose: Store versioned cognitive state for AI participants
-- Key Design: Four-block structure, versioned, only one current per role
-- ============================================================================

CREATE TABLE ai_context (
  -- Identity
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Version Control
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,

  -- The Four Blocks (as per KING_AI_DESIGN.md)

  -- Block 1: FIXED CONTEXT (set once, immutable)
  block_1_fixed JSONB NOT NULL,
  -- { world_rules, stages, structure, possible_actions, architecture }

  -- Block 2: IDENTITY (stable but can evolve)
  block_2_identity JSONB NOT NULL,
  -- { age, clan, role, backstory, values, personality, ... }

  -- Block 3: MEMORY (compacted, bounded)
  block_3_memory JSONB NOT NULL,
  -- { events: [...], relationships: {...}, obligations: [...], conflicts: [...] }

  -- Block 4: GOALS & PLANS (evolves frequently)
  block_4_goals JSONB NOT NULL,
  -- { goals: [...], hypotheses: [...], strategies: [...], priorities: [...] }

  -- Metadata
  updated_trigger TEXT, -- What caused this update (e.g., "speech_42", "meeting_15")
  updated_reason TEXT, -- AI's explanation for changes

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness constraint
  UNIQUE(role_id, version)
);

-- Indexes for ai_context
CREATE INDEX idx_ai_context_role ON ai_context(role_id);
CREATE INDEX idx_ai_context_current ON ai_context(role_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_ai_context_version ON ai_context(role_id, version DESC);
CREATE INDEX idx_ai_context_run ON ai_context(run_id);

-- GIN indexes for JSONB block queries
CREATE INDEX idx_ai_context_block1 ON ai_context USING GIN (block_1_fixed);
CREATE INDEX idx_ai_context_block2 ON ai_context USING GIN (block_2_identity);
CREATE INDEX idx_ai_context_block3 ON ai_context USING GIN (block_3_memory);
CREATE INDEX idx_ai_context_block4 ON ai_context USING GIN (block_4_goals);

-- Comments
COMMENT ON TABLE ai_context IS 'Versioned cognitive state for AI participants - four-block structure';
COMMENT ON COLUMN ai_context.version IS 'Version number - increments with each update';
COMMENT ON COLUMN ai_context.is_current IS 'Only ONE current version per role - old versions preserved for analysis';
COMMENT ON COLUMN ai_context.block_1_fixed IS 'Block 1: FIXED CONTEXT - set once at initialization, immutable';
COMMENT ON COLUMN ai_context.block_2_identity IS 'Block 2: IDENTITY - stable character definition, evolves slowly';
COMMENT ON COLUMN ai_context.block_3_memory IS 'Block 3: MEMORY - compacted event memory, bounded size';
COMMENT ON COLUMN ai_context.block_4_goals IS 'Block 4: GOALS & PLANS - frequently updated strategic thinking';
COMMENT ON COLUMN ai_context.updated_trigger IS 'Event that triggered this update (speech_id, meeting_id, etc.)';

-- ============================================================================
-- TABLE: ai_prompts (Centralized Prompt Management)
-- ============================================================================
-- Purpose: Store and version all AI prompts with metadata
-- Key Design: Versioned, only one active per type, facilitator can customize
-- ============================================================================

CREATE TABLE ai_prompts (
  -- Identity
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prompt Classification
  prompt_type TEXT NOT NULL CHECK (prompt_type IN (
    'block_1_fixed',           -- Block 1: FIXED CONTEXT system prompt
    'block_2_identity_update', -- Block 2: IDENTITY reflection prompt
    'block_3_memory_update',   -- Block 3: MEMORY reflection prompt
    'block_4_goals_update',    -- Block 4: GOALS & PLANS reflection prompt
    'action_decision',         -- Prompts for specific actions (vote, invite, etc.)
    'public_speech',           -- Prompt for generating public speeches
    'personal_feedback',       -- Prompt for generating personal feedback after simulation
    'debrief_analysis',        -- Prompt for analyzing simulation data for debrief
    'induction_assistant'      -- Prompt for AI induction assistant (Zenon)
  )),

  -- Versioning
  version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN NOT NULL DEFAULT FALSE, -- Only ONE active prompt per type

  -- Prompt Content
  system_prompt TEXT NOT NULL,
  -- The actual system prompt/instruction sent to LLM

  user_prompt_template TEXT,
  -- Optional template for user message (with {{variables}})
  -- Example: "NEW INFORMATION:\n{{new_context}}\n\nYOUR CURRENT STATE:\nIdentity: {{block_2}}\nMemory: {{block_3}}\nGoals: {{block_4}}\n\nUpdate your cognitive state."

  -- LLM Configuration
  default_llm_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  -- Suggested model, but can be overridden per sim_run

  default_temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (default_temperature >= 0 AND default_temperature <= 2),
  default_max_tokens INTEGER DEFAULT 4096 CHECK (default_max_tokens > 0),

  -- Metadata & Documentation
  name TEXT NOT NULL, -- Human-readable name: "Block 2 Identity Update v1.0"
  description TEXT,   -- What this prompt does
  usage_notes TEXT,   -- When/how to use this prompt

  -- Authorship & Timing
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness: prevent duplicate versions
  UNIQUE(prompt_type, version)
);

-- Indexes for ai_prompts
CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(prompt_type, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_prompts_created ON ai_prompts(created_at DESC);

-- Ensure only ONE active prompt per type
CREATE UNIQUE INDEX idx_ai_prompts_active_unique
  ON ai_prompts(prompt_type)
  WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE ai_prompts IS 'Centralized AI prompt management with versioning';
COMMENT ON COLUMN ai_prompts.prompt_type IS 'Type of prompt: block updates, actions, speeches, feedback, etc.';
COMMENT ON COLUMN ai_prompts.is_active IS 'Only ONE active prompt per type - facilitator can switch versions';
COMMENT ON COLUMN ai_prompts.system_prompt IS 'System message sent to LLM';
COMMENT ON COLUMN ai_prompts.user_prompt_template IS 'Template with {{variables}} for dynamic content';
COMMENT ON COLUMN ai_prompts.default_llm_model IS 'Recommended LLM model, can be overridden per simulation';

-- ============================================================================
-- TABLE: sim_run_prompts (Prompt Overrides per Simulation)
-- ============================================================================
-- Purpose: Allow per-simulation customization of AI prompts
-- Key Design: Override defaults for specific simulations
-- ============================================================================

CREATE TABLE sim_run_prompts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,

  -- Override Configuration
  custom_prompt_id UUID REFERENCES ai_prompts(prompt_id) ON DELETE SET NULL, -- If using custom prompt
  llm_model_override TEXT, -- Override default model for this simulation
  temperature_override DECIMAL(3,2) CHECK (temperature_override >= 0 AND temperature_override <= 2),
  max_tokens_override INTEGER CHECK (max_tokens_override > 0),

  -- Metadata
  notes TEXT, -- Why this override was made
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness: one override per run per prompt type
  UNIQUE(run_id, prompt_type)
);

-- Indexes for sim_run_prompts
CREATE INDEX idx_sim_run_prompts_run ON sim_run_prompts(run_id);
CREATE INDEX idx_sim_run_prompts_type ON sim_run_prompts(prompt_type);
CREATE INDEX idx_sim_run_prompts_custom ON sim_run_prompts(custom_prompt_id);

-- Comments
COMMENT ON TABLE sim_run_prompts IS 'Per-simulation AI prompt overrides';
COMMENT ON COLUMN sim_run_prompts.custom_prompt_id IS 'Reference to custom prompt version, NULL uses default active prompt';
COMMENT ON COLUMN sim_run_prompts.llm_model_override IS 'Override LLM model for this specific simulation';
COMMENT ON COLUMN sim_run_prompts.notes IS 'Facilitator notes explaining why override was needed';

-- ============================================================================
-- TABLE: king_decisions (Royal Decrees)
-- ============================================================================
-- Purpose: Store the King's final decisions after election
-- Key Design: One decree per simulation, structured JSONB
-- ============================================================================

CREATE TABLE king_decisions (
  -- Identity
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,

  -- King
  king_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Decisions (from KING_Decisions.md structure)
  taxes JSONB NOT NULL,
  -- { agriculture: 'lower'|'same'|'higher', trade: ..., banking: ..., craft: ... }

  budget_priorities JSONB NOT NULL,
  -- { priority_1: 'defense'|'culture'|..., priority_2: ..., priority_3: ... }

  appointments JSONB NOT NULL,
  -- { economic_advisor: role_id, senior_judge: role_id }

  international_affairs JSONB NOT NULL,
  -- { alliance: 'Salamis'|'Kition'|'none', war_declarations: [...] }

  other_decisions TEXT, -- Free text for custom decisions

  -- Final Speech
  final_speech_transcript TEXT,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness: one decree per run
  UNIQUE(run_id)
);

-- Indexes for king_decisions
CREATE INDEX idx_king_decisions_run ON king_decisions(run_id);
CREATE INDEX idx_king_decisions_king ON king_decisions(king_role_id);
CREATE INDEX idx_king_decisions_created ON king_decisions(created_at DESC);

-- GIN indexes for JSONB decision queries
CREATE INDEX idx_king_decisions_taxes ON king_decisions USING GIN (taxes);
CREATE INDEX idx_king_decisions_budget ON king_decisions USING GIN (budget_priorities);
CREATE INDEX idx_king_decisions_appointments ON king_decisions USING GIN (appointments);
CREATE INDEX idx_king_decisions_intl ON king_decisions USING GIN (international_affairs);

-- Comments
COMMENT ON TABLE king_decisions IS 'King final decisions and royal decree - one per simulation';
COMMENT ON COLUMN king_decisions.taxes IS 'Tax policy decisions for each sector (JSONB)';
COMMENT ON COLUMN king_decisions.budget_priorities IS 'Top 3 budget priorities (JSONB)';
COMMENT ON COLUMN king_decisions.appointments IS 'Key position appointments (JSONB with role_ids)';
COMMENT ON COLUMN king_decisions.international_affairs IS 'Alliances and war declarations (JSONB)';
COMMENT ON COLUMN king_decisions.final_speech_transcript IS 'King public address announcing decisions';

-- ============================================================================
-- TABLE: reflections (Individual Reflections)
-- ============================================================================
-- Purpose: Store participant reflections for learning assessment
-- Key Design: Personal, group, or AI-generated reflections
-- ============================================================================

CREATE TABLE reflections (
  -- Identity
  reflection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(phase_id) ON DELETE SET NULL, -- NULL for post-run reflection

  -- Author
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Type
  reflection_type TEXT NOT NULL CHECK (reflection_type IN (
    'personal',      -- Individual reflection
    'group',         -- Clan/group reflection
    'ai_generated'   -- AI-assisted reflection
  )),

  -- Content (text required, AI fields optional)
  reflection_text TEXT NOT NULL,

  -- AI Assistance (all optional)
  ai_summary TEXT, -- If AI processed this reflection
  ai_insights JSONB, -- Structured insights
  -- Example: { themes: [...], learning_outcomes: [...], suggestions: [...] }

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reflections
CREATE INDEX idx_reflections_run ON reflections(run_id);
CREATE INDEX idx_reflections_role ON reflections(role_id);
CREATE INDEX idx_reflections_phase ON reflections(phase_id);
CREATE INDEX idx_reflections_type ON reflections(reflection_type);
CREATE INDEX idx_reflections_created ON reflections(created_at DESC);

-- GIN index for AI insights
CREATE INDEX idx_reflections_insights ON reflections USING GIN (ai_insights);

-- Full-text search index for reflection content
CREATE INDEX idx_reflections_text_search ON reflections USING GIN (to_tsvector('english', reflection_text));

-- Comments
COMMENT ON TABLE reflections IS 'Participant reflections for learning assessment';
COMMENT ON COLUMN reflections.reflection_type IS 'Type: personal, group, or AI-generated';
COMMENT ON COLUMN reflections.reflection_text IS 'Main reflection content - required';
COMMENT ON COLUMN reflections.ai_summary IS 'AI-generated summary if reflection was processed';
COMMENT ON COLUMN reflections.ai_insights IS 'Structured AI analysis (themes, outcomes, suggestions)';

-- ============================================================================
-- AI & META TABLES MIGRATION COMPLETE
-- ============================================================================
-- Tables created: ai_context, ai_prompts, sim_run_prompts, king_decisions, reflections
-- Next migration: event log & supporting tables
-- ============================================================================
