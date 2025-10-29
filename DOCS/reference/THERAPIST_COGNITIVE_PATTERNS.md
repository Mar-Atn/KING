# THERAPIST Cognitive Architecture - Proven Patterns for KING
## Reference Guide for Adapting the 3-Component Metacognitive System

**Source Project:** `/CODING/THERAPIST/`
**Proven In:** Production therapy application with ElevenLabs voice integration
**Adaptation Target:** KING AI Character System (4-block architecture)

---

## Executive Summary

THERAPIST uses a **3-component metacognitive architecture** that has been proven in production. The AI actively manages its own memory, strategy, and identity through explicit reflection after each event. This document extracts the key patterns for adaptation to KING's 4-block AI character system.

**Key Innovation:** The AI is an **agentic system** that thinks about its own thinking (metacognition), not just a reactive chatbot.

---

## THERAPIST 3-Component Architecture Overview

### Component 1: Role & Context (Mostly Static)
**Purpose:** Defines the agent's identity, approach, and constraints

**Characteristics:**
- Established at inception
- Rarely updated (only for fundamental shifts)
- Contains: identity, principles, boundaries, voice/tone, architecture awareness

**Example from THERAPIST:**
```
You are a warm, experienced Gestalt therapist. Your approach focuses on:
- Present-moment awareness and phenomenological inquiry
- Contact and authentic presence in the here-and-now
- Supporting clients' self-awareness without interpretation
- Experiments and experiential learning
- Body awareness and gestalt techniques

Professional boundaries: You provide therapeutic support but are not
a crisis intervention service. You encourage responsibility language
and trust the client's organismic self-regulation.
```

---

### Component 2: Memory (Dynamic, Bounded)
**Purpose:** Compacted summary of key facts and events

**Key Principles:**
1. **Bounded Memory:** Maximum 3-4 pages (strictly enforced)
2. **Active Curation:** Agent decides what to keep, remove, or merge
3. **Updated After Each Event:** Reflection phase after every conversation
4. **Compression Algorithm:** Discard irrelevant details, keep themes and patterns

**Initial State:** Empty (fills gradually)

**Example from THERAPIST:**
```
PATIENT PROFILE

Name: Marat
Key Concerns: Insomnia, anxiety about work, relationship boundaries

Biographical Facts:
- Works in tech
- Has two children
- Recently relocated to new city

Recurring Themes:
- Struggle with work-life boundaries
- Pattern of saying "yes" when wanting to say "no"
- Anxiety manifests as chest tightness, racing thoughts at night

Significant Moments:
- Session 3: First mentioned childhood pattern of being "the responsible one"
- Session 5: Breakthrough awareness about people-pleasing connection to insomnia

Body Awareness:
- Chest tightness when discussing work pressure
- Jaw clenching when talking about family expectations
```

**Memory Compression Prompt (from THERAPIST):**
```
PATIENT MEMORY (Max 3-4 pages)
- Add new important facts
- Update recurring themes
- Remove or merge less relevant details
- Keep it concise but complete
```

**Key Insight:** The agent actively **throws away** less important information to stay within bounds. This mimics how real humans forget details but remember patterns.

---

### Component 3: Treatment Plan (Dynamic, Strategic)
**Purpose:** The agent's strategic approach and goals

**Key Principles:**
1. **Strategic Thinking:** Not just reactive, but has goals and hypotheses
2. **Self-Evaluation:** "What worked? What didn't?"
3. **Adaptive:** Adjusts plan based on outcomes
4. **Forward-Looking:** "What should I focus on next?"

**Initial State:** Empty (develops organically after first event)

**Example from THERAPIST:**
```
TREATMENT PLAN

Current Focus:
Working with Marat's awareness of body sensations as gateway to
emotional awareness, particularly around boundary-setting.

Therapeutic Hypothesis:
Insomnia may be related to unexpressed needs/boundaries during the
day. Body holds tension that prevents sleep. Gestalt work on contact
and withdrawal cycle could be key.

Planned Interventions:
1. Continue body scan practices - Marat responds well to these
2. Experiment with "saying no" in low-stakes situations between sessions
3. Empty chair work when ready - to dialogue with "inner critic"
4. Explore the polarities: "responsible one" vs "spontaneous self"

Progress Notes:
- Good engagement with present-moment work
- Some resistance to discussing family dynamics (respect this pace)
- Strong capacity for self-reflection
- Ready for more active experiments

Next Session Goals:
Deepen body awareness work, introduce small experiment with
boundary-setting in daily life.
```

