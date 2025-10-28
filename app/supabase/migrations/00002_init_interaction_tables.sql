-- ============================================================================
-- Migration: 00002_init_interaction_tables.sql
-- Description: Create interaction tracking tables
-- Tables: meetings, meeting_invitations, public_speeches
-- ============================================================================
-- Author: Data & Backend Architect
-- Date: 2025-10-25
-- Project: The New King SIM - Political Simulation Platform
-- ============================================================================

-- ============================================================================
-- TABLE: meetings (All Conversations)
-- ============================================================================
-- Purpose: Track meetings for AI context updates
-- Key Design: Only AI-involved meetings tracked, physical human-only meetings NOT tracked
-- ============================================================================

CREATE TABLE meetings (
  -- Identity
  meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id) ON DELETE CASCADE,

  -- Type (SIMPLIFIED - only 2 types)
  meeting_type TEXT NOT NULL CHECK (meeting_type IN (
    'clan_council',        -- Automatic clan meeting (all clan members)
    'free_consultation'    -- Ad-hoc meeting during free consult stage (2+ participants)
  )),

  -- Organization
  organizer_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL, -- NULL for automatic clan councils
  title TEXT, -- Optional (e.g., "Discuss Alliance with Merchants")

  -- Participants (JSONB array of role_ids)
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: ["role-uuid-1", "role-uuid-2", "role-uuid-3"]
  -- Can be 2+ participants

  -- Modality (SIMPLIFIED - only voice or text)
  modality TEXT NOT NULL DEFAULT 'voice' CHECK (modality IN (
    'voice',      -- Voice call via ElevenLabs (default, if any AI + human)
    'text'        -- Text chat (fallback if voice fails, or AI-to-AI only)
  )),

  -- Content (transcript required for AI updates)
  transcript TEXT, -- NULL while in progress, populated on end
  transcript_format TEXT DEFAULT 'plain' CHECK (transcript_format IN ('plain', 'json')),

  -- Voice Integration (only if modality = 'voice')
  elevenlabs_conversation_id TEXT, -- ElevenLabs conversation ID if voice meeting

  -- Timing (all optional except created_at)
  scheduled_duration_minutes INTEGER CHECK (scheduled_duration_minutes > 0), -- Suggested duration
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_seconds INTEGER CHECK (actual_duration_seconds > 0), -- Calculated on end

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Invite sent, not all accepted yet
    'accepted',     -- All participants accepted
    'active',       -- Meeting in progress
    'completed',    -- Finished normally
    'cancelled',    -- Organizer cancelled
    'expired'       -- Invite expired (no response)
  )),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

-- Indexes for meetings
CREATE INDEX idx_meetings_run ON meetings(run_id);
CREATE INDEX idx_meetings_phase ON meetings(phase_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_role_id);
CREATE INDEX idx_meetings_type ON meetings(meeting_type);

-- GIN index for participant array queries
CREATE INDEX idx_meetings_participants ON meetings USING GIN (participants);

-- Comments
COMMENT ON TABLE meetings IS 'Meeting tracking for AI context updates - physical human-only meetings NOT tracked';
COMMENT ON COLUMN meetings.meeting_type IS 'Only 2 types: clan_council (automatic) or free_consultation (ad-hoc)';
COMMENT ON COLUMN meetings.participants IS 'JSONB array of role_ids - flexible 2+ participants';
COMMENT ON COLUMN meetings.modality IS 'Voice (default via ElevenLabs) or Text (fallback/AI-only)';
COMMENT ON COLUMN meetings.transcript IS 'Required for AI context updates after meeting ends';

-- ============================================================================
-- TABLE: meeting_invitations (Invitation Workflow)
-- ============================================================================
-- Purpose: Track individual meeting invitations and responses
-- Key Design: Once ANY invitee accepts, meeting can begin
-- ============================================================================

