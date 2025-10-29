# KING_TECH_GUIDE.md - Technical Architecture & Implementation Guide
**The New King SIM Web Application**  
**Single Source of Technical Truth**  
*Version 1.0 - Initial Architecture*  
*Date: October 24, 2025*

---

## DOCUMENT PURPOSE

This document defines the complete technical architecture for The New King SIM Web App, serving as:
- **Single source of technical truth** for all implementation decisions
- **Database schema specification** with complete table definitions
- **Event flow documentation** showing how data moves through the system
- **API contract definitions** for all internal and external integrations
- **Deployment architecture** and infrastructure requirements

**Related Documents:**
- `KING_PRD.md` - Product requirements (what we're building)
- `KING_AI_DESIGN.md` - AI participant architecture and prompts
- `KING_UX_GUIDE.md` - Visual design and user interface patterns
- `CLAUDE.md` - Development discipline and project management

**Base SIM Design** 5 documnets in folder KING_SIM_BASE\ 
- KING_Context.md 
- KING_Decisions.md 
- KING_Process.csv
- KING_ALL_ROLES.csv 
- KING_ALL_CLANs.csv

---

## VERSION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 24, 2025 | Initial architecture definition | Marat + Claude |

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Data Flow Patterns](#4-data-flow-patterns)
5. [Event System Architecture](#5-event-system-architecture)
6. [API Specifications](#6-api-specifications)
7. [AI Integration Architecture](#7-ai-integration-architecture)
8. [Voice Communication System](#8-voice-communication-system)
9. [State Management](#9-state-management)
10. [Security & Access Control](#10-security--access-control)
11. [Performance & Scalability](#11-performance--scalability)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Testing Strategy](#13-testing-strategy)
14. [Migration & Evolution](#14-migration--evolution)

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture Philosophy

**Always-Online, Event-Driven, Facilitator-Centric, Physical-Digital Hybrid**

The KING SIM architecture is built on four core principles:

1. **Always-Online Web Application:** All participants require stable internet connection to access Supabase database, communicate with AI characters (ElevenLabs), and receive real-time updates. The web app is fully cloud-based with no offline capabilities.

2. **Physical-Digital Hybrid Interaction Model:**
   - **Human-to-Human:** Happens physically in the venue (face-to-face at tables, untracked)
   - **Human-to-AI:** Happens digitally via web app (voice calls through personal devices)
   - **AI-to-AI:** Happens digitally via API (text-based coordination)
   - **Public Speeches (AI):** AI can "speak" to the room via facilitator's laptop speakers

3. **Event-Driven:** Every action (human or AI) emits events; modules react to events asynchronously

4. **Facilitator-Centric:** Single point of control with absolute override authority, but system automates routine operations

### 1.2 Physical-Digital Hybrid Model

**The Venue Setup:**
```
PHYSICAL VENUE (Conference Room/Hall):
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š  Main Assembly Area                                          Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â                                   Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š Facilitator's Laptop Ã¢â€â€š Ã¢â€ Â Connected to room speakers      Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š + Large Display      Ã¢â€â€š   (for AI public speeches)        Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ                                   Ã¢â€â€š
Ã¢â€â€š                                                              Ã¢â€â€š
Ã¢â€â€š  Ã°Å¸â€˜Â¥ Human Participants (15-20)                              Ã¢â€â€š
Ã¢â€â€š    - Smartphones/tablets with web app open                  Ã¢â€â€š
Ã¢â€â€š    - Can physically move around, form groups                Ã¢â€â€š
Ã¢â€â€š    - Talk to each other naturally (untracked)              Ã¢â€â€š
Ã¢â€â€š    - Use devices for: voting, AI meetings, phase updates   Ã¢â€â€š
Ã¢â€â€š                                                              Ã¢â€â€š
Ã¢â€â€š  Tables/Meeting Spaces (for human clan councils)           Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                    Ã¢â€ â€¢ WiFi/Internet Ã¢â€ â€¢
         [Supabase + ElevenLabs + LLMs in Cloud]
                    Ã¢â€ â€¢
         Ã°Å¸Â¤â€“ AI Participants (5-10)
            - Exist only digitally
            - Accessible via web app
            - Can "speak" via facilitator's speakers (public)
```

**Interaction Patterns:**

| Interaction Type | How It Happens | Tracked? |
|------------------|----------------|----------|
| **Human Ã¢â€ â€ Human** | Physical conversation in room | Ã¢ÂÅ’ No |
| **Human Ã¢â€ â€ AI (private)** | Voice call via personal device + headphones | Ã¢Å“â€¦ Transcript saved |
| **AI Ã¢â€ â€ AI** | Text-based API coordination | Ã¢Å“â€¦ Transcript saved |
| **Public Speech (Human)** | Physical microphone Ã¢â€ â€™ facilitator laptop captures | Ã¢Å“â€¦ Transcript saved |
| **Public Speech (AI)** | Facilitator triggers Ã¢â€ â€™ plays through room speakers | Ã¢Å“â€¦ Transcript saved |
| **Voting** | All participants use web app | Ã¢Å“â€¦ All votes recorded |
| **Public Speeches/Announcements** | Facilitator speaks or triggers AI speech | Ã¢Å“â€¦ Transcript saved |

### 1.3 High-Level Architecture

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                    PRESENTATION LAYER                        Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¤
Ã¢â€â€š  Facilitator Console Ã¢â€â€š  Participant Interface (Human)       Ã¢â€â€š
Ã¢â€â€š  - Stage Control     Ã¢â€â€š  - Role Dashboard                    Ã¢â€â€š
Ã¢â€â€š  - Real-time Monitor Ã¢â€â€š  - Meeting Interface                 Ã¢â€â€š
Ã¢â€â€š  - Override Powers   Ã¢â€â€š  - Voting UI                         Ã¢â€â€š
Ã¢â€â€š  - Analytics View    Ã¢â€â€š  - Reflection Forms                  Ã¢â€â€š
Ã¢â€â€š  - AI Speech Trigger Ã¢â€â€š  - Phase Timer Display               Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â´Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                              Ã¢â€ â€œ Ã¢â€ â€˜
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                   APPLICATION LAYER                          Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¤
Ã¢â€â€š  Stage Engine  Ã¢â€â€š  Meeting Manager  Ã¢â€â€š  Voting Module        Ã¢â€â€š
Ã¢â€â€š  AI Orchestrator Ã¢â€â€š Public Speech Recording Ã¢â€â€š Reflection Engine    Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                              Ã¢â€ â€œ Ã¢â€ â€˜
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                      EVENT BUS                               Ã¢â€â€š
Ã¢â€â€š  (Supabase Realtime - PostgreSQL LISTEN/NOTIFY)            Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                              Ã¢â€ â€œ Ã¢â€ â€˜
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                     DATA LAYER                               Ã¢â€â€š
Ã¢â€â€š                 Supabase PostgreSQL                          Ã¢â€â€š
Ã¢â€â€š  (Single source of truth, RLS policies, triggers)           Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                              Ã¢â€ â€œ Ã¢â€ â€˜
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š               EXTERNAL INTEGRATIONS                          Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¤
Ã¢â€â€š  ElevenLabs API      Ã¢â€â€š  LLM APIs (Anthropic/Gemini/OpenAI) Ã¢â€â€š
Ã¢â€â€š  - Voice Synthesis   Ã¢â€â€š  - AI Context Updates                Ã¢â€â€š
Ã¢â€â€š  - Conversational AI Ã¢â€â€š  - Reflection Generation             Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â´Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
```

### 1.3 Key Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Supabase as backend** | Proven in EXMG, built-in realtime, RLS security | Vendor lock-in, but acceptable for MVP |
| **Event-driven via PostgreSQL** | Native to Supabase, reliable, low latency | More complex than REST-only, but needed for realtime |
| **No separate event queue** | PostgreSQL LISTEN/NOTIFY sufficient for 30 users | Won't scale to 1000s, but not needed |
| **AI context in PostgreSQL** | Single source of truth, queryable, versioned | Large JSONB fields, but manageable |
| **ElevenLabs for voice** | Best quality, proven in EXMG | Cost per minute, API dependency |
| **Fallback: AI-only or Human-only clans** | De-risks group voice technology | Reduces AI-human interaction richness |
| **Always-online requirement** | Enables real-time updates, AI interactions, voting | Requires stable WiFi, but necessary for functionality |
| **Physical-digital hybrid** | Humans interact naturally while AI remains accessible | Complex mental model, but powerful UX |

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend Stack

```javascript
// Core Framework
React 18.2+ with TypeScript 5.0+
Vite 4.0+ (build tool)

// UI Framework
Tailwind CSS 3.3+
Framer Motion 10+ (animations)
Headless UI 1.7+ (accessible components)

// State Management
React Context API (UI state)
Zustand 4.4+ (global app state)
TanStack Query 5.0+ (server state, caching)

// Real-time Communication
Supabase JS Client 2.38+
WebRTC (via ElevenLabs SDK)

// Voice Integration
@11labs/client (ElevenLabs Conversational API)
```

### 2.2 Backend Stack

```
Database: Supabase (PostgreSQL 15+)
Authentication: Supabase Auth (JWT tokens)
Real-time: Supabase Realtime (PostgreSQL pub/sub)
Storage: Supabase Storage (transcripts, audio files)
Functions: Supabase Edge Functions (serverless, Deno runtime)
```

### 2.3 AI & Voice APIs

```
Voice AI: ElevenLabs Conversational API
- WebRTC for low-latency voice
- Agent IDs linked to character profiles

LLM APIs (for AI context updates):
- Primary: Anthropic Claude 3.5 Sonnet
- Fallback: Google Gemini 1.5 Pro
- Alternative: OpenAI GPT-4

Transcription: ElevenLabs native (included in Conversational API)
```

### 2.4 Development & Deployment

```
Version Control: Git + GitHub
CI/CD: GitHub Actions
Hosting: Vercel (frontend)
Environment Management: Vercel Environment Variables
Monitoring: Vercel Analytics + Sentry (errors)
Testing: Vitest (unit), Playwright (E2E)
```

---

## 3. DATABASE SCHEMA

### 3.1 Schema Design Principles

1. **Immutability:** Once a SIM run starts, configuration is immutable (new version = new run_id)
2. **Audit Trail:** All state changes logged with timestamps and actor_id
3. **Versioning:** AI context blocks versioned; old versions preserved
4. **Single Source of Truth:** All data in PostgreSQL, no duplication
5. **Event Sourcing Light:** EVENT_LOG captures all significant actions

### 3.2 Core Tables

#### 3.2.1 `sim_runs` (Simulation Instance)

```sql
CREATE TABLE sim_runs (
  -- Identity
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name TEXT NOT NULL,
  version TEXT NOT NULL, -- e.g., "KOURION_v1.0"
  
  -- Configuration Snapshot (immutable after start)
  config JSONB NOT NULL, -- Complete configuration at launch time
  config_checksum TEXT NOT NULL, -- MD5 of config for validation
  
  -- Participants
  total_participants INTEGER NOT NULL,
  human_participants INTEGER NOT NULL,
  ai_participants INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'setup',          -- Being configured
    'ready',          -- Locked, ready to launch
    'in_progress',    -- Active simulation
    'completed',      -- Finished
    'cancelled'       -- Aborted
  )),
  
  -- Timing (only created_at is required)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Ownership
  facilitator_id UUID REFERENCES users(id),
  
  -- Metadata (all optional)
  notes TEXT,
  learning_objectives TEXT[], -- Up to 3 objectives

  -- Voting Configuration
  vote_1_threshold INTEGER, -- Votes required for Vote 1 (NULL = use default 2/3 of total_participants)
  vote_2_threshold INTEGER  -- Votes required for Vote 2 (NULL = use default 2/3 of total_participants)
);

CREATE INDEX idx_sim_runs_status ON sim_runs(status);
CREATE INDEX idx_sim_runs_facilitator ON sim_runs(facilitator_id);
```

**Key Points:**
- `config` JSONB contains entire simulation setup (clans, roles, timing, rules)
- Immutable after `status = 'in_progress'`
- `config_checksum` validates no unauthorized changes

#### 3.2.2 `users` (Facilitators & Participants)

```sql
CREATE TABLE users (
  -- Identity (linked to Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  
  -- Display Information
  display_name TEXT NOT NULL, -- "Alex", "Maria" (used in UI)
  full_name TEXT,             -- Optional full name
  avatar_url TEXT,
  
  -- System Role (not simulation role)
  role TEXT NOT NULL CHECK (role IN ('facilitator', 'participant')),
  
  -- Registration & Simulation Status
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN (
    'registered',    -- User created account, waiting for role assignment
    'role_assigned', -- Role assigned, waiting for simulation start
    'active',        -- Currently in simulation
    'completed',     -- Simulation finished
    'inactive',      -- Account deactivated
    'banned'         -- Access revoked
  )),
  
  -- Event Management (for multi-event support)
  current_event_code TEXT, -- The event they're registered for (e.g., "KING2025-CYPRUS")
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_event ON users(current_event_code);
```

**Key Points:**
- **display_name** used in participant list and UI (first name or nickname)
- **status** tracks progression: registered â†’ role_assigned â†’ active â†’ completed
- **current_event_code** allows same user to register for multiple events over time
- Email is real participant email (for password reset, communications)

#### 3.2.2b `access_tokens` (QR Code Device Access)

```sql
CREATE TABLE access_tokens (
  -- Identity
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token
  token TEXT NOT NULL UNIQUE, -- Secure random token (32+ chars)
  device_name TEXT,            -- Optional: "Phone", "Tablet", "Laptop"
  
  -- Validity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Usually 24 hours from creation
  used_at TIMESTAMPTZ,              -- NULL until used
  used_from_ip TEXT,                -- IP address where token was used (audit)
  
  -- Status
  is_valid BOOLEAN DEFAULT TRUE,    -- Can be revoked by facilitator
  revoked_by UUID REFERENCES users(id), -- Facilitator who revoked it
  revoked_at TIMESTAMPTZ,
  
  -- Constraints
  CHECK (expires_at > created_at)
);

CREATE INDEX idx_tokens_user ON access_tokens(user_id);
CREATE INDEX idx_tokens_token ON access_tokens(token) WHERE is_valid = TRUE AND used_at IS NULL;
CREATE INDEX idx_tokens_expiry ON access_tokens(expires_at) WHERE is_valid = TRUE;
```

**Key Points:**
- **Single-use tokens** for secure device switching
- **24-hour expiry** (configurable)
- **Audit trail** (when used, from what IP)
- **Facilitator can revoke** tokens if needed

#### 3.2.3 `clans` (Faction Definitions)

```sql
CREATE TABLE clans (
  -- Identity
  clan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  
  -- Definition (only name required)
  name TEXT NOT NULL,
  sequence_number INTEGER NOT NULL, -- Display order
  
  -- Description (from seed data, but can be NULL if minimal setup)
  about TEXT,
  key_priorities TEXT,
  attitude_to_others TEXT,
  if_things_go_wrong TEXT, -- Clan's emergency action
  
  -- Visual (all optional)
  emblem_url TEXT, -- Uploaded image or generated
  color_hex TEXT DEFAULT '#476078',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(run_id, name),
  UNIQUE(run_id, sequence_number)
);

CREATE INDEX idx_clans_run ON clans(run_id);
```

#### 3.2.4 `roles` (Individual Character Definitions)

```sql
CREATE TABLE roles (
  -- Identity
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,
  
  -- Assignment
  participant_type TEXT NOT NULL CHECK (participant_type IN ('human', 'ai')),
  assigned_user_id UUID REFERENCES users(id), -- NULL if AI or unassigned
  
  -- Character Definition (only name required, rest optional)
  name TEXT NOT NULL,
  age INTEGER,
  position TEXT,
  background TEXT,
  character_traits TEXT,
  interests TEXT,
  
  -- AI-Specific Config (NULL for humans)
  ai_config JSONB, 
  -- SIMPLIFIED: Only stores { "elevenlabs_agent_id": "agent_abc123" }
  -- Voice settings, LLM model, voice_id are all pre-configured in the ElevenLabs agent
  -- Facilitator just picks from a dropdown of pre-created agents (e.g., "Male Voice 1", "Female Voice 2")
  
  -- Visual (optional)
  avatar_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(run_id, name)
);

CREATE INDEX idx_roles_run ON roles(run_id);
CREATE INDEX idx_roles_clan ON roles(clan_id);
CREATE INDEX idx_roles_user ON roles(assigned_user_id);
CREATE INDEX idx_roles_type ON roles(participant_type);
```

#### 3.2.5 `phases` (Stage Definitions)

```sql
CREATE TABLE phases (
  -- Identity
  phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  
  -- Definition (from KING_Process.csv)
  sequence_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT, -- Optional description
  default_duration_minutes INTEGER NOT NULL,
  
  -- Actual Execution (all optional until phase runs)
  actual_duration_minutes INTEGER, -- May differ from default
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not yet started
    'active',       -- Currently running
    'paused',       -- Temporarily stopped
    'completed',    -- Finished
    'skipped'       -- Facilitator skipped
  )),
  
  UNIQUE(run_id, sequence_number)
);

CREATE INDEX idx_phases_run ON phases(run_id);
CREATE INDEX idx_phases_status ON phases(run_id, status);
```

**Key Points:**
- Phases pre-populated from `KING_Process.csv` when run created
- `actual_duration_minutes` tracks facilitator adjustments

#### 3.2.6 `meetings` (All Conversations)

**Purpose:** Track meetings for AI context updates. Physical human-only meetings are NOT tracked.

```sql
CREATE TABLE meetings (
  -- Identity
  meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id),
  
  -- Type (SIMPLIFIED - only 2 types)
  meeting_type TEXT NOT NULL CHECK (meeting_type IN (
    'clan_council',        -- Automatic clan meeting (all clan members)
    'free_consultation'    -- Ad-hoc meeting during free consult stage (2+ participants)
  )),
  
  -- Organization
  organizer_role_id UUID REFERENCES roles(role_id), -- NULL for automatic clan councils
  title TEXT, -- Optional (e.g., "Discuss Alliance with Merchants")
  
  -- Participants (JSONB array of role_ids)
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: ["role-uuid-1", "role-uuid-2", "role-uuid-3"]
  -- Can be 2+ participants
  
  -- Modality (SIMPLIFIED - only voice or text)
  modality TEXT NOT NULL DEFAULT 'voice' CHECK (modality IN (
    'voice',      -- Voice call via ElevenLabs (default, if any AI + human)
    'text'        -- Text chat (fallback if voice fails, or AI-to-AI only)
  )),
  
  -- Content (transcript required for AI updates)
  transcript TEXT, -- NULL while in progress, populated on end
  transcript_format TEXT DEFAULT 'plain', -- 'plain' or 'json' (structured messages)
  
  -- Voice Integration (only if modality = 'voice')
  elevenlabs_conversation_id TEXT, -- If voice meeting
  
  -- Timing (all optional except created_at)
  scheduled_duration_minutes INTEGER, -- Suggested duration
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_seconds INTEGER, -- Calculated on end
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Invite sent, not all accepted yet
    'accepted',     -- All participants accepted
    'active',       -- Meeting in progress
    'completed',    -- Finished normally
    'cancelled',    -- Organizer cancelled
    'expired'       -- Invite expired (no response)
  )),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_run ON meetings(run_id);
CREATE INDEX idx_meetings_phase ON meetings(phase_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_role_id);
-- GIN index for participant array queries
CREATE INDEX idx_meetings_participants ON meetings USING GIN (participants);
```

**Key Points:**
- **Only 2 types:** `clan_council` (automatic) and `free_consultation` (ad-hoc)
- **Physical meetings NOT tracked** - humans meet naturally, no app involvement
- **Participants array:** Flexible 2+ participants (no limit, though 2-6 is typical)
- **Modality:** Voice (default) or Text (fallback/AI-only)
- **Transcript essential:** Needed for AI context updates after meeting ends
- **Purpose:** Primarily to inform AI characters what was discussed, who promised what
- **No separate DM system:** All text/voice conversations happen via meetings for simpler architecture. After each meeting, the entire transcript is sent to AI participants for context update.

**Meeting Flow:**
1. Clan Council: System auto-creates with all clan members
2. Free Consultation: Participant initiates, invites 1+ others
3. If any AI involved: Meeting tracked in app
4. If all human: They can use app OR just meet physically (untracked)
5. On end: Transcript sent to all AI participants for context update

#### 3.2.7 `meeting_invitations` (Invitation Workflow)

```sql
CREATE TABLE meeting_invitations (
  -- Identity
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  
  -- Target
  invitee_role_id UUID NOT NULL REFERENCES roles(role_id),
  
  -- Response
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'accepted',
    'declined',
    'expired'
  )),
  response_text TEXT, -- Optional message from invitee
  responded_at TIMESTAMPTZ,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-expire after 10 minutes
  
  UNIQUE(meeting_id, invitee_role_id)
);

CREATE INDEX idx_invitations_meeting ON meeting_invitations(meeting_id);
CREATE INDEX idx_invitations_invitee ON meeting_invitations(invitee_role_id);
CREATE INDEX idx_invitations_status ON meeting_invitations(status);
```

**Key Point:** Once ANY invitee accepts, the meeting transitions to `accepted` status and can begin. The meeting doesn't wait for all invitees to respond. Additional participants can join later if they accept their invitations.

#### 3.2.8 `public_speeches` (Recording Public Addresses)

**Purpose:** Record all public speeches (human, AI, or facilitator) so transcripts can be distributed to AI participants for context updates. This is NOT live broadcasting - it's recording, transcription, and distribution.

**Recording Methods:**

1. **Human Speeches:** Via dedicated "Secretary" workstation
   - Dedicated computer with quality microphone
   - ElevenLabs API for automatic transcription
   - Simple on/off control by facilitator or assistant
   - Records â†’ Transcribes â†’ Saves â†’ Distributes to AIs
   - See: KING_Secretary_Recording_System_Complete.md for full specs

2. **AI Speeches:** Programmatically generated
   - AI generates speech text
   - Optionally converted to audio via TTS
   - Transcript distributed to all other AIs

3. **Facilitator Announcements:** Via Secretary workstation or manual entry

```sql
CREATE TABLE public_speeches (
  -- Identity
  speech_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id),
  
  -- Speaker (one of these will be set)
  speaker_role_id UUID REFERENCES roles(role_id), -- NULL for facilitator
  is_facilitator BOOLEAN DEFAULT FALSE,
  is_ai_speaker BOOLEAN DEFAULT FALSE, -- TRUE if AI character speaking
  
  -- Content (transcript is REQUIRED for AI distribution)
  transcript TEXT NOT NULL, -- Required: sent to all AI participants
  audio_url TEXT, -- Optional (stored if recorded/generated)
  
  -- Delivery Method (for reference only)
  delivery_method TEXT CHECK (delivery_method IN (
    'human_microphone',    -- Human spoke into physical mic (via Secretary)
    'ai_tts_playback',     -- AI speech played through facilitator's speakers
    'facilitator_announcement' -- Facilitator's own announcement
  )),
  
  -- Timing (all optional except created_at)
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_speeches_run ON public_speeches(run_id);
CREATE INDEX idx_speeches_phase ON public_speeches(phase_id);
CREATE INDEX idx_speeches_speaker ON public_speeches(speaker_role_id);
```

**Key Points:**
- **Purpose:** Record â†’ Transcribe â†’ Distribute to all AI participants
- **NOT live broadcasting:** Recording happens, then transcript sent to AIs for context update
- **Who speaks publicly:**
  - Candidate speeches (human or AI during election phases)
  - King's final decree
  - Ad-hoc public addresses to entire assembly
  - Facilitator announcements
- **Flow:** Speech recorded (via Secretary workstation) â†’ Transcript created (ElevenLabs) â†’ Event emitted â†’ All AIs receive transcript â†’ AIs update their contexts
- Transcript is canonical and required; audio is optional
- **Secretary System:** Dedicated computer + microphone + ElevenLabs API = automatic transcription in ~30 seconds

#### 3.2.9 `vote_sessions` (Voting Configurations)

```sql
CREATE TABLE vote_sessions (
  -- Identity
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(phase_id),
  
  -- Type & Structure
  vote_type TEXT NOT NULL CHECK (vote_type IN (
    'clan_nomination',      -- Clan selects 1 person to nominate (choose from clan members)
    'election_round',       -- All vote for King (choose from candidates)
    'clan_oath',            -- Oath of allegiance (yes/no/abstain)
    'clan_action',          -- Action against King (yes/no/abstain)
    'facilitator_proposal'  -- Ad-hoc proposal created by facilitator (yes/no/abstain)
  )),
  
  -- Format
  vote_format TEXT NOT NULL CHECK (vote_format IN (
    'choose_person',  -- Select one role_id (clan_nomination, election_round)
    'yes_no'          -- Binary choice (oath, action, facilitator_proposal)
  )),
  
  -- Scope (who can vote)
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN (
    'all',          -- Everyone votes (elections)
    'clan_only'     -- Only specific clan votes (nominations, oath, action)
  )),
  scope_clan_id UUID REFERENCES clans(clan_id), -- Required if scope='clan_only'
  
  -- Options (for choose_person votes)
  eligible_candidates JSONB, -- Array of role_ids that can be chosen
  -- Example: ["role-uuid-1", "role-uuid-2", "role-uuid-3"]
  
  -- Proposal Details (for facilitator_proposal)
  proposal_title TEXT, -- "Should we extend the consultation phase?"
  proposal_description TEXT, -- Full explanation
  
  -- Transparency & Results Reveal (NEW)
  transparency_level TEXT DEFAULT 'open' CHECK (transparency_level IN (
    'open',      -- Show individual votes (who voted for whom)
    'anonymous', -- Show only tallies (vote counts and percentages)
    'secret'     -- Results hidden until facilitator announces
  )),
  
  reveal_timing TEXT DEFAULT 'after_all_votes' CHECK (reveal_timing IN (
    'immediate',        -- Results shown as votes come in
    'after_all_votes',  -- Results shown after all votes cast (default)
    'facilitator_manual' -- Facilitator controls when to reveal
  )),
  
  -- Animation Settings (for dramatic vote counting)
  animation_speed TEXT DEFAULT 'normal' CHECK (animation_speed IN (
    'slow',    -- 1.2 seconds per ballot
    'normal',  -- 0.8 seconds per ballot (default)
    'fast',    -- 0.4 seconds per ballot
    'instant'  -- No animation, show results immediately
  )),
  allow_skip_animation BOOLEAN DEFAULT FALSE, -- Let participants skip animation
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open',       -- Currently accepting votes
    'closed',     -- Voting ended
    'announced'   -- Results announced to participants
  )),
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  announced_at TIMESTAMPTZ
);

