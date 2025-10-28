# Row Level Security (RLS) Architecture

**Last Updated:** 2025-10-28
**Status:** ✅ Stable (Security Hardened)
**Version:** 2.0 (Post-Circular Dependency Fix)

---

## Table of Contents
1. [Overview](#overview)
2. [Security Model](#security-model)
3. [Core Helper Functions](#core-helper-functions)
4. [Policy Patterns](#policy-patterns)
5. [Known Issues & Resolutions](#known-issues--resolutions)
6. [Performance Considerations](#performance-considerations)
7. [Testing Strategy](#testing-strategy)
8. [Migration History](#migration-history)

---

## Overview

The New King SIM uses PostgreSQL Row Level Security (RLS) to enforce data access controls at the database level. This architecture ensures that:

- **Facilitators** have full administrative access to all simulation data
- **Participants** have scoped access to data from simulations they're enrolled in
- **Security is enforced at the database layer**, making it impossible to bypass via API bugs
- **All queries automatically filter** based on the authenticated user's role

### Design Philosophy

1. **Security by Default**: RLS is enabled on all tables. Without explicit policies, no data is accessible.
2. **Two-Tier Access Model**: Clear separation between facilitator (admin) and participant (scoped) access.
3. **Database-Level Enforcement**: Security decisions happen in PostgreSQL, not in application code.
4. **Performance-Conscious**: Policies are optimized to use indexes and avoid N+1 query patterns.

---

## Security Model

### Two-Tier Access Pattern

All RLS policies follow a consistent two-tier model:

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATED USERS                       │
├─────────────────────────────────┬───────────────────────────┤
│         FACILITATORS             │       PARTICIPANTS        │
│  (role = 'facilitator')         │    (role = 'participant')  │
├─────────────────────────────────┼───────────────────────────┤
│ • View ALL simulations          │ • View THEIR simulations  │
│ • Create/Edit/Delete ANY data   │ • View data in THEIR runs │
│ • Manage templates              │ • Limited write access    │
│ • Access admin features         │ • Scoped to run_id        │
└─────────────────────────────────┴───────────────────────────┘
```

### Access Scoping

**Facilitators**: Access determined by `users.role = 'facilitator'`
```sql
USING (is_facilitator())
```

**Participants**: Access scoped by `roles.assigned_user_id`
```sql
USING (is_participant_in_run(run_id))
```

---

## Core Helper Functions

Three SECURITY DEFINER functions power the entire RLS system. These functions are critical infrastructure.

### 1. `is_facilitator()` → BOOLEAN

**Purpose**: Check if current user is a facilitator

**Implementation**: `supabase/migrations/00041_fix_is_facilitator_and_users_policies.sql`

```sql
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'facilitator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
```

**Key Design Decisions**:
- ✅ **LANGUAGE plpgsql** (not `sql`): Prevents circular dependency in RLS evaluation
- ✅ **SECURITY DEFINER**: Runs with elevated privileges, bypassing RLS on `users` table
- ✅ **SET search_path**: Security hardening against search path injection attacks

**Why SECURITY DEFINER is Critical**:
Without SECURITY DEFINER, this function would trigger RLS evaluation on the `users` table, which itself uses `is_facilitator()` in policies, creating an infinite loop. SECURITY DEFINER breaks the cycle by running the query with superuser privileges.

### 2. `get_current_user_role_id(p_run_id UUID)` → UUID

**Purpose**: Get the role_id for current user in a specific simulation

**Implementation**: `supabase/migrations/00042_restore_all_rls_policies.sql`

```sql
CREATE OR REPLACE FUNCTION get_current_user_role_id(p_run_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT role_id FROM roles
    WHERE run_id = p_run_id
    AND assigned_user_id = auth.uid()
    AND participant_type = 'human'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
```

**Usage**: Used in policies where participant access depends on having an assigned role

### 3. `is_participant_in_run(p_run_id UUID)` → BOOLEAN

**Purpose**: Check if current user is a participant in a specific simulation

**Implementation**: `supabase/migrations/00042_restore_all_rls_policies.sql`

```sql
CREATE OR REPLACE FUNCTION is_participant_in_run(p_run_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles
    WHERE run_id = p_run_id
    AND assigned_user_id = auth.uid()
    AND participant_type = 'human'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
```

**Usage**: Most common pattern for participant SELECT policies on simulation data tables

---

## Policy Patterns

### Pattern 1: Facilitator Full Access + Participant View

**Used By**: `clans`, `roles`, `phases`, `public_speeches`, `vote_sessions`, etc.

```sql
-- Facilitators can manage everything
CREATE POLICY "Facilitators can manage all X"
  ON table_name FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());

-- Participants can view data in their simulations
CREATE POLICY "Participants can view X in their runs"
  ON table_name FOR SELECT
  TO authenticated
  USING (is_participant_in_run(run_id));
```

**Effect**: Multiple permissive policies are OR'd together. A query succeeds if ANY policy passes.

### Pattern 2: Facilitator Only

**Used By**: `simulation_templates`, `ai_prompts`, `facilitator_actions`

```sql
CREATE POLICY "Facilitators can manage X"
  ON table_name FOR ALL
  TO authenticated
  USING (is_facilitator())
  WITH CHECK (is_facilitator());
```

### Pattern 3: Self + Facilitator Override

**Used By**: `users`, `reflections`

```sql
-- Users can view their own data
CREATE POLICY "Users can view their own X"
  ON table_name FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Facilitators can view all
CREATE POLICY "Facilitators can view all X"
  ON table_name FOR SELECT
  TO authenticated
  USING (is_facilitator());
```

### Pattern 4: Participant with JOIN

**Used By**: `vote_results` (complex foreign key relationships)

```sql
CREATE POLICY "Participants can view vote results"
  ON vote_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vote_sessions vs
      WHERE vs.session_id = vote_results.session_id
      AND is_participant_in_run(vs.run_id)
    )
  );
```

**Note**: Use EXISTS subqueries for foreign key lookups. More efficient than JOINs in RLS policies.

---

## Known Issues & Resolutions

### Issue 1: Circular Dependency in `is_facilitator()` (RESOLVED)

**Date**: 2025-10-27
**Migration**: `00041_fix_is_facilitator_and_users_policies.sql`

**Problem**:
Migration 00021 changed `is_facilitator()` from `LANGUAGE plpgsql` to `LANGUAGE sql STABLE`:

```sql
-- BROKEN VERSION (Migration 00021)
CREATE OR REPLACE FUNCTION is_facilitator()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'facilitator'
  );
$$;
```

**Why it broke**:
- `sql STABLE` functions don't bypass RLS
- `users` table has policy: `USING (is_facilitator() OR ...)`
- Creates infinite recursion: policy → function → policy → function → ...
- Result: Profile loading timeout, complete auth failure

**Resolution**:
Restored original `LANGUAGE plpgsql SECURITY DEFINER` design:
- SECURITY DEFINER bypasses RLS on `users` table
- Breaks circular dependency
- Profile loading works instantly

**Lesson**: Never change core RLS helper functions to `sql` language. Always use `plpgsql SECURITY DEFINER`.

### Issue 2: Dropped Policies CASCADE (RESOLVED)

**Date**: 2025-10-28
**Migration**: `00042_restore_all_rls_policies.sql`

**Problem**:
`DROP FUNCTION is_facilitator() CASCADE` in migration 00041 dropped 48+ RLS policies that depended on it.

**Resolution**:
Created comprehensive restoration migration that:
1. Recreated `get_current_user_role_id()` and `is_participant_in_run()` helper functions
2. Restored all 40+ RLS policies across 16 tables
3. Verified policy counts and function definitions

**Lesson**: Never use `DROP ... CASCADE` on core helper functions. Use `CREATE OR REPLACE` instead.

### Issue 3: Search Path Injection Vulnerability (RESOLVED)

**Date**: 2025-10-28
**Migration**: `00046_fix_function_search_paths.sql`

**Problem**:
22 functions (including all 3 RLS helpers) lacked explicit `search_path` setting, making them vulnerable to search path injection attacks.

**Resolution**:
Added `SET search_path = public, pg_temp` to all 22 functions:
- Timestamp triggers (1)
- Event logging triggers (7)
- Validation functions (2)
- Calculation/stats functions (6)
- Auth/access control functions (3)
- RLS helper functions (3)

**Lesson**: All functions must explicitly set `search_path` for security hardening.

---

## Performance Considerations

### 1. Multiple Permissive Policies

**Current State**: Many tables have 2+ permissive policies (facilitator + participant)

**Impact**:
- Each permissive policy must be evaluated on every query
- Policies are OR'd together (query succeeds if ANY passes)
- Overhead: ~0.5-2ms per policy evaluation

**Optimization Strategy** (Phase 4 - Conditional):
- Profile queries first to measure actual impact
- Consider conditional policies: `CASE WHEN ... THEN ... END` pattern
- Only optimize if proven bottleneck (user choice: "Need to measure")

### 2. Index Strategy

**Critical Indexes for RLS Performance**:
```sql
-- Foreign key indexes (enable fast participant lookups)
CREATE INDEX idx_roles_run_id ON roles(run_id);
CREATE INDEX idx_roles_assigned_user_id ON roles(assigned_user_id);
CREATE INDEX idx_clans_run_id ON clans(run_id);
CREATE INDEX idx_phases_run_id ON phases(run_id);

-- Auth lookup indexes
CREATE INDEX idx_users_id_role ON users(id, role);
```

**Why These Matter**:
- `is_participant_in_run()` queries `roles` table on every participant SELECT
- Without indexes, this becomes a sequential scan → major performance hit
- With indexes, lookup is O(log n) → fast even with 10,000+ roles

### 3. SECURITY DEFINER Function Cost

**Trade-off**:
- ✅ Pro: Breaks circular dependencies, simpler policy logic
- ⚠️ Con: Each function call bypasses RLS → security-critical code path
- ⚠️ Con: Slightly higher evaluation cost vs inline SQL

**Mitigation**:
- Keep function bodies simple (single EXISTS or RETURN query)
- Avoid complex joins or aggregations inside SECURITY DEFINER functions
- Rely on PostgreSQL query planner optimization

---

## Testing Strategy

### 1. Functional RLS Testing

Test that policies correctly enforce access controls:

```typescript
// Test facilitator access
describe('RLS: Facilitators', () => {
  it('can view all simulations', async () => {
    const { data } = await supabase
      .from('sim_runs')
      .select('*');
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });

  it('can create simulations', async () => {
    const { error } = await supabase
      .from('sim_runs')
      .insert({ title: 'Test', facilitator_id: userId });
    expect(error).toBeNull();
  });
});

// Test participant access
describe('RLS: Participants', () => {
  it('can only view their own simulations', async () => {
    const { data } = await supabase
      .from('sim_runs')
      .select('*');

    // Should only return runs where user is enrolled
    data.forEach(run => {
      expect(userEnrolledInRun(run.run_id, userId)).toBe(true);
    });
  });

  it('cannot view other participants\' data', async () => {
    const { data, error } = await supabase
      .from('sim_runs')
      .select('*')
      .eq('run_id', otherUserRunId);

    expect(data).toEqual([]);
  });
});
```

### 2. Performance Testing

Measure RLS policy overhead:

```sql
-- Enable query timing
\timing on

-- Test query with RLS (as participant)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid';
SELECT * FROM clans WHERE run_id = 'test-run-uuid';

-- Compare to superuser query (bypasses RLS)
RESET ROLE;
SELECT * FROM clans WHERE run_id = 'test-run-uuid';
```

**Acceptable Overhead**: < 5ms per query for RLS evaluation

### 3. Regression Testing

After any RLS migration:

1. Test login flow (facilitator + participant)
2. Test profile loading (no timeouts)
3. Test simulation creation (facilitators)
4. Test simulation viewing (participants)
5. Test data mutations (INSERT/UPDATE/DELETE)

**Checklist**:
- [ ] Login as facilitator → Dashboard loads
- [ ] Login as participant → Participant dashboard loads
- [ ] Create simulation → No RLS errors
- [ ] View simulation as participant → Only enrolled data visible
- [ ] Browser console shows no auth errors

---

## Migration History

### Critical Migrations

| Migration | Date | Description | Status |
|-----------|------|-------------|--------|
| `00006_rls_policies.sql` | Initial | Original RLS implementation | ✅ Baseline |
| `00021_fix_is_facilitator.sql` | 2025-10-27 | **BROKE RLS** - Changed to sql STABLE | ❌ Reverted |
| `00041_fix_is_facilitator_and_users_policies.sql` | 2025-10-27 | **FIXED** - Restored plpgsql SECURITY DEFINER | ✅ Stable |
| `00042_restore_all_rls_policies.sql` | 2025-10-28 | Restored 40+ policies after CASCADE | ✅ Stable |
| `00043_fix_auth_uid_performance.sql` | 2025-10-28 | Optimized auth.uid() calls with subqueries | ✅ Performance |
| `00044_consolidate_duplicate_policies.sql` | 2025-10-28 | Removed 17 redundant policies | ✅ Performance |
| `00045_drop_duplicate_indexes.sql` | 2025-10-28 | Removed 4 duplicate indexes | ✅ Performance |
| `00046_fix_function_search_paths.sql` | 2025-10-28 | Added search_path to 22 functions | ✅ Security |

### Current State (v2.0)

**✅ All Security Issues Resolved**:
- No circular dependencies
- All functions have search_path protection
- Helper functions use SECURITY DEFINER correctly

**✅ Performance Optimized**:
- Duplicate policies removed
- Duplicate indexes removed
- auth.uid() calls optimized

**🔄 Phase 4 (Conditional)**:
- RLS policy consolidation (pending performance analysis)
- May further optimize if Phase 3 profiling shows bottlenecks

---

## Best Practices

### DO ✅

1. **Use helper functions** for role checks: `is_facilitator()`, `is_participant_in_run()`
2. **Use EXISTS subqueries** for foreign key lookups in policies
3. **Test policies** with both facilitator and participant accounts
4. **Use FOR ALL** for facilitator policies (covers SELECT/INSERT/UPDATE/DELETE)
5. **Set search_path** on all functions: `SET search_path = public, pg_temp`
6. **Use SECURITY DEFINER** for RLS helper functions to break circular dependencies

### DON'T ❌

1. **Don't inline role checks** - Use helper functions for consistency
2. **Don't use sql STABLE** for RLS helper functions - Use plpgsql SECURITY DEFINER
3. **Don't use DROP ... CASCADE** on helper functions - Use CREATE OR REPLACE
4. **Don't use JOINs in policies** - Use EXISTS subqueries instead
5. **Don't forget WITH CHECK** on INSERT/UPDATE policies for facilitators
6. **Don't skip testing** after RLS migrations - Always verify login flows

---

## Troubleshooting

### Profile Loading Timeout

**Symptom**: Login succeeds but profile loading hangs indefinitely

**Cause**: Circular dependency in RLS policies

**Fix**: Check `is_facilitator()` function:
```sql
-- Should be plpgsql SECURITY DEFINER
SELECT proname, lanname, prosecdef
FROM pg_proc p
JOIN pg_language l ON p.prolang = l.oid
WHERE proname = 'is_facilitator';

-- Expected result:
-- proname         | lanname | prosecdef
-- is_facilitator  | plpgsql | true
```

### "Policy Not Found" Errors

**Symptom**: Queries fail with "no policy found" or "permission denied"

**Cause**: Policies dropped by CASCADE

**Fix**: Restore policies from migration `00042_restore_all_rls_policies.sql`

### Slow Queries with RLS

**Symptom**: Queries 10x slower with RLS enabled

**Cause**: Missing indexes on foreign key columns

**Fix**: Add indexes for RLS lookup patterns:
```sql
CREATE INDEX idx_table_run_id ON table_name(run_id);
CREATE INDEX idx_roles_assigned_user_id ON roles(assigned_user_id);
```

---

## Future Considerations

### Phase 2: Comprehensive Testing (Next)
- Build RLS policy test suite (Vitest + Supabase client)
- Test all CRUD operations for facilitators and participants
- Verify isolation between simulations

### Phase 3: Performance Analysis (After Testing)
- Profile query performance with RLS enabled
- Measure policy evaluation overhead
- Generate data-driven optimization recommendations

### Phase 4: RLS Optimization (Conditional)
- Only proceed if Phase 3 shows real bottlenecks
- Consider policy consolidation strategies
- Implement conditional policies if needed

---

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Definer Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

---

**Document Maintainers**: Update this document when:
- Adding new RLS policies
- Modifying helper functions
- Resolving RLS-related bugs
- Completing performance optimization work

**Last Major Update**: 2025-10-28 (Post-security hardening, v2.0)
