/*
  # Add subtask suggestions for Academic Enrichment & Research phase
  
  1. Changes
    - Add hover text suggestions for all tasks in the Academic Enrichment & Research phase
  
  2. Purpose
    - Provide guidance to counsellors when adding subtasks
    - Standardize the types of subtasks that are recommended for each task
    - Help maintain consistency in student roadmaps
*/

-- Update tasks in the Academic Enrichment & Research phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Strong Academic Foundation' THEN 
    'Set weekly study goals, track your GPA checkpoints, and schedule tutoring when needed.'
  WHEN name = 'Advanced Coursework or Self-Study' THEN 
    'Plan enrollments or self-study timelines for advanced classes and map AP/online exam targets.'
  WHEN name = 'Academic Competitions & Olympiads' THEN 
    'Select suitable contests, join prep groups or camps, and schedule regular practice sessions.'
  WHEN name = 'Independent or Mentored Research' THEN 
    'Define your research question, book mentor check-ins, and outline key project milestones.'
  WHEN name = 'Academic Summer Programs' THEN 
    'Identify target programs, note application deadlines, and begin drafting essays and rec-letter requests.'
  WHEN name = 'Reading & Intellectual Curiosity' THEN 
    'Build a themed reading list, subscribe to field-specific journals, and join discussion forums.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Academic Enrichment & Research');

-- Verify that all tasks in Academic Enrichment & Research phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Academic Enrichment & Research'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Academic Enrichment & Research phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;