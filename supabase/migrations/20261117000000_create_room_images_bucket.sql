-- Room pictures are stored in Supabase Storage; the rooms.pictures column stores their public URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Room images are publicly readable" ON storage.objects;
CREATE POLICY "Room images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Users can upload their own room images" ON storage.objects;
CREATE POLICY "Users can upload their own room images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'room-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
