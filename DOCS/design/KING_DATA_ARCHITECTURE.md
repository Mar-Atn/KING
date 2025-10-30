# KING_DATA_ARCHITECTURE.md
**The New King SIM - Complete Data Layer Implementation**
**Single Source of Truth for Database Schema, RLS Policies, and Data Patterns**
**Version 1.0 | October 30, 2025**

---

## DOCUMENT PURPOSE

This document provides complete implementation details for The New King SIM data layer, serving as:
- **Complete schema reference** - All 21 tables with DDL extracted from 50 migration files
- **RLS security model** - All 59 Row-Level Security policies documented
- **Database functions** - All 15+ PL/pgSQL functions and triggers
- **Data flow patterns** - How frontend interacts with database
- **Performance optimizations** - Index strategy and query optimization history
- **JSONB patterns** - Working with flexible JSON data fields

**Related Documents:**
- `KING_PRD.md` - Product requirements (WHAT we're building)
- `KING_TECH_GUIDE.md` - Technical architecture (WHY and HOW)
- `KING_UX_GUIDE.md` - Visual design specifications
- `KING_AI_DESIGN.md` - AI participant architecture

---

## TABLE OF CONTENTS

1. [Complete Schema Reference](#1-complete-schema-reference)
2. [RLS Security Model](#2-rls-security-model)
3. [Database Functions Reference](#3-database-functions-reference)
4. [Event-Driven Architecture](#4-event-driven-architecture)
5. [JSONB Query Patterns](#5-jsonb-query-patterns)
6. [Performance Optimization History](#6-performance-optimization-history)
7. [Migration Best Practices](#7-migration-best-practices)

---

## 1. COMPLETE SCHEMA REFERENCE

### 1.1 Table Categories

**Core Tables (6):** Simulation foundation
- `sim_runs` - Simulation instances with immutable configuration
- `users` - Facilitators and participants linked to Supabase Auth
- `access_tokens` - QR code device access tokens
- `clans` - Faction definitions
- `roles` - Individual character definitions (human or AI)
- `phases` - Sequential stage definitions

**Interaction Tables (3):** Communication and coordination
- `meetings` - Group conversations (voice or text)
- `meeting_invitations` - Meeting requests and responses
- `public_speeches` - Broadcast messages and candidate speeches

**Voting Tables (3):** Democratic decision-making
- `vote_sessions` - Voting round configuration
- `votes` - Individual ballot records
- `vote_results` - Calculated tallies and winners

**AI & Meta Tables (6):** AI cognition and outcomes
- `ai_context` - Versioned cognitive state for AI participants
- `ai_prompts` - Centralized AI prompt management
- `sim_run_prompts` - Per-simulation AI prompt overrides
- `conversations` - AI Character Prototype conversation tracking (text, voice, combined)
- `king_decisions` - King's final decisions after election
- `reflections` - Participant reflections for learning assessment

**Supporting Tables (3):** Infrastructure and templates
- `event_log` - Complete audit trail for all simulation events
- `facilitator_actions` - Facilitator manual interventions
- `simulation_templates` - Master simulation designs (reusable)

---

### 1.2 Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓
users ──┐
    ↓   │
sim_runs ←──────────┐
    ├───────────┐   │
    ↓           ↓   │
  clans       phases│
    ├───────────┐   │
    ↓           ↓   │
  roles ←───────┘   │
    ├───────────────┼─────┬─────┬──────┬───────┬──────────────┬─────────────┐
    ↓               ↓     ↓     ↓      ↓       ↓              ↓             ↓
meetings    vote_sessions │  king_decisions  reflections  conversations  ai_context
    ↓                     │                                                  ↓
meeting_invitations       │                                            ai_prompts
                         ↓
                      votes
                         ↓
                   vote_results

simulation_templates (standalone, referenced during setup)
event_log (references sim_runs, actors via UUID)
facilitator_actions (references sim_runs, users)
access_tokens (references users)
public_speeches (references sim_runs, phases, roles)
```

---

### 1.3 Core Tables - Detailed DDL

#### `sim_runs` - Simulation Instances

```sql
CREATE TABLE sim_runs (
  -- Identity
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name TEXT NOT NULL,
  version TEXT NOT NULL,

  -- Configuration Snapshot (immutable after start)
  config JSONB NOT NULL,
  config_checksum TEXT NOT NULL,

  -- Participants
  total_participants INTEGER NOT NULL CHECK (total_participants > 0),
  human_participants INTEGER NOT NULL CHECK (human_participants >= 0),
  ai_participants INTEGER NOT NULL CHECK (ai_participants >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN (
    'setup', 'ready', 'in_progress', 'completed', 'cancelled'
  )),

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Ownership
  facilitator_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  notes TEXT,
  learning_objectives TEXT[],

  -- Voting Configuration (added migration 00011)
  vote_1_threshold INTEGER,  -- NULL = default 2/3 majority
  vote_2_threshold INTEGER,  -- NULL = default 2/3 majority

  -- Validation constraints
  CHECK (total_participants = human_participants + ai_participants),
  CHECK (started_at IS NULL OR started_at >= created_at),
  CHECK (completed_at IS NULL OR completed_at >= created_at),
  CHECK (vote_1_threshold IS NULL OR (vote_1_threshold > 0 AND vote_1_threshold <= total_participants)),
  CHECK (vote_2_threshold IS NULL OR (vote_2_threshold > 0 AND vote_2_threshold <= total_participants))
);

-- Indexes
CREATE INDEX idx_sim_runs_status ON sim_runs(status);
CREATE INDEX idx_sim_runs_facilitator ON sim_runs(facilitator_id);
CREATE INDEX idx_sim_runs_created ON sim_runs(created_at DESC);
CREATE INDEX idx_sim_runs_facilitator_created ON sim_runs(facilitator_id, created_at DESC);
CREATE INDEX idx_sim_runs_facilitator_status ON sim_runs(facilitator_id, status);
```

**Key Points:**
- `config` JSONB contains complete simulation setup (frozen once in_progress)
- `config_checksum` validates no unauthorized changes (MD5 hash)
- `vote_1_threshold` and `vote_2_threshold` added in migration 00011 for configurable voting rules
- Status lifecycle: `setup → ready → in_progress → completed/cancelled`

---

#### `users` - Facilitators & Participants

```sql
CREATE TABLE users (
  -- Identity (linked to Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Display Information
  display_name TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- System Role (not simulation role)
  role TEXT NOT NULL CHECK (role IN ('facilitator', 'participant')),

  -- Registration & Simulation Status
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN (
    'registered', 'role_assigned', 'active', 'completed', 'inactive', 'banned'
  )),

  -- Event Management
  current_event_code TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_event ON users(current_event_code);
CREATE INDEX idx_users_role_active ON users(role) WHERE role IS NOT NULL;
```

**Key Points:**
- Linked to Supabase Auth (`auth.users`) for authentication
- `display_name` is shown in UI (first name or nickname)
- `current_event_code` enables multi-event participation over time
- Status lifecycle: `registered → role_assigned → active → completed`

---

#### `access_tokens` - QR Code Device Access

```sql
CREATE TABLE access_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_from_ip TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ,

  CHECK (expires_at > created_at)
);

-- Indexes (partial indexes for performance)
CREATE INDEX idx_tokens_user ON access_tokens(user_id);
CREATE INDEX idx_tokens_token ON access_tokens(token) WHERE is_valid = TRUE AND used_at IS NULL;
CREATE INDEX idx_tokens_expiry ON access_tokens(expires_at) WHERE is_valid = TRUE;
```

**Key Points:**
- Single-use tokens for secure device switching
- 24-hour default expiry (configurable)
- Facilitator can revoke tokens
- Partial indexes optimize active token lookups

---

#### `clans` - Faction Definitions

```sql
CREATE TABLE clans (
  clan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  about TEXT,
  key_priorities TEXT,
  attitude_to_others TEXT,
  if_things_go_wrong TEXT,
  emblem_url TEXT,
  color_hex TEXT DEFAULT '#476078',
  logo_url TEXT,  -- Added migration 00018 for printable materials
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(run_id, name),
  UNIQUE(run_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_clans_run ON clans(run_id);
CREATE INDEX idx_clans_sequence ON clans(run_id, sequence_number);
CREATE INDEX idx_clans_run_sequence ON clans(run_id, sequence_number);
```

**Key Points:**
- `sequence_number` determines display order in UI
- `emblem_url` for digital display, `logo_url` for high-res printable materials (added migration 00018)
- `if_things_go_wrong` describes clan's emergency action if King fails them

---

#### `roles` - Individual Character Definitions

```sql
CREATE TABLE roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('human', 'ai')),
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  age INTEGER CHECK (age > 0 AND age < 150),
  position TEXT,
  background TEXT,
  character_traits TEXT,
  interests TEXT,
  ai_config JSONB,  -- { "elevenlabs_agent_id": "agent_abc123" }
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(run_id, name)
);

-- Indexes
CREATE INDEX idx_roles_run ON roles(run_id);
CREATE INDEX idx_roles_clan ON roles(clan_id);
CREATE INDEX idx_roles_user ON roles(assigned_user_id);
CREATE INDEX idx_roles_type ON roles(participant_type);
CREATE INDEX idx_roles_status ON roles(status) WHERE status = 'active';
CREATE INDEX idx_roles_assigned_user_id ON roles(assigned_user_id) WHERE assigned_user_id IS NOT NULL;
CREATE INDEX idx_roles_run_user ON roles(run_id, assigned_user_id) WHERE participant_type = 'human';
CREATE INDEX idx_roles_run_id ON roles(run_id);
CREATE INDEX idx_roles_run_clan ON roles(run_id, clan_id);
```

**Key Points:**
- `participant_type`: `human` (assigned to user) or `ai` (managed by system)
- `ai_config` stores ElevenLabs agent_id for voice integration (simplified design)
- Multiple performance indexes for common query patterns

---

#### `phases` - Sequential Stage Definitions

```sql
CREATE TABLE phases (
  phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  name TEXT NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL CHECK (default_duration_minutes > 0),
  actual_duration_minutes INTEGER CHECK (actual_duration_minutes > 0),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'paused', 'completed', 'skipped'
  )),

  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at),
  UNIQUE(run_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_phases_run ON phases(run_id);
CREATE INDEX idx_phases_status ON phases(run_id, status);
CREATE INDEX idx_phases_sequence ON phases(run_id, sequence_number);
CREATE INDEX idx_phases_run_sequence ON phases(run_id, sequence_number);
CREATE INDEX idx_phases_run_status ON phases(run_id, status);
```

**Key Points:**
- Pre-populated from `KING_Process.csv` during simulation creation
- `default_duration_minutes` from template, `actual_duration_minutes` tracks reality
- Status lifecycle: `pending → active → completed/skipped` (or paused temporarily)

---

### 1.4 Interaction Tables - Detailed DDL

#### `meetings` - Group Conversations

```sql
CREATE TABLE meetings (
  meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('clan_council', 'free_consultation')),
  organizer_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
  title TEXT,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  modality TEXT NOT NULL DEFAULT 'voice' CHECK (modality IN ('voice', 'text')),
  transcript TEXT,
  transcript_format TEXT DEFAULT 'plain' CHECK (transcript_format IN ('plain', 'json')),
  elevenlabs_conversation_id TEXT,
  scheduled_duration_minutes INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'active', 'completed', 'cancelled', 'expired'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meetings_run ON meetings(run_id);
CREATE INDEX idx_meetings_phase ON meetings(phase_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_role_id);
CREATE INDEX idx_meetings_type ON meetings(meeting_type);
CREATE INDEX idx_meetings_participants ON meetings USING GIN(participants);
```

**Key Points:**
- `participants` is JSONB array of role_ids
- `meeting_type`: `clan_council` (automatic) or `free_consultation` (ad-hoc)
- `modality`: `voice` (humans + AI) or `text` (AI-only)
- `transcript` captures conversation for AI context updates
- GIN index on `participants` for efficient JSONB array queries

---

#### `meeting_invitations` - Invitation Tracking

```sql
CREATE TABLE meeting_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  invitee_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'declined', 'expired'
  )),
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  UNIQUE(meeting_id, invitee_role_id)
);

-- Indexes
CREATE INDEX idx_invitations_meeting ON meeting_invitations(meeting_id);
CREATE INDEX idx_invitations_invitee ON meeting_invitations(invitee_role_id);
CREATE INDEX idx_invitations_status ON meeting_invitations(status);
CREATE INDEX idx_invitations_expires ON meeting_invitations(expires_at) WHERE status = 'pending';
CREATE INDEX idx_meeting_invitations_invitee ON meeting_invitations(invitee_role_id, status);
```

**Key Points:**
- One invitation per participant per meeting (UNIQUE constraint)
- Auto-expires after 10 minutes (configurable via `expires_at`)
- Partial index on pending invitations for performance

---

#### `public_speeches` - Broadcast Messages

```sql
CREATE TABLE public_speeches (
  speech_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id) ON DELETE CASCADE,
  speaker_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
  is_facilitator BOOLEAN NOT NULL DEFAULT FALSE,
  is_ai_speaker BOOLEAN NOT NULL DEFAULT FALSE,
  transcript TEXT NOT NULL,
  audio_url TEXT,
  delivery_method TEXT CHECK (delivery_method IN (
    'human_microphone', 'ai_tts_playback', 'facilitator_announcement'
  )),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK ((is_facilitator::int + is_ai_speaker::int + (speaker_role_id IS NOT NULL)::int) = 1)
);

-- Indexes
CREATE INDEX idx_speeches_run ON public_speeches(run_id);
CREATE INDEX idx_speeches_phase ON public_speeches(phase_id);
CREATE INDEX idx_speeches_speaker ON public_speeches(speaker_role_id);
CREATE INDEX idx_speeches_facilitator ON public_speeches(is_facilitator) WHERE is_facilitator = TRUE;
CREATE INDEX idx_speeches_ai ON public_speeches(is_ai_speaker) WHERE is_ai_speaker = TRUE;
CREATE INDEX idx_speeches_created ON public_speeches(created_at DESC);
```

**Key Points:**
- `transcript` is REQUIRED (for AI context distribution)
- CHECK constraint ensures exactly one speaker type is set
- Three delivery methods: human microphone, AI TTS, or facilitator announcement

---

### 1.5 Voting Tables - Detailed DDL

#### `vote_sessions` - Voting Round Configuration

```sql
CREATE TABLE vote_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN (
    'clan_nomination', 'election_round', 'clan_oath', 'clan_action', 'facilitator_proposal'
  )),
  vote_format TEXT NOT NULL CHECK (vote_format IN ('choose_person', 'yes_no')),
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'clan_only')),
  scope_clan_id UUID REFERENCES clans(clan_id) ON DELETE CASCADE,
  eligible_candidates JSONB,
  proposal_title TEXT,
  proposal_description TEXT,
  transparency_level TEXT NOT NULL DEFAULT 'open' CHECK (transparency_level IN (
    'open', 'anonymous', 'secret'
  )),
  reveal_timing TEXT NOT NULL DEFAULT 'after_all_votes' CHECK (reveal_timing IN (
    'immediate', 'after_all_votes', 'facilitator_manual'
  )),
  animation_speed TEXT NOT NULL DEFAULT 'normal' CHECK (animation_speed IN (
    'slow', 'normal', 'fast', 'instant'
  )),
  allow_skip_animation BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'announced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  announced_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_vote_sessions_run ON vote_sessions(run_id);
