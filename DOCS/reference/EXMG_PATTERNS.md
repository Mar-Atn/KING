# EXMG (Exness Management Games) - Proven Patterns for KING
## Reference Guide for Competition Management & AI Character Systems

**Source Project:** `https://github.com/Mar-Atn/EXMG`
**Technologies:** React + TypeScript + Supabase + ElevenLabs + Google Gemini
**Similarity to KING:** Competition-based simulation with AI characters and voice integration

---

## Executive Summary

EXMG is a negotiation/management competition platform where users interact with AI characters through voice conversations. The system uses **Supabase** (like KING), integrates **ElevenLabs** for voice, and implements sophisticated state management for competitions, conversations, and scoring.

**Key similarities to KING:**
- AI character system (characters table)
- Voice conversations with ElevenLabs
- Competition/simulation lifecycle management
- User attempts/rounds (similar to simulation runs)
- Progressive information reveal based on competition stage
- Row-Level Security policies
- Scoring and evaluation system

---

## Architecture Overview

```
EXMG System
│
├─ Characters (AI personas)
│  ├─ Personality prompts
│  ├─ ElevenLabs agent IDs
│  └─ Visual identity (avatars)
│
├─ Challenges (scenarios)
│  ├─ Hidden success criteria (keys)
│  └─ Multi-arbiter evaluation
│
├─ Conversations (user-AI interactions)
│  ├─ Attempt management (up to 3 tries)
│  ├─ State tracking (in_progress → completed)
│  ├─ Transcript accumulation
│  └─ Scoring integration
│
├─ Feedback System
│  ├─ AI-generated feedback (via Gemini)
│  ├─ Template-based prompts
│  └─ User satisfaction ratings
│
└─ Competition Lifecycle
   ├─ Stage-based access control (RLS)
   ├─ Leaderboard visibility
   └─ Progressive reveal of answers
```

---

## Database Patterns

### 1. Characters Table

**Purpose:** Store AI character definitions with personality and voice configuration

```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    personality_prompt TEXT NOT NULL,
    trigger_preferences JSONB,
    elevenlabs_agent_id TEXT,  -- Direct link to ElevenLabs agent
    avatar_url TEXT,
    avatar_data BYTEA,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Pattern:** Store `elevenlabs_agent_id` directly in character definition for easy lookup.

**For KING Adaptation:**
```sql
-- We already have roles table
-- Add elevenlabs_agent_id column:
ALTER TABLE roles ADD COLUMN elevenlabs_agent_id TEXT;

-- Or store in ai_context table (JSONB):
-- identity_context.elevenlabs_agent_id
```

**Benefits:**
- Each AI character has a consistent voice
- Easy to configure different voices per character
- Can change agent ID without code changes

---

### 2. Conversations Table

**Purpose:** Track conversation sessions with state management and attempt tracking

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    elevenlabs_conversation_id TEXT,  -- ElevenLabs session ID

    -- Attempt Management
    attempt_number INT NOT NULL DEFAULT 1,
    is_active_attempt BOOLEAN DEFAULT TRUE,

    -- State Tracking
    status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned', 'technical_failure')),

    -- Conversation Data
    transcript TEXT,
    duration_seconds INT,

    -- Scoring
    average_completion_percentage DECIMAL,
    total_score INT,
    ai_feedback TEXT,

    -- Test Mode
    is_test_conversation BOOLEAN DEFAULT FALSE,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, challenge_id, attempt_number),
    CHECK(attempt_number BETWEEN 1 AND 3)
);

-- Index for active attempt lookups
CREATE INDEX idx_conversations_active
ON conversations(user_id, challenge_id, is_active_attempt)
WHERE is_active_attempt = TRUE;
```

**Key Patterns:**

1. **Attempt Management:** Users get up to 3 tries per challenge
2. **State Tracking:** Explicit status field prevents ambiguity
3. **ElevenLabs Session ID:** Links to voice conversation
4. **Test Mode:** Allows testing without polluting real data
5. **Unique Constraint:** Prevents duplicate attempts

**For KING Adaptation:**
```sql
-- Similar to our meetings table, but add:
ALTER TABLE meetings ADD COLUMN attempt_number INT DEFAULT 1;
ALTER TABLE meetings ADD COLUMN is_active_attempt BOOLEAN DEFAULT TRUE;
ALTER TABLE meetings ADD COLUMN elevenlabs_conversation_id TEXT;
ALTER TABLE meetings ADD COLUMN status TEXT
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
ALTER TABLE meetings ADD COLUMN transcript TEXT;
ALTER TABLE meetings ADD COLUMN duration_seconds INT;
```

