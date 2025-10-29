/**
 * DIAGNOSE BASE64 IMAGES IN DATABASE
 *
 * Uses service role key to bypass RLS and measure:
 * 1. Which roles have base64 images in avatar_url
 * 2. Sizes of text fields (background, character_traits, interests)
 * 3. Sizes of JSONB fields (ai_config)
 * 4. Total row sizes
 *
 * Run with: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/diagnoseBase64Images.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables!')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey?.substring(0, 20) + '...' || '❌')
  console.error('\nPlease update .env.local with your service role key.')
  console.error('See GIVE_ME_ACCESS.md for instructions.')
  process.exit(1)
}

if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Service role key not configured!')
  console.error('\nPlease update .env.local with your actual service role key.')
  console.error('See GIVE_ME_ACCESS.md for instructions.')
  process.exit(1)
}

// Create admin client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function isBase64Image(str: string | null): boolean {
  if (!str) return false
  return str.startsWith('data:image/')
}

async function diagnoseRoles() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║           DIAGNOSING ROLES TABLE                          ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const { data: roles, error } = await supabase
    .from('roles')
    .select('role_id, name, avatar_url, background, character_traits, interests, ai_config')
    .limit(50)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!roles || roles.length === 0) {
    console.log('⚠️  No roles found')
    return
  }

  console.log(`Found ${roles.length} roles\n`)

  let totalBase64Count = 0
  let totalBase64Size = 0
  let maxRowSize = 0
  let maxRowName = ''
  const base64Roles: any[] = []

  for (const role of roles) {
    // Calculate field sizes
    const avatarSize = role.avatar_url?.length || 0
    const backgroundSize = role.background?.length || 0
    const characterTraitsSize = role.character_traits?.length || 0
    const interestsSize = role.interests?.length || 0
    const aiConfigSize = role.ai_config ? JSON.stringify(role.ai_config).length : 0

    const totalSize = avatarSize + backgroundSize + characterTraitsSize + interestsSize + aiConfigSize

    if (totalSize > maxRowSize) {
      maxRowSize = totalSize
      maxRowName = role.name
    }

    // Check for base64 images
    const hasBase64Avatar = isBase64Image(role.avatar_url)

    if (hasBase64Avatar) {
      totalBase64Count++
      totalBase64Size += avatarSize
      base64Roles.push({
        name: role.name,
        avatarSize,
        totalSize
      })
    }

    // Log details for large roles (> 100 KB)
    if (totalSize > 100000) {
      console.log(`📊 ${role.name}:`)
      console.log(`   Total Size: ${formatBytes(totalSize)} ⚠️ LARGE!`)
      console.log(`   ├─ avatar_url: ${formatBytes(avatarSize)}${hasBase64Avatar ? ' ❌ BASE64!' : ''}`)
      console.log(`   ├─ background: ${formatBytes(backgroundSize)}`)
      console.log(`   ├─ character_traits: ${formatBytes(characterTraitsSize)}`)
      console.log(`   ├─ interests: ${formatBytes(interestsSize)}`)
      console.log(`   └─ ai_config: ${formatBytes(aiConfigSize)}`)
      console.log('')
    }
  }

  console.log('═'.repeat(61))
  console.log('SUMMARY')
  console.log('═'.repeat(61))
  console.log(`Total roles: ${roles.length}`)
  console.log(`Largest role: ${maxRowName} (${formatBytes(maxRowSize)})`)
  console.log(`Roles with base64 avatars: ${totalBase64Count}`)
  console.log(`Total base64 size: ${formatBytes(totalBase64Size)}`)
  console.log('═'.repeat(61))

  if (totalBase64Count > 0) {
    console.log('\n❌ BASE64 IMAGES DETECTED!')
    console.log('═'.repeat(61))
    console.log('Affected roles:')
    base64Roles.forEach(role => {
      console.log(`  - ${role.name}: ${formatBytes(role.avatarSize)}`)
    })
    console.log('═'.repeat(61))
    console.log('\n⚠️  RECOMMENDATION:')
    console.log('   1. Upload images to Supabase Storage')
    console.log('   2. Update avatar_url to public URLs')
    console.log('   3. This will reduce row size by 90-95%')
    console.log('   4. Query performance will improve 4-10×')
    console.log('═'.repeat(61))
  } else {
    console.log('\n✅ No base64 images found in avatar_url')
    console.log('\nChecking for large text fields...')

    const avgBackground = roles.reduce((sum, r) => sum + (r.background?.length || 0), 0) / roles.length
    const avgCharTraits = roles.reduce((sum, r) => sum + (r.character_traits?.length || 0), 0) / roles.length
    const avgInterests = roles.reduce((sum, r) => sum + (r.interests?.length || 0), 0) / roles.length

    console.log(`Average field sizes:`)
    console.log(`  - background: ${formatBytes(avgBackground)}`)
    console.log(`  - character_traits: ${formatBytes(avgCharTraits)}`)
    console.log(`  - interests: ${formatBytes(avgInterests)}`)

    if (avgBackground > 50000 || avgCharTraits > 50000 || avgInterests > 50000) {
      console.log('\n⚠️  Large text fields detected!')
      console.log('   Consider storing detailed backstories in a separate table')
      console.log('   and only loading them when needed.')
    }
  }
}

async function diagnoseSimRunsConfig() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         DIAGNOSING sim_runs.config FIELD                  ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const { data: sims, error } = await supabase
    .from('sim_runs')
    .select('run_id, run_name, config')
    .limit(10)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!sims || sims.length === 0) {
    console.log('⚠️  No simulations found')
    return
  }

  console.log(`Found ${sims.length} simulations\n`)

  let maxSize = 0
  let maxSizeName = ''

  for (const sim of sims) {
    const configSize = sim.config ? JSON.stringify(sim.config).length : 0

    if (configSize > maxSize) {
      maxSize = configSize
      maxSizeName = sim.run_name
    }

    const warning = configSize > 100000 ? ' ⚠️ LARGE!' : configSize > 500000 ? ' ❌ HUGE!' : ''
    console.log(`📊 ${sim.run_name}: ${formatBytes(configSize)}${warning}`)
  }

  console.log('\n═'.repeat(61))
  console.log(`Largest config: ${maxSizeName} (${formatBytes(maxSize)})`)
  console.log('═'.repeat(61))

  if (maxSize > 100000) {
    console.log('\n⚠️  Large config fields detected!')
    console.log('   Consider excluding "config" from queries that don\'t need it')
  }
}

async function checkQueryPerformance() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║           TESTING QUERY PERFORMANCE                       ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  // Get a sample run_id
  const { data: sims } = await supabase
    .from('sim_runs')
    .select('run_id')
    .limit(1)
    .single()

  if (!sims) {
    console.log('⚠️  No simulations to test')
    return
  }

  const runId = sims.run_id

  // Test 1: SELECT * (includes large fields)
  console.log('Test 1: SELECT * (with large fields)')
  const start1 = Date.now()
  const { data: rolesAll } = await supabase
    .from('roles')
    .select('*')
    .eq('run_id', runId)
  const time1 = Date.now() - start1
  console.log(`   Time: ${time1}ms`)
  console.log(`   Rows: ${rolesAll?.length || 0}`)
  console.log(`   Data size: ${formatBytes(JSON.stringify(rolesAll).length)}`)

  // Test 2: SELECT specific fields (exclude large fields)
  console.log('\nTest 2: SELECT specific fields (without large fields)')
  const start2 = Date.now()
  const { data: rolesSmall } = await supabase
    .from('roles')
    .select('role_id, run_id, clan_id, name, position, avatar_url, status')
    .eq('run_id', runId)
  const time2 = Date.now() - start2
  console.log(`   Time: ${time2}ms`)
  console.log(`   Rows: ${rolesSmall?.length || 0}`)
  console.log(`   Data size: ${formatBytes(JSON.stringify(rolesSmall).length)}`)

  console.log('\n═'.repeat(61))
  console.log(`Performance improvement: ${Math.round(time1 / time2)}× faster`)
  console.log(`Data size reduction: ${Math.round(JSON.stringify(rolesAll).length / JSON.stringify(rolesSmall).length)}× smaller`)
  console.log('═'.repeat(61))

  if (time1 > time2 * 2) {
    console.log('\n✅ RECOMMENDATION CONFIRMED:')
    console.log('   Exclude large fields from queries to improve performance')
  }
}

async function runDiagnostics() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║       BASE64 IMAGE DIAGNOSTIC TOOL                        ║')
  console.log('║       (Using Service Role Key - Full Access)              ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log(`Database: ${supabaseUrl}`)
  console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...${serviceRoleKey.substring(serviceRoleKey.length - 10)}`)
  console.log('')

  try {
    await diagnoseRoles()
    await diagnoseSimRunsConfig()
    await checkQueryPerformance()

    console.log('\n\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║                   NEXT STEPS                              ║')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')

    console.log('1. Review the findings above')
    console.log('2. If base64 images found: migrate to Supabase Storage')
    console.log('3. If large text fields found: exclude from queries or normalize')
    console.log('4. Update ParticipantDashboard queries to exclude large fields')
    console.log('5. Re-test performance after fixes')
    console.log('')
  } catch (err: any) {
    console.error('\n❌ Diagnostic failed:', err.message)
  }
}

runDiagnostics().catch(console.error)
