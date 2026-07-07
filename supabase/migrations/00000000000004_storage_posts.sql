-- =============================================
-- Obsidian Wave: Storage Bucket for Post Images
-- =============================================
-- Apply via Supabase Dashboard SQL Editor
-- or: supabase db push (if linked)
-- =============================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS Policies for posts bucket
-- =============================================

-- 1. Public read access (images are publicly viewable)
CREATE POLICY "Posts bucket: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

-- 2. Authenticated users can upload to posts bucket
CREATE POLICY "Posts bucket: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Users can update their own uploads
CREATE POLICY "Posts bucket: own update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );

-- 4. Users can delete their own uploads (moderators can delete any)
CREATE POLICY "Posts bucket: own delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'posts'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('moderator', 'admin', 'superadmin')
      )
    )
  );