CREATE INDEX idx_vote_sessions_run ON vote_sessions(run_id);
CREATE INDEX idx_vote_sessions_phase ON vote_sessions(phase_id);
CREATE INDEX idx_vote_sessions_status ON vote_sessions(status);
CREATE INDEX idx_vote_sessions_clan ON vote_sessions(scope_clan_id) WHERE scope = 'clan_only';
```

**Key Points:**
- **vote_sessions** defines WHAT is being voted on
- Supports both "choose person" and "yes/no" formats
- Facilitator can create ad-hoc proposals during simulation
- Clear scope (all participants vs. specific clan)
- **NEW:** Transparency control (open/anonymous/secret)
- **NEW:** Reveal timing (immediate/after all votes/manual)
- **NEW:** Animation settings for dramatic vote counting

#### 3.2.10a `vote_results` (Calculated Results)

```sql
CREATE TABLE vote_results (
  -- Identity
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id) ON DELETE CASCADE,
  
  -- Results Data
  results_data JSONB NOT NULL,
  -- Format for 'choose_person' votes:
  -- {
  --   "winner": {"role_id": "...", "name": "Marcus", "vote_count": 6, "percentage": 40},
  --   "all_candidates": [
  --     {"role_id": "...", "name": "Marcus", "vote_count": 6, "percentage": 40},
  --     {"role_id": "...", "name": "Dimitri", "vote_count": 5, "percentage": 33},
  --     {"role_id": "...", "name": "Sofia", "vote_count": 4, "percentage": 27}
  --   ],
  --   "total_votes": 15,
  --   "tie": false
  -- }
  
  -- Format for 'yes_no' votes:
  -- {
  --   "yes": 8, "no": 5, "abstain": 2,
  --   "total": 15,
  --   "yes_percentage": 53.3,
  --   "no_percentage": 33.3,
  --   "abstain_percentage": 13.3,
  --   "passed": true  // If threshold met (if applicable)
  -- }
  
  -- Timeline
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  announced_at TIMESTAMPTZ, -- When results were revealed to participants
  
  -- Animation
  animation_shown BOOLEAN DEFAULT TRUE,
  animation_duration_seconds INTEGER, -- Actual time animation took
  
  -- Audit
  calculated_by UUID REFERENCES users(id), -- Facilitator who triggered calculation
  
  -- Constraint
  UNIQUE(session_id) -- One result record per session
);

CREATE INDEX idx_vote_results_session ON vote_results(session_id);
CREATE INDEX idx_vote_results_calculated ON vote_results(calculated_at);
```

**Key Points:**
- **vote_results** stores calculated tallies and winner
- Separate from individual votes (in `votes` table)
- JSONB format allows flexible data structure
- Tracks when results calculated vs. when announced
- Records animation metadata

#### 3.2.10 `votes` (Individual Vote Records)

```sql
CREATE TABLE votes (
  -- Identity
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vote_sessions(session_id) ON DELETE CASCADE,
  
  -- Voter
  voter_role_id UUID NOT NULL REFERENCES roles(role_id),
  voter_clan_id UUID NOT NULL REFERENCES clans(clan_id),
  
  -- Choice (one of these will be set based on vote_format)
  
  -- For 'choose_person' format:
  chosen_role_id UUID REFERENCES roles(role_id), -- The person they voted for
  
  -- For 'yes_no' format:
  yes_no_choice TEXT CHECK (yes_no_choice IN ('yes', 'no', 'abstain')),
  
  -- Timing
  cast_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation (one vote per session per voter)
  UNIQUE(session_id, voter_role_id)
);

CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_votes_voter ON votes(voter_role_id);
CREATE INDEX idx_votes_chosen ON votes(chosen_role_id);
CREATE INDEX idx_votes_choice ON votes(yes_no_choice);
```

**Key Points:**
- **votes** stores individual vote records
- Flexible: supports both person selection and yes/no voting
- UNIQUE constraint: one vote per participant per session
- Simple to query: "show me all votes for this session"

**Vote Type Examples:**

| Vote Type | Format | Scope | Example |
|-----------|--------|-------|---------|
| **Clan Nomination** | choose_person | clan_only | Agriculture clan selects who to nominate for King |
| **Election Round 1** | choose_person | all | Everyone votes for their preferred candidate |
| **Clan Oath** | yes_no | clan_only | "Do you swear allegiance to the King?" |
| **Clan Action** | yes_no | clan_only | "Do you support action against the King?" |
| **Facilitator Proposal** | yes_no | all or clan_only | "Should we extend the consultation phase by 10 minutes?" |

#### 3.2.11 `king_decisions` (Royal Decrees)

```sql
CREATE TABLE king_decisions (
  -- Identity
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  
  -- King
  king_role_id UUID NOT NULL REFERENCES roles(role_id),
  
  -- Decisions (from KING_Decisions.md structure)
  taxes JSONB NOT NULL, 
  -- { agriculture: 'lower'|'same'|'higher', trade: ..., banking: ..., craft: ... }
  
  budget_priorities JSONB NOT NULL,
  -- { priority_1: 'defense'|'culture'|..., priority_2: ..., priority_3: ... }
  
  appointments JSONB NOT NULL,
  -- { economic_advisor: role_id, senior_judge: role_id }
  
  international_affairs JSONB NOT NULL,
  -- { alliance: 'Salamis'|'Kition'|'none', war_declarations: [...] }
  
  other_decisions TEXT, -- Free text for custom decisions
  
  -- Final Speech
  final_speech_transcript TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation (one decree per run)
  UNIQUE(run_id)
);

