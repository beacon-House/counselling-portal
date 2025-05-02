/*
  # Add subtask suggestions for Standardized Testing phase
  
  1. Changes
    - Updates the subtask_suggestion column for all tasks in the Standardized Testing phase
    - Adds specific, actionable guidance for counselors creating subtasks
  
  2. Purpose
    - Provides consistent guidance to counselors when creating subtasks
    - Ensures tasks have appropriate suggestions for hover tooltips
    - Maintains data quality and completeness across the roadmap
*/

-- Update tasks in the Standardized Testing phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Test Strategy Planning' THEN 
    'Plan and log diagnostic SAT/ACT trials, confirm TOEFL/IELTS requirements, and mark all registration deadlines.'
  WHEN name = 'Preparation & Practice' THEN 
    'Select high-quality prep resources, schedule weekly timed practice tests, and book intensive bootcamps over school breaks.'
  WHEN name = 'Taking the Exams' THEN 
    'Register early for your SAT/ACT and PSAT, secure a backup retake slot, and track every test date.'
  WHEN name = 'Score Evaluation & Improvement' THEN 
    'Compare your scores against target college benchmarks, pinpoint weak areas, and schedule sectional review plus a retake.'
  WHEN name = 'Balanced Perspective on Testing' THEN 
    'Once you hit your target score, scale back prep to focus on grades and activities, and keep score-report deadlines in view.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Standardized Testing');

-- Verify that all tasks in Standardized Testing phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Standardized Testing'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Standardized Testing phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;