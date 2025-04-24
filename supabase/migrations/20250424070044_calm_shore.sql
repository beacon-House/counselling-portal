/*
  # Add remark column to student_subtasks table
  
  1. Changes
    - Add `remark` column (text) to student_subtasks table to store counsellor remarks
  
  2. Purpose
    - Allow counsellors to add remarks when changing subtask status
    - Limited to 50 characters per remark
*/

-- Add remark column to student_subtasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_subtasks' AND column_name = 'remark'
  ) THEN
    ALTER TABLE student_subtasks ADD COLUMN remark text;
  END IF;
END $$;