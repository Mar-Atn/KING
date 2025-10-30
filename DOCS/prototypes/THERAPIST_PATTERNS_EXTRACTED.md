# Key Patterns Extracted from THERAPIST Project

**Source:** `/Users/maratatnashev/Desktop/CODING/THERAPIST`
**Date Extracted:** October 30, 2025
**Purpose:** Apply proven patterns to AI Character Prototype

---

## 1. MULTI-COMPONENT STATE ARCHITECTURE

### THERAPIST Pattern (3 Components)

```python
@dataclass
class TherapistState:
    # Component 1: Role & Context (mostly static)
    role_context: str

    # Component 2: Patient Memory (dynamic, bounded ~3-4 pages)
    patient_memory: str

    # Component 3: Treatment Plan (dynamic, strategic)
    treatment_plan: str

    # Metadata
    session_count: int
    last_updated: Optional[str]
```

### Applied to AI Character (4 Blocks)

```typescript
interface AIContext {
  // Block 1: Fixed Context (never changes)
  block_1_fixed: {
    simulation_rules: string;
    available_actions: string;
    behavioral_framework: string;
  };

  // Block 2: Identity (mostly stable)
  block_2_identity: object;

  // Block 3: Memory (dynamic, bounded ≤2500 words)
  block_3_memory: object;

  // Block 4: Goals (dynamic, strategic)
  block_4_goals: object;

  // Metadata
  version: number;
  updated_trigger: string;
  created_at: string;
}
```

**✅ Lesson Learned:** Store all components as separate fields in a single dataclass/interface for clean access and updates.

---

## 2. MEMORY COMPRESSION STRATEGY

### THERAPIST Reflection Prompt

```markdown
**2. PATIENT MEMORY** (Max 3-4 pages)
- Add new important facts
- Update recurring themes
- Remove or merge less relevant details
- Keep concise but therapeutically complete
```

**Key Insight:** Trust the AI to decide what's important, just give it:
1. Size constraint (3-4 pages / 2500 words)
2. Purpose (what needs to be remembered)
3. Trust statement ("you decide")

### Applied to AI Character

```markdown
## Memory Reflection (PROMPT 2.2)

Your Current Memory (1,850 / 2,500 words):
{{current_block_3_json}}

New Conversation:
{{conversation_transcript}}

Your Task:
Compress this into your memory. Memory limit: 2,500 words.

You understand what matters for winning in this simulation. You decide:
- What's strategically important to remember?
- What can you discard?
- How should you compress if needed?

Return updated Block 3 JSON. ≤ 2,500 words.

Trust your strategic judgment.
```

**✅ Lesson Learned:** Non-prescriptive prompts work. The AI understands context and makes intelligent compression decisions.

---

## 3. REFLECTION SYSTEM

### THERAPIST Pattern: Single Reflection Call

**Approach:** One AI call updates all components at once

```python
reflection_prompt = f"""
CURRENT STATE:
Component 1: {state.role_context}
Component 2: {state.patient_memory}
Component 3: {state.treatment_plan}

CONVERSATION TRANSCRIPT:
{transcript}

TASK: Update each component.

RESPONSE FORMAT (JSON):
{{
  "role_context": "complete text...",
  "patient_memory": "updated memory as single string...",
  "treatment_plan": "updated plan as single string...",
  "reflection_notes": "what changed and why..."
}}
"""

response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are reflecting. Return only JSON."},
        {"role": "user", "content": reflection_prompt}
    ],
    temperature=0.7,
    max_tokens=2000
)

updated = json.loads(response.choices[0].message.content)
```

**Pros:**
- Single API call (cheaper, faster)
- AI sees full context when updating
- Consistent updates across components

**Cons:**
- Can't parallelize
- If one component update fails, all fail

### AI Character Pattern: 3 Parallel Calls

**Approach:** Three separate AI calls (one per block)

**Pros:**
- Parallelizable (faster)
- Can use different prompts/temperatures per block
- If one fails, others still succeed

**Cons:**
- 3 API calls (more expensive)
- Each update doesn't see what others changed

### 🤔 Decision Point

**For AI Character Prototype, we chose:** 3 parallel calls

**Rationale:**
1. Speed matters more than cost in prototype
2. Blocks are independent enough (Identity rarely changes, Memory/Goals update separately)
3. Better fault tolerance
4. Can optimize prompts per block

**Future Optimization:** If cost becomes issue, could switch to single-call pattern like THERAPIST.

---

## 4. VOICE INTEGRATION WITH ELEVENLABS

### THERAPIST Pattern: OpenAI-Compatible Endpoint

