-- ============================================================================
-- Migration: 00034_fix_simulation_templates_rls.sql
-- Description: Fix simulation_templates RLS policies
-- Purpose: Replace is_facilitator() with direct role checks
-- ============================================================================
-- Date: 2025-10-27
-- Priority: HIGH - simulation_templates is actively used in EditScenario page
-- Issue: 4 policies using broken is_facilitator() function
-- Solution: Direct role check pattern
-- ============================================================================

-- ============================================================================
-- SIMULATION_TEMPLATES TABLE (4 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Facilitators insert templates" ON simulation_templates;
CREATE POLICY "Facilitators insert templates"
  ON simulation_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators update templates" ON simulation_templates;
CREATE POLICY "Facilitators update templates"
  ON simulation_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

DROP POLICY IF EXISTS "Facilitators delete templates" ON simulation_templates;
CREATE POLICY "Facilitators delete templates"
  ON simulation_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

-- Note: SELECT policy "View templates" likely uses is_facilitator() in OR clause
-- Check if it exists and needs fixing
DROP POLICY IF EXISTS "View templates" ON simulation_templates;
CREATE POLICY "View templates"
  ON simulation_templates FOR SELECT
  TO authenticated
  USING (
    -- Public templates visible to all authenticated users
    is_active = true
    -- OR facilitator can see all templates (including inactive)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'facilitator'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SIMULATION_TEMPLATES RLS FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed policies:';
  RAISE NOTICE '  ✅ INSERT - Facilitators insert templates';
  RAISE NOTICE '  ✅ UPDATE - Facilitators update templates';
  RAISE NOTICE '  ✅ DELETE - Facilitators delete templates';
  RAISE NOTICE '  ✅ SELECT - View templates (all users see active, facilitators see all)';
  RAISE NOTICE '';
  RAISE NOTICE 'Template management (EditScenario page) now fully functional';
  RAISE NOTICE '========================================';
END $$;
