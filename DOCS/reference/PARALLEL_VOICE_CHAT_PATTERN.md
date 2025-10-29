# Parallel Voice + Text Chat Pattern for KING

**Conceptual Pattern** (inspired by NegotiationMaster implementation)

---

## Overview

In meetings, participants should have **two communication channels** that work in parallel:
1. **Voice Channel** (primary) - Real-time voice conversation via ElevenLabs
2. **Text Chat Channel** (support) - Text messages for fallback, clarification, or data sharing

**Key Principle:** Same AI cognitive system powers both channels. The AI "brain" (4-block context) is channel-agnostic.

---

## Why Parallel Channels?

### Voice Channel Benefits
- ✅ Natural, human-like conversation
- ✅ Faster than typing
- ✅ Emotional nuance (tone, pacing)
- ✅ Feels like real face-to-face meeting

### Text Chat Benefits
- ✅ **Fallback** when voice connection drops
- ✅ **Clarification** during voice conversation ("Can you repeat that vote count?")
- ✅ **Data sharing** (links, numbers, complex names hard to say aloud)
- ✅ **AI-to-AI communication** (no need for voice synthesis)
- ✅ **Accessibility** (participants with hearing/speaking difficulties)
- ✅ **Reference** (easy to scroll back and review)

---

## Architecture

```
Meeting Room
│
├─ Voice Channel (ElevenLabs)
│  │
│  ├─ User speaks → ASR → Text
│  ├─ Text → /v1/chat/completions (FastAPI)
│  ├─ AI responds (4-block context) → Text
│  ├─ Text → TTS → User hears AI
│  └─ Transcript stored: {role: 'user', content: '...', channel: 'voice'}
│
├─ Text Chat Channel (Direct API)
│  │
│  ├─ User types → Text
│  ├─ Text → /api/ai/respond (Direct API call)
│  ├─ AI responds (same 4-block context) → Text
│  ├─ Text displayed in chat UI
│  └─ Transcript stored: {role: 'user', content: '...', channel: 'text'}
│
└─ Unified Transcript
   │
   ├─ Merges voice + text messages chronologically
   ├─ Used for reflection after meeting
   └─ Displayed in meeting UI (full history)
```

**Key Insight:** Both channels use the **same AI context** (4 blocks). The AI doesn't care if input came from voice or text - it responds based on its cognitive state.

---

## Implementation Pattern

### 1. Meeting Room Component

```typescript
// src/pages/MeetingRoom.tsx
export function MeetingRoom({ meetingId, myRoleId, participants }) {
  const [unifiedTranscript, setUnifiedTranscript] = useState<Message[]>([])
  const [voiceActive, setVoiceActive] = useState(false)

  // Unified message handler (voice or text)
  const addMessage = (message: Message) => {
    setUnifiedTranscript(prev => [...prev, {
      ...message,
      timestamp: new Date().toISOString(),
      messageId: uuid()
    }])

    // Store in database
    await supabase.from('meeting_messages').insert({
      meeting_id: meetingId,
      role_id: message.roleId,
      content: message.content,
      channel: message.channel,  // 'voice' or 'text'
      timestamp: message.timestamp
    })
  }

  return (
    <div className="meeting-room">
      {/* Voice Channel */}
      <VoiceChannel
        meetingId={meetingId}
        myRoleId={myRoleId}
        participants={participants}
        onMessage={(msg) => addMessage({ ...msg, channel: 'voice' })}
        isActive={voiceActive}
        onActiveChange={setVoiceActive}
      />

      {/* Text Chat Channel (always available) */}
      <TextChatChannel
        meetingId={meetingId}
        myRoleId={myRoleId}
        participants={participants}
        onMessage={(msg) => addMessage({ ...msg, channel: 'text' })}
      />

      {/* Unified Transcript (voice + text merged) */}
      <TranscriptPanel messages={unifiedTranscript} />
    </div>
  )
}
```

### 2. Voice Channel Component

```typescript
// src/components/VoiceChannel.tsx
export function VoiceChannel({ meetingId, myRoleId, participants, onMessage, isActive, onActiveChange }) {
  const [conversationId, setConversationId] = useState<string | null>(null)

  const startVoice = async () => {
    // Initialize ElevenLabs agent for this meeting
    const { data } = await fetch('/api/voice/start-meeting', {
      method: 'POST',
      body: JSON.stringify({
        meetingId,
        roleId: myRoleId,
        participants
      })
    }).then(r => r.json())

    const { agentId, conversationId } = data

    // Connect to ElevenLabs
    const conversation = await Conversation.startSession({
      agentId,
      onMessage: (message) => {
        // Voice message received
        onMessage({
          roleId: message.roleId,
          content: message.content,
          channel: 'voice'
        })
      }
    })

    setConversationId(conversationId)
    onActiveChange(true)
  }

  const endVoice = async () => {
    // End ElevenLabs session
    await conversation.endSession()

    // Trigger reflection for AI participants
    await fetch('/api/voice/end-meeting', {
      method: 'POST',
      body: JSON.stringify({ meetingId, conversationId })
    })

    setConversationId(null)
    onActiveChange(false)
  }

  return (
    <div className="voice-channel">
      {!isActive ? (
        <button onClick={startVoice}>
          🎤 Start Voice Conversation
        </button>
      ) : (
        <button onClick={endVoice}>
          🛑 End Voice
        </button>
      )}

      {isActive && (
        <VoiceIndicator participants={participants} />
      )}
    </div>
  )
}
```

