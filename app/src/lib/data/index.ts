/**
 * Data Access Layer - Central Export
 *
 * Lightweight data access functions for Supabase tables
 * Provides consistent error handling and return types
 *
 * Usage:
 *   import { getSimulationById, getPhasesByRunId } from '../lib/data'
 */

// Simulations
export {
  getSimulationsByFacilitator,
  getSimulationById,
  createSimulation,
  updateSimulation,
  updateSimulationStatus,
  deleteSimulation,
  getRecentSimulations,
  getSimulationWithDetails,
  simulationExists,
  getSimulationCount,
  getSimulationsByStatus,
} from './simulations'

// Phases
export {
  getPhasesByRunId,
  getPhaseById,
  getPhaseBySequence,
  getActivePhase,
  getLastCompletedPhase,
  getCurrentPhase,
  updatePhaseStatus,
  updatePhaseTiming,
  updatePhase,
  createPhases,
  createPhase,
  deletePhasesByRunId,
  deletePhase,
  getPhaseCount,
  getPhasesByStatus,
  hasStartedPhases,
  getNextPendingPhase,
} from './phases'
