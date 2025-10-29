# The New King - Documentation Index

**Last Updated:** October 29, 2025
**Project Status:** Sprint 0 Complete → Starting Sprint 1 (Voting System)

---

## 📖 How to Navigate This Documentation

This is your **single source of truth** for all project documentation. Start here, and this index will guide you to exactly what you need.

---

## 🎯 START HERE (Essential Reading)

### For Everyone:
1. **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Project status, progress, immediate next steps
2. **[design/KING_PRD.md](./design/KING_PRD.md)** - Product Requirements Document (what we're building)

### For Developers:
3. **[design/KING_TECH_GUIDE.md](./design/KING_TECH_GUIDE.md)** - Technical architecture, database schema, API design
4. **[design/CLAUDE.md](./design/CLAUDE.md)** - AI assistant operating guidelines (HOW to work on this project)

### For AI Development:
5. **[design/KING_AI_DESIGN.md](./design/KING_AI_DESIGN.md)** - AI character system architecture

### For UI/UX:
6. **[design/KING_UX_GUIDE.md](./design/KING_UX_GUIDE.md)** - Design system, color palette, components

---

## 📁 Folder Structure

```
DOCS/
├── INDEX.md                       # ← YOU ARE HERE
├── CURRENT_STATUS.md             # Project status (updated frequently)
│
├── design/                       # 🎨 CORE DESIGN DOCUMENTS (rarely change)
│   ├── KING_PRD.md              # Product Requirements
│   ├── KING_TECH_GUIDE.md       # Technical Architecture
│   ├── KING_AI_DESIGN.md        # AI Character System
│   ├── KING_UX_GUIDE.md         # Design System
│   └── CLAUDE.md                # Development Guidelines
│
├── planning/                     # 📅 ROADMAPS & SPRINT PLANS
│   └── MVP_ROADMAP.md           # 8-10 week sprint plan to MVP
│
├── reference/                    # 📚 PROVEN PATTERNS (from other projects)
│   ├── THERAPIST_COGNITIVE_PATTERNS.md    # 4-block AI architecture
│   ├── THERAPIST_VOICE_PATTERNS.md        # Voice integration with ElevenLabs
│   ├── PARALLEL_VOICE_CHAT_PATTERN.md     # Voice + text chat dual channels
│   └── EXMG_PATTERNS.md                   # Production patterns (state management, RLS)
│
├── technical/                    # 🔧 ARCHITECTURE & PERFORMANCE
│   ├── RLS_ARCHITECTURE.md              # Row-Level Security design
│   ├── PHASE_3_PERFORMANCE_ANALYSIS.md  # Performance profiling results
│   ├── FEATURES_TRACKING.md             # Feature implementation status
│   ├── RLS_SIMPLIFICATION_2025-10-28.md
│   ├── PERFORMANCE_FIX_COMPLETE.md
│   ├── FRONTEND_PERFORMANCE_ISSUES.md
│   ├── PHASE_3_COMPLETE.md
│   └── PHASE_3_PERFORMANCE_ANALYSIS.md
│
├── implementation/               # 📝 SESSION SUMMARIES & IMPLEMENTATION NOTES
│   ├── [Various session summaries and implementation docs]
│   ├── MASTER_PLAN.md
│   ├── PHASE_2_PLAN.md
│   └── [Historical implementation notes]
│
├── assets/                       # 🎨 IMAGES, LOGOS, DATA
│   ├── LOGOS/                   # Clan logos and branding assets
│   └── KING_SIM_BASE/          # Base simulation data (CSVs, reference)
│
└── sessions/                     # 🗂️ SESSION ARCHIVES (historical)
```

---

## 🚀 Quick Reference by Task

### I want to understand...

**...what the project is about**
→ [design/KING_PRD.md](./design/KING_PRD.md) - Product Requirements

**...the current status**
→ [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Latest status report

**...the technical architecture**
→ [design/KING_TECH_GUIDE.md](./design/KING_TECH_GUIDE.md) - Complete technical guide

**...how AI characters work**
→ [design/KING_AI_DESIGN.md](./design/KING_AI_DESIGN.md) - AI system design
→ [reference/THERAPIST_COGNITIVE_PATTERNS.md](./reference/THERAPIST_COGNITIVE_PATTERNS.md) - 4-block architecture

**...the roadmap to MVP**
→ [planning/MVP_ROADMAP.md](./planning/MVP_ROADMAP.md) - 8-10 week sprint plan

**...how to develop features**
→ [design/CLAUDE.md](./design/CLAUDE.md) - Development discipline guidelines

**...the design system**
→ [design/KING_UX_GUIDE.md](./design/KING_UX_GUIDE.md) - UI/UX specifications

---

## 🔍 Quick Reference by Role

### **Product Manager**
- [design/KING_PRD.md](./design/KING_PRD.md) - Product requirements
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Project status
- [planning/MVP_ROADMAP.md](./planning/MVP_ROADMAP.md) - Sprint roadmap
- [technical/FEATURES_TRACKING.md](./technical/FEATURES_TRACKING.md) - Feature status

### **Frontend Developer**
- [design/KING_TECH_GUIDE.md](./design/KING_TECH_GUIDE.md) - Technical architecture
- [design/KING_UX_GUIDE.md](./design/KING_UX_GUIDE.md) - Design system
- [design/CLAUDE.md](./design/CLAUDE.md) - Development guidelines

### **Backend Developer**
- [design/KING_TECH_GUIDE.md](./design/KING_TECH_GUIDE.md) - Database schema, API design
- [technical/RLS_ARCHITECTURE.md](./technical/RLS_ARCHITECTURE.md) - Security architecture
- [technical/PHASE_3_PERFORMANCE_ANALYSIS.md](./technical/PHASE_3_PERFORMANCE_ANALYSIS.md) - Performance

### **AI/LLM Developer**
- [design/KING_AI_DESIGN.md](./design/KING_AI_DESIGN.md) - AI system architecture
- [reference/THERAPIST_COGNITIVE_PATTERNS.md](./reference/THERAPIST_COGNITIVE_PATTERNS.md) - 4-block system
- [reference/THERAPIST_VOICE_PATTERNS.md](./reference/THERAPIST_VOICE_PATTERNS.md) - Voice integration
- [reference/PARALLEL_VOICE_CHAT_PATTERN.md](./reference/PARALLEL_VOICE_CHAT_PATTERN.md) - Chat architecture

### **UX Designer**
- [design/KING_UX_GUIDE.md](./design/KING_UX_GUIDE.md) - Design system
- [design/KING_PRD.md](./design/KING_PRD.md) - Product requirements
- [assets/LOGOS/](./assets/LOGOS/) - Visual assets

---

## 📊 Project Metrics (Oct 29, 2025)

- **Overall Completion:** ~40%
- **Core Infrastructure:** 100% ✅
- **Authentication:** 100% ✅
- **Facilitator Dashboard:** 100% ✅
- **Participant Dashboard:** 100% ✅
- **Simulation Wizard:** 100% ✅
- **Voting System:** 0% (Sprint 1 - next)
- **Meetings:** 0% (Sprint 2)
- **AI Characters:** 0% (Sprint 3-4)
- **Voice Integration:** 0% (Sprint 5-6)

---

## 🎯 Current Sprint: Sprint 1 - Voting System

**Duration:** 2 weeks (Weeks 1-2)
**Goal:** Complete voting functionality for King election

**Reference:**
- [planning/MVP_ROADMAP.md](./planning/MVP_ROADMAP.md) - Full roadmap

---

## 📚 Reference Documents (Proven Patterns)

All reference documents are in the [reference/](./reference/) folder. These contain **production-proven patterns** from other successful projects:

1. **THERAPIST_COGNITIVE_PATTERNS.md** - 4-block AI architecture (memory, identity, goals)
2. **THERAPIST_VOICE_PATTERNS.md** - ElevenLabs voice integration (FastAPI, OpenAI compatibility)
3. **PARALLEL_VOICE_CHAT_PATTERN.md** - Dual voice+text channels
4. **EXMG_PATTERNS.md** - State management, RLS policies, progressive reveal

---

## 🔄 Document Update Schedule

### Updated Daily:
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Project status

### Updated Weekly:
- [planning/MVP_ROADMAP.md](./planning/MVP_ROADMAP.md) - Sprint progress
- [technical/FEATURES_TRACKING.md](./technical/FEATURES_TRACKING.md) - Feature status

### Updated Rarely (Stable):
- [design/KING_PRD.md](./design/KING_PRD.md)
- [design/KING_TECH_GUIDE.md](./design/KING_TECH_GUIDE.md)
- [design/KING_AI_DESIGN.md](./design/KING_AI_DESIGN.md)
- [design/KING_UX_GUIDE.md](./design/KING_UX_GUIDE.md)
- [design/CLAUDE.md](./design/CLAUDE.md)

---

## 🆘 Troubleshooting

**Can't find a document?**
- Check this INDEX.md first
- Use GitHub search (Cmd/Ctrl + K)
- Check [implementation/](./implementation/) for historical notes

**Document seems outdated?**
- Check [CURRENT_STATUS.md](./CURRENT_STATUS.md) for latest updates
- Refer to git commit history for latest changes

**Conflicting information?**
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) is the single source of truth
- Core design docs take precedence over implementation notes

---

## 📝 Contributing to Documentation

**When updating documents:**

1. **Read [design/CLAUDE.md](./design/CLAUDE.md) first** - Development guidelines
2. **Update CURRENT_STATUS.md** when completing major milestones
3. **Add implementation notes** to [implementation/](./implementation/) folder
4. **Update this INDEX.md** if adding new top-level documents

---

## 🎓 Learning Path for New Contributors

**Week 1: Understand the Vision**
1. Read [design/KING_PRD.md](./design/KING_PRD.md)
2. Read [CURRENT_STATUS.md](./CURRENT_STATUS.md)
3. Explore the app locally (npm run dev)

**Week 2: Technical Deep Dive**
1. Read [design/KING_TECH_GUIDE.md](./design/KING_TECH_GUIDE.md)
2. Review database schema (app/supabase/migrations/)
3. Study existing components (app/src/components/)

**Week 3: Development Discipline**
1. Read [design/CLAUDE.md](./design/CLAUDE.md)
2. Review [planning/MVP_ROADMAP.md](./planning/MVP_ROADMAP.md)
3. Pick a task from current sprint

**Week 4+: Specialized Topics**
- AI Development → [design/KING_AI_DESIGN.md](./design/KING_AI_DESIGN.md) + [reference/](./reference/)
- Voice Integration → [reference/THERAPIST_VOICE_PATTERNS.md](./reference/THERAPIST_VOICE_PATTERNS.md)
- Performance → [technical/PHASE_3_PERFORMANCE_ANALYSIS.md](./technical/PHASE_3_PERFORMANCE_ANALYSIS.md)

---

## 🔗 External Resources

- **GitHub Repository:** [Mar-Atn/KING](https://github.com/Mar-Atn/KING)
- **Supabase Dashboard:** [esplzaunxkehuankkwbx.supabase.co](https://supabase.com/dashboard/project/esplzaunxkehuankkwbx)
- **Reference Projects:**
  - [NegotiationMaster](https://github.com/Mar-Atn/NegotiationMaster) - Voice + chat patterns
  - [EXMG](https://github.com/Mar-Atn/EXMG) - Production patterns
  - THERAPIST (local) - AI cognitive architecture

---

## ✅ Document Organization Principles

1. **Single Source of Truth** - CURRENT_STATUS.md for project status
2. **Stable Design Docs** - Core design documents rarely change
3. **Historical Separation** - Implementation notes separate from design
4. **Clear Naming** - Descriptive filenames, consistent dates
5. **Folder Hierarchy** - Logical grouping by purpose
6. **No Duplication** - One location per document
7. **Easy Discovery** - This INDEX.md guides to everything

---

**Last Updated:** October 29, 2025
**Maintained By:** Project Team
**Questions?** Check [design/CLAUDE.md](./design/CLAUDE.md) for guidelines

---

*"Good documentation is like a well-organized library. You should find what you need in under 30 seconds."*
