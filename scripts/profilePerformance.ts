/**
 * Performance Profiling Script
 *
 * Measures query performance, RLS overhead, and identifies bottlenecks
 * Run with: npx tsx scripts/profilePerformance.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

interface PerformanceResult {
  operation: string
  executionTime: number
  rowCount: number
  hasRLS: boolean
  error?: string
}

const results: PerformanceResult[] = []

/**
 * Measure execution time of a query
 */
async function measureQuery(
  operation: string,
  queryFn: () => Promise<any>,
  hasRLS: boolean = true
): Promise<void> {
  const start = performance.now()

  try {
    const { data, error, count } = await queryFn()
    const executionTime = performance.now() - start

    if (error) {
      results.push({
        operation,
        executionTime,
        rowCount: 0,
        hasRLS,
        error: error.message
      })
      console.log(`❌ ${operation}: ${error.message}`)
    } else {
      const rowCount = count !== null ? count : (Array.isArray(data) ? data.length : data ? 1 : 0)
      results.push({
        operation,
        executionTime,
        rowCount,
        hasRLS
      })
      console.log(`✅ ${operation}: ${executionTime.toFixed(2)}ms (${rowCount} rows)`)
    }
  } catch (err: any) {
    const executionTime = performance.now() - start
    results.push({
      operation,
      executionTime,
      rowCount: 0,
      hasRLS,
      error: err.message
    })
    console.log(`❌ ${operation}: ${err.message}`)
  }
}

/**
 * Profile key database operations
 */
async function profileOperations() {
  console.log('\n📊 PHASE 3: PERFORMANCE PROFILING\n')
  console.log('=' .repeat(60))

  // Test 1: Simple queries without joins
  console.log('\n🔍 Test 1: Simple Queries (No Joins)')
  console.log('-'.repeat(60))

  await measureQuery(
    'SELECT all simulations',
    () => supabase.from('sim_runs').select('*')
  )

  await measureQuery(
    'SELECT single simulation by ID',
    () => supabase.from('sim_runs').select('*').limit(1).single()
  )

  await measureQuery(
    'COUNT simulations',
    () => supabase.from('sim_runs').select('*', { count: 'exact', head: true })
  )

  // Test 2: Queries with single-level joins
  console.log('\n🔗 Test 2: Single-Level Joins')
  console.log('-'.repeat(60))

  await measureQuery(
    'SELECT simulations with clans',
    () => supabase.from('sim_runs').select('*, clans(*)')
  )

  await measureQuery(
    'SELECT simulations with phases',
    () => supabase.from('sim_runs').select('*, phases(*)')
  )

  // Test 3: Complex multi-level joins
  console.log('\n🌳 Test 3: Multi-Level Joins')
  console.log('-'.repeat(60))

  await measureQuery(
    'SELECT simulations with clans and roles',
    () => supabase.from('sim_runs').select('*, clans(*, roles(*))')
  )

  await measureQuery(
    'SELECT complete simulation data',
    () => supabase.from('sim_runs').select(`
      *,
      clans(*, roles(*)),
      phases(*),
      users!sim_runs_facilitator_id_fkey(id, display_name, email)
    `)
  )

  // Test 4: User and access control queries
  console.log('\n👤 Test 4: User & Access Control')
  console.log('-'.repeat(60))

  await measureQuery(
    'SELECT all users',
    () => supabase.from('users').select('*')
  )

  await measureQuery(
    'SELECT user with role filter',
    () => supabase.from('users').select('*').eq('role', 'facilitator')
  )

  // Test 5: RLS-heavy operations
  console.log('\n🔐 Test 5: RLS-Protected Operations')
  console.log('-'.repeat(60))

  await measureQuery(
    'SELECT clans (RLS filtered)',
    () => supabase.from('clans').select('*')
  )

  await measureQuery(
    'SELECT roles (RLS filtered)',
    () => supabase.from('roles').select('*')
  )

  await measureQuery(
    'SELECT roles with clans (RLS + join)',
    () => supabase.from('roles').select('*, clans(*)')
  )

  // Test 6: Meeting and voting operations
  console.log('\n🗳️  Test 6: Meetings & Voting')
  console.log('-'.repeat(60))

  await measureQuery(
    'SELECT meetings',
    () => supabase.from('meetings').select('*')
  )

  await measureQuery(
    'SELECT vote sessions',
    () => supabase.from('vote_sessions').select('*')
  )

  await measureQuery(
    'SELECT votes with results',
    () => supabase.from('votes').select('*, vote_results(*)')
  )
}