CREATE TABLE meeting_invitations (
  -- Identity
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(meeting_id) ON DELETE CASCADE,

  -- Target
  invitee_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Response
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'accepted',
    'declined',
    'expired'
  )),
  response_text TEXT, -- Optional message from invitee
  responded_at TIMESTAMPTZ,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-expire after 10 minutes

  -- Validation constraints
  CHECK (expires_at IS NULL OR expires_at > created_at),
  CHECK (responded_at IS NULL OR responded_at >= created_at),

  -- Uniqueness constraint
  UNIQUE(meeting_id, invitee_role_id)
);

-- Indexes for meeting_invitations
CREATE INDEX idx_invitations_meeting ON meeting_invitations(meeting_id);
CREATE INDEX idx_invitations_invitee ON meeting_invitations(invitee_role_id);
CREATE INDEX idx_invitations_status ON meeting_invitations(status);
CREATE INDEX idx_invitations_expires ON meeting_invitations(expires_at) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE meeting_invitations IS 'Individual meeting invitation tracking with expiry';
COMMENT ON COLUMN meeting_invitations.expires_at IS 'Invitations auto-expire after 10 minutes if not responded';
COMMENT ON COLUMN meeting_invitations.status IS 'Once ANY invitee accepts, meeting can begin';

-- ============================================================================
-- TABLE: public_speeches (Recording Public Addresses)
-- ============================================================================
-- Purpose: Record all public speeches for AI context distribution
-- Key Design: Recording → Transcription → Distribution to all AI participants
-- ============================================================================

CREATE TABLE public_speeches (
  -- Identity
  speech_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id) ON DELETE CASCADE,

  -- Speaker (one of these will be set)
  speaker_role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL, -- NULL for facilitator
  is_facilitator BOOLEAN NOT NULL DEFAULT FALSE,
  is_ai_speaker BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE if AI character speaking

  -- Content (transcript is REQUIRED for AI distribution)
  transcript TEXT NOT NULL, -- Required: sent to all AI participants
  audio_url TEXT, -- Optional (stored if recorded/generated)

  -- Delivery Method (for reference only)
  delivery_method TEXT CHECK (delivery_method IN (
    'human_microphone',    -- Human spoke into physical mic (via Secretary)
    'ai_tts_playback',     -- AI speech played through facilitator's speakers
    'facilitator_announcement' -- Facilitator's own announcement
  )),

  -- Timing (all optional except created_at)
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER CHECK (duration_seconds > 0),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at),
  CHECK (
    -- Exactly one speaker type must be true
    (is_facilitator::int + is_ai_speaker::int + (speaker_role_id IS NOT NULL)::int) = 1
  )
);

-- Indexes for public_speeches
CREATE INDEX idx_speeches_run ON public_speeches(run_id);
CREATE INDEX idx_speeches_phase ON public_speeches(phase_id);
CREATE INDEX idx_speeches_speaker ON public_speeches(speaker_role_id);
CREATE INDEX idx_speeches_facilitator ON public_speeches(is_facilitator) WHERE is_facilitator = TRUE;
CREATE INDEX idx_speeches_ai ON public_speeches(is_ai_speaker) WHERE is_ai_speaker = TRUE;
CREATE INDEX idx_speeches_created ON public_speeches(created_at DESC);

-- Comments
COMMENT ON TABLE public_speeches IS 'Public speech recording for AI context distribution - NOT live broadcasting';
COMMENT ON COLUMN public_speeches.transcript IS 'Required - distributed to all AI participants for context updates';
COMMENT ON COLUMN public_speeches.audio_url IS 'Optional - stored if speech was recorded or generated via TTS';
COMMENT ON COLUMN public_speeches.delivery_method IS 'Recording method: human mic (Secretary system), AI TTS, or facilitator announcement';

-- ============================================================================
-- INTERACTION TABLES MIGRATION COMPLETE
-- ============================================================================
-- Tables created: meetings, meeting_invitations, public_speeches
-- Next migration: voting tables (vote_sessions, vote_results, votes)
-- ============================================================================
