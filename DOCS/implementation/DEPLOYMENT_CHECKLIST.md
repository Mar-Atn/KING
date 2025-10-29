# Database Deployment Checklist

**Project:** The New King SIM
**Date:** October 25, 2025
**Database:** Supabase PostgreSQL
**URL:** https://esplzaunxkehuankkwbx.supabase.co

---

## Pre-Deployment Checklist

### Environment Verification

- [ ] Supabase project is accessible: https://esplzaunxkehuankkwbx.supabase.co
- [ ] Environment variables are set in `/app/.env.local`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Project linked: `supabase link --project-ref esplzaunxkehuankkwbx`

### Migration Files Ready

- [ ] `00001_init_core_tables.sql` exists and verified
- [ ] `00002_init_interaction_tables.sql` exists and verified
- [ ] `00003_init_voting_tables.sql` exists and verified
- [ ] `00004_init_ai_meta_tables.sql` exists and verified
- [ ] `00005_init_event_supporting_tables.sql` exists and verified
- [ ] `00006_rls_policies.sql` exists and verified
- [ ] `00007_triggers_functions.sql` exists and verified
- [ ] All migration files reviewed for correctness
- [ ] TypeScript types generated in `/app/src/types/database.ts`

---

## Deployment Steps

### Step 1: Backup Current Database (If Exists)

```bash
# If database already has data, create backup first
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

- [ ] Backup created (if applicable)
- [ ] Backup verified (can be restored if needed)

### Step 2: Apply Migrations

**Choose ONE method:**

#### Method A: All at Once (Fastest)

```bash
cd /Users/maratatnashev/Desktop/CODING/KING/app
supabase db push
```

- [ ] Migrations applied successfully
- [ ] No errors in output

#### Method B: One by One (Recommended for First Deployment)

```bash
cd /Users/maratatnashev/Desktop/CODING/KING/app

# Core tables
supabase db push --file supabase/migrations/00001_init_core_tables.sql

# Interaction tables
supabase db push --file supabase/migrations/00002_init_interaction_tables.sql

# Voting tables
supabase db push --file supabase/migrations/00003_init_voting_tables.sql

# AI & meta tables
supabase db push --file supabase/migrations/00004_init_ai_meta_tables.sql

# Event & supporting tables
supabase db push --file supabase/migrations/00005_init_event_supporting_tables.sql

# RLS policies
supabase db push --file supabase/migrations/00006_rls_policies.sql

# Triggers & functions
supabase db push --file supabase/migrations/00007_triggers_functions.sql
```

- [ ] 00001 applied successfully
- [ ] 00002 applied successfully
- [ ] 00003 applied successfully
- [ ] 00004 applied successfully
- [ ] 00005 applied successfully
- [ ] 00006 applied successfully
- [ ] 00007 applied successfully

#### Method C: Manual via Dashboard

1. Navigate to: https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql
2. Open SQL Editor
3. Copy/paste each migration file in order (00001 → 00007)
4. Execute each migration

- [ ] All migrations executed without errors

---

## Post-Deployment Verification

### Step 3: Verify Schema

```sql
-- Check all tables exist (should return 16 tables)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- [ ] access_tokens
- [ ] ai_context
- [ ] ai_prompts
- [ ] clans
- [ ] event_log
- [ ] facilitator_actions
- [ ] king_decisions
- [ ] meeting_invitations
- [ ] meetings
- [ ] phases
- [ ] public_speeches
- [ ] reflections
- [ ] roles
- [ ] sim_run_prompts
- [ ] sim_runs
- [ ] simulation_templates
- [ ] users
- [ ] vote_results
- [ ] vote_sessions
- [ ] votes

**Total:** 16 tables ✅

### Step 4: Verify RLS Enabled

```sql
-- Check RLS is enabled on all tables (should return 16 rows, all TRUE)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

- [ ] All 16 tables have `rowsecurity = TRUE`

### Step 5: Verify Triggers

```sql
-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

Expected triggers:
- [ ] `trigger_log_sim_run_status_change` on sim_runs
- [ ] `trigger_log_phase_status_change` on phases
- [ ] `trigger_log_vote_cast` on votes
- [ ] `trigger_log_meeting_created` on meetings
- [ ] `trigger_log_meeting_completed` on meetings
- [ ] `trigger_log_public_speech` on public_speeches
- [ ] `trigger_log_ai_context_update` on ai_context
- [ ] `trigger_ensure_single_current_ai_context` on ai_context
- [ ] `trigger_validate_vote_session_scope` on vote_sessions
- [ ] `trigger_calculate_meeting_duration` on meetings
- [ ] `trigger_calculate_speech_duration` on public_speeches
- [ ] `update_simulation_templates_updated_at` on simulation_templates
- [ ] `update_ai_prompts_updated_at` on ai_prompts

