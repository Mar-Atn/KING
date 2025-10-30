import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkPhaseTimer() {
  console.log('🔍 Checking phase timer data...\n');

  // Get active phase
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .eq('status', 'active')
    .order('sequence_number');

  if (!phases || phases.length === 0) {
    console.log('❌ No active phases found');
    return;
  }

  const activePhase = phases[0];
  console.log('✓ Active phase:', activePhase.name);
  console.log('  Phase ID:', activePhase.phase_id);
  console.log('  Status:', activePhase.status);
  console.log('  Started at:', activePhase.started_at);
  console.log('  Duration (minutes):', activePhase.actual_duration_minutes || activePhase.default_duration_minutes);

  if (activePhase.started_at) {
    const startedAt = new Date(activePhase.started_at);
    const now = new Date();
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const elapsedHours = Math.floor(elapsedMinutes / 60);

    console.log('\n⏱️  Time calculations:');
    console.log('  Started at:', startedAt.toISOString());
    console.log('  Current time:', now.toISOString());
    console.log('  Elapsed:', `${elapsedHours}h ${elapsedMinutes % 60}m ${elapsedSeconds % 60}s`);
    console.log('  Elapsed (total seconds):', elapsedSeconds);

    const durationMinutes = activePhase.actual_duration_minutes || activePhase.default_duration_minutes;
    const durationSeconds = durationMinutes * 60;
    const remainingSeconds = durationSeconds - elapsedSeconds;

    console.log('\n📊 Timer display calculation:');
    console.log('  Duration (seconds):', durationSeconds);
    console.log('  Remaining (seconds):', remainingSeconds);
    console.log('  Remaining (formatted):', formatTime(Math.abs(remainingSeconds)));
    if (remainingSeconds < 0) {
      console.log('  Status: ⚠️ OVERTIME by', formatTime(Math.abs(remainingSeconds)));
    } else {
      console.log('  Status: ✓ Active');
    }
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

checkPhaseTimer();
