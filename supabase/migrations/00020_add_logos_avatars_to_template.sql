-- ============================================================================
-- MIGRATION: 00020_add_logos_avatars_to_template.sql
-- Description: Add logo_url to clans and avatar_url to roles in template
-- Purpose: Enable visual identification with clan logos and role avatars
-- ============================================================================
-- Author: UX Design Specialist
-- Date: 2025-10-26
-- Project: The New King SIM - Political Simulation Platform
-- Context: Adds logo_url to all 6 clans and avatar_url to all 30 roles
--          in the KOURION v1.0 simulation template
-- ============================================================================

BEGIN;

DO $$
DECLARE
  target_template_id UUID;
  current_clans JSONB;
  current_roles JSONB;
  updated_clans JSONB;
  updated_roles JSONB;
BEGIN
  -- Get the template
  SELECT template_id, canonical_clans, canonical_roles
  INTO target_template_id, current_clans, current_roles
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  IF target_template_id IS NULL THEN
    RAISE EXCEPTION 'KOURION v1.0 template not found!';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Adding Logos and Avatars to Template';
  RAISE NOTICE 'Template ID: %', target_template_id;
  RAISE NOTICE '========================================';

  -- ============================================================================
  -- UPDATE CLANS with logo_url
  -- ============================================================================
  updated_clans := jsonb_build_array(
    current_clans->0 || jsonb_build_object('logo_url', '/artificers.png'),
    current_clans->1 || jsonb_build_object('logo_url', '/bankers.png'),
    current_clans->2 || jsonb_build_object('logo_url', '/landlords.png'),
    current_clans->3 || jsonb_build_object('logo_url', '/merchants.png'),
    current_clans->4 || jsonb_build_object('logo_url', '/military.png'),
    current_clans->5 || jsonb_build_object('logo_url', '/philosophers.png')
  );

  RAISE NOTICE 'Added logo_url to % clans', jsonb_array_length(updated_clans);

  -- ============================================================================
  -- UPDATE ROLES with avatar_url
  -- ============================================================================
  updated_roles := jsonb_build_array(
    -- Artificers (1-3)
    current_roles->0 || jsonb_build_object('avatar_url', '/avatars/avatar-1.svg'),
    current_roles->1 || jsonb_build_object('avatar_url', '/avatars/avatar-2.svg'),
    current_roles->2 || jsonb_build_object('avatar_url', '/avatars/avatar-3.svg'),
    -- Bankers (4-8)
    current_roles->3 || jsonb_build_object('avatar_url', '/avatars/avatar-4.svg'),
    current_roles->4 || jsonb_build_object('avatar_url', '/avatars/avatar-5.svg'),
    current_roles->5 || jsonb_build_object('avatar_url', '/avatars/avatar-6.svg'),
    current_roles->6 || jsonb_build_object('avatar_url', '/avatars/avatar-7.svg'),
    current_roles->7 || jsonb_build_object('avatar_url', '/avatars/avatar-8.svg'),
    -- Landlords (9-15)
    current_roles->8 || jsonb_build_object('avatar_url', '/avatars/avatar-9.svg'),
    current_roles->9 || jsonb_build_object('avatar_url', '/avatars/avatar-10.svg'),
    current_roles->10 || jsonb_build_object('avatar_url', '/avatars/avatar-11.svg'),
    current_roles->11 || jsonb_build_object('avatar_url', '/avatars/avatar-12.svg'),
    current_roles->12 || jsonb_build_object('avatar_url', '/avatars/avatar-13.svg'),
    current_roles->13 || jsonb_build_object('avatar_url', '/avatars/avatar-14.svg'),
    current_roles->14 || jsonb_build_object('avatar_url', '/avatars/avatar-15.svg'),
    -- Merchants (16-20)
    current_roles->15 || jsonb_build_object('avatar_url', '/avatars/avatar-16.svg'),
    current_roles->16 || jsonb_build_object('avatar_url', '/avatars/avatar-17.svg'),
    current_roles->17 || jsonb_build_object('avatar_url', '/avatars/avatar-18.svg'),
    current_roles->18 || jsonb_build_object('avatar_url', '/avatars/avatar-19.svg'),
    current_roles->19 || jsonb_build_object('avatar_url', '/avatars/avatar-20.svg'),
    -- Military (21-27)
    current_roles->20 || jsonb_build_object('avatar_url', '/avatars/avatar-21.svg'),
    current_roles->21 || jsonb_build_object('avatar_url', '/avatars/avatar-22.svg'),
    current_roles->22 || jsonb_build_object('avatar_url', '/avatars/avatar-23.svg'),
    current_roles->23 || jsonb_build_object('avatar_url', '/avatars/avatar-24.svg'),
    current_roles->24 || jsonb_build_object('avatar_url', '/avatars/avatar-25.svg'),
    current_roles->25 || jsonb_build_object('avatar_url', '/avatars/avatar-26.svg'),
    current_roles->26 || jsonb_build_object('avatar_url', '/avatars/avatar-27.svg'),
    -- Philosophers (28-30)
    current_roles->27 || jsonb_build_object('avatar_url', '/avatars/avatar-28.svg'),
    current_roles->28 || jsonb_build_object('avatar_url', '/avatars/avatar-29.svg'),
    current_roles->29 || jsonb_build_object('avatar_url', '/avatars/avatar-30.svg')
  );

  RAISE NOTICE 'Added avatar_url to % roles', jsonb_array_length(updated_roles);

  -- ============================================================================
  -- UPDATE TEMPLATE
  -- ============================================================================
  UPDATE simulation_templates
  SET
    canonical_clans = updated_clans,
    canonical_roles = updated_roles,
    updated_at = NOW()
  WHERE template_id = target_template_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Template Updated with Logos & Avatars';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Clan logos: 6/6';
  RAISE NOTICE 'Role avatars: 30/30';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- KOURION v1.0 template now includes:
--   - logo_url for all 6 clans (PNG files)
--   - avatar_url for all 30 roles (SVG files with initials)
--
-- When facilitators create simulations from this template, the logos and
-- avatars will be copied to the clans and roles tables automatically.
-- ============================================================================
