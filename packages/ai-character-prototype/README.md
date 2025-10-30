# AI Character Prototype

**Metacognitive 4-Block System - Testing Environment**

## Overview

A focused testing environment for validating The New King SIM's AI character cognitive system before full game integration.

## Key Features

- **4-Block Cognitive Architecture**: Fixed Context, Identity, Memory (bounded ≤2500 words), Goals & Strategy
- **Reflection Engine**: Automatic self-update after each conversation
- **Text & Voice Conversations**: OpenAI Realtime API + ElevenLabs integration
- **Admin Transparency**: View every prompt, every AI call, full cognitive state
- **Prompt Versioning**: Edit and version all 10 prompts with A/B testing
- **Memory Compression**: AI-driven strategic memory management

## Architecture

```
┌─────────────────────────────────────────┐
│        Admin Interface (React)          │
│  • Setup (Sim/Role/Voice Selection)     │
│  • Conversation (Text/Voice/Combined)   │
│  • Cognitive State Viewer (4 Blocks)    │
│  • Prompt Editor (10 prompts)           │
│  • Metrics Dashboard                    │
│  • AI Call Inspector (Transparency)     │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│   Cognitive Engine (TypeScript)         │
│  • 4-Block System Management            │
│  • Reflection Engine (3 parallel calls) │
│  • Memory Compression                   │
│  • Conversation Session Handling        │
└─────────────────────────────────────────┘
        ↕                        ↕
┌──────────────────┐   ┌──────────────────┐
│ OpenAI GPT-4o    │   │ ElevenLabs Voice │
│ Realtime API     │   │ (ASR/TTS)        │
└──────────────────┘   └──────────────────┘
        ↕
┌─────────────────────────────────────────┐
│      Supabase PostgreSQL                │
│  • ai_context (4 blocks + versioning)   │
│  • ai_prompts (prompt templates)        │
│  • conversations (prototype logs)       │
└─────────────────────────────────────────┘
```

## Project Structure

```
packages/ai-character-prototype/
├── src/
│   ├── index.ts                    # Main exports
│   ├── types/                      # TypeScript interfaces
│   │   ├── ai-context.ts          # 4-block system types
│   │   ├── conversation.ts        # Conversation types
│   │   └── prompts.ts             # Prompt templates
│   ├── core/                       # Core cognitive engine
│   │   ├── character-init.ts      # Initialize character from sim
│   │   ├── blocks-builder.ts      # Build 4-block system
│   │   └── system-prompt.ts       # Combine blocks into prompts
│   ├── reflection/                 # Reflection engine
│   │   ├── reflection-engine.ts   # Coordinate 3 parallel calls
│   │   ├── update-identity.ts     # Block 2 update
│   │   ├── compress-memory.ts     # Block 3 compression
│   │   └── update-goals.ts        # Block 4 adaptation
│   ├── conversation/               # Conversation handling
│   │   ├── text-conversation.ts   # OpenAI Realtime text
│   │   ├── voice-conversation.ts  # OpenAI Realtime voice
│   │   └── session-manager.ts     # Session lifecycle
│   ├── voice/                      # Voice integration
│   │   ├── intent-notes.ts        # Generate behavioral instructions
│   │   └── elevenlabs-client.ts   # ElevenLabs API wrapper
│   ├── database/                   # Database operations
│   │   ├── ai-context-db.ts       # CRUD for ai_context
│   │   ├── prompts-db.ts          # CRUD for ai_prompts
│   │   └── conversations-db.ts    # CRUD for conversations
│   └── utils/                      # Utilities
│       ├── json-parser.ts         # Sanitize AI JSON responses
│       ├── word-counter.ts        # Memory size validation
│       └── logger.ts              # Structured logging
├── tests/                          # Vitest tests
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/                           # Package documentation
│   ├── API.md                     # Public API reference
│   └── EXAMPLES.md                # Usage examples
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Vite configuration
└── README.md                      # This file
```

## Installation

From workspace root:

```bash
npm install
```

## Development

```bash
# Type checking
npm run type-check -w @king/ai-character-prototype

# Run tests
npm test -w @king/ai-character-prototype

# Build
npm run build -w @king/ai-character-prototype
```

## Usage

### Initialize Character

```typescript
import { initializeCharacter } from '@king/ai-character-prototype';

const character = await initializeCharacter({
  simRunId: 'sim_uuid_123',
  roleId: 'role_uuid_456'
});

console.log(character.blocks);
// {
//   block_1_fixed: { simulation_rules, available_actions, behavioral_framework },
//   block_2_identity: { name, age, personality, clan, ... },
//   block_3_memory: {},  // Empty initially
//   block_4_goals: { primary_goal, strategy, next_actions, ... }
// }
```

