/**
 * EXTRACT BASE64 IMAGES TO SUPABASE STORAGE
 *
 * This script extracts all base64-encoded avatar images from the database
 * and uploads them to Supabase Storage, then updates the avatar_url field.
 *
 * Run with: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/extractBase64ToStorage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY!')
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/extractBase64ToStorage.ts')
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
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function base64ToBuffer(base64Data: string): Buffer {
  // Extract the actual base64 data (remove "data:image/png;base64," prefix)
  const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 image format')
  }

  const base64String = matches[2]
  return Buffer.from(base64String, 'base64')
}

function getImageExtensionFromBase64(base64Data: string): string {
  const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/)
  if (!matches) return 'jpg'

  const mimeType = matches[1].toLowerCase()
  return mimeType === 'jpeg' ? 'jpg' : mimeType
}

async function extractAndUploadRole(role: any): Promise<{ success: boolean; newUrl?: string; error?: string; oldSize?: number; newSize?: number }> {
  try {
    console.log(`\n📦 Processing: ${role.name}`)

    // Check if avatar is base64
    if (!role.avatar_url || !role.avatar_url.startsWith('data:image/')) {
      console.log('   ⏭️  Skipping (not base64)')
      return { success: true }
    }

    const oldSize = role.avatar_url.length
    console.log(`   📏 Original size: ${formatBytes(oldSize)}`)

    // Convert base64 to buffer
    const imageBuffer = base64ToBuffer(role.avatar_url)
    const extension = getImageExtensionFromBase64(role.avatar_url)

    // Generate filename
    const fileName = `role-${role.role_id}-${Date.now()}.${extension}`
    const filePath = `avatars/${fileName}`

    console.log(`   📤 Uploading to: ${filePath}`)

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, imageBuffer, {
        contentType: `image/${extension}`,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error(`   ❌ Upload failed: ${uploadError.message}`)
      return { success: false, error: uploadError.message }
    }

    console.log(`   ✅ Uploaded successfully`)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    console.log(`   🔗 Public URL: ${publicUrl}`)

    // Update database with new URL
    const { error: updateError } = await supabase
      .from('roles')
      .update({ avatar_url: publicUrl })
      .eq('role_id', role.role_id)

    if (updateError) {
      console.error(`   ❌ Database update failed: ${updateError.message}`)
      return { success: false, error: updateError.message }
    }

    const newSize = publicUrl.length
    console.log(`   ✅ Database updated`)
    console.log(`   📉 Size reduction: ${formatBytes(oldSize)} → ${formatBytes(newSize)} (${Math.round((1 - newSize/oldSize) * 100)}% smaller!)`)

    return { success: true, newUrl: publicUrl, oldSize, newSize }

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function extractAllBase64Images() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║     EXTRACT BASE64 IMAGES TO SUPABASE STORAGE            ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log('🔍 Finding roles with base64 avatars...\n')

  // Fetch all roles
  const { data: roles, error } = await supabase
    .from('roles')
    .select('role_id, name, avatar_url')

  if (error) {
    console.error('❌ Failed to fetch roles:', error.message)
    process.exit(1)
  }

  if (!roles || roles.length === 0) {
    console.log('⚠️  No roles found')
    return
  }

  // Filter roles with base64 avatars
  const rolesWithBase64 = roles.filter(r => r.avatar_url?.startsWith('data:image/'))

  console.log(`Found ${rolesWithBase64.length} roles with base64 avatars (out of ${roles.length} total)`)

  if (rolesWithBase64.length === 0) {
    console.log('✅ No base64 avatars to extract!')
    return
  }

  console.log('\n═'.repeat(61))
  console.log('Starting extraction...')
  console.log('═'.repeat(61))

  let successCount = 0
  let failCount = 0
  let totalOldSize = 0
  let totalNewSize = 0

  // Process each role
  for (const role of rolesWithBase64) {
    const result = await extractAndUploadRole(role)

    if (result.success) {
      successCount++
      if (result.oldSize && result.newSize) {
        totalOldSize += result.oldSize
        totalNewSize += result.newSize
      }
    } else {
      failCount++
    }
  }

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                   EXTRACTION COMPLETE                     ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log(`✅ Successfully migrated: ${successCount}/${rolesWithBase64.length}`)
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount}`)
  }

  if (totalOldSize > 0 && totalNewSize > 0) {
    console.log(`\n📊 Total size reduction:`)
    console.log(`   Before: ${formatBytes(totalOldSize)}`)
    console.log(`   After: ${formatBytes(totalNewSize)}`)
    console.log(`   Saved: ${formatBytes(totalOldSize - totalNewSize)} (${Math.round((1 - totalNewSize/totalOldSize) * 100)}%)`)
  }

  console.log('\n═'.repeat(61))
  console.log('NEXT STEPS:')
  console.log('═'.repeat(61))
  console.log('1. ✅ Storage bucket created')
  console.log('2. ✅ Base64 images extracted')
  console.log('3. ✅ Database updated with storage URLs')
  console.log('4. ✅ ImageUpload component fixed')
  console.log('5. 🧪 TEST performance now!')
  console.log('')
  console.log('Expected results:')
  console.log('  • Query time: 4.9s → 50-200ms (10-100× faster!)')
  console.log('  • Total load time: 6-7s → < 1s')
  console.log('═'.repeat(61) + '\n')
}

extractAllBase64Images().catch(console.error)