CREATE INDEX idx_vote_sessions_phase ON vote_sessions(phase_id);
CREATE INDEX idx_vote_sessions_status ON vote_sessions(status);
CREATE INDEX idx_vote_sessions_clan ON vote_sessions(scope_clan_id) WHERE scope = 'clan_only';
CREATE INDEX idx_vote_sessions_type ON vote_sessions(vote_type);
```

**Key Points:**
- Highly configurable: transparency level, reveal timing, animation speed
- `scope`: `all` (everyone votes) or `clan_only` (single clan votes)
- `eligible_candidates` is JSONB array of role_ids for choose_person votes
- Status lifecycle: `open → closed → announced`

---

#### `votes` - Individual Ballot Records

```sql
CREATE TABLE votes (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id) ON DELETE CASCADE,
  voter_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  voter_clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,
  chosen_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
  yes_no_choice TEXT CHECK (yes_no_choice IN ('yes', 'no', 'abstain')),
  cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK ((chosen_role_id IS NOT NULL AND yes_no_choice IS NULL) OR
         (chosen_role_id IS NULL AND yes_no_choice IS NOT NULL)),
  UNIQUE(session_id, voter_role_id)
);

-- Indexes
CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_votes_voter ON votes(voter_role_id);
CREATE INDEX idx_votes_chosen ON votes(chosen_role_id);
CREATE INDEX idx_votes_choice ON votes(yes_no_choice) WHERE yes_no_choice IS NOT NULL;
CREATE INDEX idx_votes_cast ON votes(cast_at DESC);
CREATE INDEX idx_votes_voter_session ON votes(voter_role_id, session_id);
```

**Key Points:**
- One vote per participant per session (UNIQUE constraint)
- CHECK constraint enforces either `chosen_role_id` OR `yes_no_choice` (not both)
- Immutable once cast (no UPDATE policy, only INSERT)

---

#### `vote_results` - Calculated Tallies

```sql
CREATE TABLE vote_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id) ON DELETE CASCADE,
  results_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  announced_at TIMESTAMPTZ,
  animation_shown BOOLEAN NOT NULL DEFAULT TRUE,
  animation_duration_seconds INTEGER,
  calculated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE(session_id)
);

