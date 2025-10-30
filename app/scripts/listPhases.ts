import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function listPhases() {
  const { data } = await supabase
    .from('phases')
    .select('sequence_number, name, status')
    .order('sequence_number');

  console.log('All phases:');
  data?.forEach(p => console.log(`${p.sequence_number}: ${p.name} - ${p.status}`));
}

listPhases();
