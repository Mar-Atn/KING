/**
 * CHECK CANONICAL_CLANS FOR BASE64 IMAGES
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

async function checkCanonicalClans() {
  console.log('\n🔍 Checking canonical_clans for base64 images...\n')

  const { data: templates } = await supabase
    .from('simulation_templates')
    .select('template_id, name, version, canonical_clans')

  if (!templates || templates.length === 0) {
    console.log('⚠️  No templates found')
    return
  }

  for (const template of templates) {
    console.log(`📚 Template: ${template.name} ${template.version}`)

    if (!template.canonical_clans) {
      console.log('   ⚠️  No canonical_clans field\n')
      continue
    }

    const clans = template.canonical_clans as any[]
    let base64Count = 0
    let totalSize = 0

    for (const clan of clans) {
      const logoUrl = clan.logo_url || clan.emblem_url
      if (logoUrl && logoUrl.startsWith('data:image/')) {
        console.log(`   ❌ ${clan.name}: ${formatBytes(logoUrl.length)} (BASE64 in logo!)`)
        base64Count++
        totalSize += logoUrl.length
      } else if (logoUrl) {
        console.log(`   ✅ ${clan.name}: ${formatBytes(logoUrl.length)} (URL)`)
      } else {
        console.log(`   ⚪ ${clan.name}: No logo`)
      }
    }

    if (base64Count > 0) {
      console.log(`\n   ⚠️  FOUND ${base64Count} base64 images (${formatBytes(totalSize)} total!)\n`)
    } else {
      console.log(`\n   ✅ All clans clean - no base64 images\n`)
    }
  }
}

checkCanonicalClans().catch(console.error)
