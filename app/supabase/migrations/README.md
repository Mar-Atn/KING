# Supabase Database Migrations for The New King SIM

This directory contains all database schema migrations for The New King political simulation platform.

## Migration Files

### Core Schema

1. **00001_init_core_tables.sql** - Core foundation tables
   - `sim_runs` - Simulation instances with immutable config
   - `users` - Facilitators and participants linked to Supabase Auth
   - `access_tokens` - QR code device access tokens
   - `clans` - Faction definitions
   - `roles` - Character definitions (human & AI)
   - `phases` - Stage definitions

2. **00002_init_interaction_tables.sql** - Interaction tracking
   - `meetings` - All conversations (clan councils, consultations)
   - `meeting_invitations` - Invitation workflow
   - `public_speeches` - Public address recording

3. **00003_init_voting_tables.sql** - Voting system
   - `vote_sessions` - Voting configurations with transparency controls
   - `vote_results` - Calculated tallies and winners
   - `votes` - Individual vote records

4. **00004_init_ai_meta_tables.sql** - AI cognitive state and metadata
   - `ai_context` - Versioned AI participant cognitive state (4-block structure)
   - `ai_prompts` - Centralized prompt management
   - `sim_run_prompts` - Per-simulation prompt overrides
   - `king_decisions` - Royal decrees
   - `reflections` - Individual reflections

5. **00005_init_event_supporting_tables.sql** - Event log and supporting data
   - `event_log` - Complete audit trail (event sourcing light)
   - `facilitator_actions` - Manual intervention tracking
   - `simulation_templates` - Canonical seed data storage

### Security & Automation

6. **00006_rls_policies.sql** - Row Level Security policies
   - Enables RLS on all tables
   - Facilitator policies (full access)
   - Participant policies (scoped access)
   - Helper functions for access control

7. **00007_triggers_functions.sql** - Database triggers and utility functions
   - Timestamp update triggers
   - Event logging triggers
   - Validation triggers
   - Utility functions for common operations
   - Statistics functions

## Database Architecture

### Key Design Principles

1. **Immutability** - Simulation config frozen after start
2. **Audit Trail** - All state changes logged with timestamps
3. **Versioning** - AI context blocks versioned, old versions preserved
4. **Single Source of Truth** - All data in PostgreSQL
5. **Event Sourcing Light** - EVENT_LOG captures all significant actions

### Table Count: 16 Core Tables

**Core:** sim_runs, users, access_tokens, clans, roles, phases
**Interactions:** meetings, meeting_invitations, public_speeches
**Voting:** vote_sessions, vote_results, votes
**AI:** ai_context, ai_prompts, sim_run_prompts, king_decisions, reflections
**Meta:** event_log, facilitator_actions, simulation_templates

### Security Model

**Row Level Security (RLS) enabled on ALL tables:**
- **Facilitators** - Full access to all data
- **Participants** - Scoped access to their simulation data only
- **Anonymous** - No access (must be authenticated)

## Applying Migrations

### Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref esplzaunxkehuankkwbx

# Apply all migrations
supabase db push

# Or apply migrations individually
supabase db push --file 00001_init_core_tables.sql
```

### Using Supabase Dashboard

1. Navigate to https://supabase.com/dashboard/project/esplzaunxkehuankkwbx
2. Go to SQL Editor
3. Copy and paste migration files in order (00001 → 00007)
4. Execute each migration

### Migration Order

⚠️ **IMPORTANT:** Migrations must be applied in numerical order due to foreign key dependencies.

```
00001 → 00002 → 00003 → 00004 → 00005 → 00006 → 00007
```

## Post-Migration Tasks

### 1. Verify Schema

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 2. Test Basic Operations

```sql
-- Test create simulation
INSERT INTO sim_runs (run_name, version, config, config_checksum, total_participants, human_participants, ai_participants, status)
VALUES ('Test Run', 'v1.0', '{"test": true}'::jsonb, 'abc123', 20, 15, 5, 'setup');