### 3. Text Chat Channel Component

```typescript
// src/components/TextChatChannel.tsx
export function TextChatChannel({ meetingId, myRoleId, participants, onMessage }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const sendTextMessage = async () => {
    if (!input.trim()) return

    setSending(true)

    // Send to AI participants (if any in meeting)
    const aiParticipants = participants.filter(p => p.participant_type === 'ai')

    // Add user message
    onMessage({
      roleId: myRoleId,
      content: input,
      channel: 'text'
    })

    // Get AI responses (for each AI in meeting)
    for (const aiParticipant of aiParticipants) {
      const response = await fetch('/api/ai/meeting/respond', {
        method: 'POST',
        body: JSON.stringify({
          roleId: aiParticipant.role_id,
          meetingId,
          message: input,
          channel: 'text'  // AI knows this is text, not voice
        })
      }).then(r => r.json())

      // Add AI response
      onMessage({
        roleId: aiParticipant.role_id,
        content: response.content,
        channel: 'text'
      })
    }

    setInput('')
    setSending(false)
  }

  return (
    <div className="text-chat-channel">
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button onClick={sendTextMessage} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}
```

### 4. Unified Transcript Panel

```typescript
// src/components/TranscriptPanel.tsx
export function TranscriptPanel({ messages }) {
  return (
    <div className="transcript-panel">
      <h3>Meeting Transcript</h3>
      <div className="messages">
        {messages.map(msg => (
          <div
            key={msg.messageId}
            className={`message ${msg.channel}`}
          >
            <div className="message-header">
              <span className="speaker">{msg.roleName}</span>
              <span className="channel-badge">
                {msg.channel === 'voice' ? '🎤' : '💬'}
              </span>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Backend API Endpoints

### 1. Start Meeting (Voice)

```typescript
// POST /api/voice/start-meeting
async function startMeeting(req, res) {
  const { meetingId, roleId, participants } = req.body

  // Load AI context for each AI participant
  const aiParticipants = participants.filter(p => p.participant_type === 'ai')

  // Generate intent notes for each AI
  const intentNotes = await Promise.all(
    aiParticipants.map(async (aiRole) => {
      const context = await loadAIContext(aiRole.role_id)
      return {
        roleId: aiRole.role_id,
        intentNotes: await generateIntentNotes(context, participants)
      }
    })
  )

  // Create conversation ID
  const conversationId = `meeting_${meetingId}_${Date.now()}`

  // Store conversation metadata
  activeMeetings[conversationId] = {
    meetingId,
    participants,
    intentNotes,
    messages: [],
    startedAt: new Date().toISOString()
  }

  // Get ElevenLabs agent ID
  const agentId = process.env.ELEVENLABS_AGENT_ID

  res.json({
    success: true,
    data: {
      agentId,
      conversationId,
      intentNotes
    }
  })
}
```

### 2. AI Text Response

```typescript
// POST /api/ai/meeting/respond
async function aiMeetingRespond(req, res) {
  const { roleId, meetingId, message, channel } = req.body

  // Load AI context (4 blocks)
  const context = await loadAIContext(roleId)

  // Load meeting transcript so far
  const transcript = await getMeetingTranscript(meetingId)

  // Build system prompt
  const systemPrompt = `
${context.fixed_context}

---

IDENTITY:
${JSON.stringify(context.identity_context, null, 2)}

---

MEMORY:
${JSON.stringify(context.memory_context, null, 2)}

---

GOALS & PLANS:
${JSON.stringify(context.goals_context, null, 2)}

---

MEETING TRANSCRIPT SO FAR:
${transcript}

---

You are in a meeting. ${channel === 'text' ? 'Respond via text (1-2 sentences).' : 'Respond naturally (voice conversation).'}
`

  // Call Claude
  const response = await claudeClient.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      { role: 'user', content: message }
    ]
  })

  const aiResponse = response.content[0].text

  // Store in meeting transcript
  await supabase.from('meeting_messages').insert({
    meeting_id: meetingId,
    role_id: roleId,
    content: aiResponse,
    channel,
    timestamp: new Date().toISOString()
  })

  res.json({
    success: true,
    content: aiResponse
  })
}
```

### 3. End Meeting (Voice + Reflection)

```typescript
// POST /api/voice/end-meeting
async function endMeeting(req, res) {
  const { meetingId, conversationId } = req.body

  // Get full transcript (voice + text)
  const transcript = await supabase
    .from('meeting_messages')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('timestamp', { ascending: true })

  // Build unified transcript text
  const transcriptText = transcript.data
    .map(msg => `${msg.role_name} (${msg.channel}): ${msg.content}`)
    .join('\n')

  // Trigger reflection for each AI participant
  const meeting = activeMeetings[conversationId]
  const aiParticipants = meeting.participants.filter(p => p.participant_type === 'ai')

  for (const aiRole of aiParticipants) {
    await triggerReflection({
      roleId: aiRole.role_id,
      eventType: 'meeting',
      transcript: transcriptText
    })
  }

  // Clean up
  delete activeMeetings[conversationId]

  res.json({
    success: true,
    transcript_length: transcript.data.length,
    ai_reflections_triggered: aiParticipants.length
  })
}
```

---

## User Experience Flow

### Scenario: Human meets AI character

**1. Meeting Starts**
```
User clicks "Join Meeting"
  ↓
