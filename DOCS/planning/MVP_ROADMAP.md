# MVP ROADMAP: AI-Augmented Voice-Enabled Simulation
## 8-10 Week Development Plan to Production-Ready MVP

**Last Updated:** October 29, 2025
**Target Completion:** Mid to Late December 2025
**Development Approach:** Natural pace, no hard deadline

---

## Executive Summary

The New King SIM is currently **40% complete** toward MVP. The foundation is solid:
- ✅ Authentication & authorization system
- ✅ Database schema (71 migrations, 16 tables)
- ✅ Facilitator tools (simulation creation, phase control, registration)
- ✅ Real-time phase synchronization
- ✅ Performance optimized (< 2 second load times)

**Remaining work to MVP:**
- **Voting System** (5% complete → 100%)
- **Meetings Module** (0% → 100%)
- **AI Character System** (0% → 100%) - **Core Differentiator**
- **Voice Integration** (0% → 100%) - **Core Differentiator**
- **Public Speeches** (0% → 100%)

**Strategic Decision:** Build AI-Augmented MVP with full voice capabilities using proven patterns from THERAPIST and NegotiationMaster projects.

---

## Reference Implementations

We have **proven implementations** to adapt from:

### THERAPIST Project (`/CODING/THERAPIST/`)
**Proven Patterns:**
- ✅ 3-component cognitive architecture (maps to our 4-block system)
- ✅ ElevenLabs voice integration via `/v1/chat/completions`
- ✅ Reflection-based learning after events
- ✅ Memory compression (3-4 pages max)
- ✅ "NOT BEING A HELPFUL ASSISTANT" behavioral prompting
- ✅ Intent notes from MAIN PERSONA → Voice agent
- ✅ FastAPI `/v1/chat/completions` OpenAI-compatible endpoint

**Key Files to Adapt:**
- `ARCHITECTURE OF THE AI PARTICIPANT.md` - Cognitive model
- `DESIGN.md` - Workflow and reflection phases
- `HUMAN AI PROMT.md` - Behavioral instructions
- `server_v2.py` - Voice endpoint implementation

### NegotiationMaster (`github.com/Mar-Atn/NegotiationMaster`)
**Proven Patterns:**
- ✅ ElevenLabs integration in production
- ✅ Multi-participant voice coordination
- ✅ JavaScript/TypeScript implementation patterns

---

## Current State Assessment

### Completed Modules (40% of MVP)

**1. Authentication & User Management** ✅
- Email/password authentication
- Role-based access control (Facilitator, Participant)
- QR code access tokens (24-hour expiry)
- Protected routes

**2. Database Schema** ✅
- 71 migrations deployed
- 16 tables with RLS policies
- Real-time subscriptions enabled (sim_runs, phases)
- Performance optimized

**3. Simulation Creation & Management** ✅
- Template system with duplication
- 6-step configuration wizard
- Clan and role customization
- Phase duration configuration
- Voting thresholds (Sacred Tradition)

**4. Facilitator Dashboard** ✅
- Simulation overview
- Phase control interface
- Real-time connection status
- Participant tracking

**5. Participant Dashboard** ✅
- Role assignment display
- Clan information
- Real-time phase synchronization
- Character profile view
- Printable materials

**6. Registration System** ✅
- Bulk registration via CSV/manual
- QR code generation for device access
- Role assignment management

### Incomplete Modules (60% of MVP)

**1. Voting System** (5% complete)
- ❌ Vote session management
- ❌ Ballot interface
- ❌ Live results dashboard
- ❌ 2/3 majority calculation
- ✅ Database schema ready
- ✅ Thresholds configured

**2. Meetings Module** (0% complete)
- ❌ Meeting invitation system
- ❌ Private meeting rooms
- ❌ Voice conversation interface
- ❌ AI participant integration
- ❌ Meeting transcripts
- ✅ Database schema ready

**3. AI Character System** (0% complete) - **CRITICAL**
- ❌ 4-block cognitive architecture
- ❌ Context management (Block 1: Fixed Context)
- ❌ Identity system (Block 2: Character personality)
- ❌ Memory management (Block 3: Bounded, compressed)
- ❌ Goals & plans (Block 4: Strategic evolution)
- ❌ Reflection system after events
- ❌ Claude API integration (MAIN PERSONA)
- ✅ Database schema ready (ai_context, ai_prompts)

