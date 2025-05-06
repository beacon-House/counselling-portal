/*
  # Add school_name column to students table
  
  1. Changes
    - Add `school_name` column to the students table
    - This column will store the student's school name
  
  2. Purpose
    - Allow counsellors to record which school each student attends
    - Support filtering and organizing students by school
    - Enhance student information completeness
*/

-- Add school_name column to students table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'school_name'
  ) THEN
    ALTER TABLE students ADD COLUMN school_name TEXT;
  END IF;
END $$;