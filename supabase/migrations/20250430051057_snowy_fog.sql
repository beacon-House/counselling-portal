/*
  # Fix Notes Table RLS Policies
  
  1. Changes:
    - Add missing SELECT policy for counsellors to read notes
    - Add missing INSERT policy for counsellors to create notes
    - Add missing DELETE policy for counsellors to delete notes
  
  2. Purpose:
    - Enable complete CRUD operations for counsellors on the notes table
    - Fix issue where notes are not visible due to missing SELECT policy
    - Ensure consistent access control for all operations
*/

-- Enable RLS on notes table if not already enabled (redundant but safe)
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;

-- Add policy for counsellors to SELECT notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can view notes'
  ) THEN
    CREATE POLICY "Counsellors can view notes" ON public.notes
      FOR SELECT
      USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.counsellors
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add policy for counsellors to INSERT notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can insert notes'
  ) THEN
    CREATE POLICY "Counsellors can insert notes" ON public.notes
      FOR INSERT
      WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.counsellors
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add policy for counsellors to DELETE notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can delete notes'
  ) THEN
    CREATE POLICY "Counsellors can delete notes" ON public.notes
      FOR DELETE
      USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.counsellors
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;