import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TestResult {
  test: string
  duration: number
  success: boolean
  error?: string
}

const results: TestResult[] = []

async function measureQuery(testName: string, queryFn: () => Promise<any>) {
  const start = Date.now()
  try {
    await queryFn()
    const duration = Date.now() - start
    results.push({ test: testName, duration, success: true })
    return duration
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({ test: testName, duration, success: false, error: error.message })
    return duration
  }
}

async function runDiagnostics() {
  console.log('\n🔬 PERFORMANCE DIAGNOSTICS - BASELINE MEASUREMENT')
  console.log('=' .repeat(70))
  console.log('')

  // Check if we have a valid session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log('❌ No active session - please log in through the app first')
    console.log('   Run the app, log in, then run this script again')
    return
  }

  const userId = session.user.id
  console.log(`✅ Authenticated as: ${session.user.email}`)
  console.log(`   User ID: ${userId}`)
  console.log('')

  // Test 1: Fetch user profile (the circular dependency suspect)
  console.log('📊 Test 1: Fetch User Profile (CRITICAL TEST)')
  console.log('   This tests the circular RLS dependency on users table...')
  const profileTime = await measureQuery('User Profile Query', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  })
  console.log(`   ⏱️  Duration: ${profileTime}ms`)
  console.log(`   ${profileTime > 1000 ? '❌ SLOW (>1s)' : profileTime > 500 ? '⚠️  MODERATE' : '✅ FAST'}`)
  console.log('')

  // Test 2: Fetch all users (tests RLS with multiple rows)
  console.log('📊 Test 2: Fetch All Users')
  console.log('   Tests RLS policy evaluation across multiple rows...')
  const allUsersTime = await measureQuery('All Users Query', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(10)

    if (error) throw error
    return data
  })
  console.log(`   ⏱️  Duration: ${allUsersTime}ms`)
  console.log(`   ${allUsersTime > 1000 ? '❌ SLOW (>1s)' : allUsersTime > 500 ? '⚠️  MODERATE' : '✅ FAST'}`)
  console.log('')

  // Test 3: Fetch sim_runs (tests the subquery suspect)
  console.log('📊 Test 3: Fetch Sim Runs')
  console.log('   Tests the subquery in sim_runs RLS policy...')
  const simRunsTime = await measureQuery('Sim Runs Query', async () => {
    const { data, error } = await supabase
      .from('sim_runs')
      .select('*')
      .limit(5)

    if (error) throw error
    return data
  })
  console.log(`   ⏱️  Duration: ${simRunsTime}ms`)
  console.log(`   ${simRunsTime > 1000 ? '❌ SLOW (>1s)' : simRunsTime > 500 ? '⚠️  MODERATE' : '✅ FAST'}`)
  console.log('')

  // Test 4: Fetch a single sim_run with all relations (realistic query)
  console.log('📊 Test 4: Fetch Single Simulation (Realistic Query)')
  console.log('   Tests what happens when loading a simulation...')

  // First, get a sim_run ID
  const { data: simRuns } = await supabase
    .from('sim_runs')
    .select('run_id')
    .limit(1)

  if (simRuns && simRuns.length > 0) {
    const runId = simRuns[0].run_id

    const fullSimTime = await measureQuery('Full Simulation Query', async () => {
      const { data, error } = await supabase
        .from('sim_runs')
        .select('*')
        .eq('run_id', runId)
        .single()

      if (error) throw error
      return data
    })
    console.log(`   ⏱️  Duration: ${fullSimTime}ms`)
    console.log(`   ${fullSimTime > 1000 ? '❌ SLOW (>1s)' : fullSimTime > 500 ? '⚠️  MODERATE' : '✅ FAST'}`)
  } else {
    console.log('   ⚠️  No simulations found to test')
  }
  console.log('')

  // Test 5: Call is_facilitator() function directly
  console.log('📊 Test 5: is_facilitator() Function')
  console.log('   Tests the helper function performance...')
  const isFacilitatorTime = await measureQuery('is_facilitator() RPC', async () => {
    const { data, error } = await supabase.rpc('is_facilitator')
    if (error) throw error
    return data
  })
  console.log(`   ⏱️  Duration: ${isFacilitatorTime}ms`)
  console.log(`   Result: ${results[results.length - 1].success}`)
  console.log(`   ${isFacilitatorTime > 100 ? '⚠️  SLOW for a function call' : '✅ FAST'}`)
  console.log('')

  // Summary
  console.log('=' .repeat(70))
  console.log('📈 SUMMARY OF RESULTS')
  console.log('=' .repeat(70))
  console.log('')

  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const slowTests = results.filter(r => r.duration > 1000)
  const moderateTests = results.filter(r => r.duration > 500 && r.duration <= 1000)

  console.log(`Total tests: ${results.length}`)
  console.log(`Average duration: ${avgTime.toFixed(0)}ms`)
  console.log(`Slow tests (>1s): ${slowTests.length}`)
  console.log(`Moderate tests (500ms-1s): ${moderateTests.length}`)
  console.log('')

  if (slowTests.length > 0) {
    console.log('🔴 SLOW TESTS (>1 second):')
    slowTests.forEach(t => {
      console.log(`   • ${t.test}: ${t.duration}ms ${!t.success ? '(FAILED)' : ''}`)
    })
    console.log('')
  }

  if (moderateTests.length > 0) {
    console.log('🟡 MODERATE TESTS (500ms-1s):')
    moderateTests.forEach(t => {
      console.log(`   • ${t.test}: ${t.duration}ms`)
    })
    console.log('')
  }

  // Diagnosis
  console.log('=' .repeat(70))
  console.log('🔍 DIAGNOSIS')
  console.log('=' .repeat(70))
  console.log('')

  if (profileTime > 1000) {
    console.log('❌ CONFIRMED: User profile fetch is SLOW (>1s)')
    console.log('   This confirms circular RLS dependency on users table')
    console.log('   Root cause: is_facilitator() policy queries users table')
    console.log('   Fix: Remove function call from users SELECT policy')
    console.log('')
  }

  if (simRunsTime > 1000) {
    console.log('❌ CONFIRMED: sim_runs queries are SLOW (>1s)')
    console.log('   Root cause: Subquery to users table in RLS policy')
    console.log('   Fix: Remove subquery from sim_runs policy')
    console.log('')
  }

  if (isFacilitatorTime > 100) {
    console.log('⚠️  WARNING: is_facilitator() function is slower than expected')
    console.log('   Expected: <50ms, Actual: ' + isFacilitatorTime + 'ms')
    console.log('   This may indicate RLS overhead even with SECURITY DEFINER')
    console.log('')
  }

  console.log('💡 RECOMMENDED ACTIONS:')
  if (slowTests.length > 0 || moderateTests.length > 0) {
    console.log('   1. Apply migration 00058: Remove circular dependency on users')
    console.log('   2. Apply migration 00059: Remove subquery from sim_runs')
    console.log('   3. Re-run this script to verify improvements')
  } else {
    console.log('   ✅ Performance looks good! No immediate action needed.')
  }
  console.log('')

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `performance_baseline_${timestamp}.json`

  console.log(`📝 Results saved to: ${filename}`)
  console.log('')
}

runDiagnostics().catch(console.error)