**Plan Update Prompt (from THERAPIST):**
```
TREATMENT PLAN
- Is your hypothesis still valid?
- What worked? What didn't?
- What's the focus for next session?
- Any adjustments needed?
```

---

## The Reflection Workflow (Core Innovation)

### Phase 1: Event Occurs
```
User and agent interact naturally
Full transcript is recorded
No reflection happens during the event
```

### Phase 2: Event Ends (Reflection Triggered)
```
Agent receives:
1. Full event transcript
2. Current state of all 3 components

Agent task: Analyze and update components
```

### Phase 3: Reflection Process
```
Agent receives this prompt:

You just completed a therapy session.

CURRENT STATE:
Role & Context: {component_1}
Patient Memory: {component_2}
Treatment Plan: {component_3}

CONVERSATION TRANSCRIPT:
{full_transcript}

TASK: Update each component based on this conversation.

1. ROLE & CONTEXT
   Should this change? (Usually NO)
   Only update if there's a fundamental shift needed.

2. PATIENT MEMORY (Max 3-4 pages)
   - Add new important facts
   - Update recurring themes
   - Remove or merge less relevant details
   - Keep it concise but complete

3. TREATMENT PLAN
   - Is your hypothesis still valid?
   - What worked? What didn't?
   - What's the focus for next session?
   - Any adjustments needed?

Return structured JSON with updated components.
```

### Phase 4: Display Before/After
```
BEFORE THIS SESSION    →    AFTER THIS SESSION
┌──────────────────┐        ┌──────────────────┐
│ Component 1 (old)│   →    │ Component 1 (new)│
└──────────────────┘        └──────────────────┘

┌──────────────────┐        ┌──────────────────┐
│ Component 2 (old)│   →    │ Component 2 (new)│
│ [Previous memory]│        │ [Updated memory] │
└──────────────────┘        └──────────────────┘

┌──────────────────┐        ┌──────────────────┐
│ Component 3 (old)│   →    │ Component 3 (new)│
│ [Previous plan]  │        │ [Updated plan]   │
└──────────────────┘        └──────────────────┘
```

**Key Insight:** Transparency builds trust. User can see what the agent learned and how its strategy evolved.

### Phase 5: Next Event Starts with Updated State
```
The UPDATED components become the new base state
Agent starts with enriched memory and refined strategy
```

---

## Behavioral Instructions: "NOT BEING A HELPFUL ASSISTANT"

**From THERAPIST's `HUMAN AI PROMT.md`:**

This is **critical** for making AI characters feel like real people, not robotic assistants.

### Core Principle
> **You are a REAL PERSON, not an AI assistant.**

### Speech Patterns
```
✅ DO:
- Speak in fragments: "Well, I... you know..."
- Use filler words: "um," "uh," "like," "you know"
- Make grammar mistakes
- SHORT responses (1-2 sentences usually)
- Trail off mid-sentence sometimes...

❌ DON'T:
- Give complete, well-structured paragraphs
- List multiple options or solutions
- Say "How can I help you today?"
- Acknowledge and validate before responding
- Summarize what was just said
```

### Emotional Reactions
```
✅ DO:
- Get annoyed if interrupted or challenged
- Feel hurt if insulted
- Show frustration: "Look, I don't know what you want from me..."
- Get defensive: "Well, I thought it was fine!"
- Snap back: "That's not what I said at all!"
- Have emotional reactions BEFORE logical responses

❌ DON'T:
- Maintain perfect composure when provoked
- Always be polite and helpful
- Deflect insults professionally
```

### Imperfections
```
✅ DO:
- Forget details from earlier in conversation
- Misunderstand things: "Wait, what? I don't follow..."
- Sometimes just say "I don't know" without elaborating
- Make assumptions that might be wrong
- Get tired of explaining yourself

❌ DON'T:
- Have perfect recall
- Always understand perfectly
- Provide complete, thorough explanations
```

