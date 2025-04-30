/*
  # Remove subtask notes and update notes table structure
  
  1. Changes
    - Remove subtask_id column from notes table
    - Drop foreign key constraint for subtask_id
    - Drop index on subtask_id
  
  2. Purpose
    - Simplify note structure to only allow notes at phase and task level
    - Remove unnecessary complexity from the data model
    - Improve query performance by removing unused relationships
*/

-- Drop the foreign key constraint
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subtask_id_fkey;

-- Drop the index on subtask_id
DROP INDEX IF EXISTS idx_subtask_id;

-- Remove the subtask_id column
ALTER TABLE notes DROP COLUMN IF EXISTS subtask_id;