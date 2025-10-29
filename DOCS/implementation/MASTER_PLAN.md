# The New King - Master Implementation Plan

**Project:** Ancient Cyprus Political Simulation Platform
**Created:** October 25, 2025
**Status:** Phase 1 Complete (Foundation & Auth) - Moving to Phase 2

---

## 🎯 Vision

Build a complete web-based political simulation platform where 15-20 human participants + 5-10 AI characters engage in an immersive Ancient Cyprus leadership experience. The system must support facilitator-led sessions with a fixed 12-phase process, real-time interaction, AI-powered characters with voice, voting mechanisms, and reflection/analytics.

---

## 📊 Master Phase Overview

| Phase | Name | Status | Duration Est. | Priority |
|-------|------|--------|---------------|----------|
| **1** | Foundation & Infrastructure | ✅ COMPLETE | 2-3 days | P0 |
| **2** | Core Simulation Engine | 🔄 NEXT | 5-7 days | P0 |
| **3** | Design System & UI Components | ⏳ Pending | 3-4 days | P0 |
| **4** | Participant Experience | ⏳ Pending | 4-5 days | P0 |
| **5** | Facilitator Console & Controls | ⏳ Pending | 4-5 days | P0 |
| **6** | Voting & Decision System | ⏳ Pending | 3-4 days | P0 |
| **7** | Meetings & Communications | ⏳ Pending | 4-5 days | P1 |
| **8** | AI Character System | ⏳ Pending | 7-10 days | P1 |
| **9** | Reflection & Analytics | ⏳ Pending | 3-4 days | P1 |
| **10** | Debrief & Reporting | ⏳ Pending | 2-3 days | P2 |
| **11** | Polish & Optimization | ⏳ Pending | 3-5 days | P2 |
| **12** | Testing & Deployment | ⏳ Pending | 3-4 days | P0 |

**Total Estimated Timeline:** 43-60 days (6-9 weeks)

---

## 📋 Detailed Phase Breakdown

---

## ✅ PHASE 1: Foundation & Infrastructure (COMPLETE)

**Goal:** Establish technical foundation, database, and authentication system
**Status:** ✅ Complete (Oct 25, 2025)

### 1.1 Project Setup ✅
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS + Design System configuration
- [x] Supabase client setup
- [x] State management (Zustand + TanStack Query)
- [x] Folder structure & utilities
- [x] Landing page

### 1.2 Database Schema ✅
- [x] 16 production tables created
- [x] Row Level Security (RLS) policies
- [x] Database triggers (13 total)
- [x] Utility functions (11 total)
- [x] TypeScript types generation (590 lines)
- [x] Migration files (7 files, 93 KB)
- [x] Deployed to Supabase

### 1.3 Authentication System ✅
- [x] AuthContext & hooks
- [x] Login page (email/password)
- [x] Registration page (role selection)
- [x] Protected routes
- [x] QR code device access
- [x] User dashboard
- [x] Settings page
- [x] React Router integration

**Deliverables:**
- ✅ 16 database tables deployed
- ✅ Complete auth system
- ✅ 6 pages (Landing, Login, Register, Dashboard, Settings, QuickAccess)
- ✅ Development server running at localhost:5174

---

## 🔄 PHASE 2: Core Simulation Engine (NEXT - IN DETAIL BELOW)

**Goal:** Build the heart of the system - simulation creation, configuration, and stage/phase management
**Duration:** 5-7 days
**Priority:** P0 (Critical Path)

### 2.1 Simulation Configurator Module
**Purpose:** Allow facilitators to create and configure simulation runs

**Database Tables Used:**
- `sim_runs` (main simulation record)
- `clans` (faction definitions)
- `roles` (character assignments)
- `phases` (stage definitions)
- `simulation_templates` (reusable configs)

**Features to Build:**
- [ ] Simulation creation wizard (multi-step form)
- [ ] Clone from template functionality
- [ ] Clan configuration interface (name, description, emblem, color)
- [ ] Role configuration (human vs AI, assignment)
- [ ] Phase/stage timeline editor
- [ ] Configuration validation & preview
- [ ] Save as template option
- [ ] Simulation list view (facilitator)
- [ ] Simulation status management (setup → ready → in_progress → completed)