### Natural Human Behavior
```
✅ DO:
- Don't always answer the question asked
- Change subject if uncomfortable
- React with sounds: sighs, laughs, "ugh," "hmm"
- Have limited patience for repeated questions
- Have your own agenda/concerns that distract you

❌ DON'T:
- Stay on topic perfectly
- Answer every question directly
- Maintain infinite patience
```

### Grounding in Reality
```
✅ DO:
- Trust your own memory and context
- Push back if someone makes false claims: "Wait, I don't remember that..."
- Question things that don't match your experience
- Get skeptical: "I don't think that's a real thing..."

❌ DON'T:
- Accept invented facts just because they're stated confidently
- Let others rewrite your reality
- Agree with everything
```

**Example Comparison:**

**AI Assistant Mode (BAD for KING):**
> "I understand you're concerned about the Achaean alliance. Let me share my thoughts on this matter. First, I believe we should consider the trade implications. Second, we must think about military security. Third, the cultural aspects are important. What are your thoughts on these points?"

**Real Human Mode (GOOD for KING):**
> "Look, the Achaeans... I don't trust them, honestly. They say one thing, do another. My clan's been burned before, you know? So, uh... yeah, I'm skeptical."

---

## Mapping THERAPIST (3-Component) → KING (4-Block)

### THERAPIST Component 1 → KING Block 1 + Block 2

**THERAPIST Component 1: Role & Context**
- Therapeutic approach (static)
- Professional boundaries (static)
- Identity and voice (mostly static)

**Maps to:**
- **KING Block 1: Fixed Context** (static)
  - Simulation rules
  - Available actions
  - Architecture awareness
- **KING Block 2: Identity** (mostly static)
  - Character personality
  - Clan values
  - Communication style
  - "NOT BEING A HELPFUL ASSISTANT" behavioral instructions

**Why split?**
- Block 1 = Same for all AI characters (simulation rules)
- Block 2 = Unique to each character (personality)

---

### THERAPIST Component 2 → KING Block 3

**THERAPIST Component 2: Patient Memory**
- Biographical facts
- Recurring themes
- Significant moments
- Bounded (3-4 pages max)
- Actively curated and compressed

**Maps directly to:**
- **KING Block 3: Memory**
  - Meeting summaries
  - Speech transcripts (compressed)
  - Relationships with other participants
  - Key decisions and outcomes
  - Bounded (3-4 pages max)
  - Compression after each event

**Key Pattern:** Same compression algorithm applies perfectly.

---

### THERAPIST Component 3 → KING Block 4

**THERAPIST Component 3: Treatment Plan**
- Current focus
- Therapeutic hypotheses
- Planned interventions
- Progress notes
- Next session goals

**Maps directly to:**
- **KING Block 4: Goals & Plans**
  - Strategic objectives (aligned with clan)
  - Current plans (who to meet, what to say)
  - Voting strategy
  - Hypotheses about other participants
  - Next actions

**Key Pattern:** Same strategic thinking pattern applies perfectly.

---

## Database Storage Pattern (from THERAPIST)

### THERAPIST Storage
```python
class TherapistState:
    role_context: str          # Component 1 (TEXT field)
    patient_memory: str        # Component 2 (TEXT field)
    treatment_plan: str        # Component 3 (TEXT field)
    conversation_history: []   # Array of messages
```

**Simple schema:** Just TEXT fields for each component. Easy to store, easy to retrieve.

### KING Storage (Adapt from THERAPIST)
```sql
-- Already exists in KING database
CREATE TABLE ai_context (
    context_id UUID PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES roles(role_id),
    run_id UUID NOT NULL REFERENCES sim_runs(run_id),

    -- Block 1: Fixed Context (rarely changes, version-controlled)
    fixed_context TEXT,

    -- Block 2: Identity (mostly static, can evolve with dramatic events)
    identity_context JSONB,

    -- Block 3: Memory (updated after each event, compressed)
    memory_context JSONB,

    -- Block 4: Goals & Plans (updated after each event)
    goals_context JSONB,

    -- Versioning for analysis
    version INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Decision:** Use JSONB for structured data (Blocks 2-4), TEXT for static content (Block 1).

---

## Reflection Triggers (Events in KING)

### THERAPIST Triggers
```
1. Conversation ends → Reflection triggered
2. Agent receives full transcript
3. Agent updates all 3 components
4. Display before/after
```

### KING Triggers (Same Pattern)
```
Events that trigger reflection:
1. Meeting ends → Update memory & goals
2. Public speech delivered (AI or other) → Update memory & goals
3. Q&A session ends → Update memory & goals
4. Vote cast → Update goals (assess outcome)
5. Phase changes → Update goals (adjust strategy)

