/*
  # Fix file storage access and bucket not found error
  
  1. Changes
    - Ensure proper RLS policies for the notes storage bucket
    - Add explicit public access policy for viewing files
    - Fix any inconsistencies in existing policies
  
  2. Purpose
    - Resolve "Bucket not found" errors when viewing files
    - Ensure files can be properly accessed by both authenticated and unauthenticated users
    - Maintain security while enabling proper file access
*/

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    -- Drop policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public can view files in notes bucket'
    ) THEN
        DROP POLICY "Public can view files in notes bucket" ON storage.objects;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Counsellors can view files in notes bucket'
    ) THEN
        DROP POLICY "Counsellors can view files in notes bucket" ON storage.objects;
    END IF;
END $$;

-- Create a stronger public access policy for the notes bucket
CREATE POLICY "Public can access files in notes bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'notes');

-- Ensure counsellors can upload files
CREATE POLICY "Counsellors can upload to notes bucket" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM public.counsellors
      WHERE id = auth.uid()
    )
  );

-- Ensure counsellors can update files
CREATE POLICY "Counsellors can update files in notes bucket" ON storage.objects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM public.counsellors
      WHERE id = auth.uid()
    )
  );

-- Ensure counsellors can delete files
CREATE POLICY "Counsellors can delete from notes bucket" ON storage.objects
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM public.counsellors
      WHERE id = auth.uid()
    )
  );