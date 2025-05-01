/*
  # Fix Storage Bucket Access
  
  1. Changes
    - Ensures the 'notes' bucket exists in Supabase storage
    - Updates storage policies to allow proper public access
    - Fixes the "Bucket not found" error when viewing files
  
  2. Purpose
    - Resolves 404 errors when accessing files
    - Ensures consistent bucket access across environments
    - Simplifies storage policies to focus on public access
*/

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can access files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can view files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can upload to notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can upload files to notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can update files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can update their own files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can delete files in notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Counsellors can delete from notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Create simplified policies that work reliably
-- 1. Allow anyone to view files (crucial for file viewing to work)
CREATE POLICY "Anyone can view files in notes bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'notes');

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to notes bucket" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes'
  );

-- 3. Allow authenticated users to update files
CREATE POLICY "Authenticated users can update files in notes bucket" ON storage.objects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes'
  );

-- 4. Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete from notes bucket" ON storage.objects
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes'
  );