CREATE INDEX idx_king_decisions_run ON king_decisions(run_id);
CREATE INDEX idx_king_decisions_king ON king_decisions(king_role_id);
```

#### 3.2.12 `reflections` (Individual Reflections)

```sql
CREATE TABLE reflections (
  -- Identity
  reflection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(phase_id), -- NULL for post-run reflection
  
  -- Author
  role_id UUID NOT NULL REFERENCES roles(role_id),
  
  -- Type
  reflection_type TEXT NOT NULL CHECK (reflection_type IN (
    'personal',      -- Individual reflection
    'group',         -- Clan/group reflection
    'ai_generated'   -- AI-assisted reflection
  )),
  
  -- Content (text required, AI fields optional)
  reflection_text TEXT NOT NULL,
  
  -- AI Assistance (all optional)
  ai_summary TEXT, -- If AI processed this reflection
  ai_insights JSONB, -- Structured insights
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_run ON reflections(run_id);
CREATE INDEX idx_reflections_role ON reflections(role_id);
CREATE INDEX idx_reflections_phase ON reflections(phase_id);
```

#### 3.2.13 `ai_context` (AI Participant Cognitive State)

```sql
CREATE TABLE ai_context (
  -- Identity
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(role_id),
  
  -- Version Control
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  
  -- The Four Blocks (as per KING_AI_DESIGN.md)
  
  -- Block 1: FIXED CONTEXT (set once, immutable)
  block_1_fixed JSONB NOT NULL,
  -- { world_rules, stages, structure, possible_actions, architecture }
  
  -- Block 2: IDENTITY (stable but can evolve)
  block_2_identity JSONB NOT NULL,
  -- { age, clan, role, backstory, values, personality, ... }
  
  -- Block 3: MEMORY (compacted, bounded)
  block_3_memory JSONB NOT NULL,
  -- { events: [...], relationships: {...}, obligations: [...], conflicts: [...] }
  
  -- Block 4: GOALS & PLANS (evolves frequently)
  block_4_goals JSONB NOT NULL,
  -- { goals: [...], hypotheses: [...], strategies: [...], priorities: [...] }
  
  -- Metadata
  updated_trigger TEXT, -- What caused this update (e.g., "speech_42", "meeting_15")
  updated_reason TEXT, -- AI's explanation for changes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation
  CHECK (
    (is_current = TRUE AND version = (
      SELECT MAX(version) 
      FROM ai_context ac2 
      WHERE ac2.role_id = ai_context.role_id
    ))
    OR is_current = FALSE
  )
);

CREATE INDEX idx_ai_context_role ON ai_context(role_id);
CREATE INDEX idx_ai_context_current ON ai_context(role_id, is_current) 
  WHERE is_current = TRUE;
CREATE INDEX idx_ai_context_version ON ai_context(role_id, version);
```

**Key Points:**
- Complete cognitive state in 4 JSONB blocks
- Versioned: old states preserved for analysis
- Only ONE `is_current = TRUE` per role
- `updated_trigger` traces what event caused update

#### 3.2.14 `event_log` (Audit Trail)

```sql
CREATE TABLE ai_prompts (
  -- Identity
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Prompt Classification
  prompt_type TEXT NOT NULL CHECK (prompt_type IN (
    'block_1_fixed',           -- Block 1: FIXED CONTEXT system prompt
    'block_2_identity_update', -- Block 2: IDENTITY reflection prompt
    'block_3_memory_update',   -- Block 3: MEMORY reflection prompt
    'block_4_goals_update',    -- Block 4: GOALS & PLANS reflection prompt
    'action_decision',         -- Prompts for specific actions (vote, invite, etc.)
    'public_speech',           -- Prompt for generating public speeches
    'personal_feedback',       -- Prompt for generating personal feedback after simulation
    'debrief_analysis',        -- Prompt for analyzing simulation data for debrief
    'induction_assistant'      -- Prompt for AI induction assistant (Zenon)
  )),
  
  -- Versioning
  version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT FALSE, -- Only ONE active prompt per type
  
  -- Prompt Content
  system_prompt TEXT NOT NULL, 
  -- The actual system prompt/instruction sent to LLM
  
  user_prompt_template TEXT,
  -- Optional template for user message (with {{variables}})
  -- Example: "NEW INFORMATION:\n{{new_context}}\n\nYOUR CURRENT STATE:\nIdentity: {{block_2}}\nMemory: {{block_3}}\nGoals: {{block_4}}\n\nUpdate your cognitive state."
  
  -- LLM Configuration
  default_llm_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  -- Suggested model, but can be overridden per sim_run
  
  default_temperature DECIMAL(3,2) DEFAULT 0.7,
  default_max_tokens INTEGER DEFAULT 4096,
  
  -- Metadata & Documentation
  name TEXT NOT NULL, -- Human-readable name: "Block 2 Identity Update v1.0"
  description TEXT,   -- What this prompt does
  usage_notes TEXT,   -- When/how to use this prompt
  
  -- Authorship & Timing
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation: Only one active prompt per type
  UNIQUE(prompt_type, version)
);

CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(prompt_type, is_active) 
  WHERE is_active = TRUE;

-- Ensure only ONE active prompt per type
CREATE UNIQUE INDEX idx_ai_prompts_active_unique 
  ON ai_prompts(prompt_type) 
  WHERE is_active = TRUE;
```

**Key Points:**
- **Centralized prompt management**: All AI prompts in one place
- **Versioning**: Multiple versions of each prompt, only one active
- **Facilitator can customize**: Review and change prompts in Configurator UI
- **Per-run override**: `sim_runs.config` can override default prompts
- **Template variables**: User prompts support {{variables}} for dynamic content

**Prompt Types Explained:**

| Prompt Type | Purpose | When Used | Input Variables |
|-------------|---------|-----------|----------------|
| `block_1_fixed` | System prompt explaining AI architecture, world rules, possible actions | Once at AI initialization | role definition, world context, stages |
| `block_2_identity_update` | Guides AI to update identity after dramatic events | After each new context (speech, meeting, vote) | current identity, new information |
| `block_3_memory_update` | Guides AI to compress and update memory | After each new context | current memory, new information |
| `block_4_goals_update` | Guides AI to revise goals and plans | After each new context | current goals, new information |
| `action_decision` | Prompt for AI to make specific decisions (vote, invite, etc.) | When action is required | action type, available options, AI's current context blocks |
| `public_speech` | Guides AI to generate speech content | When AI needs to make public speech | speech context, time limit, current goals |
| `personal_feedback` | Generates personalized learning feedback | End of simulation | participant's actions, reflections, learning objectives |
| `debrief_analysis` | Analyzes simulation data for group debrief | Debrief phase | all simulation data, coalition patterns, key decisions |
| `induction_assistant` | Zenon AI assistant personality | Induction phase, reflection dialogues | participant's questions, role, learning objectives |

#### 3.2.15 `sim_run_prompts` (Prompt Overrides per Simulation)

```sql
CREATE TABLE sim_run_prompts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  
  -- Override Configuration
  custom_prompt_id UUID REFERENCES ai_prompts(prompt_id), -- If using custom prompt
  llm_model_override TEXT, -- Override default model for this simulation
  temperature_override DECIMAL(3,2),
  max_tokens_override INTEGER,
  
  -- Metadata
  notes TEXT, -- Why this override was made
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(run_id, prompt_type)
);

CREATE INDEX idx_sim_run_prompts_run ON sim_run_prompts(run_id);
```

**Usage Pattern:**
```typescript
// Facilitator customizes AI prompts for specific simulation
await supabase.from('sim_run_prompts').insert({
  run_id: 'sim_123',
  prompt_type: 'block_3_memory_update',
  custom_prompt_id: 'prompt_456', // Using experimental memory prompt
  llm_model_override: 'claude-opus-4.1', // Better model for this critical prompt
  notes: 'Testing more aggressive memory compression'
});

// System retrieves prompt for AI context update
const activePrompt = await getPromptForRun('sim_123', 'block_3_memory_update');
// Returns custom_prompt_id if set, otherwise falls back to default active prompt
```

#### 3.2.16 `event_log` (Audit Trail)

```sql
CREATE TABLE event_log (
  -- Identity
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  
  -- Event Classification
  event_type TEXT NOT NULL, -- e.g., 'phase_start', 'vote_cast', 'meeting_invite'
  module TEXT NOT NULL, -- e.g., 'stage_engine', 'voting', 'meetings'
  
  -- Actor
  actor_type TEXT NOT NULL CHECK (actor_type IN (
    'facilitator', 'human_participant', 'ai_participant', 'system'
  )),
  actor_id UUID, -- role_id or user_id, NULL for system events
  
  -- Target (optional)
  target_type TEXT, -- e.g., 'phase', 'meeting', 'vote'
  target_id UUID,
  
  -- Payload
  payload JSONB NOT NULL, -- Event-specific data
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_log_run ON event_log(run_id);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_actor ON event_log(actor_id);
CREATE INDEX idx_event_log_created ON event_log(created_at);
```

**Key Points:**
- Captures EVERYTHING that happens in simulation
- Used for replay, debugging, analytics
- Partitioned by `created_at` for performance (future)

#### 3.2.15 `facilitator_actions` (Manual Overrides)

```sql
CREATE TABLE facilitator_actions (
  -- Identity
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES sim_runs(run_id) ON DELETE CASCADE,
  
  -- Facilitator
  facilitator_id UUID NOT NULL REFERENCES users(id),
  
  -- Action
  action_type TEXT NOT NULL, -- e.g., 'extend_phase', 'override_vote', 'mute_ai'
  target_type TEXT NOT NULL, -- e.g., 'phase', 'vote', 'role'
  target_id UUID NOT NULL,
  
  -- Details
  action_details JSONB NOT NULL, -- Old value, new value, reason
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facilitator_actions_run ON facilitator_actions(run_id);
CREATE INDEX idx_facilitator_actions_facilitator ON facilitator_actions(facilitator_id);
```

---

### 3.3 Supporting Tables

#### 3.3.1 `simulation_templates` (Canonical Seed Data Storage)

**Purpose:** Stores the master "theatre play" designs that can be instantiated into specific simulation runs.

**Philosophy:**
- **Canonical Design** = "The written play" (reusable, versioned)
- **SIM Instance** = "Director's production" (customized, immutable once started)

```sql
CREATE TABLE simulation_templates (
  -- Identity
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'The New King of Kourion',
  version TEXT NOT NULL DEFAULT 'v1.0',
  language TEXT NOT NULL DEFAULT 'ENG' CHECK (language IN ('ENG', 'RU')),
  
  -- Canonical Design (parsed from seed files)
  context_text TEXT NOT NULL, 
  -- Full text from KING_Context.md (world setting, general interests)
  
  process_stages JSONB NOT NULL,
  -- Parsed from KING_Process.csv
  -- [
  --   { sequence: 1, name: "Clan Councils 1", description: "...", default_duration_minutes: 10 },
  --   { sequence: 2, name: "Free Consultations 1", description: "...", default_duration_minutes: 15 },
  --   ...
  -- ]
  
  decisions_framework JSONB NOT NULL,
  -- Parsed from KING_Decisions.md
  -- {
  --   taxes: { options: ["lower", "same", "higher"], categories: ["agriculture", "trade", ...] },
  --   budget_priorities: { options: ["defense", "culture", "agriculture", ...] },
  --   appointments: { positions: ["economic_advisor", "senior_judge"] },
  --   international_affairs: { alliances: ["Salamis", "Kition", "none"], wars: [...] }
  -- }
  
  canonical_clans JSONB NOT NULL,
  -- Parsed from KING_ALL_CLANs.csv
  -- [
  --   {
  --     name: "Artificers",
  --     about: "Our clan represents...",
  --     key_priorities: "The best King must...",
  --     attitude_to_others: "We respect the Military...",
  --     if_things_go_wrong: "If the King fails..."
  --   },
  --   { name: "Bankers", ... },
  --   ...
  -- ]
  
  canonical_roles JSONB NOT NULL,
  -- Parsed from KING_ALL_ROLES.csv (up to 30 roles)
  -- [
  --   {
  --     sequence: 1,
  --     name: "Architekton Metrodoros Tekhnaios",
  --     clan: "Artificers",
  --     age: 44,
  --     position: "Master of Naval Engineering",
  --     background: "Metrodoros has designed...",
  --     character_traits: "Brilliant and innovative...",
  --     interests: "I believe my proven ability..."
  --   },
  --   { sequence: 2, name: "Sophia...", ... },
  --   ...
  -- ]
  
  -- Metadata
  description TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(name, version, language)
);

CREATE INDEX idx_simulation_templates_active ON simulation_templates(is_active);
CREATE INDEX idx_simulation_templates_language ON simulation_templates(language);
```

**MVP Configuration:**
- **Single row** inserted during deployment: "The New King of Kourion v1.0" (ENG)
- Facilitator automatically loads this default template when creating a simulation
- Future versions (v1.1, v2.0) or translations (RU) can be added as new rows

**Usage Pattern:**
```typescript
// Facilitator creates new simulation
const template = await supabase
  .from('simulation_templates')
  .select('*')
  .eq('is_active', true)
  .single(); // MVP: Only one active template

// Facilitator customizes (see Section 4.1 for full flow)
const customization = {
  selected_roles: template.canonical_roles.slice(0, 20), // Pick 20 of 30
  role_edits: { /* optional changes */ },
  ai_assignments: [
    { role_name: 'Metrodoros', elevenlabs_agent_id: 'agent_male_01' }
  ],
  timing_adjustments: { /* stage duration overrides */ }
};

// System creates immutable sim_run instance
const simRun = await createSimInstance(template, customization);
```

---

### 3.4 Database Constraints & Business Rules

#### Critical Constraints

```sql
-- 1. Only one active phase per run at a time
CREATE UNIQUE INDEX idx_one_active_phase_per_run 
ON phases(run_id) 
WHERE status = 'active';

-- 2. Only one current AI context per role
CREATE UNIQUE INDEX idx_one_current_context_per_role
ON ai_context(role_id)
WHERE is_current = TRUE;

-- 3. No voting twice in same phase
ALTER TABLE votes 
ADD CONSTRAINT unique_vote_per_phase_per_voter 
UNIQUE(phase_id, vote_type, voter_role_id);

-- 4. King decisions only once per run
ALTER TABLE king_decisions
ADD CONSTRAINT unique_decree_per_run
UNIQUE(run_id);

-- 5. Meeting participants must include organizer
ALTER TABLE meetings
ADD CONSTRAINT organizer_in_participants
CHECK (participants @> jsonb_build_array(organizer_role_id::text));
```

#### Row-Level Security (RLS)

```sql
-- Example: Participants can only see their own role's data
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators see all roles"
ON roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'facilitator'
  )
);

CREATE POLICY "Participants see only their role"
ON roles FOR SELECT
TO authenticated
USING (
  assigned_user_id = auth.uid()
);

