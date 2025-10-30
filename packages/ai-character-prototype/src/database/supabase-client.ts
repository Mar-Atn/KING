/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Get Supabase configuration from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('SUPABASE', 'Missing Supabase credentials', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_SERVICE_ROLE_KEY
  });
  throw new Error('Missing Supabase credentials. Check .env file.');
}

/**
 * Supabase client with service role permissions
 * (Required for AI prototype to bypass RLS)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

logger.debug('SUPABASE', 'Client initialized', {
  url: SUPABASE_URL.substring(0, 30) + '...'
});
