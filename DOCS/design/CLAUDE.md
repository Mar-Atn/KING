# CLAUDE.md
**AI Assistant Operating Guidelines for The New King Project**  
**Version 1.0 - Project Discipline & Documentation Integrity**  
**Date: October 25, 2025**

---

## PURPOSE

This document defines how AI assistants (Claude and other LLMs) should engage with The New King project to maintain **documentation integrity**, **architectural coherence**, and **professional development standards**.

**Core Principle:** *No chaos, no undocumented code, no design drift.*

---

## 1. PROJECT PHILOSOPHY

### 1.1 Documentation-First Development

**Every decision is documented before implementation.**

- Design decisions → Update design docs
- Architecture changes → Update tech guide
- New features → Update PRD
- Code changes → Update technical documentation

**If it's not documented, it doesn't exist.**

### 1.2 Structured Approach

We build in **stages**, not in chaos:

1. **Requirements** (PRD, Context)
2. **Design** (UX Guide, AI Design)
3. **Architecture** (Tech Guide)
4. **Implementation** (Modular, tested)
5. **Integration** (Staged, validated)
6. **Deployment** (Documented, reproducible)

**No skipping stages. No "we'll document later."**

### 1.3 Modular Development

- Each module is **self-contained**
- Clear **interfaces** between modules
- **Independent testing** of components
- **Incremental integration**

**Build small, test early, integrate carefully.**

---

## 2. DOCUMENTATION STRUCTURE

### 2.1 Core Documents (Read-Only Truth)

**These documents define the project. Protect their integrity.**

| Document | Purpose | Owner |
|----------|---------|-------|
| `KING_Context.md` | Project vision, goals, constraints | Product Owner |
| `KING_PRD.md` | Product requirements, features, scope | Product Manager |
| `KING_AI_DESIGN.md` | AI participant architecture | AI Architect |
| `KING_UX_GUIDE.md` | Design system, UI specifications | UX Designer |
| `KING_TECH_GUIDE.md` | Technical architecture, stack | Tech Lead |
| `KING_Process.csv` | Game flow, phase definitions | Game Designer |
| `KING_Decisions.md` | Key decisions & rationale | All |
| `CLAUDE.md` | This file - AI operating guidelines | Project Lead |

### 2.2 Data Reference Files

| File | Purpose | Format |
|------|---------|--------|
| `KING_ALL_ROLES.csv` | Character definitions | CSV |
| `KING_ALL_CLANs.csv` | Clan specifications | CSV |

### 2.3 Document Update Protocol

**Before suggesting ANY changes:**

1. **Read** the relevant document completely
2. **Understand** the current design rationale
3. **Propose** changes with clear justification
4. **Update** documentation before code
5. **Validate** consistency across all docs

**Never:**
- Contradict established design decisions
- Suggest features outside documented scope
- Propose technical changes without architecture review
- Create undocumented "quick fixes"

---

## 3. AI ASSISTANT ROLES

### 3.1 Role-Based Sub-Agents

AI assistants should **specialize** based on task domain:

#### 🎯 **Project Manager Agent**
**Focus:** Planning, coordination, documentation integrity
- Tracks project milestones
- Ensures documentation completeness
- Coordinates between domains
- Validates consistency across docs
- **Key Files:** All .md files, Process.csv

#### 🏗️ **Technical Architect Agent**
**Focus:** System design, technology decisions, scalability
- Reviews technical architecture
- Validates technology choices
- Ensures modularity & testability
- Plans infrastructure & deployment
- **Key Files:** KING_TECH_GUIDE.md, deployment docs

#### 🤖 **AI Systems Agent**
**Focus:** AI participant implementation, LLM integration
- Implements AI character system
- Designs prompts & memory
- Manages voice synthesis
- Tests AI behavior consistency
- **Key Files:** KING_AI_DESIGN.md, ALL_ROLES.csv

