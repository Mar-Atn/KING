# THERAPIST Voice Integration - Proven Patterns for KING
## Reference Guide for ElevenLabs Conversational AI Integration

**Source Project:** `/CODING/THERAPIST/server_v2.py`
**Proven In:** Production therapy application with voice conversations
**Adaptation Target:** KING AI Character voice system

---

## Executive Summary

THERAPIST successfully integrates ElevenLabs Conversational AI with a metacognitive architecture using a FastAPI server that provides an **OpenAI-compatible `/v1/chat/completions` endpoint**. This allows ElevenLabs to use any LLM backend (OpenAI, Claude, etc.) while maintaining the 3-component cognitive system.

**Key Innovation:** Voice is just a different interface - the same cognitive architecture (components/blocks) works for both text and voice conversations.

---

## Architecture Overview

```
User Voice ↔ ElevenLabs Agent (ASR/TTS)
                    ↓
         FastAPI /v1/chat/completions
         (OpenAI-compatible endpoint)
                    ↓
         3-Component System
         (Role + Memory + Plan)
                    ↓
              OpenAI GPT-4o
              (can be any LLM)
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

**Key Insight:** ElevenLabs doesn't care which LLM you use. The `/v1/chat/completions` endpoint is LLM-agnostic.

---

## FastAPI Server Setup

### Dependencies (from THERAPIST)
```python
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
openai==1.3.7
python-dotenv==1.0.0
```

### Server Initialization
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="KING Voice Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM client (can be OpenAI, Claude, etc.)
llm_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
# For Claude: from anthropic import Anthropic; llm_client = Anthropic(api_key=...)
```

**For KING:**
- Use Anthropic Claude instead of OpenAI
- Same FastAPI setup works identically
- CORS allows ElevenLabs to call from their servers

---

## Core Endpoint: `/v1/chat/completions`

### Purpose
OpenAI-compatible endpoint that ElevenLabs calls during voice conversations. This is the "bridge" between ElevenLabs and your custom LLM backend.

### Request Format (from ElevenLabs)
```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Hello therapist"},
    {"role": "assistant", "content": "Hi there..."}
  ],
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 300,
  "stream": false,
  "elevenlabs_extra_body": {
    "conversation_id": "conv_abc123",
    "patient_id": "patient_xyz"
  }
}
```

**Key Fields:**
- `messages`: Full conversation history (system + user + assistant messages)
- `elevenlabs_extra_body`: Custom metadata you can pass from ElevenLabs config
- `stream`: Whether to stream responses (for real-time TTS)

### THERAPIST Implementation
```python
@app.post("/v1/chat/completions")
async def elevenlabs_chat_completions(request: Request):
    """
    OpenAI-compatible endpoint for ElevenLabs Custom LLM integration.
    ElevenLabs sends messages here, we respond with cognitive system.
    """
    body = await request.json()

    # Extract parameters
    messages = body.get("messages", [])
    model = body.get("model", "gpt-4o")
    stream = body.get("stream", False)
    temperature = body.get("temperature", 0.7)
    max_tokens = body.get("max_tokens", 300)

    # Get conversation/patient ID from extra body
    extra_body = body.get("elevenlabs_extra_body", {})
    conversation_id = extra_body.get("conversation_id", "default-voice-patient")
    patient_id = extra_body.get("patient_id", "default-patient")

    print(f"[ELEVENLABS] Received message for conversation: {conversation_id}")

    # Get current cognitive state (3 components in THERAPIST)
    state = get_or_create_state(patient_id)

    # BUILD SYSTEM PROMPT FROM COGNITIVE COMPONENTS
    system_prompt = f"""{state.role_context}

---

PATIENT MEMORY:
{state.patient_memory if state.patient_memory else "[No information yet]"}

---

TREATMENT PLAN:
{state.treatment_plan if state.treatment_plan else "[No plan yet]"}

---

You are currently in a voice therapy session. Respond naturally and conversationally.
Keep responses brief (1-3 sentences) as this is real-time voice.
"""

    # Initialize conversation tracking if needed
    if conversation_id not in elevenlabs_conversations:
        elevenlabs_conversations[conversation_id] = {
            "patient_id": patient_id,
            "messages": [],
            "started_at": datetime.now().isoformat()
        }

    # Store messages for transcript
    conv_data = elevenlabs_conversations[conversation_id]

    # Extract user message (last one in messages array)
    if messages and messages[-1]["role"] == "user":
        user_message = messages[-1]["content"]
        conv_data["messages"].append({
            "role": "user",
            "content": user_message
        })
        print(f"[ELEVENLABS] User: {user_message[:50]}...")

    # Build messages for LLM (system + conversation history)
    llm_messages = [{"role": "system", "content": system_prompt}]
    llm_messages.extend(messages)

    try:
        # Call LLM (OpenAI in THERAPIST, could be Claude for KING)
        response = llm_client.chat.completions.create(
            model=model,
            messages=llm_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream
        )

        if stream:
            # Streaming response for real-time TTS
            async def generate():
                full_response = ""
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"

                yield "data: [DONE]\n\n"

                # Store assistant response in transcript
                if full_response:
                    conv_data["messages"].append({
                        "role": "assistant",
                        "content": full_response
                    })
                    print(f"[ELEVENLABS] Therapist: {full_response[:50]}...")

            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            # Non-streaming response
            assistant_message = response.choices[0].message.content

            # Store assistant response in transcript
            conv_data["messages"].append({
                "role": "assistant",
                "content": assistant_message
            })

            print(f"[ELEVENLABS] Therapist: {assistant_message[:50]}...")

            # Return OpenAI format
            return {
                "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
                "object": "chat.completion",
                "created": int(datetime.now().timestamp()),
                "model": model,
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": assistant_message
                    },
                    "finish_reason": "stop"
                }]
            }

    except Exception as e:
        print(f"[ERROR] ElevenLabs endpoint error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
```

