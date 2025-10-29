# QUICK FIX GUIDE - Database Performance Issue

## Problem
Database is "exhausting resources" - loading simulations takes 15-20+ seconds.

## Root Cause
**Event logging triggers** creating cascade overhead on every query.

## Emergency Fix (Apply NOW)

### Option 1: Using Migration File

```bash
# From your project root
cd /Users/maratatnashev/Desktop/CODING/KING/app

# Apply the fix to your Supabase database
# Replace with your actual connection string from Supabase Dashboard
psql "postgresql://postgres:[PASSWORD]@db.esplzaunxkehuankkwbx.supabase.co:5432/postgres" \
  -f supabase/migrations/00068_emergency_disable_triggers.sql
```

### Option 2: Using Supabase SQL Editor

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/esplzaunxkehuankkwbx
2. Click **SQL Editor**
3. Paste this code:

```sql
-- Disable all event logging triggers
ALTER TABLE sim_runs DISABLE TRIGGER trigger_log_sim_run_status_change;
ALTER TABLE phases DISABLE TRIGGER trigger_log_phase_status_change;
ALTER TABLE votes DISABLE TRIGGER trigger_log_vote_cast;
ALTER TABLE meetings DISABLE TRIGGER trigger_log_meeting_created;
ALTER TABLE meetings DISABLE TRIGGER trigger_log_meeting_completed;
ALTER TABLE public_speeches DISABLE TRIGGER trigger_log_public_speech;
ALTER TABLE ai_context DISABLE TRIGGER trigger_log_ai_context_update;

-- Verify
SELECT
  tgrelid::regclass AS table_name,
  tgname AS trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
  END AS status
FROM pg_trigger
WHERE tgname LIKE '%log%'
  AND tgname NOT LIKE 'pg_%'
ORDER BY table_name;
```

4. Click **Run**
5. Check output - all triggers should show `DISABLED`

## Expected Results (Immediate)

✅ **Login:** Stays fast (50-100ms)
✅ **Load simulation:** Drops from 15-20s to <1 second
✅ **Database CPU:** Drops from 90% to 10-20%
✅ **Resource warning:** Should disappear from Supabase dashboard

## Trade-offs

⚠️ **Event logging is disabled** - no audit trail until triggers are re-enabled
⚠️ **Analytics features** won't record new events
⚠️ **This is temporary** - need permanent solution (see below)

## Verification Steps

1. **After applying fix:**
   ```bash
   # Clear browser cache
   # Log in as participant
   # Load simulation dashboard
   # Should be <1 second
   ```

2. **Check Supabase Dashboard:**
   - Go to Database → Performance
   - CPU usage should drop significantly
   - "Exhausting resources" warning should be gone

3. **Test functionality:**
   - Login works ✓
   - Dashboard loads fast ✓
   - Can view roles, clans, phases ✓

## If Still Slow After Fix

If performance doesn't improve, the issue is NOT triggers. Check:

1. **Network latency:**
   - Open browser DevTools → Network tab
   - Check API request times
   - EU North 1 region might have high latency to your location

2. **Frontend issues:**
   - Check for unnecessary re-renders
   - Check real-time subscription overhead
   - Look for memory leaks

3. **Supabase API limits:**
   - Check your plan limits
   - Check rate limiting

## Permanent Solution (Next Steps)

**Don't leave triggers disabled forever.** Implement one of these:

### Option A: Async Event Queue (Recommended)
- Events sent to queue (Redis, RabbitMQ, or pg_notify)
- Background worker writes to event_log in batches
- Zero performance impact

### Option B: Application-Level Logging
- Remove triggers entirely
- Log events from TypeScript code
- Can use external service (Sentry, Datadog)

### Option C: Selective Triggering
- Re-enable only critical triggers (phases, votes)
- Disable triggers on meetings, speeches, ai_context
- Reduces overhead by 80-90%

**See full report:** `DATABASE_PERFORMANCE_DIAGNOSTIC_REPORT.md`

## Re-Enable Triggers (After Optimization)

```sql
-- Only run this AFTER implementing permanent solution
ALTER TABLE sim_runs ENABLE TRIGGER trigger_log_sim_run_status_change;
ALTER TABLE phases ENABLE TRIGGER trigger_log_phase_status_change;
ALTER TABLE votes ENABLE TRIGGER trigger_log_vote_cast;
ALTER TABLE meetings ENABLE TRIGGER trigger_log_meeting_created;
ALTER TABLE meetings ENABLE TRIGGER trigger_log_meeting_completed;
ALTER TABLE public_speeches ENABLE TRIGGER trigger_log_public_speech;
ALTER TABLE ai_context ENABLE TRIGGER trigger_log_ai_context_update;
```

## Diagnostic Tools

### Run Full Diagnostic
```bash
psql "your-connection-string" \
  -f supabase/migrations/00067_comprehensive_performance_diagnosis.sql
```

### Check Trigger Status
```sql
SELECT
  tgrelid::regclass AS table_name,
  tgname AS trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
  END AS status
FROM pg_trigger
WHERE tgname LIKE '%log%'
  AND tgname NOT LIKE 'pg_%';
```

### Monitor Query Performance
```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slowest queries
SELECT
  substring(query, 1, 100) AS query_preview,
  calls,
  round(total_exec_time::numeric, 2) AS total_time_ms,
  round(mean_exec_time::numeric, 2) AS avg_time_ms,
  round(max_exec_time::numeric, 2) AS max_time_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Support

**Files:**
- Full analysis: `DATABASE_PERFORMANCE_DIAGNOSTIC_REPORT.md`
- Diagnostic script: `supabase/migrations/00067_comprehensive_performance_diagnosis.sql`
- Emergency fix: `supabase/migrations/00068_emergency_disable_triggers.sql`

**Questions?** Reference the full diagnostic report for detailed explanations.

---

**Last updated:** 2025-10-28
**Status:** Emergency fix ready to apply
