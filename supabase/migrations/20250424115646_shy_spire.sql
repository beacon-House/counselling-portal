/*
  # Public access policy for notes storage bucket
  
  1. Schema Update
    - Adds a policy to allow unauthenticated public access to the notes storage bucket
  
  2. Purpose
    - Enables files to be viewed publicly without authentication
    - Ensures file URLs remain accessible when users are not logged in
    - Fixes the issue where files were not displaying correctly after refresh

  3. Security Considerations
    - This policy only enables SELECT operations (viewing files)
    - Upload/modify/delete operations still require authentication
    - File URLs still contain random identifiers for security
*/

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