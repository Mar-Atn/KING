/**
 * EXTRACT BASE64 IMAGES FROM SIMULATION_TEMPLATES TO STORAGE
 *
 * Templates have base64 images in canonical_roles JSONB field.
 * This script extracts them to Supabase Storage and updates the template.
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

function base64ToBuffer(base64Data: string): Buffer {
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

async function extractTemplateBase64() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║   EXTRACT BASE64 FROM TEMPLATES TO SUPABASE STORAGE      ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  // Fetch templates
  const { data: templates, error } = await supabase
    .from('simulation_templates')
    .select('template_id, name, version, canonical_clans, canonical_roles')

  if (error) {
    console.error('❌ Error fetching templates:', error.message)
    return
  }

  if (!templates || templates.length === 0) {
    console.log('⚠️  No templates found')
    return
  }

  console.log(`Found ${templates.length} template(s)\n`)

  for (const template of templates) {
    console.log(`\n📚 Processing: ${template.name} ${template.version}`)
    console.log('═'.repeat(61))

    let hasChanges = false
    let extractedCount = 0
    let totalSizeBefore = 0
    let totalSizeAfter = 0

    // Process canonical_roles
    if (template.canonical_roles && Array.isArray(template.canonical_roles)) {
      const updatedRoles = []

      for (let i = 0; i < template.canonical_roles.length; i++) {
        const role = template.canonical_roles[i]
        let updatedRole = { ...role }

        // Check avatar_url
        if (role.avatar_url && role.avatar_url.startsWith('data:image/')) {
          const oldSize = role.avatar_url.length
          totalSizeBefore += oldSize

          console.log(`\n   [${i}] ${role.name}`)
          console.log(`       Original: ${formatBytes(oldSize)} (base64)`)

          try {
            // Convert to buffer
            const imageBuffer = base64ToBuffer(role.avatar_url)
            const extension = getImageExtensionFromBase64(role.avatar_url)

            // Generate filename
            const fileName = `template-role-${i + 1}-${Date.now()}.${extension}`
            const filePath = `avatars/${fileName}`

            // Upload to Storage
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, imageBuffer, {
                contentType: `image/${extension}`,
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error(`       ❌ Upload failed: ${uploadError.message}`)
              updatedRoles.push(role) // Keep original
              continue
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath)

            updatedRole.avatar_url = publicUrl
            const newSize = publicUrl.length
            totalSizeAfter += newSize

            console.log(`       ✅ Uploaded: ${filePath}`)
            console.log(`       🔗 New URL: ${publicUrl}`)
            console.log(`       📉 ${formatBytes(oldSize)} → ${formatBytes(newSize)} (${Math.round((1 - newSize/oldSize) * 100)}% smaller)`)

            extractedCount++
            hasChanges = true

          } catch (err: any) {
            console.error(`       ❌ Error: ${err.message}`)
            updatedRoles.push(role) // Keep original
            continue
          }
        } else {
          if (role.avatar_url) {
            totalSizeAfter += role.avatar_url.length
          }
        }

        updatedRoles.push(updatedRole)
      }

      if (hasChanges) {
        console.log(`\n   💾 Updating template...`)

        // Update template
        const { error: updateError } = await supabase
          .from('simulation_templates')
          .update({ canonical_roles: updatedRoles })
          .eq('template_id', template.template_id)

        if (updateError) {
          console.error(`   ❌ Update failed: ${updateError.message}`)
        } else {
          console.log(`   ✅ Template updated successfully`)
          console.log(`\n   📊 Summary for this template:`)
          console.log(`       Extracted: ${extractedCount} images`)
          console.log(`       Size before: ${formatBytes(totalSizeBefore)}`)
          console.log(`       Size after: ${formatBytes(totalSizeAfter)}`)
          console.log(`       Saved: ${formatBytes(totalSizeBefore - totalSizeAfter)} (${Math.round((1 - totalSizeAfter/totalSizeBefore) * 100)}%)`)
        }
      } else {
        console.log(`\n   ✅ No base64 images found - template is clean`)
      }
    }

    console.log('═'.repeat(61))
  }

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                 EXTRACTION COMPLETE                       ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log('NEXT STEPS:')
  console.log('═'.repeat(61))
  console.log('1. ✅ Template base64 images extracted to Storage')
  console.log('2. ✅ Templates updated with storage URLs')
  console.log('3. 🧪 Test EditScenario page (should load faster)')
  console.log('4. 🧪 Create new simulation from template')
  console.log('5. ✅ New simulations will now use storage URLs!')
  console.log('═'.repeat(61) + '\n')
}

extractTemplateBase64().catch(console.error)
