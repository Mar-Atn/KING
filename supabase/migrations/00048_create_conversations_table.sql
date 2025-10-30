-- Migration: Create conversations table for AI Character Prototype
-- Purpose: Track all conversations (text, voice, combined) for testing and reflection
-- Date: 2025-10-30

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  -- Primary key
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Modality
  modality TEXT NOT NULL CHECK (modality IN ('text', 'voice', 'combined')),

  -- Content (transcript stored as JSONB array)
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{"speaker": "Admin", "text": "...", "timestamp": "2025-10-30T15:30:00Z"}]

  -- Voice-specific metadata
  elevenlabs_conversation_id TEXT,

  -- Reflection tracking
  reflection_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  ai_context_version_before INTEGER,
  ai_context_version_after INTEGER,

  -- Metrics
  total_messages INTEGER,
  avg_response_time_seconds DECIMAL(5,2),
  total_tokens_used INTEGER,
  estimated_cost_usd DECIMAL(10,4),

  -- Testing & debugging
  scenario_injected JSONB,
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Query conversations by role
CREATE INDEX idx_conversations_role_id
  ON conversations(role_id);

-- Query by time range
CREATE INDEX idx_conversations_started_at
  ON conversations(started_at DESC);

-- Find unreflected conversations
CREATE INDEX idx_conversations_reflection_pending
  ON conversations(reflection_triggered)
  WHERE reflection_triggered = FALSE;

-- Query by modality
CREATE INDEX idx_conversations_modality
  ON conversations(modality);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for prototype admin)
CREATE POLICY conversations_service_role_full_access
  ON conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view conversations (read-only for now)
CREATE POLICY conversations_authenticated_read
  ON conversations
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversations IS
  'AI Character Prototype: Conversation logs for text, voice, and combined modes';

COMMENT ON COLUMN conversations.conversation_id IS
  'Unique identifier for this conversation session';

COMMENT ON COLUMN conversations.role_id IS
  'AI character role participating in conversation';

COMMENT ON COLUMN conversations.modality IS
  'Conversation type: text (OpenAI Realtime text), voice (OpenAI audio), or combined (both)';

COMMENT ON COLUMN conversations.transcript IS
  'Full conversation transcript as JSONB array of {speaker, text, timestamp} objects';

COMMENT ON COLUMN conversations.elevenlabs_conversation_id IS
  'ElevenLabs conversation ID if using ElevenLabs voice integration';

COMMENT ON COLUMN conversations.reflection_triggered IS
  'Whether reflection engine was triggered after conversation ended';

COMMENT ON COLUMN conversations.ai_context_version_before IS
  'AI context version at conversation start';

COMMENT ON COLUMN conversations.ai_context_version_after IS
  'AI context version after reflection (if triggered)';

COMMENT ON COLUMN conversations.scenario_injected IS
  'If this was a scenario injection test, the scenario data';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert a sample conversation for testing
-- (Will be removed in production, kept for prototype development)

DO $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Get first AI role for testing
  SELECT role_id INTO v_role_id
  FROM roles
  WHERE participant_type = 'ai'
  LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO conversations (
      role_id,
      modality,
      transcript,
      started_at,
      ended_at,
      duration_seconds,
      total_messages,
      reflection_triggered,
      notes
    ) VALUES (
      v_role_id,
      'text',
      '[
        {"speaker": "Admin", "text": "Hello, how do you feel about the current situation?", "timestamp": "2025-10-30T10:00:00Z"},
        {"speaker": "Character", "text": "I am concerned about the political tensions between clans.", "timestamp": "2025-10-30T10:00:05Z"},
        {"speaker": "Admin", "text": "What are your thoughts on taxation?", "timestamp": "2025-10-30T10:00:15Z"},
        {"speaker": "Character", "text": "We must balance military needs with civilian welfare. I support reasonable taxation with oversight.", "timestamp": "2025-10-30T10:00:22Z"}
      ]'::jsonb,
      NOW() - INTERVAL '10 minutes',
      NOW() - INTERVAL '5 minutes',
      300,
      4,
      FALSE,
      'Sample conversation for prototype testing'
    );
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'conversations'
  ) THEN
    RAISE NOTICE '✅ conversations table created successfully';
  ELSE
    RAISE EXCEPTION '❌ conversations table creation failed';
  END IF;
END $$;
