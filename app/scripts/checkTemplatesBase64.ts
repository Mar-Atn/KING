/**
 * CHECK SIMULATION_TEMPLATES FOR BASE64 IMAGES
 *
 * Templates have JSONB fields that may contain base64 images:
 * - canonical_clans (logo_url)
 * - canonical_roles (avatar_url)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function findBase64InObject(obj: any, path = ''): { path: string; size: number }[] {
  const results: { path: string; size: number }[] = []

  if (typeof obj === 'string' && obj.startsWith('data:image/')) {
    results.push({ path, size: obj.length })
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      results.push(...findBase64InObject(item, `${path}[${index}]`))
    })
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      results.push(...findBase64InObject(value, path ? `${path}.${key}` : key))
    })
  }

  return results
}

async function checkTemplates() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║     CHECKING SIMULATION_TEMPLATES FOR BASE64 IMAGES      ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const { data: templates, error } = await supabase
    .from('simulation_templates')
    .select('template_id, name, version, canonical_clans, canonical_roles')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!templates || templates.length === 0) {
    console.log('⚠️  No templates found')
    return
  }

  console.log(`Found ${templates.length} templates\n`)

  let totalBase64Count = 0
  let totalBase64Size = 0
  const affectedTemplates: any[] = []

  for (const template of templates) {
    console.log(`📚 Template: ${template.name} ${template.version}`)
    console.log('─'.repeat(61))

    let templateBase64Count = 0
    let templateBase64Size = 0

    // Check canonical_clans
    if (template.canonical_clans) {
      const clansBase64 = findBase64InObject(template.canonical_clans, 'canonical_clans')
      if (clansBase64.length > 0) {
        console.log('   ❌ Base64 images in canonical_clans:')
        clansBase64.forEach(({ path, size }) => {
          console.log(`      ${path}: ${formatBytes(size)}`)
          templateBase64Count++
          templateBase64Size += size
        })
      } else {
        console.log('   ✅ canonical_clans: No base64 images')
      }
    }

    // Check canonical_roles
    if (template.canonical_roles) {
      const rolesBase64 = findBase64InObject(template.canonical_roles, 'canonical_roles')
      if (rolesBase64.length > 0) {
        console.log('   ❌ Base64 images in canonical_roles:')
        rolesBase64.forEach(({ path, size }) => {
          console.log(`      ${path}: ${formatBytes(size)}`)
          templateBase64Count++
          templateBase64Size += size
        })
      } else {
        console.log('   ✅ canonical_roles: No base64 images')
      }
    }

    if (templateBase64Count > 0) {
      console.log(`   📊 Total: ${templateBase64Count} base64 images, ${formatBytes(templateBase64Size)}`)
      affectedTemplates.push({
        template_id: template.template_id,
        name: template.name,
        version: template.version,
        base64Count: templateBase64Count,
        base64Size: templateBase64Size
      })
      totalBase64Count += templateBase64Count
      totalBase64Size += templateBase64Size
    }

    console.log('')
  }

  console.log('═'.repeat(61))
  console.log('SUMMARY')
  console.log('═'.repeat(61))
  console.log(`Total templates: ${templates.length}`)
  console.log(`Templates with base64: ${affectedTemplates.length}`)
  console.log(`Total base64 images: ${totalBase64Count}`)
  console.log(`Total base64 size: ${formatBytes(totalBase64Size)}`)
  console.log('═'.repeat(61))

  if (affectedTemplates.length > 0) {
    console.log('\n⚠️  ACTION NEEDED!')
    console.log('═'.repeat(61))
    console.log('Templates contain base64 images that should be extracted to Storage:')
    affectedTemplates.forEach(t => {
      console.log(`  - ${t.name} ${t.version}: ${t.base64Count} images (${formatBytes(t.base64Size)})`)
    })
    console.log('═'.repeat(61))
    console.log('\nImpact:')
    console.log('  • Template queries will be slow')
    console.log('  • New simulations created from template will have base64 images')
    console.log('  • EditScenario page will be slow to load')
    console.log('\nRecommendation:')
    console.log('  1. Extract base64 images from templates to Supabase Storage')
    console.log('  2. Update canonical_clans and canonical_roles with storage URLs')
    console.log('  3. Re-test EditScenario and SimulationWizard pages')
    console.log('═'.repeat(61) + '\n')
  } else {
    console.log('\n✅ All templates are clean - no base64 images!')
    console.log('═'.repeat(61) + '\n')
  }
}

checkTemplates().catch(console.error)
