-- ============================================================================
-- Migration: 00005_init_event_supporting_tables.sql
-- Description: Create event log and supporting tables
-- Tables: event_log, facilitator_actions, simulation_templates
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- TABLE: event_log (Audit Trail)
-- ============================================================================
-- Purpose: Capture all significant actions for replay, debugging, and analytics
-- Key Design: Event sourcing light - complete audit trail
-- ============================================================================

CREATE TABLE event_log (
  -- Identity
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,

  -- Event Classification
  event_type TEXT NOT NULL, -- e.g., 'phase_start', 'vote_cast', 'meeting_invite'
  module TEXT NOT NULL, -- e.g., 'stage_engine', 'voting', 'meetings'

  -- Actor
  actor_type TEXT NOT NULL CHECK (actor_type IN (
    'facilitator',
    'human_participant',
    'ai_participant',
    'system'
  )),
  actor_id UUID, -- role_id or user_id, NULL for system events

  -- Target (optional)
  target_type TEXT, -- e.g., 'phase', 'meeting', 'vote'
  target_id UUID,

  -- Payload
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Event-specific data

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event_log
CREATE INDEX idx_event_log_run ON event_log(run_id);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_module ON event_log(module);
CREATE INDEX idx_event_log_actor ON event_log(actor_id);
CREATE INDEX idx_event_log_actor_type ON event_log(actor_type);
CREATE INDEX idx_event_log_created ON event_log(created_at DESC);
CREATE INDEX idx_event_log_target ON event_log(target_type, target_id);

-- GIN index for payload queries
CREATE INDEX idx_event_log_payload ON event_log USING GIN (payload);

-- Composite index for common queries (events by run and type)
CREATE INDEX idx_event_log_run_type_created ON event_log(run_id, event_type, created_at DESC);

-- Comments
COMMENT ON TABLE event_log IS 'Complete audit trail for all simulation events - event sourcing light';
COMMENT ON COLUMN event_log.event_type IS 'Event type: phase_start, vote_cast, meeting_invite, etc.';
COMMENT ON COLUMN event_log.module IS 'Module that generated event: stage_engine, voting, meetings, etc.';
COMMENT ON COLUMN event_log.actor_type IS 'Who/what triggered event: facilitator, human, AI, or system';
COMMENT ON COLUMN event_log.actor_id IS 'ID of actor (role_id or user_id), NULL for system events';
COMMENT ON COLUMN event_log.payload IS 'Event-specific JSONB data for replay and analysis';

-- ============================================================================
-- TABLE: facilitator_actions (Manual Overrides)
-- ============================================================================
-- Purpose: Track facilitator manual interventions and overrides
-- Key Design: Audit trail for facilitator control actions
-- ============================================================================

CREATE TABLE facilitator_actions (
  -- Identity
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,

  -- Facilitator
  facilitator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action
  action_type TEXT NOT NULL, -- e.g., 'extend_phase', 'override_vote', 'mute_ai'
  target_type TEXT NOT NULL, -- e.g., 'phase', 'vote', 'role'
  target_id UUID NOT NULL,

  -- Details
  action_details JSONB NOT NULL, -- Old value, new value, reason
  -- Example: { "old_duration": 15, "new_duration": 20, "reason": "Intense discussion needs more time" }

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for facilitator_actions
CREATE INDEX idx_facilitator_actions_run ON facilitator_actions(run_id);
CREATE INDEX idx_facilitator_actions_facilitator ON facilitator_actions(facilitator_id);
CREATE INDEX idx_facilitator_actions_type ON facilitator_actions(action_type);
CREATE INDEX idx_facilitator_actions_target ON facilitator_actions(target_type, target_id);
CREATE INDEX idx_facilitator_actions_created ON facilitator_actions(created_at DESC);

-- GIN index for action_details
CREATE INDEX idx_facilitator_actions_details ON facilitator_actions USING GIN (action_details);

-- Comments
COMMENT ON TABLE facilitator_actions IS 'Audit trail for facilitator manual interventions';
COMMENT ON COLUMN facilitator_actions.action_type IS 'Type of intervention: extend_phase, override_vote, mute_ai, etc.';
COMMENT ON COLUMN facilitator_actions.target_type IS 'What was affected: phase, vote, role, etc.';
COMMENT ON COLUMN facilitator_actions.action_details IS 'JSONB with old/new values and reason for override';

-- ============================================================================
-- TABLE: simulation_templates (Canonical Seed Data Storage)
-- ============================================================================
-- Purpose: Store master simulation designs that can be instantiated
-- Key Design: Reusable templates with versioning
-- ============================================================================

CREATE TABLE simulation_templates (
  -- Identity
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'The New King of Kourion',
  version TEXT NOT NULL DEFAULT 'v1.0',
  language TEXT NOT NULL DEFAULT 'ENG' CHECK (language IN ('ENG', 'RU')),

  -- Canonical Design (parsed from seed files)
  context_text TEXT NOT NULL,
  -- Full text from KING_Context.md (world setting, general interests)

  process_stages JSONB NOT NULL,
  -- Parsed from KING_Process.csv
  -- [
  --   { sequence: 1, name: "Clan Councils 1", description: "...", default_duration_minutes: 10 },
  --   { sequence: 2, name: "Free Consultations 1", description: "...", default_duration_minutes: 15 },
  --   ...
  -- ]

  decisions_framework JSONB NOT NULL,
  -- Parsed from KING_Decisions.md
  -- {
  --   taxes: { options: ["lower", "same", "higher"], categories: ["agriculture", "trade", ...] },
  --   budget_priorities: { options: ["defense", "culture", "agriculture", ...] },
  --   appointments: { positions: ["economic_advisor", "senior_judge"] },
  --   international_affairs: { alliances: ["Salamis", "Kition", "none"], wars: [...] }
  -- }

  canonical_clans JSONB NOT NULL,
  -- Parsed from KING_ALL_CLANs.csv
  -- [
  --   {
  --     name: "Artificers",
  --     about: "Our clan represents...",
  --     key_priorities: "The best King must...",
  --     attitude_to_others: "We respect the Military...",
  --     if_things_go_wrong: "If the King fails..."
  --   },
  --   { name: "Bankers", ... },
  --   ...
  -- ]

  canonical_roles JSONB NOT NULL,
  -- Parsed from KING_ALL_ROLES.csv (up to 30 roles)
  -- [
  --   {
  --     sequence: 1,
  --     name: "Architekton Metrodoros Tekhnaios",
  --     clan: "Artificers",
  --     age: 44,
  --     position: "Master of Naval Engineering",
  --     background: "Metrodoros has designed...",
  --     character_traits: "Brilliant and innovative...",
  --     interests: "I believe my proven ability..."
  --   },
  --   { sequence: 2, name: "Sophia...", ... },
  --   ...
  -- ]

  -- Metadata
  description TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Uniqueness constraint
  UNIQUE(name, version, language)
);

-- Indexes for simulation_templates
CREATE INDEX idx_simulation_templates_active ON simulation_templates(is_active);
CREATE INDEX idx_simulation_templates_language ON simulation_templates(language);
CREATE INDEX idx_simulation_templates_version ON simulation_templates(name, version);
CREATE INDEX idx_simulation_templates_created ON simulation_templates(created_at DESC);

-- GIN indexes for JSONB template data
CREATE INDEX idx_simulation_templates_stages ON simulation_templates USING GIN (process_stages);
CREATE INDEX idx_simulation_templates_clans ON simulation_templates USING GIN (canonical_clans);
CREATE INDEX idx_simulation_templates_roles ON simulation_templates USING GIN (canonical_roles);
CREATE INDEX idx_simulation_templates_decisions ON simulation_templates USING GIN (decisions_framework);

-- Comments
COMMENT ON TABLE simulation_templates IS 'Master simulation designs - reusable templates with versioning';
COMMENT ON COLUMN simulation_templates.name IS 'Template name: "The New King of Kourion"';
COMMENT ON COLUMN simulation_templates.version IS 'Version identifier: v1.0, v1.1, etc.';
COMMENT ON COLUMN simulation_templates.language IS 'Language: ENG or RU';
COMMENT ON COLUMN simulation_templates.context_text IS 'Full context text from KING_Context.md';
COMMENT ON COLUMN simulation_templates.process_stages IS 'Stage definitions from KING_Process.csv';
COMMENT ON COLUMN simulation_templates.decisions_framework IS 'Decision structure from KING_Decisions.md';
COMMENT ON COLUMN simulation_templates.canonical_clans IS 'Clan definitions from KING_ALL_CLANs.csv';
COMMENT ON COLUMN simulation_templates.canonical_roles IS 'Role definitions from KING_ALL_ROLES.csv';
COMMENT ON COLUMN simulation_templates.is_active IS 'Active templates shown to facilitators';

-- ============================================================================
-- EVENT LOG & SUPPORTING TABLES MIGRATION COMPLETE
-- ============================================================================
-- Tables created: event_log, facilitator_actions, simulation_templates
-- Next migration: RLS policies for security
-- ============================================================================
