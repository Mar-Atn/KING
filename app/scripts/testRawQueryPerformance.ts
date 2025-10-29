/**
 * RAW QUERY PERFORMANCE TEST (No authentication)
 *
 * Tests the actual query performance by measuring each operation
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface QueryTest {
  name: string
  query: () => Promise<any>
  expectedMaxMs?: number
}

async function measureQuery(test: QueryTest, iteration: number = 1) {
  const start = Date.now()
  try {
    const result = await test.query()
    const duration = Date.now() - start

    const status = result.error ? '❌' : '✅'
    const maxIndicator = test.expectedMaxMs && duration > test.expectedMaxMs ? ' ⚠️ SLOW!' : ''
    const rowCount = result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0

    console.log(`${status} [${iteration}] ${test.name}: ${duration}ms (${rowCount} rows)${maxIndicator}`)

    if (result.error) {
      console.log(`   Error: ${result.error.message}`)
    }

    return { duration, success: !result.error, error: result.error, rowCount }
  } catch (error: any) {
    const duration = Date.now() - start
    console.log(`❌ [${iteration}] ${test.name}: ${duration}ms - EXCEPTION: ${error.message}`)
    return { duration, success: false, error, rowCount: 0 }
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║             RAW QUERY PERFORMANCE TEST                    ║')
  console.log('║         Measuring actual database query times             ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  // Define all queries that the app makes
  const queries: QueryTest[] = [
    {
      name: 'sim_runs (all)',
      query: () => supabase.from('sim_runs').select('*').limit(10),
      expectedMaxMs: 500
    },
    {
      name: 'phases (all)',
      query: () => supabase.from('phases').select('*').limit(100),
      expectedMaxMs: 500
    },
    {
      name: 'clans (all)',
      query: () => supabase.from('clans').select('*').limit(50),
      expectedMaxMs: 300
    },
    {
      name: 'roles (all)',
      query: () => supabase.from('roles').select('*').limit(50),
      expectedMaxMs: 500
    },
    {
      name: 'users (all)',
      query: () => supabase.from('users').select('*').limit(50),
      expectedMaxMs: 500
    },
    {
      name: 'meetings (all)',
      query: () => supabase.from('meetings').select('*').limit(50),
      expectedMaxMs: 300
    },
    {
      name: 'vote_sessions (all)',
      query: () => supabase.from('vote_sessions').select('*').limit(50),
      expectedMaxMs: 300
    },
    {
      name: 'votes (all)',
      query: () => supabase.from('votes').select('*').limit(100),
      expectedMaxMs: 300
    },
    {
      name: 'event_log (all)',
      query: () => supabase.from('event_log').select('*').limit(100),
      expectedMaxMs: 500
    }
  ]

  console.log('Running each query 3 times to check consistency...\n')

  const allResults: Array<{ query: string; durations: number[]; avgMs: number; maxMs: number }> = []

  for (const query of queries) {
    const durations: number[] = []

    for (let i = 1; i <= 3; i++) {
      const result = await measureQuery(query, i)
      if (result.success) {
        durations.push(result.duration)
      }

      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (durations.length > 0) {
      const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxMs = Math.max(...durations)
      allResults.push({ query: query.name, durations, avgMs, maxMs })
    }

    console.log('') // Blank line between queries
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                    PERFORMANCE SUMMARY                    ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log('Query Performance Summary:')
  console.log('─'.repeat(70))
  console.log('Query                          | Avg Time | Max Time | Status')
  console.log('─'.repeat(70))

  allResults.forEach(r => {
    const status = r.avgMs > 1000 ? '❌ SLOW' : r.avgMs > 500 ? '⚠️  MODERATE' : '✅ FAST'
    const queryName = r.query.padEnd(30)
    const avgTime = `${r.avgMs.toFixed(0)}ms`.padEnd(8)
    const maxTime = `${r.maxMs}ms`.padEnd(8)
    console.log(`${queryName} | ${avgTime} | ${maxTime} | ${status}`)
  })

  console.log('─'.repeat(70))

  // Find bottlenecks
  const slowQueries = allResults.filter(r => r.avgMs > 1000)
  const moderateQueries = allResults.filter(r => r.avgMs > 500 && r.avgMs <= 1000)

  if (slowQueries.length > 0) {
    console.log('\n🐌 SLOW QUERIES (> 1 second):')
    slowQueries.forEach(r => {
      console.log(`   ❌ ${r.query}: ${r.avgMs.toFixed(0)}ms average`)
    })
  }

  if (moderateQueries.length > 0) {
    console.log('\n⚠️  MODERATE QUERIES (500ms - 1s):')
    moderateQueries.forEach(r => {
      console.log(`   ⚠️  ${r.query}: ${r.avgMs.toFixed(0)}ms average`)
    })
  }

  const fastQueries = allResults.filter(r => r.avgMs <= 500)
  console.log(`\n✅ FAST QUERIES (< 500ms): ${fastQueries.length}/${allResults.length}`)

  // Overall assessment
  console.log('\n═'.repeat(61))
  console.log('ASSESSMENT:')
  console.log('═'.repeat(61))

  if (slowQueries.length > 0) {
    console.log('❌ ISSUE: Some queries are very slow (> 1s)')
    console.log('   Root cause: Likely RLS policies or missing indexes')
    console.log('   Action: Investigate slow queries above')
  } else if (moderateQueries.length > 0) {
    console.log('⚠️  ISSUE: Some queries are moderately slow (500ms-1s)')
    console.log('   Root cause: Could be RLS overhead or data volume')
    console.log('   Action: Acceptable for now, but room for optimization')
  } else {
    console.log('✅ DATABASE PERFORMANCE IS EXCELLENT')
    console.log('   All queries < 500ms - database is NOT the bottleneck')
    console.log('   Root cause must be elsewhere (frontend, network, etc.)')
  }

  console.log('═'.repeat(61) + '\n')
}

runTests().catch(console.error)
