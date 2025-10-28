-- ============================================================================
-- Migration: 00001_init_core_tables.sql
-- Description: Create core tables for The New King SIM
-- Tables: sim_runs, users, access_tokens, clans, roles, phases
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: sim_runs (Simulation Instances)
-- ============================================================================
-- Purpose: Track individual simulation runs with immutable configuration
-- Key Design: Config is frozen once status = 'in_progress'
-- ============================================================================

CREATE TABLE sim_runs (
  -- Identity
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name TEXT NOT NULL,
  version TEXT NOT NULL, -- e.g., "KOURION_v1.0"

  -- Configuration Snapshot (immutable after start)
  config JSONB NOT NULL, -- Complete configuration at launch time
  config_checksum TEXT NOT NULL, -- MD5 of config for validation

  -- Participants
  total_participants INTEGER NOT NULL CHECK (total_participants > 0),
  human_participants INTEGER NOT NULL CHECK (human_participants >= 0),
  ai_participants INTEGER NOT NULL CHECK (ai_participants >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN (
    'setup',          -- Being configured
    'ready',          -- Locked, ready to launch
    'in_progress',    -- Active simulation
    'completed',      -- Finished
    'cancelled'       -- Aborted
  )),

  -- Timing (only created_at is required)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Ownership
  facilitator_id UUID, -- Will be linked to users(id) after users table is created

  -- Metadata (all optional)
  notes TEXT,
  learning_objectives TEXT[], -- Up to 3 objectives

  -- Validation constraints
  CHECK (total_participants = human_participants + ai_participants),
  CHECK (started_at IS NULL OR started_at >= created_at),
  CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Indexes for sim_runs
CREATE INDEX idx_sim_runs_status ON sim_runs(status);
CREATE INDEX idx_sim_runs_facilitator ON sim_runs(facilitator_id);
CREATE INDEX idx_sim_runs_created ON sim_runs(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE sim_runs IS 'Simulation instances with immutable configuration after start';
COMMENT ON COLUMN sim_runs.config IS 'Complete JSONB configuration snapshot - frozen once in_progress';
COMMENT ON COLUMN sim_runs.config_checksum IS 'MD5 hash to detect unauthorized config changes';
COMMENT ON COLUMN sim_runs.status IS 'Lifecycle: setup → ready → in_progress → completed/cancelled';

-- ============================================================================
-- TABLE: users (Facilitators & Participants)
-- ============================================================================
-- Purpose: User accounts linked to Supabase Auth
-- Key Design: Supports both facilitators and participants
-- ============================================================================

CREATE TABLE users (
  -- Identity (linked to Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Display Information
  display_name TEXT NOT NULL, -- "Alex", "Maria" (used in UI)
  full_name TEXT,             -- Optional full name
  avatar_url TEXT,

  -- System Role (not simulation role)
  role TEXT NOT NULL CHECK (role IN ('facilitator', 'participant')),

  -- Registration & Simulation Status
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN (
    'registered',    -- User created account, waiting for role assignment
    'role_assigned', -- Role assigned, waiting for simulation start
    'active',        -- Currently in simulation
    'completed',     -- Simulation finished
    'inactive',      -- Account deactivated
    'banned'         -- Access revoked
  )),

  -- Event Management (for multi-event support)
  current_event_code TEXT, -- The event they're registered for (e.g., "KING2025-CYPRUS")

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes for users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_event ON users(current_event_code);

-- Comments
COMMENT ON TABLE users IS 'User accounts for facilitators and participants';
COMMENT ON COLUMN users.display_name IS 'Short name shown in UI (first name or nickname)';
COMMENT ON COLUMN users.status IS 'User lifecycle: registered → role_assigned → active → completed';
COMMENT ON COLUMN users.current_event_code IS 'Allows multi-event participation over time';

-- Add foreign key constraint to sim_runs now that users exists
ALTER TABLE sim_runs
  ADD CONSTRAINT fk_sim_runs_facilitator
  FOREIGN KEY (facilitator_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- ============================================================================
-- TABLE: access_tokens (QR Code Device Access)
-- ============================================================================
-- Purpose: Secure single-use tokens for device switching via QR codes
-- Key Design: 24-hour expiry, single-use, facilitator can revoke
-- ============================================================================

CREATE TABLE access_tokens (
  -- Identity
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token
  token TEXT NOT NULL UNIQUE, -- Secure random token (32+ chars)
  device_name TEXT,            -- Optional: "Phone", "Tablet", "Laptop"

  -- Validity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Usually 24 hours from creation
  used_at TIMESTAMPTZ,              -- NULL until used
  used_from_ip TEXT,                -- IP address where token was used (audit)

  -- Status
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,    -- Can be revoked by facilitator
  revoked_by UUID REFERENCES users(id), -- Facilitator who revoked it
  revoked_at TIMESTAMPTZ,

  -- Constraints
  CHECK (expires_at > created_at)
);

-- Indexes for access_tokens
CREATE INDEX idx_tokens_user ON access_tokens(user_id);
CREATE INDEX idx_tokens_token ON access_tokens(token) WHERE is_valid = TRUE AND used_at IS NULL;
CREATE INDEX idx_tokens_expiry ON access_tokens(expires_at) WHERE is_valid = TRUE;

-- Comments
COMMENT ON TABLE access_tokens IS 'Single-use QR code tokens for secure device switching';
COMMENT ON COLUMN access_tokens.token IS 'Cryptographically secure random token for one-time use';
COMMENT ON COLUMN access_tokens.expires_at IS 'Token automatically expires after 24 hours';

-- ============================================================================
-- TABLE: clans (Faction Definitions)
-- ============================================================================
-- Purpose: Define faction groups within a simulation
-- Key Design: Linked to sim_run, used to organize roles
-- ============================================================================

CREATE TABLE clans (
  -- Identity
  clan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,

  -- Definition (only name required)
  name TEXT NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0), -- Display order

  -- Description (from seed data, but can be NULL if minimal setup)
  about TEXT,
  key_priorities TEXT,
  attitude_to_others TEXT,
  if_things_go_wrong TEXT, -- Clan's emergency action

  -- Visual (all optional)
  emblem_url TEXT, -- Uploaded image or generated
  color_hex TEXT DEFAULT '#476078',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness constraints
  UNIQUE(run_id, name),
  UNIQUE(run_id, sequence_number)
);

-- Indexes for clans
CREATE INDEX idx_clans_run ON clans(run_id);
CREATE INDEX idx_clans_sequence ON clans(run_id, sequence_number);

-- Comments
COMMENT ON TABLE clans IS 'Faction definitions for each simulation run';
COMMENT ON COLUMN clans.sequence_number IS 'Display order for UI presentation';
COMMENT ON COLUMN clans.if_things_go_wrong IS 'Clan strategy if the King fails them';

-- ============================================================================
-- TABLE: roles (Individual Character Definitions)
-- ============================================================================
-- Purpose: Define individual characters (human or AI) within simulation
-- Key Design: Linked to clan, can be assigned to user or AI
-- ============================================================================

CREATE TABLE roles (
  -- Identity
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,

  -- Assignment
  participant_type TEXT NOT NULL CHECK (participant_type IN ('human', 'ai')),
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if AI or unassigned

  -- Character Definition (only name required, rest optional)
  name TEXT NOT NULL,
  age INTEGER CHECK (age > 0 AND age < 150),
  position TEXT,
  background TEXT,
  character_traits TEXT,
  interests TEXT,

  -- AI-Specific Config (NULL for humans)
  ai_config JSONB,
  -- SIMPLIFIED: Only stores { "elevenlabs_agent_id": "agent_abc123" }
  -- Voice settings, LLM model, voice_id are pre-configured in ElevenLabs agent

  -- Visual (optional)
  avatar_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Uniqueness constraint
  UNIQUE(run_id, name)
);

-- Indexes for roles
CREATE INDEX idx_roles_run ON roles(run_id);
CREATE INDEX idx_roles_clan ON roles(clan_id);
CREATE INDEX idx_roles_user ON roles(assigned_user_id);
CREATE INDEX idx_roles_type ON roles(participant_type);
CREATE INDEX idx_roles_status ON roles(status) WHERE status = 'active';

-- Comments
COMMENT ON TABLE roles IS 'Individual character definitions (human or AI participants)';
COMMENT ON COLUMN roles.participant_type IS 'Type: human (assigned to user) or ai (managed by system)';
COMMENT ON COLUMN roles.ai_config IS 'AI configuration - stores ElevenLabs agent_id and other AI settings';
COMMENT ON COLUMN roles.assigned_user_id IS 'Links to users table if human participant';

-- ============================================================================
-- TABLE: phases (Stage Definitions)
-- ============================================================================
-- Purpose: Define sequential stages within a simulation
-- Key Design: Pre-populated from process definition, tracks actual timing
-- ============================================================================

CREATE TABLE phases (
  -- Identity
  phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,

  -- Definition (from KING_Process.csv)
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  name TEXT NOT NULL,
  description TEXT, -- Optional description
  default_duration_minutes INTEGER NOT NULL CHECK (default_duration_minutes > 0),

  -- Actual Execution (all optional until phase runs)
  actual_duration_minutes INTEGER CHECK (actual_duration_minutes > 0), -- May differ from default
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not yet started
    'active',       -- Currently running
    'paused',       -- Temporarily stopped
    'completed',    -- Finished
    'skipped'       -- Facilitator skipped
  )),

  -- Validation constraints
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at),

  -- Uniqueness constraint
  UNIQUE(run_id, sequence_number)
);

-- Indexes for phases
CREATE INDEX idx_phases_run ON phases(run_id);
CREATE INDEX idx_phases_status ON phases(run_id, status);
CREATE INDEX idx_phases_sequence ON phases(run_id, sequence_number);

-- Comments
COMMENT ON TABLE phases IS 'Sequential stages within a simulation run';
COMMENT ON COLUMN phases.default_duration_minutes IS 'Planned duration from template';
COMMENT ON COLUMN phases.actual_duration_minutes IS 'Actual duration, may differ due to facilitator adjustments';
COMMENT ON COLUMN phases.status IS 'Lifecycle: pending → active → completed/skipped (or paused temporarily)';

-- ============================================================================
-- CORE TABLES MIGRATION COMPLETE
-- ============================================================================
-- Tables created: sim_runs, users, access_tokens, clans, roles, phases
-- Next migration: interaction tables (meetings, meeting_invitations, public_speeches)
-- ============================================================================