**UI Components:**
- Wizard stepper component
- Clan configuration cards
- Role assignment table
- Timeline visualizer
- Configuration summary preview

### 2.2 Stage Engine (Phase Controller)
**Purpose:** Execute and control the 12-phase simulation process

**Core Functionality:**
- [ ] Phase state machine (pending → active → paused → completed → skipped)
- [ ] Phase progression logic (enforce sequence from KING_Process.csv)
- [ ] Real-time phase sync across all participants
- [ ] Phase timer with countdown
- [ ] Facilitator phase controls (start, pause, extend, skip, end)
- [ ] Phase transition event logging
- [ ] Phase-specific UI state management

**Real-time Sync:**
- Supabase Realtime subscription to `phases` table
- Broadcast phase changes to all connected clients
- Handle reconnection gracefully

**Phase Data Model:**
```typescript
interface PhaseState {
  phase_id: string
  run_id: string
  sequence_number: number
  name: string
  description: string
  status: 'pending' | 'active' | 'paused' | 'completed' | 'skipped'
  default_duration_minutes: number
  actual_duration_minutes: number | null
  started_at: string | null
  ended_at: string | null
  time_remaining_seconds: number
}
```

**UI Components:**
- Phase header with timer
- Phase control panel (facilitator)
- Phase progress indicator
- Phase transition animations

### 2.3 Participant Dashboard (Phase-Aware)
**Purpose:** Dynamic participant interface that adapts to current phase

**Phase-Specific Views:**
- Welcome & Waiting (before start)
- Role Assignment Display
- Clan Council phase UI
- Public Speech phase UI
- Voting phase UI
- King's Decision phase UI
- Results display

**Real-time Updates:**
- Phase changes
- Timer updates (every second)
- Announcements from facilitator
- Role assignment notifications

### 2.4 Data Seeding & Templates
**Purpose:** Provide sample data and reusable templates

- [ ] Seed KING_Process.csv into `simulation_templates`
- [ ] Default clan definitions (6 clans from design docs)
- [ ] Sample role templates
- [ ] Test simulation data for development

---

## ⏳ PHASE 3: Design System & UI Components

**Goal:** Create reusable, accessible, and beautiful UI components
**Duration:** 3-4 days
**Priority:** P0 (Required for all features)

### 3.1 Core Components
- [ ] Button variants (primary, secondary, outline, ghost, danger)
- [ ] Card components (standard, elevated, interactive)
- [ ] Form inputs (text, email, password, textarea, select, radio, checkbox)
- [ ] Modal/Dialog system
- [ ] Toast notifications
- [ ] Loading states & skeletons
- [ ] Badge & tag components
- [ ] Avatar component (for users and roles)

### 3.2 Specialized Components
- [ ] Role card (character display)
- [ ] Clan card (faction display with emblem)
- [ ] Meeting invitation card
- [ ] Vote ballot interface
- [ ] Speech transcript display
- [ ] Timer/countdown component
- [ ] Phase progress bar
- [ ] Participant status indicator

### 3.3 Layout Components
- [ ] Page header with navigation
- [ ] Sidebar layout
- [ ] Responsive grid system
- [ ] Card grid layouts
- [ ] Empty states
- [ ] Error boundaries

### 3.4 Storybook Setup (Optional but Recommended)
- [ ] Storybook configuration
- [ ] Component documentation
- [ ] Interactive component playground

---

## ⏳ PHASE 4: Participant Experience

**Goal:** Build complete participant-facing interface
**Duration:** 4-5 days
**Priority:** P0

### 4.1 Role Assignment & Induction
- [ ] Role assignment notification
- [ ] Character profile display (name, age, background, traits)
- [ ] Clan information display
- [ ] Induction materials viewer
- [ ] Character acceptance flow

### 4.2 Participant Dashboard
- [ ] Current phase display
- [ ] Phase-specific instructions
- [ ] Timer display
- [ ] Quick actions panel
- [ ] Recent activity feed
- [ ] Notifications center