### Step 6: Verify Functions

```sql
-- Check custom functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;
```

Expected functions:
- [ ] `all_votes_cast`
- [ ] `calculate_meeting_duration`
- [ ] `calculate_speech_duration`
- [ ] `ensure_single_current_ai_context`
- [ ] `generate_access_token`
- [ ] `get_current_phase`
- [ ] `get_current_user_role_id`
- [ ] `get_participant_count`
- [ ] `get_simulation_stats`
- [ ] `is_facilitator`
- [ ] `is_participant_in_run`
- [ ] `log_ai_context_update`
- [ ] `log_meeting_completed`
- [ ] `log_meeting_created`
- [ ] `log_phase_status_change`
- [ ] `log_public_speech`
- [ ] `log_sim_run_status_change`
- [ ] `log_vote_cast`
- [ ] `update_updated_at_column`
- [ ] `validate_access_token`
- [ ] `validate_vote_session_scope`

### Step 7: Verify Indexes

```sql
-- Check indexes exist (should return 100+ indexes)
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

- [ ] Primary key indexes exist on all tables
- [ ] Foreign key indexes exist
- [ ] GIN indexes exist on JSONB columns
- [ ] Partial indexes exist where specified
- [ ] Full-text search index exists on reflections

---

## Functional Testing

### Step 8: Test Basic CRUD Operations

#### Test 1: Create Simulation

```sql
-- Create test facilitator
INSERT INTO users (id, email, display_name, role, status)
VALUES (
  gen_random_uuid(),
  'test.facilitator@example.com',
  'Test Facilitator',
  'facilitator',
  'registered'
);

-- Create test simulation
INSERT INTO sim_runs (
  run_name,
  version,
  config,
  config_checksum,
  total_participants,
  human_participants,
  ai_participants,
  status
) VALUES (
  'Test Simulation',
  'v1.0',
  '{"test": true}'::jsonb,
  md5('{"test": true}'),
  20,
  15,
  5,
  'setup'
);

-- Verify created
SELECT * FROM sim_runs WHERE run_name = 'Test Simulation';
```

- [ ] Simulation created successfully
- [ ] Event logged in event_log

#### Test 2: Test RLS Policies

```sql
-- As facilitator (should see all)
SET ROLE authenticated;
SELECT * FROM sim_runs;

-- As participant (should only see their runs)
-- This will be tested in frontend with actual auth
```

- [ ] RLS policies working as expected

#### Test 3: Test Triggers

```sql
-- Update simulation status
UPDATE sim_runs
SET status = 'ready'
WHERE run_name = 'Test Simulation';

-- Verify event logged
SELECT *
FROM event_log
WHERE event_type = 'simulation_status_changed'
ORDER BY created_at DESC
LIMIT 1;
```

- [ ] Status change logged in event_log
- [ ] Payload contains old and new status

#### Test 4: Test Utility Functions

```sql
-- Test get_simulation_stats
SELECT get_simulation_stats(
  (SELECT run_id FROM sim_runs WHERE run_name = 'Test Simulation')
);
```

- [ ] Function returns JSONB stats
- [ ] Stats are accurate

#### Test 5: Cleanup Test Data

```sql
-- Remove test data
DELETE FROM sim_runs WHERE run_name = 'Test Simulation';
DELETE FROM users WHERE email = 'test.facilitator@example.com';
```

- [ ] Test data cleaned up

---

## Performance Testing

### Step 9: Test Query Performance

```sql
-- Test JSONB query with GIN index
EXPLAIN ANALYZE
SELECT * FROM meetings
WHERE participants @> '["test-uuid"]'::jsonb;

-- Test partial index
EXPLAIN ANALYZE
SELECT * FROM ai_context
WHERE role_id = gen_random_uuid() AND is_current = TRUE;

-- Test composite index
EXPLAIN ANALYZE
SELECT * FROM event_log
WHERE run_id = gen_random_uuid()
AND event_type = 'vote_cast'
ORDER BY created_at DESC;
```

- [ ] GIN indexes being used
- [ ] Partial indexes being used
- [ ] Query performance acceptable (< 100ms for simple queries)

---

## Frontend Integration

### Step 10: Test TypeScript Types

In your React app:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Test type-safe query
const { data, error } = await supabase
  .from('sim_runs')
  .select('*')
  .eq('status', 'in_progress')

// TypeScript should auto-complete and type-check
```

