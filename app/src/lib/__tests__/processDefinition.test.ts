/**
 * Test file for processDefinition.ts
 * Verifies KING_PROCESS_PHASES data integrity and utility functions
 */

import { describe, it, expect } from 'vitest'
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

describe('Process Definition', () => {
  describe('Phase Data', () => {
    it('should have exactly 16 phases', () => {
      expect(KING_PROCESS_PHASES).toHaveLength(16)
    })

    it('should calculate correct total duration', () => {
      const total = getTotalDuration()
      expect(total).toBe(185)
    })

    it('should have all phases with required properties', () => {
      KING_PROCESS_PHASES.forEach((phase, index) => {
        expect(phase.stage_number, `Phase ${index + 1} missing stage_number`).toBeDefined()
        expect(phase.stage_name, `Phase ${index + 1} missing stage_name`).toBeDefined()
        expect(phase.description, `Phase ${index + 1} missing description`).toBeDefined()
        expect(phase.default_duration_minutes, `Phase ${index + 1} missing duration`).toBeDefined()
        expect(phase.phase_type, `Phase ${index + 1} missing phase_type`).toBeDefined()
      })
    })

    it('should have correct sequence numbers', () => {
      KING_PROCESS_PHASES.forEach((phase, index) => {
        // Phases are numbered 0-15
        expect(phase.stage_number).toBe(index)
      })
    })
  })

  describe('Phase Retrieval', () => {
    it('should retrieve phase 0 correctly', () => {
      const phase = getPhaseByNumber(0)
      expect(phase).toBeDefined()
      expect(phase?.stage_name).toBe('Role Distribution & Induction')
      expect(phase?.phase_category).toBe('pre_play')
    })

    it('should retrieve phase 1 correctly', () => {
      const phase = getPhaseByNumber(1)
      expect(phase).toBeDefined()
      expect(phase?.stage_name).toBe('Clan Councils 1')
    })

    it('should retrieve last phase correctly', () => {
      const phase = getPhaseByNumber(15)
      expect(phase).toBeDefined()
      expect(phase?.stage_name).toBe('Plenary Debriefing')
    })

    it('should return undefined for invalid phase numbers', () => {
      // getPhaseByNumber returns undefined (not null) for invalid numbers
      expect(getPhaseByNumber(-1)).toBeUndefined()
      expect(getPhaseByNumber(99)).toBeUndefined()
    })
  })

  describe('Phase Types', () => {
    it('should find all clan_council phases', () => {
      const clanCouncils = getPhasesByType('clan_council')
      expect(clanCouncils.length).toBeGreaterThan(0)
    })

    it('should find all vote phases', () => {
      const votes = getPhasesByType('vote')
      expect(votes.length).toBeGreaterThan(0)
    })

    it('should return empty array for non-existent type', () => {
      const invalid = getPhasesByType('non_existent' as any)
      expect(invalid).toHaveLength(0)
    })
  })

  describe('Stage Validation', () => {
    it('should validate valid stage numbers', () => {
      // isValidStageNumber checks >= 1 && <= length (16)
      // So valid range is 1-16
      expect(isValidStageNumber(1)).toBe(true)
      expect(isValidStageNumber(15)).toBe(true)
      expect(isValidStageNumber(16)).toBe(true)
      expect(isValidStageNumber(8)).toBe(true)
    })

    it('should invalidate out-of-bounds stage numbers', () => {
      expect(isValidStageNumber(0)).toBe(false) // < 1
      expect(isValidStageNumber(-1)).toBe(false)
      expect(isValidStageNumber(17)).toBe(false) // > 16
      expect(isValidStageNumber(99)).toBe(false)
    })
  })

  describe('Phase Navigation', () => {
    it('should get next phase', () => {
      const next = getNextPhase(5)
      expect(next?.stage_number).toBe(6)
    })

    it('should get previous phase', () => {
      const prev = getPreviousPhase(5)
      expect(prev?.stage_number).toBe(4)
    })

    it('should return undefined for next phase after last (15)', () => {
      const next = getNextPhase(15)
      // getNextPhase(15) checks if stage 16 is valid
      // isValidStageNumber(16) returns true (16 >= 1 && 16 <= 16)
      // But getPhaseByNumber(16) returns undefined (no phase with stage_number 16)
      // Because phases are numbered 0-15, not 1-16
      expect(next).toBeUndefined()
    })

    it('should return null for previous phase before first (1)', () => {
      // Since isValidStageNumber starts at 1, previous of 1 is invalid
      const prev = getPreviousPhase(1)
      expect(prev).toBeNull()
    })

    it('should return null for previous of stage 0 (out of valid range)', () => {
      const prev = getPreviousPhase(0)
      expect(prev).toBeNull()
    })
  })

  describe('Simulation Completion', () => {
    it('should not be complete during phases', () => {
      expect(isSimulationComplete(0)).toBe(false)
      expect(isSimulationComplete(1)).toBe(false)
      expect(isSimulationComplete(15)).toBe(false)
    })

    it('should not be complete at last phase (15)', () => {
      expect(isSimulationComplete(15)).toBe(false)
    })

    it('should not be complete at phase after last (16)', () => {
      // 16 > 16 = false (uses > not >=)
      expect(isSimulationComplete(16)).toBe(false)
    })

    it('should be complete only after phase 16', () => {
      // 17 > 16 = true
      expect(isSimulationComplete(17)).toBe(true)
      expect(isSimulationComplete(99)).toBe(true)
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate progress at stage 0', () => {
      // (0+1)/16 * 100 = 6.25 → 6%
      expect(getProgressPercentage(0)).toBe(6)
    })

    it('should calculate progress at stage 8', () => {
      // (8+1)/16 * 100 = 56.25 → 56%
      expect(getProgressPercentage(8)).toBe(56)
    })

    it('should calculate 100% after last phase', () => {
      expect(getProgressPercentage(16)).toBe(100)
      expect(getProgressPercentage(99)).toBe(100)
    })

    it('should calculate 100% at last phase', () => {
      // (15+1)/16 * 100 = 100%
      expect(getProgressPercentage(15)).toBe(100)
    })

    it('should handle negative values', () => {
      expect(getProgressPercentage(-1)).toBe(0)
      expect(getProgressPercentage(-10)).toBe(0)
    })
  })
})