-- Indexes
CREATE INDEX idx_vote_results_session ON vote_results(session_id);
CREATE INDEX idx_vote_results_calculated ON vote_results(calculated_at DESC);
CREATE INDEX idx_vote_results_announced ON vote_results(announced_at DESC);
CREATE INDEX idx_vote_results_data ON vote_results USING GIN(results_data);
```

**Key Points:**
- One result per session (UNIQUE constraint)
- `results_data` is flexible JSONB structure (tallies, winners, percentages)
- GIN index enables fast JSONB queries on results

---

### 1.6 AI & Meta Tables - Detailed DDL

#### `ai_context` - Versioned Cognitive State

```sql
CREATE TABLE ai_context (
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  block_1_fixed JSONB NOT NULL,
  block_2_identity JSONB NOT NULL,
  block_3_memory JSONB NOT NULL,
  block_4_goals JSONB NOT NULL,
  updated_trigger TEXT,
  updated_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(role_id, version)
);

-- Indexes
CREATE INDEX idx_ai_context_role ON ai_context(role_id);
CREATE INDEX idx_ai_context_current ON ai_context(role_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_ai_context_version ON ai_context(role_id, version DESC);
CREATE INDEX idx_ai_context_run ON ai_context(run_id);
CREATE INDEX idx_ai_context_block1 ON ai_context USING GIN(block_1_fixed);
CREATE INDEX idx_ai_context_block2 ON ai_context USING GIN(block_2_identity);
CREATE INDEX idx_ai_context_block3 ON ai_context USING GIN(block_3_memory);
CREATE INDEX idx_ai_context_block4 ON ai_context USING GIN(block_4_goals);
```

**Key Points:**
- **Block 1:** Fixed rules, actions, architecture (never changes)
- **Block 2:** Identity (character definition, stable)
- **Block 3:** Memory (events, relationships, promises - bounded ~5 pages)
- **Block 4:** Goals & Plans (evolving strategies)
- Versioned: new row created on update, `is_current=TRUE` for latest
- Trigger ensures only one `is_current=TRUE` per role_id
- GIN indexes enable JSONB field queries

---

#### `ai_prompts` - Centralized AI Prompt Management

```sql
CREATE TABLE ai_prompts (
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type TEXT NOT NULL CHECK (prompt_type IN (
    -- Original prompt types (backward compatibility)
    'block_1_fixed', 'block_2_identity_update', 'block_3_memory_update',
    'block_4_goals_update', 'action_decision', 'public_speech',
    'personal_feedback', 'debrief_analysis', 'induction_assistant',

    -- AI Character Prototype prompt types (added migration 00050)
    'block_1_simulation_rules', 'block_1_available_actions', 'block_1_behavioral_framework',
    'block_3_memory_compression', 'block_4_goals_adaptation',
    'text_conversation_system', 'initial_goals_generation',
    'voice_agent_system', 'intent_notes_generation'
  )),
  version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  default_llm_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  default_temperature DECIMAL(3,2) DEFAULT 0.7,
  default_max_tokens INTEGER DEFAULT 4096,
  name TEXT NOT NULL,
  description TEXT,
  usage_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(prompt_type, version)
);

-- Indexes
CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(prompt_type, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_prompts_created ON ai_prompts(created_at DESC);
CREATE UNIQUE INDEX idx_ai_prompts_active_unique ON ai_prompts(prompt_type) WHERE is_active = TRUE;
```

**Key Points:**
- Centralized prompt management with versioning
- Only ONE active prompt per `prompt_type` (enforced by unique index)
- 18 prompt types total: 9 original + 9 AI Character Prototype (migration 00050)
- AI Character Prototype uses granular prompts for 4-Block system
- Supports LLM model, temperature, max_tokens configuration

---

#### `sim_run_prompts` - Per-Simulation AI Overrides

```sql
CREATE TABLE sim_run_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  custom_prompt_id UUID REFERENCES ai_prompts(prompt_id) ON DELETE SET NULL,
  llm_model_override TEXT,
  temperature_override DECIMAL(3,2),
  max_tokens_override INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(run_id, prompt_type)
);

-- Indexes
CREATE INDEX idx_sim_run_prompts_run ON sim_run_prompts(run_id);
CREATE INDEX idx_sim_run_prompts_type ON sim_run_prompts(prompt_type);
CREATE INDEX idx_sim_run_prompts_custom ON sim_run_prompts(custom_prompt_id);
```

**Key Points:**
- Allows per-simulation AI customization without modifying global prompts
- Falls back to global ai_prompts if no override exists

---

#### `king_decisions` - King's Final Decree

```sql
CREATE TABLE king_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  king_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  taxes JSONB NOT NULL,
  budget_priorities JSONB NOT NULL,
  appointments JSONB NOT NULL,
  international_affairs JSONB NOT NULL,
  other_decisions TEXT,
  final_speech_transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(run_id)
);

