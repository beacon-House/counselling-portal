-- Supabase SQL Schema for Beacon House Counsellor Portal (Fully Updated)

-- Table: counsellors
-- Stores manually created counsellor accounts
CREATE TABLE counsellors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: students
-- Each student is a "folder" assigned to a counsellor
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    target_year INT NOT NULL, -- Target year of college entry (e.g., 2027)
    grade TEXT NOT NULL,      -- Current grade (e.g., 11 or 12)
    curriculum TEXT NOT NULL, -- IB / IGCSE / CBSE / ICSE / Other
    student_context TEXT,     -- AI-generated summary of student profile/progress
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    counsellor_id UUID REFERENCES counsellors(id) ON DELETE SET NULL
);

-- Table: phases
-- Global phases applicable to all students
CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sequence INTEGER NOT NULL, -- Order in the roadmap
    UNIQUE(name)
);

-- Table: tasks
-- Global tasks within each phase
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sequence INTEGER NOT NULL, -- Order within phase
    UNIQUE(phase_id, name)
);

-- Table: student_subtasks
-- Custom subtasks added by counsellors per student under global tasks
CREATE TABLE student_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'yet_to_start' CHECK (
        status IN ('yet_to_start', 'in_progress', 'done', 'blocked', 'not_applicable')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    -- Note: Phase can be derived from task_id → phase_id join; no need to duplicate
);

