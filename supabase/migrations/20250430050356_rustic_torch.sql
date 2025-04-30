/*
  # Update note edit permissions
  
  1. Security Changes
    - Add a policy allowing counsellors to update notes
    - Enable row-level security on the notes table if not already enabled
  
  2. Purpose
    - Control who can edit notes in the system
    - Ensure proper security for note editing
    - Maintain data integrity for student records
*/

-- Enable RLS on notes table if not already enabled
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;

-- Add policy for counsellors to update notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can update notes'
  ) THEN
    CREATE POLICY "Counsellors can update notes" ON public.notes
      FOR UPDATE
      USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.counsellors
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;