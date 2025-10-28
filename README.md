# The New King - SIM Web Application

> An immersive, AI-augmented simulation of leadership, governance, and collective decision-making in Ancient Cyprus.

## 🏗️ Project Status

**Current Phase:** Phase 2.4 Complete (October 28, 2025)
**Overall Progress:** ~35-40% to MVP
**Latest Updates:** Full participant flow + RLS performance optimization

### ✅ Completed Phases

**Phase 2.4 - Full Participant Flow (Oct 28, 2025)**
- Waiting room with real-time role assignment detection
- Dramatic role reveal animation
- Comprehensive role briefing with clan information
- Participant dashboard with phase tracking
- Real-time Supabase subscriptions

**Phase 2.3 - RLS Performance Optimization (Oct 28, 2025)**
- Fixed all Supabase Performance Advisor warnings
- Optimized auth.uid() usage (15 policies - 10-100x faster)
- Consolidated duplicate policies (76 → 59 policies)
- Removed duplicate indexes (4 redundant indexes)
- Profile loading now instant (was 5s timeout)

**Phase 2.2 - Simulation Configurator (Oct 27, 2025)**
- 7-step simulation creation wizard
- Template selection and customization
- Clan and role configuration
- Phase timing setup
- Printable materials generation
- Role assignment (AI vs Human)

**Phase 1.3 - Authentication System (Oct 25, 2025)**
- Complete email/password authentication
- QR code device access (24-hour tokens)
- Role-based access control (facilitator/participant)
- Protected routes and navigation

**Phase 1.2 - Database Schema (Oct 25, 2025)**
- 16 production tables with RLS security
- Real-time subscriptions
- 59 optimized policies
- Complete TypeScript types

**Phase 1.1 - Foundation (Oct 25, 2025)**
- Vite + React 19 + TypeScript
- Tailwind CSS design system
- Supabase client configuration
- State management (Zustand + TanStack Query)

### 🚧 In Progress

**Phase 2.5 - Participant Dashboard Enhancement**
- Complete tab content (My Clan, Process Overview)
- Phase-specific participant UI
- Enhanced real-time updates

### 📋 Upcoming Phases

**Phase 3.1 - Voting Module** (Next Priority)
- Clan nomination workflow
- Two-round election system
- Ballot UI and results display
- Vote audit trail

**Phase 3.2 - Meetings Module**
- Meeting invitations and state management
- Text-based chat (voice deferred)
- Facilitator meeting monitor

**Phase 3.3 - AI Character System**
- LLM integration (Anthropic Claude)
- 4-block context system
- AI decision-making
- AI-to-AI communication

See `/DOCS/CURRENT_STATUS.md` for detailed progress tracking vs PRD requirements.

---

## ✨ Feature Highlights

### For Facilitators
- **Simulation Creation Wizard** - 7-step guided setup
- **Template Management** - Create, edit, duplicate simulation scenarios
- **Real-Time Control Panel** - Start, pause, skip, end phases
- **Participant Management** - Register, assign roles, monitor status
- **Printable Materials** - Generate reference materials for offline play
- **Performance Dashboard** - Monitor simulation health and participant activity

### For Participants
- **Seamless Onboarding** - Email/password or QR code access
- **Dramatic Role Reveal** - Animated character introduction
- **Rich Character Briefs** - Background, traits, clan information
- **Real-Time Phase Sync** - Always know current stage and objectives
- **Printable Reference** - Character and clan materials for gameplay

### Technical Features
- **Real-Time Sync** - Supabase Realtime for instant updates
- **Row-Level Security** - Comprehensive data access control
- **Performance Optimized** - Sub-100ms query times
- **Responsive Design** - Works on desktop, tablet, mobile
- **Type-Safe** - Full TypeScript coverage
- **Modular Architecture** - Easy to extend and maintain

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (copy from .env.example)
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations (first time only)
npx supabase db push

# Start development server
npm run dev

# Build for production
npm run build
```

**Dev Server:** http://localhost:5174

**Supabase Dashboard:** Check `/DOCS/Main keys.md` for credentials

---

## 📁 Project Structure

```
app/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── simulation/  # Simulation-specific components
│   │   └── wizard/      # Setup wizard components
│   ├── pages/           # Route pages
│   │   ├── Dashboard.tsx              # Main dashboard (role router)
│   │   ├── FacilitatorSimulation.tsx  # Facilitator control panel
│   │   ├── SimulationWizard.tsx       # 7-step setup wizard
│   │   ├── WaitingRoom.tsx            # Pre-role assignment
│   │   ├── RoleReveal.tsx             # Animated role reveal
│   │   ├── RoleBriefing.tsx           # Character briefing
│   │   └── ParticipantDashboard.tsx   # Participant main UI
│   ├── contexts/        # React Context providers
│   │   └── AuthContext.tsx            # Authentication state
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & config
│   │   ├── supabase.ts                # Supabase client
│   │   └── data/                      # Data utilities
│   ├── stores/          # Zustand state stores
│   ├── types/           # TypeScript definitions
│   │   └── database.ts                # Supabase types (590 lines)
│   └── App.tsx          # Main application with routing
├── supabase/
│   └── migrations/      # 45 database migration files
└── docs/                # Documentation (in parent ../DOCS)
```

---

## 🎨 Design System

### Color Palette
- **Primary:** `#2C5F7C` (Mediterranean Blue) - Headers, CTAs
- **Secondary:** `#C9704F` (Chestnut Rose) - Accents, highlights
- **Accent:** `#D4AF37` (Antique Gold) - Special elements
- **Clan Colors:** Dynamic based on clan assignment