- [ ] TypeScript types import successfully
- [ ] Auto-completion works in IDE
- [ ] No type errors
- [ ] Queries are type-safe

### Step 11: Test Supabase Client Connection

```typescript
// Test connection
const { data, error } = await supabase.from('sim_runs').select('count')

console.log('Connection test:', { data, error })
```

- [ ] Connection successful
- [ ] No CORS errors
- [ ] RLS policies respected

---

## Security Verification

### Step 12: Verify RLS Policies

#### As Anonymous User

```typescript
// Should fail - anonymous users have no access
const { data, error } = await supabase.from('sim_runs').select('*')
// Expected: error with permission denied
```

- [ ] Anonymous users cannot access data

#### As Authenticated Participant

```typescript
// Login as participant
await supabase.auth.signInWithPassword({
  email: 'participant@example.com',
  password: 'password'
})

// Should only see their simulations
const { data } = await supabase
  .from('sim_runs')
  .select('*')
```

- [ ] Participants only see their data

#### As Facilitator

```typescript
// Login as facilitator
await supabase.auth.signInWithPassword({
  email: 'facilitator@example.com',
  password: 'password'
})

// Should see all simulations
const { data } = await supabase
  .from('sim_runs')
  .select('*')
```

- [ ] Facilitators see all data

---

## Documentation

### Step 13: Verify Documentation Complete

- [ ] `/app/supabase/migrations/README.md` exists and accurate
- [ ] `/app/DATABASE_SCHEMA_SUMMARY.md` exists and comprehensive
- [ ] `/app/DEPLOYMENT_CHECKLIST.md` exists (this file)
- [ ] `/app/src/types/database.ts` has comments
- [ ] Migration files have inline comments

---

## Final Checklist

### All Systems Go ✅

- [ ] All 7 migrations applied successfully
- [ ] All 16 tables created
- [ ] RLS enabled on all tables
- [ ] All triggers working
- [ ] All functions created
- [ ] All indexes created
- [ ] TypeScript types accurate
- [ ] CRUD operations tested
- [ ] RLS policies verified
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Team notified of deployment

---

## Rollback Plan (If Needed)

If deployment fails or issues found:

### Option 1: Revert to Backup

```bash
# Restore from backup
supabase db reset --db-url <backup-file>
```

### Option 2: Drop All Tables

```sql
-- WARNING: This deletes ALL data!
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

Then re-apply migrations from scratch.

---

## Post-Deployment Tasks

### Immediate

- [ ] Notify development team deployment is complete
- [ ] Update project status in tracking system
- [ ] Begin frontend integration work

### Within 24 Hours

- [ ] Monitor error logs in Supabase dashboard
- [ ] Check query performance in Supabase dashboard
- [ ] Test all major user flows (facilitator, participant)

### Within 1 Week

- [ ] Load seed data (simulation templates)
- [ ] Create test simulation runs
- [ ] Run full end-to-end tests
- [ ] Configure database backups (if not already)
- [ ] Set up monitoring alerts (if needed)

---

## Support & Troubleshooting

### Common Issues

**Issue:** Migration fails with "relation already exists"
**Solution:** Table already exists - check if migrations already applied

**Issue:** RLS policy blocks access
**Solution:** Verify user role in users table, check auth token

**Issue:** Trigger not firing
**Solution:** Check trigger conditions, verify trigger enabled

**Issue:** TypeScript types don't match
**Solution:** Regenerate types: `supabase gen types typescript`

### Resources

- **Schema Documentation:** `/app/DATABASE_SCHEMA_SUMMARY.md`
- **Migration Guide:** `/app/supabase/migrations/README.md`
- **Tech Spec:** `/DOCS/KING_TECH_GUIDE.md`
- **Development Guide:** `/DOCS/CLAUDE.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/esplzaunxkehuankkwbx

### Contact

For deployment issues, contact:
- Tech Lead / Database Architect
- Reference this checklist and error messages

---

## Sign-off

**Deployed By:** ________________
**Date:** ________________
**Time:** ________________
**Status:** ☐ SUCCESS  ☐ PARTIAL  ☐ FAILED

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Checklist Version:** 1.0
**Last Updated:** October 25, 2025
