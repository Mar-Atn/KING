# AI Voting API - Interface Documentation

**Purpose:** Define API interface for AI characters to vote programmatically

**Sprint:** Sprint 1 (Voting System) - Sprint 3-4 (AI Implementation)

**Date:** October 29, 2025

---

## Overview

AI characters need to vote autonomously during simulations. This document defines the API interface that AI systems will use to cast votes on behalf of AI participants.

**Key Principles:**
1. AI votes use the same database tables as human votes
2. AI uses service-level API (backend → database directly)
3. Voting decisions made by AI cognitive system (4-block architecture)
4. All votes logged identically (no distinction between AI and human votes in database)

---

## Vote Submission API

### **Function: `submitAIVote()`**

**Location:** Future implementation in `src/services/aiVotingService.ts`

**Purpose:** Submit vote on behalf of AI character

**Parameters:**
```typescript
interface AIVoteSubmission {
  sessionId: string           // Vote session ID
  aiRoleId: string           // AI character's role ID
  aiClanId: string           // AI character's clan ID
  choice: {
    chosenRoleId?: string    // For choose_person format
    yesNoChoice?: 'yes' | 'no' | 'abstain'  // For yes_no format
  }
  reasoning?: string         // Optional: AI's internal reasoning (for logging)
}

async function submitAIVote(submission: AIVoteSubmission): Promise<{
  success: boolean
  voteId?: string
  error?: string
}>
```

