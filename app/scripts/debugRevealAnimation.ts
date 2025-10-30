/**
 * Debug Script: Reveal Animation Not Working
 *
 * Run this to check database state and diagnose why reveal isn't showing
 *
 * Usage:
 * VITE_SUPABASE_URL=https://esplzaunxkehuankkwbx.supabase.co \
 * VITE_SUPABASE_ANON_KEY=... \
 * npx tsx scripts/debugRevealAnimation.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugReveal() {
  console.log('🔍 Debugging Reveal Animation\n')
  console.log('=' .repeat(80))

  // 1. Get active simulation
  const { data: sims, error: simError } = await supabase
    .from('sim_runs')
    .select('run_id, run_name, status, current_phase_id')
    .eq('status', 'active')
    .limit(1)

  if (simError || !sims || sims.length === 0) {
    console.log('❌ No active simulation found')
    return
  }

  const sim = sims[0]
  console.log(`✅ Found active simulation: ${sim.run_name} (${sim.run_id})`)
  console.log(`   Current phase: ${sim.current_phase_id}\n`)

  // 2. Get all vote sessions for this simulation
  const { data: sessions, error: sessError } = await supabase
    .from('vote_sessions')
    .select('*')
    .eq('run_id', sim.run_id)
    .order('created_at', { ascending: false })

  if (sessError) {
    console.error('❌ Error fetching sessions:', sessError)
    return
  }

  console.log(`\n📊 Found ${sessions?.length || 0} vote sessions:\n`)

  if (!sessions || sessions.length === 0) {
    console.log('   No sessions found for this simulation')
    return
  }

  for (const session of sessions) {
    console.log(`Session: ${session.proposal_title}`)
    console.log(`  ID: ${session.session_id}`)
    console.log(`  Status: ${session.status}`)
    console.log(`  Created: ${session.created_at}`)
    console.log(`  Started: ${session.started_at}`)
    console.log(`  Closed: ${session.closed_at}`)
    console.log(`  Announced: ${session.announced_at}`)
    console.log(`  Vote type: ${session.vote_type}`)
    console.log(`  Scope: ${session.scope}`)

    // Check if there are votes
    const { count: voteCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.session_id)

    console.log(`  Votes cast: ${voteCount || 0}`)

    // Check if there are results
    const { data: result } = await supabase
      .from('vote_results')
      .select('*')
      .eq('session_id', session.session_id)
      .single()

    if (result) {
      console.log(`  ✅ Result exists:`)
      console.log(`     Winner role ID: ${result.winning_role_id}`)
      console.log(`     Total votes: ${result.total_votes_cast}`)
      console.log(`     Calculated: ${result.calculated_at}`)
    } else {
      console.log(`  ⚠️  No result record`)
    }

    console.log()
  }

  // 3. Check for announced sessions
  const announcedSessions = sessions.filter(s => s.status === 'announced')
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📣 Announced sessions: ${announcedSessions.length}`)

  if (announcedSessions.length > 0) {
    console.log(`\n✅ These should trigger reveal animation:\n`)
    for (const session of announcedSessions) {
      console.log(`  - ${session.proposal_title}`)
      console.log(`    Announced at: ${session.announced_at}`)
      console.log(`    Scope: ${session.scope} ${session.scope_clan_id ? `(Clan: ${session.scope_clan_id})` : ''}`)
    }
  } else {
    console.log(`\n❌ No announced sessions found!`)
    console.log(`   Reveal animation requires sessions with status='announced'`)
  }

  // 4. Check localStorage (simulated - need browser)
  console.log(`\n${'='.repeat(80)}`)
  console.log(`💾 LocalStorage Check:`)
  console.log(`   (Run in browser console to check actual localStorage)`)
  console.log(`   Key format: revealed_{runId}_{session_ids}`)
  console.log(`   Example key: revealed_${sim.run_id}_${announcedSessions.map(s => s.session_id).join('_')}`)

  // 5. Recommendations
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔧 Debugging Steps:\n`)

  if (announcedSessions.length === 0) {
    console.log(`1. ❌ NO ANNOUNCED SESSIONS`)
    console.log(`   → Click "Reveal Results" button in facilitator dashboard`)
    console.log(`   → This will update sessions to status='announced'`)
  } else {
    console.log(`1. ✅ Announced sessions exist`)
    console.log(`   → Check browser console for "[Reveal Detection]" logs`)
    console.log(`   → Look for errors in fetching results or roles`)
  }

  console.log(`\n2. Check Real-time Subscription:`)
  console.log(`   → Open browser console`)
  console.log(`   → Look for "📡 Vote sessions subscription status" log`)
  console.log(`   → Should see "SUBSCRIBED"`)

  console.log(`\n3. Check localStorage:`)
  console.log(`   → Open browser dev tools → Application → Local Storage`)
  console.log(`   → Look for keys starting with "revealed_"`)
  console.log(`   → If found, clear them to allow reveal to show again`)

  console.log(`\n4. Check participant logs:`)
  console.log(`   → Open participant browser console`)
  console.log(`   → Look for "🔍 [Reveal Detection]" logs`)
  console.log(`   → Should show session status checks`)

  console.log(`\n5. Manual test:`)
  console.log(`   → In browser console, run:`)
  console.log(`     localStorage.clear()`)
  console.log(`   → Then trigger reveal again from facilitator`)

  console.log(`\n${'='.repeat(80)}`)
}

debugReveal().catch(console.error)
