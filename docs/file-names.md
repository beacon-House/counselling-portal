# Project Documentation: File Structure and Components

This document provides a comprehensive overview of all files in the Beacon House Counsellor Portal project, including their paths, components, functions, and purposes.

## Tech Stack Overview

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router Dom
- **State Management**: React Context API
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Database/Backend**: Supabase
- **AI Integration**: OpenAI API via Supabase Edge Functions
- **Build Tool**: Vite

## Core Files

### Root Configuration Files

| File Path | Description | Purpose |
|-----------|-------------|---------|
| `package.json` | Project dependencies and scripts | Contains all npm dependencies and project configuration |
| `tsconfig.json` | TypeScript configuration | Root TypeScript configuration that references other TS config files |
| `tsconfig.app.json` | Application TypeScript config | Contains TypeScript settings for the application code |
| `tsconfig.node.json` | Node.js TypeScript config | Contains TypeScript settings for Node.js environment |
| `vite.config.ts` | Vite configuration | Configure the Vite build tool and plugins |
| `eslint.config.js` | ESLint configuration | Configure JavaScript/TypeScript linting rules |
| `postcss.config.js` | PostCSS configuration | Configure CSS processing for Tailwind |
| `tailwind.config.js` | Tailwind CSS configuration | Configure Tailwind theme, extensions, and plugins |
| `index.html` | HTML entry point | Root HTML document with font loading and app mounting point |
| `.env` | Environment variables | Contains Supabase and OpenAI API connection details |
| `netlify.toml` | Netlify configuration | Configure deployment settings for Netlify |

### Source Files

#### Entry Points

| File Path | Components/Functions | Purpose | Dependencies |
|-----------|----------------------|---------|-------------|
| `src/main.tsx` | App (imported) | Application entry point, renders the App to DOM | React, ReactDOM, App component |
| `src/App.tsx` | App, ProtectedRoute, AppRoutes | Main application component, handles routing and authentication | React Router, AuthContext, Layout/Page components |
| `src/index.css` | None (CSS only) | Global CSS file with Tailwind imports | Tailwind CSS |

#### Context and State Management

| File Path | Components/Functions | Purpose | Dependencies |
|-----------|----------------------|---------|-------------|
| `src/context/AuthContext.tsx` | AuthProvider, useAuth | Authentication context provider and hook | React, Supabase |

#### Hooks and Utilities

| File Path | Components/Functions | Purpose | Dependencies |
|-----------|----------------------|---------|-------------|
| `src/hooks/useGenerateContext.tsx` | useGenerateContext | Custom hook for generating student context summaries | React, Supabase |
| `src/lib/supabase.ts` | supabase (singleton) | Supabase client configuration | @supabase/supabase-js |
| `src/vite-env.d.ts` | None (type definitions) | Vite environment type declarations | None |

#### Types

| File Path | Types/Interfaces | Purpose | Dependencies |
|-----------|------------------|---------|-------------|
| `src/types/types.ts` | User, Phase, Task, Subtask, Student, Note, etc. | Application-specific type definitions | None |
| `src/types/database.types.ts` | Database, Json | TypeScript types for database schema | None |

#### Authentication Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/auth/Login.tsx` | Login | Login form component | React, useAuth, Lucide, Framer Motion |

#### Layout Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/layout/AppLayout.tsx` | AppLayout | Main app layout with sidebar, header, content area | React Router, Sidebar, Header, Footer, Framer Motion |
| `src/components/layout/Header.tsx` | Header | Application header with user info and search | useAuth, Lucide, Framer Motion |
| `src/components/layout/Footer.tsx` | Footer | Application footer with copyright info | React |
| `src/components/layout/Sidebar.tsx` | Sidebar | Sidebar with student list, search, and counsellor indicators | React Router, Supabase, Lucide, Framer Motion |
| `src/components/layout/AIChatPanel.tsx` | AIChatPanel | AI assistant panel for counsellors to interact with AI | React, Supabase, OpenAI, Framer Motion |

#### Student Management Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/student/StudentView.tsx` | StudentView | Main student dashboard view with cross-counsellor access | React Router, Supabase, RoadmapView, NotesPanel, Framer Motion |
| `src/components/student/StudentHeader.tsx` | StudentHeader | Header showing student information and context summary | Supabase, useGenerateContext, Lucide, Framer Motion |
| `src/components/student/CreateStudent.tsx` | CreateStudent | Form to create new students with custom curriculum support | React Router, useAuth, Supabase, Lucide, Framer Motion |
| `src/components/student/FloatingActionButton.tsx` | FloatingActionButton | Contextual floating action button for adding notes | Lucide, Framer Motion |

#### Roadmap Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/student/roadmap/RoadmapView.tsx` | RoadmapView | Displays the student roadmap structure | Supabase, CreateSubtaskModal, SubtaskList, Framer Motion |
| `src/components/student/roadmap/SubtaskList.tsx` | SubtaskList, RemarkModal | Lists and manages subtasks with status remarks, ETA, and ownership | Supabase, DatePicker, Lucide, Framer Motion |
| `src/components/student/roadmap/CreateSubtaskModal.tsx` | CreateSubtaskModal | Modal for creating new subtasks | Supabase, Lucide, Framer Motion |
| `src/components/student/roadmap/TaskItem.tsx` | TaskItem | Individual task item with expand/collapse functionality | Supabase, Lucide, Framer Motion |

