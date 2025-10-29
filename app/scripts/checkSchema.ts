import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('Checking database schema for new fields...\n')

  // Check for elevenlabs_agent_id in roles table
  const { data: rolesColumns, error: rolesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'roles'
      AND column_name = 'elevenlabs_agent_id'
    `
  }).single()

  if (rolesError) {
    console.log('❌ Could not check roles table:', rolesError.message)
    console.log('   Using alternative method...\n')

    // Alternative: just try to select from roles
    const { data: testRole, error: testError } = await supabase
      .from('roles')
      .select('role_id, role_name, elevenlabs_agent_id')
      .limit(1)
      .single()

    if (testError && testError.message.includes('elevenlabs_agent_id')) {
      console.log('❌ elevenlabs_agent_id column does NOT exist in roles table')
    } else {
      console.log('✅ elevenlabs_agent_id column EXISTS in roles table')
    }
  } else {
    console.log('✅ elevenlabs_agent_id column exists in roles table')
    console.log('   Details:', rolesColumns)
  }

  // Check for meeting_messages table
  const { data: tableCheck, error: tableError } = await supabase
    .from('meeting_messages')
    .select('message_id')
    .limit(0)

  if (tableError) {
    if (tableError.message.includes('does not exist')) {
      console.log('❌ meeting_messages table does NOT exist')
    } else {
      console.log('⚠️  Could not check meeting_messages table:', tableError.message)
    }
  } else {
    console.log('✅ meeting_messages table EXISTS')

    // Check for channel field
    const { error: channelError } = await supabase
      .from('meeting_messages')
      .select('channel')
      .limit(0)

    if (channelError) {
      console.log('   ❌ channel column does NOT exist')
    } else {
      console.log('   ✅ channel column EXISTS')
    }
  }

  console.log('\nSchema check complete!')
}

checkSchema().catch(console.error)
