/*
  # Fix Storage Bucket Access Issues
  
  1. Changes
    - Ensure the "notes" bucket exists
    - Add explicit public policy for the notes bucket
    - Fix access control for viewing files
  
  2. Purpose
    - Resolve "Bucket not found" errors when viewing files
    - Ensure files can be viewed from any context including preview environments
    - Maintain security while allowing appropriate access
*/

-- Make sure the bucket exists
DO $$
BEGIN
  -- Check if the bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE name = 'notes'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name)
    VALUES ('notes', 'notes');
  END IF;
END $$;

-- Ensure policies are correct
DO $$
BEGIN
  -- Enable Row Level Security on storage.objects
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND rowsecurity = TRUE
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Drop the policy if it exists and recreate it
  DROP POLICY IF EXISTS "Public can view files in notes bucket" ON storage.objects;
  
  -- Create a new policy with broader access
  CREATE POLICY "Public can view files in notes bucket" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'notes');
  
  -- Make sure authenticated users can still manage files
  DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
  CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'notes' AND 
      auth.role() = 'authenticated'
    );
  
  -- Policy for updated
  DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
  CREATE POLICY "Authenticated users can update files" ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'notes' AND 
      auth.role() = 'authenticated'
    );
  
  -- Policy for delete
  DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
  CREATE POLICY "Authenticated users can delete files" ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'notes' AND 
      auth.role() = 'authenticated'
    );
END $$;