-- Indexes
CREATE INDEX idx_king_decisions_run ON king_decisions(run_id);
CREATE INDEX idx_king_decisions_king ON king_decisions(king_role_id);
CREATE INDEX idx_king_decisions_created ON king_decisions(created_at DESC);
CREATE INDEX idx_king_decisions_taxes ON king_decisions USING GIN(taxes);
CREATE INDEX idx_king_decisions_budget ON king_decisions USING GIN(budget_priorities);
CREATE INDEX idx_king_decisions_appointments ON king_decisions USING GIN(appointments);
CREATE INDEX idx_king_decisions_intl ON king_decisions USING GIN(international_affairs);
```

**Key Points:**
- One decree per simulation (UNIQUE constraint on run_id)
- JSONB fields for flexible decision structures
- GIN indexes enable querying specific decisions

---

#### `reflections` - Learning Assessment

```sql
CREATE TABLE reflections (
  reflection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(phase_id) ON DELETE SET NULL,
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  reflection_type TEXT NOT NULL CHECK (reflection_type IN (
    'personal', 'group', 'ai_generated'
  )),
  reflection_text TEXT NOT NULL,
  ai_summary TEXT,
  ai_insights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reflections_run ON reflections(run_id);
CREATE INDEX idx_reflections_role ON reflections(role_id);
CREATE INDEX idx_reflections_phase ON reflections(phase_id);
CREATE INDEX idx_reflections_type ON reflections(reflection_type);
CREATE INDEX idx_reflections_created ON reflections(created_at DESC);
CREATE INDEX idx_reflections_insights ON reflections USING GIN(ai_insights);
CREATE INDEX idx_reflections_text_search ON reflections USING GIN(to_tsvector('english', reflection_text));
CREATE INDEX idx_reflections_role_phase ON reflections(role_id, phase_id);
```

**Key Points:**
- Three types: personal (participant), group (collective), ai_generated (feedback)
- Full-text search index on `reflection_text` for semantic analysis
- `ai_insights` JSONB field for structured AI analysis

---

#### `conversations` - AI Character Prototype Conversation Tracking

```sql
CREATE TABLE IF NOT EXISTS conversations (
  -- Identity
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Conversation Type
  modality TEXT NOT NULL CHECK (modality IN ('text', 'voice', 'combined')),

  -- Content
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  elevenlabs_conversation_id TEXT,

  -- AI Context Integration
  reflection_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  ai_context_version_before INTEGER,
  ai_context_version_after INTEGER,

  -- Performance Metrics
  total_messages INTEGER,
  avg_response_time_seconds DECIMAL(5,2),
  total_tokens_used INTEGER,
  estimated_cost_usd DECIMAL(10,4),

  -- Simulation Integration
  scenario_injected JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_role ON conversations(role_id);
CREATE INDEX idx_conversations_started ON conversations(started_at DESC);
CREATE INDEX idx_conversations_modality ON conversations(modality);
CREATE INDEX idx_conversations_role_started ON conversations(role_id, started_at DESC);
CREATE INDEX idx_conversations_reflection ON conversations(reflection_triggered) WHERE reflection_triggered = TRUE;
CREATE INDEX idx_conversations_transcript ON conversations USING GIN(transcript);
CREATE INDEX idx_conversations_scenario ON conversations USING GIN(scenario_injected);
```

**Key Points:**
- Added in migration 00048 for AI Character Prototype
- Tracks all text, voice, and combined conversations with AI characters
- `transcript` JSONB stores full conversation history
- Links to AI context versioning (`ai_context_version_before/after`)
- `reflection_triggered` tracks when Reflection Engine ran (updates Blocks 2-4)
- Supports ElevenLabs voice conversations via `elevenlabs_conversation_id`
- Performance metrics track tokens, response times, costs
- `scenario_injected` stores facilitator interventions during conversation

---

### 1.7 Supporting Tables - Detailed DDL

#### `event_log` - Complete Audit Trail

```sql
CREATE TABLE event_log (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  module TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN (
    'facilitator', 'human_participant', 'ai_participant', 'system'
  )),
  actor_id UUID,
  target_type TEXT,
  target_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_event_log_run ON event_log(run_id);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_module ON event_log(module);
CREATE INDEX idx_event_log_actor ON event_log(actor_id);
CREATE INDEX idx_event_log_actor_type ON event_log(actor_type);
CREATE INDEX idx_event_log_created ON event_log(created_at DESC);
CREATE INDEX idx_event_log_target ON event_log(target_type, target_id);
CREATE INDEX idx_event_log_payload ON event_log USING GIN(payload);
CREATE INDEX idx_event_log_run_type_created ON event_log(run_id, event_type, created_at DESC);
CREATE INDEX idx_event_log_run_timestamp ON event_log(run_id, created_at DESC);
```

**Key Points:**
- Comprehensive audit trail for all simulation events
- Populated via triggers (phase changes, votes cast, meetings created, etc.)
- `payload` JSONB field stores event-specific data
- Multiple indexes for fast event querying and analysis

---

#### `facilitator_actions` - Manual Interventions

```sql
CREATE TABLE facilitator_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  facilitator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  action_details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_facilitator_actions_run ON facilitator_actions(run_id);
CREATE INDEX idx_facilitator_actions_facilitator ON facilitator_actions(facilitator_id);
CREATE INDEX idx_facilitator_actions_type ON facilitator_actions(action_type);
CREATE INDEX idx_facilitator_actions_target ON facilitator_actions(target_type, target_id);
CREATE INDEX idx_facilitator_actions_created ON facilitator_actions(created_at DESC);
CREATE INDEX idx_facilitator_actions_details ON facilitator_actions USING GIN(action_details);
```

**Key Points:**
- Tracks facilitator overrides (extend phase, override vote, mute AI, etc.)
- `action_details` JSONB field stores old/new values and reason
- Separate from event_log for facilitator-specific audit trail

---

#### `simulation_templates` - Master Simulation Designs

```sql
CREATE TABLE simulation_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'The New King of Kourion',
  version TEXT NOT NULL DEFAULT 'v1.0',
  language TEXT NOT NULL DEFAULT 'ENG' CHECK (language IN ('ENG', 'RU')),
  context_text TEXT NOT NULL,
  process_stages JSONB NOT NULL,
  decisions_framework JSONB NOT NULL,
  canonical_clans JSONB NOT NULL,
  canonical_roles JSONB NOT NULL,
  description TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE(name, version, language)
);

-- Indexes
CREATE INDEX idx_simulation_templates_active ON simulation_templates(is_active);
CREATE INDEX idx_simulation_templates_language ON simulation_templates(language);
CREATE INDEX idx_simulation_templates_version ON simulation_templates(name, version);
CREATE INDEX idx_simulation_templates_created ON simulation_templates(created_at DESC);
CREATE INDEX idx_simulation_templates_stages ON simulation_templates USING GIN(process_stages);
CREATE INDEX idx_simulation_templates_clans ON simulation_templates USING GIN(canonical_clans);
CREATE INDEX idx_simulation_templates_roles ON simulation_templates USING GIN(canonical_roles);
CREATE INDEX idx_simulation_templates_decisions ON simulation_templates USING GIN(decisions_framework);
CREATE INDEX idx_simulation_templates_active_created ON simulation_templates(is_active, created_at DESC) WHERE is_active = TRUE;
```

**Key Points:**
- Reusable simulation templates (e.g., "The New King of Kourion v1.0")
- JSONB fields store parsed seed data (KING_Process.csv, KING_ALL_ROLES.csv, etc.)
- Referenced during simulation creation, not linked to sim_runs
- GIN indexes enable fast JSONB queries on template data

---

## 2. RLS SECURITY MODEL

### 2.1 Security Philosophy

**Role-Based Access Control:**
- **Facilitators** - Full access to all data in their simulations
- **Participants** - Access only to their simulation data (roles, meetings, votes)
- **Service Role** - Backend automation (AI operations, event logging)

**Performance Optimization:**
- All RLS policies use optimized auth.uid() pattern: `WHERE x = (SELECT auth.uid())`
- Ensures auth.uid() evaluates once per query, not per row (10-100x faster)
- Helper functions marked STABLE for query planner optimization

### 2.2 Helper Functions

```sql
-- Check if current user is a facilitator
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'facilitator'
  );