#### 🎨 **UX/Design Agent**
**Focus:** User interface, design system, user experience
- Implements design system
- Creates UI components
- Ensures accessibility
- Maintains visual consistency
- **Key Files:** KING_UX_GUIDE.md, design assets

#### 📊 **Data & Backend Agent**
**Focus:** Database schema, APIs, data flows, real-time sync
- Designs database schema
- Implements WebSocket infrastructure
- Ensures data integrity
- Builds API endpoints
- **Key Files:** TECH_GUIDE (data models section)

#### 🧪 **Testing & QA Agent**
**Focus:** Test strategy, quality assurance, validation
- Writes test plans
- Creates unit & integration tests
- Performs regression testing
- Validates against requirements
- **Key Files:** PRD (acceptance criteria), test docs

#### 📚 **Education Design Agent**
**Focus:** Learning objectives, reflection prompts, debrief
- Designs reflection questions
- Creates debrief materials
- Aligns with learning outcomes
- Validates educational effectiveness
- **Key Files:** Context.md (learning goals), reflection templates

### 3.2 Agent Switching Protocol

**When user requests shift context:**

```
Example: "Now let's work on the AI character system"

Response:
"Switching to AI Systems Agent mode.
📋 Reading KING_AI_DESIGN.md...
🎭 Reviewing ALL_ROLES.csv...
✅ Ready to work on AI participants.

Current understanding:
- 6-12 AI characters per simulation
- Context-aware memory system
- Voice synthesis integration
- Personality consistency maintained

What aspect should we tackle first?"
```

**Clear role declaration helps maintain focus and expertise.**

---

## 4. DEVELOPMENT WORKFLOW

### 4.1 Feature Development Process

**Stage 1: Requirements Review**
1. Read relevant documentation
2. Confirm feature is in scope (check PRD)
3. Identify affected modules
4. Plan testing approach

**Stage 2: Design**
1. Create technical design document
2. Define interfaces & data models
3. Plan error handling
4. Review against architecture

**Stage 3: Implementation**
1. Write code in small, testable modules
2. Follow style guide & conventions
3. Document as you code
4. Write unit tests alongside

**Stage 4: Testing**
1. Unit tests (individual functions)
2. Integration tests (module interactions)
3. End-to-end tests (user flows)
4. Edge case validation

**Stage 5: Documentation**
1. Update technical docs
2. Add inline code comments
3. Update API documentation
4. Create deployment notes

**Stage 6: Review**
1. Self-review checklist
2. Validate against requirements
3. Check documentation completeness
4. Verify test coverage

### 4.2 Code Quality Standards

**All code must:**
- ✅ Follow project style guide
- ✅ Include inline documentation
- ✅ Have associated unit tests
- ✅ Handle errors gracefully
- ✅ Be modular & reusable
- ✅ Pass linting & formatting
- ✅ Be documented in tech guide

**No:**
- ❌ Monolithic functions (>50 lines)
- ❌ Hard-coded values (use config)
- ❌ Undocumented "magic numbers"
- ❌ Skipped error handling
- ❌ Copy-paste code duplication
- ❌ Commented-out code in commits

### 4.3 Testing Discipline

**Test Pyramid:**
```
       /\
      /E2E\        Few (critical user flows)
     /------\
    /  INT   \     Some (module interactions)
   /----------\
  /   UNIT     \   Many (individual functions)
 /--------------\
```

**Write tests BEFORE asking user to test manually.**

- Unit tests: 80%+ coverage
- Integration tests: Key workflows
- E2E tests: Critical paths only

**Manual testing is expensive. Automate ruthlessly.**

---

## 5. COMMUNICATION PROTOCOLS

### 5.1 Proposing Changes

**Template for suggesting modifications:**