### Text Conversation

```typescript
import { CharacterConversation } from '@king/ai-character-prototype';

const conversation = new CharacterConversation();
await conversation.initialize('role_uuid_456');

await conversation.sendMessage('What are your thoughts on taxation?');
// Character responds based on 4-block context

await conversation.sendMessage('Would you support a military alliance?');
// Conversation continues with maintained context

const reflection = await conversation.endConversation();
// Triggers reflection, returns new AI context version
```

### Voice Conversation

```typescript
import { VoiceConversation } from '@king/ai-character-prototype';

const voiceConv = new VoiceConversation();
await voiceConv.initialize('role_uuid_456', 'elevenlabs_agent_id');

// Admin speaks (captured via microphone)
// Character responds via voice
// Transcript automatically captured

await voiceConv.endConversation();
// Reflection triggered with full transcript
```

### Reflection Engine

```typescript
import { triggerReflection } from '@king/ai-character-prototype';

const result = await triggerReflection({
  roleId: 'role_uuid_456',
  trigger: 'conversation_end',
  input: {
    transcript: '...',
    currentBlocks: { ... }
  }
});

console.log(result);
// {
//   before: { version: 5, blocks: {...} },
//   after: { version: 6, blocks: {...} },
//   changes: {
//     identity: 'NO_CHANGE',
//     memory: { added: 3, removed: 2, compressed: true },
//     goals: { updated: true, reason: '...' }
//   }
// }
```

## Testing

### Unit Tests

```bash
npm test -w @king/ai-character-prototype
```

### Integration Tests

```bash
npm run test:integration -w @king/ai-character-prototype
```

### Test Coverage

```bash
npm run test:coverage -w @king/ai-character-prototype
```

## Environment Variables

Create `.env` in workspace root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=...
```

## Documentation

- [Full Technical Spec](../../DOCS/prototypes/AI_CHARACTER_PROTOTYPE_SPEC.md)
- [Prompt Catalog](../../DOCS/prototypes/AI_PROMPT_CATALOG.md)
- [Extracted Patterns (THERAPIST)](../../DOCS/prototypes/THERAPIST_PATTERNS_EXTRACTED.md)
- [API Reference](./docs/API.md)
- [Usage Examples](./docs/EXAMPLES.md)

## Architecture Decisions

### Why 4 Blocks?

- **Block 1 (Fixed)**: Prevents "context drift" - rules never change
- **Block 2 (Identity)**: Tracks personality evolution
- **Block 3 (Memory)**: Bounded compression forces strategic thinking
- **Block 4 (Goals)**: Explicit strategy tracking

### Why Non-Prescriptive Prompts?

Trust the AI's intelligence rather than micromanage. Compare:

**❌ Prescriptive:**
> "Keep these 5 types... Discard these 4 types... Use this algorithm..."

**✅ Non-Prescriptive:**
> "You understand what matters for winning. You decide. Trust your judgment."

Result: More emergent, personality-driven behavior.

### Why 3 Parallel Reflection Calls?

- **Speed**: Faster than sequential
- **Independence**: Blocks update independently
- **Fault Tolerance**: One failure doesn't break all

Alternative (THERAPIST pattern): Single call updating all blocks at once.

### Why OpenAI Realtime API?

- **Low latency**: ~50-200ms vs 1-3s for REST
- **Persistent session**: Context maintained automatically
- **Streaming**: Word-by-word responses
- **Voice native**: Both text and audio in same protocol

## Timeline

**5 Weeks (25-30 development days)**

- **Week 1 (Days 1-3)**: Foundation - setup, database, character init
- **Week 1-2 (Days 4-7)**: Text conversation + reflection
- **Week 2-3 (Days 8-12)**: Voice integration
- **Week 3-4 (Days 13-17)**: Admin tools (prompt editor, metrics, transparency)
- **Week 4-5 (Days 18-22)**: Testing & documentation

## Success Criteria

### Functional
- ✅ AI character holds 10+ conversations with consistency >85%
- ✅ Memory compression maintains <2500 words
- ✅ Voice conversations <1 second latency
- ✅ Admin can iterate on prompts easily
- ✅ All AI calls fully transparent

### Quality
- ✅ Character feels human (admin rates >7/10)
- ✅ No "helpful AI assistant" behaviors
- ✅ Emotions and biases evident
- ✅ Strategic thinking demonstrated

### Technical
- ✅ Text response <3 seconds
- ✅ Voice response <1 second
- ✅ Reflection <10 seconds
- ✅ No crashes, graceful error handling

## Contributing

This is a focused prototype for validation. Development is intentionally isolated from the main game codebase for rapid iteration.

## License

Private - The New King SIM Project
