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

console.log('\n=== CREATING EXEC FUNCTION ===\n')

// Step 1: Create the exec function
const execFunctionSQL = readFileSync('./supabase/migrations/00047_create_exec_function.sql', 'utf8')

// Try to create exec function using raw SQL query
// We'll use a trick - use the Supabase REST API directly
const createExecResponse = await fetch(
  `${supabaseUrl}/rest/v1/rpc/exec`,
  {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql: execFunctionSQL })
  }
)

if (!createExecResponse.ok) {
  // Function might not exist yet, that's okay - we'll try alternative approach
  console.log('Note: exec function may not exist yet\n')

  // Let's try to create it using a SQL query via the PostgREST API
  // We need to use a different approach - create via SQL editor or use db/query endpoint
  console.log('Attempting to create exec function via direct SQL...\n')

  // Try using the database query endpoint
  const dbQueryResponse = await fetch(
    `${supabaseUrl}/rest/v1/rpc/query`,
    {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: execFunctionSQL
      })
    }
  )

  if (!dbQueryResponse.ok) {
    const error = await dbQueryResponse.text()
    console.log('Could not auto-create exec function:', error.substring(0, 150))
    console.log('\nManual step: Please create exec function first by running:')
    console.log('   supabase/migrations/00047_create_exec_function.sql\n')
    console.log('Then run this script again.\n')
    process.exit(1)
  }
}

console.log('✅ exec function ready\n')

// Step 2: Now use exec function to run migrations
console.log('=== RUNNING MIGRATIONS VIA EXEC ===\n')

// Migration 1: Create conversations table
console.log('📋 Migration 1: Creating conversations table...\n')
const migration1 = readFileSync('./supabase/migrations/00048_create_conversations_table.sql', 'utf8')

const { data: data1, error: error1 } = await supabase.rpc('exec', { sql: migration1 })

if (error1) {
  console.error('❌ Migration 1 failed:', error1.message)
  console.error('Details:', error1)
} else {
  console.log('✅ Migration 1 complete: conversations table created\n')
}

// Migration 2: Seed AI prompts
console.log('📋 Migration 2: Seeding AI prompts...\n')
const migration2 = readFileSync('./supabase/migrations/00049_seed_ai_prompts.sql', 'utf8')

const { data: data2, error: error2 } = await supabase.rpc('exec', { sql: migration2 })

if (error2) {
  console.error('❌ Migration 2 failed:', error2.message)
  console.error('Details:', error2)
} else {
  console.log('✅ Migration 2 complete: AI prompts seeded\n')
}

// Verification
console.log('=== VERIFICATION ===\n')

// Check conversations table
const { data: convData, error: convError } = await supabase
  .from('conversations')
  .select('*')
  .limit(1)

if (convError) {
  console.error('❌ conversations table:', convError.message)
} else {
  console.log('✅ conversations table is accessible')
}

// Check ai_prompts
const { data: promptsData, count, error: promptsError } = await supabase
  .from('ai_prompts')
  .select('prompt_type, version, name', { count: 'exact' })
  .eq('is_active', true)

if (promptsError) {
  console.error('❌ ai_prompts:', promptsError.message)
} else {
  console.log(`✅ ai_prompts table has ${count} active prompts:\n`)
  promptsData.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.prompt_type})`)
  })
}

console.log('\n=== MIGRATIONS COMPLETE ===\n')
