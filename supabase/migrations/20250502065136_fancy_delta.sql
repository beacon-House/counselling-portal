/*
  # Fix Career Exploration subtask suggestion
  
  1. Changes
    - Ensures the "Career Exploration (Shadowing & Interviews)" task has the correct subtask suggestion
  
  2. Purpose
    - Fix missing hover text for the Career Exploration task in Interest Exploration phase
    - Ensure consistency in the subtask suggestion feature
*/

-- Update specifically the Career Exploration task to ensure it has the correct suggestion
UPDATE tasks
SET subtask_suggestion = 'Add subtasks to encourage students to research careers, conduct informational interviews, and try job shadowing.'
WHERE name = 'Career Exploration (Shadowing & Interviews)'
AND phase_id = (SELECT id FROM phases WHERE name = 'Interest Exploration');

-- Verify that all tasks in Interest Exploration phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Interest Exploration'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Interest Exploration phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;