/**
 * Diagnostic Script: Check Vote Sessions
 *
 * This script checks:
 * 1. All vote sessions for the current simulation
 * 2. Their status, scope, and scope_clan_id
 * 3. All clans in the simulation
 * 4. All roles and their clan assignments
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseVoting() {
  console.log('🔍 VOTE SESSIONS DIAGNOSTIC')
  console.log('='.repeat(80))

  // Get the most recent simulation
  const { data: simulations, error: simError } = await supabase
    .from('sim_runs')
    .select('run_id, run_name, status, current_phase_id')
    .order('created_at', { ascending: false })
    .limit(1)

  if (simError || !simulations || simulations.length === 0) {
    console.error('❌ No simulations found')
    return
  }

  const sim = simulations[0]
  console.log(`\n📋 Simulation: ${sim.run_name} (${sim.run_id})`)
  console.log(`   Status: ${sim.status}`)
  console.log(`   Current Phase: ${sim.current_phase_id || 'None'}`)

  // Get current phase details
  if (sim.current_phase_id) {
    const { data: phase } = await supabase
      .from('phases')
      .select('*')
      .eq('phase_id', sim.current_phase_id)
      .single()

    if (phase) {
      console.log(`   Phase Name: ${phase.name}`)
      console.log(`   Phase Status: ${phase.status}`)
    }
  }

  // Get all clans for this simulation
  const { data: clans } = await supabase
    .from('clans')
    .select('*')
    .eq('run_id', sim.run_id)
    .order('sequence_number')

  console.log(`\n🏛️  CLANS (${clans?.length || 0}):`)
  if (clans) {
    for (const clan of clans) {
      console.log(`   ${clan.name} (${clan.clan_id})`)
    }
  }

  // Get all roles for this simulation
  const { data: roles } = await supabase
    .from('roles')
    .select('role_id, name, clan_id, participant_type, assigned_user_id')
    .eq('run_id', sim.run_id)

  console.log(`\n👥 ROLES (${roles?.length || 0}):`)
  if (roles && clans) {
    for (const clan of clans) {
      const clanRoles = roles.filter(r => r.clan_id === clan.clan_id)
      const humanRoles = clanRoles.filter(r => r.participant_type === 'human')
      const assignedRoles = humanRoles.filter(r => r.assigned_user_id !== null)

      console.log(`   ${clan.name}: ${humanRoles.length} human roles (${assignedRoles.length} assigned)`)

      for (const role of humanRoles) {
        const status = role.assigned_user_id ? '✅ assigned' : '⚠️  unassigned'
        console.log(`      - ${role.name} (${role.role_id}) ${status}`)
      }
    }
  }

  // Get all vote sessions for this simulation
  const { data: sessions, error: sessionsError } = await supabase
    .from('vote_sessions')
    .select('*')
    .eq('run_id', sim.run_id)
    .order('created_at', { ascending: false })

  console.log(`\n🗳️  VOTE SESSIONS (${sessions?.length || 0}):`)

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError.message)
    return
  }

  if (!sessions || sessions.length === 0) {
    console.log('   No vote sessions found')
    return
  }

  for (const session of sessions) {
    console.log(`\n   📋 ${session.proposal_title}`)
    console.log(`      Session ID: ${session.session_id}`)
    console.log(`      Phase ID: ${session.phase_id}`)
    console.log(`      Status: ${session.status}`)
    console.log(`      Scope: ${session.scope}`)
    console.log(`      Scope Clan ID: ${session.scope_clan_id || 'null'}`)
    console.log(`      Vote Format: ${session.vote_format}`)
    console.log(`      Vote Type: ${session.vote_type}`)
    console.log(`      Transparency: ${session.transparency_level}`)
    console.log(`      Eligible Candidates: ${JSON.stringify(session.eligible_candidates)}`)
    console.log(`      Created: ${session.created_at}`)

    // If scope is clan_only, find the clan
    if (session.scope === 'clan_only' && session.scope_clan_id && clans) {
      const clan = clans.find(c => c.clan_id === session.scope_clan_id)
      if (clan) {
        console.log(`      👉 Clan: ${clan.name}`)

        // Check if any roles match this clan
        if (roles) {
          const eligibleVoters = roles.filter(r =>
            r.clan_id === session.scope_clan_id &&
            r.participant_type === 'human' &&
            r.assigned_user_id !== null
          )
          console.log(`      👉 Eligible Voters: ${eligibleVoters.length}`)
          for (const voter of eligibleVoters) {
            console.log(`         - ${voter.name}`)
          }
        }
      }
    }

    // Get votes for this session
    const { data: votes, count } = await supabase
      .from('votes')
      .select('*', { count: 'exact' })
      .eq('session_id', session.session_id)

    console.log(`      Votes Cast: ${count || 0}`)

    if (votes && votes.length > 0) {
      console.log(`      Vote Details:`)
      for (const vote of votes) {
        const voter = roles?.find(r => r.role_id === vote.voter_role_id)
        const chosen = roles?.find(r => r.role_id === vote.chosen_role_id)
        console.log(`         - ${voter?.name || 'Unknown'} voted for ${chosen?.name || vote.yes_no_choice || 'Unknown'}`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Diagnostic complete')
}

diagnoseVoting().catch(console.error)