### Key Patterns

1. **System Prompt Building:** Inject all cognitive components into system message
2. **Transcript Tracking:** Store every user/assistant message for reflection
3. **Streaming Support:** Real-time TTS for natural voice conversation
4. **OpenAI Format:** Return response in OpenAI's expected format
5. **Error Handling:** Catch LLM errors and return proper JSON responses

---

## Transcript Tracking for Reflection

### Why Track Transcripts?
- Voice conversations don't have built-in persistence
- Need full transcript for reflection phase (update memory/goals)
- ElevenLabs only provides real-time messages, not history

### THERAPIST Pattern
```python
# Global storage for active voice conversations
elevenlabs_conversations: dict = {}  # conversation_id -> {patient_id, messages}

# During voice conversation (in /v1/chat/completions)
if conversation_id not in elevenlabs_conversations:
    elevenlabs_conversations[conversation_id] = {
        "patient_id": patient_id,
        "messages": [],
        "started_at": datetime.now().isoformat()
    }

conv_data = elevenlabs_conversations[conversation_id]

# Store each message
if messages and messages[-1]["role"] == "user":
    user_message = messages[-1]["content"]
    conv_data["messages"].append({
        "role": "user",
        "content": user_message
    })

# After LLM responds
conv_data["messages"].append({
    "role": "assistant",
    "content": assistant_message
})
```

**Key Insight:** Build transcript incrementally during conversation, use it later for reflection.

---

## Reflection After Voice Conversation

