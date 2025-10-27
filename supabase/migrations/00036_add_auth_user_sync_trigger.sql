-- ============================================================================
-- Migration: 00036_add_auth_user_sync_trigger.sql
-- Description: Auto-sync auth.users to public.users on registration
-- Purpose: Ensure public.users entry is created when user registers
-- ============================================================================
-- Date: 2025-10-27
-- Note: This fixes the issue where new registrations create auth.users but not public.users
-- ============================================================================

-- Function to create public.users entry when auth.users entry is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_full_name TEXT;
  v_role TEXT;
BEGIN
  -- Extract display name from metadata or email
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract full name from metadata (if provided)
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Extract role from metadata (default to 'participant')
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'participant'
  );

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    display_name,
    full_name,
    role,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_full_name,
    v_role,
    'registered'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- BACKFILL EXISTING AUTH USERS
-- ============================================================================
-- Create public.users entries for any auth.users that don't have them
-- ============================================================================

INSERT INTO public.users (id, email, display_name, full_name, role, status)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) AS display_name,
  au.raw_user_meta_data->>'full_name' AS full_name,
  COALESCE(au.raw_user_meta_data->>'role', 'participant') AS role,
  'registered' AS status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  auth_count INTEGER;
  public_count INTEGER;
  backfilled_count INTEGER;
BEGIN
  -- Count users in auth.users
  SELECT COUNT(*) INTO auth_count FROM auth.users;

  -- Count users in public.users
  SELECT COUNT(*) INTO public_count FROM public.users;

  -- Calculate backfilled users
  backfilled_count := public_count - (SELECT COUNT(*) FROM public.users WHERE created_at < NOW() - INTERVAL '1 minute');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUTH USER SYNC CONFIGURED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users in auth.users: %', auth_count;
  RAISE NOTICE 'Users in public.users: %', public_count;
  RAISE NOTICE 'New trigger installed: on_auth_user_created';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Future registrations will auto-sync';
  RAISE NOTICE '========================================';
END $$;