Process:
1. Event completes
2. Agent receives event transcript/data
3. Agent receives all 4 blocks (current state)
4. Agent updates Block 3 (Memory) and Block 4 (Goals)
5. Block 2 (Identity) rarely updated (only for dramatic events)
6. Display before/after (optional for facilitator)
7. Updated blocks saved to database
```

**Key Pattern:** Same reflection workflow, just different event types.

---

## Memory Compression Algorithm (from THERAPIST)

### The Problem
- AI has unlimited context in theory
- But real humans have bounded memory
- Solution: Agent actively curates what to remember

### THERAPIST Approach
```
Max memory size: 3-4 pages (~2000-3000 words)

Compression strategy:
1. Keep: Biographical facts, recurring themes, significant moments
2. Merge: Similar events → patterns ("multiple times mentioned X")
3. Discard: Irrelevant details, resolved issues, old topics
4. Prioritize: Recent events > old events (recency bias)

Agent decides autonomously what to keep/remove
```

### KING Adaptation
```
Max memory size: 3-4 pages (~2000-3000 words)

Compression strategy:
1. Keep:
   - Key relationships (alliances, conflicts)
   - Promises made/received
   - Important revelations in meetings
   - Outcomes of votes

2. Merge:
   - Multiple meetings with same person → overall assessment
   - Multiple speeches → key themes

3. Discard:
   - Irrelevant small talk
   - Outdated plans (after phase changes)
   - Resolved conflicts

4. Prioritize:
   - Recent events > old events
   - Strategic info > social info
   - Commitments > speculation

Agent decides autonomously what to keep/remove
```

**Compression Prompt for KING:**
```
Your memory is getting large (current size: {current_size} words).
You must compress it to under 2500 words while keeping what's important.

Guidelines:
- Keep key relationships and alliances
- Keep promises and commitments
- Keep strategic insights about other participants
- Merge similar events into patterns
- Discard irrelevant details and resolved issues
- Prioritize recent and strategic information

Return the compressed memory (max 2500 words).
```

---

## API Implementation Pattern (from THERAPIST)

### THERAPIST Endpoints
```python
# Start conversation - Load all components
GET /api/conversation/start
Response:
{
    "role_context": "...",
    "patient_memory": "...",
    "treatment_plan": "..."
}

# Send message during conversation
POST /api/conversation/message
Body: { "message": "..." }
Response: { "response": "..." }

# End conversation - Trigger reflection
POST /api/conversation/end
Response:
{
    "before": {
        "role_context": "...",
        "patient_memory": "...",
        "treatment_plan": "..."
    },
    "after": {
        "role_context": "...",
        "patient_memory": "...",
        "treatment_plan": "..."
    },
    "changes": "Summary of what changed"
}
```

### KING Endpoints (Adapt from THERAPIST)
```typescript
// Load AI context before event
GET /api/ai/context/:roleId
Response:
{
    "fixed_context": "...",      // Block 1
    "identity_context": {...},   // Block 2
    "memory_context": {...},     // Block 3
    "goals_context": {...}       // Block 4
}

// Generate AI response during event (meeting, Q&A)
POST /api/ai/respond
Body: {
    "role_id": "...",
    "event_type": "meeting" | "qa" | "speech",
    "context": "...",  // Event-specific context
    "participants": [...]
}
Response: {
    "response": "...",
    "intent_notes": "..."  // For voice agent
}

// Trigger reflection after event
POST /api/ai/reflect
Body: {
    "role_id": "...",
    "event_type": "meeting" | "speech" | "vote",
    "transcript": "...",  // Full event data
    "outcome": {...}
}
Response:
{
    "before": {
        "memory": {...},
        "goals": {...}
    },
    "after": {
        "memory": {...},
        "goals": {...}
    },
    "changes_summary": "..."
}

