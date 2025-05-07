/*
  # Add is_ai_generated column to student_subtasks table
  
  1. Changes
    - Add `is_ai_generated` column to the student_subtasks table
    - Default value is false for manually created subtasks
  
  2. Purpose
    - Track which subtasks were generated automatically from transcripts
    - Allow UI to display visual indicators for AI-generated tasks
    - Improve traceability of subtask origins
*/

-- Add is_ai_generated column to student_subtasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_subtasks' AND column_name = 'is_ai_generated'
  ) THEN
    ALTER TABLE student_subtasks ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;
  END IF;
END $$;