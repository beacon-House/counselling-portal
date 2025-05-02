/*
  # Add subtask suggestions for Application Prep phase
  
  1. Changes
    - Update tasks in the Application Prep phase with subtask suggestions
    - These suggestions appear as hover text when counselors add subtasks
  
  2. Purpose
    - Provide guidance to counselors when creating subtasks
    - Ensure consistency in subtask creation across different counselors
    - Help maintain quality standards for student guidance
*/

-- Update tasks in the Application Prep phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Organize Your Application Materials' THEN 
    'Create a dedicated digital/physical folder for transcripts, score reports, activities list, essays, and portfolios, and verify each item''s accuracy and completeness.'
  WHEN name = 'Create Accounts & Fill Basics' THEN 
    'Register on the Common App (and other portals) by August 1, input personal, family, and education details early, and upload courses, grades, activities, honors, and any short-answer responses.'
  WHEN name = 'Craft a Cohesive Narrative' THEN 
    'Define your application''s unifying theme, ensure essays, activities, and rec letters all reinforce it, and prepare an ''additional info'' note for any gaps or anomalies.'
  WHEN name = 'Finalize College-Specific Components' THEN 
    'Build a mini-checklist per school—supplements, portfolios, interviews, optional extras—tailor each ''Why us'' answer, then preview the full application to catch errors.'
  WHEN name = 'Financial Aid Applications' THEN 
    'Use each college''s net-price calculator, note FAFSA/CSS Profile deadlines (FAFSA opens Oct 1, 2026), list need-blind vs. need-aware policies, and track merit- and external-scholarship dates.'
  WHEN name = 'Submit Applications in Phases' THEN 
    'Aim to finish Early Action/Decision apps by mid-October and Regular Decision by mid-December, confirm transcripts/scores/recs have been sent, and celebrate each ''Submit.'''
  WHEN name = 'Interview Preparation (If Applicable)' THEN 
    'Compile potential questions and anecdotes, schedule mock interviews, dress business casual, arrive punctually, and send a brief thank-you email afterward.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Application Prep');

-- Verify that all tasks in Application Prep phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Application Prep'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Application Prep phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;