### End Conversation Endpoint
```python
@app.post("/api/elevenlabs/end")
async def end_elevenlabs_conversation(request: Request):
    """
    End an ElevenLabs voice conversation and trigger reflection.
    Called from UI when user ends the voice call.
    """
    body = await request.json()
    conversation_id = body.get("conversation_id", "default-voice-patient")
    patient_id = body.get("patient_id", "default-patient")

    if conversation_id not in elevenlabs_conversations:
        return JSONResponse(
            status_code=404,
            content={"error": "Conversation not found"}
        )

    conv_data = elevenlabs_conversations[conversation_id]
    state = get_or_create_state(patient_id)

    # Build transcript from stored messages
    transcript = "\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in conv_data["messages"]
    ])

    print(f"[ELEVENLABS] Ending conversation {conversation_id}, starting reflection...")
    print(f"[ELEVENLABS] Transcript length: {len(conv_data['messages'])} messages")

    # Use the same reflection logic as text conversations
    reflection_prompt = f"""You just completed a therapy session. Analyze the conversation and update each component.

CURRENT STATE:
**Component 1: Role & Context**
{state.role_context}

**Component 2: Patient Memory**
{state.patient_memory}

**Component 3: Treatment Plan**
{state.treatment_plan}

---

**CONVERSATION TRANSCRIPT:**
{transcript}

---

**TASK:** Update each component based on this conversation.

[...same reflection prompt as text mode...]

Return JSON with updated components.
"""

    try:
        # Get reflection from LLM
        response = llm_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a therapist reflecting on a session. Return only valid JSON."},
                {"role": "user", "content": reflection_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        reflection_text = response.choices[0].message.content.strip()

        # Parse JSON response
        if reflection_text.startswith("```"):
            reflection_text = reflection_text.split("```")[1]
            if reflection_text.startswith("json"):
                reflection_text = reflection_text[4:]
            reflection_text = reflection_text.strip()

        updated_components = json.loads(reflection_text)

        # Store old state for comparison
        old_state = state_to_dict(state)

        # Create and save new state
        new_state = TherapistState(
            role_context=updated_components["role_context"],
            patient_memory=updated_components["patient_memory"],
            treatment_plan=updated_components["treatment_plan"],
            session_count=state.session_count + 1,
            last_updated=datetime.now().isoformat()
        )

        update_state(patient_id, new_state)

        # Clean up conversation
        del elevenlabs_conversations[conversation_id]

        print(f"[ELEVENLABS] Reflection completed and state updated")

        return {
            "status": "success",
            "before": old_state,
            "after": state_to_dict(new_state),
            "reflection_notes": updated_components.get("reflection_notes", ""),
            "transcript_length": len(conv_data["messages"])
        }

    except Exception as e:
        print(f"[ERROR] Reflection failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Reflection failed: {str(e)}"}
        )
```

**Key Pattern:** Same reflection workflow as text conversations, just different trigger point (explicit end call vs. conversation UI button).

---

## Agent Session Creation (Experimental Pattern)

### Purpose
Pre-load agent with context before conversation starts. Useful for passing patient-specific information or character details.

### THERAPIST Implementation
```python
@app.post("/api/voice/create-agent-session")
async def create_agent_session(request: Request):
    """
    Create ElevenLabs agent session with patient-specific context.
    Returns agentId + full prompt.
    """
    body = await request.json()
    patient_id = body.get("patient_id", "default-patient")

    print(f"[VOICE] Creating agent session for patient: {patient_id}")

    # Get current cognitive state
    state = get_or_create_state(patient_id)

    # Build comprehensive prompt with all 3 components
    full_prompt = f"""{state.role_context}

---

PATIENT MEMORY:
{state.patient_memory if state.patient_memory else "[No information yet]"}

---

TREATMENT PLAN:
{state.treatment_plan if state.treatment_plan else "[No plan yet]"}

---

You are in a voice therapy session. Respond naturally and conversationally.
Keep responses brief (1-3 sentences) as this is real-time voice."""

    # Get agent ID from environment
    agent_id = os.getenv('ELEVENLABS_AGENT_ID', 'agent_7801k88jk54peanvfzyc9tzv4mnc')

    print(f"[VOICE] Agent session created")
    print(f"[VOICE] Prompt length: {len(full_prompt)} characters")
    print(f"[VOICE] Component 1 (Role) length: {len(state.role_context)} chars")
    print(f"[VOICE] Component 2 (Memory) length: {len(state.patient_memory) if state.patient_memory else 0} chars")
    print(f"[VOICE] Component 3 (Plan) length: {len(state.treatment_plan) if state.treatment_plan else 0} chars")

    return {
        "success": True,
        "data": {
            "agentId": agent_id,
            "prompt": full_prompt,
            "patient_id": patient_id,
            "session_count": state.session_count
        }
    }
