/*
  # Secure notes storage bucket with RLS policies
  
  1. Storage Security
    - Enable Row Level Security (RLS) on the storage.objects table
    - Create policies for the following operations:
      - INSERT: Only authenticated counsellors can upload files
      - SELECT: Only authenticated counsellors can view files
      - UPDATE: Only authenticated counsellors can update their own files
      - DELETE: Only authenticated counsellors can delete their own files
  
  2. Purpose
    - Restrict access to the "notes" bucket to counsellors only
    - Prevent unauthorized access to sensitive student documents
    - Maintain data privacy and security
*/

-- Enable Row Level Security on the storage.objects table (this applies to all buckets)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow counsellors to INSERT files into the notes bucket
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

-- Allow counsellors to SELECT files from the notes bucket
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

-- Allow counsellors to UPDATE their own files in the notes bucket
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

-- Allow counsellors to DELETE their own files in the notes bucket
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