-- Similar policies for meetings, votes, etc.
```

---

## 4. DATA FLOW PATTERNS

### 4.1 Simulation Lifecycle (The "Director's Workflow")

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š PHASE 0: SEED DATA DEPLOYMENT (ONE-TIME SETUP)              Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

0. System deployment includes seed data import:
   - Read KING_Context.md, KING_Process.csv, KING_Decisions.md, 
     KING_ALL_CLANs.csv, KING_ALL_ROLES.csv
   - Parse and insert into simulation_templates table
   - Result: ONE canonical template "The New King of Kourion v1.0"

Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š PHASE 1: SETUP & CONFIGURATION (The Director's Production)  Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

1. Facilitator clicks "Create New Simulation"
2. System automatically loads default template:
   - simulation_templates WHERE is_active = TRUE (only one for MVP)
   - Shows: 6 clans, 30 roles, 12 stages

3. Facilitator customizes (the "director's interpretation"):
   
   a. SELECT PARTICIPANTS (5-30 roles)
      - Drag & drop or checkbox to select roles from 30 available
      - System ensures clan balance (at least 1 per clan)
   
   b. ASSIGN AI CHARACTERS (optional, 0-10 AIs recommended)
      - For each selected role, toggle "AI" switch
      - If AI: Select from dropdown of pre-created ElevenLabs agents:
        * "Male Voice 1" Ã¢â€ â€™ agent_abc123
        * "Female Voice 2" Ã¢â€ â€™ agent_def456
        * "Male Voice 3" Ã¢â€ â€™ agent_ghi789
   
   c. EDIT ROLES/CLANS (optional)
      - Click "Edit" on any role: adjust interests, background
      - Click "Edit" on any clan: adjust priorities, attitudes
      - Changes stored in sim_run.config (template remains unchanged)
   
   d. ADJUST TIMING (optional)
      - Global multiplier: "Make all stages 20% longer"
      - Or edit individual stage durations
      - Default durations from template.process_stages
   
   e. SET LEARNING OBJECTIVES (optional)
      - Up to 3 text fields for session goals
      - Example: "Practice coalition building under pressure"
   
   f. CUSTOMIZE VOTING THRESHOLDS (Sacred Tradition - optional)
      - Vote 1 threshold: Integer number of votes required (default: ⌈2/3 × total_participants⌉)
      - Vote 2 threshold: Integer number of votes required (default: ⌈2/3 × total_participants⌉)
      - Both thresholds default to NULL (system calculates 2/3 majority)
      - Facilitator can override with specific vote count (e.g., "12 votes out of 18")

4. System validates configuration:
   - At least 5 participants
   - At least 1 role per selected clan
   - AI agents assigned valid elevenlabs_agent_ids
   - Stage durations reasonable (5-60 min range)
   - Vote thresholds between 1 and total_participants (if specified)

5. Facilitator previews configuration:
   - Summary screen shows all customizations
   - Option to export as PDF (for printing role briefs)

6. Facilitator clicks "Lock & Create Instance"
   
7. System creates immutable sim_run record:
   - status = 'setup'
   - config = complete snapshot (template + all customizations)
   - config_checksum = MD5 hash for integrity

8. System spawns child records:
   - INSERT INTO clans (from config.clans) Ã¢â€ â€™ 6 rows
   - INSERT INTO roles (from config.roles) Ã¢â€ â€™ 20 rows
   - INSERT INTO phases (from config.process_stages) Ã¢â€ â€™ 12 rows

9. System generates participant access:
   - For human roles: QR codes or magic links
   - For AI roles: nothing (system-controlled)

10. Status changes to 'ready'
    - Configuration now IMMUTABLE
    - Facilitator can start simulation anytime

### 4.1.8 Printable Materials Generation

After simulation configuration is complete, facilitators can generate print-ready participant packages.

**Flow:**
1. Navigate to `/simulation/:runId/print`
2. System loads:
   - Simulation configuration (name, voting thresholds)
   - All roles with clan assignments
   - All clans with descriptions and logos
   - All phases with durations
3. Generate 4-page package per participant:
   - **Page 1:** Context + Participant Identity + Clans Overview
   - **Page 2:** Role Details (avatar, background, traits, interests)
   - **Page 3:** Clan Details (logo, priorities, attitudes)
   - **Page 4:** Process stages with timing and voting requirements
4. Print layout optimized for A4 (210mm × 297mm)
5. Browser print dialog → Print all packages

**Key Implementation Details:**
- Voting thresholds loaded from `sim_runs.vote_1_threshold` and `vote_2_threshold`
- Stage detection: "Vote 1" and "Vote 2" stages automatically display correct threshold
- Format: "X votes out of Y needed" displayed inline with stage name
- CSS print media queries ensure clean A4 output without blank pages
- Header made compact to maximize content space (15-20mm vertical space saved)

Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š PHASE 2: ROLE DISTRIBUTION & INDUCTION                      Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

11. Participants scan QR / click link
12. System authenticates, shows role assignment
13. Participant views induction (context, rules, clan info)
14. Optional: AI induction assistant (voice/text chat)
15. Participant clicks "Ready"
16. System tracks readiness (event_log)

Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š PHASE 3: SIMULATION EXECUTION                                Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

For each phase:
17. Facilitator starts phase (or auto-start if configured)
18. System updates phase.status = 'active'
19. System emits PhaseStarted event (Realtime)
20. All clients receive event, update UI

21. Phase-specific logic executes:
    - Clan Council: Auto-create clan meetings
    - Free Consultation: Enable meeting invites
    - Speeches: Enable speech recording
    - Voting: Open ballot forms

22. Participants interact (meetings, votes, speeches)
23. AI characters react to events (auto-update context)

24. Phase ends (timer expires OR facilitator manual end)
25. System updates phase.status = 'completed'
26. System emits PhaseEnded event

27. System triggers post-phase actions:
    - Calculate vote tallies
    - Publish results (if configured)
    - Generate AI reflections

Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š PHASE 4: DEBRIEFING & REFLECTION                            Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

28. Facilitator triggers reflection phase
29. Participants submit reflections (text/voice)
30. AI generates insights (optional)
31. System produces debrief report

32. Facilitator closes simulation (status='completed')
33. System generates final analytics, exports data
```

### 4.2 Template vs Instance (Data Relationship)

```
TEMPLATE (Canonical - Reusable)
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š simulation_templates                     Ã¢â€â€š
Ã¢â€â€š "The New King of Kourion v1.0"          Ã¢â€â€š
Ã¢â€â€š                                          Ã¢â€â€š
Ã¢â€â€š - 6 clans (master definitions)          Ã¢â€â€š
Ã¢â€â€š - 30 roles (full cast)                  Ã¢â€â€š
Ã¢â€â€š - 12 stages (default timing)            Ã¢â€â€š
Ã¢â€â€š - Decisions framework                    Ã¢â€â€š
Ã¢â€â€š - World context                          Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
              Ã¢â€ â€œ (Facilitator customizes)
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š CUSTOMIZATION LAYER                      Ã¢â€â€š
Ã¢â€â€š - Select 20 of 30 roles                  Ã¢â€â€š
Ã¢â€â€š - Assign 5 AI characters                 Ã¢â€â€š
Ã¢â€â€š - Edit role interests (optional)         Ã¢â€â€š
Ã¢â€â€š - Adjust stage timings (+20%)            Ã¢â€â€š
Ã¢â€â€š - Set learning objectives                Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
              Ã¢â€ â€œ (Lock & Launch)
INSTANCE (Immutable - Specific Run)
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š sim_runs                                 Ã¢â€â€š
Ã¢â€â€š "Exness Team - Oct 2025"                Ã¢â€â€š
Ã¢â€â€š                                          Ã¢â€â€š
Ã¢â€â€š config: {                                Ã¢â€â€š
Ã¢â€â€š   template_id: xxx,                      Ã¢â€â€š
Ã¢â€â€š   template_version: "v1.0",              Ã¢â€â€š
Ã¢â€â€š   customizations: { ... }                Ã¢â€â€š
Ã¢â€â€š }                                        Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¤
Ã¢â€â€š Ã¢â€ Â³ clans (6 rows)                         Ã¢â€â€š
Ã¢â€â€š Ã¢â€ Â³ roles (20 rows, 5 AI, 15 human)       Ã¢â€â€š
Ã¢â€â€š Ã¢â€ Â³ phases (12 rows, adjusted timing)     Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
```

### 4.2a Template Management Architecture (Phase 2.2 Update)

**Separation of Concerns:** Template editing and instance creation are now separate workflows.

**Template Editor ("Edit Scenario")**
- **Purpose:** Create and modify simulation templates (master designs)
- **Location:** `/scenario/edit` route, accessed from Dashboard "Quick Actions"
- **Operations:**
  - View all available templates
  - Select template to edit
  - **Duplicate template** (creates new version, e.g., v1.0 → v1.1)
  - **Manage Clans** (CRUD operations):
    - Add, edit, delete clans
    - Fields: name, about, key_priorities, attitude_to_others, if_things_go_wrong, color_hex
  - **Manage Roles** (CRUD operations):
    - Add, edit, delete roles
    - Fields: sequence, name, age, clan, position, background, character_traits, interests
  - Save changes to database
- **Data Storage:** Updates `simulation_templates` table
- **Non-destructive:** Editing template does NOT affect existing simulation instances

**Instance Creator ("Simulation Wizard")**
- **Purpose:** Create concrete simulation instances from templates
- **Location:** `/simulation/create` route, accessed from Dashboard "Quick Actions"
- **7-Step Wizard Flow:**
  1. **Template Selection** - Choose base template (read-only view)
  2. **Basic Configuration** - Run name, learning objectives
  3. **Clans & Roles** - Select subset, assign AI vs Human
  4. **Phase Timing** - Customize stage durations
  5. **Review** - Preview complete configuration
  6. **Create** - Generate instance snapshot
  7. **Success** - Confirmation
- **Data Storage:** Creates record in `sim_runs` table with frozen template snapshot
- **Immutable:** Once created, simulation configuration cannot be changed

**Role Data Population (Migration 00010)**
- **Source:** `/DOCS/KING_SIM_BASE/KING_ALL_ROLES.csv`
- **Fields Added:** background, character_traits, interests for all 30 roles
- **Database:** Updates existing template in `simulation_templates` table
- **Status:** Applied successfully - all roles now have complete character details

**Key Principles:**
- Templates are versioned (v1.0, v1.1, etc.)
- Changes to templates do NOT affect existing simulations
- Simulations reference template snapshot at creation time
- JSONB storage allows flexible data structure evolution

### 4.3 Meeting Flow (Free Consultation)

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š SCENARIO: AI Participant Initiates Meeting with Human      Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

1. Stage Engine triggers "Free Consultation" phase
2. AI Orchestrator activates all AI participants

Every 5 minutes during phase:
3. System asks each AI: "Do you want to initiate meeting?"
   - API call to LLM with current context (4 blocks)
   - LLM responds: { wants_meeting: true/false, targets: [role_ids] }

4. IF wants_meeting = true:
   - System creates meeting record (status='pending')
   - System creates meeting_invitation records for targets
   - System emits MeetingInviteCreated event (Realtime)

5. Target participants receive invite (toast + badge)
   - Human sees: "Metrodoros invites you to discuss harbor plans"
   - AI receives event, LLM decides: accept/decline/postpone

6. Target responds (accept/decline)
   - System updates meeting_invitation.status
   - If ALL accept: meeting.status = 'accepted'
   - System emits MeetingAccepted event

7. Meeting starts:
   - System updates meeting.status = 'active'
   - System determines modality:
     * All human: physical (no tracking)
     * Any AI: voice or text (based on config)
   
8. IF modality = 'voice':
   - System calls AI Context Builder
   - Loads all 4 blocks for AI participants
   - Generates intent_note (from Block 4: Goals)
   - Calls ElevenLabs API (create conversation)
   - Returns WebRTC connection details
   - Human(s) join via WebRTC on their personal devices (headphones recommended)
   - AI speaks via ElevenLabs agent

9. During meeting:
   - Transcript captured in real-time
   - Auto-save every 30s to meetings.transcript

10. Meeting ends (timer OR manual end):
    - System updates meeting.status = 'completed'
    - System fetches final transcript
    - System emits MeetingEnded event

11. Post-meeting processing:
    - For each AI participant:
      * System triggers AI Context Update
      * LLM receives: transcript + current context (4 blocks)
      * LLM updates blocks 2-4
      * System saves new version to ai_context (version++)
      * Old version marked is_current=false
```

### 4.3 AI Public Speech Flow (Candidate Speeches)

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š SCENARIO: AI Character Gives Public Speech to All          Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

1. Facilitator advances to "Candidate Speeches" phase
2. Candidates list displayed (mix of human and AI)

When AI candidate's turn:
3. Facilitator clicks "Play AI Speech" button for that candidate

4. System retrieves AI context:
   - Loads current ai_context (all 4 blocks)
   - Extracts speech strategy from block_4_goals
   - Loads character personality from block_2_identity

5. System generates speech content:
   - API call to LLM (same model as character's MAIN PERSONA)
   - Prompt: "You are giving your public speech for King election..."
   - Context: personality + goals + memory of what happened
   - Max length: 2 minutes (or 3 for round 2)
   - Output: Full speech text

6. System converts to audio:
   - API call to ElevenLabs TTS
   - voice_id: From character.elevenlabs_voice_id
   - Returns: Audio file URL

7. Facilitator's laptop plays audio:
   - Browser Audio API plays through room speakers
   - All humans in room hear AI "speaking"
   - Duration: Actual speech length (auto-ends)

8. System saves speech record to public_speeches table:
   - speaker_role_id: AI character
   - transcript: Generated speech text
   - audio_url: TTS file
   - delivery_method: 'ai_tts_playback'
   - is_ai_speaker: TRUE

9. System distributes transcript to all AI participants:
   - Emits PublicSpeechRecorded event
   - All AI characters receive transcript
   - Triggers context updates for all AIs (see 4.4)

10. Facilitator UI shows:
    - "Speech complete" confirmation
    - Option to replay audio
    - Move to next candidate button
```

### 4.4 AI Context Update Flow

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š TRIGGER: New Information for AI Participant                 Ã¢â€â€š
Ã¢â€â€š (Public Speech, Meeting Transcript, Vote Result)                Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

1. System detects update trigger:
   - Public speech recorded (speaker made public speech)
   - Meeting ended (transcript available)
   - Vote results announced

2. System identifies affected AI participants:
   - For public speech: ALL AIs
   - For meeting: AIs who were present
   - For vote: ALL AIs (if public) or clan AIs (if clan vote)

3. For each affected AI:
   
   a. Load Current Context:
      - Query ai_context WHERE role_id=X AND is_current=TRUE
      - Extract all 4 blocks
   
   b. Build Update Prompt:
      ```
      NEW INFORMATION:
      [transcript or vote result or speech]
      
      YOUR CURRENT STATE:
      Block 1 (Fixed): [immutable world rules]
      Block 2 (Identity): [current identity state]
      Block 3 (Memory): [current memories]
      Block 4 (Goals): [current goals]
      
      INSTRUCTIONS:
      Review this new information and update your cognitive state.
      - Block 2: Only change if MAJOR event shifts your identity
      - Block 3: Add important facts, compact old memories if needed
      - Block 4: Adjust goals/strategies based on new information
      
      OUTPUT FORMAT:
      {
        "block_2_identity": { ... },
        "block_3_memory": { ... },
        "block_4_goals": { ... },
        "updated_reason": "explanation of changes"
      }
      ```
   
   c. Call LLM API:
      - Model: From role.ai_config.llm_model
      - Timeout: 15 seconds
      - Retry: 2 attempts
   
   d. Save New Version:
      - Mark old version: is_current=FALSE
      - Insert new row:
        * version = old_version + 1
        * is_current = TRUE
        * updated_trigger = 'speech_42' or 'meeting_15'
        * updated_reason = from LLM output
      - Log to event_log
   
   e. Handle Failures:
      - If LLM timeout: Log error, AI continues with old context
      - If malformed response: Log error, AI continues with old context
      - Facilitator sees alert in console
```

### 4.4 Voting Flow

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š SCENARIO: Election Round 1                                  Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

1. Facilitator advances to "Vote 1" phase
2. System loads candidates (from previous nominations)
3. System opens voting UI for all participants

4. Human participant votes:
   - Selects candidate from dropdown (or abstain)
   - Clicks "Submit Vote"
   - System validates:
     * Phase is active
     * Participant hasn't voted yet (UNIQUE constraint)
     * Candidate is valid
   - System inserts row to votes table
   - System emits VoteCast event (to facilitator only)

5. AI participant votes:
   - System asks each AI (in parallel):
     * API call to LLM with context + candidates list
     * LLM responds: { choice: role_id or null, reasoning: "..." }
   - System inserts vote (same table as humans)

6. Facilitator monitors progress:
   - Console shows: "15/20 votes cast"
   - Can see who voted (not choices)

7. Voting closes:
   - Timer expires OR facilitator clicks "Close Voting"
   - System updates phase.status = 'completed'

8. System calculates results:
   - Query: SELECT candidate_role_id, COUNT(*) 
            FROM votes WHERE phase_id=X
            GROUP BY candidate_role_id
   - Apply threshold (e.g., 2/3 majority for Round 1)
   
9. Facilitator publishes results:
   - System records public speech (facilitator announces winner)
   - System emits VoteResultsPublished event
   - All participants see results

10. System triggers AI context updates (see 4.3)
```