#### Notes Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/student/notes/NotesPanel.tsx` | NotesPanel | Panel for adding and viewing notes with file upload capabilities and filtering | Supabase, NoteItem, Lucide, Framer Motion |
| `src/components/student/notes/NoteItem.tsx` | NoteItem | Individual note display component with visual indicators for different note types | Lucide, Framer Motion |
| `src/components/student/notes/NoteDetails.tsx` | NoteDetails | Full-screen editor for creating and editing notes with transcript support | Supabase, TranscriptTaskReview, Lucide, Framer Motion |
| `src/components/student/notes/TranscriptTaskReview.tsx` | TranscriptTaskReview | Interface for reviewing and creating subtasks from transcript notes | Supabase, DatePicker, Lucide, Framer Motion |
| `src/components/student/notes/FileFixUtility.tsx` | FileFixUtility | Utility component to fix existing file records in the database | Supabase, Lucide |

### Supabase Edge Functions

| File Path | Function | Purpose | Dependencies |
|-----------|----------|---------|-------------|
| `supabase/functions/generate-context/index.ts` | generate-context | Edge function to generate AI-powered student context summaries | OpenAI |
| `supabase/functions/process-transcript/index.ts` | process-transcript | Edge function to analyze meeting transcripts and extract actionable items | OpenAI |
| `supabase/functions/ai-chat/index.ts` | ai-chat | Edge function for AI chat functionality | OpenAI |

### Database Migrations

| File Path | Purpose | Description |
|-----------|---------|-------------|
| `supabase/migrations/20250424070044_calm_shore.sql` | Add remark column | Add remark field to student_subtasks |
| `supabase/migrations/20250424093336_amber_water.sql` | Add title column | Add title field to notes table |
| `supabase/migrations/20250424110519_quick_reef.sql` | Storage security | Implement RLS for notes storage bucket |
| `supabase/migrations/20250424112445_hidden_snow.sql` | Storage policies | Add policies for file access and management |
| `supabase/migrations/20250424115646_shy_spire.sql` | Public access | Enable public access to notes storage bucket |
| `supabase/migrations/20250424130641_quiet_harbor.sql` | Cross-counsellor access | Enable counsellors to view all students |
| `supabase/migrations/20250424132306_humble_frost.sql` | Curriculum field | Add other_curriculum column to students table |
| `supabase/migrations/20250425102930_green_wind.sql` | Simplify notes structure | Remove subtask_id from notes table |
| `supabase/migrations/20250430050352_still_morning.sql` | Note editing history | Add updated_at and updated_by columns to notes |
| `supabase/migrations/20250430050356_rustic_torch.sql` | Note permissions | Add RLS policies for note editing |
| `supabase/migrations/20250430051057_snowy_fog.sql` | Notes RLS fixes | Complete CRUD operations for notes table |
| `supabase/migrations/20250430054133_quiet_recipe.sql` | Context generation | Enable student context updates |
| `supabase/migrations/20250430130503_frosty_trail.sql` | Subtask tracking | Add ETA and owner fields to student_subtasks |
| `supabase/migrations/20250430132051_blue_scene.sql` | Remark length | Update limit for subtask remarks |

### Documentation Files

| File Path | Description | Purpose |
|-----------|-------------|---------|
| `docs/prd.md` | Product Requirements Document | Detailed specification of product features and requirements |
| `docs/db-schema.md` | Database Schema Documentation | Complete SQL schema definition with edge functions, RLS, and migrations |
| `docs/implementation-progress.md` | Implementation Status | Current progress of implementation vs PRD requirements |
| `docs/file-names.md` | File Structure Documentation | This file - documentation of all project files and components |

## Component Functionality Details

### Authentication

- **Login**: Email/password authentication form that connects to Supabase Auth
- **AuthProvider**: Context provider that manages authentication state
- **useAuth**: Custom hook for consuming authentication state and methods

### Layout

- **AppLayout**: Three-panel layout with sidebar, main content, and optional AI panel
- **Header**: Contains user profile, search, and navigation controls
- **Sidebar**: Lists students with search and filtering capability
- **Footer**: Standard footer with copyright and links
- **AIChatPanel**: AI chat interface for querying student data across the system

### Student Management

- **StudentView**: Main dashboard for a student with roadmap and notes
- **StudentHeader**: Displays student information and context summary with generation capability
- **CreateStudent**: Form for adding new students to the system
- **FloatingActionButton**: Contextual button for adding notes to specific portions of the roadmap

### Roadmap

- **RoadmapView**: Hierarchical display of phases, tasks, and subtasks
- **SubtaskList**: Manages the status and display of subtasks with remarks
  - **RemarkModal**: Modal for adding remarks when changing subtask status
- **CreateSubtaskModal**: Interface for adding new subtasks to a task
- **TaskItem**: Individual task display with expandable subtask list

### Notes

- **NotesPanel**: Enhanced interface for creating and viewing notes with support for text, file, image, and transcript note types
  - Text entry with canvas-style editing
  - File upload with preview and description
  - Image upload with preview and description
  - Transcript upload with AI extraction of action items
  - Error handling and loading indicators
  - Filter by note type (All, Standard, Transcripts)
- **NoteItem**: Display component for different note types with extended functionality
  - Text note display with proper formatting
  - Image display with lazy loading
  - File display with download and view options
  - Transcript display with specialized formatting
  - File name extraction and formatting
- **NoteDetails**: Full-screen editor for creating and editing notes
  - Rich text editing for text notes
  - Type selection between standard notes and transcripts
  - Metadata editing (title, description)
  - File replacement functionality
- **TranscriptTaskReview**: Component for reviewing and managing extracted subtasks from transcripts
  - Displays AI-extracted subtasks
  - Allows editing, deleting, and adding new subtasks
  - Creates subtasks in student roadmap from transcript content

### AI Features

- **useGenerateContext**: Custom hook for generating student context summaries
- **generate-context**: Edge function for creating AI-powered summaries of student progress
- **process-transcript**: Edge function for extracting actionable items from meeting transcripts
- **ai-chat**: Edge function for natural language interaction with the system