-- Verify event log trigger
SELECT * FROM event_log ORDER BY created_at DESC LIMIT 5;
```

### 3. Generate TypeScript Types

The TypeScript types have already been generated in `/app/src/types/database.ts`.

To regenerate types after schema changes:

```bash
# Using Supabase CLI
supabase gen types typescript --project-id esplzaunxkehuankkwbx > src/types/database.ts
```

## Schema Documentation

### JSONB Field Structures

#### `sim_runs.config`
Complete simulation configuration snapshot (frozen after start):
```json
{
  "simulation_name": "The New King of Kourion",
  "version": "v1.0",
  "clans": [...],
  "roles": [...],
  "phases": [...],
  "decisions_framework": {...},
  "ai_settings": {...}
}
```

#### `ai_context` blocks
Four-block cognitive architecture:
- **Block 1 (Fixed):** World rules, stages, architecture (immutable)
- **Block 2 (Identity):** Age, clan, role, backstory, values, personality
- **Block 3 (Memory):** Events, relationships, obligations, conflicts (compacted)
- **Block 4 (Goals):** Goals, hypotheses, strategies, priorities (evolves frequently)

#### `vote_results.results_data`
For 'choose_person' votes:
```json
{
  "winner": {"role_id": "...", "name": "Marcus", "vote_count": 6, "percentage": 40},
  "all_candidates": [...],
  "total_votes": 15,
  "tie": false
}
```

For 'yes_no' votes:
```json
{
  "yes": 8, "no": 5, "abstain": 2,
  "total": 15,
  "yes_percentage": 53.3,
  "passed": true
}
```

## Performance Considerations

### Indexes Created

- **B-tree indexes** on foreign keys and frequently queried columns
- **GIN indexes** on all JSONB columns for efficient JSON queries
- **Composite indexes** for common query patterns
- **Partial indexes** on status columns (WHERE status = 'active')
- **Full-text search indexes** on text content (reflections)

### Query Optimization

```sql
-- Example: Efficient meeting participant query using GIN index
SELECT * FROM meetings
WHERE participants @> '["role-uuid-123"]'::jsonb;

-- Example: Get current phase using indexed query
SELECT * FROM get_current_phase('run-uuid');
```

## Troubleshooting

### Common Issues

**Issue:** Foreign key constraint violation
**Solution:** Ensure migrations applied in order, check that referenced records exist

**Issue:** RLS policy blocking access
**Solution:** Verify user has correct role (facilitator/participant) in users table

**Issue:** Trigger not firing
**Solution:** Check trigger conditions, verify trigger is enabled

### Debug Queries

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_%';

-- Check constraints
SELECT * FROM information_schema.table_constraints
WHERE table_schema = 'public';
```

## Rollback Procedures

To rollback migrations, drop tables in reverse order:

```sql
-- WARNING: This will delete ALL data!
DROP TABLE IF EXISTS event_log CASCADE;
DROP TABLE IF EXISTS facilitator_actions CASCADE;
DROP TABLE IF EXISTS simulation_templates CASCADE;
DROP TABLE IF EXISTS reflections CASCADE;
DROP TABLE IF EXISTS king_decisions CASCADE;
DROP TABLE IF EXISTS ai_prompts CASCADE;
DROP TABLE IF EXISTS sim_run_prompts CASCADE;
DROP TABLE IF EXISTS ai_context CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS vote_results CASCADE;
DROP TABLE IF EXISTS vote_sessions CASCADE;
DROP TABLE IF EXISTS public_speeches CASCADE;
DROP TABLE IF EXISTS meeting_invitations CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS phases CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS clans CASCADE;
DROP TABLE IF EXISTS access_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sim_runs CASCADE;
```

## Contact & Support

For schema questions or migration issues:
- Review `/DOCS/KING_TECH_GUIDE.md` for complete schema specification
- Check `/DOCS/CLAUDE.md` for development guidelines
- Consult database architect or tech lead

---

**Last Updated:** 2025-10-25
**Schema Version:** 1.0
**Total Tables:** 16
**Total Migrations:** 7
