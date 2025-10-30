import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://esplzaunxkehuankkwbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'
)

console.log('Checking ai_prompts table schema...\n')

// Get the check constraint definition
const { data, error } = await supabase.rpc('exec', {
  sql: `
    SELECT constraint_name, check_clause
    FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
    AND constraint_name LIKE '%prompt_type%';
  `
})

if (error) {
  console.log('Trying alternative approach...\n')

  // Try to see what columns exist
  const { data: columns, error: colError } = await supabase.rpc('exec', {
    sql: `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'ai_prompts'
      ORDER BY ordinal_position;
    `
  })

  if (colError) {
    console.error('Could not retrieve schema:', colError)
  }
}

// Try to see existing data
const { data: existing, error: existError } = await supabase
  .from('ai_prompts')
  .select('*')
  .limit(5)

if (existError) {
  console.log('No existing prompts found (expected)\n')
} else if (existing && existing.length > 0) {
  console.log('Existing prompts:')
  console.log(existing)
}

console.log('\nLet me check the table definition directly...\n')

const { data: tableDef, error: tableError } = await supabase.rpc('exec', {
  sql: `
    SELECT
      pg_get_constraintdef(c.oid) as constraint_def,
      con.conname as constraint_name
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_constraint con ON con.oid = c.oid
    WHERE cl.relname = 'ai_prompts'
    AND c.contype = 'c';
  `
})

if (tableError) {
  console.log('Could not get constraint details')
}

console.log('\nDone')