```

**For KING:** This pattern is useful for passing character context (identity, memory, goals) before starting a meeting or speech.

---

## ElevenLabs Configuration

### 1. Create Agent in ElevenLabs Dashboard
1. Go to https://elevenlabs.io/app/conversational-ai
2. Create new agent
3. Configure:
   - **Voice:** Select appropriate voice for character
   - **First Message:** Optional greeting
   - **System Prompt:** Can be minimal (will be overridden by custom LLM)
   - **LLM:** Select "Custom LLM"

### 2. Configure Custom LLM Endpoint
**In ElevenLabs agent settings:**
```
Custom LLM Endpoint: https://your-server.com/v1/chat/completions
Model: gpt-4o (or any model name)
Temperature: 0.7
Max Tokens: 300
```

**Optional: Extra Body (for passing custom data)**
```json
{
  "elevenlabs_extra_body": {
    "conversation_id": "{{conversation_id}}",
    "patient_id": "patient_abc123"
  }
}
```

### 3. Get Agent ID
**From ElevenLabs dashboard:**
- Copy agent ID (e.g., `agent_7801k88jk54peanvfzyc9tzv4mnc`)
- Store in `.env` file:
```bash
ELEVENLABS_AGENT_ID=agent_7801k88jk54peanvfzyc9tzv4mnc
```

---

## Voice Workflow (Full Cycle)

### Phase 1: Start Voice Conversation
```
1. User clicks "Start Voice Conversation" in UI
2. Frontend calls /api/voice/create-agent-session
3. Server loads AI context (4 blocks for KING)
4. Server returns agentId + full system prompt
5. Frontend initializes ElevenLabs SDK with agentId
6. ElevenLabs connects user microphone
7. Voice conversation begins
```

### Phase 2: During Conversation
```
1. User speaks → ElevenLabs ASR converts to text
2. ElevenLabs calls /v1/chat/completions with message
3. Server:
   - Receives message
   - Loads AI context (4 blocks)
   - Builds system prompt with all blocks
   - Stores message in transcript
   - Calls Claude (MAIN PERSONA)
   - Gets response
   - Stores response in transcript
   - Returns response to ElevenLabs
4. ElevenLabs TTS converts response to voice
5. User hears AI character speak
6. Conversation continues...
```

### Phase 3: End Conversation
```
1. User clicks "End Conversation" in UI
2. Frontend calls /api/elevenlabs/end with conversation_id
3. Server:
   - Retrieves full transcript from memory
   - Loads current AI context (4 blocks)
   - Calls Claude for reflection
   - Claude analyzes transcript
   - Claude updates Block 3 (Memory) and Block 4 (Goals)
   - Server saves updated blocks to database
   - Server displays before/after (optional for facilitator)
   - Server cleans up conversation from memory
4. Next conversation uses updated context
```

**Key Insight:** Voice is just I/O. The cognitive system (blocks) is the same.

---

## KING Adaptation: Intent Notes Pattern

### Concept (from THERAPIST docs)
> "The MAIN PERSONA LLM provides **intent notes** to the voice agent. These are short behavioral instructions that guide the conversational AI without being explicitly said."

### Example Intent Notes
```
Intent Note from MAIN PERSONA:
"This is just to explore what their interests are. Try not to disclose
more about us. Be curious but guarded."

Result:
Voice agent asks probing questions but avoids revealing clan plans.
```

### Implementation for KING

**1. Generate Intent Notes Before Meeting**
```typescript
// POST /api/ai/meeting/prepare
async function prepareMeeting(roleId: string, participants: string[]) {
    // Load 4-block context
    const context = await loadAIContext(roleId)

    // Ask MAIN PERSONA to generate intent notes
    const intentPrompt = `
You are ${context.identity.name}, about to meet with ${participants.join(', ')}.

Based on your current goals and memory:
- What do you want to achieve in this meeting?
- What information do you want to gather?
- What should you avoid revealing?
- What tone should you take (friendly, cautious, aggressive)?

Return 2-3 sentences of intent notes to guide your voice avatar.
`

    const response = await claudeAPI.generate(intentPrompt, context)

    return {
        intent_notes: response,
        meeting_id: meetingId
    }
}
```

**2. Inject Intent Notes into Voice System Prompt**
```python
# In /v1/chat/completions endpoint
system_prompt = f"""{fixed_context}

---

IDENTITY:
{identity_context}

---

MEMORY:
{memory_context}

---

GOALS & PLANS:
{goals_context}

---

INTENT NOTES FOR THIS MEETING:
{intent_notes}

You are in a voice meeting. Follow the intent notes while responding naturally.
Keep responses brief (1-3 sentences) as this is real-time voice conversation.
"""
```

**3. Flow Diagram**
```
User clicks "Join Meeting"
        ↓
Frontend calls /api/ai/meeting/prepare
        ↓
MAIN PERSONA generates intent notes
        ↓
Frontend receives intent notes + agentId
        ↓
Frontend calls ElevenLabs with intent notes in system prompt
        ↓
Voice conversation uses intent notes as guidance
        ↓