### 4.3 Role Information Screen
- [ ] Full character details
- [ ] Clan members list
- [ ] Clan priorities & strategy
- [ ] Character goals & motivations

### 4.4 Plenary Broadcast View
- [ ] Live speech display
- [ ] Speech history/transcript log
- [ ] Speaker identification (role + clan)
- [ ] Audio player (for AI speeches)
- [ ] Search/filter transcripts

### 4.5 Navigation & Layout
- [ ] Responsive sidebar navigation
- [ ] Mobile-friendly interface
- [ ] Quick access to key features
- [ ] Breadcrumb navigation

---

## ⏳ PHASE 5: Facilitator Console & Controls

**Goal:** Build comprehensive facilitator control center
**Duration:** 4-5 days
**Priority:** P0

### 5.1 Facilitator Dashboard
- [ ] Simulation overview (status, participants, current phase)
- [ ] Quick stats (votes cast, meetings held, speeches given)
- [ ] Active participants list (human + AI)
- [ ] Recent activity timeline
- [ ] Alert/warning notifications

### 5.2 Phase Control Panel
- [ ] Current phase display with detailed status
- [ ] Phase controls (Start, Pause, Resume, Extend, Skip, End)
- [ ] Timer override controls
- [ ] Phase timeline view (past, current, upcoming)
- [ ] Phase duration adjustment

### 5.3 Participant Management
- [ ] All participants list (filterable by role, clan, status)
- [ ] Role assignment interface
- [ ] Connection status monitoring
- [ ] Manual participant actions (kick, reassign, etc.)
- [ ] Send announcements/broadcasts

