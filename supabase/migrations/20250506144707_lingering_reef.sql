/*
  # Add support for multiple owners per subtask
  
  1. Changes
    - Convert owner column from TEXT to TEXT ARRAY
    - Preserve existing data during conversion
  
  2. Purpose
    - Allow multiple owners to be assigned to a subtask
    - Support better task delegation and team collaboration
    - Enable more flexible assignment of responsibilities
*/

-- Step 1: Create a temporary column
ALTER TABLE student_subtasks ADD COLUMN owners TEXT[] DEFAULT NULL;

-- Step 2: Migrate existing data
UPDATE student_subtasks 
SET owners = ARRAY[owner] 
WHERE owner IS NOT NULL;

-- Step 3: Drop the old column and rename the new one
ALTER TABLE student_subtasks DROP COLUMN owner;
ALTER TABLE student_subtasks RENAME COLUMN owners TO owner;