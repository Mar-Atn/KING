# AI CHARACTER PROTOTYPE - Technical Specification
**The New King SIM - Cognitive Sandbox for AI Participant Validation**

**Version:** 1.0
**Date:** October 30, 2025
**Status:** Implementation Ready

---

## EXECUTIVE SUMMARY

### Purpose

Build a **focused testing environment** for the AI Character cognitive system before game integration.

**Goals:**
- ✅ Validate 4-block metacognitive architecture
- ✅ Test memory compression (bounded ~2500 words)
- ✅ Refine prompts through rapid iteration
- ✅ Integrate voice (ElevenLabs) + text (OpenAI Realtime API)
- ✅ Measure character consistency
- ✅ Full admin transparency (see every AI call, every prompt)

### Key Philosophy: Less Prescription, More Intelligence

**We trust the AI's strategic thinking.** Instead of prescriptive instructions ("remember these 5 things, discard these 4"), we:
- Explain the architecture (4 blocks, memory limit, reflection loop)
- Define success criteria (win the simulation)
- Let the AI decide what's strategically important

See [AI_PROMPT_CATALOG.md](./AI_PROMPT_CATALOG.md) for complete prompt details.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Admin Setup Flow](#2-admin-setup-flow)
3. [4-Block Cognitive System](#3-4-block-cognitive-system)
4. [Conversation Modes](#4-conversation-modes)
5. [Reflection Engine](#5-reflection-engine)
6. [Admin Interface](#6-admin-interface)
7. [Database Schema](#7-database-schema)
8. [Implementation Timeline](#8-implementation-timeline)

---

## 1. ARCHITECTURE OVERVIEW

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Setup        │  │ Conversation │  │ Cognitive    │     │
│  │ (Sim/Role/   │  │ (Text/Voice/ │  │ State Viewer │     │
│  │  Voice)      │  │  Combined)   │  │ (4 Blocks)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│             COGNITIVE ENGINE (TypeScript)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 4-Block System:                                        │ │
│  │  Block 1: Fixed Context (simulation rules, actions)    │ │
│  │  Block 2: Identity (personality, clan, mood)           │ │
│  │  Block 3: Memory (bounded, compressed)                 │ │
│  │  Block 4: Goals (strategy, next actions)               │ │
│  │                                                        │ │
│  │ Reflection Engine: Update Blocks 2-4 after events     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          ↕                                  ↕
┌──────────────────────┐      ┌──────────────────────────────┐
│  OpenAI GPT-4o       │      │  ElevenLabs Voice            │
│  (Text + Voice via   │      │  (TTS/ASR)                   │
│   Realtime API)      │      │  Connected to OpenAI         │
└──────────────────────┘      └──────────────────────────────┘
          ↕
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                        │
│  - ai_context (4 blocks + versioning)                       │
│  - ai_prompts (prompt templates + versioning)               │
│  - roles (character data from sim_runs)                     │
│  - conversations (prototype logging)                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:** React 19 + TypeScript + Tailwind CSS
**Cognitive Engine:** TypeScript (npm workspace package)
**AI Provider:** OpenAI GPT-4o (Realtime API for both text & voice)
**Voice:** ElevenLabs (ASR/TTS) connected to OpenAI
**Database:** Supabase PostgreSQL

---

## 2. ADMIN SETUP FLOW

### Admin Must Select 3 Things Before Starting

```
┌─────────────────────────────────────────────────────────────┐
│ PROTOTYPE SETUP                                              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Step 1: Select Simulation Run                           │ │
│ │                                                         │ │
│ │ Available sim_runs (with AI participants):              │ │
│ │ ○ "Test Simulation #1" (15 participants, 8 AI)         │ │
│ │ ● "Kourion Democracy Test" (12 participants, 6 AI) ✓   │ │
│ │ ○ "Full Scale Test" (20 participants, 10 AI)           │ │
│ │                                                         │ │
│ │ [Load Selected Sim]                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Step 2: Select AI Role                                  │ │
│ │                                                         │ │
│ │ AI Roles in "Kourion Democracy Test":                  │ │
│ │ (Filter: participant_type = 'ai')                      │ │
│ │                                                         │ │
│ │ ○ Philosophos Sokrates (Philosophers clan)             │ │
│ │ ● General Leonidas (Military clan) ✓                   │ │
│ │ ○ Banker Theodora (Bankers clan)                       │ │
│ │ ○ Merchant Marcus (Merchants clan)                     │ │
│ │ ○ Priest Hierophanes (Priests clan)                    │ │
│ │ ○ Artificer Metrodoros (Artificers clan)               │ │
│ │                                                         │ │
│ │ Character Preview:                                      │ │
│ │ Name: General Leonidas Stratiotou                      │ │
│ │ Age: 48                                                 │ │
│ │ Clan: Military (Priorities: Strength, Defense, Honor)  │ │
│ │ Traits: Strategic, Disciplined, Honor-bound, Pragmatic │ │
│ │ Background: Veteran commander, values military power   │ │
│ │                                                         │ │
│ │ [Load This Role]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Step 3: Select Voice Agent (for voice mode)            │ │
│ │                                                         │ │
│ │ Fetch from ElevenLabs API:                             │ │
│ │ GET https://api.elevenlabs.io/v1/convai/agents        │ │
│ │                                                         │ │
│ │ Available Voice Agents:                                │ │
│ │ ○ "Deep Male Voice" (agent_7801k88j...)                │ │
│ │   🔊 [Preview] Recommended for: Military, Priests     │ │
│ │                                                         │ │
│ │ ● "Commanding Leader" (agent_2601k8a...) ✓             │ │
│ │   🔊 [Preview] Recommended for: Military, Merchants    │ │
│ │                                                         │ │
│ │ ○ "Wise Elder" (agent_5402b9c...)                      │ │
│ │   🔊 [Preview] Recommended for: Philosophers, Priests  │ │
│ │                                                         │ │
│ │ ○ "Young Diplomat" (agent_7893d1e...)                  │ │
│ │   🔊 [Preview] Recommended for: Bankers, Merchants     │ │
│ │                                                         │ │
│ │ [Assign to Character]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Configuration Summary:                                      │
│ • Sim Run: "Kourion Democracy Test"                        │
│ • Character: General Leonidas (Military clan)              │
│ • Voice: "Commanding Leader" (agent_2601k8a...)            │
│                                                             │
│ [Start Prototype] [Save Configuration] [Reset]             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// Admin Setup Component
interface PrototypeSetup {
  simRunId: string | null;
  roleId: string | null;
  voiceAgentId: string | null;
}

async function loadSimRuns(): Promise<SimRun[]> {
  // Query sim_runs with AI participants
  const { data } = await supabase
    .from('sim_runs')
    .select('*, roles(*)')
    .filter('roles.participant_type', 'eq', 'ai');

  return data;
}

async function loadAIRolesForSim(simRunId: string): Promise<Role[]> {
  // Get all AI roles for selected sim
  const { data } = await supabase
    .from('roles')
    .select('*, clans(*)')
    .eq('run_id', simRunId)
    .eq('participant_type', 'ai');

  return data;
}

async function fetchElevenLabsAgents(): Promise<VoiceAgent[]> {
  // Fetch from ElevenLabs API
  const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY
    }
  });

  return response.json();
}

async function saveConfiguration(config: PrototypeSetup) {
  // Update roles.ai_config with selected voice agent
  await supabase
    .from('roles')
    .update({
      ai_config: {
        elevenlabs_agent_id: config.voiceAgentId,
        llm_model: 'gpt-4o'
      }
    })
    .eq('role_id', config.roleId);
}
```

---

## 3. 4-BLOCK COGNITIVE SYSTEM

### Block Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Block 1: FIXED CONTEXT (Never Changes)                      │
│ ─────────────────────────────────────────────────────────── │
│ • Simulation world & rules                                  │
│ • Available actions                                         │
│ • Behavioral framework ("NOT helpful assistant")            │
│ • Cognitive architecture explanation                        │
│                                                             │
│ Source: ai_prompts table (3 separate prompts combined)     │
│ Size: ~3000 words                                           │
│ Admin Control: View, Edit, Version                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Block 2: IDENTITY (Mostly Stable)                           │
│ ─────────────────────────────────────────────────────────── │
│ • Name, age, clan, position                                 │
│ • Personality traits (core, strengths, flaws)               │
│ • Clan alignment & loyalty level                            │
│ • Emotional state (current mood, concerns, hopes)           │
│ • Voice characteristics                                     │
│                                                             │
│ Source: roles + clans tables (loaded on init)              │
│ Updates: Only after significant emotional events            │
│ Frequency: ~Every 5-10 conversations                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Block 3: MEMORY (Dynamic, Bounded)                          │
│ ─────────────────────────────────────────────────────────── │
│ • Recent conversations (compressed)                         │
│ • Relationships (trust levels, notes)                       │
│ • Strategic insights                                        │
│ • Promises made/received                                    │
│ • Conflicts                                                 │
│                                                             │
│ Source: Generated during reflection                         │
│ Constraint: ≤ 2500 words (~5 pages)                         │
│ Updates: After EVERY conversation/event                     │
│ Compression: AI decides what's strategically important      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Block 4: GOALS & STRATEGY (Dynamic)                         │
│ ─────────────────────────────────────────────────────────── │
│ • Primary goal (objective, motivation, progress)            │
│ • Secondary goals                                           │
│ • Current strategy (approach, tactics, risks)               │
│ • Next actions (prioritized)                                │
│ • Contingency plans                                         │
│ • Learning from interactions                                │
│                                                             │
│ Source: Generated on init, updated during reflection        │
│ Updates: After EVERY conversation/event                     │
│ Adaptation: AI decides how to adjust strategy               │
└─────────────────────────────────────────────────────────────┘
```

### Non-Prescriptive Prompt Philosophy

**Old Approach (Over-Specified):**
```markdown
❌ "Keep these 5 types of information:
   1. Strategic alliances
   2. Betrayals
   3. Promises
   4. Voting intentions
   5. Power dynamics

   Discard these 4 types:
   1. Conversational filler
   2. Obvious facts
   3. Redundant details
   4. Superseded information

   Use this compression algorithm:
   - Sort by importance
   - Keep top 20 entries
   - Maximum 2500 words
   ..."
```

**New Approach (Trust AI Intelligence):**
```markdown
✅ "Compress this into your memory. Memory limit: 2500 words.

   You understand what matters for winning in this simulation.
   You decide:
   - What's strategically important to remember?
   - What can you discard?
   - How should you compress if needed?

   Return updated Block 3 JSON. Final size ≤ 2500 words.

   Trust your strategic judgment."
```

**Why This Works Better:**
- AI has strategic intelligence - we don't need to micromanage
- Different characters will remember different things (personality-driven)
- Emergent behavior is more interesting than prescribed behavior
- Simpler prompts = less prompt engineering overhead

See [AI_PROMPT_CATALOG.md](./AI_PROMPT_CATALOG.md) for all 10 prompt templates with this philosophy.

---

## 4. CONVERSATION MODES

### 4.1 OpenAI Realtime API Foundation

**Technology:** OpenAI Realtime API (persistent WebSocket connection)

**Why Realtime API:**
- Maintains conversation context automatically across entire session
- Lower latency than individual REST API calls (~50-200ms vs 1-3s)
- Single persistent connection for entire conversation
- Supports both text and voice in same protocol
- Streaming responses (word-by-word, not sentence-by-sentence)
- Built-in turn detection for voice conversations
- Session state managed server-side

**Model Configuration:**

```typescript
interface RealtimeSessionConfig {
  model: 'gpt-4o-realtime-preview-2024-10-01';
  modalities: ['text'] | ['audio'] | ['text', 'audio'];
  instructions: string;  // System prompt with all 4 blocks

  // Voice settings
  voice?: 'alloy' | 'echo' | 'shimmer';
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';

  // Turn detection (for voice)
  turn_detection?: {
    type: 'server_vad';  // Voice Activity Detection
    threshold: 0.5;      // 0.0-1.0, silence threshold
    prefix_padding_ms: 300;
    silence_duration_ms: 500;
  };

  // Model parameters
  temperature: 0.8;
  max_response_output_tokens: 4096;
}
```

### 4.2 Text Conversation

**Full Implementation:**

```typescript
import { RealtimeClient } from '@openai/realtime-api-beta';

class CharacterConversation {
  private client: RealtimeClient;
  private conversationId: string;
  private transcript: Array<{speaker: string, text: string, timestamp: string}> = [];

  async initialize(characterId: string) {
    // Load character's cognitive blocks
    const blocks = await loadAIContext(characterId);

    // Build system prompt from all 4 blocks
    const systemPrompt = buildSystemPrompt({
      block1: blocks.block_1_fixed,
      block2: blocks.block_2_identity,
      block3: blocks.block_3_memory,
      block4: blocks.block_4_goals
    });

    // Initialize OpenAI Realtime client
    this.client = new RealtimeClient({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowAPIKeyInBrowser: false  // Backend only
    });

    // Connect WebSocket
    await this.client.connect();

    // Configure session
    await this.client.updateSession({
      model: 'gpt-4o-realtime-preview-2024-10-01',
      modalities: ['text'],
      instructions: systemPrompt,
      temperature: 0.8,
      max_response_output_tokens: 500,
      voice: 'alloy'  // Ready for voice upgrade
    });

    // Create conversation record
    this.conversationId = await this.createConversationRecord(characterId, 'text');

    // Set up event listeners
    this.setupEventListeners();

    console.log('✅ Text conversation initialized');
  }

  private setupEventListeners() {
    // Response started
    this.client.on('conversation.item.created', (event) => {
      if (event.item.role === 'assistant') {
        this.onResponseStart(event);
      }
    });

    // Text streaming (word by word)
    this.client.on('response.text.delta', (event) => {
      this.onTextDelta(event.delta);
    });

    // Response completed
    this.client.on('response.done', (event) => {
      this.onResponseComplete(event);
    });

    // Error handling
    this.client.on('error', (event) => {
      console.error('OpenAI Realtime error:', event.error);
      this.handleError(event.error);
    });

    // Connection status
    this.client.on('disconnected', () => {
      console.warn('⚠️ WebSocket disconnected. Attempting reconnection...');
      this.reconnect();
    });
  }

  async sendMessage(text: string) {
    const timestamp = new Date().toISOString();

    // Add to transcript
    this.transcript.push({
      speaker: 'Admin',
      text,
      timestamp
    });

    // Send to OpenAI
    await this.client.sendUserMessageContent([
      { type: 'input_text', text }
    ]);

    // Log to database
    await this.updateTranscript(this.conversationId, this.transcript);
  }

  private onTextDelta(delta: string) {
    // Stream to UI in real-time
    this.emitToUI('text_delta', { delta });
  }

  private onResponseComplete(event: any) {
    const fullText = event.response.output[0].content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    // Add to transcript
    this.transcript.push({
      speaker: 'Character',
      text: fullText,
      timestamp: new Date().toISOString()
    });

    // Update database
    this.updateTranscript(this.conversationId, this.transcript);

    // Track metrics
    this.logMetrics({
      tokens: event.response.usage,
      latency: event.response.latency_ms,
      cost: this.calculateCost(event.response.usage)
    });
  }

  async endConversation() {
    // Close WebSocket
    this.client.disconnect();

    // Update conversation record
    await supabase
      .from('conversations')
      .update({
        ended_at: new Date().toISOString(),
        transcript: this.transcript
      })
      .eq('conversation_id', this.conversationId);

    console.log('🏁 Conversation ended. Triggering reflection...');

    // Trigger reflection (3 parallel AI calls)
    const reflectionResult = await this.triggerReflection();

    return reflectionResult;
  }

  private async reconnect() {
    // Exponential backoff
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        await this.client.connect();
        console.log('✅ Reconnected to OpenAI Realtime API');
        return;
      } catch (error) {
        attempts++;
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(`⏳ Reconnection attempt ${attempts}/${maxAttempts} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Failed to reconnect after multiple attempts');
  }
}
```

**Usage Example:**

```typescript
// Start text conversation
const conversation = new CharacterConversation();
await conversation.initialize('role_uuid_123');

// Admin sends message
await conversation.sendMessage('What do you think about the new taxation proposal?');

// Character responds (streamed to UI automatically)
// ...

// Admin sends another message
await conversation.sendMessage('Would you support a military alliance?');

// End conversation and trigger reflection
const reflection = await conversation.endConversation();
console.log('New AI context version:', reflection.newVersion);
```

### 4.3 Voice Conversation (Direct OpenAI Audio)

**Architecture Option 1: Native OpenAI Realtime Audio**

```typescript
async initializeVoiceConversation(characterId: string) {
  const blocks = await loadAIContext(characterId);
  const systemPrompt = buildSystemPrompt(blocks);

  this.client = new RealtimeClient({
    apiKey: process.env.OPENAI_API_KEY
  });

  await this.client.connect();

  // Configure for AUDIO mode
  await this.client.updateSession({
    model: 'gpt-4o-realtime-preview-2024-10-01',
    modalities: ['text', 'audio'],  // Both for transcript
    instructions: systemPrompt,
    voice: 'alloy',  // or 'echo', 'shimmer'

    // Audio format
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',

    // Turn detection (auto-detect when user stops speaking)
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },

    temperature: 0.8
  });

  // Listen for audio output
  this.client.on('response.audio.delta', (event) => {
    // event.delta is base64-encoded PCM16 audio
    const audioData = base64ToArrayBuffer(event.delta);
    this.playAudioChunk(audioData);
  });

  // Also capture text transcript
  this.client.on('response.text.delta', (event) => {
    this.updateTranscript('Character', event.delta);
  });

  console.log('🎤 Voice conversation initialized (OpenAI native audio)');
}

// Stream microphone audio to OpenAI
async streamMicrophoneAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext({ sampleRate: 24000 });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const pcm16 = convertToPCM16(inputData);
    const base64Audio = arrayBufferToBase64(pcm16);

    // Send to OpenAI
    this.client.appendInputAudio(base64Audio);
  };

  source.connect(processor);
  processor.connect(audioContext.destination);
}
```

**Architecture Option 2: ElevenLabs Voice + OpenAI Text**

For more control over voice quality and character voice customization:

```typescript
async initializeVoiceWithElevenLabs(characterId: string, voiceAgentId: string) {
  // Step 1: Generate intent notes from MAIN PERSONA
  const intentNotes = await this.generateIntentNotes(characterId);

  // Step 2: Initialize OpenAI for text-only
  await this.initializeTextConversation(characterId);

  // Step 3: Initialize ElevenLabs voice agent
  const elevenlabsConfig = {
    agent_id: voiceAgentId,
    // Add intent notes to ElevenLabs system prompt
    first_message: intentNotes.opening_statement,
    language: 'en',
    // Custom voice instructions
    conversation_config_override: {
      agent: {
        prompt: {
          prompt: this.buildVoicePrompt(intentNotes)
        }
      }
    }
  };

  // Start ElevenLabs conversation
  const elevenLabsSession = await fetch(
    'https://api.elevenlabs.io/v1/convai/conversation',
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(elevenlabsConfig)
    }
  );

  const { conversation_id } = await elevenLabsSession.json();

  // Step 4: Connect pipeline
  // User speaks → ElevenLabs ASR → Text
  // Text → OpenAI (get response)
  // OpenAI response → ElevenLabs TTS → Voice

  this.setupVoicePipeline(conversation_id);
}

private async generateIntentNotes(characterId: string) {
  const blocks = await loadAIContext(characterId);

  // Use PROMPT 4.2: Intent Notes Generation
  const prompt = await loadPrompt('intent_notes_generation');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt.system_prompt },
      {
        role: 'user',
        content: JSON.stringify({
          character: blocks.block_2_identity,
          memory: blocks.block_3_memory,
          goals: blocks.block_4_goals,
          conversation_partner: 'Admin',
          context: 'Voice conversation testing'
        })
      }
    ],
    temperature: 0.7
  });

  return JSON.parse(response.choices[0].message.content);
  // Returns: { goal, tone, tactics, boundaries, time_limit, opening_statement }
}

private buildVoicePrompt(intentNotes: any): string {
  return `
You are speaking via voice. Be concise (1-2 sentences per response).

Your goal for this conversation: ${intentNotes.goal}
Your tone: ${intentNotes.tone}
Your tactics: ${intentNotes.tactics.join(', ')}
Your boundaries: ${intentNotes.boundaries.join(', ')}
Time limit: ${intentNotes.time_limit}

Stay in character. Speak naturally.
  `.trim();
}
```

### 4.4 Combined Mode (Voice + Text Transparency)

Run voice conversation while displaying live transcript:

```typescript
async startCombinedMode(characterId: string, voiceAgentId: string) {
  // Initialize both text and voice
  await this.initializeVoiceWithElevenLabs(characterId, voiceAgentId);

  // Display modes
  const ui = {
    voiceVisualizer: true,   // Show audio waveform
    liveTranscript: true,    // Show text in real-time
    cognitiveState: true,    // Show 4 blocks
    metrics: true            // Show latency, tokens, cost
  };

  // User speaks (captured by ElevenLabs)
  // → Transcript updates in real-time
  // → Admin can see what AI "hears"

  // AI responds via voice
  // → Transcript updates with response
  // → Admin can see what AI "says"

  // Full transparency during conversation
}
```

### 4.5 Session Management & Error Handling

**Cost Optimization:**

```typescript
// Realtime API pricing (as of Oct 2024)
const PRICING = {
  text_input: 0.005 / 1000,      // $5 per 1M tokens
  text_output: 0.020 / 1000,     // $20 per 1M tokens
  audio_input: 0.100 / 1000,     // $100 per 1M tokens
  audio_output: 0.200 / 1000     // $200 per 1M tokens
};

// Session cost tracking
class ConversationMetrics {
  private totalTokens = {
    text_input: 0,
    text_output: 0,
    audio_input: 0,
    audio_output: 0
  };

  trackUsage(event: any) {
    this.totalTokens.text_input += event.usage.input_tokens || 0;
    this.totalTokens.text_output += event.usage.output_tokens || 0;
    this.totalTokens.audio_input += event.usage.input_audio_tokens || 0;
    this.totalTokens.audio_output += event.usage.output_audio_tokens || 0;
  }

  calculateTotalCost(): number {
    return (
      this.totalTokens.text_input * PRICING.text_input +
      this.totalTokens.text_output * PRICING.text_output +
      this.totalTokens.audio_input * PRICING.audio_input +
      this.totalTokens.audio_output * PRICING.audio_output
    );
  }
}

// Warning if conversation is getting expensive
if (metrics.calculateTotalCost() > 1.00) {
  console.warn('⚠️ Conversation cost exceeded $1.00');
  notifyAdmin('High API costs - consider ending conversation');
}
```

**Session Persistence:**

```typescript
// Save session state to resume later
async saveSessionState() {
  await supabase
    .from('conversations')
    .update({
      session_state: {
        transcript: this.transcript,
        conversation_id: this.conversationId,
        total_tokens: this.metrics.totalTokens,
        last_active: new Date().toISOString()
      }
    })
    .eq('conversation_id', this.conversationId);
}

// Resume interrupted conversation
async resumeSession(conversationId: string) {
  const { data } = await supabase
    .from('conversations')
    .select('session_state')
    .eq('conversation_id', conversationId)
    .single();

  this.transcript = data.session_state.transcript;
  this.metrics.totalTokens = data.session_state.total_tokens;

  // Note: OpenAI Realtime API doesn't support true session resumption
  // We must start a new session and include previous transcript in context
  await this.initialize(data.role_id);

  // Add previous messages to context
  for (const message of this.transcript) {
    if (message.speaker === 'Admin') {
      await this.client.sendUserMessageContent([
        { type: 'input_text', text: message.text }
      ]);
    }
  }
}

---

## 5. REFLECTION ENGINE

### Workflow

```
Conversation Ends
      ↓
┌─────────────────────────────────────────────────────────────┐
│ REFLECTION: 3 Parallel AI Calls                             │
│                                                             │
│ Call 1: Update Block 2 (Identity)                          │
│ Prompt: "Did this change who you are?"                     │
│ Output: Updated identity OR "NO_CHANGE"                    │
│                                                             │
│ Call 2: Update Block 3 (Memory)                            │
│ Prompt: "What do you remember? (≤2500 words)"              │
│ Output: Compressed memory JSON                             │
│                                                             │
│ Call 3: Update Block 4 (Goals)                             │
│ Prompt: "How does this change your strategy?"              │
│ Output: Updated goals/strategy JSON                        │
└─────────────────────────────────────────────────────────────┘
      ↓
Validation (memory size, JSON structure, consistency)
      ↓
Save New Version (ai_context table, version N+1)
      ↓
Notify Admin UI ("✨ New version created")
```

### Example Reflection Prompt (Block 3 Memory)

```markdown
# Memory Reflection

## Your Current Memory (1,850 / 2,500 words)

{
  "recent_conversations": [...],
  "relationships": {...},
  "strategic_insights": [...],
  ...
}

## New Conversation

[Full transcript of 8-minute conversation about taxation and alliances]

## Your Task

Compress this into your memory. **Memory limit: 2,500 words.**

You understand what matters for winning in this simulation. You decide:
- What's strategically important to remember?
- What can you discard?
- How should you compress older memories if needed?

Return updated Block 3 JSON. Final size must be ≤ 2,500 words.

**Trust your strategic judgment.**
```

**That's it.** No 15-point checklist, no prescribed algorithm. The AI figures it out.

---

## 6. ADMIN INTERFACE

### 6.1 Cognitive State Viewer

Real-time display of all 4 blocks with:
- Version timeline slider (navigate history)
- Diff view (what changed in last update?)
- JSON tree view (expandable/collapsible)
- Export button (download as JSON)

### 6.2 Conversation Interface

3 modes: Text | Voice | Combined

Features:
- Live transcript (all modalities)
- Response time tracking
- Token usage & cost
- "End Conversation" → triggers reflection
- **"View Full Context Sent to AI"** button on every response

### 6.3 Prompt Editor

Edit any of the 10 prompts:
- Template editor with variable helpers
- Preview with sample data
- Version control (v1.0, v1.1, etc.)
- A/B testing (run same scenario with 2 prompts)
- Activate/deactivate versions

### 6.4 Metrics Dashboard

Track:
- Memory size over time (word count graph)
- Response latency (text vs voice)
- Token usage & cost estimation
- Character consistency score
- Conversation count

### 6.5 Scenario Injection

Test reflection without full conversation:
- Pre-built scenarios (betrayal, alliance, victory, loss)
- Custom event creator
- Inject event → trigger reflection
- View changes in all blocks

### 6.6 AI Call Inspector (Critical for Transparency)

**Click any AI response to see:**

```
┌─────────────────────────────────────────────────────────────┐
│ AI CALL DETAILS                                             │
│                                                             │
│ Timestamp: 2025-10-30 15:45:23                              │
│ Purpose: Generate response to user message                  │
│ AI Model: OpenAI GPT-4o-realtime                            │
│ Temperature: 0.8                                            │
│ Response Time: 2.3s                                         │
│ Tokens: 87 (Input: 62, Output: 25)                         │
│ Cost: $0.002                                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FULL CONTEXT SENT TO AI                                 │ │
│ │                                                         │ │
│ │ ▼ System Prompt (PROMPT 3.1)                           │ │
│ │   [Full text, 2,500 words]                             │ │
│ │   [Copy] [Export]                                      │ │
│ │                                                         │ │
│ │ ▼ Block 1: Fixed Context                               │ │
│ │   [Simulation Rules + Actions + Behavioral Framework]  │ │
│ │   [View Full] [Copy]                                   │ │
│ │                                                         │ │
│ │ ▼ Block 2: Identity                                    │ │
│ │   {...full JSON...}                                    │ │
│ │   [View Full JSON] [Copy]                              │ │
│ │                                                         │ │
│ │ ▼ Block 3: Memory                                      │ │
│ │   {...full JSON...}                                    │ │
│ │   [View Full JSON] [Copy]                              │ │
│ │                                                         │ │
│ │ ▼ Block 4: Goals                                       │ │
│ │   {...full JSON...}                                    │ │
│ │   [View Full JSON] [Copy]                              │ │
│ │                                                         │ │
│ │ ▼ Conversation History (5 messages)                    │ │
│ │   [View Full History]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AI RESPONSE                                             │ │
│ │ "Military budget? I support reasonable funding with    │ │
│ │  civilian oversight. No blank checks for wars."        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Export Entire Interaction] [Replay with Different Prompt] │
└─────────────────────────────────────────────────────────────┘
```

**Every AI call is logged. Complete transparency.**

---

## 7. DATABASE SCHEMA

### Using Existing Tables

```sql
-- ai_context: Store 4 blocks with versioning
CREATE TABLE ai_context (
  context_id UUID PRIMARY KEY,
  run_id UUID NOT NULL,
  role_id UUID NOT NULL,
  version INTEGER NOT NULL,
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

-- ai_prompts: Store prompt templates with versioning
CREATE TABLE ai_prompts (
  prompt_id UUID PRIMARY KEY,
  prompt_type TEXT NOT NULL,  -- 'block_1_simulation_rules', etc.
  version TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  default_llm_model TEXT DEFAULT 'gpt-4o',
  default_temperature DECIMAL(3,2) DEFAULT 0.8,
  default_max_tokens INTEGER DEFAULT 150,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prompt_type, version)
);

-- Only one active prompt per type
CREATE UNIQUE INDEX idx_ai_prompts_active_unique
  ON ai_prompts(prompt_type) WHERE is_active = TRUE;
```

### New Table: Conversations (Prototype Logging)

```sql
CREATE TABLE conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id),

  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  modality TEXT NOT NULL CHECK (modality IN ('text', 'voice', 'combined')),

  -- Content
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{"speaker": "Admin", "text": "...", "timestamp": "..."}]

  -- Voice-specific
  elevenlabs_conversation_id TEXT,

  -- Reflection
  reflection_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  ai_context_version_before INTEGER,
  ai_context_version_after INTEGER,

  -- Metrics
  total_messages INTEGER,
  avg_response_time_seconds DECIMAL(5,2),
  total_tokens_used INTEGER,
  estimated_cost_usd DECIMAL(10,4),

  -- Testing
  scenario_injected JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8. IMPLEMENTATION TIMELINE

### Phase 1: Foundation (Week 1, Days 1-3)

**Day 1:**
- ✅ Spec documents complete
- ✅ Prompt catalog created
- Set up npm workspace structure
- Create database tables

**Day 2:**
- Build Admin Setup Flow (sim/role/voice selection)
- Fetch ElevenLabs agents API
- Load roles from selected sim_run

**Day 3:**
- Implement 4-block loading system
- Generate initial Block 4 (goals) from character
- Save to ai_context table

**Deliverable:** Character initialization working

---

### Phase 2: Text Conversation (Week 1-2, Days 4-7)

**Day 4-5:**
- Integrate OpenAI Realtime API
- Build text conversation interface
- Stream responses to admin UI

**Day 6:**
- Implement reflection engine (3 prompts)
- Test memory compression
- Validate word count limits

**Day 7:**
- Build cognitive state viewer
- Display all 4 blocks in real-time
- Version timeline

**Deliverable:** Full text conversation + reflection working

---

### Phase 3: Voice Integration (Week 2-3, Days 8-12)

**Day 8-9:**
- Integrate ElevenLabs voice
- Connect to OpenAI Realtime API
- Test voice quality

**Day 10:**
- Build intent notes system
- Generate behavioral instructions for voice agent

**Day 11:**
- Voice UI (live transcript, volume bars)
- Combined mode (voice + text simultaneously)

**Day 12:**
- Test latency, quality, transcript accuracy

**Deliverable:** Voice conversations working

---

### Phase 4: Admin Tools (Week 3-4, Days 13-17)

**Day 13:**
- Prompt editor (view, edit, version, preview)

**Day 14:**
- Metrics dashboard (memory size, latency, cost)

**Day 15:**
- Scenario injection (pre-built + custom)

**Day 16:**
- AI Call Inspector (full transparency)

**Day 17:**
- A/B prompt testing tool

**Deliverable:** Complete admin interface

---

### Phase 5: Testing & Documentation (Week 4-5, Days 18-22)

**Day 18-19:**
- Comprehensive testing (20+ scenarios)
- Character consistency validation

**Day 20:**
- Extract patterns from THERAPIST & EXMG
- Apply proven techniques

**Day 21:**
- Documentation (admin guide, prompt guide)

**Day 22:**
- Video walkthrough, lessons learned

**Deliverable:** Production-ready prototype

---

## SUCCESS CRITERIA

### Functional

✅ AI character holds 10+ conversations with consistency >85%
✅ Memory compression maintains <2500 words
✅ Voice conversations <1 second latency
✅ Admin can iterate on prompts easily
✅ All AI calls fully transparent

### Quality

✅ Character feels human (admin rates >7/10)
✅ No "helpful AI assistant" behaviors
✅ Emotions and biases evident
✅ Strategic thinking demonstrated

### Technical

✅ Text response <3 seconds
✅ Voice response <1 second
✅ Reflection <10 seconds
✅ No crashes, graceful error handling

---

## NEXT STEPS

1. ✅ Spec complete
2. ✅ Prompt catalog complete
3. ⏳ Extract THERAPIST patterns
4. ⏳ Set up npm workspace
5. ⏳ Begin Phase 1 implementation

**Timeline:** 5 weeks total
**Output:** Validated AI cognitive system ready for game integration

---

**END OF SPECIFICATION**
