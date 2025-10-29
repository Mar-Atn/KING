# Frontend Performance Issues Found

## Critical Issue: ParticipantDashboard Sequential Queries

**File:** `src/pages/ParticipantDashboard.tsx` lines 50-124

### Problem

The dashboard makes **6 sequential database queries**, waiting for each to complete before starting the next:

1. `getRoleForUser()` - Get user's role
2. `sim_runs.select()` - Get simulation
3. `roles.select()` with **JOIN to users table** - Get clan members
4. `clans.select()` - Get all clans
5. `roles.select()` again - Get all roles
6. `phases.select()` - Get all phases

**Impact:**
- If each query takes 2-3 seconds (due to RLS overhead)
- Total load time: **12-18 seconds**

### Root Cause 1: Sequential Execution

```typescript
// BAD: Each query waits for previous
const roleData = await getRoleForUser(user.id, runId)
const { data: simData } = await supabase.from('sim_runs')...
const { data: membersData } = await supabase.from('roles')...
// ... etc
```

Should be:

```typescript
// GOOD: All queries run in parallel
const [roleData, simData, clansData, allRolesData, phasesData] = await Promise.all([
  getRoleForUser(user.id, runId),
  supabase.from('sim_runs').select('*').eq('run_id', runId).single(),
  supabase.from('clans').select('*').eq('run_id', runId),
  supabase.from('roles').select('*').eq('run_id', runId),
  supabase.from('phases').select('*').eq('run_id', runId).order('sequence_number')
])
```

### Root Cause 2: JOIN to users table (Line 75)

```typescript
.select('*, users!roles_assigned_user_id_fkey(display_name)')
```

This performs a **foreign key JOIN** to the users table. If users table has slow RLS policies, this JOIN makes it worse.

**Impact:** Each role requires a separate users table lookup with RLS evaluation

### Recommended Fixes

**Fix 1: Parallelize Queries (IMMEDIATE - 5-10x faster)**

Change lines 50-124 to use `Promise.all()`:

```typescript
const loadData = async () => {
  try {
    // Run all queries in parallel
    const [roleData, simData, clansData, allRolesData, phasesData] = await Promise.all([
      getRoleForUser(user.id, runId),
      supabase.from('sim_runs').select('*').eq('run_id', runId).single(),
      supabase.from('clans').select('*').eq('run_id', runId).order('sequence_number'),
      supabase.from('roles').select('*').eq('run_id', runId),
      supabase.from('phases').select('*').eq('run_id', runId).order('sequence_number')
    ])

    if (!roleData) {
      navigate(`/waiting-room/${runId}`)
      return
    }

    setRole(roleData)
    setSimulation(simData.data)
    setAllClans(clansData.data || [])
    setAllRoles(allRolesData.data || [])
    setPhases(phasesData.data || [])

    // Filter clan members from allRoles (no separate query needed)
    const members = (allRolesData.data || []).filter(r => r.clan_id === roleData.clan_id)
    setClanMembers(members)

    setLoading(false)
  } catch (err) {
    // error handling
  }
}
```

**Expected improvement: 12s → 2-3s (4-6x faster)**

**Fix 2: Remove JOIN (if still slow)**

Instead of:
```typescript
.select('*, users!roles_assigned_user_id_fkey(display_name)')
```

Use:
```typescript
.select('*')
// Then fetch user names separately if absolutely needed
```

Display names can be shown as "Loading..." initially and fetched separately.

### Other Potential Issues

1. **Real-time subscriptions** (lines 126-198) - Check if these are causing excessive re-renders
2. **Phases subscription** (line 175-198) - Reloads ALL phases on any change (could batch)

### Priority

**HIGH PRIORITY** - This is likely the main cause of 15-20 second load times.

Implementing parallel queries alone should reduce load time from 12-18s to 2-3s.
