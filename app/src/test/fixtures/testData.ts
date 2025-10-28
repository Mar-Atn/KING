/**
 * Test fixtures for database entities
 * Provides realistic test data for simulations, users, roles, etc.
 */
import type { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['users']['Row']
type SimRun = Database['public']['Tables']['sim_runs']['Row']
type Role = Database['public']['Tables']['roles']['Row']
type Clan = Database['public']['Tables']['clans']['Row']
type Phase = Database['public']['Tables']['phases']['Row']

/**
 * Test user fixtures
 */
export const TEST_USERS = {
  facilitator: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'facilitator@test.com',
    role: 'facilitator',
    created_at: '2025-10-28T00:00:00Z',
    updated_at: '2025-10-28T00:00:00Z',
  } as User,

  participant1: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'participant1@test.com',
    role: 'participant',
    created_at: '2025-10-28T00:00:00Z',
    updated_at: '2025-10-28T00:00:00Z',
  } as User,

  participant2: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'participant2@test.com',
    role: 'participant',
    created_at: '2025-10-28T00:00:00Z',
    updated_at: '2025-10-28T00:00:00Z',
  } as User,

  participant3: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'participant3@test.com',
    role: 'participant',
    created_at: '2025-10-28T00:00:00Z',
    updated_at: '2025-10-28T00:00:00Z',
  } as User,
}

/**
 * Test simulation fixtures
 */
export const TEST_SIMULATION = {
  run_id: '10000000-0000-0000-0000-000000000001',
  title: 'Test Simulation - Kourion Crisis',
  language: 'en',
  facilitator_id: TEST_USERS.facilitator.id,
  status: 'setup',
  max_participants: 12,
  current_phase_number: 0,
  template_id: '20000000-0000-0000-0000-000000000001',
  created_at: '2025-10-28T00:00:00Z',
  updated_at: '2025-10-28T00:00:00Z',
  vote_1_threshold: null,
  vote_2_threshold: null,
} as SimRun

export const TEST_SIMULATION_ACTIVE = {
  ...TEST_SIMULATION,
  run_id: '10000000-0000-0000-0000-000000000002',
  title: 'Test Simulation - Active',
  status: 'active',
  current_phase_number: 3,
  started_at: '2025-10-28T10:00:00Z',
} as SimRun

/**
 * Test clan fixtures
 */
export const TEST_CLANS: Clan[] = [
  {
    clan_id: '30000000-0000-0000-0000-000000000001',
    run_id: TEST_SIMULATION.run_id,
    name: 'Kourionites',
    description: 'The native people of Kourion',
    color: '#3B82F6',
    sequence_number: 1,
    created_at: '2025-10-28T00:00:00Z',
  },
  {
    clan_id: '30000000-0000-0000-0000-000000000002',
    run_id: TEST_SIMULATION.run_id,
    name: 'Achaeans',
    description: 'Greek settlers from the mainland',
    color: '#10B981',
    sequence_number: 2,
    created_at: '2025-10-28T00:00:00Z',
  },
  {
    clan_id: '30000000-0000-0000-0000-000000000003',
    run_id: TEST_SIMULATION.run_id,
    name: 'Phoenicians',
    description: 'Traders from the eastern Mediterranean',
    color: '#F59E0B',
    sequence_number: 3,
    created_at: '2025-10-28T00:00:00Z',
  },
]

/**
 * Test role fixtures
 */
export const TEST_ROLES: Role[] = [
  {
    role_id: '40000000-0000-0000-0000-000000000001',
    run_id: TEST_SIMULATION.run_id,
    clan_id: TEST_CLANS[0].clan_id,
    name: 'Elder of Kourion',
    participant_type: 'human',
    assigned_user_id: TEST_USERS.participant1.id,
    status: 'active',
    created_at: '2025-10-28T00:00:00Z',
    avatar_url: null,
    character_description: null,
    motivations: null,
    constraints: null,
  },
  {
    role_id: '40000000-0000-0000-0000-000000000002',
    run_id: TEST_SIMULATION.run_id,
    clan_id: TEST_CLANS[1].clan_id,
    name: 'Achaean Merchant',
    participant_type: 'human',
    assigned_user_id: TEST_USERS.participant2.id,
    status: 'active',
    created_at: '2025-10-28T00:00:00Z',
    avatar_url: null,
    character_description: null,
    motivations: null,
    constraints: null,
  },
  {
    role_id: '40000000-0000-0000-0000-000000000003',
    run_id: TEST_SIMULATION.run_id,
    clan_id: TEST_CLANS[2].clan_id,
    name: 'Phoenician Trader',
    participant_type: 'ai',
    assigned_user_id: null,
    status: 'active',
    created_at: '2025-10-28T00:00:00Z',
    avatar_url: null,
    character_description: null,
    motivations: null,
    constraints: null,
  },
]

/**
 * Test phase fixtures
 */
export const TEST_PHASES: Phase[] = [
  {
    phase_id: '50000000-0000-0000-0000-000000000001',
    run_id: TEST_SIMULATION.run_id,
    name: 'Opening Address',
    description: 'Facilitator introduces the scenario',
    sequence_number: 1,
    duration_minutes: 10,
    status: 'pending',
    created_at: '2025-10-28T00:00:00Z',
    started_at: null,
    ended_at: null,
  },
  {
    phase_id: '50000000-0000-0000-0000-000000000002',
    run_id: TEST_SIMULATION.run_id,
    name: 'Clan Councils 1',
    description: 'First clan council meeting',
    sequence_number: 2,
    duration_minutes: 15,
    status: 'pending',
    created_at: '2025-10-28T00:00:00Z',
    started_at: null,
    ended_at: null,
  },
  {
    phase_id: '50000000-0000-0000-0000-000000000003',
    run_id: TEST_SIMULATION.run_id,
    name: 'Vote 1 - Elect King',
    description: 'First round of voting',
    sequence_number: 3,
    duration_minutes: 10,
    status: 'pending',
    created_at: '2025-10-28T00:00:00Z',
    started_at: null,
    ended_at: null,
  },
]

/**
 * Helper to create test simulation with full setup
 */
export function createTestSimulation(overrides?: Partial<SimRun>) {
  return {
    ...TEST_SIMULATION,
    ...overrides,
  }
}

/**
 * Helper to create test user
 */
export function createTestUser(
  role: 'facilitator' | 'participant',
  overrides?: Partial<User>
): User {
  const baseId = role === 'facilitator'
    ? '00000000-0000-0000-0000-000000000001'
    : `00000000-0000-0000-0000-00000000${Math.random().toString().slice(2, 6)}`

  return {
    id: baseId,
    email: `${role}@test.com`,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Helper to create test role
 */
export function createTestRole(
  runId: string,
  clanId: string,
  overrides?: Partial<Role>
): Role {
  return {
    role_id: `40000000-0000-0000-0000-0000000000${Math.random().toString().slice(2, 4)}`,
    run_id: runId,
    clan_id: clanId,
    name: 'Test Role',
    participant_type: 'human',
    assigned_user_id: null,
    status: 'active',
    created_at: new Date().toISOString(),
    avatar_url: null,
    character_description: null,
    motivations: null,
    constraints: null,
    ...overrides,
  }
}