### Typography
- **Headings:** Cinzel (serif) - Ancient aesthetic
- **Body:** Inter (sans-serif) - Modern readability
- **Monospace:** Fira Code - Technical content

### Component Library
- **Buttons:** Primary, secondary, outline, ghost variants
- **Cards:** Role cards, simulation cards, info panels
- **Forms:** Text inputs, selects, checkboxes with validation
- **Badges:** Status indicators, clan identifiers
- **Modals:** Role details, confirmations
- **Animations:** Framer Motion for smooth transitions

---

## 🗄️ Database Architecture

**16 Production Tables:**
- `users` - Facilitators and participants
- `access_tokens` - QR code device access
- `sim_runs` - Simulation instances
- `simulation_templates` - Scenario templates
- `clans` - Faction definitions
- `roles` - Character assignments
- `phases` - Stage definitions
- `meetings` - Group conversations (schema ready)
- `meeting_invitations` - Meeting requests
- `public_speeches` - Broadcast messages
- `votes` - Election ballots
- `vote_sessions` - Voting rounds
- `vote_results` - Tallied results
- `ai_context` - AI character memory (schema ready)
- `reflections` - Post-simulation feedback
- `event_log` - Complete audit trail

**Security:** 59 Row-Level Security policies protecting all data

**Performance:** Optimized indexes and auth.uid() usage for sub-100ms queries

---

## 📚 Documentation

### Core Documents (in `../DOCS/`)
- **KING_PRD.md** - Complete product requirements (1,337 lines)
- **KING_TECH_GUIDE.md** - Technical architecture and database schema
- **KING_AI_DESIGN.md** - AI participant system design
- **KING_UX_GUIDE.md** - Design specifications and UI patterns
- **CLAUDE.md** - Development guidelines and project discipline

### Project Status
- **CURRENT_STATUS.md** - Comprehensive progress report vs PRD
- **FEATURES_TRACKING.md** - Feature-by-feature implementation status
- **sessions/SESSION_SUMMARY_2025_10_28.md** - Latest development session

### SIM Design (in `../DOCS/KING_SIM_BASE/`)
- **KING_Context.md** - Simulation narrative and setting
- **KING_Decisions.md** - Key decisions the King must make
- **KING_Process.csv** - 18-stage simulation flow
- **clans/** - 6 clan definitions with priorities and attitudes
- **roles/** - 30 character profiles

---

## 🔐 Environment Setup

Required environment variables (`.env.local`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

See `/DOCS/Main keys.md` for actual credentials (not in git).

---

## 🧪 Testing

**Current Status:** Testing infrastructure not yet implemented

**Planned:**
- **Unit Tests:** Vitest for component and utility testing
- **Integration Tests:** Supabase RLS policy testing
- **E2E Tests:** Playwright for complete user flows
- **Target Coverage:** 80%+ for critical paths

---

## 🚀 Deployment

**Frontend:** Vercel (configured for Vite)
**Backend:** Supabase (PostgreSQL + Realtime + Auth)
**Migrations:** Applied via `supabase db push`

See deployment documentation (coming soon).

---

## 📈 Technical Metrics

- **Frontend Dependencies:** 317 packages
- **TypeScript:** 100% coverage (strict mode)
- **Database Tables:** 16 production tables
- **RLS Policies:** 59 optimized policies
- **Migrations:** 45 SQL files (~3,000 lines)
- **React Components:** 40+ components
- **Pages:** 14 route pages
- **Lines of Code:** ~15,000 (TypeScript + SQL)

---

## 🤝 Contributing

This project follows strict development discipline per `/DOCS/CLAUDE.md`:
- Documentation-first development
- Modular architecture
- Testing discipline (to be implemented)
- Clear commit messages
- No undocumented changes

---

## 📄 License

Proprietary - MetaGames Learning Technologies

---

**Built with ⚡ by the MetaGames Team**
**Powered by:** React 19 • TypeScript • Supabase • Tailwind CSS • Framer Motion