Voice channel initializes (ElevenLabs)
  ↓
AI character greets: "Hello! Ready to discuss the vote?"
  ↓
Text chat is also available below
```

**2. During Meeting**
```
User speaks: "What do you think about Alexandros?"
  ↓ (via voice)
AI responds: "Well, he's ambitious... I'm not sure we can trust him."
  ↓
User types: "What about the Achaean clan?"
  ↓ (via text)
AI responds (text): "The Achaeans are unpredictable. I'd be cautious."
  ↓
Both messages appear in unified transcript
```

**3. Voice Connection Drops**
```
Voice disconnects (network issue)
  ↓
User continues via text: "Can you repeat that?"
  ↓
AI responds via text: "I said the Achaeans are unpredictable."
  ↓
User re-enables voice when connection stable
  ↓
Conversation continues via voice
```

**4. Meeting Ends**
```
User clicks "End Meeting"
  ↓
Full transcript saved (voice + text merged)
  ↓
AI reflection triggered
  ↓
AI memory & goals updated based on meeting
```

---

## Database Schema

### meeting_messages table
```sql
CREATE TABLE meeting_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(meeting_id),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    content TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('voice', 'text')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meeting_messages_meeting ON meeting_messages(meeting_id, timestamp);
```

**Key Field:** `channel` distinguishes voice vs. text messages.

---

## Benefits of This Pattern

### 1. Resilience
- Voice fails → Text fallback immediately available
- No conversation interruption

### 2. Flexibility
- Some participants prefer voice
- Some prefer text
- Both work simultaneously

### 3. Unified Reflection
- AI sees complete context (voice + text)
- No separate handling needed
- Same cognitive system processes both

### 4. Accessibility
- Hearing impaired → Use text
- Speaking impaired → Use text
- Low bandwidth → Use text
- Everyone else → Use voice

### 5. AI-to-AI Communication
- AI characters can "meet" without voice synthesis
- Faster processing (no ASR/TTS overhead)
- Still feels like real conversation to facilitator watching

---

## KING-Specific Considerations

### 1. Max 1 AI Per Mixed Meeting (Voice Constraint)
- **Constraint from KING_AI_DESIGN.md:** Only 1 AI in human-AI mixed voice meetings
- **Reason:** Multi-AI voice coordination is complex
- **Solution:**
  - Human-only meetings → All use voice/text freely
  - 1 Human + 1 AI → Both use voice
  - Multiple humans + 1 AI → All use voice
  - AI-only meetings → Use text (no voice needed)

### 2. Public Speeches (Voice Primary)
- Speeches should be primarily voice (more dramatic)
- Text chat available for Q&A questions
- Transcript includes both speech audio → text + text questions

### 3. Vote Discussions (Text May Be Better)
- Vote counts, names, numbers → Text clearer
- But strategic discussions → Voice feels more natural
- **Recommendation:** Support both, let users choose

---

## Implementation Priority

**Sprint 5-6: Voice Integration** (from MVP_ROADMAP.md)
1. ✅ Implement voice channel first (primary feature)
2. ✅ Add text chat channel in parallel (same sprint)
3. ✅ Unified transcript panel (essential for UX)
4. ✅ Test with voice enabled → voice disabled → text fallback
5. ✅ Reflection works with both channels

**Effort:** 2-3 days to add text channel alongside voice (minimal overhead).

---

## Key Takeaways

1. **Same brain, two mouths:** AI cognitive system (4 blocks) is channel-agnostic
2. **Unified transcript:** Merge voice + text chronologically for reflection
3. **Fallback by design:** Text chat is not an afterthought, it's a core feature
4. **User choice:** Don't force voice or text - let users pick based on situation
5. **Database field:** Add `channel` column to distinguish voice vs. text messages

---

**This pattern is production-proven** (inspired by NegotiationMaster). Both channels work seamlessly because they share the same cognitive backend. 🎯