**Benefits:**
- Clear conversation lifecycle
- Easy to resume in-progress conversations
- Test mode prevents polluting production data
- Attempt tracking for user experience (retry mechanism)

---

### 3. Feedback Prompts Table

**Purpose:** Store AI prompt templates for different evaluation types

```sql
CREATE TABLE feedback_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('scoring', 'personal_feedback', 'debrief')),
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure only one active prompt per type
    UNIQUE(prompt_type, is_active) WHERE is_active = TRUE
);
```

**Key Pattern:** Template-based prompts with type categorization and uniqueness constraint.

**For KING Adaptation:**
```sql
-- We already have ai_prompts table
-- Similar pattern, but we organize by block:
CREATE TABLE ai_prompts (
    prompt_id UUID PRIMARY KEY,
    template_id UUID REFERENCES simulation_templates(template_id),
    prompt_type TEXT CHECK (prompt_type IN ('fixed_context', 'identity', 'reflection', 'meeting', 'speech', 'voting')),
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(template_id, prompt_type, is_active) WHERE is_active = TRUE
);
```

**Benefits:**
- Centralized prompt management
- Easy to A/B test prompts (toggle is_active)
- Versioning without code changes
- Type safety with CHECK constraint

---

### 4. Key Scores Table (Multi-Arbiter Evaluation)

**Purpose:** Store evaluation results from multiple AI arbiters

```sql
CREATE TABLE key_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    challenge_key_id UUID NOT NULL REFERENCES challenge_keys(id),

    -- Multi-arbiter evaluation
    arbiter_number INT NOT NULL CHECK (arbiter_number BETWEEN 1 AND 3),
    ai_model TEXT NOT NULL,  -- e.g., 'gemini-1.5-pro'

    -- Scoring
    completion_percentage DECIMAL CHECK (completion_percentage BETWEEN 0 AND 100),
    score_achieved INT,
    ai_rationale TEXT,  -- Explanation of score

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique: one score per arbiter per key per conversation
    UNIQUE(conversation_id, challenge_key_id, arbiter_number)
);
```

**Key Pattern:** 3 independent AI arbiters evaluate the same conversation, results aggregated for fairness.

**For KING Adaptation (Optional):**
```sql
-- Could use for AI performance evaluation
-- Or for multi-AI consensus on voting decisions
CREATE TABLE ai_evaluations (
    evaluation_id UUID PRIMARY KEY,
    role_id UUID REFERENCES roles(role_id),
    event_type TEXT CHECK (event_type IN ('speech', 'meeting', 'vote_decision')),
    event_id UUID,  -- Generic event reference

    arbiter_number INT CHECK (arbiter_number BETWEEN 1 AND 3),
    ai_model TEXT,
    evaluation_score DECIMAL,
    rationale TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(role_id, event_id, arbiter_number)
);
```

**Benefits:**
- Reduces AI bias (multiple independent evaluations)
- Transparent scoring (rationale stored)
- Quality assurance for AI decisions

---

## RLS Policy Patterns

### 1. Progressive Information Reveal

**Pattern:** Access to information changes based on competition stage

```sql
-- Hide challenge keys during competition
CREATE POLICY "Keys are hidden from regular users during competition"
ON challenge_keys FOR SELECT
TO authenticated
USING (
    -- Allow if user is admin
    (SELECT is_admin FROM users WHERE id = auth.uid())
    OR
    -- Allow if competition stage allows reveals
    (
        SELECT competition_stage IN ('results_revealed', 'completed')
        FROM competition_config
        WHERE id = 1  -- Singleton config
    )
);
```

**For KING Adaptation:**
```sql
-- Hide vote results until phase completes
CREATE POLICY "Vote results hidden until phase complete"
ON votes FOR SELECT
TO authenticated
USING (
    -- Facilitator can always see
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'facilitator'
    )
    OR
    -- Participants see after vote session completed
    EXISTS (
        SELECT 1 FROM vote_sessions vs
        JOIN votes v ON v.session_id = vs.session_id
        WHERE vs.status = 'completed'
        AND v.vote_id = votes.vote_id
    )
);

-- Hide meeting transcripts from non-participants
CREATE POLICY "Meeting transcripts for participants only"
ON meeting_messages FOR SELECT
TO authenticated
USING (
    -- User is participant in the meeting
    EXISTS (
        SELECT 1 FROM meetings m
        JOIN meeting_participants mp ON mp.meeting_id = m.meeting_id
        WHERE m.meeting_id = meeting_messages.meeting_id
        AND mp.role_id = (SELECT role_id FROM roles WHERE assigned_user_id = auth.uid())
    )
    OR
    -- User is facilitator
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'facilitator'
    )
);
```

