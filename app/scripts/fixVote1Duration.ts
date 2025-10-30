import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://esplzaunxkehuankkwbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'
);

async function fixDuration() {
  console.log('🔧 Fixing Vote 1 duration...\n');

  // Get Vote 1 phase
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .ilike('name', '%Vote 1%')
    .eq('status', 'active');

  if (!phases || phases.length === 0) {
    console.log('❌ No active Vote 1 phase found');
    return;
  }

  const vote1 = phases[0];
  console.log('Found phase:', vote1.name);
  console.log('Current duration:', vote1.actual_duration_minutes || vote1.default_duration_minutes, 'minutes');
  console.log('Current started_at:', vote1.started_at);

  // Update to 10 minutes and reset started_at to NOW
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('phases')
    .update({
      actual_duration_minutes: 10,
      started_at: now
    })
    .eq('phase_id', vote1.phase_id);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('\n✅ Updated Vote 1:');
  console.log('   Duration: 10 minutes');
  console.log('   Started at:', now);
  console.log('   Timer should now show: 10:00');
}

fixDuration();