**Implementation (Future - Sprint 3-4):**
```typescript
// src/services/aiVotingService.ts

import { supabase } from '../lib/supabase'

export async function submitAIVote(submission: AIVoteSubmission) {
  try {
    // Validate session is open
    const { data: session, error: sessionError } = await supabase
      .from('vote_sessions')
      .select('status')
      .eq('session_id', submission.sessionId)
      .single()

    if (sessionError) throw sessionError
    if (session.status !== 'open') {
      return { success: false, error: 'Vote session is not open' }
    }

    // Check if AI already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('vote_id')
      .eq('session_id', submission.sessionId)
      .eq('voter_role_id', submission.aiRoleId)
      .maybeSingle()

    if (existingVote) {
      return { success: false, error: 'AI already voted in this session' }
    }

    // Submit vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        session_id: submission.sessionId,
        voter_role_id: submission.aiRoleId,
        voter_clan_id: submission.aiClanId,
        chosen_role_id: submission.choice.chosenRoleId || null,
        yes_no_choice: submission.choice.yesNoChoice || null
      })
      .select('vote_id')
      .single()

    if (voteError) throw voteError

    // Log AI reasoning (optional, for debugging/analysis)
    if (submission.reasoning) {
      await supabase.from('event_log').insert({
        run_id: session.run_id,
        event_type: 'ai_vote_reasoning',
        event_data: {
          session_id: submission.sessionId,
          ai_role_id: submission.aiRoleId,
          reasoning: submission.reasoning,
          choice: submission.choice
        }
      })
    }

    return { success: true, voteId: vote.vote_id }

  } catch (error) {
    console.error('AI vote submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

---

## AI Decision-Making Flow

### **Step 1: Detect Active Vote**

AI system monitors for new vote sessions:

```typescript
// Subscribe to vote_sessions for AI's current run
const channel = supabase
  .channel(`vote_sessions_${runId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'vote_sessions',
      filter: `run_id=eq.${runId}`
    },
    async (payload) => {
      const session = payload.new

      // Check if AI should vote in this session
      const shouldVote = await checkIfAIShouldVote(aiRoleId, session)

      if (shouldVote) {
        // Trigger AI decision-making
        await makeVotingDecision(aiRoleId, session)
      }
    }
  )
  .subscribe()
```

### **Step 2: Determine Eligibility**

Check if AI character is eligible to vote:

```typescript
async function checkIfAIShouldVote(
  aiRoleId: string,
  session: VoteSession
): Promise<boolean> {
  // Check scope
  if (session.scope === 'all') {
    return true // All participants vote
  }

  if (session.scope === 'clan_only') {
    // Check if AI is in the voting clan
    const { data: role } = await supabase
      .from('roles')
      .select('clan_id')
      .eq('role_id', aiRoleId)
      .single()

    return role?.clan_id === session.scope_clan_id
  }

  return false
}
```

### **Step 3: Make Decision (4-Block Cognitive System)**

AI uses its cognitive system to decide:

```typescript
async function makeVotingDecision(
  aiRoleId: string,
  session: VoteSession
): Promise<void> {
  // Load AI context (4 blocks)
  const context = await loadAIContext(aiRoleId)

  // Build voting prompt
  const prompt = buildVotingPrompt(context, session)

  // Call LLM (Claude)
  const decision = await callClaude(prompt)

  // Extract choice from decision
  const choice = parseVotingDecision(decision, session.vote_format)

  // Submit vote
  await submitAIVote({
    sessionId: session.session_id,
    aiRoleId,
    aiClanId: context.identity.clan_id,
    choice,
    reasoning: decision.reasoning
  })

  // Trigger reflection (update memory & goals)
  await triggerReflection(aiRoleId, {
    eventType: 'vote_cast',
    sessionId: session.session_id,
    choice,
    reasoning: decision.reasoning
  })
}
```

### **Step 4: Voting Prompt Structure**

```typescript
function buildVotingPrompt(context: AIContext, session: VoteSession): string {
  return `
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

VOTING DECISION REQUIRED:

Title: ${session.proposal_title}
Description: ${session.proposal_description}

${session.vote_format === 'choose_person' ? `
You must choose ONE person to vote for from these candidates:
${getEligibleCandidateNames(session.eligible_candidates)}

Who do you vote for and why? Consider:
- Your clan's interests
- Your personal relationships
- Strategic alliances
- Past interactions with candidates

Format your response as:
{
  "choice": "candidate_role_id",
  "reasoning": "Explain your strategic thinking..."
}
` : `
You must vote YES, NO, or ABSTAIN.

Consider:
- Your clan's values and priorities
- Your strategic objectives
- Potential consequences of each choice
- Your relationships with other participants

Format your response as:
{
  "choice": "yes" | "no" | "abstain",
  "reasoning": "Explain your strategic thinking..."
}
`}

Make your decision based on your character's personality, clan loyalty, and strategic goals.
`
}
```

---

## AI Voting Timing

### **Immediate vs. Delayed Voting**

**Option 1: Immediate Voting**
- AI votes within 5-15 seconds of vote opening
- Pros: Fast, simple
- Cons: Unrealistic (real people take time)

**Option 2: Delayed Voting (Recommended)**
```typescript
async function makeVotingDecision(aiRoleId: string, session: VoteSession) {
  // Random delay: 30-90 seconds
  const delaySeconds = 30 + Math.random() * 60

  setTimeout(async () => {
    // Make decision and vote
    // (implementation as shown above)
  }, delaySeconds * 1000)
}
```

**Option 3: Strategic Timing**
```typescript
// AI votes based on personality trait
async function calculateVotingDelay(aiContext: AIContext): Promise<number> {
  const personality = aiContext.identity_context.personality

  if (personality.includes('decisive') || personality.includes('quick')) {
    return 15 + Math.random() * 30 // 15-45 seconds
  } else if (personality.includes('cautious') || personality.includes('thoughtful')) {
    return 60 + Math.random() * 60 // 60-120 seconds
  } else {
    return 30 + Math.random() * 60 // 30-90 seconds (default)
  }
}
```

---

## AI Vote Changes (Not Allowed)

Once AI votes, the vote is final (same as humans):

```typescript
// This should return error
const result = await submitAIVote({
  sessionId: 'session-123',
  aiRoleId: 'ai-role-456',
  // ... other params
})

if (!result.success && result.error === 'AI already voted in this session') {
  console.log('AI cannot change vote after submission')
}
```

---

## Testing AI Votes

### **Test Function (Development Only)**

```typescript
// src/services/aiVotingService.ts

export async function testAIVote(params: {
  sessionId: string
  aiRoleId: string
  choice: any
}) {
  // Load AI context
  const context = await loadAIContext(params.aiRoleId)

  // Submit test vote
  const result = await submitAIVote({
    sessionId: params.sessionId,
    aiRoleId: params.aiRoleId,
    aiClanId: context.identity.clan_id,
    choice: params.choice,
    reasoning: '[TEST] Manual test vote'
  })

  console.log('Test AI vote result:', result)
  return result
}
```

### **Usage Example:**

```typescript
// In browser console (development):
import { testAIVote } from './services/aiVotingService'

await testAIVote({
  sessionId: 'session-uuid',
  aiRoleId: 'ai-role-uuid',
  choice: { chosenRoleId: 'candidate-uuid' }
})
```

---

## Database Schema Reference

AI votes use the same `votes` table as human votes:

```sql
CREATE TABLE votes (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id),
  voter_role_id UUID NOT NULL REFERENCES roles(role_id), -- AI or human role
  voter_clan_id UUID NOT NULL REFERENCES clans(clan_id),

  -- Choice (one of these is set)
  chosen_role_id UUID REFERENCES roles(role_id),
  yes_no_choice TEXT CHECK (yes_no_choice IN ('yes', 'no', 'abstain')),

  cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, voter_role_id) -- One vote per session
);
```

**Key Points:**
- `voter_role_id` can be AI or human (no distinction in schema)
- `cast_at` timestamp shows when vote was cast
- UNIQUE constraint prevents duplicate votes

---

## Integration Timeline

### **Sprint 1 (Current):** Voting System Complete
- ✅ Human voting fully functional
- ✅ Database schema supports AI votes
- ✅ API interface documented

### **Sprint 3-4:** AI Implementation
- Implement `aiVotingService.ts`
- Build AI cognitive system (4-block)
- Implement voting decision-making
- Test AI voting with real simulations

### **Sprint 5-6:** Voice Integration
- AI can "discuss" voting decisions (voice)
- AI can explain reasoning to humans
- Integrate voting with AI conversation memory

---

## Security Considerations

### **1. Prevent Human Access to AI Voting API**

```typescript
// Only backend/service code can call this
// Frontend should never have direct access
export async function submitAIVote(submission: AIVoteSubmission) {
  // Verify this is server-side call
  if (typeof window !== 'undefined') {
    throw new Error('AI voting API cannot be called from client')
  }

  // Verify role is actually AI
  const { data: role } = await supabase
    .from('roles')
    .select('participant_type')
    .eq('role_id', submission.aiRoleId)
    .single()

  if (role?.participant_type !== 'ai') {
    throw new Error('Cannot submit AI vote for human participant')
  }

  // Proceed with vote submission...
}
```

### **2. Rate Limiting**

```typescript
// Prevent AI from spamming votes
const aiVoteAttempts = new Map<string, number>()

export async function submitAIVote(submission: AIVoteSubmission) {
  const key = `${submission.aiRoleId}_${submission.sessionId}`
  const attempts = aiVoteAttempts.get(key) || 0

  if (attempts > 3) {
    throw new Error('Too many vote attempts')
  }

  aiVoteAttempts.set(key, attempts + 1)

  // Clear after success
  const result = await /* ... submit vote ... */

  if (result.success) {
    aiVoteAttempts.delete(key)
  }

  return result
}
```

---

## Summary

**AI Voting Architecture:**
1. AI monitors for new vote sessions (real-time subscription)
2. Checks eligibility (scope, clan membership)
3. Makes decision using 4-block cognitive system
4. Submits vote via `submitAIVote()` API
5. Triggers reflection to update memory & goals

**Database:**
- AI and human votes stored identically in `votes` table
- No special handling needed

**Timeline:**
- Sprint 1: Schema + API interface ready ✅
- Sprint 3-4: AI implementation
- Sprint 5-6: Voice integration

**Next Steps (Sprint 3-4):**
1. Implement `src/services/aiVotingService.ts`
2. Build AI cognitive prompt templates
3. Integrate with LLM (Claude API)
4. Test with simulated AI votes
5. Full integration testing with humans + AI

---

**End of AI Voting API Documentation**
