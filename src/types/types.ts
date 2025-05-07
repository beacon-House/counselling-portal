/**
 * Application-specific type definitions
 */

export type SubtaskStatus = 'yet_to_start' | 'in_progress' | 'done' | 'blocked' | 'not_applicable';

export type NoteType = 'text' | 'file' | 'image' | 'transcript';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export interface Phase {
  id: string;
  name: string;
  sequence: number;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  sequence: number;
  phase_id: string;
  subtasks?: Subtask[];
  subtask_suggestion?: string; // Added field for task hover suggestions
  has_new_ai_subtasks?: boolean; // Added to track new AI-generated subtasks
}

export interface Subtask {
  id: string;
  name: string;
  student_id: string;
  task_id: string;
  status: SubtaskStatus;
  created_at: string;
  remark?: string;
  eta?: string; // timestamp for expected completion date
  owner?: string[] | null; // Changed from string to string[] for multiple owners
  sequence?: number; // Added for drag and drop reordering
  is_ai_generated?: boolean; // Added to track AI-generated subtasks
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  school_name?: string; // Added school name field
  target_year: number;
  grade: string;
  curriculum: string;
  student_context?: string;
  created_at: string;
  counsellor_id: string;
  phases?: Phase[];
  counsellors?: {
    name: string;
  };
}

export interface Note {
  id: string;
  student_id?: string;
  phase_id?: string;
  task_id?: string;
  content?: string;
  type: NoteType;
  file_url?: string;
  created_at: string;
  title?: string;
  updated_at?: string;
  updated_by?: string;
  editor?: {
    name: string;
  };
}

export interface FileItem {
  id: string;
  student_id: string;
  phase_id?: string | null;
  task_id?: string | null;
  file_name: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  description?: string | null;
  counsellor_id?: string | null;
  created_at: string;
  counsellor?: {
    name: string;
  };
  phase?: {
    name: string;
  };
  task?: {
    name: string;
  };
}