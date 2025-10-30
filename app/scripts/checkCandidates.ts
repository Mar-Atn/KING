import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkNominationResults() {
  console.log('🔍 Checking nomination phase results...\n');

  // Find nomination phase
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .ilike('name', '%nominate%')
    .order('sequence_number');

  console.log('Nomination phases found:', phases?.length);
  if (phases && phases.length > 0) {
    console.log('First nomination phase:', {
      name: phases[0].name,
      phase_id: phases[0].phase_id,
      status: phases[0].status
    });

    // Get sessions for this phase
    const { data: sessions } = await supabase
      .from('vote_sessions')
      .select('*')
      .eq('phase_id', phases[0].phase_id);

    console.log('\nVote sessions:', sessions?.length);
    sessions?.forEach(s => {
      console.log('  -', s.proposal_title, '- Status:', s.status);
    });

    // Get announced sessions
    const announcedSessions = sessions?.filter(s => s.status === 'announced') || [];
    console.log('\nAnnounced sessions:', announcedSessions.length);

    if (announcedSessions.length > 0) {
      // Get results
      const { data: results } = await supabase
        .from('vote_results')
        .select('*')
        .in('session_id', announcedSessions.map(s => s.session_id));

      console.log('\nVote results found:', results?.length);
      results?.forEach(r => {
        console.log('  Session:', r.session_id.substring(0, 8));
        console.log('  Winner role_id:', r.results_data?.winner?.role_id);
        console.log('  Winner name:', r.results_data?.winner?.name);
        console.log('');
      });

      // Try to extract winner role IDs
      const winnerRoleIds = results
        ?.map(r => r.results_data?.winner?.role_id)
        .filter(Boolean) as string[];

      console.log('Winner role IDs:', winnerRoleIds);

      if (winnerRoleIds && winnerRoleIds.length > 0) {
        // Get role details
        const { data: roles } = await supabase
          .from('roles')
          .select('*')
          .in('role_id', winnerRoleIds);

        console.log('\nNominees (candidates for Vote 1):');
        roles?.forEach(r => {
          console.log('  -', r.name, '-', r.title);
        });
      }
    }
  }
}

checkNominationResults();