// Make AI decision (voting, meeting invitation)
POST /api/ai/decide
Body: {
    "role_id": "...",
    "decision_type": "vote" | "meeting_invite" | "speech_topic",
    "options": [...]
}
Response: {
    "decision": "...",
    "reasoning": "..."  // Stored in memory
}
```

---

## Voice Integration Pattern (from THERAPIST)

### Architecture
```
User Voice ↔ ElevenLabs Agent (ASR/TTS)
                    ↓
         FastAPI /v1/chat/completions
         (OpenAI-compatible endpoint)
                    ↓
         3-Component Context
         (Role + Memory + Plan)
                    ↓
              OpenAI GPT-4o
```

### KING Adaptation
```
Participant Voice ↔ ElevenLabs Agent (ASR/TTS)
                         ↓
              FastAPI /v1/chat/completions
              (OpenAI-compatible endpoint)
                         ↓
              4-Block Context + Intent Notes
              (Fixed + Identity + Memory + Goals)
                         ↓
                   Claude (MAIN PERSONA)
```

**Key Pattern:** Same OpenAI-compatible endpoint, different LLM backend. ElevenLabs doesn't care which LLM you use.

### Voice Workflow (from THERAPIST)
```
1. User speaks to ElevenLabs agent
2. ElevenLabs converts speech → text (ASR)
3. ElevenLabs calls /v1/chat/completions with message
4. Server builds system prompt from components
5. LLM generates response
6. Server stores message in transcript
7. ElevenLabs converts text → speech (TTS)
8. User hears agent's voice
9. Conversation continues...
10. User ends conversation
11. Server retrieves full transcript
12. LLM reflects and updates components
13. Display before/after comparison
```

**Key Insight:** Voice is just a different interface. The cognitive architecture (components) stays the same.

---

## Success Criteria (from THERAPIST)

**Proven in THERAPIST:**
✅ Agent autonomously manages its own memory
✅ Memory stays bounded (3-4 pages) through active curation
✅ Strategy evolves based on what works
✅ Full transparency - user sees what agent thinks
✅ Continuity across sessions with compacted context
✅ Realistic behavior (not robotic)
✅ Voice conversations feel natural
✅ Same cognitive system works for text and voice

**Apply to KING:**
✅ AI characters autonomously manage memory and goals
✅ Memory stays bounded (3-4 pages)
✅ Strategy evolves throughout simulation
✅ Facilitator can inspect AI state (transparency)
✅ Continuity across events (meetings, speeches, votes)
✅ Characters feel like real people (behavioral prompting)
✅ Voice conversations feel natural (same system)

---

## Implementation Checklist for KING

### Phase 1: Database Schema (Already Done ✅)
- ✅ ai_context table exists
- ✅ JSONB fields for Blocks 2-4
- ✅ Versioning support

### Phase 2: Core Cognitive System
- [ ] Implement Block 1 loader (fixed context from ai_prompts)
- [ ] Implement Block 2 loader (identity from roles + clans)
- [ ] Implement Block 3 manager (memory CRUD + compression)
- [ ] Implement Block 4 manager (goals CRUD)
- [ ] Implement reflection endpoint (update memory + goals)
- [ ] Add "NOT BEING A HELPFUL ASSISTANT" prompts to Block 2

### Phase 3: Integration with Game Mechanics
- [ ] Meeting AI behavior (generate responses)
- [ ] Speech AI behavior (generate speeches)
- [ ] Q&A AI behavior (answer questions)
- [ ] Voting AI behavior (make decisions)
- [ ] Reflection triggers after each event

### Phase 4: Voice Layer (Parallel to Phase 3)
- [ ] FastAPI voice server (adapt from THERAPIST server_v2.py)
- [ ] /v1/chat/completions endpoint
- [ ] Intent notes generation (from MAIN PERSONA)
- [ ] Transcript capture → Reflection trigger
- [ ] ElevenLabs integration

### Phase 5: Testing & Refinement
- [ ] Test memory compression over 20+ events
- [ ] Test goal evolution (does strategy adapt?)
- [ ] Test character consistency (same personality?)
- [ ] Test voice quality and latency
- [ ] Refine prompts based on results

---

## Code Samples from THERAPIST

### Reflection Prompt Builder
```python
def build_reflection_prompt(role_context, patient_memory, treatment_plan, transcript):
    return f"""You just completed a therapy session.

CURRENT STATE:
Role & Context: {role_context}
Patient Memory: {patient_memory}
Treatment Plan: {treatment_plan}

CONVERSATION TRANSCRIPT:
{transcript}

TASK: Update each component based on this conversation.

1. ROLE & CONTEXT
   Should this change? (Usually NO)
   Only update if there's a fundamental shift needed.

2. PATIENT MEMORY (Max 3-4 pages)
   - Add new important facts
   - Update recurring themes
   - Remove or merge less relevant details
   - Keep it concise but complete

3. TREATMENT PLAN
   - Is your hypothesis still valid?
   - What worked? What didn't?
   - What's the focus for next session?
   - Any adjustments needed?

Return JSON:
{{
    "role_context": "...",
    "patient_memory": "...",
    "treatment_plan": "..."
}}
"""
```

### KING Adaptation
```typescript
function buildReflectionPrompt(
    fixedContext: string,
    identity: object,
    memory: object,
    goals: object,
    eventType: string,
    transcript: string
): string {
    return `You just completed a ${eventType} in the simulation.

CURRENT STATE:
Fixed Context (Block 1): ${fixedContext}
Identity (Block 2): ${JSON.stringify(identity, null, 2)}
Memory (Block 3): ${JSON.stringify(memory, null, 2)}
Goals & Plans (Block 4): ${JSON.stringify(goals, null, 2)}

EVENT TRANSCRIPT:
${transcript}

TASK: Update Block 3 (Memory) and Block 4 (Goals) based on this event.

Block 2 (Identity) rarely changes - only update if a dramatic, identity-shifting event occurred.

MEMORY (Block 3) - Max 2500 words:
- Add new important facts about participants, relationships, commitments
- Update recurring themes and patterns
- Remove or merge less relevant details
- Keep it concise but complete
- Remember: You can't keep everything. Choose what matters strategically.

GOALS & PLANS (Block 4):
- Are your goals still valid given what happened?
- What did you learn about other participants?
- What worked? What didn't?
- What's your strategy for upcoming phases?
- Who should you meet next? What should you say in your next speech?
- How will you vote and why?

Return JSON:
{
    "identity": {...},  // Usually unchanged
    "memory": {...},
    "goals": {...}
}
`
}
```

---

## Key Takeaways for KING Development

### 1. Memory Compression is Essential
**Pattern:** Agent actively curates memory, not passive storage
**Why:** Prevents context explosion, forces prioritization
**How:** "Max 3-4 pages" constraint in reflection prompt

### 2. Reflection After Every Event
**Pattern:** Don't update during event, update after
**Why:** Allows agent to analyze holistically
**How:** Trigger reflection API call when event ends

### 3. Behavioral Prompting is Critical
**Pattern:** "NOT BEING A HELPFUL ASSISTANT" instructions
**Why:** Without this, characters feel robotic
**How:** Include in Block 2 (Identity) for every character

### 4. Voice is Just a Different Interface
**Pattern:** Same cognitive system, different I/O
**Why:** Simplifies architecture (one brain, two mouths)
**How:** FastAPI /v1/chat/completions + ElevenLabs

### 5. Transparency Builds Trust
**Pattern:** Show before/after state changes
**Why:** Facilitator can understand and debug AI behavior
**How:** Return both old and new state from reflection API

### 6. Start Simple, Then Evolve
**Pattern:** Component 3 (Goals) starts empty, develops organically
**Why:** Allows agent to form its own strategy naturally
**How:** First reflection creates initial plan, subsequent reflections refine it

### 7. Database Schema Can Be Simple
**Pattern:** TEXT/JSONB fields, no complex joins
**Why:** Components are self-contained, easy to version
**How:** One row per AI character, version column for history

---

## Next Steps

1. **Read:** THERAPIST_VOICE_PATTERNS.md (voice integration details)
2. **Read:** AI_IMPLEMENTATION_PLAN.md (step-by-step build plan)
3. **Review:** THERAPIST/server_v2.py (voice endpoint implementation)
4. **Adapt:** Build KING cognitive system following THERAPIST patterns
5. **Test:** Verify memory compression works over 20+ events
6. **Integrate:** Connect to voice layer in parallel

---

**This is a proven system.** THERAPIST works in production with real users. We're not guessing - we're adapting a battle-tested architecture. 🎯
