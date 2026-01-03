-- Create public bucket for story photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-photos', 'story-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-photos');

-- Anonymous upload access
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
TO anon, public
WITH CHECK (bucket_id = 'story-photos');
