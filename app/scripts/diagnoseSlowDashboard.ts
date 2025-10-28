import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface QueryResult {
  name: string
  duration: number
  success: boolean
  error?: string
  rowCount?: number
}

const results: QueryResult[] = []

async function measureQuery(name: string, queryFn: () => Promise<any>): Promise<QueryResult> {
  console.log(`\n⏱️  Running: ${name}...`)
  const start = Date.now()
  try {
    const result = await queryFn()
    const duration = Date.now() - start
    const rowCount = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0
    console.log(`   ✅ ${duration}ms (${rowCount} rows)`)

    const queryResult = { name, duration, success: true, rowCount }
    results.push(queryResult)
    return queryResult
  } catch (error: any) {
    const duration = Date.now() - start
    console.log(`   ❌ ${duration}ms - ${error.message}`)

    const queryResult = { name, duration, success: false, error: error.message }
    results.push(queryResult)
    return queryResult
  }
}

async function diagnoseDashboard() {
  console.log('\n' + '='.repeat(80))
  console.log('🔬 DASHBOARD LOAD DIAGNOSTIC')
  console.log('='.repeat(80))
  console.log('')

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log('❌ No active session - please log in first')
    return
  }

  console.log(`✅ Authenticated as: ${session.user.email}`)
  console.log(`   User ID: ${session.user.id}`)
  console.log('')

  const userId = session.user.id

  // Get user profile first
  console.log('📊 STEP 1: Load User Profile')
  console.log('-'.repeat(80))
  const profileResult = await measureQuery('User Profile', async () => {
    return await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  })

  if (!profileResult.success) {
    console.log('\n❌ CRITICAL: Cannot load user profile - dashboard cannot load')
    return
  }

  // Get all sim_runs for the user
  console.log('\n📊 STEP 2: Load Simulation Runs')
  console.log('-'.repeat(80))
  const simRunsResult = await measureQuery('All sim_runs', async () => {
    return await supabase
      .from('sim_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  })

  if (!simRunsResult.success || !results[1].rowCount || results[1].rowCount === 0) {
    console.log('\n⚠️  No simulations found - creating test query for existing sim')
    return
  }

  // Get first sim_run ID
  const { data: simRuns } = await supabase
    .from('sim_runs')
    .select('run_id')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!simRuns || simRuns.length === 0) {
    console.log('\n⚠️  No simulations to test with')
    return
  }

  const runId = simRuns[0].run_id
  console.log(`\nUsing simulation: ${runId}`)

  // Now simulate what dashboard loads
  console.log('\n📊 STEP 3: Load Complete Simulation (What Dashboard Does)')
  console.log('-'.repeat(80))

  await measureQuery('Single sim_run', async () => {
    return await supabase
      .from('sim_runs')
      .select('*')
      .eq('run_id', runId)
      .single()
  })

  await measureQuery('Clans for simulation', async () => {
    return await supabase
      .from('clans')
      .select('*')
      .eq('run_id', runId)
  })

  await measureQuery('Roles for simulation', async () => {
    return await supabase
      .from('roles')
      .select('*')
      .eq('run_id', runId)
  })

  await measureQuery('Phases for simulation', async () => {
    return await supabase
      .from('phases')
      .select('*')
      .eq('run_id', runId)
      .order('sequence_number')
  })

  await measureQuery('Current phase from sim_runs', async () => {
    return await supabase
      .from('sim_runs')
      .select('current_phase_id')
      .eq('run_id', runId)
      .single()
  })

  // Additional queries that might be slow
  console.log('\n📊 STEP 4: Other Common Queries')
  console.log('-'.repeat(80))

  await measureQuery('All users (10)', async () => {
    return await supabase
      .from('users')
      .select('id, email, role, display_name')
      .limit(10)
  })

  await measureQuery('Meetings for simulation', async () => {
    return await supabase
      .from('meetings')
      .select('*')
      .eq('run_id', runId)
  })

  await measureQuery('Vote sessions for simulation', async () => {
    return await supabase
      .from('vote_sessions')
      .select('*')
      .eq('run_id', runId)
  })

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📈 DIAGNOSTIC SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  const totalTime = results.reduce((sum, r) => sum + r.duration, 0)
  const avgTime = totalTime / results.length
  const slowQueries = results.filter(r => r.duration > 1000)
  const moderateQueries = results.filter(r => r.duration > 500 && r.duration <= 1000)
  const fastQueries = results.filter(r => r.duration <= 500)

  console.log(`Total queries: ${results.length}`)
  console.log(`Total time: ${totalTime}ms`)
  console.log(`Average per query: ${avgTime.toFixed(0)}ms`)
  console.log('')
  console.log(`Fast queries (<500ms): ${fastQueries.length}`)
  console.log(`Moderate queries (500-1000ms): ${moderateQueries.length}`)
  console.log(`Slow queries (>1000ms): ${slowQueries.length}`)
  console.log('')

  if (slowQueries.length > 0) {
    console.log('🔴 SLOW QUERIES (>1 second):')
    slowQueries.forEach(q => {
      console.log(`   • ${q.name}: ${q.duration}ms`)
    })
    console.log('')
  }

  if (moderateQueries.length > 0) {
    console.log('🟡 MODERATE QUERIES (500ms-1s):')
    moderateQueries.forEach(q => {
      console.log(`   • ${q.name}: ${q.duration}ms`)
    })
    console.log('')
  }

  // Diagnosis
  console.log('='.repeat(80))
  console.log('🔍 DIAGNOSIS')
  console.log('='.repeat(80))
  console.log('')

  if (slowQueries.length > 0) {
    console.log('❌ BOTTLENECK IDENTIFIED:')
    const slowestQuery = slowQueries.reduce((prev, curr) =>
      curr.duration > prev.duration ? curr : prev
    )
    console.log(`   The slowest query is: "${slowestQuery.name}"`)
    console.log(`   Duration: ${slowestQuery.duration}ms`)
    console.log('')

    if (slowestQuery.name.includes('Profile') || slowestQuery.name.includes('users')) {
      console.log('   Root cause: Users table query is slow')
      console.log('   This suggests RLS policies on users table are still problematic')
    } else if (slowestQuery.name.includes('sim_run')) {
      console.log('   Root cause: sim_runs table query is slow')
      console.log('   This suggests RLS policies on sim_runs table are still problematic')
    } else if (slowestQuery.name.includes('Roles') || slowestQuery.name.includes('Clans')) {
      console.log('   Root cause: Related tables are slow')
      console.log('   This suggests foreign key joins or RLS on related tables')
    }
  } else if (moderateQueries.length > 3) {
    console.log('⚠️  MULTIPLE MODERATE QUERIES:')
    console.log('   The issue is not a single slow query but cumulative overhead')
    console.log('   Total time for all queries adds up to >1 second')
    console.log('')
    console.log('   Possible causes:')
    console.log('   • Network latency (check database region)')
    console.log('   • RLS overhead across multiple tables')
    console.log('   • Too many sequential queries (should batch)')
  } else {
    console.log('✅ All individual queries are fast!')
    console.log('')
    console.log('   If dashboard still feels slow, the issue is likely:')
    console.log('   • Frontend making too many sequential queries')
    console.log('   • Frontend rendering performance')
    console.log('   • Network latency (database geographic location)')
  }

  console.log('')
  console.log('💡 NEXT STEPS:')
  if (slowQueries.length > 0) {
    console.log('   1. Check Performance Advisor for remaining warnings')
    console.log('   2. Enable query logging in Supabase to see actual SQL')
    console.log('   3. Run EXPLAIN ANALYZE on the slow query')
  } else if (totalTime > 5000) {
    console.log('   1. Consider batching queries into fewer requests')
    console.log('   2. Add caching on frontend for repeated queries')
    console.log('   3. Check if database is in same region as users')
  } else {
    console.log('   1. Queries are fast - check frontend rendering performance')
    console.log('   2. Use browser DevTools to profile where time is spent')
  }
  console.log('')
}

diagnoseDashboard().catch(console.error)
