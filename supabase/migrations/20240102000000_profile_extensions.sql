-- Profile extensions: bio, avatar, target school
-- Run via Supabase SQL editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS target_school TEXT;

-- Make profiles publicly readable (no PII — email lives in auth.users only)
DROP POLICY IF EXISTS "users_own_profile_select" ON public.profiles;
CREATE POLICY "anyone_can_read_profiles" ON public.profiles FOR SELECT USING (true);

-- Avatars storage bucket (public reads, owner writes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "public_read_avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users_upload_own_avatar" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users_update_own_avatar" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users_delete_own_avatar" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