$$;

-- Get current user's role_id in a simulation
CREATE OR REPLACE FUNCTION get_current_user_role_id(p_run_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role_id FROM roles
  WHERE run_id = p_run_id
  AND assigned_user_id = (SELECT auth.uid())
  AND participant_type = 'human'
  LIMIT 1;
$$;

-- Check if user is participant in a specific run
CREATE OR REPLACE FUNCTION is_participant_in_run(p_run_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM roles
    WHERE run_id = p_run_id
    AND assigned_user_id = (SELECT auth.uid())
    AND participant_type = 'human'
  );
$$;
```

### 2.3 RLS Policy Summary (59 Policies)

#### `sim_runs` (3 policies)
```sql
-- Facilitators can view all sim runs
CREATE POLICY "Facilitators can view all sim runs"
  ON sim_runs FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- Facilitators can create sim runs
CREATE POLICY "Facilitators can create sim runs"
  ON sim_runs FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());

-- Participants can view their sim runs
CREATE POLICY "Participants can view their sim runs"
  ON sim_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.run_id = sim_runs.run_id
      AND roles.assigned_user_id = (SELECT auth.uid())
    )
  );
```

#### `users` (5 policies)
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Facilitators can view all users
CREATE POLICY "Facilitators can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_facilitator());

-- Facilitators can create users
CREATE POLICY "Facilitators can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_facilitator());

-- Service role can create users (for signup)
CREATE POLICY "Service role can create users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);
```

#### `roles` (3 policies)
```sql
-- Participants can view roles in their runs
CREATE POLICY "Participants can view roles in their runs"
  ON roles FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));

-- Participants can update their own role (limited fields)
CREATE POLICY "Participants can update their own role"
  ON roles FOR UPDATE
  TO authenticated
  USING (assigned_user_id = (SELECT auth.uid()))
  WITH CHECK (assigned_user_id = (SELECT auth.uid()));

-- Facilitators can manage all roles
CREATE POLICY "Facilitators can manage all roles"
  ON roles FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());
```

#### `votes` (3 policies)
```sql
-- Participants can view their own votes
CREATE POLICY "Participants can view their own votes"
  ON votes FOR SELECT
  TO authenticated
  USING (voter_role_id = get_current_user_role_id(
    (SELECT run_id FROM vote_sessions WHERE session_id = votes.session_id)
  ));

-- Participants can cast votes
CREATE POLICY "Participants can cast votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (voter_role_id = get_current_user_role_id(
    (SELECT run_id FROM vote_sessions WHERE session_id = votes.session_id)
  ));

-- Facilitators can view all votes
CREATE POLICY "Facilitators can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (is_facilitator());
```

