/*
  # Cross-counsellor access for student data
  
  1. Security Changes
    - Create a new RLS policy allowing counsellors to view all students
    - This replaces any existing policies that limited student access to creator only
  
  2. Purpose
    - Enable all authenticated counsellors to view students created by other counsellors
    - Support collaboration between counsellors
    - Maintain security while expanding access
*/

-- Create policy for counsellors to view all students (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'Counsellors can view all students'
  ) THEN
    CREATE POLICY "Counsellors can view all students" ON public.students
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      EXISTS (
        SELECT 1 FROM public.counsellors
        WHERE id = auth.uid()
      )
    );
  END IF;
END
$$;