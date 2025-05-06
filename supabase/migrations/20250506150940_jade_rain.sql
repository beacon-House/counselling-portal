/*
  # Add sequence column to student_subtasks table
  
  1. Changes
    - Add `sequence` column to the student_subtasks table
    - Initialize sequence values based on created_at timestamp
    - This enables drag and drop reordering of subtasks
  
  2. Purpose
    - Support reordering of subtasks within a task
    - Maintain consistent ordering even after page refresh
    - Improve user experience with drag-and-drop interface
*/

-- Add sequence column to student_subtasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_subtasks' AND column_name = 'sequence'
  ) THEN
    ALTER TABLE student_subtasks ADD COLUMN sequence INTEGER;
    
    -- Set initial sequence based on created_at to maintain existing order
    -- This ensures all existing subtasks have a valid sequence number
    UPDATE student_subtasks
    SET sequence = sub.seq
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY task_id, student_id ORDER BY created_at) as seq
      FROM student_subtasks
    ) AS sub
    WHERE student_subtasks.id = sub.id;
  END IF;
END $$;