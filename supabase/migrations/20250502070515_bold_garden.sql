/*
  # Add subtask suggestions for Extracurriculars phase tasks
  
  1. Changes
    - Update the `subtask_suggestion` column for all tasks in the Extracurriculars phase
    - Add hover text guidance for counsellors creating subtasks
  
  2. Purpose
    - Provide counsellors with specific, actionable suggestions for subtasks
    - Ensure consistent guidance across all tasks in the Extracurriculars phase
    - Help counsellors create more effective and targeted subtasks for students
*/

-- Update tasks in the Extracurriculars phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Selection of Core Activities' THEN 
    'Select 2–4 core activities, log start/continuation dates, and schedule quarterly check-ins to ensure balanced depth and variety.'
  WHEN name = 'Leadership & Initiative' THEN 
    'Set a leadership target, outline steps to earn or create a role, and plan peer-mentoring sessions to build impact.'
  WHEN name = 'Depth of Involvement' THEN 
    'Block weekly time slots, define achievement milestones, and plan intensive vacations or camps to deepen your involvement.'
  WHEN name = 'Community Service & Volunteering' THEN 
    'Choose 1–2 causes, plan recurring volunteer dates, and design a service initiative or fundraiser to demonstrate impact.'
  WHEN name = 'Achievements & Recognition' THEN 
    'Identify specific awards or milestones, document each accomplishment with evidence, and update your record promptly.'
  WHEN name = 'Networking & Exposure' THEN 
    'List key external communities or events, schedule participation or showcases, and collect feedback from mentors/coaches.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Extracurriculars');

-- Verify that all tasks in Extracurriculars phase have subtask suggestions
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM tasks t
  JOIN phases p ON t.phase_id = p.id
  WHERE p.name = 'Extracurriculars'
  AND t.subtask_suggestion IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Warning: % tasks in Extracurriculars phase still have NULL subtask_suggestion', missing_count;
  END IF;
END $$;