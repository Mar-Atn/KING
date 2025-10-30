import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://esplzaunxkehuankkwbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'
);

async function diagnose() {
  console.log('🔍 PHASE TIMING DIAGNOSTIC\n');
  console.log('Current time:', new Date().toISOString(), '\n');

  // Get latest simulation
  const { data: sims, error: simError } = await supabase
    .from('sim_runs')
    .select('run_id, run_name, current_phase_id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (simError) {
    console.error('❌ Error fetching simulation:', simError);
    return;
  }

  if (!sims || sims.length === 0) {
    console.log('❌ No simulations found');
    return;
  }

  const sim = sims[0];
  console.log('✓ Simulation:', sim.run_name);
  console.log('  Run ID:', sim.run_id);
  console.log('  Current phase ID:', sim.current_phase_id, '\n');

  // Get all phases
  const { data: phases, error: phasesError } = await supabase
    .from('phases')
    .select('*')
    .eq('run_id', sim.run_id)
    .order('sequence_number');

  if (phasesError) {
    console.error('❌ Error fetching phases:', phasesError);
    return;
  }

  if (!phases || phases.length === 0) {
    console.log('❌ No phases found');
    return;
  }

  // Find current phase
  const currentPhase = phases.find(p => p.phase_id === sim.current_phase_id);

  console.log('📋 ALL PHASES:\n');
  phases.forEach(phase => {
    const isCurrent = phase.phase_id === sim.current_phase_id;
    const icon = isCurrent ? '▶️ ' : phase.status === 'completed' ? '✅ ' : '⏳ ';

    console.log(`${icon}[${phase.sequence_number}] ${phase.name}`);
    console.log(`   Status: ${phase.status}`);

    if (phase.started_at) {
      const startedAt = new Date(phase.started_at);
      const now = new Date();
      const elapsedMs = now.getTime() - startedAt.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const elapsedHours = Math.floor(elapsedMinutes / 60);

      console.log(`   Started: ${phase.started_at}`);
      console.log(`   Elapsed: ${elapsedHours}h ${elapsedMinutes % 60}m ${elapsedSeconds % 60}s (${elapsedSeconds}s total)`);

      if (isCurrent) {
        const duration = phase.actual_duration_minutes || phase.default_duration_minutes;
        const durationSeconds = duration * 60;
        const remainingSeconds = durationSeconds - elapsedSeconds;

        console.log(`   Duration: ${duration} minutes (${durationSeconds}s)`);
        console.log(`   Remaining: ${formatTime(Math.abs(remainingSeconds))} ${remainingSeconds < 0 ? '⚠️ OVERTIME' : '✓'}`);

        if (remainingSeconds < 0) {
          const overtimeMinutes = Math.floor(Math.abs(remainingSeconds) / 60);
          console.log(`   ⚠️  Phase is ${overtimeMinutes} minutes overtime!`);
        }
      }
    } else {
      console.log(`   Started: (not started yet)`);
    }

    if (phase.ended_at) {
      console.log(`   Ended: ${phase.ended_at}`);
    }

    console.log('');
  });

  if (currentPhase) {
    console.log('\n🎯 CURRENT PHASE ANALYSIS:');
    console.log('Name:', currentPhase.name);
    console.log('Status:', currentPhase.status);

    if (!currentPhase.started_at) {
      console.log('❌ PROBLEM: Current phase has NO started_at timestamp!');
      console.log('   This will cause timer to show nothing or calculate incorrectly.');
    } else {
      const startedAt = new Date(currentPhase.started_at);
      const now = new Date();
      const ageMs = now.getTime() - startedAt.getTime();
      const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
      const ageDays = Math.floor(ageHours / 24);

      console.log('\nStarted timestamp:', currentPhase.started_at);
      console.log('Timestamp age:', ageDays, 'days', ageHours % 24, 'hours');

      if (ageDays > 0) {
        console.log(`\n❌ PROBLEM: started_at is ${ageDays} days old!`);
        console.log('   This timestamp was NOT updated when phase started.');
        console.log('   Expected: timestamp from last few minutes');
        console.log('   Actual: timestamp from', ageDays, 'days ago');
      } else if (ageHours > 1) {
        console.log(`\n⚠️  WARNING: started_at is ${ageHours} hours old!`);
        console.log('   Did this phase really start', ageHours, 'hours ago?');
      } else {
        console.log('\n✓ Timestamp looks recent (less than 1 hour old)');
      }
    }
  } else {
    console.log('\n❌ Current phase not found in phases table!');
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

diagnose().catch(console.error);
