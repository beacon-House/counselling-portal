/*
  # Add note editing history columns
  
  1. Changes
    - Add `updated_at` column to notes table with default timestamp
    - Add `updated_by` column to notes table referencing counsellors
  
  2. Purpose
    - Enable tracking when notes are edited
    - Record which counsellor last edited each note
    - Support displaying edit history in the UI
*/

-- Add updated_at column to notes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Add updated_by column to notes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE notes ADD COLUMN updated_by UUID REFERENCES counsellors(id);
  END IF;
END $$;