**Note:** Similar policies exist for all other tables. Full policy listing available in migration file `00006_rls_policies.sql` and optimization migrations `00021`, `00043`.

### 2.4 Security Coverage Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| sim_runs | ✓ | ✓ | ✓ | ✓ |
| users | ✓ | ✓ | ✓ | ✗ |
| access_tokens | ✓ | ✓ | ✓ | ✗ |
| clans | ✓ | ✓ | ✓ | ✓ |
| roles | ✓ | ✓ | ✓ | ✓ |
| phases | ✓ | ✓ | ✓ | ✓ |
| meetings | ✓ | ✓ | ✓ | ✓ |
| meeting_invitations | ✓ | ✓ | ✓ | ✓ |
| public_speeches | ✓ | ✓ | ✓ | ✓ |
| vote_sessions | ✓ | ✓ | ✓ | ✓ |
| votes | ✓ | ✓ | ✗ | ✗ |
| vote_results | ✓ | ✓ | ✓ | ✓ |
| ai_context | ✓ | ✓ | ✓ | ✓ |
| ai_prompts | ✓ | ✓ | ✓ | ✓ |
| sim_run_prompts | ✓ | ✓ | ✓ | ✓ |
| king_decisions | ✓ | ✓ | ✓ | ✓ |
| reflections | ✓ | ✓ | ✓ | ✗ |
| event_log | ✓ | ✓ | ✗ | ✗ |
| facilitator_actions | ✓ | ✓ | ✗ | ✗ |
| simulation_templates | ✓ | ✓ | ✓ | ✓ |

**Legend:**
- ✓ = Policy exists
- ✗ = No policy (operation not allowed or not applicable)

---

## 3. DATABASE FUNCTIONS REFERENCE

### 3.1 Utility Functions

#### `get_participant_count(p_run_id UUID)`
```sql
RETURNS TABLE (total INTEGER, human INTEGER, ai INTEGER)
LANGUAGE sql STABLE
```
**Purpose:** Get count of participants by type
**Usage:** Dashboard stats, analytics
**Example:** `SELECT * FROM get_participant_count('run-uuid');`

---

#### `get_current_phase(p_run_id UUID)`
```sql
RETURNS TABLE (phase_id UUID, name TEXT, sequence_number INTEGER, started_at TIMESTAMPTZ)
LANGUAGE sql STABLE
```
**Purpose:** Get currently active phase for simulation
**Usage:** Phase display, status checks
**Returns:** NULL if no active phase

---

#### `all_votes_cast(p_session_id UUID)`
```sql
RETURNS BOOLEAN
LANGUAGE sql STABLE
```
**Purpose:** Check if all eligible voters have cast votes
**Logic:** Considers vote scope (all vs. clan_only)
**Usage:** Vote session closure logic

---

#### `generate_access_token(p_user_id UUID, p_device_name TEXT, p_expiry_hours INTEGER DEFAULT 24)`
```sql
RETURNS TEXT
LANGUAGE plpgsql
```
**Purpose:** Generate secure QR code token
**Security:** Uses `gen_random_bytes(32)` and encodes as Base64
**Default Expiry:** 24 hours
**Returns:** Token string for QR code generation

---

#### `validate_access_token(p_token TEXT)`
```sql
RETURNS UUID
LANGUAGE plpgsql
```
**Purpose:** Validate and mark token as used
**Returns:** `user_id` if valid
**Raises Exception:** If invalid, expired, or already used
**Side Effect:** Updates `used_at` timestamp and `used_from_ip`

---

#### `get_simulation_stats(p_run_id UUID)`
```sql
RETURNS JSONB
LANGUAGE plpgsql
```
**Purpose:** Aggregate simulation statistics
**Returns:** Complete stats object:
```json
{
  "total_participants": 20,
  "human_participants": 15,
  "ai_participants": 5,
  "total_meetings": 42,
  "completed_meetings": 38,
  "total_votes": 300,
  "total_speeches": 12,
  "total_reflections": 20,
  "total_events": 1847
}
```

---

### 3.2 Trigger Functions

#### `update_updated_at_column()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Auto-update `updated_at` timestamp
**Applied to:** `simulation_templates`, `ai_prompts`

---

#### `log_sim_run_status_change()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Log simulation status changes to event_log
**Trigger:** AFTER UPDATE ON `sim_runs`
**Event Types:** `sim_run_status_changed`

---

#### `log_phase_status_change()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Log phase transitions to event_log
**Trigger:** AFTER UPDATE ON `phases`
**Event Types:** `phase_started`, `phase_completed`, `phase_paused`, `phase_skipped`

---

#### `log_vote_cast()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Log each vote to event_log
**Trigger:** AFTER INSERT ON `votes`
**Event Type:** `vote_cast`

---

#### `log_meeting_created()` / `log_meeting_completed()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Log meeting lifecycle events
**Triggers:** AFTER INSERT, AFTER UPDATE ON `meetings`
**Event Types:** `meeting_created`, `meeting_completed`

---

#### `log_public_speech()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Log speech delivery to event_log
**Trigger:** AFTER INSERT ON `public_speeches`
**Event Type:** `public_speech_delivered`

---

#### `log_ai_context_update()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Log AI context version updates
**Trigger:** AFTER INSERT ON `ai_context`
**Event Type:** `ai_context_updated`

---

#### `ensure_single_current_ai_context()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Ensure only one `is_current=TRUE` per AI role
**Trigger:** BEFORE INSERT/UPDATE ON `ai_context`
**Logic:** Sets all other contexts for role to `is_current=FALSE`

---

#### `validate_vote_session_scope()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Validate vote session scope configuration
**Trigger:** BEFORE INSERT/UPDATE ON `vote_sessions`
**Rules:**
- If `scope='clan_only'`, `scope_clan_id` must be set
- If `scope='all'`, `scope_clan_id` must be NULL

---

#### `calculate_meeting_duration()` / `calculate_speech_duration()`
```sql
RETURNS TRIGGER
LANGUAGE plpgsql
```
**Purpose:** Auto-calculate duration fields
**Triggers:** BEFORE UPDATE ON `meetings`, BEFORE INSERT/UPDATE ON `public_speeches`
**Logic:** Computes `actual_duration_seconds` from `started_at` and `ended_at`

---

## 4. EVENT-DRIVEN ARCHITECTURE

### 4.1 Event Flow Pattern

