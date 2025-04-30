/*
  # Update schema to allow student context generation
  
  1. Ensure RLS is enabled on students table
  2. Add policies for counsellors to update student context
*/

-- Enable RLS on students table if not already enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Add policy for counsellors to update students
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can update students'
  ) THEN
    CREATE POLICY "Counsellors can update students" ON public.students
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

-- Add policy for counsellors to insert students if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can insert students'
  ) THEN
    CREATE POLICY "Counsellors can insert students" ON public.students
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

-- Add policy for counsellors to delete students if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND schemaname = 'public' 
    AND policyname = 'Counsellors can delete students'
  ) THEN
    CREATE POLICY "Counsellors can delete students" ON public.students
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