---

## 5. EVENT SYSTEM ARCHITECTURE

### 5.1 Event Bus Implementation

**Technology:** PostgreSQL LISTEN/NOTIFY via Supabase Realtime

```typescript
// Event Types (exhaustive list)
type EventType = 
  | 'phase_started'
  | 'phase_ended'
  | 'phase_paused'
  | 'meeting_invite_created'
  | 'meeting_invite_accepted'
  | 'meeting_invite_declined'
  | 'meeting_started'
  | 'meeting_ended'
  | 'public_speech_recorded'
  | 'vote_cast'
  | 'vote_results_published'
  | 'ai_context_updated'
  | 'facilitator_override'
  | 'participant_joined'
  | 'participant_left';

// Event Payload Structure
interface Event {
  event_id: string;
  event_type: EventType;
  run_id: string;
  phase_id?: string;
  actor_id?: string;
  actor_type: 'facilitator' | 'human_participant' | 'ai_participant' | 'system';
  payload: Record<string, any>;
  timestamp: string; // ISO 8601
}
```

### 5.2 Event Emission (Backend)

```typescript
// Supabase Edge Function: emit_event
async function emitEvent(event: Event) {
  // 1. Insert to event_log table
  const { data, error } = await supabase
    .from('event_log')
    .insert({
      run_id: event.run_id,
      event_type: event.event_type,
      module: inferModule(event.event_type),
      actor_type: event.actor_type,
      actor_id: event.actor_id,
      target_type: event.payload.target_type,
      target_id: event.payload.target_id,
      payload: event.payload
    });

  // 2. Broadcast via Realtime (PostgreSQL NOTIFY)
  // Supabase automatically broadcasts INSERT events
  // No explicit NOTIFY needed
}

// Usage example
await emitEvent({
  event_id: crypto.randomUUID(),
  event_type: 'phase_started',
  run_id: 'run-123',
  phase_id: 'phase-456',
  actor_type: 'facilitator',
  actor_id: 'user-789',
  payload: { phase_name: 'Clan Council 1' },
  timestamp: new Date().toISOString()
});
```

### 5.3 Event Subscription (Frontend)

```typescript
// React Hook: useEventSubscription
function useEventSubscription(runId: string, eventTypes: EventType[]) {
  useEffect(() => {
    const subscription = supabase
      .channel(`run:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_log',
          filter: `run_id=eq.${runId}`
        },
        (payload) => {
          const event = payload.new as Event;
          if (eventTypes.includes(event.event_type)) {
            handleEvent(event);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [runId, eventTypes]);
}

// Usage in component
function ParticipantDashboard() {
  useEventSubscription(runId, [
    'phase_started',
    'phase_ended',
    'meeting_invite_created',
    'vote_results_published'
  ]);
  
  // Component renders based on events
}
```

---

## 6. API SPECIFICATIONS

### 6.1 Internal APIs (Supabase Functions)

#### 6.1.1 Stage Engine API

```typescript
// POST /functions/v1/stage-engine/start-phase
interface StartPhaseRequest {
  run_id: string;
  phase_id: string;
  facilitator_id: string;
}

interface StartPhaseResponse {
  success: boolean;
  phase: Phase;
  error?: string;
}

// POST /functions/v1/stage-engine/end-phase
interface EndPhaseRequest {
  run_id: string;
  phase_id: string;
  facilitator_id: string;
  reason: 'timer_expired' | 'manual_end' | 'facilitator_skip';
}

// POST /functions/v1/stage-engine/extend-phase
interface ExtendPhaseRequest {
  run_id: string;
  phase_id: string;
  additional_minutes: number;
  facilitator_id: string;
}
```

#### 6.1.2 Meeting Manager API

```typescript
// POST /functions/v1/meetings/create-invite
interface CreateMeetingInviteRequest {
  run_id: string;
  organizer_role_id: string;
  invitee_role_ids: string[];
  title?: string;
  meeting_type: 'free_consultation' | 'bilateral';
  scheduled_duration_minutes: number;
}

interface CreateMeetingInviteResponse {
  success: boolean;
  meeting_id: string;
  invitation_ids: string[];
}

// POST /functions/v1/meetings/respond-invite
interface RespondInviteRequest {
  invitation_id: string;
  invitee_role_id: string;
  response: 'accept' | 'decline';
  response_text?: string;
}

// POST /functions/v1/meetings/start
interface StartMeetingRequest {
  meeting_id: string;
}

interface StartMeetingResponse {
  success: boolean;
  modality: 'voice' | 'text' | 'physical';
  elevenlabs_conversation_id?: string; // If voice
  webrtc_connection?: object; // ElevenLabs connection details
}

// POST /functions/v1/meetings/end
interface EndMeetingRequest {
  meeting_id: string;
}
```

#### 6.1.3 AI Orchestrator API

```typescript
// POST /functions/v1/ai/update-context
interface UpdateAIContextRequest {
  role_id: string;
  trigger_type: 'public_speech' | 'meeting' | 'vote_result';
  trigger_id: string;
  new_information: string; // Transcript or result text
}

interface UpdateAIContextResponse {
  success: boolean;
  new_version: number;
  updated_blocks: {
    block_2_identity: object;
    block_3_memory: object;
    block_4_goals: object;
  };
  updated_reason: string;
}

// POST /functions/v1/ai/decide-action
interface DecideActionRequest {
  role_id: string;
  action_type: 'initiate_meeting' | 'vote' | 'nominate';
  context: object; // Relevant context for decision
}

interface DecideActionResponse {
  decision: any; // Action-specific response
  reasoning: string;
}
```

#### 6.1.4 Voting API

```typescript
// POST /functions/v1/voting/create-session
// (Called by system for scheduled votes OR by facilitator for ad-hoc proposals)
interface CreateVoteSessionRequest {
  run_id: string;
  phase_id: string;
  vote_type: 'clan_nomination' | 'election_round' | 'clan_oath' | 'clan_action' | 'facilitator_proposal';
  vote_format: 'choose_person' | 'yes_no';
  scope: 'all' | 'clan_only';
  scope_clan_id?: string; // Required if scope='clan_only'
  
  // For 'choose_person' format:
  eligible_candidates?: string[]; // Array of role_ids
  
  // For 'facilitator_proposal':
  proposal_title?: string;
  proposal_description?: string;
}

interface CreateVoteSessionResponse {
  success: boolean;
  session_id: string;
  status: 'open';
}

// POST /functions/v1/voting/cast-vote
interface CastVoteRequest {
  session_id: string;
  voter_role_id: string;
  
  // One of these based on vote_format:
  chosen_role_id?: string;  // For 'choose_person' format
  yes_no_choice?: 'yes' | 'no' | 'abstain';  // For 'yes_no' format
}

interface CastVoteResponse {
  success: boolean;
  vote_id: string;
  message: string; // "Vote recorded successfully"
}

// POST /functions/v1/voting/close-session
interface CloseVoteSessionRequest {
  session_id: string;
}

// POST /functions/v1/voting/calculate-results
interface CalculateResultsRequest {
  session_id: string;
  threshold?: number; // E.g., 0.667 for 2/3 majority (optional)
}

interface CalculateResultsResponse {
  success: boolean;
  session_id: string;
  vote_format: 'choose_person' | 'yes_no';
  
  // For 'choose_person' format:
  winner?: {
    role_id: string;
    role_name: string;
    vote_count: number;
    percentage: number;
  };
  all_candidates?: Array<{
    role_id: string;
    role_name: string;
    vote_count: number;
    percentage: number;
  }>;
  
  // For 'yes_no' format:
  yes_count?: number;
  no_count?: number;
  abstain_count?: number;
  total_votes?: number;
  yes_percentage?: number;
  
  // Common:
  has_winner: boolean;
  tie: boolean;
  threshold_met?: boolean; // If threshold was provided
}

// GET /functions/v1/voting/session-status
interface GetSessionStatusRequest {
  session_id: string;
}

interface GetSessionStatusResponse {
  session_id: string;
  status: 'open' | 'closed' | 'announced';
  vote_type: string;
  vote_format: string;
  scope: string;
  votes_cast: number;
  eligible_voters: number;
  participation_rate: number;
}
```

#### 6.1.5 Public Speech Recording API

```typescript
// POST /functions/v1/speech/generate-ai-speech
interface GenerateAISpeechRequest {
  run_id: string;
  phase_id: string;
  speaker_role_id: string; // AI character
  speech_type: 'candidate_speech_1' | 'candidate_speech_2' | 'kings_decree';
  max_duration_seconds: number; // 120 for round 1, 180 for round 2
}

interface GenerateAISpeechResponse {
  success: boolean;
  speech_id: string;
  speech_text: string; // Generated by LLM
  audio_url: string; // TTS file from ElevenLabs
  duration_seconds: number;
}

// POST /functions/v1/speech/capture-human-speech
interface CaptureHumanSpeechRequest {
  run_id: string;
  phase_id: string;
  speaker_role_id: string; // Human character
  audio_blob: Blob; // From microphone recording
}

interface CaptureHumanSpeechResponse {
  success: boolean;
  speech_id: string;
  transcript: string; // From ASR
  audio_url: string; // Stored in Supabase Storage
}

// GET /functions/v1/speech/play-audio
// Returns audio file for playback through facilitator's speakers
interface PlayAudioRequest {
  speech_id: string;
}
```

### 6.2 External APIs

#### 6.2.1 ElevenLabs Conversational API

```typescript
// Create Conversation (Voice Meeting)
const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation', {
  method: 'POST',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agent_id: character.elevenlabs_agent_id,
    
    // Context sent to AI (see Section 7)
    custom_llm_extra_body: {
      context: {
        character_personality: character.personality_prompt,
        challenge_instructions: challenge.ai_instructions,
        keys: challengeKeys,
        trigger_preferences: character.trigger_preferences,
        
        // For AI participants in meetings
        ai_cognitive_state: {
          block_1_fixed: aiContext.block_1_fixed,
          block_2_identity: aiContext.block_2_identity,
          block_3_memory: aiContext.block_3_memory,
          block_4_goals: aiContext.block_4_goals
        },
        
        // Intent note from AI's goals
        intent_note: "Explore their interests without revealing our strategy"
      }
    }
  })
});

const { conversation_id, agent_output_audio_url } = await response.json();
```

#### 6.2.2 LLM APIs (AI Context Updates)

**Anthropic Claude Example:**

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: SYSTEM_PROMPT, // AI architecture explanation
    messages: [
      {
        role: 'user',
        content: `
NEW INFORMATION:
${transcript}

YOUR CURRENT STATE:
Block 2 (Identity): ${JSON.stringify(currentContext.block_2_identity)}
Block 3 (Memory): ${JSON.stringify(currentContext.block_3_memory)}
Block 4 (Goals): ${JSON.stringify(currentContext.block_4_goals)}

Update your cognitive state based on this new information.
        `
      }
    ]
  })
});
```

---

## 7. AI INTEGRATION ARCHITECTURE

### 7.1 AI Participant Components

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                  AI PARTICIPANT SYSTEM                       Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¤
Ã¢â€â€š                                                              Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š         MAIN PERSONA LLM (Claude/Gemini/GPT)         Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  - Context updates (Blocks 2, 3, 4)                  Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  - Decision making (vote, meet, nominate)            Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  - Reflection generation                             Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€š
Ã¢â€â€š                          Ã¢â€ â€¢                                   Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š           COGNITIVE STATE (PostgreSQL)               Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Block 1: Fixed Context (world rules, actions)       Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Block 2: Identity (values, personality)             Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Block 3: Memory (events, relationships)             Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Block 4: Goals (ambitions, strategies)              Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€š
Ã¢â€â€š                          Ã¢â€ â€¢                                   Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š      CONVERSATIONAL AVATAR (ElevenLabs Agent)        Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  - Voice synthesis and ASR                           Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  - Executes "intent note" from Main Persona          Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  - Real-time conversation (WebRTC)                   Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€š
Ã¢â€â€š                                                              Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
```

### 7.2 AI Prompt Management System

**Architecture Overview:**

All AI prompts are stored in the `ai_prompts` table, versioned, and can be customized by facilitators. The system ensures only ONE active prompt per type at any time, with per-simulation overrides supported via `sim_run_prompts`.

#### 7.2.1 Prompt Retrieval Logic

```typescript
/**
 * Gets the active prompt for a given type and simulation run
 * Priority: sim_run override > active default prompt
 */
