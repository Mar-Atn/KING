/**
 * Test utilities for Supabase client
 * Provides mocked Supabase client for testing without hitting real database
 */
import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a mocked Supabase client for testing
 * Returns a partial implementation that can be extended per test
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  const mockClient = {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  }

  return mockClient as Partial<SupabaseClient>
}

/**
 * Mock successful auth session
 */
export function mockAuthSession(userId: string, role: 'facilitator' | 'participant' = 'facilitator') {
  return {
    data: {
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userId,
          email: `${role}@test.com`,
          role: role,
          user_metadata: { role },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
    },
    error: null,
  }
}

/**
 * Mock auth error response
 */
export function mockAuthError(message: string) {
  return {
    data: { session: null },
    error: {
      message,
      status: 400,
      name: 'AuthError',
    },
  }
}

/**
 * Mock successful database query response
 */
export function mockQuerySuccess<T>(data: T) {
  return {
    data,
    error: null,
    count: Array.isArray(data) ? data.length : 1,
    status: 200,
    statusText: 'OK',
  }
}

/**
 * Mock database query error
 */
export function mockQueryError(message: string, code = 'PGRST000') {
  return {
    data: null,
    error: {
      message,
      details: '',
      hint: '',
      code,
    },
    count: null,
    status: 400,
    statusText: 'Bad Request',
  }
}

/**
 * Mock RLS policy error (permission denied)
 */
export function mockRLSError() {
  return mockQueryError(
    'new row violates row-level security policy',
    '42501'
  )
}
