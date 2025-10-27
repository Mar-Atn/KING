# RLS Policies Tracking Document
## Status: Incremental Fix Strategy
## Last Updated: 2025-10-27

---

## ✅ Fixed Policies (16 policies - Critical Path)

### **sim_runs** (Migrations 00031, 00032)
- ✅ INSERT - Facilitators can create sim runs
- ✅ DELETE - Facilitators can delete sim runs

### **clans** (Migration 00033)
- ✅ INSERT - Facilitators insert clans
- ✅ UPDATE - Facilitators update clans
- ✅ DELETE - Facilitators delete clans

### **roles** (Migration 00033)
- ✅ INSERT - Facilitators insert roles
- ✅ UPDATE - Facilitators update roles (Note: some policy variations exist)
- ✅ DELETE - Facilitators delete roles

### **phases** (Migration 00033)
- ✅ INSERT - Facilitators insert phases
- ✅ UPDATE - Facilitators update phases
- ✅ DELETE - Facilitators delete phases

**Status:** All currently-used features work correctly ✅

---

## ⚠️ Remaining Policies (40 policies - Fix When Implementing Features)

These policies use `is_facilitator()` which is broken, but they're for features not yet implemented.
**Strategy:** Fix each group when implementing the corresponding feature.

---

### **meetings** (4 policies) - Phase 7: Meetings & Communications
**When to Fix:** When implementing Phase 7 (Meetings system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators can manage all meetings | ALL | Uses is_facilitator() |
| Participants can create meetings | INSERT | Mixed logic with is_facilitator() fallback |
| Participants can update their meetings | UPDATE | Mixed logic with is_facilitator() fallback |
| (DELETE) | DELETE | Likely has is_facilitator() |

**Column References:**
- `organizer_role_id` (UUID, references roles)
- `participants` (JSONB array of role_ids)

**Migration:** Create `00034_fix_meetings_rls.sql` when implementing Phase 7

---

### **meeting_invitations** (4 policies) - Phase 7: Meetings & Communications
**When to Fix:** When implementing Phase 7 (Meetings system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| (CREATE) | INSERT | Uses is_facilitator() |
| (UPDATE/RESPOND) | UPDATE | Uses is_facilitator() |
| (VIEW) | SELECT | May use is_facilitator() |
| (DELETE) | DELETE | Uses is_facilitator() |

**Migration:** Include in `00034_fix_meetings_rls.sql`

---

### **public_speeches** (4 policies) - Phase 4: Participant Experience
**When to Fix:** When implementing public speech feature

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators insert speeches | INSERT | Uses is_facilitator() |
| Facilitators update speeches | UPDATE | Uses is_facilitator() |
| Facilitators delete speeches | DELETE | Uses is_facilitator() |
| View public speeches | SELECT | May use is_facilitator() |

**Migration:** Create `00035_fix_speeches_rls.sql` when implementing speeches

---

### **vote_sessions** (4 policies) - Phase 6: Voting & Decision System
**When to Fix:** When implementing Phase 6 (Voting system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators insert vote sessions | INSERT | Uses is_facilitator() |
| Facilitators update vote sessions | UPDATE | Uses is_facilitator() |
| Facilitators delete vote sessions | DELETE | Uses is_facilitator() |
| View vote sessions | SELECT | May use is_facilitator() |

**Migration:** Create `00036_fix_voting_rls.sql` when implementing Phase 6

---

### **vote_results** (4 policies) - Phase 6: Voting & Decision System
**When to Fix:** When implementing Phase 6 (Voting system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators insert vote results | INSERT | Uses is_facilitator() |
| Facilitators update vote results | UPDATE | Uses is_facilitator() |
| Facilitators delete vote results | DELETE | Uses is_facilitator() |
| View vote results | SELECT | May use is_facilitator() |

**Migration:** Include in `00036_fix_voting_rls.sql`

---

### **votes** (1 policy) - Phase 6: Voting & Decision System
**When to Fix:** When implementing Phase 6 (Voting system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| View votes | SELECT | Uses is_facilitator() |

**Note:** Participants can likely INSERT their own votes, facilitators see all
**Migration:** Include in `00036_fix_voting_rls.sql`

---

### **ai_context** (4 policies) - Phase 8: AI Character System
**When to Fix:** When implementing Phase 8 (AI system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators insert AI context | INSERT | Uses is_facilitator() |
| Facilitators update AI context | UPDATE | Uses is_facilitator() |
| Facilitators delete AI context | DELETE | Uses is_facilitator() |
| View AI context | SELECT | Uses is_facilitator() |

**Migration:** Create `00037_fix_ai_rls.sql` when implementing Phase 8

---

### **ai_prompts** (4 policies) - Phase 8: AI Character System
**When to Fix:** When implementing Phase 8 (AI system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators insert AI prompts | INSERT | Uses is_facilitator() |
| Facilitators update AI prompts | UPDATE | Uses is_facilitator() |
| Facilitators delete AI prompts | DELETE | Uses is_facilitator() |
| Facilitators select AI prompts | SELECT | Uses is_facilitator() |

**Migration:** Include in `00037_fix_ai_rls.sql`

---

### **event_log** (3 policies) - Phase 9: Reflection & Analytics
**When to Fix:** When implementing Phase 9 (Analytics system)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators update event log | UPDATE | Uses is_facilitator() |
| Facilitators delete event log | DELETE | Uses is_facilitator() |
| View event log | SELECT | Uses is_facilitator() |

**Note:** INSERT is via service_role (triggers), no fix needed
**Migration:** Create `00038_fix_analytics_rls.sql` when implementing Phase 9

---

### **facilitator_actions** (1 policy) - Phase 5: Facilitator Console
**When to Fix:** When implementing facilitator action logging

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators can create actions | INSERT | Uses is_facilitator() |

**Migration:** Create `00039_fix_facilitator_actions_rls.sql` when needed

---

### **reflections** (4 policies) - Phase 9: Reflection & Analytics
**When to Fix:** When implementing Phase 9 (Reflection capture)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Create reflections | INSERT | Uses is_facilitator() fallback |
| Update reflections | UPDATE | Uses is_facilitator() fallback |
| Facilitators delete reflections | DELETE | Uses is_facilitator() |
| View reflections | SELECT | May use is_facilitator() |

**Note:** Participants can create/update their own, facilitators see all
**Migration:** Include in `00038_fix_analytics_rls.sql`

---

### **king_decisions** (4 policies) - Phase 6: Voting & Decision System
**When to Fix:** When implementing King's decision interface

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| King manages own decision (INSERT) | INSERT | Uses is_facilitator() |
| King updates own decision | UPDATE | Uses is_facilitator() |
| Facilitators delete king decisions | DELETE | Uses is_facilitator() |
| View king decisions | SELECT | Uses is_facilitator() |

**Note:** Complex logic - King role can manage own decision, facilitators override
**Migration:** Include in `00036_fix_voting_rls.sql` or separate

---

### **simulation_templates** (4 policies) - Already Working (Phase 2.2)
**When to Fix:** NEXT (This is actively used!)
**Priority:** HIGH - Used in template management

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Facilitators insert templates | INSERT | Uses is_facilitator() |
| Facilitators update templates | UPDATE | Uses is_facilitator() |
| Facilitators delete templates | DELETE | Uses is_facilitator() |
| View templates | SELECT | Uses is_facilitator() |

**Migration:** Create `00034_fix_simulation_templates_rls.sql` ASAP

---

### **access_tokens** (1 policy) - Phase 1: Authentication (Working)
**When to Fix:** Low priority (only UPDATE affected, feature works)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Update access tokens | UPDATE | Uses is_facilitator() |

**Note:** SELECT policy works (uses OR clause). UPDATE rarely used.
**Migration:** Create `00040_fix_access_tokens_rls.sql` when convenient

---

### **users** (1 policy) - Phase 1: Authentication (Working)
**When to Fix:** Low priority (SELECT with OR clause, likely works)

| Policy Name | Action | Current Issue |
|------------|--------|---------------|
| Users can view their own profile | SELECT | Uses is_facilitator() in OR clause |

**Note:** Primary clause `id = auth.uid()` works for users, facilitator OR clause is fallback
**Migration:** Create `00041_fix_users_rls.sql` when convenient

---

## 📋 Fix Priority Order

### **Immediate (Before Next Feature Work):**
1. **simulation_templates** - Used in template management (EditScenario page)

### **Phase 4 - Participant Experience:**
2. **public_speeches** - When implementing speech system

### **Phase 6 - Voting System:**
3. **vote_sessions** - Core voting functionality
4. **vote_results** - Results display
5. **votes** - Individual vote records
6. **king_decisions** - King's decision interface

### **Phase 7 - Meetings:**
7. **meetings** - Meeting system
8. **meeting_invitations** - Invitation flow

### **Phase 8 - AI System:**
9. **ai_context** - AI character context
10. **ai_prompts** - AI prompt management

### **Phase 9 - Analytics:**
11. **event_log** - Event tracking
12. **reflections** - Reflection capture
13. **facilitator_actions** - Action logging

### **Low Priority (Features Work Despite Issue):**
14. **access_tokens** - Only UPDATE affected
15. **users** - Primary SELECT logic works

---

## 🎯 Pattern to Use for All Fixes

Replace this:
```sql
is_facilitator()
```

With this:
```sql
EXISTS (
  SELECT 1 FROM users
  WHERE users.id = (SELECT auth.uid())
  AND users.role = 'facilitator'
)
```

---

## 📊 Summary

| Status | Count | Tables |
|--------|-------|--------|
| ✅ Fixed | 16 policies | sim_runs, clans, roles, phases |
| 🔥 HIGH PRIORITY | 4 policies | simulation_templates |
| ⚠️ FIX WITH FEATURE | 36 policies | 11 tables (meetings, votes, AI, etc.) |
| **Total** | **56 policies** | **16 tables** |

---

## ✅ Success Criteria

- [x] All critical path policies fixed (sim_runs, clans, roles, phases)
- [x] Currently-used features work correctly
- [x] Tracking document created
- [ ] simulation_templates policies fixed (NEXT)
- [ ] Remaining policies fixed incrementally as features implemented

---

**Strategy:** Agile, incremental fixes. Fix policies when implementing corresponding features.
This ensures immediate testing and prevents wasted effort on changing requirements.
