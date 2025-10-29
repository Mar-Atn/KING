# BROWSER PERFORMANCE TEST

## How to Run the Test

Since I cannot authenticate programmatically, please run this test in your browser:

### Step 1: Open Browser Console
1. Open http://localhost:5173 in your browser
2. Press F12 (or Cmd+Option+I on Mac) to open DevTools
3. Go to the "Console" tab

### Step 2: Test Participant Load

**Copy and paste this code into the console:**

```javascript
// Participant Dashboard Load Test
(async () => {
  console.clear()
  console.log('═'.repeat(70))
  console.log('PARTICIPANT DASHBOARD PERFORMANCE TEST')
  console.log('═'.repeat(70))

  const totalStart = Date.now()

  // Get current URL to extract runId
  const runId = window.location.pathname.split('/').pop()
  const user = JSON.parse(localStorage.getItem('sb-esplzaunxkehuankkwbx-auth-token') || '{}')?.user

  if (!user) {
    console.error('❌ Not logged in!')
    return
  }

  console.log(`User ID: ${user.id}`)
  console.log(`Run ID: ${runId}`)
  console.log('')

  // Test 1: getRoleForUser (NO JOIN - optimized)
  console.log('📍 Step 1: getRoleForUser (NO JOIN)...')
  const roleStart = Date.now()
  const roleResponse = await fetch(
    `https://esplzaunxkehuankkwbx.supabase.co/rest/v1/roles?run_id=eq.${runId}&assigned_user_id=eq.${user.id}&select=*`,
    {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDE3ODUsImV4cCI6MjA3NjkxNzc4NX0.rEA1N5AaW1PE47KvKJzRXf7uPXC6lvTw6Qa-YqsO0pE',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('sb-esplzaunxkehuankkwbx-auth-token') || '{}').access_token}`
      }
    }
  )
  const roleDuration = Date.now() - roleStart
  console.log(`✅ Step 1 complete: ${roleDuration}ms`)

  // Test 2: Parallel queries
  console.log('')
  console.log('📍 Step 2: Parallel queries (sim, clans, roles, phases)...')
  const parallelStart = Date.now()

  const baseUrl = 'https://esplzaunxkehuankkwbx.supabase.co/rest/v1'
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDE3ODUsImV4cCI6MjA3NjkxNzc4NX0.rEA1N5AaW1PE47KvKJzRXf7uPXC6lvTw6Qa-YqsO0pE',
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('sb-esplzaunxkehuankkwbx-auth-token') || '{}').access_token}`
  }

  const [simRes, clansRes, rolesRes, phasesRes] = await Promise.all([
    fetch(`${baseUrl}/sim_runs?run_id=eq.${runId}&select=*`, { headers }),
    fetch(`${baseUrl}/clans?run_id=eq.${runId}&select=*&order=sequence_number`, { headers }),
    fetch(`${baseUrl}/roles?run_id=eq.${runId}&select=*`, { headers }),
    fetch(`${baseUrl}/phases?run_id=eq.${runId}&select=*&order=sequence_number`, { headers })
  ])

  const parallelDuration = Date.now() - parallelStart
  console.log(`✅ Step 2 complete: ${parallelDuration}ms`)

  const [simData, clansData, rolesData, phasesData] = await Promise.all([
    simRes.json(),
    clansRes.json(),
    rolesRes.json(),
    phasesRes.json()
  ])

  const totalDuration = Date.now() - totalStart

  console.log('')
  console.log('═'.repeat(70))
  console.log('RESULTS:')
  console.log('═'.repeat(70))
  console.log(`Step 1 (getRoleForUser):    ${roleDuration}ms`)
  console.log(`Step 2 (parallel queries):  ${parallelDuration}ms`)
  console.log(`Total load time:            ${totalDuration}ms`)
  console.log('')
  console.log(`Data loaded:`)
  console.log(`  - Simulation: ${simData.length} row`)
  console.log(`  - Clans: ${clansData.length} rows`)
  console.log(`  - Roles: ${rolesData.length} rows`)
  console.log(`  - Phases: ${phasesData.length} rows`)
  console.log('═'.repeat(70))

  if (totalDuration < 1000) {
    console.log('✅ EXCELLENT: < 1 second')
  } else if (totalDuration < 2000) {
    console.log('✅ GOOD: < 2 seconds')
  } else if (totalDuration < 5000) {
    console.log('⚠️  ACCEPTABLE: 2-5 seconds')
  } else {
    console.log('❌ SLOW: > 5 seconds')
  }
})()
```

### Step 3: Report Results

After running the test, please share:
1. The total load time
2. Step 1 duration (getRoleForUser)
3. Step 2 duration (parallel queries)

---

## Alternative: Check Existing Logs

The timing logs are already built into the code. Just:
1. **Hard refresh** the page (Cmd+Shift+R)
2. **Log in as participant**
3. **Load a simulation**
4. **Check console** for logs starting with:
   - `⏱️ [ParticipantDashboard] Starting data load...`
   - `✅ TOTAL LOAD TIME: XXXms`

---

## What I Found So Far

**Database Performance:** ✅ EXCELLENT (150-400ms per query)
**Bottleneck Removed:** ❌ JOIN in getRoleForUser (was causing 5-15s delays)
**Optimizations Applied:**
- ✅ Removed expensive clan JOIN from getRoleForUser
- ✅ Parallelized all dashboard queries
- ✅ Fixed N+1 problem in Dashboard
- ✅ Added comprehensive timing logs

**Expected Result:** 500ms - 2s total load time

Please test and report the console output!
