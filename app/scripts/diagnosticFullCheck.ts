/**
 * COMPREHENSIVE DIAGNOSTIC: Triggers, JSON, Performance
 *
 * This script will:
 * 1. Check if triggers are actually disabled
 * 2. Find corrupted JSON in sim_runs
 * 3. Measure query times for each critical table
 * 4. Identify the actual bottleneck
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface QueryResult {
  test: string
  duration: number
  success: boolean
  error?: string
  data?: any
}

const results: QueryResult[] = []

async function measureQuery(testName: string, queryFn: () => Promise<any>) {
  const start = Date.now()
  try {
    const result = await queryFn()
    const duration = Date.now() - start

    if (result.error) {
      results.push({
        test: testName,
        duration,
        success: false,
        error: result.error.message || JSON.stringify(result.error)
      })
      console.log(`❌ ${testName}: ${duration}ms - ERROR: ${result.error.message}`)
      return { duration, data: null, error: result.error }
    }

    results.push({
      test: testName,
      duration,
      success: true,
      data: result.data
    })
    console.log(`✅ ${testName}: ${duration}ms`)
    return { duration, data: result.data, error: null }
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({
      test: testName,
      duration,
      success: false,
      error: error.message
    })
    console.log(`❌ ${testName}: ${duration}ms - EXCEPTION: ${error.message}`)
    return { duration, data: null, error }
  }
}

async function checkTriggerStatus() {
  console.log('\n========================================')
  console.log('CHECKING TRIGGER STATUS')
  console.log('========================================\n')

  // Query pg_trigger via RPC or direct SQL
  const query = `
    SELECT
      c.relname as table_name,
      t.tgname as trigger_name,
      CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
      END as status
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
      AND t.tgname LIKE '%log%'
    ORDER BY t.tgenabled, c.relname, t.tgname
  `

  const result = await measureQuery(
    'Check Trigger Status (pg_trigger)',
    () => supabase.rpc('exec_sql', { sql: query })
  )

  if (result.data) {
    console.log('\n📋 Trigger Status:')
    console.table(result.data)
  }

  return result
}

async function checkJSONCorruption() {
  console.log('\n========================================')
  console.log('CHECKING JSON CORRUPTION')
  console.log('========================================\n')

  // Get all sim_runs (with only columns that exist)
  const result = await measureQuery(
    'Fetch all sim_runs',
    () => supabase
      .from('sim_runs')
      .select('run_id, run_name, config, status')
  )

  if (result.data) {
    console.log('\n📊 Simulation Configs:')
    for (const sim of result.data) {
      const configStr = JSON.stringify(sim.config)

      // Check for issues
      let issues: string[] = []

      if (sim.config === null) {
        issues.push('NULL config')
      } else if (typeof sim.config === 'string') {
        issues.push('Config is STRING (should be object)')
      } else if (configStr.includes('\\')) {
        issues.push('Contains backslashes (escape issues?)')
      }

      if (configStr.length > 5000) {
        issues.push(`Very large (${configStr.length} chars)`)
      }

      const statusIcon = issues.length > 0 ? '⚠️ ' : '✅'
      console.log(`${statusIcon} ${sim.run_name}: ${issues.length > 0 ? issues.join(', ') : 'OK'}`)

      if (issues.length > 0) {
        console.log(`   Config preview: ${configStr.substring(0, 100)}...`)
      }
    }
  }

  return result
}

async function measureCriticalQueries() {
  console.log('\n========================================')
  console.log('MEASURING CRITICAL QUERIES')
  console.log('========================================\n')

  // 1. Simple sim_runs query
  await measureQuery(
    '1. Fetch sim_runs (no joins)',
    () => supabase.from('sim_runs').select('*').limit(10)
  )

  // 2. Roles query
  await measureQuery(
    '2. Fetch roles',
    () => supabase.from('roles').select('*').limit(50)
  )

  // 3. Clans query
  await measureQuery(
    '3. Fetch clans',
    () => supabase.from('clans').select('*').limit(50)
  )

  // 4. Phases query
  await measureQuery(
    '4. Fetch phases',
    () => supabase.from('phases').select('*').limit(50)
  )

  // 5. Roles WITH JOIN to users (the problematic query)
  await measureQuery(
    '5. Fetch roles WITH JOIN to users',
    () => supabase
      .from('roles')
      .select('*, users!roles_assigned_user_id_fkey(display_name)')
      .limit(20)
  )

  // 6. Full simulation load (what participant dashboard does)
  const { data: firstSim } = await supabase
    .from('sim_runs')
    .select('run_id')
    .limit(1)
    .single()

  if (firstSim) {
    await measureQuery(
      '6. Full simulation load (all related data)',
      async () => {
        const [sim, clans, roles, phases] = await Promise.all([
          supabase.from('sim_runs').select('*').eq('run_id', firstSim.run_id).single(),
          supabase.from('clans').select('*').eq('run_id', firstSim.run_id),
          supabase.from('roles').select('*').eq('run_id', firstSim.run_id),
          supabase.from('phases').select('*').eq('run_id', firstSim.run_id)
        ])
        return { data: { sim, clans, roles, phases }, error: null }
      }
    )
  }

  // 7. Count queries (to check table sizes)
  console.log('\n📊 Table Sizes:')
  const tables = ['sim_runs', 'clans', 'roles', 'phases', 'meetings', 'votes', 'event_log']
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    console.log(`   ${table}: ${count} rows`)
  }
}

async function runDiagnostics() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║   COMPREHENSIVE DIAGNOSTIC: TRIGGERS + JSON + PERFORMANCE  ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // 1. Check triggers
  console.log('🔍 Step 1: Checking if triggers are disabled...')
  const triggerResult = await checkTriggerStatus()

  // 2. Check JSON corruption
  console.log('\n🔍 Step 2: Checking for JSON corruption...')
  const jsonResult = await checkJSONCorruption()

  // 3. Measure queries
  console.log('\n🔍 Step 3: Measuring query performance...')
  await measureCriticalQueries()

  // SUMMARY
  console.log('\n\n========================================')
  console.log('DIAGNOSTIC SUMMARY')
  console.log('========================================\n')

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length

  console.log(`✅ Successful queries: ${successCount}`)
  console.log(`❌ Failed queries: ${failCount}`)
  console.log(`⏱️  Average query time: ${avgDuration.toFixed(0)}ms`)

  // Find slowest queries
  const slowest = [...results]
    .filter(r => r.success)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)

  console.log('\n🐌 Slowest Queries:')
  slowest.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.test}: ${r.duration}ms`)
  })

  // Check for patterns
  console.log('\n🔍 Analysis:')

  const allQueriesFast = results.every(r => r.duration < 500)
  const someQueriesSlow = results.some(r => r.duration > 2000)

  if (allQueriesFast) {
    console.log('✅ All queries are fast (<500ms)')
    console.log('   ➜ Database performance is GOOD')
    console.log('   ➜ Slowness is likely in FRONTEND (sequential queries, re-renders)')
  } else if (someQueriesSlow) {
    console.log('❌ Some queries are very slow (>2s)')
    console.log('   ➜ Database performance is the bottleneck')
    console.log('   ➜ Check slow queries above for root cause')
  } else {
    console.log('⚠️  Queries are moderate (500ms-2s)')
    console.log('   ➜ Database + frontend both contributing to slowness')
  }

  // Check trigger status
  if (triggerResult.error && triggerResult.error.message?.includes('exec_sql')) {
    console.log('\n⚠️  Could not check trigger status (RPC not available)')
    console.log('   ➜ Apply migration 00071 via Supabase Dashboard SQL Editor')
  }

  console.log('\n========================================')
  console.log('Diagnostic complete!')
  console.log('========================================\n')
}

// Run diagnostics
runDiagnostics().catch(console.error)
