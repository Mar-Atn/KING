-- ============================================================================
-- Migration: 00075_add_ai_voice_integration_fields.sql
-- Description: Add fields needed for AI cognitive system and voice integration
-- Changes:
--   1. Add elevenlabs_agent_id to roles table
--   2. Create meeting_messages table for parallel voice+text chat
-- ============================================================================
-- Author: AI Systems Architect
-- Date: 2025-10-29
-- Project: The New King SIM - AI & Voice Integration
-- Reference: THERAPIST_VOICE_PATTERNS.md, PARALLEL_VOICE_CHAT_PATTERN.md
-- ============================================================================

-- ============================================================================
-- PART 1: Add ElevenLabs Agent ID to Roles
-- ============================================================================
-- Purpose: Store ElevenLabs agent ID for each AI character
-- Reference: EXMG_PATTERNS.md - store agent_id directly in character table
-- ============================================================================

ALTER TABLE roles
ADD COLUMN elevenlabs_agent_id TEXT;

COMMENT ON COLUMN roles.elevenlabs_agent_id IS 'ElevenLabs conversational AI agent ID for this character (if AI participant)';

-- Index for quick lookup of roles by agent_id
CREATE INDEX idx_roles_elevenlabs_agent_id ON roles(elevenlabs_agent_id) WHERE elevenlabs_agent_id IS NOT NULL;

-- ============================================================================
-- PART 2: Create Meeting Messages Table
-- ============================================================================
-- Purpose: Track individual messages for parallel voice+text chat
-- Reference: PARALLEL_VOICE_CHAT_PATTERN.md
-- Key Design:
--   - Unified transcript stores both voice and text messages
--   - Channel field distinguishes voice vs text
--   - Used for reflection after meeting ends
-- ============================================================================

CREATE TABLE meeting_messages (
  -- Identity
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Channel (voice or text)
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'text')) DEFAULT 'text',

  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata (for ordering and display)
  sequence_number INTEGER -- Optional: for guaranteed ordering
);

-- Indexes for meeting_messages
CREATE INDEX idx_meeting_messages_meeting ON meeting_messages(meeting_id, timestamp);
CREATE INDEX idx_meeting_messages_role ON meeting_messages(role_id);
CREATE INDEX idx_meeting_messages_channel ON meeting_messages(channel);

-- Comments
COMMENT ON TABLE meeting_messages IS 'Individual messages in meetings for parallel voice+text chat';
COMMENT ON COLUMN meeting_messages.channel IS 'Distinguishes voice messages from text messages for unified transcript';
COMMENT ON COLUMN meeting_messages.content IS 'Message text (from ASR for voice, direct input for text)';

-- ============================================================================
-- PART 3: Add Indexes for AI Context Queries
-- ============================================================================
-- Purpose: Optimize queries for AI cognitive system
-- Reference: THERAPIST_COGNITIVE_PATTERNS.md - efficient context loading
-- ============================================================================

-- Index for loading all messages from a role (for memory context)
CREATE INDEX idx_meeting_messages_role_timestamp ON meeting_messages(role_id, timestamp DESC);

-- Index for loading meeting transcript chronologically
CREATE INDEX idx_meeting_messages_meeting_chrono ON meeting_messages(meeting_id, timestamp ASC);

-- ============================================================================
-- AI VOICE INTEGRATION MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
--   ✅ Added elevenlabs_agent_id to roles table
--   ✅ Created meeting_messages table with channel field
--   ✅ Added indexes for efficient AI context queries
--
-- Next steps:
--   - Populate elevenlabs_agent_id when creating AI characters (Sprint 3-4)
--   - Implement voice channel using ElevenLabs API (Sprint 5-6)
--   - Implement text chat channel alongside voice (Sprint 5-6)
--   - Build unified transcript for reflection (Sprint 5-6)
-- ============================================================================