**4. Voice Integration** (0% complete) - **CRITICAL**
- ❌ ElevenLabs API integration
- ❌ FastAPI `/v1/chat/completions` endpoint
- ❌ Intent notes from MAIN PERSONA
- ❌ Voice agent coordination
- ❌ Transcript capture → Reflection trigger
- ❌ Public speeches with voice
- ❌ Meeting voice conversations
- ❌ Q&A after speeches

**5. Public Speeches** (0% complete)
- ❌ Speech submission interface
- ❌ Live speech delivery (voice)
- ❌ Audience Q&A interface
- ❌ Speech history/archive
- ✅ Database schema ready

---

## 8-10 Week Sprint Plan

### Sprint 0: Documentation & Planning (Current Week)
**Duration:** 3-5 days
**Status:** In Progress

**Deliverables:**
- ✅ Strategic planning complete
- 🔄 Create all planning documents
- 🔄 Extract THERAPIST patterns
- 🔄 Update core technical docs
- 🔄 Restructure documentation hierarchy

**Key Documents:**
- MVP_ROADMAP.md (this document)
- AI_IMPLEMENTATION_PLAN.md
- VOICE_INTEGRATION_GUIDE.md
- THERAPIST_COGNITIVE_PATTERNS.md
- THERAPIST_VOICE_PATTERNS.md

---

### Sprint 1-2: Voting System & Meetings Foundation (Weeks 1-4)
**Duration:** 2 weeks
**Estimated Effort:** 8-10 days

#### Sprint 1: Voting System (Week 1-2)
**Goal:** Complete voting functionality for King election

**Tasks:**
1. **Vote Session Management** (2 days)
   - Create vote session (facilitator action)
   - Vote session status (setup → active → completed)
   - Link to Vote 1 or Vote 2 phase
   - Display vote session in participant dashboard

