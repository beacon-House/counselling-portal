/*
  # Files Management System
  
  1. New Tables
    - `files` table to store file metadata including:
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students table)
      - `phase_id` (uuid, references phases table)
      - `task_id` (uuid, references tasks table)
      - `file_name` (text, not null)
      - `file_url` (text, not null)
      - `file_type` (text, file extension or MIME type)
      - `file_size` (bigint, file size in bytes)
      - `description` (text, optional description of the file)
      - `counsellor_id` (uuid, references counsellors table)
      - `created_at` (timestamp with time zone)
  
  2. Security
    - Enable Row Level Security on `files` table
    - Create policies allowing counsellors to CRUD their files
  
  3. Purpose
    - Store metadata for uploaded files
    - Link files to students, phases, and tasks
    - Track file uploads and maintain context
*/

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id),
  task_id UUID REFERENCES tasks(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  description TEXT,
  counsellor_id UUID REFERENCES counsellors(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_student_id ON files(student_id);
CREATE INDEX IF NOT EXISTS idx_files_phase_task ON files(student_id, phase_id, task_id);

-- Enable Row Level Security on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the files table
-- Policy for SELECT
CREATE POLICY "Counsellors can view files" ON files
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Policy for INSERT
CREATE POLICY "Counsellors can upload files" ON files
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Policy for UPDATE
CREATE POLICY "Counsellors can update files" ON files
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Policy for DELETE
CREATE POLICY "Counsellors can delete files" ON files
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );