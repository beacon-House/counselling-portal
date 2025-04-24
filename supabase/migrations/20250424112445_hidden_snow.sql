/*
  # Storage Policies for File Access and Management
  
  1. Storage Policies
    - Enable Row Level Security on storage.objects if not already enabled
    - Add policies for authenticated counsellors to access files
    - Add policy for public access to the notes bucket
  
  2. Purpose
    - Secure file access while allowing counsellors to manage their uploaded files
    - Fix "Bucket not found" errors when viewing images
    - Avoid duplicating existing policies
*/

-- Enable Row Level Security on the storage.objects table (this applies to all buckets)
-- Only if RLS is not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Check if policy exists before creating - Counsellors can upload files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Counsellors can upload files to notes bucket'
    ) THEN
        CREATE POLICY "Counsellors can upload files to notes bucket" ON storage.objects
        FOR INSERT
        WITH CHECK (
            auth.role() = 'authenticated' AND
            bucket_id = 'notes' AND
            EXISTS (
                SELECT 1 FROM public.counsellors
                WHERE id = auth.uid()
            )
        );
    END IF;
END $$;

-- Check if policy exists before creating - Counsellors can view files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Counsellors can view files in notes bucket'
    ) THEN
        CREATE POLICY "Counsellors can view files in notes bucket" ON storage.objects
        FOR SELECT
        USING (
            auth.role() = 'authenticated' AND
            bucket_id = 'notes' AND
            EXISTS (
                SELECT 1 FROM public.counsellors
                WHERE id = auth.uid()
            )
        );
    END IF;
END $$;

-- Check if policy exists before creating - Counsellors can update files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Counsellors can update their own files in notes bucket'
    ) THEN
        CREATE POLICY "Counsellors can update their own files in notes bucket" ON storage.objects
        FOR UPDATE
        USING (
            auth.role() = 'authenticated' AND
            bucket_id = 'notes' AND
            EXISTS (
                SELECT 1 FROM public.counsellors
                WHERE id = auth.uid()
            )
        );
    END IF;
END $$;

-- Check if policy exists before creating - Counsellors can delete files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Counsellors can delete files in notes bucket'
    ) THEN
        CREATE POLICY "Counsellors can delete files in notes bucket" ON storage.objects
        FOR DELETE
        USING (
            auth.role() = 'authenticated' AND
            bucket_id = 'notes' AND
            EXISTS (
                SELECT 1 FROM public.counsellors
                WHERE id = auth.uid()
            )
        );
    END IF;
END $$;

-- Check if policy exists before creating - Public access for viewing files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public can view files in notes bucket'
    ) THEN
        CREATE POLICY "Public can view files in notes bucket" ON storage.objects
        FOR SELECT
        USING (
            bucket_id = 'notes'
        );
    END IF;
END $$;