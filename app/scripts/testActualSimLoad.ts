/**
 * REAL SIMULATION LOAD TEST
 *
 * This mimics EXACTLY what happens when user/facilitator loads a simulation.
 * Times each operation to find the bottleneck.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test credentials
const FACILITATOR_EMAIL = 'marat@marat.mar'
const FACILITATOR_PASSWORD = 'marat'
const PARTICIPANT_EMAIL = 'user@user.user'
const PARTICIPANT_PASSWORD = 'user'

interface TimedResult {
  operation: string
  duration: number
  success: boolean
  rowCount?: number
  error?: string
}

const results: TimedResult[] = []

function logTiming(operation: string, duration: number, success: boolean, rowCount?: number, error?: string) {
  results.push({ operation, duration, success, rowCount, error })
  const status = success ? '✅' : '❌'
  const time = `${duration}ms`
  const rows = rowCount !== undefined ? ` (${rowCount} rows)` : ''
  const err = error ? ` - ${error}` : ''
  console.log(`${status} ${operation}: ${time}${rows}${err}`)
}

async function measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    logTiming(operation, duration, true)
    return result
  } catch (error: any) {
    const duration = Date.now() - start
    logTiming(operation, duration, false, undefined, error.message)
    throw error
  }
}

async function testFacilitatorLogin() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║           TEST 1: FACILITATOR LOGIN                       ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const start = Date.now()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: FACILITATOR_EMAIL,
    password: FACILITATOR_PASSWORD
  })

  const duration = Date.now() - start
  logTiming('Facilitator login', duration, !error, undefined, error?.message)

  if (error) throw new Error('Login failed')

  return data.user
}

async function testFacilitatorDashboard(userId: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║           TEST 2: FACILITATOR DASHBOARD                   ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const totalStart = Date.now()

  // This is EXACTLY what Dashboard.tsx does
  console.log('Step 1: Fetch simulations and phases in parallel...\n')

  const step1Start = Date.now()
  const [simsResult, phasesResult] = await Promise.all([
    supabase
      .from('sim_runs')
      .select('*')
      .eq('facilitator_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('phases')
      .select('*')
  ])
  const step1Duration = Date.now() - step1Start

  logTiming('  - Fetch sim_runs', step1Duration, !simsResult.error, simsResult.data?.length, simsResult.error?.message)
  logTiming('  - Fetch phases', step1Duration, !phasesResult.error, phasesResult.data?.length, phasesResult.error?.message)

  if (simsResult.error || phasesResult.error) {
    throw new Error('Dashboard queries failed')
  }

  const sims = simsResult.data || []
  const allPhases = phasesResult.data || []

  console.log('\nStep 2: Match phases to simulations (in memory)...')
  const simsWithPhases = sims.map(sim => {
    const currentPhase = sim.current_phase_id
      ? allPhases.find(p => p.phase_id === sim.current_phase_id) || null
      : null
    const totalPhases = allPhases.filter(p => p.run_id === sim.run_id).length
    return { ...sim, current_phase: currentPhase, total_phases: totalPhases }
  })

  const totalDuration = Date.now() - totalStart
  console.log(`\n✅ Dashboard loaded in ${totalDuration}ms (${sims.length} simulations)\n`)

  return simsWithPhases[0] // Return first sim for detailed test
}

async function testFacilitatorSimulationLoad(runId: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║      TEST 3: FACILITATOR LOAD FULL SIMULATION             ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const totalStart = Date.now()

  console.log('Simulating FacilitatorSimulation.tsx data loading...\n')

  // Query 1: Simulation
  let start = Date.now()
  const { data: simData, error: simError } = await supabase
    .from('sim_runs')
    .select('*')
    .eq('run_id', runId)
    .single()
  logTiming('Query 1: sim_runs', Date.now() - start, !simError, 1, simError?.message)

  // Query 2: Phases
  start = Date.now()
  const { data: phasesData, error: phasesError } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .order('sequence_number')
  logTiming('Query 2: phases', Date.now() - start, !phasesError, phasesData?.length, phasesError?.message)

  // Query 3: Clans
  start = Date.now()
  const { data: clansData, error: clansError } = await supabase
    .from('clans')
    .select('*')
    .eq('run_id', runId)
    .order('sequence_number')
  logTiming('Query 3: clans', Date.now() - start, !clansError, clansData?.length, clansError?.message)

  // Query 4: Roles
  start = Date.now()
  const { data: rolesData, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .eq('run_id', runId)
  logTiming('Query 4: roles', Date.now() - start, !rolesError, rolesData?.length, rolesError?.message)

  // Query 5: Meetings
  start = Date.now()
  const { data: meetingsData, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .eq('run_id', runId)
  logTiming('Query 5: meetings', Date.now() - start, !meetingsError, meetingsData?.length, meetingsError?.message)

  // Query 6: Vote sessions
  start = Date.now()
  const { data: voteSessionsData, error: voteSessionsError } = await supabase
    .from('vote_sessions')
    .select('*')
    .eq('run_id', runId)
  logTiming('Query 6: vote_sessions', Date.now() - start, !voteSessionsError, voteSessionsData?.length, voteSessionsError?.message)

  const totalDuration = Date.now() - totalStart
  console.log(`\n${totalDuration < 2000 ? '✅' : '❌'} Total facilitator sim load: ${totalDuration}ms\n`)

  if (totalDuration > 5000) {
    console.log('⚠️  WARNING: Facilitator sim load took > 5 seconds!')
  }

  return { simData, phasesData, clansData, rolesData }
}

async function testParticipantLogin() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║           TEST 4: PARTICIPANT LOGIN                       ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  // Sign out facilitator first
  await supabase.auth.signOut()

  const start = Date.now()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: PARTICIPANT_EMAIL,
    password: PARTICIPANT_PASSWORD
  })

  const duration = Date.now() - start
  logTiming('Participant login', duration, !error, undefined, error?.message)

  if (error) throw new Error('Participant login failed')

  return data.user
}

async function getRoleForUser(userId: string, runId: string) {
  const start = Date.now()
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('assigned_user_id', userId)
    .eq('run_id', runId)
    .maybeSingle()

  const duration = Date.now() - start
  logTiming('  - getRoleForUser', duration, !error, data ? 1 : 0, error?.message)

  return data
}

async function testParticipantSimulationLoad(userId: string, runId: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║      TEST 5: PARTICIPANT LOAD SIMULATION (OPTIMIZED)      ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const totalStart = Date.now()

  console.log('Step 1: Get user role...\n')
  const roleData = await getRoleForUser(userId, runId)

  if (!roleData) {
    console.log('❌ No role found - user would be redirected to waiting room')
    return
  }

  console.log('\nStep 2: Parallel fetch (sim, clans, roles, phases)...\n')

  const step2Start = Date.now()
  const [simResult, clansResult, allRolesResult, phasesResult] = await Promise.all([
    supabase.from('sim_runs').select('*').eq('run_id', runId).single(),
    supabase.from('clans').select('*').eq('run_id', runId).order('sequence_number', { ascending: true }),
    supabase.from('roles').select('*').eq('run_id', runId),
    supabase.from('phases').select('*').eq('run_id', runId).order('sequence_number', { ascending: true })
  ])
  const step2Duration = Date.now() - step2Start

  logTiming('  - sim_runs', step2Duration, !simResult.error, 1, simResult.error?.message)
  logTiming('  - clans', step2Duration, !clansResult.error, clansResult.data?.length, clansResult.error?.message)
  logTiming('  - roles', step2Duration, !allRolesResult.error, allRolesResult.data?.length, allRolesResult.error?.message)
  logTiming('  - phases', step2Duration, !phasesResult.error, phasesResult.data?.length, phasesResult.error?.message)

  console.log('\nStep 3: Filter clan members (in memory)...')
  const clanMembers = (allRolesResult.data || []).filter(r => r.clan_id === roleData.clan_id)
  console.log(`  - Found ${clanMembers.length} clan members`)

  const totalDuration = Date.now() - totalStart
  console.log(`\n${totalDuration < 2000 ? '✅' : '❌'} Total participant sim load: ${totalDuration}ms\n`)

  if (totalDuration > 5000) {
    console.log('⚠️  WARNING: Participant sim load took > 5 seconds!')
  }

  return { simResult, clansResult, allRolesResult, phasesResult }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║          COMPREHENSIVE SIMULATION LOAD TEST               ║')
  console.log('║         Testing with REAL data and credentials            ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  try {
    // Test 1: Facilitator login
    const facilitatorUser = await testFacilitatorLogin()

    // Test 2: Facilitator dashboard
    const firstSim = await testFacilitatorDashboard(facilitatorUser.id)

    if (!firstSim) {
      console.log('❌ No simulations found for facilitator')
      return
    }

    console.log(`\nUsing simulation: "${firstSim.run_name}" (${firstSim.run_id})`)

    // Test 3: Facilitator load full simulation
    await testFacilitatorSimulationLoad(firstSim.run_id)

    // Test 4: Participant login
    const participantUser = await testParticipantLogin()

    // Test 5: Participant load simulation
    await testParticipantSimulationLoad(participantUser.id, firstSim.run_id)

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║                      TEST SUMMARY                         ║')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')

    const totalOperations = results.length
    const successfulOps = results.filter(r => r.success).length
    const failedOps = results.filter(r => !r.success).length
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalOperations

    console.log(`Total operations: ${totalOperations}`)
    console.log(`Successful: ${successfulOps}`)
    console.log(`Failed: ${failedOps}`)
    console.log(`Average duration: ${avgDuration.toFixed(0)}ms`)

    // Find slowest operations
    const slowest = [...results]
      .filter(r => r.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)

    console.log('\n🐌 Slowest Operations:')
    slowest.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.operation}: ${r.duration}ms`)
    })

    // Check for issues
    console.log('\n🔍 Issues Found:')
    const slowOps = results.filter(r => r.success && r.duration > 2000)
    if (slowOps.length > 0) {
      console.log(`   ❌ ${slowOps.length} operations took > 2 seconds`)
      slowOps.forEach(op => {
        console.log(`      - ${op.operation}: ${op.duration}ms`)
      })
    } else {
      console.log('   ✅ All operations completed in < 2 seconds')
    }

    const failedOperations = results.filter(r => !r.success)
    if (failedOperations.length > 0) {
      console.log(`\n   ❌ ${failedOperations.length} operations failed:`)
      failedOperations.forEach(op => {
        console.log(`      - ${op.operation}: ${op.error}`)
      })
    }

    console.log('\n' + '═'.repeat(61))

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message)
    console.error(error.stack)
  }
}

// Run all tests
runAllTests().catch(console.error)
