import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function checkSchema() {
  console.log('🔍 Checking vote_results schema...\n')

  // Try to select from vote_results to see what columns exist
  const { data, error } = await supabase
    .from('vote_results')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error querying vote_results:', error.message)
    console.error('Details:', error)
  } else {
    console.log('✅ Query successful')
    console.log('Sample data:', data)
    if (data && data.length > 0) {
      console.log('\n📋 Columns found:')
      Object.keys(data[0]).forEach(col => console.log(`  - ${col}`))
    } else {
      console.log('⚠️  Table is empty, cannot determine columns from data')
    }
  }

  // Try inserting with old schema (what the code currently uses)
  console.log('\n\n🧪 Testing insert with current code schema...')
  const { error: insertError } = await supabase
    .from('vote_results')
    .insert({
      session_id: '00000000-0000-0000-0000-000000000000',
      winning_role_id: '00000000-0000-0000-0000-000000000001',
      total_votes_cast: 5,
      calculated_at: new Date().toISOString()
    })

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message)
    console.error('Details:', insertError)
  } else {
    console.log('✅ Insert successful (unexpected!)')
  }

  // Try inserting with results_data schema
  console.log('\n\n🧪 Testing insert with results_data schema...')
  const { error: insertError2 } = await supabase
    .from('vote_results')
    .insert({
      session_id: '00000000-0000-0000-0000-000000000000',
      results_data: {
        winner: { role_id: '123', name: 'Test', vote_count: 5, percentage: 100 },
        total_votes: 5
      },
      calculated_at: new Date().toISOString()
    })

  if (insertError2) {
    console.error('❌ Insert failed:', insertError2.message)
    console.error('Details:', insertError2)
  } else {
    console.log('✅ Insert successful!')
  }
}

checkSchema()