2. **Ballot Interface** (2 days)
   - Display eligible candidates (roles from participant's clan)
   - Single-choice radio buttons
   - Vote submission validation
   - "Vote submitted" confirmation
   - Prevent duplicate votes (database constraint)

3. **Results Dashboard** (2 days)
   - Live vote count (facilitator view)
   - Winner calculation (2/3 threshold from sim_runs)
   - Results announcement interface
   - Vote history archive

4. **Testing & Edge Cases** (1 day)
   - Test voting flow end-to-end
   - Test threshold scenarios (pass/fail)
   - Test concurrent votes
   - Test vote session transitions

**Dependencies:** None (database schema ready)
**Risk:** Low (straightforward CRUD operations)

#### Sprint 2: Meetings Foundation (Week 3-4)
**Goal:** Build meeting system WITHOUT voice (text chat only)

**Tasks:**
1. **Meeting Invitation System** (2 days)
   - Create meeting with participants
   - Send invitations (in-app notifications)
   - Accept/decline invitations
   - Meeting status (pending → scheduled → in_progress → completed)

2. **Meeting Room Interface** (3 days)
   - Private meeting room page
   - Participant list display
   - Text chat interface
   - Real-time message sync (Supabase Realtime)
   - Meeting transcript storage

3. **AI Participant Placeholder** (2 days)
   - Simple rule-based AI responses (NOT full cognitive system)
   - "AI is typing..." indicator
   - Store AI messages in database
   - Prepare for cognitive system integration (Sprint 3-4)

4. **Testing & Polish** (1 day)
   - Test meeting creation flow
   - Test real-time chat sync
   - Test AI placeholder responses
   - Test multi-participant meetings

**Dependencies:** None (database schema ready)
**Risk:** Low (similar to phase sync, already working)

**Sprint 1-2 Deliverables:**
- ✅ Fully functional voting system (Vote 1 + Vote 2)
- ✅ Meeting invitation and room system
- ✅ Text chat with real-time sync
- ✅ AI placeholder (rule-based)
- ⚠️ Voice NOT yet implemented (Sprint 5-6)

---

### Sprint 3-4: AI Cognitive System (4-Block Architecture) (Weeks 5-8)
**Duration:** 2-4 weeks
**Estimated Effort:** 10-15 days (revised from 15-20 with proven patterns)

**Goal:** Implement full 4-block metacognitive AI character system adapted from THERAPIST

#### Sprint 3: Core Cognitive Architecture (Week 5-6)

**1. Block 1: Fixed Context** (2 days)
- **File:** `src/lib/ai/block1_fixed_context.ts`
- **Content:**
  - Simulation rules and process
  - AI capabilities and constraints
  - Phase-specific instructions
  - Meeting constraints (max 1 AI per mixed meeting)
  - Voting rules
- **Storage:** ai_prompts table (template-level, version-controlled)
- **Pattern:** Static prompt template from THERAPIST Component 1

**2. Block 2: Identity** (2 days)
- **File:** `src/lib/ai/block2_identity.ts`
- **Content:**
  - Character personality (from roles.character_traits)
  - Clan alignment (from clans.key_priorities, attitude_to_others)
  - Values and motivations (from roles.interests)
  - Communication style
  - "NOT BEING A HELPFUL ASSISTANT" behavioral instructions
- **Storage:** ai_context.identity_context (JSONB, per AI role)
- **Pattern:** THERAPIST Component 1 + HUMAN AI PROMT behavioral instructions

**3. Block 3: Memory Management** (3 days)
- **File:** `src/lib/ai/block3_memory.ts`
- **Content:**
  - Bounded memory (3-4 pages max, inspired by THERAPIST)
  - Event summaries (meetings, speeches, votes)
  - Key decisions and outcomes
  - Relationships with other participants
  - Compression algorithm (discard old details, keep themes)
- **Storage:** ai_context.memory_context (JSONB, per AI role)
- **Update trigger:** After each event (meeting, speech, vote)
- **Pattern:** THERAPIST Component 2 memory compression

**4. Block 4: Goals & Plans** (2 days)
- **File:** `src/lib/ai/block4_goals.ts`
- **Content:**
  - Strategic objectives (align with clan priorities)
  - Current plans (who to meet, what to say in speeches)
  - Decision criteria (voting strategy)
  - Adaptation based on events
- **Storage:** ai_context.goals_context (JSONB, per AI role)
- **Update trigger:** After reflection phase
- **Pattern:** THERAPIST Component 3 treatment plan evolution

**5. Reflection System** (2 days)
- **File:** `src/lib/ai/reflection.ts`
- **Workflow:**
  1. Event completes (meeting ends, speech delivered, vote cast)
  2. Trigger reflection API call
  3. AI analyzes event transcript/outcome
  4. Updates Block 3 (Memory) and Block 4 (Goals)
  5. Displays before/after state (facilitator view optional)
- **Pattern:** THERAPIST reflection phase after conversation
- **API:** POST `/api/ai/reflect` (Claude API)

**Sprint 3 Deliverables:**
- ✅ 4-block cognitive architecture fully implemented
- ✅ AI context management system
- ✅ Reflection system after events
- ✅ Memory compression algorithm
- ✅ Integration with database (ai_context table)

#### Sprint 4: AI Integration with Game Mechanics (Week 7-8)

**1. Meeting AI Behavior** (3 days)
- **File:** `src/lib/ai/meeting_ai.ts`
- **Function:** `generateMeetingResponse()`
- **Input:**
  - All 4 blocks (context)
  - Meeting history (messages so far)
  - Other participants
- **Output:**
  - AI message (text)
  - Updated memory/goals (reflection)
- **API:** POST `/api/ai/meeting/respond`
- **Constraint:** Max 1 AI per mixed human-AI meeting

**2. Speech AI Behavior** (2 days)
- **File:** `src/lib/ai/speech_ai.ts`
- **Function:** `generatePublicSpeech()`
- **Input:**
  - All 4 blocks (context)
  - Current phase (Vote 1 or Vote 2)
  - Audience (all participants)
- **Output:**
  - Speech text (1-2 paragraphs)
  - Speech transcript
- **API:** POST `/api/ai/speech/generate`

**3. Q&A AI Behavior** (2 days)
- **File:** `src/lib/ai/qa_ai.ts`
- **Function:** `answerQuestion()`
- **Input:**
  - All 4 blocks (context)
  - Question from audience
  - Speech context
- **Output:**
  - Answer (1-2 sentences)
- **API:** POST `/api/ai/qa/respond`

**4. Voting AI Decision** (2 days)
- **File:** `src/lib/ai/voting_ai.ts`
- **Function:** `castVote()`
- **Input:**
  - All 4 blocks (context)
  - Candidates (eligible roles)
  - Clan priorities
  - Memory of interactions
- **Output:**
  - Vote decision (role_id)
  - Reasoning (stored in memory)
- **API:** POST `/api/ai/vote/decide`

**5. Testing & Refinement** (2 days)
- Test AI responses for coherence
- Test memory compression over time
- Test goal evolution
- Test constraint enforcement (1 AI per meeting)
- Refine prompts for character consistency

**Sprint 4 Deliverables:**
- ✅ AI fully integrated into meetings (text)
- ✅ AI public speeches (text)
- ✅ AI Q&A responses (text)
- ✅ AI voting decisions
- ✅ Character consistency across events
- ⚠️ Voice NOT yet implemented (Sprint 5-6)

---

### Sprint 5-6: Voice Integration (ElevenLabs) (Weeks 9-12)
**Duration:** 2-4 weeks
**Estimated Effort:** 8-12 days

**Goal:** Add voice layer to existing AI system using proven THERAPIST patterns

#### Sprint 5: Voice Infrastructure (Week 9-10)

**1. FastAPI Voice Endpoint** (2 days)
- **File:** `backend/voice_server.py` (new FastAPI service)
- **Pattern:** Adapt from THERAPIST `server_v2.py`
- **Endpoint:** POST `/v1/chat/completions` (OpenAI-compatible)
- **Function:**
  - Accept voice conversation request
  - Get intent notes from MAIN PERSONA (cognitive system)
  - Forward to ElevenLabs Conversational AI
  - Return voice response
  - Capture transcript
  - Trigger reflection

**2. ElevenLabs Integration** (2 days)
- **Service:** ElevenLabs Conversational AI
- **API:** `/v1/convai/conversation`
- **Features:**
  - Custom voice per character (select from ElevenLabs library)
  - Real-time ASR (speech-to-text)
  - Real-time TTS (text-to-speech)
  - Intent notes injection (from MAIN PERSONA)
- **Configuration:** Voice IDs for each character

**3. Intent Notes System** (2 days)
- **File:** `src/lib/ai/intent_notes.ts`
- **Function:** `generateIntentNotes()`
- **Input:**
  - All 4 blocks (context)
  - Event type (meeting, speech, Q&A)
  - Audience/participants
- **Output:**
  - Intent notes (1-2 sentences)
  - Behavioral guidance (tone, goals)
- **Example:**
  ```
  You are Alexandros the Merchant, speaking in a public speech.
  Your goal: Convince the Achaeans you will protect trade routes.
  Tone: Confident, pragmatic, slightly defensive.
  Emphasize your clan's wealth and connections.
  ```

**4. Transcript Capture & Reflection** (1 day)
- **Flow:**
  1. Voice conversation completes
  2. ElevenLabs returns transcript
  3. Store transcript in database (meeting_messages or speeches)
  4. Trigger reflection API call
  5. Update memory and goals
- **Pattern:** THERAPIST transcript → reflection flow

**Sprint 5 Deliverables:**
- ✅ FastAPI voice endpoint operational
- ✅ ElevenLabs API integration working
- ✅ Intent notes generation
- ✅ Transcript capture → Reflection pipeline
- ✅ Voice infrastructure ready for UI

#### Sprint 6: Voice UI Integration (Week 11-12)

**1. Meeting Voice Interface** (2 days)
- **Component:** `src/components/MeetingVoiceRoom.tsx`
- **Features:**
  - "Start Voice Conversation" button
  - Real-time audio streaming (WebSocket)
  - Visual indicator (AI speaking, user speaking)
  - Transcript display (live captions)
  - "End Conversation" button
- **API Calls:**
  - POST `/v1/chat/completions` (voice endpoint)
  - WebSocket connection to ElevenLabs

**2. Public Speech Voice Delivery** (2 days)
- **Component:** `src/components/PublicSpeechVoice.tsx`
- **Features:**
  - AI delivers speech via voice (auto-play)
  - Audience listens (audio stream)
  - Q&A voice interface
  - Speech transcript display
- **Flow:**
  1. AI generates speech text (cognitive system)
  2. TTS via ElevenLabs
  3. Broadcast audio to all participants
  4. Open Q&A voice floor

**3. Text Chat Fallback** (1 day)
- **Purpose:** Support mode when voice unavailable
- **Use case:** AI-to-AI communication (no voice needed)
- **Implementation:**
  - Keep existing text chat interface
  - "Switch to Text" button in voice rooms
  - AI generates text response if voice fails

**4. Testing & Polish** (2 days)
- Test voice quality and latency
- Test multi-participant voice coordination
- Test transcript accuracy
- Test intent notes → behavior consistency
- Test fallback to text chat
- Refine voice UX (button states, loading indicators)

**5. Character Voice Selection** (1 day)
- **Task:** Select appropriate ElevenLabs voice IDs for each character
- **Criteria:**
  - Age (young merchant vs. old general)
  - Personality (confident vs. cautious)
  - Clan identity (regal vs. pragmatic)
- **Storage:** roles.voice_id (new column, optional)
- **Fallback:** Default voice if not specified

**Sprint 6 Deliverables:**
- ✅ Meeting voice conversations functional
- ✅ Public speeches with voice delivery
- ✅ Q&A voice interface
- ✅ Text chat fallback working
- ✅ Character voice consistency
- ✅ Full voice integration complete

---

### Sprint 7-8: Public Speeches & Final Polish (Weeks 13-16)
**Duration:** 2-4 weeks
**Estimated Effort:** 6-10 days

#### Sprint 7: Public Speeches Module (Week 13-14)

**1. Speech Submission Interface** (2 days)
- **Component:** `src/components/SpeechSubmission.tsx`
- **Features:**
  - Text input for speech (human participants)
  - Speech preview
  - Submit for delivery
  - Edit before delivery
  - Character count (500-1000 words)
- **Validation:** Ensure speech is appropriate (facilitator review optional)

**2. Speech Delivery System** (2 days)
- **Component:** `src/components/SpeechDelivery.tsx`
- **Features:**
  - Schedule speech (facilitator control)
  - Live speech delivery (voice for AI, text-to-speech for humans optional)
  - Audience view (all participants)
  - Speech history/archive
- **Flow:**
  1. Facilitator starts speech delivery phase
  2. Participants see current speaker
  3. Speech plays (voice or text)
  4. Q&A session opens
  5. Move to next speaker

**3. Q&A Interface** (2 days)
- **Component:** `src/components/SpeechQA.tsx`
- **Features:**
  - Audience submits questions (text or voice)
  - Speaker receives questions
  - Speaker responds (voice or text)
  - Q&A transcript
- **Constraint:** Time-limited Q&A (5-10 minutes per speech)

**4. Speech Archive** (1 day)
- **Page:** `src/pages/SpeechArchive.tsx`
- **Features:**
  - List all speeches from simulation
  - Play recorded speeches (voice)
  - Read transcripts
  - Filter by speaker/clan
  - Export speeches (PDF/JSON)

**Sprint 7 Deliverables:**
- ✅ Speech submission interface
- ✅ Live speech delivery system
- ✅ Q&A interface
- ✅ Speech archive
- ✅ Public speeches module complete

#### Sprint 8: Testing, Polish & Documentation (Week 15-16)

**1. End-to-End Testing** (2 days)
- **Full simulation walkthrough:**
  1. Create simulation
  2. Register participants
  3. Start simulation
  4. Phase 1: Opening (speeches)
  5. Phase 2: Meetings (voice conversations)
  6. Phase 3: Vote 1
  7. Phase 4: More meetings
  8. Phase 5: Vote 2
  9. Phase 6: Resolution
  10. Complete simulation
- **Test cases:**
  - All AI characters participate correctly
  - Voice conversations work smoothly
  - Voting threshold calculations correct
  - Memory and goals evolve appropriately
  - Real-time sync works across devices

**2. Bug Fixes & Edge Cases** (2 days)
- Fix any issues discovered in testing
- Handle edge cases:
  - No votes cast (threshold not met)
  - AI participant leaves mid-meeting
  - Voice connection drops
  - Memory exceeds 4 pages (compression)
  - Duplicate vote attempts

**3. UI/UX Polish** (2 days)
- Refine animations and transitions
- Improve loading states
- Add helpful error messages
- Improve mobile responsiveness
- Add accessibility features (ARIA labels, keyboard navigation)
- Refine Mediterranean color palette usage

**4. Performance Optimization** (1 day)
- Profile AI API calls (ensure < 2s response time)
- Optimize voice streaming (minimize latency)
- Test with 12 participants + 8 AI characters
- Ensure database queries stay fast (< 500ms)

**5. Documentation** (2 days)
- Update user guides (facilitator, participant)
- API documentation (AI endpoints, voice endpoints)
- Deployment guide (Supabase + FastAPI)
- Troubleshooting guide (common issues)
- Video walkthrough (optional)

**6. Deployment Preparation** (1 day)
- Set up production environment (Supabase project)
- Configure ElevenLabs API keys
- Configure Claude API keys
- Set up FastAPI backend (Railway/Render/AWS)
- Test production deployment

**Sprint 8 Deliverables:**
- ✅ Full end-to-end testing complete
- ✅ All critical bugs fixed
- ✅ UI/UX polished
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ Production deployment ready
- ✅ **MVP COMPLETE**

---

## Success Criteria for MVP

### Functional Requirements
- ✅ Facilitators can create and configure simulations
- ✅ Participants can register and view their roles
- ✅ Real-time phase synchronization works across devices
- ✅ Voting system calculates winners with 2/3 threshold
- ✅ AI characters participate in meetings (voice)
- ✅ AI characters deliver public speeches (voice)
- ✅ AI characters answer questions (voice)
- ✅ AI characters vote based on clan priorities and memory
- ✅ AI memory and goals evolve throughout simulation
- ✅ Text chat fallback available when voice unavailable

### Technical Requirements
- ✅ Database RLS policies secure all operations
- ✅ All pages load in < 2 seconds
- ✅ AI responses complete in < 2 seconds
- ✅ Voice conversations have < 1 second latency
- ✅ Real-time sync has < 500ms delay
- ✅ System handles 12 participants + 8 AI characters
- ✅ No base64 images in database (all use Storage)

### User Experience Requirements
- ✅ Facilitator dashboard is intuitive
- ✅ Participant dashboard is clear and engaging
- ✅ Voice conversations feel natural
- ✅ AI characters feel distinct and believable
- ✅ Mediterranean aesthetic consistent throughout
- ✅ Mobile-friendly (responsive design)
- ✅ Accessible (WCAG 2.1 AA compliance)

### Documentation Requirements
- ✅ Facilitator user guide
- ✅ Participant user guide
- ✅ Technical architecture documentation
- ✅ API documentation
- ✅ Deployment guide
- ✅ Troubleshooting guide

---

## Risk Assessment & Mitigation

### High-Risk Areas

**1. AI Character Believability**
- **Risk:** AI responses feel robotic or generic
- **Mitigation:**
  - Use "NOT BEING A HELPFUL ASSISTANT" behavioral prompting
  - Include character traits in identity block
  - Test with diverse scenarios
  - Refine prompts iteratively
- **Confidence:** High (proven in THERAPIST)

**2. Voice Integration Complexity**
- **Risk:** Voice latency or connection issues
- **Mitigation:**
  - Use proven THERAPIST patterns
  - Implement text chat fallback
  - Test with multiple devices
  - Use ElevenLabs' production-grade infrastructure
- **Confidence:** High (proven in THERAPIST + NegotiationMaster)

**3. Memory Compression Algorithm**
- **Risk:** AI loses important context over time
- **Mitigation:**
  - Inspired by THERAPIST's 3-4 page limit
  - Keep key relationships and decisions
  - Test with long simulations (20+ events)
  - Facilitator can review AI memory (debug view)
- **Confidence:** Medium (needs testing)

### Medium-Risk Areas

**4. Real-time Voice Coordination**
- **Risk:** Multiple participants speaking at once
- **Mitigation:**
  - Use turn-taking UI cues
  - Mute participants when AI speaking
  - Test with 3-4 participants per meeting
- **Confidence:** Medium (needs testing)

**5. Claude API Costs**
- **Risk:** High API costs with 8 AI characters
- **Mitigation:**
  - Use Claude Haiku for simple responses
  - Use Claude Sonnet for complex reasoning
  - Optimize prompt sizes (compress memory)
  - Monitor usage and set alerts
- **Confidence:** High (cost predictable)

### Low-Risk Areas

**6. Voting System**
- **Risk:** Calculation errors or edge cases
- **Mitigation:**
  - Simple 2/3 majority formula
  - Database constraints prevent duplicates
  - Comprehensive unit tests
- **Confidence:** Very High (straightforward logic)

**7. Database Performance**
- **Risk:** Slow queries with 20+ participants
- **Mitigation:**
  - Already optimized (< 2s load times)
  - Indexes on all foreign keys
  - RLS policies optimized
- **Confidence:** Very High (already tested)

---

## Dependencies & Prerequisites

### External Services
- ✅ Supabase (database, auth, realtime, storage) - **Active**
- ⏳ Anthropic Claude API (AI cognitive system) - **Needs API key**
- ⏳ ElevenLabs API (voice synthesis) - **Needs API key**
- ⏳ FastAPI backend hosting (Railway/Render/AWS) - **Needs deployment**

### Development Environment
- ✅ React 19 + TypeScript - **Configured**
- ✅ Vite build system - **Configured**
- ✅ Tailwind CSS - **Configured**
- ⏳ FastAPI + Python 3.10+ - **Needs setup**
- ⏳ ElevenLabs Python SDK - **Needs install**

### Reference Implementations
- ✅ THERAPIST project available locally - **Ready to adapt**
- ⏳ NegotiationMaster patterns - **Needs review**

---

## Resource Allocation

### Development Team
- **Primary Developer:** 1 full-stack developer (you + Claude Code)
- **Development Pace:** Natural pace, no hard deadline
- **Estimated Hours:** 50-70 hours over 8-10 weeks (6-9 hours/week)

### API Costs (Estimated)
**Anthropic Claude API:**
- Haiku: $0.25 / 1M input tokens, $1.25 / 1M output tokens
- Sonnet: $3 / 1M input tokens, $15 / 1M output tokens
- Estimated: $50-150/month during development, $200-500/month in production

**ElevenLabs API:**
- Conversational AI: Pay-as-you-go pricing
- Estimated: $100-300/month in production (depends on usage)

**Total Estimated Monthly Cost:** $300-800 in production

### Infrastructure Costs
- Supabase: Free tier (sufficient for MVP)
- FastAPI hosting: $5-25/month (Railway/Render)
- Domain + SSL: $15/year

---

## Post-MVP Roadmap (Future Enhancements)

### Phase 2: Advanced Features (After MVP)
1. **AI-to-AI Meetings** (remove 1 AI constraint)
   - Multi-AI voice coordination
   - More complex negotiation scenarios

2. **Multiple Simulation Templates**
   - Ancient Rome scenario
   - Medieval Europe scenario
   - Modern corporate scenario

3. **Analytics Dashboard**
   - Participant engagement metrics
   - AI behavior analysis
   - Voting patterns visualization
   - Learning outcomes assessment

4. **Facilitator AI Assistant**
   - Suggest discussion prompts
   - Detect participant disengagement
   - Recommend interventions

5. **Mobile Native Apps**
   - iOS and Android apps
   - Push notifications
   - Offline mode for character review

6. **Advanced Memory System**
   - Semantic search in memory
   - Relationship graphs
   - Emotional state tracking

---

## Conclusion

This roadmap provides a **clear, achievable path** to a production-ready MVP in **8-10 weeks**. We have:

✅ **Solid Foundation:** 40% complete, performance optimized
✅ **Proven Patterns:** THERAPIST cognitive architecture + voice integration
✅ **Clear Priorities:** AI system first, voice layer in parallel
✅ **Risk Mitigation:** Text fallback, memory compression, behavioral prompting
✅ **No Hard Deadline:** Natural pace, focus on quality

**Next Steps:**
1. Complete Sprint 0 documentation (this week)
2. Begin Sprint 1: Voting System (Week 1-2)
3. Extract THERAPIST patterns into reference guides
4. Set up Anthropic and ElevenLabs API keys
5. Start daily/weekly check-ins to track progress

**Target Completion:** Mid to Late December 2025

Let's build this. 🚀
