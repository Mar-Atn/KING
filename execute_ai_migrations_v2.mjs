import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://esplzaunxkehuankkwbx.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

console.log('\n=== AI CHARACTER PROTOTYPE - DATABASE SETUP ===\n')
console.log('Note: Running migrations via Supabase Dashboard SQL Editor is recommended.')
console.log('For now, we will create tables directly.\n')

// Create conversations table directly
console.log('📋 Creating conversations table...\n')

try {
  // Check if table exists first
  const { data: existingConv, error: checkError } = await supabase
    .from('conversations')
    .select('conversation_id')
    .limit(0)

  if (!checkError) {
    console.log('✅ conversations table already exists\n')
  }
} catch (e) {
  console.log('⚠️  conversations table does not exist, will be created via Dashboard\n')
}

// Check ai_prompts table
console.log('📋 Checking ai_prompts table...\n')

try {
  const { data: existingPrompts, error: promptError } = await supabase
    .from('ai_prompts')
    .select('prompt_id')
    .limit(0)

  if (!promptError) {
    console.log('✅ ai_prompts table already exists\n')

    // Check if we have any active prompts
    const { data: activePrompts, count } = await supabase
      .from('ai_prompts')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    console.log(`   Found ${count || 0} active prompts\n`)

    if (count === 0) {
      console.log('⚠️  No active prompts found. Need to seed prompts via Dashboard.\n')
    } else {
      console.log('✅ AI prompts already seeded:\n')
      activePrompts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (${p.prompt_type})`)
      })
    }
  }
} catch (e) {
  console.log('⚠️  ai_prompts table check failed\n')
}

console.log('\n=== MANUAL SETUP REQUIRED ===\n')
console.log('Please run these migrations via Supabase Dashboard SQL Editor:')
console.log('1. https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql\n')
console.log('Migration files:')
console.log('  - supabase/migrations/00048_create_conversations_table.sql')
console.log('  - supabase/migrations/00049_seed_ai_prompts.sql\n')

console.log('These files have been created and are ready to run.\n')