**Architecture:**
```
User Voice → ElevenLabs ASR (speech-to-text)
       ↓
FastAPI /v1/chat/completions (OpenAI-compatible)
       ↓
Build system prompt from all 3 components
       ↓
Call OpenAI GPT-4o
       ↓
Stream response back to ElevenLabs
       ↓
ElevenLabs TTS (text-to-speech) → User Voice
```

**Implementation:**

```python
@app.post("/v1/chat/completions")
async def elevenlabs_chat_completions(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    conversation_id = body.get("conversation_id", "default")

    # Get current state (all 3 components)
    state = get_or_create_state(patient_id)

    # Build system prompt combining all components
    system_prompt = f"""{state.role_context}

    ---

    PATIENT MEMORY:
    {state.patient_memory if state.patient_memory else "[No information yet]"}

    ---

    TREATMENT PLAN:
    {state.treatment_plan if state.treatment_plan else "[No plan yet]"}

    ---

    You are in a voice session. Respond naturally and conversationally.
    Keep responses brief (1-3 sentences) as this is real-time voice.
    """

    # Track transcript for later reflection
    if conversation_id not in active_conversations:
        active_conversations[conversation_id] = {
            "patient_id": patient_id,
            "messages": [],
            "started_at": datetime.now().isoformat()
        }

    # Store user message
    if messages and messages[-1]["role"] == "user":
        active_conversations[conversation_id]["messages"].append({
            "role": "user",
            "content": messages[-1]["content"]
        })

    # Build messages for OpenAI
    openai_messages = [{"role": "system", "content": system_prompt}]
    openai_messages.extend(messages)

    # Call OpenAI
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=openai_messages,
        temperature=0.7,
        max_tokens=300,
        stream=True  # Stream for low latency
    )

    # Stream back to ElevenLabs
    async def generate():
        full_response = ""
        for chunk in response:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                # OpenAI SSE format
                yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"

        yield "data: [DONE]\n\n"

        # Store assistant response for reflection
        active_conversations[conversation_id]["messages"].append({
            "role": "assistant",
            "content": full_response
        })

    return StreamingResponse(generate(), media_type="text/event-stream")
```

**Key Lessons:**

1. **System Prompt = All Components Combined**
   - Build one prompt string with all context blocks
   - Add voice-specific instructions at the end

2. **Track Transcript During Conversation**
   - Store every user/assistant message
   - Used for reflection when conversation ends

3. **Streaming is Critical for Voice**
   - Don't wait for full response
   - Stream word-by-word for natural feel

4. **Voice-Specific Constraints**
   - Keep responses to 1-3 sentences
   - `max_tokens=300` prevents long monologues

### Applied to AI Character

**Our architecture will use OpenAI Realtime API instead:**

```typescript
// Option 1: Native OpenAI Realtime Audio
await client.updateSession({
  model: 'gpt-4o-realtime-preview-2024-10-01',
  modalities: ['text', 'audio'],
  instructions: buildSystemPrompt(blocks),  // All 4 blocks
  voice: 'alloy',
  turn_detection: { type: 'server_vad' }
});

// Option 2: ElevenLabs + Intent Notes (like THERAPIST)
// - Generate intent notes from MAIN PERSONA
// - Pass to ElevenLabs as system prompt
// - Track transcript for reflection
```

**✅ Lesson Learned:** Either approach works. OpenAI Realtime is simpler, ElevenLabs gives more voice control.

---

## 5. CONVERSATION END → REFLECTION TRIGGER

### THERAPIST Pattern

```python
@app.post("/api/elevenlabs/end")
async def end_elevenlabs_conversation(request: Request):
    conversation_id = request.conversation_id

    # Get stored transcript
    conv_data = elevenlabs_conversations[conversation_id]
    transcript = "\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in conv_data["messages"]
    ])

    # Trigger reflection (update all 3 components)
    reflection_result = await reflect_and_update(patient_id, transcript)

    # Clean up conversation
    del elevenlabs_conversations[conversation_id]

    return {
        "before": old_state,
        "after": new_state,
        "reflection_notes": reflection_result.notes
    }
```

**Flow:**
1. Conversation ends (user clicks "End" or hangs up)
2. Server retrieves full transcript
3. Reflection prompt sent to OpenAI
4. All components updated
5. New version saved to state
6. Conversation data cleaned up

### Applied to AI Character

