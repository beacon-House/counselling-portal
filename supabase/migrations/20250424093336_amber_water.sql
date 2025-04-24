/*
  # Add title column to notes table

  1. Schema Update
    - Add `title` column to the `notes` table
    - This column will store optional titles for notes

  2. Purpose
    - Supports the note creation functionality in the NotesPanel component
    - Allows counsellors to add titles to notes for better organization
*/

-- Add title column to notes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'title'
  ) THEN
    ALTER TABLE notes ADD COLUMN title TEXT;
  END IF;
END $$;