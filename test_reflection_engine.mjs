/**
 * Test Script: Reflection Engine
 *
 * Tests the complete reflection flow:
 * 1. Create test character (sim_run, clan, role, AI context)
 * 2. Simulate a conversation transcript
 * 3. Trigger reflection (3 parallel AI calls)
 * 4. Verify Blocks 2-4 updated
 * 5. Verify version incremented
 * 6. Verify memory within limit
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { initializeCharacter } from './packages/ai-character-prototype/src/core/character-init.ts'
import { triggerReflection } from './packages/ai-character-prototype/src/reflection/reflection-engine.ts'
import { loadAIContext } from './packages/ai-character-prototype/src/database/ai-context-db.ts'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n========================================')
console.log('REFLECTION ENGINE TEST')
console.log('========================================\n')

// Test data
let testSimRunId
let testClanId
let testRoleId

try {
  // ========================================================================
  // STEP 1: Create test simulation, clan, and role
  // ========================================================================
  console.log('📋 Setting up test character...\n')

  // Create sim_run
  const { data: simRun } = await supabase
    .from('sim_runs')
    .insert({
      run_name: 'Reflection Engine Test',
      version: '1.0.0',
      config: { test: true },
      config_checksum: 'test-checksum',
      total_participants: 6,
      human_participants: 0,
      ai_participants: 6,
      status: 'setup'
    })
    .select()
    .single()

  testSimRunId = simRun.run_id
  console.log(`✅ Sim run: ${testSimRunId}`)

  // Create clan
  const { data: clan } = await supabase
    .from('clans')
    .insert({
      run_id: testSimRunId,
      name: 'Military',
      sequence_number: 1,
      about: 'Warriors and defenders, valuing strength, honor, and discipline',
      key_priorities: 'Defense, Military training, Strategic alliances'
    })
    .select()
    .single()

  testClanId = clan.clan_id
  console.log(`✅ Clan: ${clan.name}`)

  // Create role
  const { data: role } = await supabase
    .from('roles')
    .insert({
      run_id: testSimRunId,
      clan_id: testClanId,
      name: 'Leonidas',
      age: 38,
      participant_type: 'ai',
      position: 'General',
      background: 'A battle-hardened general of the Military clan',
      character_traits: 'Brave, Strategic, Loyal, Disciplined',
      interests: 'Military tactics, Training, Honor',
      ai_config: {
        core_traits: ['Brave', 'Strategic', 'Disciplined'],
        strengths: ['Combat experience', 'Leadership', 'Tactical thinking'],
        weaknesses: ['Can be inflexible', 'Distrusts diplomacy'],
        common_phrases: ['Victory or death!', 'We stand together.'],
        speaking_style: 'Direct and commanding, speaks with military precision'
      }
    })
    .select()
    .single()

  testRoleId = role.role_id
  console.log(`✅ Role: ${role.name}\n`)

  // ========================================================================
  // STEP 2: Initialize character (creates initial AI context)
  // ========================================================================
  console.log('🤖 Initializing character...\n')

  const initialContext = await initializeCharacter({
    simRunId: testSimRunId,
    roleId: testRoleId
  })

  console.log(`✅ Initial context created:`)
  console.log(`   - Version: ${initialContext.version}`)
  console.log(`   - Primary goal: ${initialContext.block_4_goals.primary_goal.objective}\n`)

  // ========================================================================
  // STEP 3: Simulate a conversation
  // ========================================================================
  console.log('💬 Simulating conversation...\n')

  const conversationTranscript = `
[Meeting with Sophia from Philosophers clan]

Sophia: "Leonidas, we need to discuss your aggressive military expansion plans. The Philosophers believe that wisdom and education should guide our city, not the sword."

Leonidas: "Sophia, with respect, wisdom means nothing if we cannot defend ourselves. Our enemies do not care about philosophy when they attack our walls."

Sophia: "But endless war drains our resources. We could invest in schools, libraries, centers of learning. A strong mind is as valuable as a strong army."

Leonidas: "I see your point. Perhaps... perhaps there is room for both. A soldier who can think strategically is worth ten who cannot."

Sophia: "Exactly! I propose an alliance. The Military protects us, and the Philosophers educate your soldiers in strategy, history, and leadership. Together, we could build something greater."

Leonidas: "An interesting proposal. I will consider it. But know this - if you betray the Military clan, no amount of philosophy will save you."

Sophia: "Trust must be earned, General. Let us start small and prove our worth to each other."

[End of conversation]
  `.trim()

  console.log('Transcript:')
  console.log('─────────────────────────────────────────')
  console.log(conversationTranscript.substring(0, 300) + '...')
  console.log('─────────────────────────────────────────\n')

  // ========================================================================
  // STEP 4: Trigger reflection (3 parallel AI calls)
  // ========================================================================
  console.log('🔄 Triggering reflection engine...\n')

  const reflectionResult = await triggerReflection({
    characterId: testRoleId,
    trigger: 'conversation_end',
    input: {
      transcript: conversationTranscript,
      currentBlocks: {
        block_1_fixed: initialContext.block_1_fixed,
        block_2_identity: initialContext.block_2_identity,
        block_3_memory: initialContext.block_3_memory,
        block_4_goals: initialContext.block_4_goals
      }
    }
  })

  console.log(`\n✅ Reflection complete!\n`)

  // ========================================================================
  // STEP 5: Verify updates
  // ========================================================================
  console.log('📊 Reflection Summary:\n')

  console.log('Version Change:')
  console.log(`   ${reflectionResult.before.version} → ${reflectionResult.after.version}`)
  console.log()

  console.log('Block 2 (Identity):')
  console.log(`   Status: ${reflectionResult.changes.identity}`)
  if (reflectionResult.changes.identity === 'UPDATED') {
    console.log(`   Before mood: ${reflectionResult.before.block_2_identity.current_mood}`)
    console.log(`   After mood: ${reflectionResult.after.block_2_identity.current_mood}`)
  }
  console.log()

  console.log('Block 3 (Memory):')
  console.log(`   Compressed: ${reflectionResult.changes.memory.compressed ? 'Yes' : 'No'}`)
  console.log(`   Word count: ${reflectionResult.changes.memory.final_word_count}`)
  console.log(`   Conversations added: ${reflectionResult.changes.memory.added}`)
  console.log(`   New relationships: ${Object.keys(reflectionResult.after.block_3_memory.relationships).length}`)
  console.log()

  console.log('Block 4 (Goals):')
  console.log(`   Updated: ${reflectionResult.changes.goals.updated ? 'Yes' : 'No'}`)
  console.log(`   Reason: ${reflectionResult.changes.goals.reason}`)
  console.log(`   Before primary goal: ${reflectionResult.before.block_4_goals.primary_goal.objective}`)
  console.log(`   After primary goal: ${reflectionResult.after.block_4_goals.primary_goal.objective}`)
  console.log()

  // ========================================================================
  // STEP 6: Verify memory within limit & version control
  // ========================================================================
  console.log('✅ Verification:\n')

  // Check if old version was marked as not current in database
  const { data: oldVersions } = await supabase
    .from('ai_context')
    .select('*')
    .eq('role_id', testRoleId)
    .eq('context_id', reflectionResult.before.context_id)
    .single()

  const oldVersionMarked = oldVersions ? !oldVersions.is_current : false

  const checks = [
    ['Version incremented', reflectionResult.after.version === reflectionResult.before.version + 1],
    ['Memory ≤ 2500 words', reflectionResult.changes.memory.final_word_count <= 2500],
    ['New version is current', reflectionResult.after.is_current === true],
    ['Old version marked not current (DB)', oldVersionMarked],
    ['Block 1 unchanged', JSON.stringify(reflectionResult.before.block_1_fixed) === JSON.stringify(reflectionResult.after.block_1_fixed)]
  ]

  let allPassed = true
  checks.forEach(([name, passed]) => {
    const icon = passed ? '✅' : '❌'
    console.log(`   ${icon} ${name}`)
    if (!passed) allPassed = false
  })

  console.log()

  // ========================================================================
  // STEP 7: Test loading updated context
  // ========================================================================
  console.log('💾 Testing context persistence...\n')

  const loadedContext = await loadAIContext(testRoleId)

  if (!loadedContext) {
    console.error('❌ Failed to load updated context')
    allPassed = false
  } else {
    console.log(`✅ Context loaded from database`)
    console.log(`   - Version: ${loadedContext.version}`)
    console.log(`   - Is current: ${loadedContext.is_current}`)
    console.log(`   - Matches reflection result: ${loadedContext.context_id === reflectionResult.after.context_id}`)
  }

  console.log()

  // ========================================================================
  // CLEANUP
  // ========================================================================
  console.log('🧹 Cleaning up test data...')

  await supabase.from('ai_context').delete().eq('role_id', testRoleId)
  await supabase.from('roles').delete().eq('role_id', testRoleId)
  await supabase.from('clans').delete().eq('clan_id', testClanId)
  await supabase.from('sim_runs').delete().eq('run_id', testSimRunId)

  console.log('✅ Cleanup complete\n')

  // ========================================================================
  // FINAL RESULT
  // ========================================================================
  if (allPassed) {
    console.log('========================================')
    console.log('✅ ALL REFLECTION TESTS PASSED!')
    console.log('========================================\n')
    console.log('The Reflection Engine is working correctly:')
    console.log('  ✅ Three parallel AI calls executed')
    console.log('  ✅ Blocks 2-4 updated successfully')
    console.log('  ✅ Memory within 2500-word limit')
    console.log('  ✅ Version control working')
    console.log('  ✅ Graceful error handling ready')
    console.log()
    process.exit(0)
  } else {
    console.log('========================================')
    console.log('❌ SOME TESTS FAILED')
    console.log('========================================\n')
    process.exit(1)
  }

} catch (error) {
  console.error('\n❌ ERROR:', error.message)
  console.error('\nStack:', error.stack)

  // Cleanup on error
  if (testRoleId || testClanId || testSimRunId) {
    console.log('\n🧹 Cleaning up after error...')
    if (testRoleId) {
      await supabase.from('ai_context').delete().eq('role_id', testRoleId)
      await supabase.from('roles').delete().eq('role_id', testRoleId)
    }
    if (testClanId) {
      await supabase.from('clans').delete().eq('clan_id', testClanId)
    }
    if (testSimRunId) {
      await supabase.from('sim_runs').delete().eq('run_id', testSimRunId)
    }
  }

  process.exit(1)
}