```
User Action (Frontend)
    ↓
Supabase Client (INSERT/UPDATE)
    ↓
RLS Policy Check (Security)
    ↓
Database Write (PostgreSQL)
    ↓
Trigger Function (AFTER INSERT/UPDATE)
    ↓
Event Log Entry Created
    ↓
Supabase Realtime (NOTIFY)
    ↓
Subscribed Clients (UPDATE UI)
```

### 4.2 Event Types and Payloads

#### Phase Events
```json
// phase_started
{
  "event_type": "phase_started",
  "module": "stage_engine",
  "payload": {
    "phase_id": "uuid",
    "phase_name": "Free Consultations 1",
    "sequence_number": 5,
    "default_duration_minutes": 15
  }
}

// phase_completed
{
  "event_type": "phase_completed",
  "module": "stage_engine",
  "payload": {
    "phase_id": "uuid",
    "actual_duration_minutes": 17,
    "facilitator_extended": true
  }
}
```

#### Vote Events
```json
// vote_cast
{
  "event_type": "vote_cast",
  "module": "voting",
  "payload": {
    "session_id": "uuid",
    "voter_clan": "Military",
    "vote_type": "election_round",
    "timestamp": "2025-10-30T14:23:15Z"
  }
}
```

#### Meeting Events
```json
// meeting_created
{
  "event_type": "meeting_created",
  "module": "meetings",
  "payload": {
    "meeting_id": "uuid",
    "meeting_type": "free_consultation",
    "organizer": "Leonidas",
    "participant_count": 3
  }
}
```

#### AI Events
```json
// ai_context_updated
{
  "event_type": "ai_context_updated",
  "module": "ai_system",
  "payload": {
    "role_id": "uuid",
    "role_name": "Sokrates",
    "version": 12,
    "trigger": "public_speech_heard",
    "blocks_changed": ["memory", "goals"]
  }
}
```

### 4.3 Real-time Subscription Patterns

**Frontend Pattern:**
```typescript
// Subscribe to simulation-wide events
const channel = supabase
  .channel(`simulation:${runId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'phases',
    filter: `run_id=eq.${runId}`
  }, handlePhaseChange)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'votes',
    filter: `session_id=eq.${sessionId}`
  }, handleNewVote)
  .subscribe();
```

**Benefits:**
- Instant UI updates (no polling)
- Reduced server load
- Consistent state across all clients
- Natural event-driven architecture

---

## 5. JSONB QUERY PATTERNS

### 5.1 Querying AI Context Blocks

**Find AI characters with specific goal:**
```sql
SELECT role_id, name, block_4_goals->>'primary_goal' as primary_goal
FROM ai_context
JOIN roles USING (role_id)
WHERE is_current = TRUE
AND block_4_goals @> '{"primary_goal": "become_king"}'::jsonb;
```

**Check AI memory for specific event:**
```sql
SELECT role_id, name,
       block_3_memory->'recent_events' as recent_events
FROM ai_context
JOIN roles USING (role_id)
WHERE is_current = TRUE
AND block_3_memory->'recent_events' @> '[{"event_type": "betrayal"}]'::jsonb;
```

### 5.2 Querying Vote Results

**Get election winner:**
```sql
SELECT
  results_data->>'winner_role_id' as winner_id,
  results_data->>'winner_name' as winner_name,
  (results_data->>'vote_count')::int as votes_received
FROM vote_results
WHERE session_id = 'session-uuid';
```

**Get vote tallies:**
```sql
SELECT
  jsonb_array_elements(results_data->'tallies') as candidate_tally
FROM vote_results
WHERE session_id = 'session-uuid';
```

### 5.3 Querying Simulation Config

**Get simulation clans:**
```sql
SELECT
  config->'clans' as clan_list
FROM sim_runs
WHERE run_id = 'run-uuid';
```

**Find simulations with specific configuration:**
```sql
SELECT run_id, run_name
FROM sim_runs
WHERE config @> '{"voting_rules": {"round_1_threshold": "two_thirds"}}'::jsonb;
```

### 5.4 JSONB Operators Reference

| Operator | Description | Example |
|----------|-------------|---------|
| `->` | Get JSON object field | `block_4_goals->'primary_goal'` |
| `->>` | Get JSON object field as text | `block_4_goals->>'primary_goal'` |
| `@>` | Contains (left contains right) | `config @> '{"key": "value"}'::jsonb` |
| `<@` | Contained by (right contains left) | `'{"key": "value"}'::jsonb <@  config` |
| `?` | Does key exist? | `block_3_memory ? 'promises'` |
| `?|` | Do any keys exist? | `config ?| array['key1', 'key2']` |
| `?&` | Do all keys exist? | `config ?& array['key1', 'key2']` |

---

## 6. PERFORMANCE OPTIMIZATION HISTORY

### 6.1 Migration 00021: RLS Performance Optimization (Oct 27, 2025)

**Problem:** Supabase Performance Advisor warnings about `auth.uid()` re-evaluation
- RLS policies called `auth.uid()` for EACH row
- Profile loading timed out after 5 seconds
- Dashboard queries took 2-3 seconds

**Solution:** Wrap `auth.uid()` in SELECT subqueries
```sql
-- ❌ BEFORE: Per-row evaluation
WHERE assigned_user_id = auth.uid()