```typescript
async endConversation() {
  // Close OpenAI session
  this.client.disconnect();

  // Update database with final transcript
  await supabase
    .from('conversations')
    .update({ ended_at: new Date(), transcript: this.transcript })
    .eq('conversation_id', this.conversationId);

  // Trigger reflection (3 parallel calls)
  const [block2, block3, block4] = await Promise.all([
    updateIdentity(this.transcript),
    compressMemory(this.transcript),
    updateGoals(this.transcript)
  ]);

  // Save new version
  const newVersion = await saveAIContext({
    block_2_identity: block2,
    block_3_memory: block3,
    block_4_goals: block4,
    version: currentVersion + 1
  });

  return { newVersion };
}
```

**✅ Lesson Learned:** Always trigger reflection immediately after conversation ends, while transcript is fresh.

---

## 6. STATE VERSIONING & COMPARISON

### THERAPIST Pattern

```python
# Before reflection
old_state = state_to_dict(state)

# Do reflection...
new_state = TherapistState(
    role_context=updated["role_context"],
    patient_memory=updated["patient_memory"],
    treatment_plan=updated["treatment_plan"],
    session_count=state.session_count + 1
)

# Return both for admin visibility
return {
    "before": old_state,
    "after": state_to_dict(new_state),
    "reflection_notes": updated["reflection_notes"]
}
```

**Why This Matters:**
- Admin can see exactly what changed
- Debugging is easier
- Can revert if needed
- Transparency into AI's thinking

### Applied to AI Character

```typescript
// Already have versioning in ai_context table
CREATE TABLE ai_context (
  context_id UUID PRIMARY KEY,
  role_id UUID NOT NULL,
  version INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,

  block_1_fixed JSONB,
  block_2_identity JSONB,
  block_3_memory JSONB,
  block_4_goals JSONB,

  updated_trigger TEXT,
  updated_reason TEXT,
  created_at TIMESTAMPTZ,

  UNIQUE(role_id, version)
);

// Save with reason
async function saveNewVersion(updates) {
  await supabase.from('ai_context').update({ is_current: false })
    .eq('role_id', roleId).eq('is_current', true);

  await supabase.from('ai_context').insert({
    role_id: roleId,
    version: currentVersion + 1,
    is_current: true,
    ...updates,
    updated_trigger: 'conversation_end',
    updated_reason: `Reflection after 8-minute conversation`
  });
}
```

**✅ Lesson Learned:** Version everything. It's debugging gold.

---

## 7. JSON RESPONSE PARSING

### THERAPIST Pattern: Handle Markdown Code Blocks

```python
reflection_text = response.choices[0].message.content.strip()

# AI often wraps JSON in markdown code blocks
if reflection_text.startswith("```"):
    reflection_text = reflection_text.split("```")[1]
    if reflection_text.startswith("json"):
        reflection_text = reflection_text[4:]
    reflection_text = reflection_text.strip()

updated = json.loads(reflection_text)
```

**Why This Matters:**
- GPT-4o often returns: ` ```json\n{...}\n``` `
- Need to strip markdown before parsing
- Prevents JSON parse errors

### Applied to AI Character

```typescript
function parseAIResponse(rawText: string): object {
  let cleaned = rawText.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    const parts = cleaned.split('```');
    cleaned = parts[1] || parts[0];
    if (cleaned.startsWith('json')) {
      cleaned = cleaned.substring(4);
    }
    cleaned = cleaned.trim();
  }

  return JSON.parse(cleaned);
}
```

**✅ Lesson Learned:** Always sanitize AI responses before parsing JSON.

---

## 8. SIMPLE IN-MEMORY STATE (MVP Pattern)

### THERAPIST Pattern

```python
# Store states in memory (production: use database)
therapist_states: Dict[str, TherapistState] = {}

def get_or_create_state(patient_id: str) -> TherapistState:
    if patient_id not in therapist_states:
        therapist_states[patient_id] = TherapistState(
            role_context=INITIAL_ROLE_CONTEXT,
            patient_memory="",
            treatment_plan=""
        )
    return therapist_states[patient_id]
```

**Why This Works for Prototypes:**
- Fast development
- No database setup needed
- Easy to debug
- Enough for single-user testing

**When to Upgrade:**
- Multiple users
- Server restarts (lose state)
- Need persistence
- Production deployment

### Applied to AI Character

**We're using database from start because:**
1. Already have Supabase set up
2. Need versioning (requires persistence)
3. Admin interface needs to show history
4. Multiple sim_runs will be tested

**But we could start with in-memory for faster iteration:**

```typescript
// Quick MVP version
const characterStates = new Map<string, AIContext>();

function getOrCreateContext(roleId: string): AIContext {
  if (!characterStates.has(roleId)) {
    const newContext = initializeCharacter(roleId);
    characterStates.set(roleId, newContext);
  }
  return characterStates.get(roleId)!;
}
```

**✅ Lesson Learned:** In-memory state is fine for prototyping. Add persistence when you need it.

---

## 9. VOICE PROMPT: BREVITY INSTRUCTIONS

### THERAPIST Pattern

**System Prompt for Voice:**
```
You are currently in a voice therapy session.

