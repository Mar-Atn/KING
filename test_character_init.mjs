/**
 * Test Script: Character Initialization
 *
 * Tests the complete character initialization flow:
 * 1. Create test sim_run
 * 2. Create test clan
 * 3. Create test role
 * 4. Initialize AI character
 * 5. Load AI context
 * 6. Build system prompt
 * 7. Verify all 4 blocks present
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { initializeCharacter } from './packages/ai-character-prototype/src/core/character-init.ts'
import { loadAIContext } from './packages/ai-character-prototype/src/database/ai-context-db.ts'
import { buildSystemPrompt } from './packages/ai-character-prototype/src/core/system-prompt.ts'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n========================================')
console.log('AI CHARACTER INITIALIZATION TEST')
console.log('========================================\n')

// Test data
let testSimRunId
let testClanId
let testRoleId
let testUserId = '00000000-0000-0000-0000-000000000000' // Fake UUID for test

try {
  // ========================================================================
  // STEP 1: Create test simulation
  // ========================================================================
  console.log('📋 Creating test simulation...')

  const { data: simRun, error: simRunError } = await supabase
    .from('sim_runs')
    .insert({
      run_name: 'AI Character Prototype Test',
      version: '1.0.0',
      config: {
        test: true,
        duration: '60 minutes'
      },
      config_checksum: 'test-checksum',
      total_participants: 6,
      human_participants: 0,
      ai_participants: 6,
      status: 'setup'
    })
    .select()
    .single()

  if (simRunError) {
    console.error('❌ Failed to create sim_run:', simRunError.message)
    process.exit(1)
  }

  testSimRunId = simRun.run_id
  console.log(`✅ Sim run created: ${testSimRunId}\n`)

  // ========================================================================
  // STEP 2: Create test clan
  // ========================================================================
  console.log('🏛️  Creating test clan...')

  const { data: clan, error: clanError } = await supabase
    .from('clans')
    .insert({
      run_id: testSimRunId,
      name: 'Philosophers',
      sequence_number: 1,
      about: 'Seekers of knowledge and truth, valuing reason and wisdom above all',
      key_priorities: 'Education, Libraries, Philosophy schools',
      color_hex: '#9333ea'
    })
    .select()
    .single()

  if (clanError) {
    console.error('❌ Failed to create clan:', clanError.message)
    process.exit(1)
  }

  testClanId = clan.clan_id
  console.log(`✅ Clan created: ${clan.name} (${testClanId})\n`)

  // ========================================================================
  // STEP 3: Create test role
  // ========================================================================
  console.log('👤 Creating test role...')

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({
      run_id: testSimRunId,
      clan_id: testClanId,
      name: 'Thales',
      age: 42,
      participant_type: 'ai',
      position: 'Senior Philosopher',
      background: 'A respected elder of the Philosophers clan, known for his wisdom and logical thinking',
      character_traits: 'Wise, Curious, Patient, Deep thinker, Good teacher',
      interests: 'Philosophy, Education, Debate, Reason',
      ai_config: {
        core_traits: ['Wise', 'Curious', 'Patient'],
        strengths: ['Deep thinker', 'Good teacher', 'Respected elder'],
        weaknesses: ['Can be abstract', 'Sometimes impractical'],
        common_phrases: ['As reason dictates...', 'Let us examine this logically...'],
        speaking_style: 'Thoughtful and measured, often poses questions rather than assertions'
      }
    })
    .select()
    .single()

  if (roleError) {
    console.error('❌ Failed to create role:', roleError.message)
    process.exit(1)
  }

  testRoleId = role.role_id
  console.log(`✅ Role created: ${role.name} (${testRoleId})\n`)

  // ========================================================================
  // STEP 4: Initialize AI Character
  // ========================================================================
  console.log('🤖 Initializing AI character...\n')

  const aiContext = await initializeCharacter({
    simRunId: testSimRunId,
    roleId: testRoleId
  })

  console.log(`\n✅ AI Context created:`)
  console.log(`   - Context ID: ${aiContext.context_id}`)
  console.log(`   - Version: ${aiContext.version}`)
  console.log(`   - Character: ${aiContext.block_2_identity.name}`)
  console.log(`   - Clan: ${aiContext.block_2_identity.clan}`)
  console.log(`   - Primary Goal: ${aiContext.block_4_goals.primary_goal.objective}\n`)

  // ========================================================================
  // STEP 5: Load AI Context (verify persistence)
  // ========================================================================
  console.log('💾 Loading AI context from database...')

  const loadedContext = await loadAIContext(testRoleId)

  if (!loadedContext) {
    console.error('❌ Failed to load AI context from database')
    process.exit(1)
  }

  console.log(`✅ AI context loaded successfully`)
  console.log(`   - Is current: ${loadedContext.is_current}`)
  console.log(`   - Version: ${loadedContext.version}\n`)

  // ========================================================================
  // STEP 6: Build System Prompt
  // ========================================================================
  console.log('📝 Building system prompt...')

  const systemPrompt = buildSystemPrompt({
    block1: loadedContext.block_1_fixed,
    block2: loadedContext.block_2_identity,
    block3: loadedContext.block_3_memory,
    block4: loadedContext.block_4_goals,
    mode: 'conversation'
  })

  console.log(`✅ System prompt built`)
  console.log(`   - Length: ${systemPrompt.length} characters`)
  console.log(`   - Word count: ~${Math.round(systemPrompt.split(/\s+/).length)} words\n`)

  // Show a preview
  console.log('📄 System Prompt Preview (first 500 chars):')
  console.log('─────────────────────────────────────────')
  console.log(systemPrompt.substring(0, 500) + '...')
  console.log('─────────────────────────────────────────\n')

  // ========================================================================
  // STEP 7: Verify All Blocks Present
  // ========================================================================
  console.log('✅ Verification:')

  const verifications = [
    ['Block 1: Fixed Context', systemPrompt.includes('# BLOCK 1: YOUR WORLD & ROLE')],
    ['Block 1: Simulation Rules', systemPrompt.includes('THE NEW KING SIMULATION')],
    ['Block 1: Available Actions', systemPrompt.includes('YOUR AVAILABLE ACTIONS')],
    ['Block 2: Identity', systemPrompt.includes('# BLOCK 2: YOUR IDENTITY')],
    ['Block 2: Character Name', systemPrompt.includes('Thales')],
    ['Block 2: Clan', systemPrompt.includes('Philosophers')],
    ['Block 3: Memory', systemPrompt.includes('# BLOCK 3: YOUR MEMORY')],
    ['Block 4: Goals', systemPrompt.includes('# BLOCK 4: YOUR GOALS & STRATEGY')],
    ['Block 4: Primary Goal', systemPrompt.includes('Primary Goal')],
    ['Mode Instructions', systemPrompt.includes('CONVERSATION INSTRUCTIONS')],
  ]

  let allPassed = true
  verifications.forEach(([name, passed]) => {
    const icon = passed ? '✅' : '❌'
    console.log(`   ${icon} ${name}`)
    if (!passed) allPassed = false
  })

  console.log()

  // ========================================================================
  // CLEANUP
  // ========================================================================
  console.log('🧹 Cleaning up test data...')

  // Delete in reverse order (foreign keys)
  await supabase.from('ai_context').delete().eq('role_id', testRoleId)
  await supabase.from('roles').delete().eq('role_id', testRoleId)
  await supabase.from('clans').delete().eq('clan_id', testClanId)
  await supabase.from('sim_runs').delete().eq('run_id', testSimRunId)

  console.log('✅ Test data cleaned up\n')

  // ========================================================================
  // FINAL RESULT
  // ========================================================================
  if (allPassed) {
    console.log('========================================')
    console.log('✅ ALL TESTS PASSED!')
    console.log('========================================\n')
    console.log('The AI Character Prototype is ready for:')
    console.log('  - Text conversations (OpenAI Realtime API)')
    console.log('  - Voice conversations (ElevenLabs)')
    console.log('  - Reflection Engine (Blocks 2-4 updates)')
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