-- ✅ AFTER: Single evaluation
WHERE assigned_user_id = (SELECT auth.uid())
```

**Results:**
- 10-100x faster RLS policy evaluation
- Profile loading: < 100ms (was 5s timeout)
- Dashboard queries: < 500ms (was 2-3s)

**Files Changed:**
- Rewrote 3 helper functions (`is_facilitator`, `get_current_user_role_id`, `is_participant_in_run`)
- Updated 15 RLS policies across 8 tables

---

### 6.2 Migration 00027: Simulation Loading Indexes (Oct 28, 2025)

**Problem:** Facilitator simulation loading slow (2-3 seconds)
- Sequential queries: sim_run → clans → roles → phases
- Missing composite indexes for common query patterns

**Solution:** Add composite and covering indexes
```sql
CREATE INDEX idx_sim_runs_facilitator_created ON sim_runs(facilitator_id, created_at DESC);
CREATE INDEX idx_clans_run_sequence ON clans(run_id, sequence_number);
CREATE INDEX idx_roles_run_clan ON roles(run_id, clan_id);
CREATE INDEX idx_phases_run_sequence ON phases(run_id, sequence_number);
```

**Results:**
- Simulation loading: < 500ms (was 2-3s)
- 5-6x speedup
- Enabled parallel query execution

---

### 6.3 Migration 00043: Final auth.uid() Cleanup (Oct 28, 2025)

**Problem:** Some policies still had direct `auth.uid()` calls after migration 00021

**Solution:** Final pass to ensure ALL policies use `(SELECT auth.uid())`

**Results:**
- All 15 Performance Advisor warnings resolved
- Consistent performance across all tables

---

### 6.4 Index Strategy Summary

**Composite Indexes:** Enable multi-column queries
```sql
CREATE INDEX idx_roles_run_clan ON roles(run_id, clan_id);
-- Supports: WHERE run_id = ? AND clan_id = ?
```

**Partial Indexes:** Index only relevant rows
```sql
CREATE INDEX idx_tokens_token ON access_tokens(token)
WHERE is_valid = TRUE AND used_at IS NULL;
-- Only indexes active, unused tokens (smaller, faster)
```

**GIN Indexes:** Enable JSONB queries
```sql
CREATE INDEX idx_ai_context_block3 ON ai_context USING GIN(block_3_memory);
-- Supports: WHERE block_3_memory @> '{"key": "value"}'::jsonb
```

**Full-Text Search Indexes:** Enable semantic search
```sql
CREATE INDEX idx_reflections_text_search ON reflections
USING GIN(to_tsvector('english', reflection_text));
-- Supports: WHERE to_tsvector('english', reflection_text) @@ to_tsquery('leadership & strategy')
```

---

## 7. MIGRATION BEST PRACTICES

### 7.1 Naming Conventions

**Format:** `NNNNN_descriptive_name.sql`
- `NNNNN`: 5-digit sequence number (zero-padded)
- `descriptive_name`: Clear, lowercase, underscores

**Examples:**
- `00001_init_core_tables.sql`
- `00011_add_voting_thresholds.sql`
- `00021_optimize_rls_performance.sql`

### 7.2 Migration Structure

```sql
-- ============================================================================
-- Migration: 00XXX_migration_name.sql
-- Description: What this migration does
-- ============================================================================
-- Author: Role/Name
-- Date: YYYY-MM-DD
-- Project: The New King SIM
-- ============================================================================

-- Main migration code here

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables affected: list
-- Next migration: what comes next
-- ============================================================================
```

### 7.3 Safety Checklist

**Before Migration:**
- [ ] Test on local database
- [ ] Verify no data loss
- [ ] Check for breaking changes
- [ ] Review RLS policy impacts

**During Migration:**
- [ ] Use `IF NOT EXISTS` for idempotency
- [ ] Use transactions where possible
- [ ] Add comments for documentation
- [ ] Include rollback instructions (if applicable)

**After Migration:**
- [ ] Verify schema changes
- [ ] Test RLS policies
- [ ] Check query performance
- [ ] Update KING_DATA_ARCHITECTURE.md (this document)

### 7.4 Common Patterns

**Add Column (Idempotent):**
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'table_name' AND column_name = 'new_column'
    ) THEN
        ALTER TABLE table_name ADD COLUMN new_column TEXT;
        COMMENT ON COLUMN table_name.new_column IS 'Description';
    END IF;
END $$;
```

**Add Index (Idempotent):**
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);
```

**Drop and Recreate Policy:**
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;

CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  TO authenticated
  USING (condition);
```

---

## APPENDIX A: SCHEMA EVOLUTION TIMELINE

| Migration | Date | Description | Impact |
|-----------|------|-------------|--------|
| 00001 | Oct 25 | Init core tables | Foundation |
| 00002-00005 | Oct 25 | Init all tables | Complete schema |
| 00006-00007 | Oct 25 | RLS policies + functions | Security layer |
| 00008-00010 | Oct 25-26 | Seed Kourion template | Sample data |
| **00011** | **Oct 26** | **Add voting thresholds** | **Config enhancement** |
| 00012-00017 | Oct 26 | Template refinements | Data quality |
| **00018** | **Oct 26** | **Add logo_url to clans** | **Print materials** |
| 00019-00020 | Oct 26 | Complete template data | Template finalization |
| **00021** | **Oct 27** | **Optimize RLS performance** | **10-100x speedup** |
| 00022-00026 | Oct 27 | RLS consolidation | Policy cleanup |
| **00027** | **Oct 28** | **Add simulation indexes** | **5-6x speedup** |
| 00028-00042 | Oct 28 | RLS policy fixes | Security refinement |
| **00043** | **Oct 28** | **Fix auth.uid() performance** | **Final optimization** |
| 00044-00046 | Oct 28 | Cleanup duplicates | Maintenance |

**Total:** 46 migrations, ~10,000 lines of SQL

---

## APPENDIX B: DEVIATIONS FROM PRD

### DEVIATION-001: Voting Thresholds (Type B: Docs should update)
**Tables:** `sim_runs.vote_1_threshold`, `sim_runs.vote_2_threshold`
**Added:** Migration 00011
**Reason:** Required for configurable voting rules per simulation
**Status:** NOT in PRD Section 9.2
**Recommendation:** Update PRD Section 4.6 and 9.2

### DEVIATION-002: Clan Logo URL (Type B: Docs should update)
**Tables:** `clans.logo_url`
**Added:** Migration 00018
**Reason:** Needed for high-resolution printable materials (distinct from emblem_url)
**Status:** NOT in PRD or TECH_GUIDE
**Recommendation:** Update PRD Section 6.3 and TECH_GUIDE Section 3.2.3

### DEVIATION-003: Performance Indexes (Type C: Technical improvement)
**Tables:** All tables
**Added:** Migrations 00021, 00027, 00043
**Reason:** Address real performance bottlenecks (5-100x improvements)
**Status:** Basic indexes in TECH_GUIDE, but not all performance indexes documented
**Recommendation:** Accept as technical improvement, document in this file

---

## APPENDIX C: FUTURE CONSIDERATIONS

### Missing Features (From PRD, Not Yet Implemented)

**AI Service Architecture:**
- Edge Functions for ElevenLabs integration (transcription, TTS)
- AI decision-making orchestration service
- LLM API integration architecture

**Recommendation:** Document AI service architecture before implementation (See TECH_GUIDE Section 7)

### Performance Scaling (Beyond MVP)
- **Concern:** Supabase Realtime may not scale to 100+ concurrent participants
- **Mitigation:** Current limit: 30 participants per simulation (within capacity)
- **Future:** Consider Redis pub/sub for large-scale events

### JSONB Field Evolution
- **Current:** Flexible JSONB for config, ai_context, results_data
- **Risk:** Complex queries may slow as data grows
- **Mitigation:** GIN indexes added, monitor query performance
- **Future:** Consider materialized views for complex aggregations

---

**END OF DOCUMENT - KING_DATA_ARCHITECTURE.md v1.0**

*This document is the single source of truth for The New King SIM data layer implementation.*
*Last updated: October 30, 2025*
*Next update: After AI implementation (Phase 3.3)*
