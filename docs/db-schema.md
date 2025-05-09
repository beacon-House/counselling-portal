# Beacon House Counsellor Portal - Database Schema Documentation

This document provides a comprehensive overview of the database schema for the Beacon House Counsellor Portal application, including tables, relationships, constraints, RLS policies, edge functions, and environment variables.

## Table of Contents
1. [Database Tables](#database-tables)
2. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
3. [Constraints and Indexes](#constraints-and-indexes)
4. [Edge Functions](#edge-functions)
5. [Environment Variables & Secrets](#environment-variables--secrets)
6. [Database Migrations](#database-migrations)
7. [Storage Configuration](#storage-configuration)

## Database Tables

### 1. counsellors
Stores manually created counsellor accounts.

```sql
CREATE TABLE counsellors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 2. students
Each student is a "folder" assigned to a counsellor.

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    target_year INT NOT NULL, -- Target year of college entry (e.g., 2027)
    grade TEXT NOT NULL,      -- Current grade (e.g., 11 or 12)
    curriculum TEXT NOT NULL, -- IB / IGCSE / CBSE / ICSE / State Board / Others
    other_curriculum TEXT,    -- For storing custom curriculum when "Others" is selected
    student_context TEXT,     -- AI-generated summary of student profile/progress
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    counsellor_id UUID REFERENCES counsellors(id) ON DELETE SET NULL,
    school_name TEXT         -- Student's current school
);
```

### 3. phases
Global phases applicable to all students.

```sql
CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sequence INTEGER NOT NULL, -- Order in the roadmap
    UNIQUE(name)
);
```

### 4. tasks
Global tasks within each phase.

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sequence INTEGER NOT NULL, -- Order within phase
    subtask_suggestion TEXT,  -- Suggestion text for creating subtasks
    UNIQUE(phase_id, name)
);
```

### 5. student_subtasks
Custom subtasks added by counsellors per student under global tasks.

```sql
CREATE TABLE student_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'yet_to_start' CHECK (
        status IN ('yet_to_start', 'in_progress', 'done', 'blocked', 'not_applicable')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    remark TEXT, -- Status change remark (max 120 chars)
    eta TIMESTAMP WITH TIME ZONE, -- Expected completion date
    owner TEXT[], -- Array of owners (student and/or counsellor)
    sequence INTEGER, -- For drag and drop reordering
    is_ai_generated BOOLEAN DEFAULT false -- Flag for AI-generated subtasks
);
```

### 6. notes
Notes can be attached at any level (student, phase, task).

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id),
    task_id UUID REFERENCES tasks(id),
    content TEXT,
    type TEXT CHECK (type IN ('text', 'file', 'image', 'transcript')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    title TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES counsellors(id)
);
```

### 7. note_embeddings
Stores vector embeddings of notes for AI-powered semantic search.

```sql
CREATE TABLE note_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 8. files
Stores file metadata for files uploaded to Supabase storage.

```sql
CREATE TABLE files (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Row Level Security (RLS) Policies

### students Table RLS

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow counsellors to view all students
CREATE POLICY "Counsellors can view all students" ON students
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to insert students
CREATE POLICY "Counsellors can insert students" ON students
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to update students
CREATE POLICY "Counsellors can update students" ON students
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to delete students
CREATE POLICY "Counsellors can delete students" ON students
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );
```

### notes Table RLS

```sql
-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow counsellors to select notes
CREATE POLICY "Counsellors can view notes" ON notes
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to insert notes
CREATE POLICY "Counsellors can insert notes" ON notes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to update notes
CREATE POLICY "Counsellors can update notes" ON notes
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to delete notes
CREATE POLICY "Counsellors can delete notes" ON notes
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );
```

### files Table RLS

```sql
-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Allow counsellors to select files
CREATE POLICY "Counsellors can view files" ON files
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to insert files
CREATE POLICY "Counsellors can upload files" ON files
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to update files
CREATE POLICY "Counsellors can update files" ON files
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to delete files
CREATE POLICY "Counsellors can delete files" ON files
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );
```

### Storage RLS Policies

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow counsellors to upload files
CREATE POLICY "Counsellors can upload files to notes bucket" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to view files
CREATE POLICY "Counsellors can view files in notes bucket" ON storage.objects
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow public access to view files
CREATE POLICY "Public can view files in notes bucket" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'notes'
  );
  
-- Allow counsellors to update files
CREATE POLICY "Counsellors can update their own files in notes bucket" ON storage.objects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );

-- Allow counsellors to delete files
CREATE POLICY "Counsellors can delete files in notes bucket" ON storage.objects
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE id = auth.uid()
    )
  );
```

## Constraints and Indexes

### Primary Keys
- `counsellors`: `id`
- `students`: `id`
- `phases`: `id`
- `tasks`: `id`
- `student_subtasks`: `id`
- `notes`: `id`
- `note_embeddings`: `id`
- `files`: `id`

### Foreign Keys
- `students.counsellor_id` → `counsellors(id)` ON DELETE SET NULL
- `tasks.phase_id` → `phases(id)` ON DELETE CASCADE
- `student_subtasks.student_id` → `students(id)` ON DELETE CASCADE
- `student_subtasks.task_id` → `tasks(id)` ON DELETE CASCADE
- `notes.student_id` → `students(id)` ON DELETE CASCADE
- `notes.phase_id` → `phases(id)`
- `notes.task_id` → `tasks(id)`
- `notes.updated_by` → `counsellors(id)`
- `note_embeddings.note_id` → `notes(id)` ON DELETE CASCADE
- `files.student_id` → `students(id)` ON DELETE CASCADE
- `files.phase_id` → `phases(id)`
- `files.task_id` → `tasks(id)`
- `files.counsellor_id` → `counsellors(id)`

### Unique Constraints
- `counsellors.email`
- `students.email`
- `phases.name`
- `tasks(phase_id, name)`

### Check Constraints
- `student_subtasks.status` must be one of: 'yet_to_start', 'in_progress', 'done', 'blocked', 'not_applicable'
- `notes.type` must be one of: 'text', 'file', 'image', 'transcript'

### Indexes
```sql
-- Students table indexes
CREATE INDEX students_email_key ON students USING btree (email);
CREATE INDEX students_pkey ON students USING btree (id);

-- Student subtasks indexes
CREATE INDEX idx_student_tasks ON student_subtasks(student_id, task_id);

-- Notes indexes
CREATE INDEX idx_student_phase_task ON notes(student_id, phase_id, task_id);
CREATE INDEX idx_note_created_at ON notes(created_at DESC);
CREATE INDEX idx_note_type ON notes(type);

-- Note embeddings indexes
CREATE INDEX idx_note_embedding ON note_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Files indexes
CREATE INDEX idx_files_student_id ON files(student_id);
CREATE INDEX idx_files_phase_task ON files(student_id, phase_id, task_id);
```

## Edge Functions

### 1. generate-context
**Purpose:** Generates AI-powered context summaries for students based on their notes, tasks, and progress.

**File:** `/supabase/functions/generate-context/index.ts`

**Environment Variables Used:**
- OPENAI_API_KEY (passed via request)

**Input:**
- `promptData`: Text data containing student info, notes, and tasks
- `openaiApiKey`: OpenAI API key

**Output:**
- `generatedContext`: AI-generated summary of student context

### 2. process-transcript
**Purpose:** Analyzes meeting transcripts to extract actionable items, tasks, and deliverables.

**File:** `/supabase/functions/process-transcript/index.ts`

**Environment Variables Used:**
- OPENAI_API_KEY (passed via request)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

**Input:**
- `transcriptText`: The meeting transcript text
- `phases`: List of available phases
- `tasks`: List of available tasks
- `studentId`: ID of the student
- `openaiApiKey`: OpenAI API key

**Output:**
- `extractedTasks`: Array of potential subtasks extracted from transcript
- `phaseOptions`: Available phases
- `taskOptions`: Available tasks

### 3. ai-chat
**Purpose:** Processes chat messages and generates AI responses for the counsellor.

**File:** `/supabase/functions/ai-chat/index.ts`

**Environment Variables Used:**
- OPENAI_API_KEY

**Input:**
- `messages`: Array of chat messages

**Output:**
- `aiResponse`: AI-generated response

## Environment Variables & Secrets

The project uses the following environment variables and secrets:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://dvhgvkkcbxhbjogjeuxs.supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# OpenAI Configuration
VITE_OPENAI_API_KEY=[openai-api-key]
```

These are stored in the `.env` file at the project root.

## Database Migrations

The database migrations are stored in the `/supabase/migrations` directory. Each migration is a SQL file that represents a batch of changes to the database schema. Migrations are named with a timestamp prefix and a descriptive name.

Key migrations include:
- `20250424070044_calm_shore.sql`: Add remark column to student_subtasks table
- `20250424093336_amber_water.sql`: Add title column to notes table
- `20250424110519_quick_reef.sql`: Secure notes storage bucket with RLS policies
- `20250424112445_hidden_snow.sql`: Storage policies for file access and management
- `20250424115646_shy_spire.sql`: Public access policy for notes storage bucket
- `20250424130641_quiet_harbor.sql`: Cross-counsellor access for student data
- `20250424132306_humble_frost.sql`: Add other_curriculum column to students table
- `20250425102930_green_wind.sql`: Remove subtask notes and update notes table structure
- `20250430050352_still_morning.sql`: Add note editing history columns
- `20250430050356_rustic_torch.sql`: Update note edit permissions
- `20250430051057_snowy_fog.sql`: Fix Notes Table RLS Policies
- `20250430054133_quiet_recipe.sql`: Update schema to allow student context generation
- `20250430130503_frosty_trail.sql`: Add ETA and Owner fields to student_subtasks table
- `20250430132051_blue_scene.sql`: Increase subtask remark length limit
- `20250602123456_files_management.sql`: Create files table and RLS policies for file management

## Storage Configuration

### Buckets
- `notes`: Used for storing file attachments including text files, images, transcripts, and general document files.

### Public Access
- Public read access is enabled for the `notes` bucket to ensure that files can be viewed by authenticated users and others who have the file URL.
- Write operations (insert, update, delete) are restricted to authenticated counsellors only.