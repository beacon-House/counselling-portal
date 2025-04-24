/*
  # Add other_curriculum column to students table

  1. Changes
    - Add `other_curriculum` column to the `students` table
      - This allows storing additional curriculum information when "Others" is selected

  2. Why
    - Support the form UI that allows specifying custom curriculum options
    - Fix the error that occurs when trying to insert records with "other_curriculum" field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'other_curriculum'
  ) THEN
    ALTER TABLE students ADD COLUMN other_curriculum TEXT;
  END IF;
END $$;