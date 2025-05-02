/*
  # Add subtask suggestions for Letters of Recommendation phase
  
  1. Changes
    - Update tasks in the Letters of Recommendation phase with helpful subtask suggestions
    - Verify all tasks have suggestions after the update
  
  2. Purpose
    - Provide guidance to counsellors when creating subtasks for students
    - Standardize the approach to recommendation letter preparation
    - Give actionable steps that can be transformed into subtasks
*/

-- Update tasks in the Letters of Recommendation phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Choosing Recommenders' THEN 
    'Identify 2–3 teachers (plus any coach or mentor) who know you well, note their subject/context, and plan to ask by end of Grade 11.'
  WHEN name = 'Building Relationships Early' THEN 
    'Participate actively in class, attend office hours, and discuss your related interests to give teachers concrete examples to write about.'
  WHEN name = 'Requesting the Letters' THEN 
    'Ask in person by late junior year, share a ''brag sheet'' with accomplishments and college list, then submit the formal request via your school portal.'
  WHEN name = 'Making it Easy for Recommenders' THEN 
    'Provide a clear spreadsheet of colleges & deadlines, complete your FERPA waiver, and outline any school-specific submission steps.'
  WHEN name = 'Follow-Up and Gratitude' THEN 
    'After letters are in, send a heartfelt handwritten thank-you, consider a small token, and update them on your admissions results in spring.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Letters of Recommendation');

-- Verify that all tasks in Letters of Recommendation phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Letters of Recommendation'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Letters of Recommendation phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;