After meeting ends → Reflection updates memory & goals
```

---

## Adapting to Claude (vs. OpenAI)

### THERAPIST Uses OpenAI
```python
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    temperature=0.7,
    max_tokens=300
)

assistant_message = response.choices[0].message.content
```

### KING Should Use Claude
```python
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=300,
    temperature=0.7,
    system=system_prompt,  # Claude has separate system parameter
    messages=[  # Claude expects user/assistant only (no system in messages)
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": "..."}
    ]
)

assistant_message = response.content[0].text
```

### Key Differences
1. **System Prompt:** Claude has separate `system` parameter (not in messages array)
2. **Response Format:** Claude returns `content[0].text` instead of `choices[0].message.content`
3. **Streaming:** Claude uses different streaming format (event types: `message_start`, `content_block_delta`, `message_stop`)

### Adapter Function for KING
```python
def call_llm_for_voice(system_prompt: str, messages: list, streaming: bool = False):
    """
    Universal LLM caller that works with both OpenAI and Claude.
    Returns OpenAI-compatible format for ElevenLabs.
    """
    # Use Claude
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=300,
        temperature=0.7,
        system=system_prompt,
        messages=[msg for msg in messages if msg["role"] != "system"],
        stream=streaming
    )

    if streaming:
        # Convert Claude streaming to OpenAI format
        async def generate():
            full_response = ""
            async for event in response:
                if event.type == "content_block_delta":
                    content = event.delta.text
                    full_response += content
                    # Return OpenAI format for ElevenLabs
                    yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"

            yield "data: [DONE]\n\n"
            return full_response

        return generate()
    else:
        # Non-streaming: Convert Claude format to OpenAI format
        assistant_message = response.content[0].text

        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
            "object": "chat.completion",
            "created": int(datetime.now().timestamp()),
            "model": "claude-3-5-sonnet-20241022",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": assistant_message
                },
                "finish_reason": "stop"
            }]
        }
```

---

## Deployment Considerations

### 1. Hosting Options
**THERAPIST runs on local machine.** For KING production:

**Option A: Railway** (Recommended)
```bash
# Create railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port $PORT"

# Deploy
railway up
```
- Cost: ~$5-15/month
- Auto-scaling
- HTTPS included
- Easy deployment

**Option B: Render**
```yaml
# render.yaml
services:
  - type: web
    name: king-voice-server
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn server:app --host 0.0.0.0 --port $PORT"
```
- Cost: Free tier available, $7/month for production
- HTTPS included

**Option C: AWS Lambda + API Gateway**
- More complex setup
- Pay-per-request pricing
- Good for low-volume usage

### 2. Environment Variables
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_AGENT_ID=agent_abc123...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### 3. CORS Configuration
```python
# Allow ElevenLabs servers + your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-king-frontend.com",
        "https://api.elevenlabs.io",
        "https://elevenlabs.io"
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

---

## Testing Voice Integration

### 1. Test /v1/chat/completions Endpoint
```bash
# Test with curl
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, I want to talk about voting strategy"}
    ],
    "model": "claude-3-5-sonnet",
    "temperature": 0.7,
    "max_tokens": 300,
    "stream": false,
    "elevenlabs_extra_body": {
      "conversation_id": "test_conv",
      "role_id": "role_abc123"
    }
  }'
```

**Expected Response:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "claude-3-5-sonnet",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Ah, voting strategy... well, I've been thinking about who really deserves our support..."
    },
    "finish_reason": "stop"
  }]
}
```

### 2. Test Agent Session Creation
```bash
curl -X POST http://localhost:8000/api/voice/create-agent-session \
  -H "Content-Type: application/json" \
  -d '{"role_id": "role_abc123"}'
```

### 3. Test Reflection Endpoint
```bash
curl -X POST http://localhost:8000/api/elevenlabs/end \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test_conv",
    "role_id": "role_abc123"
  }'
```

**Expected:** Before/after state showing updated memory and goals.

---

## Performance Considerations

### 1. Response Time Budget
```
Target: < 1 second total latency for voice responses

Breakdown:
- ElevenLabs → Your server: ~50-100ms
- Load AI context from DB: ~50-100ms
- Claude API call: ~500-1000ms (main bottleneck)
- Return response: ~50-100ms
Total: ~650-1300ms
```

**Optimization:**
- Use Claude Haiku for simple responses (3x faster)
- Use Claude Sonnet for complex strategic thinking
- Cache frequently accessed context in memory

### 2. Transcript Storage
```python
# Don't store transcripts in database during conversation
# Use in-memory dict for active conversations
elevenlabs_conversations: dict = {}  # conversation_id -> {messages}

