/**
 * CHECK CLANS FOR BASE64 IMAGES
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

async function checkClans() {
  console.log('\n🔍 Checking clans table for base64 images...\n')

  const { data: clans, error } = await supabase
    .from('clans')
    .select('clan_id, name, emblem_url, color_hex')
    .limit(20)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!clans || clans.length === 0) {
    console.log('⚠️  No clans found')
    return
  }

  console.log(`Found ${clans.length} clans\n`)

  let base64Count = 0
  let totalBase64Size = 0

  for (const clan of clans) {
    const emblemSize = clan.emblem_url?.length || 0
    const isBase64 = clan.emblem_url?.startsWith('data:image/')

    if (isBase64) {
      base64Count++
      totalBase64Size += emblemSize
      console.log(`❌ ${clan.name}: ${formatBytes(emblemSize)} (BASE64!)`)
    } else if (clan.emblem_url) {
      console.log(`✅ ${clan.name}: ${formatBytes(emblemSize)} (URL)`)
    } else {
      console.log(`⚪ ${clan.name}: No emblem`)
    }
  }

  console.log(`\n${'═'.repeat(61)}`)
  console.log(`Clans with base64 emblems: ${base64Count}/${clans.length}`)
  if (totalBase64Size > 0) {
    console.log(`Total base64 size: ${formatBytes(totalBase64Size)}`)
    console.log('═'.repeat(61))
    console.log(`⚠️  ACTION NEEDED: Extract clan emblems to Storage!`)
  } else {
    console.log(`✅ All clans using URLs or no emblems - OK!`)
  }
  console.log('═'.repeat(61) + '\n')
}

checkClans().catch(console.error)
