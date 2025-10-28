import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkRlsPolicies() {
  console.log('\n🔍 CHECKING ALL RLS POLICIES IN DATABASE')
  console.log('='.repeat(80))
  console.log('')

  // Query pg_policies to get all RLS policies
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .order('tablename', { ascending: true })
    .order('policyname', { ascending: true })

  if (error) {
    console.error('❌ Error fetching policies:', error)
    return
  }

  if (!policies || policies.length === 0) {
    console.log('⚠️  No policies found')
    return
  }

  // Group by table
  const policiesByTable: Record<string, any[]> = {}
  for (const policy of policies) {
    if (!policiesByTable[policy.tablename]) {
      policiesByTable[policy.tablename] = []
    }
    policiesByTable[policy.tablename].push(policy)
  }

  console.log(`Found ${policies.length} policies across ${Object.keys(policiesByTable).length} tables\n`)

  // Analyze each table
  const problematicTables: string[] = []
  const duplicatePolicies: string[] = []
  const circularDependencies: string[] = []
  const subqueryPolicies: string[] = []

  for (const [tableName, tablePolicies] of Object.entries(policiesByTable)) {
    console.log(`\n📋 Table: ${tableName}`)
    console.log('-'.repeat(80))

    // Group by command (SELECT, INSERT, UPDATE, DELETE)
    const policiesByCmd: Record<string, any[]> = {}
    for (const policy of tablePolicies) {
      if (!policiesByCmd[policy.cmd]) {
        policiesByCmd[policy.cmd] = []
      }
      policiesByCmd[policy.cmd].push(policy)
    }

    // Check for multiple policies on same action
    for (const [cmd, cmdPolicies] of Object.entries(policiesByCmd)) {
      if (cmdPolicies.length > 1) {
        console.log(`\n  ⚠️  ${cmd}: ${cmdPolicies.length} policies (will be evaluated with OR)`)
        duplicatePolicies.push(`${tableName}.${cmd}`)
      } else {
        console.log(`\n  ✅ ${cmd}: 1 policy`)
      }

      // Display each policy
      for (const policy of cmdPolicies) {
        console.log(`\n     Policy: "${policy.policyname}"`)
        console.log(`     Permissive: ${policy.permissive}`)
        console.log(`     Roles: ${policy.roles}`)

        if (policy.qual) {
          console.log(`     USING: ${policy.qual}`)

          // Check for circular dependencies (users table queried in users policies)
          if (tableName === 'users' && policy.qual.includes('users')) {
            console.log(`     ❌ CIRCULAR DEPENDENCY DETECTED`)
            circularDependencies.push(`${tableName}.${policy.policyname}`)
            if (!problematicTables.includes(tableName)) {
              problematicTables.push(tableName)
            }
          }

          // Check for function calls that might query the same table
          if (policy.qual.includes('is_facilitator()') && tableName === 'users') {
            console.log(`     ⚠️  POTENTIAL CIRCULAR: calls is_facilitator() which queries users`)
            circularDependencies.push(`${tableName}.${policy.policyname}`)
            if (!problematicTables.includes(tableName)) {
              problematicTables.push(tableName)
            }
          }

          // Check for subqueries
          if (policy.qual.includes('SELECT') && policy.qual.includes('FROM')) {
            console.log(`     ⚠️  CONTAINS SUBQUERY`)
            subqueryPolicies.push(`${tableName}.${policy.policyname}`)
            if (!problematicTables.includes(tableName)) {
              problematicTables.push(tableName)
            }
          }
        }

        if (policy.with_check) {
          console.log(`     WITH CHECK: ${policy.with_check}`)

          // Same checks for WITH CHECK
          if (policy.with_check.includes('SELECT') && policy.with_check.includes('FROM')) {
            console.log(`     ⚠️  WITH CHECK CONTAINS SUBQUERY`)
            subqueryPolicies.push(`${tableName}.${policy.policyname}.with_check`)
            if (!problematicTables.includes(tableName)) {
              problematicTables.push(tableName)
            }
          }
        }
      }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 SUMMARY OF ISSUES')
  console.log('='.repeat(80))
  console.log('')

  if (circularDependencies.length > 0) {
    console.log(`❌ CIRCULAR DEPENDENCIES FOUND: ${circularDependencies.length}`)
    circularDependencies.forEach(dep => console.log(`   • ${dep}`))
    console.log('')
  }

  if (subqueryPolicies.length > 0) {
    console.log(`⚠️  SUBQUERIES IN POLICIES: ${subqueryPolicies.length}`)
    subqueryPolicies.forEach(pol => console.log(`   • ${pol}`))
    console.log('')
  }

  if (duplicatePolicies.length > 0) {
    console.log(`⚠️  MULTIPLE PERMISSIVE POLICIES (evaluated with OR): ${duplicatePolicies.length}`)
    duplicatePolicies.forEach(dup => console.log(`   • ${dup}`))
    console.log('')
  }

  if (problematicTables.length > 0) {
    console.log(`\n🔴 TABLES REQUIRING FIXES: ${problematicTables.length}`)
    problematicTables.forEach(table => console.log(`   • ${table}`))
    console.log('')
  }

  if (circularDependencies.length === 0 && subqueryPolicies.length === 0 && duplicatePolicies.length === 0) {
    console.log('✅ NO CRITICAL ISSUES FOUND!')
    console.log('   All policies look optimized.')
  } else {
    console.log('\n💡 RECOMMENDED ACTIONS:')
    if (circularDependencies.length > 0) {
      console.log('   1. CRITICAL: Remove circular dependencies on users table')
    }
    if (subqueryPolicies.length > 0) {
      console.log('   2. HIGH: Remove subqueries from policies (replace with simple checks)')
    }
    if (duplicatePolicies.length > 0) {
      console.log('   3. MEDIUM: Consolidate multiple permissive policies into one per action')
    }
  }

  console.log('')
}

checkRlsPolicies().catch(console.error)
