-- Avatar support for master profiles.
--
-- Adds a nullable avatar_url column to master_profile and a public storage
-- bucket `avatars` that holds the uploaded images. Files are laid out as
-- `<user_id>/<file>` so ownership can be derived from the first path segment.

-- 1. Column on master_profile holding the public URL of the current avatar.
ALTER TABLE public.master_profile
  ADD COLUMN avatar_url text NULL;

COMMENT ON COLUMN public.master_profile.avatar_url IS
  'Public URL of the master''s avatar in the `avatars` storage bucket. NULL = no avatar.';

-- 2. Public storage bucket for avatars (public read so getPublicUrl works).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS on storage.objects for the `avatars` bucket.
--    Public read of objects happens via the public storage endpoint
--    (getPublicUrl), which bypasses RLS — so we intentionally do NOT add a broad
--    public SELECT policy (that would let anyone list/enumerate every file:
--    advisor public_bucket_allows_listing). All policies below are owner-scoped:
--    the first folder segment of the object path must match auth.uid().

-- Owner can read their own avatar files. Owner-scoped (not public) so it doesn't
-- enable enumeration; needed so authenticated storage operations can read back.
CREATE POLICY "Users can read own avatar"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can upload their own avatar (<uid>/...).
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can replace their own avatar (upsert needs UPDATE).
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can delete their own avatar.
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