**Benefits:**
- Phase-based information control
- Fair play enforcement
- No spoilers before appropriate time

---

### 2. Conditional Leaderboard Visibility

```sql
-- Leaderboard visibility controlled by config
CREATE POLICY "Anyone can view leaderboard when visible"
ON leaderboard_entries FOR SELECT
TO authenticated
USING (
    (SELECT leaderboard_visible FROM competition_config WHERE id = 1)
    OR
    (SELECT is_admin FROM users WHERE id = auth.uid())
);
```

**For KING Adaptation:**
```sql
-- Maybe hide participant list until simulation starts
CREATE POLICY "Participant list visible after sim starts"
ON roles FOR SELECT
TO authenticated
USING (
    -- Facilitator always sees
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'facilitator')
    OR
    -- Participants see after sim started
    EXISTS (
        SELECT 1 FROM sim_runs sr
        WHERE sr.run_id = roles.run_id
        AND sr.status IN ('in_progress', 'completed')
    )
);
```

**Benefits:**
- Dynamic visibility control
- Facilitator override for admin tasks
- Config-driven instead of code changes

---

## Service Layer Patterns

### 1. Conversation State Management

**From `conversationService.ts`:**

```typescript
class ConversationService {
    async createConversation(userId: string, challengeId: string, isTest: boolean = false) {
        // Check for existing active attempt
        const { data: existingActive } = await supabase
            .from('conversations')
            .select('attempt_number')
            .eq('user_id', userId)
            .eq('challenge_id', challengeId)
            .eq('is_active_attempt', true)
            .single()

        let attemptNumber = 1

        if (existingActive) {
            // Resume in-progress attempt
            attemptNumber = existingActive.attempt_number
            console.log(`Resuming attempt ${attemptNumber}`)
        } else {
            // Get highest attempt number
            const { data: lastAttempt } = await supabase
                .from('conversations')
                .select('attempt_number')
                .eq('user_id', userId)
                .eq('challenge_id', challengeId)
                .order('attempt_number', { ascending: false })
                .limit(1)
                .single()

            if (lastAttempt) {
                attemptNumber = lastAttempt.attempt_number + 1
            }
        }

        // Deactivate previous attempts if test mode
        if (isTest) {
            await supabase
                .from('conversations')
                .update({ is_active_attempt: false })
                .eq('user_id', userId)
                .eq('challenge_id', challengeId)
        }

        // Create new conversation
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                user_id: userId,
                challenge_id: challengeId,
                attempt_number: attemptNumber,
                is_active_attempt: true,
                is_test_conversation: isTest,
                status: 'in_progress'
            })
            .select()
            .single()

        return data
    }

    async completeConversation(conversationId: string, transcript: string) {
        const { data, error } = await supabase
            .from('conversations')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                transcript,
                duration_seconds: this.calculateDuration(conversationId)
            })
            .eq('id', conversationId)
            .select()
            .single()

        return data
    }

    async markAttemptInactive(conversationId: string) {
        await supabase
            .from('conversations')
            .update({ is_active_attempt: false })
            .eq('id', conversationId)
    }

    async subscribeToConversationUpdates(conversationId: string, callback: Function) {
        return supabase
            .channel(`conversation-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `id=eq.${conversationId}`
                },
                (payload) => callback(payload.new)
            )
            .subscribe()
    }
}
```

**For KING Adaptation:**

```typescript
// Similar pattern for meeting management
class MeetingService {
    async createMeeting(runId: string, participantRoles: string[]) {
        // Check if meeting already exists with same participants
        const existing = await this.findActiveMeeting(runId, participantRoles)

        if (existing) {
            return existing // Resume existing meeting
        }

        // Create new meeting
        const meeting = await supabase
            .from('meetings')
            .insert({
                run_id: runId,
                status: 'scheduled',
                is_active: true
            })
            .select()
            .single()

        // Add participants
        await supabase
            .from('meeting_participants')
            .insert(
                participantRoles.map(roleId => ({
                    meeting_id: meeting.data.meeting_id,
                    role_id: roleId
                }))
            )

        return meeting.data
    }

