/**
 * AUTHENTICATED SIMULATION LOAD TEST
 *
 * This test will:
 * 1. Try multiple credential combinations
 * 2. Measure actual query times with authentication
 * 3. Report bottlenecks
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Try to find credentials from environment or common test accounts
const TEST_ACCOUNTS = [
  { email: 'marat@marat.mar', password: 'marat' },
  { email: 'user@user.user', password: 'user' },
  { email: 'test@test.test', password: 'test' },
  { email: 'admin@test.com', password: 'admin' }
]

interface TimingResult {
  operation: string
  duration: number
  success: boolean
  details?: any
}

const timings: TimingResult[] = []

function logTiming(operation: string, duration: number, success: boolean, details?: any) {
  timings.push({ operation, duration, success, details })
  const status = success ? '✅' : '❌'
  console.log(`${status} ${operation}: ${duration}ms`)
  if (details) {
    console.log(`   Details: ${JSON.stringify(details)}`)
  }
}

async function tryLogin(): Promise<{ user: any, session: any } | null> {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║               ATTEMPTING AUTHENTICATION                   ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  for (const account of TEST_ACCOUNTS) {
    console.log(`Trying ${account.email}...`)
    const start = Date.now()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password
    })

    const duration = Date.now() - start

    if (!error && data.user) {
      logTiming(`Login (${account.email})`, duration, true, { userId: data.user.id })
      return data
    } else {
      logTiming(`Login (${account.email})`, duration, false, { error: error?.message })
    }
  }

  return null
}

async function testGetRoleForUser(userId: string): Promise<{ roleId: string, runId: string } | null> {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║            FIND USER ROLE (ANY SIMULATION)                ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  // First, find any role assigned to this user
  const start = Date.now()
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('assigned_user_id', userId)
    .limit(1)
    .maybeSingle()

  const duration = Date.now() - start
  logTiming('Find any user role', duration, !error, { found: !!data })

  if (data) {
    return { roleId: data.role_id, runId: data.run_id }
  }

  // If no role, find any simulation
  console.log('No role found, checking for any simulation...')
  const simStart = Date.now()
  const { data: simData, error: simError } = await supabase
    .from('sim_runs')
    .select('run_id')
    .limit(1)
    .maybeSingle()

  const simDuration = Date.now() - simStart
  logTiming('Find any simulation', simDuration, !simError, { found: !!simData })

  if (simData) {
    return { roleId: '', runId: simData.run_id }
  }

  return null
}

async function testParticipantDashboardLoad(userId: string, runId: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         PARTICIPANT DASHBOARD LOAD (OPTIMIZED)            ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const totalStart = Date.now()

  // Step 1: Get role (with timing)
  console.log('Step 1: getRoleForUser (NO JOIN - optimized)...')
  const roleStart = Date.now()
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('run_id', runId)
    .eq('assigned_user_id', userId)
    .maybeSingle()
  const roleDuration = Date.now() - roleStart
  logTiming('  getRoleForUser', roleDuration, !roleError, { hasRole: !!roleData })

  // Step 2: Parallel queries (with timing)
  console.log('\nStep 2: Parallel queries (sim, clans, roles, phases)...')
  const parallelStart = Date.now()

  const [simResult, clansResult, allRolesResult, phasesResult] = await Promise.all([
    supabase.from('sim_runs').select('*').eq('run_id', runId).single(),
    supabase.from('clans').select('*').eq('run_id', runId).order('sequence_number'),
    supabase.from('roles').select('*').eq('run_id', runId),
    supabase.from('phases').select('*').eq('run_id', runId).order('sequence_number')
  ])

  const parallelDuration = Date.now() - parallelStart

  // Log individual query results
  logTiming('  sim_runs', parallelDuration, !simResult.error, {
    rows: simResult.data ? 1 : 0
  })
  logTiming('  clans', parallelDuration, !clansResult.error, {
    rows: clansResult.data?.length || 0
  })
  logTiming('  roles', parallelDuration, !allRolesResult.error, {
    rows: allRolesResult.data?.length || 0
  })
  logTiming('  phases', parallelDuration, !phasesResult.error, {
    rows: phasesResult.data?.length || 0
  })

  const totalDuration = Date.now() - totalStart

  console.log('\n' + '═'.repeat(61))
  console.log('PARTICIPANT DASHBOARD TIMING BREAKDOWN:')
  console.log('═'.repeat(61))
  console.log(`Step 1 (getRoleForUser):    ${roleDuration}ms`)
  console.log(`Step 2 (parallel queries):  ${parallelDuration}ms`)
  console.log(`Total load time:            ${totalDuration}ms`)
  console.log('═'.repeat(61))

  if (totalDuration < 1000) {
    console.log('✅ EXCELLENT: Load time < 1 second')
  } else if (totalDuration < 2000) {
    console.log('✅ GOOD: Load time < 2 seconds')
  } else if (totalDuration < 5000) {
    console.log('⚠️  ACCEPTABLE: Load time 2-5 seconds')
  } else {
    console.log('❌ SLOW: Load time > 5 seconds - further optimization needed')
  }

  return { totalDuration, roleDuration, parallelDuration }
}

async function testFacilitatorDashboard(userId: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║          FACILITATOR DASHBOARD LOAD (OPTIMIZED)           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const totalStart = Date.now()

  // Parallel fetch: sims + all phases
  const [simsResult, phasesResult] = await Promise.all([
    supabase.from('sim_runs').select('*').eq('facilitator_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('phases').select('*')
  ])

  const totalDuration = Date.now() - totalStart

  logTiming('Dashboard load (parallel)', totalDuration, !simsResult.error && !phasesResult.error, {
    sims: simsResult.data?.length || 0,
    phases: phasesResult.data?.length || 0
  })

  if (totalDuration < 500) {
    console.log('✅ EXCELLENT: Dashboard load < 500ms')
  } else if (totalDuration < 1000) {
    console.log('✅ GOOD: Dashboard load < 1 second')
  } else {
    console.log('⚠️  SLOW: Dashboard load > 1 second')
  }

  return simsResult.data?.[0]?.run_id
}

async function runTest() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║         AUTHENTICATED PERFORMANCE TEST                    ║')
  console.log('║         Testing with REAL authentication                  ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  try {
    // Step 1: Login
    const authData = await tryLogin()
    if (!authData) {
      console.error('\n❌ CRITICAL: Could not authenticate with any test account')
      console.error('Please provide valid credentials or create a test account')
      return
    }

    const user = authData.user

    // Step 2: Find a simulation for this user
    const roleInfo = await testGetRoleForUser(user.id)
    if (!roleInfo) {
      console.error('\n❌ CRITICAL: No simulations found in database')
      console.error('Please create a simulation first')
      return
    }

    // Step 3: Test participant dashboard
    if (roleInfo.roleId) {
      await testParticipantDashboardLoad(user.id, roleInfo.runId)
    } else {
      console.log('\nℹ️  User has no role - testing facilitator dashboard instead')
      const facilRunId = await testFacilitatorDashboard(user.id)

      if (facilRunId) {
        console.log('\nNow testing participant load for this simulation...')
        await testParticipantDashboardLoad(user.id, facilRunId)
      }
    }

    // Summary
    console.log('\n\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║                      TEST SUMMARY                         ║')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')

    const successCount = timings.filter(t => t.success).length
    const failCount = timings.filter(t => !t.success).length
    const avgDuration = timings.reduce((sum, t) => sum + t.duration, 0) / timings.length

    console.log(`Total operations: ${timings.length}`)
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${failCount}`)
    console.log(`Average duration: ${avgDuration.toFixed(0)}ms`)

    const slowOps = timings.filter(t => t.success && t.duration > 2000)
    if (slowOps.length > 0) {
      console.log(`\n⚠️  SLOW OPERATIONS (> 2s):`)
      slowOps.forEach(op => {
        console.log(`   - ${op.operation}: ${op.duration}ms`)
      })
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

runTest().catch(console.error)
