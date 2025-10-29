-- ============================================================================
-- MEASURE ACTUAL FIELD SIZES IN ROLES TABLE
-- ============================================================================
-- Run this in Supabase SQL Editor to see which fields are huge
-- ============================================================================

-- Check sample of role data sizes
SELECT
  role_id,
  name,
  -- Measure each field size in bytes
  LENGTH(COALESCE(name, '')) as name_bytes,
  LENGTH(COALESCE(position, '')) as position_bytes,
  LENGTH(COALESCE(background, '')) as background_bytes,
  LENGTH(COALESCE(character_traits, '')) as character_traits_bytes,
  LENGTH(COALESCE(interests, '')) as interests_bytes,
  LENGTH(COALESCE(avatar_url, '')) as avatar_url_bytes,
  LENGTH(COALESCE(ai_config::text, '')) as ai_config_bytes,
  -- Total size of this row
  LENGTH(COALESCE(name, '')) +
  LENGTH(COALESCE(position, '')) +
  LENGTH(COALESCE(background, '')) +
  LENGTH(COALESCE(character_traits, '')) +
  LENGTH(COALESCE(interests, '')) +
  LENGTH(COALESCE(avatar_url, '')) +
  LENGTH(COALESCE(ai_config::text, '')) as total_bytes,
  -- Check if avatar_url is base64
  CASE
    WHEN avatar_url LIKE 'data:image%' THEN '❌ BASE64 IMAGE!'
    WHEN avatar_url LIKE 'http%' THEN '✅ URL'
    WHEN avatar_url LIKE '/avatars%' THEN '✅ Path'
    ELSE '⚠️  Unknown'
  END as avatar_type
FROM roles
ORDER BY (
  LENGTH(COALESCE(background, '')) +
  LENGTH(COALESCE(character_traits, '')) +
  LENGTH(COALESCE(interests, '')) +
  LENGTH(COALESCE(avatar_url, ''))
) DESC
LIMIT 10;

-- Summary statistics
SELECT
  COUNT(*) as total_roles,
  ROUND(AVG(LENGTH(COALESCE(name, '')))) as avg_name_bytes,
  ROUND(AVG(LENGTH(COALESCE(background, '')))) as avg_background_bytes,
  ROUND(AVG(LENGTH(COALESCE(character_traits, '')))) as avg_character_traits_bytes,
  ROUND(AVG(LENGTH(COALESCE(interests, '')))) as avg_interests_bytes,
  ROUND(AVG(LENGTH(COALESCE(avatar_url, '')))) as avg_avatar_bytes,
  ROUND(AVG(LENGTH(COALESCE(ai_config::text, '')))) as avg_ai_config_bytes,
  MAX(LENGTH(COALESCE(avatar_url, ''))) as max_avatar_bytes,
  -- Count how many have base64 avatars
  COUNT(CASE WHEN avatar_url LIKE 'data:image%' THEN 1 END) as base64_avatar_count
FROM roles;

-- Find the biggest offender
SELECT
  'BIGGEST FIELD' as analysis,
  CASE
    WHEN MAX(LENGTH(COALESCE(avatar_url, ''))) > MAX(LENGTH(COALESCE(background, '')))
      THEN 'avatar_url (' || MAX(LENGTH(COALESCE(avatar_url, ''))) || ' bytes)'
    WHEN MAX(LENGTH(COALESCE(background, ''))) > MAX(LENGTH(COALESCE(character_traits, '')))
      THEN 'background (' || MAX(LENGTH(COALESCE(background, ''))) || ' bytes)'
    ELSE 'character_traits (' || MAX(LENGTH(COALESCE(character_traits, ''))) || ' bytes)'
  END as culprit
FROM roles;