async function getPromptForRun(
  runId: string, 
  promptType: PromptType
): Promise<AIPrompt> {
  // 1. Check for simulation-specific override
  const override = await supabase
    .from('sim_run_prompts')
    .select('custom_prompt_id, llm_model_override, temperature_override')
    .eq('run_id', runId)
    .eq('prompt_type', promptType)
    .single();
  
  if (override?.custom_prompt_id) {
    // Use custom prompt
    const customPrompt = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('prompt_id', override.custom_prompt_id)
      .single();
    
    return {
      ...customPrompt,
      llm_model: override.llm_model_override || customPrompt.default_llm_model,
      temperature: override.temperature_override || customPrompt.default_temperature
    };
  }
  
  // 2. Fall back to active default prompt
  const defaultPrompt = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .single();
  
  return defaultPrompt;
}
```

#### 7.2.2 Core AI Prompts Specification

**Block 2: Identity Update Prompt (Production Version)**

```typescript
const IDENTITY_UPDATE_PROMPT = {
  prompt_type: 'block_2_identity_update',
  version: 'v1.0',
  name: 'Block 2 Identity Update - Standard',
  
  system_prompt: `You are managing the IDENTITY component of an AI participant in a political simulation.

PRINCIPLES:
- Identity should remain STABLE throughout the simulation
- Only update identity if truly dramatic, emotionally significant events occur
- Changes must be explicitly justified and documented
- Maintain character consistency and believability

QUALIFYING EVENTS for identity change:
- Betrayal by a close ally (confirmed broken promise)
- Major public humiliation (failed speech, exposed lie)
- Unexpected election result that challenges core beliefs
- Dramatic shift in clan position that conflicts with values
- Personal moral crisis forcing choice between loyalty and principle

RESPONSE FORMAT:
{
  "identity_changed": false,  // true only if qualifying event occurred
  "updated_identity": { /* full identity object */ },
  "change_justification": "explicit explanation if changed",
  "what_changed": { /* specific fields that changed */ }
}`,

  user_prompt_template: `NEW INFORMATION:
{{new_context}}

CURRENT IDENTITY:
{{block_2_identity}}

INSTRUCTIONS:
Review the new information. Has anything occurred that fundamentally challenges this character's identity, values, or worldview? Remember: identity changes are RARE.

If YES - dramatic event occurred:
- Update the identity object
- Provide explicit justification
- Document what changed and why

If NO - identity remains stable:
- Return identity_changed: false
- Keep existing identity unchanged`
};
```

**Block 3: Memory Update Prompt (Production Version)**

```typescript
const MEMORY_UPDATE_PROMPT = {
  prompt_type: 'block_3_memory_update',
  version: 'v1.0',
  name: 'Block 3 Memory Update - Standard',
  
  system_prompt: `You are managing the MEMORY component of an AI participant.

MEMORY CONSTRAINTS:
- Maximum size: 2500 tokens (~5 pages of text)
- Must be compressed when approaching limit
- Prioritize recent events, obligations, and key relationships

COMPRESSION STRATEGY:
1. KEEP VERBATIM:
   - Last 3-5 significant events
   - All obligations and promises (made by self or others)
   - Current relationship status with key players
   - Active conflicts or tensions

2. SUMMARIZE:
   - Old casual conversations → key outcomes only
   - Resolved issues → brief note
   - Historical context → compressed background

3. DISCARD:
   - Redundant information
   - Superseded plans
   - Irrelevant small talk

RESPONSE FORMAT:
{
  "updated_memory": {
    "recent_events": [ /* last 3-5 events, verbatim */ ],
    "obligations": [ /* all promises and commitments */ ],
    "relationships": { /* status with key players */ },
    "conflicts": [ /* active tensions */ ],
    "historical_context": "compressed summary of earlier events"
  },
  "current_size_estimate": 2100, // tokens
  "compression_applied": true/false,
  "what_was_compressed": "description if compression occurred"
}`,

  user_prompt_template: `NEW INFORMATION:
{{new_context}}

CURRENT MEMORY ({{current_memory_size}} tokens):
{{block_3_memory}}

INSTRUCTIONS:
Integrate the new information into memory. If approaching 2500 tokens, apply compression strategy. Preserve all obligations and key relationship status.`
};
```

**Block 4: Goals & Plans Update Prompt (Production Version)**

```typescript
const GOALS_UPDATE_PROMPT = {
  prompt_type: 'block_4_goals_update',
  version: 'v1.0',
  name: 'Block 4 Goals Update - Standard',
  
  system_prompt: `You are managing the GOALS AND PLANS component of an AI participant.

GOALS MANAGEMENT:
- Goals can evolve based on new information and changing circumstances
- Must remain consistent with identity (Block 2)
- Balance ambition with realism
- Maintain strategic thinking

STRUCTURE:
{
  "primary_goal": {
    "description": "main objective",
    "priority": 1-10,
    "probability_assessment": 0.0-1.0,
    "next_actions": ["specific steps"]
  },
  "secondary_goals": [ /* backup objectives */ ],
  "active_hypotheses": [ /* beliefs about situation */ ],
  "tactical_plans": {
    "next_phase": "specific plan for upcoming stage"
  },
  "risk_assessments": [ /* potential dangers */ ],
  "opportunities": [ /* potential advantages */ ]
}

ADAPTATION RULES:
- If primary goal becomes impossible → elevate secondary goal
- If new information contradicts hypothesis → revise belief
- If alliance fails → adjust relationship strategy
- Always maintain at least one viable path to success`,

  user_prompt_template: `NEW INFORMATION:
{{new_context}}

CURRENT GOALS:
{{block_4_goals}}

CURRENT IDENTITY (for consistency):
{{block_2_identity}}

INSTRUCTIONS:
Update your goals and plans based on the new information. Adapt strategies while remaining faithful to your character's identity and values.`
};
```

**Action Decision Prompt (Generic Template)**

```typescript
const ACTION_DECISION_PROMPT = {
  prompt_type: 'action_decision',
  version: 'v1.0',
  name: 'AI Action Decision - Generic',
  
  system_prompt: `You are an AI participant making a strategic decision in a political simulation.

DECISION PRINCIPLES:
- Act in character based on your identity
- Consider your goals and current situation
- Think strategically about consequences
- Stay within allowed actions for current phase
- Be realistic about time and resource constraints

RESPONSE FORMAT:
{
  "decision": { /* action-specific format */ },
  "reasoning": "brief explanation of why",
  "confidence": 0.0-1.0,
  "alternatives_considered": ["other options you thought about"]
}`,

  user_prompt_template: `You are {{character_name}}, a {{age}}-year-old {{position}} of the {{clan_name}} clan.

CURRENT SITUATION:
{{situation_context}}

YOUR COGNITIVE STATE:
Identity: {{block_2_identity}}
Memory: {{block_3_memory}}
Goals: {{block_4_goals}}

DECISION REQUIRED:
{{action_type}} - {{action_description}}

Available options:
{{available_options}}

Constraints:
{{constraints}}

Make your decision now.`
};
```

#### 7.2.3 Prompt Usage in Code

```typescript
// Example: Updating AI context after public speech

async function updateAIContextAfterSpeech(
  roleId: string,
  runId: string,
  speechTranscript: string,
  speakerName: string
) {
  // 1. Load current context
  const aiContext = await supabase
    .from('ai_context')
    .select('*')
    .eq('role_id', roleId)
    .eq('is_current', true)
    .single();
  
  // 2. Get prompts for this simulation
  const identityPrompt = await getPromptForRun(runId, 'block_2_identity_update');
  const memoryPrompt = await getPromptForRun(runId, 'block_3_memory_update');
  const goalsPrompt = await getPromptForRun(runId, 'block_4_goals_update');
  
  // 3. Build update request
  const newContext = `PUBLIC SPEECH by ${speakerName}:\n${speechTranscript}`;
  
  // 4. Update each block (can be parallelized)
  const [identityUpdate, memoryUpdate, goalsUpdate] = await Promise.all([
    updateBlock2(aiContext, identityPrompt, newContext),
    updateBlock3(aiContext, memoryPrompt, newContext),
    updateBlock4(aiContext, goalsPrompt, newContext, aiContext.block_2_identity)
  ]);
  
  // 5. Save new version
  await supabase.from('ai_context').insert({
    role_id: roleId,
    run_id: runId,
    version: aiContext.version + 1,
    is_current: true,
    block_1_fixed: aiContext.block_1_fixed, // Never changes
    block_2_identity: identityUpdate.updated_identity,
    block_3_memory: memoryUpdate.updated_memory,
    block_4_goals: goalsUpdate.updated_goals,
    updated_trigger: `speech_${speechId}`,
    updated_reason: `Processed public speech by ${speakerName}`
  });
  
  // 6. Mark old version as not current
  await supabase
    .from('ai_context')
    .update({ is_current: false })
    .eq('context_id', aiContext.context_id);
}
```

#### 7.2.4 Facilitator Prompt Customization Interface

**UI Requirements (for KING_UX_GUIDE.md):**

```typescript
interface PromptEditorView {
  sections: [
    {
      title: "AI Character Reflection Prompts",
      prompts: [
        {
          type: "block_2_identity_update",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test", "Create New Version"]
        },
        {
          type: "block_3_memory_update",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test", "Create New Version"]
        },
        {
          type: "block_4_goals_update",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test", "Create New Version"]
        }
      ]
    },
    {
      title: "AI Decision & Action Prompts",
      prompts: [
        {
          type: "action_decision",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test"]
        },
        {
          type: "public_speech",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test"]
        }
      ]
    },
    {
      title: "Learning & Feedback Prompts",
      prompts: [
        {
          type: "personal_feedback",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test"]
        },
        {
          type: "debrief_analysis",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test"]
        },
        {
          type: "induction_assistant",
          currentVersion: "v1.0",
          status: "active",
          actions: ["View", "Edit", "Test"]
        }
      ]
    }
  ]
}
```

**Key Features:**
- **Version Control**: Create new versions without breaking existing simulations
- **A/B Testing**: Run same simulation with different prompts
- **Template Variables**: {{variable}} syntax with autocomplete
- **Token Counter**: Real-time token estimation
- **Test Mode**: Test prompt with sample data before deployment
- **Rollback**: Revert to previous version if issues arise

---

### 7.3 AI Decision Flow

```typescript
// Example: AI decides whether to initiate meeting

// 1. Load current cognitive state
const aiContext = await supabase
  .from('ai_context')
  .select('*')
  .eq('role_id', roleId)
  .eq('is_current', true)
  .single();

// 2. Get action decision prompt
const actionPrompt = await getPromptForRun(runId, 'action_decision');

// 3. Build decision prompt from template
const variables = {
  character_name: role.name,
  age: role.age,
  position: role.position,
  clan_name: clan.name,
  situation_context: `Phase: Free Consultation (15 minutes remaining)\nYou have already met with: ${pastMeetings}`,
  block_2_identity: JSON.stringify(aiContext.block_2_identity, null, 2),
  block_3_memory: JSON.stringify(aiContext.block_3_memory, null, 2),
  block_4_goals: JSON.stringify(aiContext.block_4_goals, null, 2),
  action_type: 'initiate_meeting',
  action_description: 'Decide whether to request a meeting and with whom',
  available_options: `You can invite 1-5 participants. Available: ${availableParticipants}`,
  constraints: `- Meeting must be accepted by invitees\n- Time limit: 10 minutes\n- Can decline if all busy`
};

const userPrompt = replaceVariables(actionPrompt.user_prompt_template, variables);

// 4. Call LLM
const decision = await callLLM({
  model: actionPrompt.default_llm_model,
  system: actionPrompt.system_prompt,
  prompt: userPrompt,
  temperature: actionPrompt.default_temperature,
  max_tokens: actionPrompt.default_max_tokens
});

// 5. Execute decision
if (decision.decision.wants_meeting) {
  await createMeetingInvite({
    organizer_role_id: roleId,
    invitee_role_ids: decision.decision.target_role_ids,
    title: decision.decision.purpose
  });
}
```

### 7.4 Context Update Triggers

AI context updates are triggered by:

1. **Public Speech Recorded â†’ Transcript distributed to** Ã¢â€ â€™ ALL AI participants update
2. **Meeting Ended â†’ Transcript distributed to participating** Ã¢â€ â€™ Participating AI participants update
3. **Vote Results Announced** Ã¢â€ â€™ ALL AI participants update (or clan-only for private votes)
4. **Phase Changed** Ã¢â€ â€™ ALL AI participants update (new strategic context)

**Rate Limiting:**
- Max 1 update per AI per minute (prevent spam)
- Updates queued if burst occurs
- Facilitator can manually trigger update if needed


**Important Notes on Text Communication:**
- **No separate direct messaging system** - all text conversations happen within meetings
- Whether meetings use **voice** or **text chat**, the entire conversation is captured in the meeting transcript
- At meeting end, the **full transcript** is sent to all AI participants for context update
- This ensures AI characters have complete memory of what was discussed, promised, or agreed upon
- Simpler architecture: one conversation mechanism (meetings) handles all communication needs
---

## 8. VOICE COMMUNICATION SYSTEM

### 8.1 Voice Architecture Overview

**The Physical-Digital Voice Model:**

KING SIM uses THREE distinct voice interaction patterns:

```
1. HUMAN PUBLIC SPEECH (Physical Mic Ã¢â€ â€™ Capture)
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š  Physical Room                                               Ã¢â€â€š
Ã¢â€â€š  Human speaker Ã¢â€ â€™ Microphone Ã¢â€ â€™ Facilitator Laptop            Ã¢â€â€š
Ã¢â€â€š                               Ã¢â€ â€œ                              Ã¢â€â€š
Ã¢â€â€š                    Speech-to-Text (ElevenLabs ASR)          Ã¢â€â€š
Ã¢â€â€š                               Ã¢â€ â€œ                              Ã¢â€â€š
Ã¢â€â€š                  Transcript saved to database                Ã¢â€â€š
Ã¢â€â€š                               Ã¢â€ â€œ                              Ã¢â€â€š
Ã¢â€â€š              Distributed to all AI participants              Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

2. AI PUBLIC SPEECH (TTS Ã¢â€ â€™ Room Playback)
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š  Facilitator triggers AI speech                              Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€œ                                                    Ã¢â€â€š
Ã¢â€â€š  LLM generates speech text                                   Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€œ                                                    Ã¢â€â€š
Ã¢â€â€š  ElevenLabs TTS creates audio                                Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€œ                                                    Ã¢â€â€š
Ã¢â€â€š  Facilitator laptop plays through ROOM SPEAKERS              Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€œ                                                    Ã¢â€â€š
Ã¢â€â€š  All humans hear AI "speaking" to assembly                   Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€œ                                                    Ã¢â€â€š
Ã¢â€â€š  Transcript distributed to all AI participants               Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

3. PRIVATE CONVERSATIONS (WebRTC, Personal Devices)
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š  Human's Device (phone/tablet)                               Ã¢â€â€š
Ã¢â€â€š  - Microphone access                                         Ã¢â€â€š
Ã¢â€â€š  - Headphones (recommended)                                  Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€¢ WebRTC Ã¢â€ â€¢                                           Ã¢â€â€š
Ã¢â€â€š  ElevenLabs Conversational API                               Ã¢â€â€š
Ã¢â€â€š  - ASR (Human Ã¢â€ â€™ Text)                                        Ã¢â€â€š
Ã¢â€â€š  - LLM Processing (with AI context)                          Ã¢â€â€š
Ã¢â€â€š  - TTS (AI Ã¢â€ â€™ Voice)                                          Ã¢â€â€š
Ã¢â€â€š         Ã¢â€ â€¢                                                    Ã¢â€â€š
Ã¢â€â€š  Transcript saved to database                                Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
```

### 8.2 Voice Meeting Types

| Meeting Type | Participants | Modality | Audio Output | Transcript |
|--------------|--------------|----------|--------------|------------|
| **Clan Council** | All clan members (auto) | Voice or Text | Personal devices OR room speakers | Ã¢Å“â€¦ Full |
| **Free Consultation** | 2+ participants (ad-hoc) | Voice or Text | Personal devices (headphones) | Ã¢Å“â€¦ Full |
| **Human-only (untracked)** | All human, physically present | Physical (no app) | Room air | Ã¢ÂÅ’ None |
| **AI Public Speech** | AI speaker + all participants | ElevenLabs TTS | Room speakers (facilitator's laptop) | Ã¢Å“â€¦ Full |
| **Human Public Speech** | Human speaker + all | Physical microphone | Room air | Ã¢Å“â€¦ Full (via ASR) |

**Meeting Modality Logic:**
- **If ANY AI participant:** Meeting must use app (voice or text)
- **If ALL human:** Can meet physically (no tracking) OR use app (tracked)
- **Voice (default):** Used when AI + human meet, or if humans want transcript
- **Text (fallback):** Used if voice fails, or for AI-only meetings

**Purpose of Tracking:**
- Primarily for **AI context updates** (who said what, who committed to what)
- Humans can review transcripts later (optional feature)
- Physical human meetings are fine - just not captured in system

### 8.3 Context Sent to ElevenLabs Agent

When starting a voice meeting (see Section 6.2.1), the system sends:

```typescript
const context = {
  // Character identity
  character: {
    name: role.name,
    age: role.age,
    position: role.position,
    clan: clan.name
  },
  
  // Personality (from character definition)
  personality: character.personality_prompt,
  
  // Meeting context
  meeting: {
    type: 'bilateral', // or 'clan_council'
    participants: participantNames,
    purpose: meeting.title
  },
  
  // AI cognitive state (for AI participants)
  cognitive_state: {
    identity: aiContext.block_2_identity,
    memory: aiContext.block_3_memory,
    goals: aiContext.block_4_goals
  },
  
  // Intent note (from AI's goals - what it wants from this meeting)
  intent: "Explore their position on alliance without committing",
  
  // World context (what's possible to discuss)
  world_rules: aiContext.block_1_fixed.world_rules
};
```

**CRITICAL:** The `briefing_text` (what human sees) is NEVER sent to AI.

---

## 9. STATE MANAGEMENT

### 9.1 Frontend State Architecture

```typescript
// Global App State (Zustand)
interface AppState {
  // User session
  currentUser: User | null;
  currentRole: Role | null;
  currentRun: SimRun | null;
  
  // Current phase
  activePhase: Phase | null;
  timeRemaining: number; // seconds
  
