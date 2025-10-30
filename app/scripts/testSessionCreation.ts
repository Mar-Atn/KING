import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSessionCreation() {
  console.log('🧪 Testing vote session creation...\n')

  // Get the simulation we're working with
  const runId = '768e8ca3-646b-43dd-9111-1794d5a478be'
  const phaseId = 'd3d42be9-18f7-4966-87e7-33629cb8187b'

  // Get clans and roles
  const { data: clans } = await supabase
    .from('clans')
    .select('*')
    .eq('run_id', runId)

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('run_id', runId)

  if (!clans || clans.length === 0) {
    console.error('❌ No clans found')
    return
  }

  console.log(`✅ Found ${clans.length} clans`)
  console.log(`✅ Found ${roles?.length || 0} roles\n`)

  // Delete existing test sessions
  console.log('🧹 Cleaning up existing sessions...')
  const { error: deleteError } = await supabase
    .from('vote_sessions')
    .delete()
    .eq('run_id', runId)
    .eq('phase_id', phaseId)

  if (deleteError) {
    console.error('❌ Delete error:', deleteError)
  } else {
    console.log('✅ Cleaned up old sessions\n')
  }

  // Try to create a session for each clan
  console.log('🗳️  Creating test sessions...\n')

  for (const clan of clans) {
    const clanMembers = roles?.filter(r => r.clan_id === clan.clan_id && r.participant_type === 'human') || []

    if (clanMembers.length === 0) {
      console.log(`⏭️  Skipping ${clan.name} (no human participants)`)
      continue
    }

    console.log(`📝 Creating session for ${clan.name}...`)
    console.log(`   Members: ${clanMembers.map(r => r.name).join(', ')}`)

    const sessionData = {
      run_id: runId,
      phase_id: phaseId,
      proposal_title: `${clan.name} Nomination`,
      proposal_description: `Choose your clan's nominee for King`,
      vote_format: 'choose_person',
      vote_type: 'clan_nomination',
      scope: 'clan_only',
      scope_clan_id: clan.clan_id,
      eligible_candidates: clanMembers.map(r => r.role_id),
      transparency_level: 'secret',
      status: 'open'
    }

    console.log('   Data:', JSON.stringify(sessionData, null, 2))

    const { data, error } = await supabase
      .from('vote_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error(`❌ Failed to create ${clan.name} session:`, error.message)
      console.error('   Details:', error)
    } else {
      console.log(`✅ Created session: ${data.session_id}`)
    }
    console.log()
  }

  // Verify sessions were created
  console.log('\n🔍 Verifying created sessions...')
  const { data: sessions, error: fetchError } = await supabase
    .from('vote_sessions')
    .select('*')
    .eq('run_id', runId)
    .eq('phase_id', phaseId)

  if (fetchError) {
    console.error('❌ Fetch error:', fetchError)
  } else {
    console.log(`\n✅ Found ${sessions?.length || 0} sessions in database:`)
    sessions?.forEach(s => {
      console.log(`   • ${s.proposal_title}`)
      console.log(`     Status: ${s.status}`)
      console.log(`     Type: ${s.vote_type}`)
      console.log(`     Transparency: ${s.transparency_level}`)
      console.log(`     Scope: ${s.scope} (clan: ${s.scope_clan_id?.substring(0, 8)}...)`)
      console.log(`     Candidates: ${s.eligible_candidates?.length || 0}`)
      console.log()
    })
  }

  console.log('✅ Test complete!')
}

testSessionCreation().catch(console.error)
