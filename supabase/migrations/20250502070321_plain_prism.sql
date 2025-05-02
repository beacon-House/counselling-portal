/*
  # Add subtask suggestions for Innovation Capstone Project phase
  
  1. Changes:
    - Updates the subtask_suggestion column for all tasks in the Innovation Capstone Project phase
    - Sets appropriate hover text for each task based on the provided content
  
  2. Purpose:
    - Provide guidance to counselors when creating subtasks for students
    - Standardize the approach to capstone project planning and execution
    - Help counselors understand what kinds of subtasks are appropriate for each task
*/

-- Update tasks in the Innovation Capstone Project phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Project Ideation' THEN 
    'Schedule two brainstorm sessions, shortlist your top three ideas, and draft a one-page proposal.'
  WHEN name = 'Planning & Resource Gathering' THEN 
    'Map phases on a timeline, list required materials/funding, and reach out to potential mentors or sponsors.'
  WHEN name = 'Execution & Development' THEN 
    'Block weekly work sessions, document challenges and pivots, and hold monthly team check-ins.'
  WHEN name = 'Documentation & Reflection' THEN 
    'Log progress in a project journal after each milestone, attach key artifacts, and write bi-monthly reflections.'
  WHEN name = 'Showcase & Impact' THEN 
    'Prepare your final deliverable (report, prototype, or deck), rehearse your presentation, and identify forums to present.'
  WHEN name = 'Continuation & Next Steps' THEN 
    'Draft a sustainability plan, craft a 2-sentence project summary for your resume, and list possible future spin-offs.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Innovation Capstone Project');

-- Verify that all tasks in Innovation Capstone Project phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Innovation Capstone Project'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Innovation Capstone Project phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;