-- Table: notes
-- Notes can be attached at any level (student, phase, task, subtask)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id),
    task_id UUID REFERENCES tasks(id),
    subtask_id UUID REFERENCES student_subtasks(id),
    content TEXT,
    type TEXT CHECK (type IN ('text', 'file', 'image', 'transcript')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_student_tasks ON student_subtasks(student_id, task_id);
CREATE INDEX idx_student_phase_task ON notes(student_id, phase_id, task_id);
CREATE INDEX idx_subtask_id ON notes(subtask_id);
CREATE INDEX idx_note_created_at ON notes(created_at DESC);
CREATE INDEX idx_note_type ON notes(type);

CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_note_embedding ON note_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Seeding data for phases and tasks
INSERT INTO phases (name, sequence) VALUES ('Interest Exploration', 1);
INSERT INTO phases (name, sequence) VALUES ('Academic Enrichment & Research', 2);
INSERT INTO phases (name, sequence) VALUES ('Innovation Capstone Project', 3);
INSERT INTO phases (name, sequence) VALUES ('Extracurriculars', 4);
INSERT INTO phases (name, sequence) VALUES ('Standardized Testing', 5);
INSERT INTO phases (name, sequence) VALUES ('Essays', 6);
INSERT INTO phases (name, sequence) VALUES ('Letters of Recommendation', 7);
INSERT INTO phases (name, sequence) VALUES ('College Research', 8);
INSERT INTO phases (name, sequence) VALUES ('Application Prep', 9);

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Self-Reflection & Passion Identification', 1
        FROM phases
        WHERE name = 'Interest Exploration';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Skills and Strengths Mapping', 2
        FROM phases
        WHERE name = 'Interest Exploration';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Career Exploration', 3
        FROM phases
        WHERE name = 'Interest Exploration';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Online Courses & Workshops', 4
        FROM phases
        WHERE name = 'Interest Exploration';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Extracurricular Sampling', 5
        FROM phases
        WHERE name = 'Interest Exploration';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Mentorship & Guidance', 6
        FROM phases
        WHERE name = 'Interest Exploration';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Strong Academic Foundation', 1
        FROM phases
        WHERE name = 'Academic Enrichment & Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Advanced Coursework/Self-Study', 2
        FROM phases
        WHERE name = 'Academic Enrichment & Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Academic Competitions & Olympiads', 3
        FROM phases
        WHERE name = 'Academic Enrichment & Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Independent or Mentored Research', 4
        FROM phases
        WHERE name = 'Academic Enrichment & Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Academic Summer Programs', 5
        FROM phases
        WHERE name = 'Academic Enrichment & Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Reading & Intellectual Curiosity', 6
        FROM phases
        WHERE name = 'Academic Enrichment & Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Project Ideation', 1
        FROM phases
        WHERE name = 'Innovation Capstone Project';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Planning & Resource Gathering', 2
        FROM phases
        WHERE name = 'Innovation Capstone Project';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Execution & Development', 3
        FROM phases
        WHERE name = 'Innovation Capstone Project';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Documentation & Reflection', 4
        FROM phases
        WHERE name = 'Innovation Capstone Project';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Showcase & Impact', 5
        FROM phases
        WHERE name = 'Innovation Capstone Project';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Continuation & Next Steps', 6
        FROM phases
        WHERE name = 'Innovation Capstone Project';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Selection of Core Activities', 1
        FROM phases
        WHERE name = 'Extracurriculars';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Leadership & Initiative', 2
        FROM phases
        WHERE name = 'Extracurriculars';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Depth of Involvement', 3
        FROM phases
        WHERE name = 'Extracurriculars';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Community Service & Volunteering', 4
        FROM phases
        WHERE name = 'Extracurriculars';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Achievements & Recognition', 5
        FROM phases
        WHERE name = 'Extracurriculars';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Networking & Exposure', 6
        FROM phases
        WHERE name = 'Extracurriculars';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Test Strategy Planning', 1
        FROM phases
        WHERE name = 'Standardized Testing';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Preparation & Practice', 2
        FROM phases
        WHERE name = 'Standardized Testing';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Taking the Exams', 3
        FROM phases
        WHERE name = 'Standardized Testing';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Score Evaluation & Improvement', 4
        FROM phases
        WHERE name = 'Standardized Testing';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Balanced Perspective on Testing', 5
        FROM phases
        WHERE name = 'Standardized Testing';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Personal Narrative Brainstorming', 1
        FROM phases
        WHERE name = 'Essays';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Understanding Essay Prompts', 2
        FROM phases
        WHERE name = 'Essays';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Drafting the Personal Statement', 3
        FROM phases
        WHERE name = 'Essays';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Revising & Polishing', 4
        FROM phases
        WHERE name = 'Essays';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Supplemental Essays Game Plan', 5
        FROM phases
        WHERE name = 'Essays';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Final Essay Checklist', 6
        FROM phases
        WHERE name = 'Essays';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Choosing Recommenders', 1
        FROM phases
        WHERE name = 'Letters of Recommendation';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Building Relationships Early', 2
        FROM phases
        WHERE name = 'Letters of Recommendation';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Requesting the Letters', 3
        FROM phases
        WHERE name = 'Letters of Recommendation';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Making it Easy for Recommenders', 4
        FROM phases
        WHERE name = 'Letters of Recommendation';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Follow-Up and Gratitude', 5
        FROM phases
        WHERE name = 'Letters of Recommendation';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Define Your College Criteria', 1
        FROM phases
        WHERE name = 'College Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Build an Initial College List', 2
        FROM phases
        WHERE name = 'College Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'In-Depth Research & Visits', 3
        FROM phases
        WHERE name = 'College Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Connect with Students and Alumni', 4
        FROM phases
        WHERE name = 'College Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Narrow Down and Balance Your List', 5
        FROM phases
        WHERE name = 'College Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Financial Fit & Scholarship Research', 6
        FROM phases
        WHERE name = 'College Research';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Organize Your Application Materials', 1
        FROM phases
        WHERE name = 'Application Prep';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Create Accounts & Fill Basics', 2
        FROM phases
        WHERE name = 'Application Prep';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Craft a Cohesive Narrative', 3
        FROM phases
        WHERE name = 'Application Prep';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Finalize College-Specific Components', 4
        FROM phases
        WHERE name = 'Application Prep';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Financial Aid Applications', 5
        FROM phases
        WHERE name = 'Application Prep';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Submit Applications in Phases', 6
        FROM phases
        WHERE name = 'Application Prep';
        

        INSERT INTO tasks (phase_id, name, sequence)
        SELECT id, 'Interview Preparation (If Applicable)', 7
        FROM phases
        WHERE name = 'Application Prep';
        