### 5.4 Live Monitoring
- [ ] Real-time activity feed
- [ ] Vote tracking (who voted, who hasn't)
- [ ] Meeting monitor (active meetings)
- [ ] Speech queue/history
- [ ] AI character status

### 5.5 Simulation Controls
- [ ] Emergency pause/resume
- [ ] Restart phase option
- [ ] End simulation early
- [ ] Export simulation data
- [ ] Generate reports

---

## ⏳ PHASE 6: Voting & Decision System

**Goal:** Implement all voting mechanisms and King's decision interface
**Duration:** 3-4 days
**Priority:** P0

### 6.1 Vote Sessions
- [ ] Create vote session (facilitator)
- [ ] Vote session types (nomination, election, clan_final_vote)
- [ ] Vote session status tracking
- [ ] Vote session configuration (scope, threshold)

### 6.2 Voting UI (Participants)
- [ ] Ballot interface
- [ ] Candidate selection (nomination round)
- [ ] Yes/No voting (election rounds)
- [ ] Clan representative voting (final vote)
- [ ] Vote confirmation
- [ ] Vote receipt display
- [ ] "Already voted" state

### 6.3 Vote Results
- [ ] Live vote counting
- [ ] Results display (public vs private)
- [ ] Winner announcement
- [ ] Vote analytics (breakdown by clan)
- [ ] Historical vote records

### 6.4 King's Decision Interface
- [ ] Structured decision form
- [ ] Three priority selection (dropdown)
- [ ] Reasoning text input
- [ ] Decision preview
- [ ] Submit decision
- [ ] Decision announcement to all

### 6.5 Vote Administration (Facilitator)
- [ ] Open/close voting
- [ ] View live vote counts
- [ ] See who voted / who hasn't
- [ ] Manually record votes (if needed)
- [ ] Override vote results (emergency)

---

## ⏳ PHASE 7: Meetings & Communications

**Goal:** Implement 1:1 and group meeting system + direct messaging
**Duration:** 4-5 days
**Priority:** P1

### 7.1 Meeting System
- [ ] Meeting invitation creation
- [ ] Meeting types (1:1, clan_council, ad_hoc_group)
- [ ] Meeting invitation UI
- [ ] Accept/decline invitations
- [ ] Meeting room interface
- [ ] Meeting participant list
- [ ] Meeting notes/transcript
- [ ] Meeting history

### 7.2 Meeting Scheduling
- [ ] Phase-aware meeting availability
- [ ] Meeting duration limits
- [ ] Concurrent meeting limits
- [ ] Meeting conflict detection

### 7.3 Direct Messaging (Optional)
- [ ] Private message interface
- [ ] Message threads
- [ ] Read/unread status
- [ ] Message notifications
- [ ] Message history

### 7.4 Real-time Communication
- [ ] WebSocket connection for live updates
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Presence system

---

## ⏳ PHASE 8: AI Character System

**Goal:** Integrate ElevenLabs Conversational AI for AI participants
**Duration:** 7-10 days
**Priority:** P1

### 8.1 AI Configuration
- [ ] ElevenLabs agent setup (per role)
- [ ] AI character context management
- [ ] Metacognitive architecture implementation
  - Fixed Context (rules, world)
  - Identity (character, clan)
  - Memory (conversation history, events)
  - Goals (current objectives)
- [ ] Context update triggers

### 8.2 AI Context Management
- [ ] AI context database records (`ai_context` table)
- [ ] Current context tracking (is_current flag)
- [ ] Context version history
- [ ] Phase-specific context updates
- [ ] Event-driven context refresh

### 8.3 AI Behavior Triggers
- [ ] Phase change handlers
- [ ] Voting triggers
- [ ] Meeting participation
- [ ] Speech generation
- [ ] Proactive behavior (within rules)

### 8.4 AI Speech Generation
- [ ] Text-to-speech via ElevenLabs
- [ ] Speech queue management
- [ ] Audio storage (Supabase Storage)
- [ ] Speech transcript logging
- [ ] Speech playback interface

### 8.5 AI Voting
- [ ] Automated voting logic
- [ ] Decision-making algorithms
- [ ] Vote logging
- [ ] AI vote transparency (optional)

### 8.6 AI Prompt Management
- [ ] Base prompts per role
- [ ] Phase-specific prompt variations
- [ ] Prompt versioning
- [ ] Prompt testing interface (facilitator)

### 8.7 AI Admin Interface (Facilitator)
- [ ] AI character status dashboard
- [ ] Manual AI action triggers
- [ ] AI behavior configuration
- [ ] AI response monitoring
- [ ] Emergency AI override

---

## ⏳ PHASE 9: Reflection & Analytics

**Goal:** Capture participant reflections and generate analytics
**Duration:** 3-4 days
**Priority:** P1

### 9.1 Reflection Capture
- [ ] Reflection prompts (phase-specific)
- [ ] Reflection input interface
- [ ] Free-text reflection
- [ ] Structured reflection questions
- [ ] Reflection submission
- [ ] Reflection history

### 9.2 Event Logging
- [ ] Comprehensive event tracking (`event_log` table)
- [ ] Event types (vote, speech, meeting, phase_change, etc.)
- [ ] Event payload standardization
- [ ] Real-time event streaming

### 9.3 Analytics Dashboard (Facilitator)
- [ ] Simulation statistics overview
- [ ] Participation metrics (speeches, votes, meetings)
- [ ] Engagement scores
- [ ] Clan activity breakdown
- [ ] Timeline visualization
- [ ] Interaction network graph

### 9.4 Analytics Exports
- [ ] CSV export (events, votes, speeches)
- [ ] JSON export (full simulation data)
- [ ] PDF summary report

---

## ⏳ PHASE 10: Debrief & Reporting

**Goal:** Generate learning summaries and debrief materials
**Duration:** 2-3 days
**Priority:** P2

### 10.1 Individual Reports
- [ ] Participant performance summary
- [ ] Actions taken (votes, speeches, meetings)
- [ ] Reflections collected
- [ ] Personal insights
- [ ] PDF generation

### 10.2 Group Reports
- [ ] Simulation summary
- [ ] Clan performance comparison
- [ ] Key moments timeline
- [ ] Voting results analysis
- [ ] Facilitator notes integration

### 10.3 Debrief Interface
- [ ] Post-simulation debrief screen
- [ ] Group discussion prompts
- [ ] Reflection sharing (opt-in)
- [ ] Learning takeaways
- [ ] Feedback collection

---

## ⏳ PHASE 11: Polish & Optimization

**Goal:** Refine UX, performance, and overall quality
**Duration:** 3-5 days
**Priority:** P2

### 11.1 Performance Optimization
- [ ] Code splitting and lazy loading
- [ ] Image optimization
- [ ] Bundle size reduction
- [ ] Query optimization
- [ ] Caching strategy
- [ ] Real-time subscription optimization

### 11.2 UX Refinement
- [ ] Animation polish (Framer Motion)
- [ ] Loading states everywhere
- [ ] Error handling improvements
- [ ] Empty states design
- [ ] Mobile responsiveness review
- [ ] Accessibility audit (WCAG 2.1)

### 11.3 Visual Polish
- [ ] Consistent spacing
- [ ] Typography refinement
- [ ] Color harmony check
- [ ] Icon consistency
- [ ] Image assets
- [ ] Favicon and branding

### 11.4 Error Handling
- [ ] Global error boundary
- [ ] Network error handling
- [ ] Form validation messages
- [ ] User-friendly error messages
- [ ] Retry mechanisms

---

## ⏳ PHASE 12: Testing & Deployment

**Goal:** Ensure quality and deploy to production
**Duration:** 3-4 days
**Priority:** P0

### 12.1 Testing Strategy
- [ ] Unit tests (critical functions)
- [ ] Integration tests (API + Database)
- [ ] E2E tests (critical user flows)
- [ ] Load testing (concurrent users)
- [ ] AI integration testing

### 12.2 QA Testing
- [ ] Full simulation run-through (facilitator)
- [ ] Multi-user testing (participants)
- [ ] Edge case testing
- [ ] Browser compatibility testing
- [ ] Mobile device testing

### 12.3 Documentation
- [ ] User guide (facilitator)
- [ ] User guide (participant)
- [ ] Admin documentation
- [ ] API documentation
- [ ] Deployment guide

### 12.4 Deployment
- [ ] Production environment setup
- [ ] Environment variables configuration
- [ ] Database migration to production
- [ ] CDN setup (if needed)
- [ ] Domain configuration
- [ ] SSL certificate
- [ ] Monitoring setup (error tracking, analytics)

### 12.5 Post-Launch
- [ ] Monitoring dashboards
- [ ] Bug tracking system
- [ ] User feedback collection
- [ ] Iteration planning

---

## 🔗 Module Dependencies

```
Foundation (Phase 1)
  ↓
Core Sim Engine (Phase 2) + Design System (Phase 3)
  ↓
Participant Experience (Phase 4) + Facilitator Console (Phase 5)
  ↓
Voting System (Phase 6) + Meetings (Phase 7)
  ↓
AI System (Phase 8)
  ↓
Reflection & Analytics (Phase 9)
  ↓
Debrief & Reporting (Phase 10)
  ↓
Polish (Phase 11) + Testing (Phase 12)
```

---

## 🎯 Critical Path

**Must-Have for MVP Launch:**
1. ✅ Phase 1: Foundation (DONE)
2. 🔄 Phase 2: Core Simulation Engine
3. Phase 3: Design System
4. Phase 4: Participant Experience
5. Phase 5: Facilitator Console
6. Phase 6: Voting System
7. Phase 12: Testing & Deployment

**Can Be Added Post-MVP:**
- Phase 7: Advanced Meetings (basic version in Phase 4)
- Phase 8: Full AI System (can start with facilitator-controlled AI)
- Phase 9: Advanced Analytics (basic version in Phase 5)
- Phase 10: Automated Reporting (manual export in Phase 9)
- Phase 11: Polish (ongoing)

---

## 📊 Success Metrics

**Technical:**
- [ ] All 12 phases functional
- [ ] Support 20 concurrent users
- [ ] <2 second page load
- [ ] <500ms real-time updates
- [ ] 99% uptime during sessions

**User Experience:**
- [ ] Facilitator can run full simulation
- [ ] Participants can complete all actions
- [ ] AI characters behave realistically
- [ ] Zero data loss during session
- [ ] Mobile-friendly interface

**Business:**
- [ ] First full test run successful
- [ ] Positive user feedback
- [ ] Reusable for future simulations
- [ ] Scalable architecture

---

**Next Steps:** Proceed with Phase 2 detailed planning? 🚀
