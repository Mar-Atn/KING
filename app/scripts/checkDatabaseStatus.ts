import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabase() {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 DATABASE STATUS CHECK')
  console.log('='.repeat(80))
  console.log('')

  // Check if we can connect
  console.log('📡 Testing database connection...')
  const start = Date.now()

  try {
    // Simple query that should work
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    const duration = Date.now() - start

    if (testError) {
      console.log(`❌ Connection FAILED (${duration}ms)`)
      console.log(`   Error: ${testError.message}`)
      console.log(`   Code: ${testError.code}`)
      console.log(`   Details: ${JSON.stringify(testError.details)}`)
      return
    }

    console.log(`✅ Connection OK (${duration}ms)`)
  } catch (error: any) {
    console.log(`❌ Connection ERROR: ${error.message}`)
    return
  }

  // Skip RLS policy check for now

  // Count data in key tables (bypassing RLS would require service role)
  console.log('\n📊 Attempting to count records (with RLS)...')
  console.log('-'.repeat(80))

  const tables = ['users', 'sim_runs', 'clans', 'roles', 'phases']

  for (const table of tables) {
    const start = Date.now()
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    const duration = Date.now() - start

    if (error) {
      console.log(`❌ ${table}: Error after ${duration}ms - ${error.message}`)
    } else {
      console.log(`✅ ${table}: ${count} rows (${duration}ms)`)
    }
  }

  // Try to fetch sim_runs specifically
  console.log('\n🎯 Attempting to fetch sim_runs...')
  console.log('-'.repeat(80))

  const fetchStart = Date.now()
  const { data: simRuns, error: simRunsError } = await supabase
    .from('sim_runs')
    .select('run_id, title, status, facilitator_id')
    .limit(5)

  const fetchDuration = Date.now() - fetchStart

  if (simRunsError) {
    console.log(`❌ FAILED to fetch sim_runs (${fetchDuration}ms)`)
    console.log(`   Error: ${simRunsError.message}`)
    console.log(`   Code: ${simRunsError.code}`)
    console.log(`   Hint: ${simRunsError.hint}`)
    console.log(`   Details: ${JSON.stringify(simRunsError.details)}`)
  } else {
    console.log(`✅ SUCCESS: Fetched ${simRuns?.length || 0} sim_runs (${fetchDuration}ms)`)
    if (simRuns && simRuns.length > 0) {
      console.log('\n   Simulations found:')
      simRuns.forEach(sim => {
        console.log(`   • ${sim.title} (${sim.status})`)
      })
    }
  }

  // Skip detailed policy check

  console.log('\n' + '='.repeat(80))
  console.log('💡 DIAGNOSIS')
  console.log('='.repeat(80))
  console.log('')
  console.log('If sim_runs query failed:')
  console.log('  • RLS policies are blocking access')
  console.log('  • Need to check policy definitions')
  console.log('')
  console.log('If sim_runs query succeeded but took >1s:')
  console.log('  • RLS policies have performance issues')
  console.log('  • May need further optimization')
  console.log('')
  console.log('If sim_runs query succeeded quickly:')
  console.log('  • Database is fine')
  console.log('  • Issue is in frontend code')
  console.log('')
}

checkDatabase().catch(console.error)