    async startMeeting(meetingId: string, elevenLabsConversationId: string) {
        return await supabase
            .from('meetings')
            .update({
                status: 'in_progress',
                elevenlabs_conversation_id: elevenLabsConversationId,
                started_at: new Date().toISOString()
            })
            .eq('meeting_id', meetingId)
    }

    async completeMeeting(meetingId: string, transcript: string) {
        const duration = await this.calculateDuration(meetingId)

        return await supabase
            .from('meetings')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                transcript,
                duration_seconds: duration
            })
            .eq('meeting_id', meetingId)
    }
}
```

**Key Takeaways:**
- Explicit state management (in_progress → completed)
- Resume in-progress conversations
- Test mode for development
- Real-time subscriptions for live updates

---

### 2. Character Service Pattern

**From `characterService.ts`:**

```typescript
class CharacterService {
    async getAllCharacters() {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw error
        return data
    }

    async getCharacterById(id: string) {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async createCharacter(character: CharacterInput) {
        const { data, error } = await supabase
            .from('characters')
            .insert(character)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async updateCharacter(id: string, updates: Partial<CharacterInput>) {
        const { data, error } = await supabase
            .from('characters')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Character with id ${id} not found or update was blocked by permissions`)
        }

        return data
    }
}
```

**For KING Adaptation:**

```typescript
// We have roles table, but could add AICharacterService for AI-specific operations
class AICharacterService {
    async getAICharacter(roleId: string) {
        // Load role + AI context
        const { data: role } = await supabase
            .from('roles')
            .select('*, clans(*)')
            .eq('role_id', roleId)
            .eq('participant_type', 'ai')
            .single()

        const { data: context } = await supabase
            .from('ai_context')
            .select('*')
            .eq('role_id', roleId)
            .order('version', { ascending: false })
            .limit(1)
            .single()

        return {
            ...role,
            ai_context: context
        }
    }

    async updateAIContext(roleId: string, blocks: AIContextBlocks) {
        // Create new version
        const { data: latestContext } = await supabase
            .from('ai_context')
            .select('version')
            .eq('role_id', roleId)
            .order('version', { ascending: false })
            .limit(1)
            .single()

        const newVersion = (latestContext?.version || 0) + 1

        return await supabase
            .from('ai_context')
            .insert({
                role_id: roleId,
                version: newVersion,
                fixed_context: blocks.fixed_context,
                identity_context: blocks.identity_context,
                memory_context: blocks.memory_context,
                goals_context: blocks.goals_context
            })
            .select()
            .single()
    }
}
```

**Key Takeaways:**
- Simple CRUD operations with clear error handling
- Version tracking for AI context
- Separation of concerns (role vs. AI-specific data)

---

## ElevenLabs Integration Pattern

**From `elevenlabsService.ts`:**

```typescript
interface ElevenLabsAgent {
    agent_id: string
    name: string
    conversation_config?: {
        // Agent settings
    }
}

export const elevenlabsService = {
    async getAgents(): Promise<ElevenLabsAgent[]> {
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
                headers: {
                    'XI-API-Key': import.meta.env.VITE_ELEVENLABS_API_KEY
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            return data.agents || []
        } catch (error) {
            console.error('Failed to fetch ElevenLabs agents:', error)
            return []
        }
    },

    async getVoices() {
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'XI-API-Key': import.meta.env.VITE_ELEVENLABS_API_KEY
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            return data.voices || []
        } catch (error) {
            console.error('Failed to fetch ElevenLabs voices:', error)
            return []
        }
    }
}
```

**Key Pattern:** Simple API wrapper for fetching agents and voices.

**For KING:** Use this pattern for listing available voices when configuring AI characters.

---

## Key Takeaways for KING

### 1. Database Patterns

✅ **Store ElevenLabs agent ID with character** (`roles.elevenlabs_agent_id`)
✅ **Conversation state management** (scheduled → in_progress → completed)
✅ **Attempt/retry mechanism** (useful for testing or user experience)
✅ **Test mode flag** (`is_test_conversation`)
✅ **Template-based prompts** (already have ai_prompts table)
✅ **Multi-arbiter evaluation** (optional, for quality assurance)

### 2. RLS Patterns

✅ **Progressive information reveal** (phase-based access control)
✅ **Config-driven visibility** (leaderboard, participants, results)
✅ **Facilitator override** (always include facilitator exception)

### 3. Service Layer Patterns

✅ **Explicit state management** (clear status field)
✅ **Resume in-progress sessions** (don't create duplicates)
✅ **Real-time subscriptions** (Supabase Realtime channels)
✅ **Version tracking** (AI context versions)
✅ **Error handling with context** (helpful error messages)

### 4. AI Integration Patterns

✅ **Character service** (manage AI character data)
✅ **Conversation service** (lifecycle + state)
✅ **ElevenLabs wrapper** (simple API client)
✅ **Template prompts** (centralized, versioned)

---

## Differences: EXMG vs. KING

| Aspect | EXMG | KING |
|--------|------|------|
| **AI Cognitive Model** | Simple (personality prompt) | Complex (4-block metacognition) |
| **Voice Integration** | ElevenLabs agents (direct) | ElevenLabs + FastAPI custom endpoint |
| **Conversation Type** | 1-on-1 (user-AI) | Group meetings (multi-participant) |
| **Memory** | Stateless (no memory between attempts) | Stateful (memory evolves over simulation) |
| **Scoring** | Multi-arbiter evaluation | Voting-based outcomes |
| **Attempt System** | 3 tries per challenge | 1 simulation run (no retries) |
| **Focus** | Practice & evaluation | Educational simulation & reflection |

---

## Implementation Priorities for KING

### High Priority (Apply Now)

1. **Add `elevenlabs_agent_id` to roles table**
   - Easy to configure voices per character
   - Consistent voice identity

2. **Add `status` field to meetings table**
   - Clear state management
   - Prevents ambiguity

3. **Add `transcript` field to meetings table**
   - Store conversation history
   - Essential for reflection

4. **Progressive information reveal RLS policies**
   - Hide vote results until phase complete
   - Phase-based access control

### Medium Priority (Consider Later)

5. **Test mode flag for simulations**
   - Useful for development
   - Separate test from production data

6. **Conversation versioning**
   - Already have AI context versioning
   - Could add meeting attempt numbers

7. **Real-time subscriptions for meetings**
   - Live updates during conversations
   - Better UX for participants

### Low Priority (Optional)

8. **Multi-arbiter evaluation**
   - Quality assurance for AI decisions
   - Resource-intensive (3x API calls)

9. **User feedback/ratings**
   - Post-simulation satisfaction survey
   - Nice-to-have for improvement

---

## Code Examples to Adapt

### 1. Add ElevenLabs Agent ID to Roles

```sql
-- Migration: Add ElevenLabs agent ID
ALTER TABLE roles ADD COLUMN elevenlabs_agent_id TEXT;

-- Update template roles with agent IDs
UPDATE simulation_templates
SET canonical_roles = jsonb_set(
    canonical_roles,
    '{elevenlabs_agent_id}',
    '"agent_abc123"'
)
WHERE template_id = '...';
```

### 2. Meeting State Management

```typescript
// src/services/meetingService.ts
export async function createMeeting(runId: string, participants: string[]) {
    const { data: meeting } = await supabase
        .from('meetings')
        .insert({
            run_id: runId,
            status: 'scheduled',
            created_at: new Date().toISOString()
        })
        .select()
        .single()

    await supabase
        .from('meeting_participants')
        .insert(
            participants.map(roleId => ({
                meeting_id: meeting.meeting_id,
                role_id: roleId
            }))
        )

    return meeting
}

export async function startMeeting(meetingId: string, conversationId: string) {
    return await supabase
        .from('meetings')
        .update({
            status: 'in_progress',
            elevenlabs_conversation_id: conversationId,
            started_at: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)
}

export async function completeMeeting(meetingId: string, transcript: string) {
    return await supabase
        .from('meetings')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            transcript
        })
        .eq('meeting_id', meetingId)
}
```

### 3. Progressive RLS Policy

```sql
-- Hide vote results until phase completes
CREATE POLICY "vote_results_progressive_reveal"
ON votes FOR SELECT
TO authenticated
USING (
    -- Facilitator always sees
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'facilitator'
    )
    OR
    -- Participants see after vote session completed
    EXISTS (
        SELECT 1 FROM vote_sessions vs
        WHERE vs.session_id = votes.session_id
        AND vs.status = 'completed'
    )
);
```

---

## Conclusion

EXMG provides **production-proven patterns** for:
- AI character management
- ElevenLabs integration
- Conversation state tracking
- Progressive information reveal
- Template-based prompts

These patterns are **directly applicable to KING** and can accelerate development, especially for voice integration and state management. 🎯
