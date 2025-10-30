import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://esplzaunxkehuankkwbx.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'

const supabase = createClient(supabaseUrl, serviceRoleKey)

console.log('\n=== AI CHARACTER PROTOTYPE - MANUAL MIGRATION ===\n')

// Since we can't execute DDL via Supabase client, let's use Management API
async function executeSQLViaManagementAPI(sql) {
  const projectRef = 'esplzaunxkehuankkwbx'

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  )

  return response
}

// Try Management API approach
console.log('Attempting to create conversations table via Management API...\n')

const createConversationsSQL = `
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  modality TEXT NOT NULL CHECK (modality IN ('text', 'voice', 'combined')),
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  elevenlabs_conversation_id TEXT,
  reflection_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  ai_context_version_before INTEGER,
  ai_context_version_after INTEGER,
  total_messages INTEGER,
  avg_response_time_seconds DECIMAL(5,2),
  total_tokens_used INTEGER,
  estimated_cost_usd DECIMAL(10,4),
  scenario_injected JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

try {
  const response = await executeSQLViaManagementAPI(createConversationsSQL)
  const result = await response.text()

  if (response.ok) {
    console.log('✅ conversations table created via Management API\n')
  } else {
    console.log('Management API response:', result.substring(0, 200))
    console.log('\nManagement API approach not available.\n')
  }
} catch (e) {
  console.log('Management API not accessible:', e.message, '\n')
}

// Final check - can we access the tables?
console.log('🔍 Final verification...\n')

// Check conversations
try {
  const { error: convError } = await supabase
    .from('conversations')
    .select('conversation_id')
    .limit(0)

  if (convError) {
    console.log('❌ conversations table: NOT accessible')
    console.log(`   Error: ${convError.message}\n`)
  } else {
    console.log('✅ conversations table: ACCESSIBLE\n')
  }
} catch (e) {
  console.log('❌ conversations table: ERROR -', e.message, '\n')
}

// Check ai_prompts
try {
  const { data, error: promptError, count } = await supabase
    .from('ai_prompts')
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  if (promptError) {
    console.log('❌ ai_prompts table: ERROR')
    console.log(`   ${promptError.message}\n`)
  } else {
    console.log(`✅ ai_prompts table: ACCESSIBLE (${count || 0} active prompts)\n`)
  }
} catch (e) {
  console.log('❌ ai_prompts table: ERROR -', e.message, '\n')
}

console.log('=== RECOMMENDATION ===\n')
console.log('Since automatic execution is not possible via API, please run manually:')
console.log('\n1. Open Supabase SQL Editor:')
console.log('   https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql')
console.log('\n2. Copy and execute:')
console.log('   - supabase/migrations/00048_create_conversations_table.sql')
console.log('   - supabase/migrations/00049_seed_ai_prompts.sql')
console.log('\nThis will take ~2 minutes.\n')
