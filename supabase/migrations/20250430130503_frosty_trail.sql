/*
  # Add ETA and Owner fields to student_subtasks table
  
  1. Schema Update
    - Add `eta` column (timestamp with time zone) to student_subtasks table
    - Add `owner` column (text) to student_subtasks table
  
  2. Purpose
    - Allow counsellors to set expected completion dates for subtasks
    - Enable assigning subtasks to specific owners (students or counsellors)
    - Support better task tracking and accountability
*/

-- Add eta column to student_subtasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_subtasks' AND column_name = 'eta'
  ) THEN
    ALTER TABLE student_subtasks ADD COLUMN eta TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add owner column to student_subtasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_subtasks' AND column_name = 'owner'
  ) THEN
    ALTER TABLE student_subtasks ADD COLUMN owner TEXT;
  END IF;
END $$;