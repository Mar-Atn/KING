import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://esplzaunxkehuankkwbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'
)

console.log('Testing if exec function exists...\n')

const { data, error } = await supabase.rpc('exec', { sql: 'SELECT 1 as test' })

if (error) {
  console.log('❌ exec function does NOT exist')
  console.log('Error:', error.message, '\n')
  console.log('We need to create it first.\n')
  process.exit(1)
} else {
  console.log('✅ exec function EXISTS and is working!\n')
  process.exit(0)
}