  // Real-time updates
  pendingInvitations: MeetingInvitation[];
  activeMeetings: Meeting[]; // Meetings currently in progress
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

// React Query (Server State)
// - Automatic caching of database queries
// - Invalidation on events (via Realtime)
// - Optimistic updates for mutations

const { data: phases } = useQuery({
  queryKey: ['phases', runId],
  queryFn: () => fetchPhases(runId),
  // Invalidate when phase events occur
  staleTime: Infinity
});

// Real-time subscriptions (Supabase)
useEffect(() => {
  const subscription = supabase
    .channel(`run:${runId}`)
    .on('postgres_changes', { ... }, (payload) => {
      // Invalidate React Query cache
      queryClient.invalidateQueries(['phases', runId]);
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [runId]);
```

### 9.2 State Machine (Phase Progression)

```typescript
type PhaseStatus = 'pending' | 'active' | 'paused' | 'completed' | 'skipped';

const phaseTransitions: Record<PhaseStatus, PhaseStatus[]> = {
  pending: ['active', 'skipped'], // Can start or skip
  active: ['paused', 'completed', 'skipped'], // Can pause, finish, or skip
  paused: ['active', 'completed', 'skipped'], // Can resume, finish, or skip
  completed: [], // Terminal state
  skipped: [] // Terminal state
};

function canTransition(from: PhaseStatus, to: PhaseStatus): boolean {
  return phaseTransitions[from].includes(to);
}

// Facilitator action
async function transitionPhase(phaseId: string, newStatus: PhaseStatus) {
  const phase = await getPhase(phaseId);
  
  if (!canTransition(phase.status, newStatus)) {
    throw new Error(`Invalid transition: ${phase.status} Ã¢â€ â€™ ${newStatus}`);
  }
  
  // Update database
  await supabase
    .from('phases')
    .update({ 
      status: newStatus,
      ...(newStatus === 'active' && { started_at: new Date().toISOString() }),
      ...(newStatus === 'completed' && { ended_at: new Date().toISOString() })
    })
    .eq('phase_id', phaseId);
  
  // Emit event
  await emitEvent({
    event_type: 'phase_' + newStatus,
    run_id: phase.run_id,
    phase_id: phaseId,
    actor_type: 'facilitator',
    payload: { phase_name: phase.name }
  });
}
```

---

## 10. SECURITY & ACCESS CONTROL

### 10.1 Authentication & Registration Flow

#### Overview

**Two-Stage Process:**
1. **Pre-Simulation:** Participants register with email/password (before roles assigned)
2. **Simulation Start:** Roles distributed with fun animation, induction begins

**Access Methods:**
- **Primary:** Email + password (standard login)
- **Device Access:** QR codes for quick access on any device (no password needed)
- **Recovery:** Facilitator can reset passwords

---

#### 10.1.1 Pre-Simulation Registration

**Before the simulation starts, participants register:**

```typescript
// Step 1: Participant Self-Registration
// URL: https://app.king-sim.com/register?event=EVENT_CODE

interface RegistrationRequest {
  email: string;        // Personal email
  password: string;     // Min 8 chars (no other requirements)
  display_name: string; // "Alex", "Maria", etc.
  event_code: string;   // Provided by facilitator
}

// POST /auth/register
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      display_name: display_name,
      event_code: event_code,
      registered_at: new Date().toISOString()
    }
  }
});

// Creates user in auth.users table
// Creates record in users table with status='registered'
```

**Validation:**
- Email format valid
- Password min 8 characters (simple, no complexity requirements)
- Event code exists and is active
- Email not already registered for this event

**User Status States:**
```
registered â†’ role_assigned â†’ active â†’ completed
```

**After registration:**
- User sees: "Thank you for registering! You'll receive your role assignment when the simulation begins."
- Can log out and log back in anytime
- Can access QR code for quick device access

---

#### 10.1.2 Facilitator Pre-Simulation Setup

**Facilitator Console - Participants Tab:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Participants (15 registered / 20 expected)              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                         â”‚
â”‚ Event Code: KING2025-CYPRUS                            â”‚
â”‚ [Copy Link to Share]                                   â”‚
â”‚ https://app.king-sim.com/register?event=KING2025-CYPRUSâ”‚
â”‚                                                         â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚ â”‚ Name           Email              Status         â”‚   â”‚
â”‚ â”‚ Alex Chen      alex@email.com     âœ“ Registered  â”‚   â”‚
â”‚ â”‚ Maria Garcia   maria@email.com    âœ“ Registered  â”‚   â”‚
â”‚ â”‚ John Smith     john@email.com     âœ“ Registered  â”‚   â”‚
â”‚ â”‚ ...                                              â”‚   â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                         â”‚
â”‚ [Add Participant Manually] [Export List]               â”‚
â”‚                                                         â”‚
â”‚ âš ï¸  Simulation can start when 12+ participants ready   â”‚
â”‚                                                         â”‚
â”‚ [Start Role Assignment] â† Becomes active when ready    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

#### 10.1.3 Role Assignment & Distribution

**When facilitator clicks "Start Role Assignment":**

```typescript
// POST /functions/v1/simulation/assign-roles
interface AssignRolesRequest {
  run_id: string;
  assignment_strategy: 'random' | 'manual' | 'balanced';
}

// System does:
1. Creates sim_run record (status='role_assignment')
2. Creates all clan records
3. Creates all role records
4. Assigns registered users to roles (randomly or per strategy)
5. Updates users status â†’ 'role_assigned'
6. Sends notification to all participants

// Updates database:
UPDATE roles 
SET assigned_user_id = user.id
WHERE role_id IN (assigned_roles);

UPDATE users
SET status = 'role_assigned'
WHERE id IN (assigned_users);
```

**Participant Experience:**

**Before assignment:** 
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Welcome, Alex!                          â”‚
â”‚                                         â”‚
â”‚ â³ Waiting for simulation to start...  â”‚
â”‚                                         â”‚
â”‚ 15 participants registered              â”‚
â”‚ Facilitator will begin shortly          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**During assignment (Fun Animation):**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                         â”‚
â”‚         ðŸŽ­ ROLE ASSIGNMENT ðŸŽ­           â”‚
â”‚                                         â”‚
â”‚     [Animated spinning wheel or        â”‚
â”‚      shuffling clan symbols]            â”‚
â”‚                                         â”‚
â”‚        Assigning your role...           â”‚
â”‚                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

// Animation ideas:
- Spinning wheel with clan symbols
- Cards shuffling and flipping
- Ancient scroll unrolling
- Dice rolling
- Mystery box opening
```

**After assignment (Role Reveal):**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                         â”‚
â”‚         ðŸŒ¾ YOUR ROLE REVEALED ðŸŒ¾        â”‚
â”‚                                         â”‚
â”‚  You are:                               â”‚
â”‚  ELENA THEODOROU                        â”‚
â”‚                                         â”‚
â”‚  Age: 38                                â”‚
â”‚  Clan: AGRICULTURE                      â”‚
â”‚  Position: Elder Farmer                 â”‚
â”‚                                         â”‚
â”‚  [View Your Briefing]                   â”‚
â”‚                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

#### 10.1.4 Login Flow (After Registration)

**Standard Login:**

```typescript
// URL: https://app.king-sim.com/login

interface LoginRequest {
  email: string;
  password: string;
}

// POST /auth/login
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// On success:
1. Check user status:
   - If 'registered' â†’ Show waiting screen
   - If 'role_assigned' â†’ Redirect to role briefing
   - If 'active' â†’ Redirect to simulation interface
   - If 'completed' â†’ Show thank you + debrief

2. Load user's assigned role (if any)
3. Load current run and phase
4. Initialize real-time subscriptions
```

**Forgot Password:**
```typescript
// Simple flow - no email verification needed
// Facilitator can reset in their console

// OR Self-service (if enabled):
const { data, error } = await supabase.auth.resetPasswordForEmail(
  email,
  { redirectTo: 'https://app.king-sim.com/reset-password' }
);
```

---

#### 10.1.5 QR Code Access (Device Switching)

**Purpose:** Allow participants to quickly access their role on any device without typing password

**Flow:**

```typescript
// 1. User logged in on Device A
// 2. User navigates to Settings â†’ Device Access
// 3. System generates secure access token

interface GenerateAccessTokenRequest {
  user_id: string;
  device_name?: string; // "Phone", "Tablet", etc.
}

// Response:
interface AccessToken {
  token: string;  // Secure random token (32 chars)
  expires_at: string; // 24 hours from now
  qr_code_url: string; // Data URL of QR code image
}

// QR code contains:
https://app.king-sim.com/quick-access?token=ABC123XYZ...

// 4. User scans QR on Device B
// 5. Device B opens link, validates token
// 6. Device B automatically logs in (creates session)
// 7. Token invalidated (single use)
```

**UI - Participant Settings:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Device Access                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                         â”‚
â”‚ Scan this QR code on another device to â”‚
â”‚ quickly access your role:               â”‚
â”‚                                         â”‚
â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                â”‚
â”‚     â”‚                 â”‚                â”‚
â”‚     â”‚   [QR CODE]     â”‚                â”‚
â”‚     â”‚                 â”‚                â”‚
â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â”‚
â”‚                                         â”‚
â”‚ Or use this link:                       â”‚
â”‚ https://app.../quick-access?token=...  â”‚
â”‚ [Copy Link]                             â”‚
â”‚                                         â”‚
â”‚ âš ï¸  This access link expires in 24h    â”‚
â”‚     and can only be used once           â”‚
â”‚                                         â”‚
â”‚ [Generate New Code]                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Security:**
- Token valid for 24 hours
- Single use (invalidated after first use)
- Tied to specific user_id
- Logged in facilitator console
- Can be revoked by facilitator

---

#### 10.1.6 Facilitator Password Reset

**Facilitator Console - Participant Management:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Participant: Alex Chen                  â”‚
â”‚ Email: alex@email.com                   â”‚
â”‚ Status: Active                          â”‚
â”‚ Role: Marcus (Merchant Leader)          â”‚
â”‚                                         â”‚
â”‚ Actions:                                â”‚
â”‚ [Reset Password]                        â”‚
â”‚ [Generate QR Access]                    â”‚
â”‚ [Remove from Simulation]                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

// When facilitator clicks "Reset Password":
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Reset Password for Alex Chen            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                         â”‚
â”‚ Generate new temporary password:        â”‚
â”‚                                         â”‚
â”‚ [Generate Random] or                    â”‚
â”‚                                         â”‚
â”‚ Set custom password:                    â”‚
â”‚ [________________]                      â”‚
â”‚                                         â”‚
â”‚ â–¡ Require password change on next loginâ”‚
â”‚                                         â”‚
â”‚ [Cancel] [Reset Password]               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

// After reset, facilitator sees:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âœ“ Password Reset Successful             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                         â”‚
â”‚ New temporary password:                 â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚ â”‚  TempPass2025!                  â”‚    â”‚
â”‚ â”‚  [Copy]                         â”‚    â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                         â”‚
â”‚ Share this with Alex Chen privately.    â”‚
â”‚ They'll be asked to change it on login. â”‚
â”‚                                         â”‚
â”‚ [Close]                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

#### 10.1.7 Session Management

```typescript
// Session persistence
// Supabase handles JWT refresh automatically
// Sessions last: 7 days (configurable)

// On app load:
const session = await supabase.auth.getSession();

if (session) {
  // User still logged in
  // Load their role and run data
} else {
  // Redirect to login
}

// Logout:
await supabase.auth.signOut();
// Clears local session
// Redirects to login page
```

---

#### 10.1.8 Multi-Device Support

**Key Features:**
- User can be logged in on multiple devices simultaneously
- Real-time sync via Supabase Realtime
- All devices see same state
- Actions on one device instantly reflected on others

**Use Case:**
- Participant has laptop at table (for reading)
- Participant has phone in hand (for voting quickly)
- Both stay in sync

**Implementation:**
```typescript
// All devices subscribe to same channels
const subscription = supabase
  .channel(`user:${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'votes',
    filter: `voter_role_id=eq.${roleId}`
  }, (payload) => {
    // Update local state
    updateVoteStatus(payload.new);
  })
  .subscribe();
```

---

#### 10.1.9 Registration Flow Summary

**Complete Timeline:**

```
DAY 1 (Before Event):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Facilitator:
1. Creates simulation template
2. Sets event date/time
3. Generates event code (e.g., KING2025-CYPRUS)
4. Shares registration link with participants

Participants:
1. Click link â†’ Registration page
2. Enter email, password, display name
3. Submit â†’ See "Thank you, wait for simulation to start"
4. Can log out and back in anytime

DAY 2 (Event Day - Before Start):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Facilitator:
1. Reviews registered participants (15/20)
2. Decides to start with 15
3. Clicks "Start Role Assignment"
4. System assigns roles

Participants:
1. Log in (or already logged in)
2. See "Role Assignment in Progress" animation
3. Role revealed!
4. Read briefing
5. Wait for simulation to start

DAY 2 (Event Day - Simulation):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Facilitator:
1. Clicks "Begin Simulation"
2. Phase 1 starts

Participants:
1. Interface activates
2. Can participate, vote, meet, etc.
3. Can switch devices via QR if needed

DAY 2 (Event Day - After Simulation):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Participants:
1. See "Simulation Complete"
2. Access debrief materials
3. Can log in later to review
```

---

#### 10.1.10 Database Schema Updates

**Users table already supports this:**

```sql
-- users table (from 3.2.2) already has:
email TEXT UNIQUE NOT NULL,  -- Real email
display_name TEXT,            -- "Alex", "Maria"
role TEXT,                    -- 'facilitator' | 'participant'

-- Add status field:
status TEXT DEFAULT 'registered' CHECK (status IN (
  'registered',    -- Signed up, no role yet
  'role_assigned', -- Role assigned, waiting for start
  'active',        -- Simulation in progress
  'completed'      -- Simulation finished
)),
```

**New table: access_tokens**

```sql
CREATE TABLE access_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  token TEXT NOT NULL UNIQUE, -- Secure random token
  device_name TEXT,            -- Optional: "Phone", "Tablet"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,         -- NULL if not used yet
  
  is_valid BOOLEAN DEFAULT TRUE -- Can be revoked by facilitator
);

CREATE INDEX idx_tokens_user ON access_tokens(user_id);
CREATE INDEX idx_tokens_token ON access_tokens(token) WHERE is_valid = TRUE;
```

---

#### 10.1.11 Reusability for Future Events

**Key Design Principles:**
1. **Email + password are permanent** (user keeps same account)
2. **Roles are event-specific** (new simulation = new role)
3. **Registration is per-event** (register once per simulation)

**Future Simulation:**
```
User already has account from previous KING SIM
â†’ Same email/password works
â†’ Registers for new event code
â†’ Gets assigned new role
â†’ Participates in new simulation
```

**Benefits:**
- User doesn't create multiple accounts
- Email list grows over time (marketing)
- Easier for repeat participants
- Credentials persist across events

### 10.2 Row-Level Security (RLS) Policies

```sql
-- Example 1: Participants can only see data from their current run
CREATE POLICY "participants_see_own_run_data"
ON phases FOR SELECT
TO authenticated
USING (
  run_id IN (
    SELECT run_id FROM roles 
    WHERE assigned_user_id = auth.uid()
  )
);

-- Example 2: Facilitators can see and modify everything
CREATE POLICY "facilitators_full_access"
ON phases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'facilitator'
  )
);

-- Example 3: Participants can only vote once per phase
CREATE POLICY "one_vote_per_phase"
ON votes FOR INSERT
TO authenticated
WITH CHECK (
  voter_role_id IN (
    SELECT role_id FROM roles WHERE assigned_user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM votes v2
    WHERE v2.phase_id = votes.phase_id
    AND v2.voter_role_id = votes.voter_role_id
  )
);

-- Example 4: AI context updates only by system
CREATE POLICY "ai_context_system_only"
ON ai_context FOR INSERT
TO authenticated
USING (false) -- No direct user access
WITH CHECK (false);

