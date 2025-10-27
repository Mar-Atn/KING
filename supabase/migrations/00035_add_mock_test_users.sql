-- ============================================================================
-- Migration: 00035_add_mock_test_users.sql
-- Description: Add 20 mock users for testing participant registration
-- Purpose: Populate database with test participants for development
-- ============================================================================
-- Date: 2025-10-27
-- Note: These are test users only - delete before production!
-- ============================================================================

-- First, insert into auth.users (Supabase Auth table)
-- Using encrypted password (bcrypt hash of "password123")
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'alex.thompson@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Alex Thompson"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'maria.garcia@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maria Garcia"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'john.smith@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"John Smith"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'sophia.chen@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Sophia Chen"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'david.kumar@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"David Kumar"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'emma.johnson@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Emma Johnson"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'lucas.martinez@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Lucas Martinez"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'olivia.brown@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Olivia Brown"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'noah.davis@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Noah Davis"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'ava.wilson@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Ava Wilson"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'ethan.lee@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Ethan Lee"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'isabella.martin@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Isabella Martin"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'mason.anderson@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Mason Anderson"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'mia.taylor@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Mia Taylor"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'liam.thomas@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Liam Thomas"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'charlotte.white@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Charlotte White"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'james.harris@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"James Harris"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'amelia.clark@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Amelia Clark"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'benjamin.lewis@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Benjamin Lewis"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'harper.walker@test.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM2A8kRARVR6XNdDDdZu', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Harper Walker"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Then insert into public.users table
INSERT INTO users (id, email, display_name, full_name, role, status, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'alex.thompson@test.com', 'Alex Thompson', 'Alexander Thompson', 'participant', 'registered', NOW() - INTERVAL '10 days'),
  ('10000000-0000-0000-0000-000000000002', 'maria.garcia@test.com', 'Maria Garcia', 'Maria Elena Garcia', 'participant', 'registered', NOW() - INTERVAL '9 days'),
  ('10000000-0000-0000-0000-000000000003', 'john.smith@test.com', 'John Smith', 'John Michael Smith', 'participant', 'registered', NOW() - INTERVAL '8 days'),
  ('10000000-0000-0000-0000-000000000004', 'sophia.chen@test.com', 'Sophia Chen', 'Sophia Wei Chen', 'participant', 'registered', NOW() - INTERVAL '7 days'),
  ('10000000-0000-0000-0000-000000000005', 'david.kumar@test.com', 'David Kumar', 'David Raj Kumar', 'participant', 'registered', NOW() - INTERVAL '6 days'),
  ('10000000-0000-0000-0000-000000000006', 'emma.johnson@test.com', 'Emma Johnson', 'Emma Rose Johnson', 'participant', 'registered', NOW() - INTERVAL '5 days'),
  ('10000000-0000-0000-0000-000000000007', 'lucas.martinez@test.com', 'Lucas Martinez', 'Lucas Antonio Martinez', 'participant', 'registered', NOW() - INTERVAL '4 days'),
  ('10000000-0000-0000-0000-000000000008', 'olivia.brown@test.com', 'Olivia Brown', 'Olivia Grace Brown', 'participant', 'registered', NOW() - INTERVAL '3 days'),
  ('10000000-0000-0000-0000-000000000009', 'noah.davis@test.com', 'Noah Davis', 'Noah James Davis', 'participant', 'registered', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000010', 'ava.wilson@test.com', 'Ava Wilson', 'Ava Elizabeth Wilson', 'participant', 'registered', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000011', 'ethan.lee@test.com', 'Ethan Lee', 'Ethan Christopher Lee', 'participant', 'registered', NOW() - INTERVAL '12 hours'),
  ('10000000-0000-0000-0000-000000000012', 'isabella.martin@test.com', 'Isabella Martin', 'Isabella Marie Martin', 'participant', 'registered', NOW() - INTERVAL '10 hours'),
  ('10000000-0000-0000-0000-000000000013', 'mason.anderson@test.com', 'Mason Anderson', 'Mason Alexander Anderson', 'participant', 'registered', NOW() - INTERVAL '8 hours'),
  ('10000000-0000-0000-0000-000000000014', 'mia.taylor@test.com', 'Mia Taylor', 'Mia Sophia Taylor', 'participant', 'registered', NOW() - INTERVAL '6 hours'),
  ('10000000-0000-0000-0000-000000000015', 'liam.thomas@test.com', 'Liam Thomas', 'Liam Patrick Thomas', 'participant', 'registered', NOW() - INTERVAL '5 hours'),
  ('10000000-0000-0000-0000-000000000016', 'charlotte.white@test.com', 'Charlotte White', 'Charlotte Grace White', 'participant', 'registered', NOW() - INTERVAL '4 hours'),
  ('10000000-0000-0000-0000-000000000017', 'james.harris@test.com', 'James Harris', 'James William Harris', 'participant', 'registered', NOW() - INTERVAL '3 hours'),
  ('10000000-0000-0000-0000-000000000018', 'amelia.clark@test.com', 'Amelia Clark', 'Amelia Rose Clark', 'participant', 'registered', NOW() - INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000019', 'benjamin.lewis@test.com', 'Benjamin Lewis', 'Benjamin Joseph Lewis', 'participant', 'registered', NOW() - INTERVAL '1 hour'),
  ('10000000-0000-0000-0000-000000000020', 'harper.walker@test.com', 'Harper Walker', 'Harper Olivia Walker', 'participant', 'registered', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Update their preferences to include some metadata
UPDATE users SET preferences = jsonb_build_object(
  'test_user', true,
  'created_for_testing', true
) WHERE id::text LIKE '10000000-%';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  test_user_count INTEGER;
BEGIN
  -- Count test users
  SELECT COUNT(*) INTO test_user_count
  FROM users
  WHERE id::text LIKE '10000000-%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MOCK TEST USERS CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added % test participants', test_user_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Test users have emails like:';
  RAISE NOTICE '  - alex.thompson@test.com';
  RAISE NOTICE '  - maria.garcia@test.com';
  RAISE NOTICE '  - john.smith@test.com';
  RAISE NOTICE '  ... and 17 more';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: These are TEST USERS ONLY';
  RAISE NOTICE '   Delete before production deployment!';
  RAISE NOTICE '========================================';
END $$;