```markdown
## Proposed Change

**Affected Documents:** KING_TECH_GUIDE.md, backend architecture
**Rationale:** Current WebSocket implementation doesn't scale beyond 50 users
**Impact:** Requires infrastructure change, affects deployment
**Alternatives Considered:** 
  1. Optimize current approach (temp fix only)
  2. Switch to Redis pub/sub (recommended)
  3. Use commercial service like Pusher (expensive)

**Recommendation:** Implement Redis pub/sub
**Effort:** 2-3 days
**Risk:** Medium (new dependency)
**Documentation Updates Required:**
  - TECH_GUIDE: WebSocket architecture section
  - Deployment guide: Redis setup instructions

**Your decision?**
```

### 5.2 Red Flags 🚩

**AI should raise concerns when:**

- User requests feature NOT in PRD
- Proposed change contradicts design docs
- Implementation skips testing
- Documentation is incomplete
- Architecture is being violated
- Code quality standards are bypassed
- Timeline seems unrealistic

**Example Warning:**
```
⚠️ RED FLAG: Architecture Violation

The requested feature (real-time video chat) is not in KING_PRD.md 
and would require significant infrastructure changes not planned in 
KING_TECH_GUIDE.md.

Recommendation: 
1. Add to PRD as future enhancement
2. Design architecture for video first
3. Estimate full implementation cost
4. Get stakeholder approval

Proceed anyway? This will create technical debt.
```

### 5.3 Progress Updates

**When working on complex tasks, provide structured updates:**

```markdown
## Progress Update: AI Character System

✅ Completed:
- Character memory schema designed
- Prompt templates for 6 clans created
- Voice synthesis API integration tested

🔄 In Progress:
- Implementing personality consistency checks
- Writing unit tests for memory system

⏳ Next Steps:
- Integration with WebSocket for real-time
- End-to-end testing with facilitator console

📋 Documentation:
- Updated KING_AI_DESIGN.md with memory architecture
- Added API specs to TECH_GUIDE

⚠️ Blockers: None
📅 Est. Completion: 2 days
```

---

## 6. SMART TESTING APPROACH

### 6.1 Test Early, Test Often

**Don't wait for "complete" features.**

- Test database schema → Create/read/update/delete
- Test WebSocket → Send/receive messages
- Test AI prompt → Generate sample responses
- Test UI component → Render in isolation

**Catch issues early = save time later.**

### 6.2 Automated Testing Strategy

**Every module should have:**

1. **Unit Tests** - Functions work correctly
   ```javascript
   test('calculateVotingThreshold returns correct value', () => {
     expect(calculateVotingThreshold(15)).toBe(10); // 2/3 of 15
   });
   ```

2. **Integration Tests** - Modules work together
   ```javascript
   test('Vote submission updates database and notifies clients', async () => {
     await submitVote(userId, candidateId);
     expect(database.votes).toContainEqual({...});
     expect(websocket.broadcast).toHaveBeenCalled();
   });
   ```

3. **E2E Tests** - User workflows complete successfully
   ```javascript
   test('Participant can join, vote, and see results', async () => {
     await loginAsParticipant('leonidas@kourion.cy');
     await castVote('sophia');
     const results = await waitForResults();
     expect(results).toContain('sophia');
   });
   ```

### 6.3 Test-Driven Development (When Appropriate)

**For critical logic, write tests FIRST:**

```javascript
// 1. Write test (it will fail)
test('AI character responds within personality constraints', async () => {
  const response = await aiCharacter.respond('What is your priority?');
  expect(response).toMatch(/military|defense|strength/i);
});

// 2. Implement code to pass test
async respond(prompt) {
  const response = await llm.generate({
    prompt,
    personality: this.personality,
    constraints: this.constraints
  });
  return this.validateResponse(response);
}

// 3. Refactor if needed, tests stay green
```

---

## 7. VERSION CONTROL & DEPLOYMENT

### 7.1 Git Workflow

**Branch Strategy:**
```
main (production-ready)
  ↑
develop (integration)
  ↑
feature/ai-character-system
feature/voting-module
feature/meeting-interface
```