/**
 * Analyze results and identify bottlenecks
 */
function analyzeResults() {
  console.log('\n\n📈 PERFORMANCE ANALYSIS')
  console.log('='.repeat(60))

  const successful = results.filter(r => !r.error)
  const failed = results.filter(r => r.error)

  console.log(`\n✅ Successful queries: ${successful.length}`)
  console.log(`❌ Failed queries: ${failed.length}`)

  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.executionTime, 0) / successful.length
    const maxTime = Math.max(...successful.map(r => r.executionTime))
    const minTime = Math.min(...successful.map(r => r.executionTime))

    console.log(`\n⏱️  Timing Statistics:`)
    console.log(`   Average: ${avgTime.toFixed(2)}ms`)
    console.log(`   Min: ${minTime.toFixed(2)}ms`)
    console.log(`   Max: ${maxTime.toFixed(2)}ms`)

    // Find slowest queries
    console.log(`\n🐌 Slowest Queries:`)
    const slowest = [...successful]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5)

    slowest.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.operation}: ${r.executionTime.toFixed(2)}ms`)
    })

    // Find fastest queries
    console.log(`\n⚡ Fastest Queries:`)
    const fastest = [...successful]
      .sort((a, b) => a.executionTime - b.executionTime)
      .slice(0, 5)

    fastest.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.operation}: ${r.executionTime.toFixed(2)}ms`)
    })
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed Queries:`)
    failed.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.operation}: ${r.error}`)
    })
  }

  // Performance recommendations
  console.log(`\n\n💡 RECOMMENDATIONS`)
  console.log('='.repeat(60))

  const slowQueries = successful.filter(r => r.executionTime > 100)
  if (slowQueries.length > 0) {
    console.log(`\n⚠️  ${slowQueries.length} queries exceeded 100ms:`)
    slowQueries.forEach(r => {
      console.log(`   - ${r.operation}: ${r.executionTime.toFixed(2)}ms`)
    })
    console.log(`\n   Consider:`)
    console.log(`   - Adding indexes on frequently queried columns`)
    console.log(`   - Optimizing join patterns`)
    console.log(`   - Reviewing RLS policy complexity`)
  }

  const complexJoins = successful.filter(r => r.operation.includes('Multi-Level') || r.operation.includes('complete'))
  if (complexJoins.length > 0) {
    console.log(`\n🌳 Complex joins detected:`)
    complexJoins.forEach(r => {
      console.log(`   - ${r.operation}: ${r.executionTime.toFixed(2)}ms`)
    })
    console.log(`\n   Consider:`)
    console.log(`   - Using server-side functions for complex queries`)
    console.log(`   - Implementing caching for frequently accessed data`)
    console.log(`   - Lazy-loading nested data on-demand`)
  }

  if (failed.length > 0) {
    console.log(`\n🔐 RLS or permission issues detected:`)
    console.log(`   - Review RLS policies for affected tables`)
    console.log(`   - Ensure test user has proper permissions`)
    console.log(`   - Consider using service role for profiling`)
  }

  console.log(`\n\n✅ Profile complete! Results saved to performance_results.json`)
}

/**
 * Save results to file
 */
async function saveResults() {
  const fs = await import('fs/promises')
  const outputPath = './performance_results.json'

  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    supabaseProject: SUPABASE_URL.split('//')[1]?.split('.')[0] || 'unknown',
    results,
    summary: {
      totalQueries: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      averageTime: results.filter(r => !r.error).reduce((sum, r) => sum + r.executionTime, 0) / results.filter(r => !r.error).length || 0,
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2))
}

/**
 * Main execution
 */
async function main() {
  try {
    await profileOperations()
    analyzeResults()
    await saveResults()
  } catch (error: any) {
    console.error('\n❌ Profiling failed:', error.message)
    process.exit(1)
  }
}

main()