Respond naturally and conversationally based on your role,
what you know about the patient, and your treatment plan.

**Keep responses brief (1-3 sentences) as this is a real-time voice conversation.**
```

**Also enforced with:**
```python
response = openai_client.chat.completions.create(
    model="gpt-4o",
    max_tokens=300  # Prevents long responses
)
```

### Applied to AI Character

```markdown
## Voice Agent System Prompt (PROMPT 4.1)

You are speaking via voice. Be concise (1-2 sentences per response).

Your goal: {{intent_notes.goal}}
Your tone: {{intent_notes.tone}}

Stay in character. Speak naturally.
```

**And in code:**
```typescript
await client.updateSession({
  model: 'gpt-4o-realtime',
  max_response_output_tokens: 500,  // Limit verbosity
  // ...
});
```

**✅ Lesson Learned:** Voice needs explicit brevity constraints. Text can be longer, voice must be punchy.

---

## 10. LOGGING & DEBUGGING

### THERAPIST Pattern

```python
print(f"[STATE] Created new therapist state for patient: {patient_id}")
print(f"[CONVERSATION] Started: {conversation_id}")
print(f"[MESSAGE] User: {user_message[:50]}...")
print(f"[RESPONSE] Therapist: {assistant_message[:50]}...")
print(f"[REFLECTION] Starting reflection for: {conversation_id}")
print(f"[VOICE] Agent session created, prompt length: {len(full_prompt)}")
```

**Benefits:**
- Easy to follow conversation flow
- Debug issues quickly
- See what's happening in real-time
- Production: replace with proper logging

### Applied to AI Character

```typescript
console.log('[INIT] Character initialized:', { roleId, version });
console.log('[CONV] Message sent:', { preview: text.substring(0, 50) });
console.log('[REFLECT] Triggered by:', trigger);
console.log('[MEMORY] Before:', { size: oldMemory.length });
console.log('[MEMORY] After:', { size: newMemory.length, compressed: true });
```

**Plus Admin UI Logging:**
- Every AI call visible
- Full context shown
- Timestamps, tokens, cost tracked

**✅ Lesson Learned:** Generous logging makes debugging 10x faster.

---

## SUMMARY: THERAPIST → AI CHARACTER MAPPING

| THERAPIST Component | AI Character Equivalent | Notes |
|---------------------|------------------------|-------|
| Component 1: Role & Context | Block 1: Fixed Context | Both are mostly static |
| Component 2: Patient Memory | Block 3: Memory | Both bounded and compressed |
| Component 3: Treatment Plan | Block 4: Goals & Strategy | Both dynamic and strategic |
| (none) | Block 2: Identity | New - tracks personality changes |
| Single reflection call | 3 parallel calls | We chose parallelism for speed |
| FastAPI + ElevenLabs | OpenAI Realtime API | We chose native integration |
| 3-4 pages limit | 2500 words limit | Similar constraint |
| In-memory state | Database (Supabase) | We need persistence from start |
| Reflection at conversation end | Reflection at conversation end | Same trigger point |

---

## PATTERNS TO APPLY IMMEDIATELY

### ✅ Use These Patterns

1. **System Prompt Builder**: Concatenate all blocks into single prompt
2. **Reflection Format**: Return JSON with all components as strings
3. **Markdown Sanitization**: Strip code blocks before JSON parsing
4. **Transcript Tracking**: Store all messages during conversation
5. **Brevity for Voice**: "1-3 sentences" instruction + token limit
6. **Version Comparison**: Return before/after state for transparency
7. **Generous Logging**: Log every major operation with context

### 🤔 Adapt These Patterns

1. **Single vs Parallel Reflection**: We use 3 parallel calls (different from THERAPIST's 1 call)
2. **Voice Architecture**: We use OpenAI Realtime (different from THERAPIST's FastAPI)
3. **Persistence**: We use database (different from THERAPIST's in-memory)

### ❌ Skip These Patterns

1. **Manual Session Management**: OpenAI Realtime handles this
2. **Streaming SSE**: OpenAI Realtime has built-in streaming

---

## NEXT STEPS

1. ✅ Patterns extracted and documented
2. ⏳ Update AI Character spec with these patterns
3. ⏳ Build reflection prompts using THERAPIST format
4. ⏳ Implement system prompt builder
5. ⏳ Set up npm workspace and begin implementation

---

**END OF PATTERN EXTRACTION**
