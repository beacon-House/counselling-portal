/*
  # Remove A-Levels from curriculum options

  1. Changes
    - Updates the check constraint on students table to remove A-Levels from valid curriculum options
    - Ensures data consistency by updating any existing A-Levels records to IGCSE
*/

-- First update any existing records that use A-Levels
UPDATE students 
SET curriculum = 'IGCSE'
WHERE curriculum = 'A-Levels';

-- Drop the existing check constraint
ALTER TABLE students
DROP CONSTRAINT IF EXISTS students_curriculum_check;

-- Add the updated check constraint without A-Levels
ALTER TABLE students
ADD CONSTRAINT students_curriculum_check
CHECK (curriculum = ANY (ARRAY[
  'CBSE',
  'IBSE',
  'IGCSE',
  'IB',
  'State Board',
  'US Common Core',
  'AP',
  'ICSE',
  'Others'
]));