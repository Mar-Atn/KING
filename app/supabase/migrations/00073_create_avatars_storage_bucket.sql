-- ============================================================================
-- MIGRATION: Create Supabase Storage bucket for avatars
-- ============================================================================
-- Purpose: Replace base64-encoded avatars with proper file storage
-- Impact: Will reduce role row size from 2.75 MB → 200 bytes (99.9% reduction!)
-- ============================================================================

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket (anyone can read)
  5242880,  -- 5 MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy: Anyone can read avatars (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create storage policy: Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Create storage policy: Users can update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Create storage policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Log success
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     STORAGE BUCKET CREATED: avatars                   ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Public bucket created for avatar storage';
  RAISE NOTICE '✅ Storage policies configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update ImageUpload component to use Supabase Storage';
  RAISE NOTICE '2. Run migration script to extract base64 images';
  RAISE NOTICE '3. Update roles.avatar_url with storage URLs';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected improvement:';
  RAISE NOTICE '  • Row size: 2.75 MB → 200 bytes (13,750× smaller!)';
  RAISE NOTICE '  • Query time: 4.9s → 50-200ms (10-100× faster!)';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
