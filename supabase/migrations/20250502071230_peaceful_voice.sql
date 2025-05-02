/*
  # Add subtask suggestions for College Research phase
  
  1. Changes
    - Update tasks in the "College Research" phase with subtask suggestions
    - Add guidance text shown when counsellors create new subtasks
    - Verify all tasks have suggestions after update
  
  2. Purpose
    - Provide consistent guidance for counsellors adding subtasks
    - Ensure clear expectations for each task in the college research process
    - Support comprehensive college selection and application planning
*/

-- Update tasks in the College Research phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Define Your College Criteria' THEN 
    'List your ideal majors, campus size, location, culture, and budget priorities, discuss with family, and earmark reach/match/safety tiers.'
  WHEN name = 'Build an Initial College List' THEN 
    'Use tools like BigFuture or U.S. News to cast a 20–30 school net, record each school''s GPA, test-score averages, acceptance rate, majors, and special programs.'
  WHEN name = 'In-Depth Research & Visits' THEN 
    'Dive into department and student-life pages, schedule campus or virtual tours and info sessions, and jot down your top pros and cons.'
  WHEN name = 'Connect with Students and Alumni' THEN 
    'Reach out via official ambassador or alumni networks (and social media), prepare targeted fit questions, and compare multiple firsthand perspectives.'
  WHEN name = 'Narrow Down and Balance Your List' THEN 
    'By summer ''26, trim to ~10–15 schools you''d love, ensure a mix of 2–3 reaches, 4–5 matches, 2 safeties, and compile deadlines/requirements into one spreadsheet.'
  WHEN name = 'Financial Fit & Scholarship Research' THEN 
    'Run each school''s net-price calculator, note need-blind vs. need-aware policies, catalog merit‐ and external-scholarship deadlines, and flag FAFSA/CSS Profile dates.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'College Research');

-- Verify that all tasks in College Research phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'College Research'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in College Research phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;