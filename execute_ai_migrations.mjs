import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://esplzaunxkehuankkwbx.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n=== AI CHARACTER PROTOTYPE - DATABASE SETUP ===\n')

// Migration 1: Create conversations table
console.log('📋 Migration 1: Creating conversations table...\n')
const migration1 = readFileSync(
  './supabase/migrations/00048_create_conversations_table.sql',
  'utf8'
)

try {
  const { data: data1, error: error1 } = await supabase.rpc('exec', { sql: migration1 })

  if (error1) {
    console.error('❌ Migration 1 failed:', error1.message)
    process.exit(1)
  }

  console.log('✅ Migration 1 complete: conversations table created\n')
} catch (e) {
  console.error('❌ Migration 1 error:', e.message)
  console.log('\n⚠️  Trying alternative method...\n')

  // Try splitting into smaller chunks
  const statements = migration1.split(';').filter(s => s.trim())
  let successCount = 0

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await supabase.rpc('exec', { sql: statement + ';' })
        successCount++
      } catch (err) {
        console.warn('⚠️  Statement warning:', err.message.substring(0, 100))
      }
    }
  }

  console.log(`✅ Executed ${successCount}/${statements.length} statements\n`)
}

// Migration 2: Seed AI prompts
console.log('📋 Migration 2: Seeding AI prompts (10 prompts)...\n')
const migration2 = readFileSync(
  './supabase/migrations/00049_seed_ai_prompts.sql',
  'utf8'
)

try {
  const { data: data2, error: error2 } = await supabase.rpc('exec', { sql: migration2 })

  if (error2) {
    console.error('❌ Migration 2 failed:', error2.message)
    process.exit(1)
  }

  console.log('✅ Migration 2 complete: AI prompts seeded\n')
} catch (e) {
  console.error('❌ Migration 2 error:', e.message)
  console.log('\n⚠️  Trying alternative method...\n')

  // Try splitting into smaller chunks
  const statements = migration2.split(';').filter(s => s.trim())
  let successCount = 0

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await supabase.rpc('exec', { sql: statement + ';' })
        successCount++
      } catch (err) {
        console.warn('⚠️  Statement warning:', err.message.substring(0, 100))
      }
    }
  }

  console.log(`✅ Executed ${successCount}/${statements.length} statements\n`)
}

// Verification
console.log('🔍 Verifying setup...\n')

// Check conversations table
const { data: convData, error: convError } = await supabase
  .from('conversations')
  .select('*')
  .limit(1)

if (convError) {
  console.error('❌ conversations table verification failed:', convError.message)
} else {
  console.log('✅ conversations table exists and is accessible')
}

// Check ai_prompts
const { data: promptsData, error: promptsError } = await supabase
  .from('ai_prompts')
  .select('prompt_type, version, name')
  .eq('is_active', true)

if (promptsError) {
  console.error('❌ ai_prompts verification failed:', promptsError.message)
} else {
  console.log(`✅ ai_prompts table contains ${promptsData.length} active prompts:\n`)
  promptsData.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.prompt_type} ${p.version})`)
  })
}

console.log('\n=== DATABASE SETUP COMPLETE ===\n')
