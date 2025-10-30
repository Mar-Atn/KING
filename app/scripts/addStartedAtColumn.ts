import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addColumn() {
  console.log('🔧 Adding started_at column to vote_sessions table...')

  try {
    // Use raw SQL via RPC or direct query
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE vote_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;'
    })

    if (error) {
      console.log('RPC method failed, trying direct approach...')

      // Try a different approach - insert a dummy row to test connection
      const { error: testError } = await supabase
        .from('vote_sessions')
        .select('session_id')
        .limit(1)

      if (testError) {
        throw new Error('Cannot connect to database: ' + testError.message)
      }

      console.error('❌ Cannot execute DDL via client. SQL must be run in Supabase dashboard.')
      console.log('\n📋 Please run this SQL in Supabase dashboard:')
      console.log('   https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql/new')
      console.log('\n   ALTER TABLE vote_sessions ADD COLUMN started_at TIMESTAMPTZ;\n')
    } else {
      console.log('✅ Column added successfully!', data)
    }
  } catch (err) {
    console.error('❌ Error:', err)
    console.log('\n📋 Please run this SQL manually in Supabase dashboard:')
    console.log('   https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql/new')
    console.log('\n   ALTER TABLE vote_sessions ADD COLUMN started_at TIMESTAMPTZ;\n')
  }
}

addColumn()
