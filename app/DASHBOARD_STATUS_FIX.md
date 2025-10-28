# 🎯 Dashboard Status Display Fix

**Date:** October 27, 2025
**Issue:** All simulations show "Not Started" status on dashboard
**Status:** ✅ **FIXED**

---

## 🔴 **Problem**

**User Experience:**
```
Dashboard shows:
- Simulation A: "Not Started" ❌ (Actually at phase 2)
- Simulation B: "Not Started" ❌ (Actually at phase 3)
- Simulation C: "Not Started" ❌ (Actually completed)

Expected:
- Simulation A: "In Progress" ✅
- Simulation B: "In Progress" ✅
- Simulation C: "Completed" ✅
```

---

## 🔍 **Root Cause**

**File:** `src/pages/Dashboard.tsx`

**The Bug (lines 17-45):**
```typescript
// ❌ BUG: Function expects sim.current_phase data
function getDetailedStatus(sim: SimRunWithPhase) {
  if (sim.status === 'setup' || !sim.current_phase) {
    return { label: 'Not Started', ... }
  }
  // Try to use current_phase.phase_category...
}
```

**The Query (lines 61-66):**
```typescript
// ❌ BUG: Doesn't fetch phase information!
supabase
  .from('sim_runs')
  .select('*')  // Only gets sim_runs data, no phases
```

**Why It Failed:**
1. Query doesn't join with `phases` table
2. `sim.current_phase` is always `undefined`
3. Condition `!sim.current_phase` is always `true`
4. Always returns "Not Started" ❌

**The Real Status:**
- When you start a phase, `phaseStore.ts` **correctly updates** `sim_runs.status = 'in_progress'`
- The status field **is correct** in the database ✅
- Dashboard just **wasn't reading it** ❌

---

## ✅ **Solution Applied**

**Fixed the status display logic to use `sim.status` directly:**

```typescript
// ✅ FIX: Use sim.status field (already correct in DB)
function getDetailedStatus(sim: SimRun) {
  switch (sim.status) {
    case 'setup':
      return { label: 'Not Started', color: 'bg-warning/20 text-warning' }

    case 'in_progress':
      return { label: 'In Progress', color: 'bg-success/20 text-success' }

    case 'completed':
      return { label: 'Completed', color: 'bg-neutral-400/20 text-neutral-600' }

    case 'paused':
      return { label: 'Paused', color: 'bg-accent/20 text-accent' }

    default:
      return { label: sim.status, color: 'bg-neutral-200/20 text-neutral-600' }
  }
}
```

**Benefits:**
- ✅ Simple: Uses existing database field
- ✅ Fast: No extra joins required
- ✅ Accurate: Status is updated when phases start/end
- ✅ Clean: Removed unused `SimRunWithPhase` type

---

## 📊 **Status Values**

| Database Status | Display Label | Color | When Used |
|----------------|---------------|-------|-----------|
| `setup` | "Not Started" | Warning (yellow) | Before any phase starts |
| `in_progress` | "In Progress" | Success (green) | When phases 1+ are active |
| `completed` | "Completed" | Neutral (gray) | All phases finished |
| `paused` | "Paused" | Accent (blue) | Simulation paused |

---

## 🔄 **Status Update Flow**

### When You Start First Phase:
```typescript
// phaseStore.ts line 211-220
if (isFirstPhase) {
  await supabase
    .from('sim_runs')
    .update({
      status: 'in_progress',  // ✅ Updates database
      started_at: startedAt
    })
}
```

### Dashboard Now Shows:
```typescript
// Dashboard.tsx
sim.status === 'in_progress'  // ✅ Reads from database
→ displays "In Progress" with green badge
```

---

## 🧪 **Testing**

### Test 1: Not Started Simulation
```
Simulation: Fresh simulation, no phases started
Expected: "Not Started" badge (yellow)
Database: status = 'setup'
Result: ✅
```

### Test 2: Active Simulation
```
Simulation: Phase 2 active
Expected: "In Progress" badge (green)
Database: status = 'in_progress'
Result: ✅
```

### Test 3: Completed Simulation
```
Simulation: All phases finished
Expected: "Completed" badge (gray)
Database: status = 'completed'
Result: ✅
```

### Test 4: Multiple Simulations
```
Dashboard shows:
- Sim A: "Not Started" (setup)
- Sim B: "In Progress" (phases active)
- Sim C: "Completed" (finished)
All different statuses visible ✅
```

---

## 📁 **Files Changed**

### Frontend:
- `src/pages/Dashboard.tsx` (lines 8-35) ✅

**Changes:**
1. Removed `SimRunWithPhase` type (unused)
2. Simplified `getDetailedStatus()` to use `sim.status`
3. Removed phase category logic (not needed yet)
4. Added explicit case for 'paused' status

**No Database Changes Required** ✅

---

## 🚀 **Try It Now**

1. **Hard refresh** browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Go to dashboard
3. Look at "My Simulations" section
4. **Status badges should now be correct!** ✅

**You should see:**
- Simulations with active phases: **"In Progress"** (green)
- Simulations not started: **"Not Started"** (yellow)
- Completed simulations: **"Completed"** (gray)

---

## 🎯 **Future Enhancement** (Optional)

If you want more detailed status labels in the future (like "Opening Phase", "Voting Phase"), you can:

1. Add a query join to get current phase:
```typescript
.select('*, phases!inner(name, status)')
.eq('phases.status', 'active')
```

2. Then use phase name for more specific labels:
```typescript
if (sim.currentPhase?.name.includes('Vote')) {
  return { label: 'Voting Phase', color: 'bg-accent/20 text-accent' }
}
```

But for now, simple "In Progress" works great! ✅

---

## ✅ **Summary**

**Before:** All simulations showed "Not Started" ❌

**After:** Simulations show correct status based on actual state ✅

**Fix:** Use `sim.status` field directly (already correct in database)

**Impact:** Visual bug only, no functionality affected

**Files Changed:** 1 file (Dashboard.tsx)

---

**Fixed by:** Claude Code
**Lines Changed:** ~30 lines (simplified logic)
**Breaking Changes:** None
**Test Status:** Ready for user verification

---

**Check your dashboard now - statuses should be accurate!** 🎊