-- AI context updates done via Supabase Edge Function (service role)
```

### 10.3 Data Privacy

| Data Type | Visibility | Encryption |
|-----------|------------|------------|
| **Role assignments** | Only assigned participant + facilitator | TLS in transit |
| **Meeting transcripts** | Meeting participants + facilitator | TLS in transit, optional encryption at rest |
| **Clan meetings** | Clan members + facilitator | TLS in transit |
| **Public speeches** | All participants (transcript distributed to all AIs) | TLS in transit |
| **Votes** | Anonymous (tallies public) | TLS in transit |
| **AI context** | AI participant + facilitator only | TLS in transit |

**GDPR Compliance:**
- All personal data deletable on request
- Export functionality for participant data
- Clear consent during registration
- Data retention policy (configurable, default 30 days post-simulation)

---

## 11. PERFORMANCE & SCALABILITY

### 11.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load (Initial)** | <2s | Lighthouse |
| **Page Load (Cached)** | <500ms | Lighthouse |
| **Event Latency** | <200ms | Custom instrumentation |
| **AI Context Update** | <10s | API timing |
| **Voice Connection** | <2s | WebRTC metrics |
| **Database Query** | <100ms (p95) | Supabase metrics |
| **WiFi Stability** | 99%+ uptime | Venue network monitoring |

**Critical Infrastructure Requirements:**
- **Venue WiFi:** Minimum 50 Mbps down, 20 Mbps up, supports 30+ concurrent devices
- **Participant Devices:** Modern smartphone/tablet (iOS 14+, Android 10+) with browser
- **Facilitator Laptop:** Recent machine (2020+) with reliable audio output to speakers
- **Internet Backup:** 4G/5G hotspot available in case WiFi fails

### 11.2 Scalability Design

**Current Capacity (Single Instance):**
- 30 concurrent participants (20 human + 10 AI)
- 5 concurrent voice sessions
- 10 concurrent AI context updates
- 100 events/minute

**Scaling Strategy (Future):**

1. **Database:**
   - PostgreSQL connection pooling (PgBouncer)
   - Read replicas for analytics queries
   - Partitioning event_log by created_at (monthly)

2. **AI Processing:**
   - Queue system (BullMQ or similar) for context updates
   - Parallel processing (up to 10 LLM calls simultaneously)
   - Circuit breaker for API failures

3. **Voice:**
   - ElevenLabs handles scaling automatically
   - Fallback to text if voice API overloaded

4. **Frontend:**
   - CDN for static assets (Vercel Edge)
   - Code splitting (lazy load modules)
   - Service worker for offline support

### 11.3 Database Optimization

```sql
-- Critical Indexes
CREATE INDEX CONCURRENTLY idx_phases_run_status 
ON phases(run_id, status) 
WHERE status = 'active'; -- Partial index for active phases

CREATE INDEX CONCURRENTLY idx_ai_context_current
ON ai_context(role_id, version DESC)
WHERE is_current = TRUE; -- Fast lookup of current context

CREATE INDEX CONCURRENTLY idx_meetings_participants_gin
ON meetings USING GIN (participants jsonb_path_ops); -- Fast participant queries

CREATE INDEX CONCURRENTLY idx_event_log_run_type
ON event_log(run_id, event_type, created_at DESC); -- Fast event queries

-- Materialized View for Analytics (Refresh after each phase)
CREATE MATERIALIZED VIEW meeting_network AS
SELECT 
  m.run_id,
  jsonb_array_elements_text(m.participants) AS participant_id,
  COUNT(*) AS meeting_count,
  AVG(m.actual_duration_seconds) AS avg_duration
FROM meetings m
WHERE m.status = 'completed'
GROUP BY m.run_id, participant_id;

CREATE INDEX idx_meeting_network_participant 
ON meeting_network(participant_id);
```

---

## 12. DEPLOYMENT ARCHITECTURE

### 12.1 Infrastructure

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                        VERCEL EDGE                           Ã¢â€â€š
Ã¢â€â€š  - Frontend hosting (React SPA)                             Ã¢â€â€š
Ã¢â€â€š  - CDN (global edge network)                                Ã¢â€â€š
Ã¢â€â€š  - Environment variables (secrets)                          Ã¢â€â€š
Ã¢â€â€š  - CI/CD (GitHub integration)                               Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                          Ã¢â€ â€¢ HTTPS
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                       SUPABASE                               Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š PostgreSQL Database (hosted, managed)                 Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š - RLS policies                                        Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š - Automatic backups (daily)                           Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š - Point-in-time recovery (7 days)                     Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š Supabase Auth (JWT tokens)                            Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š Supabase Realtime (PostgreSQL pub/sub)                Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š Supabase Storage (audio files, transcripts)           Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š Supabase Edge Functions (Deno runtime)                Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š - AI orchestration                                    Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š - Complex business logic                              Ã¢â€â€š Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                          Ã¢â€ â€¢ API
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                   EXTERNAL SERVICES                          Ã¢â€â€š
Ã¢â€â€š  - ElevenLabs API (voice)                                   Ã¢â€â€š
Ã¢â€â€š  - Anthropic API (LLM)                                      Ã¢â€â€š
Ã¢â€â€š  - Google Gemini API (LLM)                                  Ã¢â€â€š
Ã¢â€â€š  - OpenAI API (LLM)                                         Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
```

### 12.2 Environment Configuration

```bash
# .env.local (Development)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ELEVENLABS_API_KEY=sk_...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIza...
VITE_OPENAI_API_KEY=sk-...

# Supabase Edge Functions Environment
ELEVENLABS_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # For bypassing RLS
```

### 12.3 Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 13. TESTING STRATEGY

### 13.1 Test Pyramid

```
          /\
         /  \
        / E2E \       End-to-End (10%)
       /______\       - Full simulation run
      /        \      - Critical user paths
     /Integration\    Integration (30%)
    /____________\    - API contracts
   /              \   - Event flows
  /   Unit Tests   \  Unit Tests (60%)
 /__________________\ - Business logic
                      - State machines
```

### 13.2 Test Scenarios

**Unit Tests (Vitest):**
```typescript
describe('Phase State Machine', () => {
  it('should allow transition from pending to active', () => {
    expect(canTransition('pending', 'active')).toBe(true);
  });
  
  it('should not allow transition from completed to active', () => {
    expect(canTransition('completed', 'active')).toBe(false);
  });
});

describe('Vote Tally Calculation', () => {
  it('should identify winner with 2/3 majority', () => {
    const votes = [
      { candidate_role_id: 'role-1', count: 14 },
      { candidate_role_id: 'role-2', count: 6 }
    ];
    const result = calculateResults(votes, 20, 0.667);
    expect(result.has_winner).toBe(true);
    expect(result.winner.role_id).toBe('role-1');
  });
});
```

**Integration Tests (Playwright):**
```typescript
test('Meeting invite flow', async ({ page }) => {
  // 1. Login as AI participant
  await loginAs(page, 'ai-participant-1');
  
  // 2. Initiate meeting invite
  await page.click('[data-testid="invite-meeting-btn"]');
  await page.selectOption('[data-testid="invitee-select"]', 'role-2');
  await page.click('[data-testid="send-invite-btn"]');
  
  // 3. Switch to invitee participant
  await loginAs(page, 'human-participant-2');
  
  // 4. Accept invite
  await page.waitForSelector('[data-testid="meeting-invite-toast"]');
  await page.click('[data-testid="accept-invite-btn"]');
  
  // 5. Verify meeting started
  await expect(page.locator('[data-testid="meeting-active"]')).toBeVisible();
});
```

**E2E Tests:**
```typescript
test('Complete simulation run', async ({ page }) => {
  // 1. Facilitator creates simulation
  await createSimulation(page, {
    name: 'Test Run',
    humanParticipants: 5,
    aiParticipants: 5
  });
  
  // 2. Start simulation
  await page.click('[data-testid="start-simulation-btn"]');
  
  // 3. Advance through phases
  for (const phase of phases) {
    await page.click('[data-testid="start-phase-btn"]');
    await page.waitForSelector('[data-testid="phase-active"]');
    
    // Simulate participant actions
    await simulatePhaseActions(phase);
    
    await page.click('[data-testid="end-phase-btn"]');
  }
  
  // 4. Verify completion
  await expect(page.locator('[data-testid="simulation-complete"]')).toBeVisible();
});
```

### 13.3 AI Testing

**Mock LLM Responses:**
```typescript
// test/mocks/llm.ts
export const mockAIContextUpdate = {
  block_2_identity: {
    values: ['honor', 'tradition'],
    personality: 'conservative, cautious'
  },
  block_3_memory: {
    events: [
      { type: 'meeting', with: 'role-2', outcome: 'promising alliance discussed' }
    ]
  },
  block_4_goals: {
    goals: ['Secure alliance with Landlords', 'Oppose Kition alliance'],
    strategies: ['Build trust through shared values', 'Highlight dangers of foreign influence']
  },
  updated_reason: 'Public speech revealed Merchants favor Kition; must counter this'
};

// In tests
vi.mock('@/lib/ai', () => ({
  updateAIContext: vi.fn().mockResolvedValue(mockAIContextUpdate)
}));
```

---

## 14. MIGRATION & EVOLUTION

### 14.1 Initial Seed Data Deployment

**Purpose:** Load canonical simulation design into database during system setup.

**One-Time Deployment Script:**

```typescript
// scripts/seed-default-template.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key
);

async function seedDefaultTemplate() {
  console.log('Ã°Å¸â€œÅ¡ Loading seed files...');
  
  // 1. Read seed files from repository
  const contextText = readFileSync('./seed/KING_Context.md', 'utf-8');
  const processCSV = readFileSync('./seed/KING_Process.csv', 'utf-8');
  const decisionsText = readFileSync('./seed/KING_Decisions.md', 'utf-8');
  const clansCSV = readFileSync('./seed/KING_ALL_CLANs.csv', 'utf-8');
  const rolesCSV = readFileSync('./seed/KING_ALL_ROLES.csv', 'utf-8');
  
  // 2. Parse CSV files to JSONB
  const processStages = parse(processCSV, { 
    columns: true,
    skip_empty_lines: true 
  });
  
  const canonicalClans = parse(clansCSV, { 
    columns: true,
    skip_empty_lines: true 
  });
  
  const canonicalRoles = parse(rolesCSV, { 
    columns: true,
    skip_empty_lines: true 
  });
  
  // 3. Parse decisions framework from markdown
  const decisionsFramework = parseDecisionsMarkdown(decisionsText);
  
  // 4. Insert into database
  const { data, error } = await supabase
    .from('simulation_templates')
    .insert({
      name: 'The New King of Kourion',
      version: 'v1.0',
      language: 'ENG',
      context_text: contextText,
      process_stages: processStages,
      decisions_framework: decisionsFramework,
      canonical_clans: canonicalClans,
      canonical_roles: canonicalRoles,
      description: 'Ancient Cyprus city-state leadership simulation',
      author: 'Marat Atnashev',
      is_active: true
    });
  
  if (error) {
    console.error('Ã¢ÂÅ’ Seed failed:', error);
    throw error;
  }
  
  console.log('Ã¢Å“â€¦ Default template seeded successfully');
  console.log(`   Template ID: ${data.template_id}`);
}

function parseDecisionsMarkdown(markdown: string): object {
  // Parse KING_Decisions.md structure into JSONB
  return {
    taxes: {
      categories: ['agriculture', 'trade', 'banking', 'craft'],
      options: ['lower', 'same', 'higher']
    },
    budget_priorities: {
      count: 3,
      options: ['defense', 'culture', 'agriculture', 'banking', 'trade', 'craft']
    },
    appointments: {
      economic_advisor: { type: 'role_selection' },
      senior_judge: { type: 'role_selection' }
    },
    international_affairs: {
      alliances: ['Salamis', 'Kition', 'none'],
      war_declarations: ['Salamis', 'Kition', 'Egypt', 'Assyria', 'Pirates', 'none']
    },
    other_decisions: {
      type: 'free_text',
      description: 'Rewards, arrests, exiles, emergency measures'
    }
  };
}

// Run deployment
seedDefaultTemplate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

**Deployment Checklist:**
- [ ] Seed files present in `/seed` directory
- [ ] Supabase service role key configured
- [ ] Database schema applied (all tables created)
- [ ] Run: `npm run seed-template`
- [ ] Verify: Query `simulation_templates` table (should have 1 row)

**Future Template Additions:**

```sql
-- Add Russian translation (future)
INSERT INTO simulation_templates (
  name, version, language,
  context_text, process_stages, decisions_framework,
  canonical_clans, canonical_roles
) VALUES (
  'ÃÂÃÂ¾ÃÂ²Ã‘â€¹ÃÂ¹ ÃÅ¡ÃÂ¾Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’ ÃÅ¡Ã‘Æ’Ã‘â‚¬ÃÂ¸ÃÂ¾ÃÂ½ÃÂ°',
  'v1.0',
  'RU',
  '/* Translated context */',
  '/* Same structure, Russian text */',
  '/* Translated framework */',
  '/* Translated clans */',
  '/* Translated roles */'
);

-- Add updated version (future)
INSERT INTO simulation_templates (
  name, version, language, ...
) VALUES (
  'The New King of Kourion',
  'v1.1', -- Improved based on feedback
  'ENG',
  ...
);
```

### 14.2 Database Migrations

```sql
-- migrations/001_initial_schema.sql
-- (Complete schema from Section 3)

-- migrations/002_add_meeting_modality.sql
ALTER TABLE meetings
ADD COLUMN modality TEXT DEFAULT 'voice' 
CHECK (modality IN ('physical', 'voice', 'text'));

-- migrations/003_add_ai_rate_limiting.sql
CREATE TABLE ai_action_rate_limits (
  role_id UUID REFERENCES roles(role_id),
  action_type TEXT NOT NULL,
  last_action_at TIMESTAMPTZ NOT NULL,
  action_count INTEGER DEFAULT 1,
  PRIMARY KEY (role_id, action_type)
);

-- Rollback scripts also maintained
```

### 14.2 Schema Versioning

```typescript
// Database version tracking
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version, name) 
VALUES (1, 'initial_schema');
```

### 14.3 Backward Compatibility

**API Versioning:**
```typescript
// Edge Functions versioned
// /functions/v1/meetings/create-invite
// /functions/v2/meetings/create-invite (future)

// Old clients continue using v1
// New clients use v2
// Both versions maintained for 6 months
```

**Config Evolution:**
```typescript
// sim_runs.config JSONB flexible
// Add new fields without breaking old runs
{
  "version": "1.0",
  "clans": [...],
  "roles": [...],
  
  // New field added in version 1.1
  "advanced_features": {
    "group_voice": false // Default off for old simulations
  }
}
```

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|------|------------|
| **Template** | Canonical simulation design ("the written play") - reusable, versioned, stored in database |
| **Instance / Run** | Specific execution of a template ("director's production") - customized, immutable after start |
| **Seed Data** | Original design files (KING_Context.md, etc.) imported into simulation_templates table |
| **Phase** | Sequential stage of simulation (e.g., Clan Council 1) |
| **Role** | Individual character (human or AI) with clan affiliation |
| **Clan** | Faction grouping multiple roles with shared interests |
| **Meeting** | Conversation between 2+ participants (voice, text, or physical) |
| **Public Speech** | Public address recorded and distributed to all AI participants for context updates |
| **AI Context** | Cognitive state of AI participant (4 blocks) |
| **Event** | Atomic action logged to event_log |
| **Facilitator** | Human admin controlling simulation flow ("director") |
| **Participant** | Human or AI playing a role in simulation ("actor") |
| **ElevenLabs Agent** | Pre-configured AI voice character (voice + LLM settings) |

---

## APPENDIX B: API RATE LIMITS

| API | Limit | Action on Exceed |
|-----|-------|------------------|
| **ElevenLabs (Voice)** | 100 requests/min | Queue + fallback to text |
| **Anthropic (LLM)** | 50 requests/min | Retry with exponential backoff |
| **Google Gemini (LLM)** | 60 requests/min | Retry with exponential backoff |
| **OpenAI (LLM)** | 100 requests/min | Retry with exponential backoff |
| **Supabase (Realtime)** | 200 events/second | Built-in throttling |
| **AI Meeting Invites** | 3 per 5 min per AI | Block + log warning |

---

## APPENDIX C: ERROR CODES

| Code | Description | User Action |
|------|-------------|-------------|
| `E1001` | Phase transition invalid | Contact facilitator |
| `E1002` | Vote already cast | Refresh page |
| `E1003` | Meeting invite expired | Request new invite |
| `E2001` | ElevenLabs API failure | Retry or switch to text |
| `E2002` | LLM timeout | Wait for facilitator intervention |
| `E3001` | Database connection lost | Refresh page |

---

## DOCUMENT MAINTENANCE

**Review Cadence:** Weekly during development, monthly post-launch

**Change Process:**
1. Propose change (GitHub issue)
2. Review with team
3. Update document
4. Increment version
5. Notify all developers

**Document Owner:** Marat (primary), Claude Code (technical review)

---

**END OF TECHNICAL GUIDE v1.0**

*This document is a living specification. All implementation must align with this architecture unless explicitly approved deviations are documented.*