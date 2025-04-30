/*
  # Increase subtask remark length limit
  
  1. Changes
    - Modify the remark column in student_subtasks table to allow up to 120 characters
  
  2. Purpose
    - Allow counsellors to write more detailed remarks when changing subtask status
    - Previous limit of 50 characters was too restrictive
*/

-- No schema changes needed since text type has no length limit
-- The 120 character limit is enforced in the application layer

-- Add a comment to document the new length limit
COMMENT ON COLUMN student_subtasks.remark IS 'Status change remark (max 120 chars)';