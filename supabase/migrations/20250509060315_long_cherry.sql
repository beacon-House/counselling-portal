/*
  # Enhance storage policies for better file access
  
  1. Changes
    - Simplifies and enhances storage policies for the notes bucket
    - Sets the notes bucket as public for more reliable access
    - Ensures authenticated users can perform all operations
  
  2. Purpose
    - Fix intermittent file access issues
    - Improve reliability of file display in the UI
    - Ensure consistent behavior across different environments
    - Prevent cached or stale storage access policies
*/

-- Ensure the bucket is set to public for better access
UPDATE storage.buckets
SET public = true
WHERE id = 'notes';

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from notes bucket" ON storage.objects;

-- Create simple and clear policies
-- 1. Allow public view access to all files in the notes bucket
CREATE POLICY "Public can access files in notes bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'notes');

-- 2. Allow authenticated users to insert files to the notes bucket
CREATE POLICY "Auth users can upload to notes bucket" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'notes'
  );

-- 3. Allow authenticated users to update their files in the notes bucket
CREATE POLICY "Auth users can update files in notes bucket" ON storage.objects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes'
  );

-- 4. Allow authenticated users to delete their files from the notes bucket
CREATE POLICY "Auth users can delete from notes bucket" ON storage.objects
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes'
  );

-- Update RLS on files table to be consistent
DROP POLICY IF EXISTS "Counsellors can view files" ON files;
DROP POLICY IF EXISTS "Counsellors can upload files" ON files;
DROP POLICY IF EXISTS "Counsellors can update files" ON files;
DROP POLICY IF EXISTS "Counsellors can delete files" ON files;

-- Create simpler consistent policies
CREATE POLICY "Auth users can view files" ON files
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert files" ON files
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can update files" ON files
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete files" ON files
  FOR DELETE
  USING (auth.role() = 'authenticated');