# Only save to database after reflection completes
# Store final compressed summary, not full transcript
```

**Why:** Reduces database writes, faster performance during voice conversation.

### 3. Concurrent Conversations
```python
# Use conversation_id to track multiple simultaneous meetings
# Each AI character can be in one meeting at a time
# But multiple meetings can happen simultaneously

elevenlabs_conversations = {
    "meeting_abc_role_1": {...},  # Alexandros in Meeting 1
    "meeting_abc_role_2": {...},  # Thalia in Meeting 1
    "meeting_xyz_role_3": {...},  # Marcus in Meeting 2
}
```

---

## Error Handling Patterns

### 1. LLM API Failures
```python
try:
    response = claude_client.messages.create(...)
except anthropic.APIError as e:
    # API error (rate limit, timeout, etc.)
    return JSONResponse(
        status_code=503,
        content={
            "error": "AI service temporarily unavailable",
            "detail": str(e)
        }
    )
except Exception as e:
    # Unknown error
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
```

### 2. Missing Context
```python
# Handle case where AI context not found
context = await get_ai_context(role_id)
if not context:
    # Create default context or return error
    return JSONResponse(
        status_code=404,
        content={"error": "AI character not initialized"}
    )
```

### 3. Transcript Cleanup
```python
# Clean up old conversations (prevent memory leak)
@app.on_event("startup")
async def startup_cleanup():
    # Run every hour
    asyncio.create_task(cleanup_old_conversations())

async def cleanup_old_conversations():
    while True:
        current_time = datetime.now()
        for conv_id, conv_data in list(elevenlabs_conversations.items()):
            started_at = datetime.fromisoformat(conv_data["started_at"])
            if (current_time - started_at).total_seconds() > 3600:  # 1 hour
                del elevenlabs_conversations[conv_id]
                print(f"[CLEANUP] Removed stale conversation: {conv_id}")
        await asyncio.sleep(3600)  # Check every hour
```

---

## Key Takeaways for KING Development

### 1. Voice is Just Another Interface
**Pattern:** Same cognitive system (4 blocks), different I/O
**Why:** Simplifies architecture, one brain powers both text and voice
**How:** FastAPI `/v1/chat/completions` + ElevenLabs

### 2. Transcript Tracking is Essential
**Pattern:** Store every message in memory during conversation
**Why:** Need full context for reflection after voice ends
**How:** Global dict `elevenlabs_conversations[conversation_id]`

### 3. Intent Notes Guide Behavior
**Pattern:** MAIN PERSONA generates behavioral instructions for voice agent
**Why:** Keeps voice avatar aligned with character's strategic goals
**How:** Inject intent notes into system prompt before meeting

### 4. Reflection After Voice = Reflection After Text
**Pattern:** Same reflection workflow, just different trigger
**Why:** Voice and text conversations update memory/goals identically
**How:** Call same reflection endpoint with voice transcript

### 5. OpenAI-Compatible Format is Universal
**Pattern:** Return responses in OpenAI's format, even if using Claude
**Why:** ElevenLabs expects OpenAI format, doesn't care about backend LLM
**How:** Adapter function converts Claude → OpenAI format

### 6. System Prompt = Cognitive Context
**Pattern:** Build system prompt by concatenating all 4 blocks
**Why:** Voice agent needs full context to respond in character
**How:** `system_prompt = block1 + block2 + block3 + block4 + intent_notes`

### 7. Streaming for Real-Time Feel
**Pattern:** Stream responses token-by-token for TTS
**Why:** User hears AI start speaking immediately (< 1s latency)
**How:** Use streaming API, yield chunks in OpenAI format

---

## Next Steps

1. **Set up FastAPI server** with `/v1/chat/completions` endpoint
2. **Create ElevenLabs agents** for each AI character (different voices)
3. **Implement intent notes generation** (MAIN PERSONA → Voice agent)
4. **Test with one character** in a meeting scenario
5. **Scale to multiple characters** with concurrent conversation support
6. **Add to production** (Railway/Render deployment)

---

**This is proven in production.** THERAPIST users have real voice therapy sessions using this exact architecture. We're adapting, not inventing. 🎯