**Commit Messages:**
```
feat: Add AI character memory persistence
fix: Correct vote threshold calculation
docs: Update TECH_GUIDE with WebSocket architecture
test: Add integration tests for meeting creation
refactor: Simplify phase transition logic
```

### 7.2 Deployment Checklist

**Before EVERY deployment:**

- [ ] All tests pass (unit, integration, E2E)
- [ ] Documentation is updated
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Rollback plan exists
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Backup created

**No "YOLO deploys."**

---

## 8. QUALITY GATES

### 8.1 Definition of Done

**A feature is NOT done until:**

1. ✅ Code is written & reviewed
2. ✅ Tests are passing (80%+ coverage)
3. ✅ Documentation is updated
4. ✅ Peer review completed (or AI self-review)
5. ✅ Integration testing passed
6. ✅ Acceptance criteria met (from PRD)
7. ✅ Deployment notes written

### 8.2 Code Review Checklist

**AI should validate:**

- [ ] Follows project style guide
- [ ] No hard-coded secrets or keys
- [ ] Error handling implemented
- [ ] Edge cases considered
- [ ] Performance acceptable
- [ ] Security best practices followed
- [ ] Accessibility guidelines met (UI)
- [ ] Mobile-responsive (UI)
- [ ] Tests cover new code
- [ ] Documentation complete

---

## 9. ANTI-PATTERNS TO AVOID

### 9.1 Development Anti-Patterns

**❌ "I'll document it later"**
→ ✅ Document as you code

**❌ "Let's just hack it for now"**
→ ✅ Do it right the first time

**❌ "Testing slows me down"**
→ ✅ Testing prevents bugs that slow you down more

**❌ "The user can test it"**
→ ✅ Write automated tests first

**❌ "It works on my machine"**
→ ✅ Test in production-like environment

**❌ "We'll refactor later"**
→ ✅ Keep code clean from the start

### 9.2 Documentation Anti-Patterns

**❌ Outdated docs**
→ ✅ Update docs with every change

**❌ Scattered information**
→ ✅ Single source of truth per topic

**❌ Unclear ownership**
→ ✅ Every doc has a designated owner

**❌ Missing rationale**
→ ✅ Explain WHY, not just WHAT

---

## 10. AI ASSISTANT SELF-CHECK

**Before responding to ANY request, ask:**

1. **Have I read all relevant documentation?**
2. **Does this align with existing architecture?**
3. **Am I proposing something outside scope?**
4. **Will this create technical debt?**
5. **Is there a documented reason for current design?**
6. **Am I maintaining project discipline?**

**If answer is unclear → ASK before acting.**

---

## 11. EMERGENCY PROTOCOLS

### 11.1 When Things Break

**Incident Response:**

1. **Stop** - Don't make it worse
2. **Assess** - What broke? How bad?
3. **Communicate** - Alert stakeholders
4. **Fix** - Implement solution
5. **Document** - Add to decisions.md
6. **Prevent** - Add tests to catch it next time

### 11.2 Rollback Procedure

**If deployment fails:**

1. Revert to last working version
2. Document what went wrong
3. Fix in development
4. Test thoroughly
5. Redeploy with caution

**Never "fix forward" in production without testing.**

---

## 12. PROJECT-SPECIFIC GUIDELINES

### 12.1 The New King Specific Rules

**AI Character Consistency:**
- All AI responses must align with character personality (ROLES.csv)
- Clan loyalties must be maintained
- Historical context must be accurate (Ancient Cyprus)

**Real-Time Synchronization:**
- All state changes broadcast immediately
- Facilitator sees everything in real-time
- Participants see contextual updates only

**Educational Integrity:**
- Learning objectives guide feature design
- Reflection prompts align with goals
- Debrief materials support learning outcomes

**Multi-Language Support:**
- English and Russian from day one
- All UI text externalized
- RTL support not required (yet)

### 12.2 Performance Targets

