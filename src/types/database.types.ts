/**
 * TypeScript types generated from the database schema
 * Provides type safety for database operations
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      counsellors: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      note_embeddings: {
        Row: {
          id: string
          note_id: string | null
          embedding: unknown | null
          created_at: string | null
        }
        Insert: {
          id?: string
          note_id?: string | null
          embedding?: unknown | null
          created_at?: string | null
        }
        Update: {
          id?: string
          note_id?: string | null
          embedding?: unknown | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_embeddings_note_id_fkey"
            columns: ["note_id"]
            referencedRelation: "notes"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          student_id: string | null
          phase_id: string | null
          task_id: string | null
          content: string | null
          type: string | null
          file_url: string | null
          created_at: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          phase_id?: string | null
          task_id?: string | null
          content?: string | null
          type?: string | null
          file_url?: string | null
          created_at?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          phase_id?: string | null
          task_id?: string | null
          content?: string | null
          type?: string | null
          file_url?: string | null
          created_at?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_phase_id_fkey"
            columns: ["phase_id"]
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          }
        ]
      }
      phases: {
        Row: {
          id: string
          name: string
          sequence: number
        }
        Insert: {
          id?: string
          name: string
          sequence: number
        }
        Update: {
          id?: string
          name?: string
          sequence?: number
        }
        Relationships: []
      }
      student_subtasks: {
        Row: {
          id: string
          student_id: string | null
          task_id: string | null
          name: string
          status: string | null
          created_at: string | null
          remark: string | null
          eta: string | null
          owner: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          task_id?: string | null
          name: string
          status?: string | null
          created_at?: string | null
          remark?: string | null
          eta?: string | null
          owner?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          task_id?: string | null
          name?: string
          status?: string | null
          created_at?: string | null
          remark?: string | null
          eta?: string | null
          owner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_subtasks_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subtasks_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      students: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          target_year: number
          grade: string
          curriculum: string
          student_context: string | null
          created_at: string | null
          counsellor_id: string | null
          other_curriculum: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          target_year: number
          grade: string
          curriculum: string
          student_context?: string | null
          created_at?: string | null
          counsellor_id?: string | null
          other_curriculum?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          target_year?: number
          grade?: string
          curriculum?: string
          student_context?: string | null
          created_at?: string | null
          counsellor_id?: string | null
          other_curriculum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_counsellor_id_fkey"
            columns: ["counsellor_id"]
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          phase_id: string | null
          name: string
          sequence: number
          subtask_suggestion: string | null
        }
        Insert: {
          id?: string
          phase_id?: string | null
          name: string
          sequence: number
          subtask_suggestion?: string | null
        }
        Update: {
          id?: string
          phase_id?: string | null
          name?: string
          sequence?: number
          subtask_suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            referencedRelation: "phases"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          id: string
          student_id: string | null
          phase_id: string | null
          task_id: string | null
          file_name: string
          file_url: string
          file_type: string | null
          file_size: number | null
          description: string | null
          counsellor_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          phase_id?: string | null
          task_id?: string | null
          file_name: string
          file_url: string
          file_type?: string | null
          file_size?: number | null
          description?: string | null
          counsellor_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          phase_id?: string | null
          task_id?: string | null
          file_name?: string
          file_url?: string
          file_type?: string | null
          file_size?: number | null
          description?: string | null
          counsellor_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_counsellor_id_fkey"
            columns: ["counsellor_id"]
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_phase_id_fkey"
            columns: ["phase_id"]
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}