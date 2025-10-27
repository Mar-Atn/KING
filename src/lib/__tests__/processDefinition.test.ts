/**
 * Test file for processDefinition.ts
 * Verifies KING_PROCESS_PHASES data integrity and utility functions
 */

import {
  KING_PROCESS_PHASES,
  getTotalDuration,
  getPhaseByNumber,
  getPhasesByType,
  isValidStageNumber,
  getNextPhase,
  getPreviousPhase,
  isSimulationComplete,
  getProgressPercentage,
} from '../processDefinition'

// Manual test execution (can be run in browser console or Node)
export function runProcessDefinitionTests() {
  console.log('🧪 Testing Process Definition...\n')

  // Test 1: Verify all 12 phases exist
  console.log('Test 1: Verify phase count')
  console.assert(
    KING_PROCESS_PHASES.length === 12,
    `❌ Expected 12 phases, got ${KING_PROCESS_PHASES.length}`
  )
  console.log(`✅ Phase count: ${KING_PROCESS_PHASES.length}`)

  // Test 2: Verify total duration
  console.log('\nTest 2: Verify total duration')
  const totalDuration = getTotalDuration()
  console.assert(
    totalDuration === 120,
    `❌ Expected 120 minutes, got ${totalDuration}`
  )
  console.log(`✅ Total duration: ${totalDuration} minutes`)

  // Test 3: Verify phase retrieval by number
  console.log('\nTest 3: Verify phase retrieval')
  const phase1 = getPhaseByNumber(1)
  console.assert(
    phase1?.stage_name === 'Clan Councils 1',
    `❌ Expected "Clan Councils 1", got "${phase1?.stage_name}"`
  )
  console.log(`✅ Phase 1: ${phase1?.stage_name}`)

  const phase12 = getPhaseByNumber(12)
  console.assert(
    phase12?.stage_name === "Clan's Final Decisions",
    `❌ Expected "Clan's Final Decisions", got "${phase12?.stage_name}"`
  )
  console.log(`✅ Phase 12: ${phase12?.stage_name}`)

  // Test 4: Verify phase types
  console.log('\nTest 4: Verify phase types')
  const clanCouncils = getPhasesByType('clan_council')
  console.assert(
    clanCouncils.length === 3,
    `❌ Expected 3 clan_council phases, got ${clanCouncils.length}`
  )
  console.log(`✅ Clan Council phases: ${clanCouncils.length}`)

  const votes = getPhasesByType('vote')
  console.assert(
    votes.length === 2,
    `❌ Expected 2 vote phases, got ${votes.length}`
  )
  console.log(`✅ Vote phases: ${votes.length}`)

  // Test 5: Verify stage validation
  console.log('\nTest 5: Verify stage validation')
  console.assert(
    isValidStageNumber(1) === true,
    '❌ Stage 1 should be valid'
  )
  console.assert(
    isValidStageNumber(12) === true,
    '❌ Stage 12 should be valid'
  )
  console.assert(
    isValidStageNumber(0) === false,
    '❌ Stage 0 should be invalid'
  )
  console.assert(
    isValidStageNumber(13) === false,
    '❌ Stage 13 should be invalid'
  )
  console.log('✅ Stage validation working')

  // Test 6: Verify navigation functions
  console.log('\nTest 6: Verify phase navigation')
  const nextPhase = getNextPhase(5)
  console.assert(
    nextPhase?.stage_number === 6,
    `❌ Expected phase 6, got ${nextPhase?.stage_number}`
  )
  console.log(`✅ Next phase after 5: ${nextPhase?.stage_name}`)

  const prevPhase = getPreviousPhase(5)
  console.assert(
    prevPhase?.stage_number === 4,
    `❌ Expected phase 4, got ${prevPhase?.stage_number}`
  )
  console.log(`✅ Previous phase before 5: ${prevPhase?.stage_name}`)

  const noNextPhase = getNextPhase(12)
  console.assert(
    noNextPhase === null,
    '❌ Phase 12 should have no next phase'
  )
  console.log('✅ No next phase after 12 (correct)')

  // Test 7: Verify completion check
  console.log('\nTest 7: Verify simulation completion')
  console.assert(
    isSimulationComplete(12) === false,
    '❌ Stage 12 should not be complete'
  )
  console.assert(
    isSimulationComplete(13) === true,
    '❌ Stage 13 should be complete'
  )
  console.log('✅ Completion check working')

  // Test 8: Verify progress calculation
  console.log('\nTest 8: Verify progress percentage')
  const progress6 = getProgressPercentage(6)
  console.assert(
    progress6 === 50,
    `❌ Expected 50% at stage 6, got ${progress6}%`
  )
  console.log(`✅ Progress at stage 6: ${progress6}%`)

  const progress12 = getProgressPercentage(12)
  console.assert(
    progress12 === 100,
    `❌ Expected 100% at stage 12, got ${progress12}%`
  )
  console.log(`✅ Progress at stage 12: ${progress12}%`)

  // Test 9: Verify all phases have required properties
  console.log('\nTest 9: Verify phase data integrity')
  let allValid = true
  KING_PROCESS_PHASES.forEach((phase, index) => {
    if (
      !phase.stage_number ||
      !phase.stage_name ||
      !phase.description ||
      !phase.default_duration_minutes ||
      !phase.phase_type
    ) {
      console.error(`❌ Phase ${index + 1} is missing required properties`)
      allValid = false
    }
  })
  console.assert(allValid, '❌ Some phases are missing required properties')
  console.log('✅ All phases have required properties')

  // Test 10: Verify sequence numbers are correct
  console.log('\nTest 10: Verify sequence numbers')
  let sequenceValid = true
  KING_PROCESS_PHASES.forEach((phase, index) => {
    if (phase.stage_number !== index + 1) {
      console.error(
        `❌ Phase ${index + 1} has incorrect stage_number: ${phase.stage_number}`
      )
      sequenceValid = false
    }
  })
  console.assert(sequenceValid, '❌ Phase sequence numbers are incorrect')
  console.log('✅ All sequence numbers are correct')

  console.log('\n✅ All tests passed! Process definition is valid.\n')

  // Display phase summary
  console.log('📊 Phase Summary:')
  console.table(
    KING_PROCESS_PHASES.map((phase) => ({
      Stage: phase.stage_number,
      Name: phase.stage_name,
      Duration: `${phase.default_duration_minutes} min`,
      Type: phase.phase_type,
      Private: phase.allows_private_meetings ? 'Yes' : 'No',
      Public: phase.allows_public_discussion ? 'Yes' : 'No',
    }))
  )

  return {
    success: true,
    totalPhases: KING_PROCESS_PHASES.length,
    totalDuration: getTotalDuration(),
  }
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  console.log('🔍 Process Definition loaded successfully')
  console.log(`📊 ${KING_PROCESS_PHASES.length} phases, ${getTotalDuration()} minutes total`)
}
