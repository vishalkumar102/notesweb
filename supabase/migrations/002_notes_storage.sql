-- Store uploaded PDF notes in Supabase Storage and their metadata in resources.
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS subject_name TEXT;

ALTER TABLE public.resources
  ALTER COLUMN moderation_status SET DEFAULT 'approved';

DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.resources;
CREATE POLICY "Authenticated users can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND uploader_id = auth.uid());

DROP POLICY IF EXISTS "Uploaders can delete own resources" ON public.resources;
CREATE POLICY "Uploaders can delete own resources"
  ON public.resources FOR DELETE
  USING (uploader_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notes', 'notes', TRUE, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read note files" ON storage.objects;
CREATE POLICY "Public can read note files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes');

DROP POLICY IF EXISTS "Users can upload notes to their own folder" ON storage.objects;
CREATE POLICY "Users can upload notes to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can delete notes from their own folder" ON storage.objects;
CREATE POLICY "Users can delete notes from their own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
