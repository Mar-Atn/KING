import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkPhaseData() {
  console.log('🔍 Checking phase data from database...\n');

  // Get latest simulation
  const { data: sims } = await supabase
    .from('sim_runs')
    .select('run_id, title')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!sims || sims.length === 0) {
    console.log('❌ No simulations found');
    return;
  }

  const runId = sims[0].run_id;
  console.log('✓ Latest simulation:', sims[0].title);
  console.log('  Run ID:', runId, '\n');

  // Get all phases for this simulation
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', runId)
    .order('sequence_number');

  if (!phases || phases.length === 0) {
    console.log('❌ No phases found');
    return;
  }

  console.log('📋 All phases:\n');
  phases.forEach(phase => {
    const icon = phase.status === 'active' ? '▶️' :
                 phase.status === 'completed' ? '✅' :
                 phase.status === 'paused' ? '⏸️' : '⏳';

    console.log(`${icon} [${phase.sequence_number}] ${phase.name}`);
    console.log(`   Status: ${phase.status}`);
    console.log(`   Phase ID: ${phase.phase_id.substring(0, 8)}...`);

    if (phase.started_at) {
      const startedAt = new Date(phase.started_at);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const elapsedHours = Math.floor(elapsedSeconds / 3600);
      const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);

      console.log(`   Started at: ${phase.started_at}`);
      console.log(`   Time elapsed: ${elapsedHours}h ${elapsedMinutes}m (${elapsedSeconds}s total)`);

      const duration = phase.actual_duration_minutes || phase.default_duration_minutes;
      const durationSeconds = duration * 60;
      const remainingSeconds = durationSeconds - elapsedSeconds;

      if (phase.status === 'active') {
        console.log(`   Duration: ${duration} minutes (${durationSeconds}s)`);
        console.log(`   Remaining: ${formatTime(Math.abs(remainingSeconds))} ${remainingSeconds < 0 ? '(OVERTIME)' : ''}`);
      }
    }

    if (phase.ended_at) {
      console.log(`   Ended at: ${phase.ended_at}`);
    }

    console.log('');
  });

  // Check for database triggers
  console.log('\n🔧 Checking for triggers on phases table...');
  const { data: triggers } = await supabase.rpc('pg_get_triggerdef', { oid: 0 } as any).single();
  console.log('(Trigger check via RPC not available through anon key)');
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

checkPhaseData();
