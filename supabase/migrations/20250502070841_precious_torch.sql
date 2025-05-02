/*
  # Add subtask suggestions for Essays phase
  
  1. Changes
    - Update tasks in the Essays phase with helpful subtask suggestions that appear on hover
    - Provide specific, actionable guidance for each task type
  
  2. Purpose
    - Help counsellors create relevant subtasks for students in the essay writing process
    - Ensure consistent guidance across the platform
    - Improve user experience with contextual help
*/

-- Update tasks in the Essays phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Personal Narrative Brainstorming' THEN 
    'Brainstorm 3–5 defining life stories, tag each by core value, and pick your strongest for a first outline.'
  WHEN name = 'Understanding Essay Prompts' THEN 
    'Compile a list of Common App and supplemental prompts, note their themes, and set an August review reminder.'
  WHEN name = 'Drafting the Personal Statement' THEN 
    'Write a full 500–650-word draft over summer, then schedule two feedback sessions for content clarity.'
  WHEN name = 'Revising & Polishing' THEN 
    'Run a structural pass (hook, "so what," conclusion), copy-edit for clarity, and trim to the word limit.'
  WHEN name = 'Supplemental Essays Game Plan' THEN 
    'Build a spreadsheet of every college prompt, group similar essays, and block writing slots by deadline.'
  WHEN name = 'Final Essay Checklist' THEN 
    'Verify each essay addresses its prompt, preview in the application portal, and archive final files.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Essays');

-- Verify that all tasks in Essays phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Essays'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Essays phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;