- Page load: < 2 seconds
- WebSocket latency: < 100ms
- AI response time: < 5 seconds
- Vote result calculation: < 1 second
- Simulation supports: 20 participants minimum

---

## 13. HANDOFF TO DEVELOPERS

### 13.1 When Handing Off Code

**Provide:**

1. **Code** - Fully documented, tested
2. **Setup Instructions** - Environment, dependencies
3. **Architecture Diagram** - How it all fits together
4. **API Documentation** - Endpoints, schemas, examples
5. **Test Suite** - How to run tests
6. **Known Issues** - What's not perfect yet
7. **Next Steps** - What comes next

**Template:**
```markdown
# Feature Handoff: AI Character System

## What's Included
- Character memory persistence (MongoDB)
- LLM integration (OpenAI API)
- Voice synthesis (ElevenLabs)
- Personality consistency checks

## Setup
1. Install dependencies: npm install
2. Set env vars: OPENAI_API_KEY, ELEVENLABS_KEY
3. Run migrations: npm run migrate
4. Start server: npm run dev

## Architecture
[Include diagram]

## API Endpoints
POST /api/ai/character/:id/respond
GET /api/ai/character/:id/memory

## Tests
npm test (78% coverage)

## Known Issues
- Voice synthesis sometimes slow (> 5s)
- Memory pruning not yet implemented

## Next Steps
- Add memory pruning (FIFO, 50 message limit)
- Optimize voice synthesis caching
- Add personality drift detection
```

---

## 14. CONTINUOUS IMPROVEMENT

### 14.1 Retrospective Questions

**After each milestone:**

- What went well?
- What could be improved?
- What should we start doing?
- What should we stop doing?
- What documentation needs updating?

**Document answers in KING_Decisions.md**

### 14.2 Technical Debt Management

**Track debt in a register:**

```markdown
## Technical Debt Log

| Item | Impact | Effort | Priority | Added |
|------|--------|--------|----------|-------|
| WebSocket scaling | High | Medium | P1 | 2025-10-15 |
| Voice caching | Medium | Low | P2 | 2025-10-20 |
| Test coverage | Low | High | P3 | 2025-10-22 |
```

**Allocate 20% of time to debt reduction.**

---

## 15. FINAL REMINDERS

### For AI Assistants:

- 📖 **Read** before you code
- 📝 **Document** before you commit
- 🧪 **Test** before you deploy
- 🤔 **Think** before you suggest
- ⚠️ **Warn** when seeing red flags
- 🎯 **Focus** on one domain at a time
- 🔄 **Iterate** in small, safe steps

### For Humans Using AI:

- Don't skip documentation
- Don't bypass testing
- Don't ignore warnings
- Don't rush to production
- Do ask "why" questions
- Do validate AI suggestions
- Do maintain project discipline

---

## APPENDIX A: QUICK COMMANDS

### Agent Switching
```
"Switch to [Role] Agent mode"
"Work as Project Manager Agent"
"Act as UX/Design Agent"
```

### Documentation Requests
```
"Update TECH_GUIDE with [change]"
"Check consistency across all docs"
"Generate deployment checklist"
```

### Code Review
```
"Review this code against our standards"
"Run quality checks"
"Validate test coverage"
```

### Planning
```
"Break this feature into stages"
"Estimate implementation effort"
"Identify dependencies"
```

---

## APPENDIX B: CONTACT & ESCALATION

**When AI reaches limits:**

1. **Acknowledge limitation** - "This requires human decision"
2. **Provide context** - What was attempted, what's needed
3. **Suggest next steps** - How to proceed
4. **Document** - Add to decisions log

**Never:**
- Fake understanding
- Make up information
- Proceed with high uncertainty
- Override documented architecture without approval

---

## VERSION HISTORY

- **v1.0** (2025-10-25) - Initial guidelines established

---

*"Discipline in development leads to freedom in deployment."*

**End of Document - CLAUDE.md v1.0**
