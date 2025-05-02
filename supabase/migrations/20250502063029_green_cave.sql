/*
  # Add subtask_suggestion column to tasks table
  
  1. Changes
    - Add `subtask_suggestion` column to the tasks table
    - This column will store helpful suggestions for counsellors when creating subtasks
  
  2. Purpose
    - Provide guidance to counsellors about what kinds of subtasks to create
    - Enable hover tooltips in the UI for better user experience
    - Help standardize subtask creation across counsellors
*/

-- Add subtask_suggestion column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'subtask_suggestion'
  ) THEN
    ALTER TABLE tasks ADD COLUMN subtask_suggestion TEXT;
  END IF;
END $$;

-- Update tasks in the Interest Exploration phase with subtask suggestions
UPDATE tasks
SET subtask_suggestion = CASE 
  WHEN name = 'Self-Reflection & Passion Identification' THEN 
    'Add subtasks to help students identify their interests, hobbies, and values.'
  WHEN name = 'Skills and Strengths Mapping' THEN 
    'Add subtasks to help students assess their academic strengths and match them to potential careers.'
  WHEN name = 'Career Exploration (Shadowing & Interviews)' THEN 
    'Add subtasks to encourage students to research careers, conduct informational interviews, and try job shadowing.'
  WHEN name = 'Online Courses & Workshops' THEN 
    'Add subtasks to guide students in enrolling in online courses or workshops to explore new fields.'
  WHEN name = 'Extracurricular Sampling' THEN 
    'Add subtasks to encourage students to join clubs, attend events, and reflect on their experiences.'
  WHEN name = 'Mentorship & Guidance' THEN 
    'Add subtasks to help students discuss their interests with mentors and keep a journal of their experiences.'
  ELSE
    subtask_suggestion
END
WHERE phase_id = (SELECT id FROM phases WHERE name = 'Interest Exploration');