-- Restrict public uploads to the story-photos bucket
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;

-- Explicit deny for inserts (WITH CHECK is required for INSERT policies)
CREATE POLICY "No anonymous uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (false);
