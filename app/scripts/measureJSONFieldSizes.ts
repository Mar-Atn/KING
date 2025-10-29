/**
 * MEASURE JSON FIELD SIZES
 *
 * Checks if large JSONB fields are causing slowness
 * Specifically looking for base64 encoded images in JSON
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function analyzeJSON(data: any, fieldName: string): {
  sizeBytes: number
  hasBase64Images: boolean
  base64Count: number
  structure: string
} {
  const jsonString = JSON.stringify(data)
  const sizeBytes = new Blob([jsonString]).size

  // Check for base64 images (data:image/png;base64,...)
  const base64ImagePattern = /data:image\/[a-zA-Z]+;base64,([A-Za-z0-9+/=]+)/g
  const matches = jsonString.match(base64ImagePattern)
  const base64Count = matches ? matches.length : 0
  const hasBase64Images = base64Count > 0

  // Analyze structure
  let structure = 'unknown'
  if (Array.isArray(data)) {
    structure = `array[${data.length}]`
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data)
    structure = `object{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}`
  }

  return { sizeBytes, hasBase64Images, base64Count, structure }
}

async function checkSimRunsConfig() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║            CHECKING sim_runs.config FIELD                 ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const { data, error } = await supabase
    .from('sim_runs')
    .select('run_id, run_name, config')
    .limit(10)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No sim_runs found')
    return
  }

  console.log(`Found ${data.length} simulations\n`)

  let totalSize = 0
  let maxSize = 0
  let maxSizeName = ''

  for (const sim of data) {
    const analysis = analyzeJSON(sim.config, 'config')
    totalSize += analysis.sizeBytes

    if (analysis.sizeBytes > maxSize) {
      maxSize = analysis.sizeBytes
      maxSizeName = sim.run_name
    }

    const warning = analysis.sizeBytes > 100000 ? ' ⚠️ LARGE!' : analysis.sizeBytes > 500000 ? ' ❌ HUGE!' : ''
    console.log(`📊 ${sim.run_name}:`)
    console.log(`   Size: ${formatBytes(analysis.sizeBytes)}${warning}`)
    console.log(`   Structure: ${analysis.structure}`)
    if (analysis.hasBase64Images) {
      console.log(`   ❌ Contains ${analysis.base64Count} base64 images!`)
    }
    console.log('')
  }

  const avgSize = totalSize / data.length
  console.log('═'.repeat(61))
  console.log(`Average config size: ${formatBytes(avgSize)}`)
  console.log(`Largest config: ${maxSizeName} (${formatBytes(maxSize)})`)
  console.log('═'.repeat(61))

  if (avgSize > 100000) {
    console.log('⚠️  WARNING: Average config size > 100 KB')
    console.log('   This could slow down queries significantly!')
  }
  if (maxSize > 500000) {
    console.log('❌ CRITICAL: Largest config > 500 KB')
    console.log('   This will cause major performance issues!')
  }
}

async function checkSimulationTemplates() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         CHECKING simulation_templates JSON FIELDS         ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const { data, error } = await supabase
    .from('simulation_templates')
    .select('template_id, name, canonical_clans, canonical_roles, process_stages, decisions_framework')
    .limit(5)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No templates found')
    return
  }

  console.log(`Found ${data.length} templates\n`)

  for (const template of data) {
    console.log(`📚 Template: ${template.name}`)
    console.log('─'.repeat(61))

    const fields = [
      { name: 'canonical_clans', data: template.canonical_clans },
      { name: 'canonical_roles', data: template.canonical_roles },
      { name: 'process_stages', data: template.process_stages },
      { name: 'decisions_framework', data: template.decisions_framework }
    ]

    let templateTotalSize = 0

    for (const field of fields) {
      if (field.data) {
        const analysis = analyzeJSON(field.data, field.name)
        templateTotalSize += analysis.sizeBytes

        const warning = analysis.sizeBytes > 100000 ? ' ⚠️ LARGE!' : analysis.sizeBytes > 500000 ? ' ❌ HUGE!' : ''
        console.log(`   ${field.name}: ${formatBytes(analysis.sizeBytes)}${warning}`)
        console.log(`      Structure: ${analysis.structure}`)

        if (analysis.hasBase64Images) {
          console.log(`      ❌ Contains ${analysis.base64Count} base64 images!`)
        }
      } else {
        console.log(`   ${field.name}: null`)
      }
    }

    console.log(`   TOTAL: ${formatBytes(templateTotalSize)}`)
    console.log('')
  }
}

async function checkRolesAIConfig() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║            CHECKING roles.ai_config FIELD                 ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const { data, error } = await supabase
    .from('roles')
    .select('role_id, name, ai_config, avatar_url')
    .not('ai_config', 'is', null)
    .limit(10)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No roles with ai_config found')
    return
  }

  console.log(`Found ${data.length} roles with AI config\n`)

  let totalSize = 0
  for (const role of data) {
    const analysis = analyzeJSON(role.ai_config, 'ai_config')
    totalSize += analysis.sizeBytes

    const warning = analysis.sizeBytes > 10000 ? ' ⚠️ LARGE!' : ''
    console.log(`👤 ${role.name}: ${formatBytes(analysis.sizeBytes)}${warning}`)

    if (analysis.hasBase64Images) {
      console.log(`   ❌ Contains ${analysis.base64Count} base64 images!`)
    }

    // Check if avatar_url is a base64 data URL
    if (role.avatar_url && role.avatar_url.startsWith('data:image')) {
      const avatarSize = new Blob([role.avatar_url]).size
      console.log(`   ❌ avatar_url is base64 (${formatBytes(avatarSize)})`)
    }
  }

  const avgSize = totalSize / data.length
  console.log(`\nAverage ai_config size: ${formatBytes(avgSize)}`)
}

async function runAnalysis() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║         JSON FIELD SIZE ANALYSIS                          ║')
  console.log('║         Checking for performance bottlenecks              ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  await checkSimRunsConfig()
  await checkSimulationTemplates()
  await checkRolesAIConfig()

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                   RECOMMENDATIONS                         ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log('Best Practices for Large JSON Fields:')
  console.log('─'.repeat(61))
  console.log('1. ❌ NEVER store base64 images in JSON fields')
  console.log('   → Use avatar_url with public URLs instead')
  console.log('   → Or store in Supabase Storage + get signed URLs')
  console.log('')
  console.log('2. ⚠️  Keep JSON fields < 100 KB for good performance')
  console.log('   → If larger, consider normalizing into separate tables')
  console.log('   → Use JSONB only for truly variable/flexible data')
  console.log('')
  console.log('3. ✅ Use select() to fetch only needed JSON fields')
  console.log('   → .select("run_id, run_name") instead of .select("*")')
  console.log('   → Avoid fetching large config fields when not needed')
  console.log('')
  console.log('4. 🚀 Consider materialized views for frequently accessed data')
  console.log('   → Extract commonly used JSON fields to columns')
  console.log('   → Add indexes on extracted fields')
  console.log('═'.repeat(61) + '\n')
}

runAnalysis().catch(console.error)
