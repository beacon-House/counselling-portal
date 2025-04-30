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
| `.env` | Environment variables | Contains Supabase connection details |
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

#### Utilities and Configuration

| File Path | Components/Functions | Purpose | Dependencies |
|-----------|----------------------|---------|-------------|
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

#### Student Management Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/student/StudentView.tsx` | StudentView | Main student dashboard view with cross-counsellor access | React Router, Supabase, RoadmapView, NotesPanel, Framer Motion |
| `src/components/student/StudentHeader.tsx` | StudentHeader | Header showing student information | Supabase, Lucide, Framer Motion |
| `src/components/student/CreateStudent.tsx` | CreateStudent | Form to create new students with custom curriculum support | React Router, useAuth, Supabase, Lucide, Framer Motion |
| `src/components/student/FloatingActionButton.tsx` | FloatingActionButton | Contextual floating action button for adding notes | Lucide, Framer Motion |

#### Roadmap Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/student/roadmap/RoadmapView.tsx` | RoadmapView | Displays the student roadmap structure | Supabase, CreateSubtaskModal, SubtaskList, Framer Motion |
| `src/components/student/roadmap/SubtaskList.tsx` | SubtaskList, RemarkModal | Lists and manages subtasks with status remarks | Supabase, Lucide, Framer Motion |
| `src/components/student/roadmap/CreateSubtaskModal.tsx` | CreateSubtaskModal | Modal for creating new subtasks | Supabase, Lucide, Framer Motion |
| `src/components/student/roadmap/TaskItem.tsx` | TaskItem | Individual task item with expand/collapse functionality | Supabase, Lucide, Framer Motion |

#### Notes Components

| File Path | Components | Purpose | Dependencies |
|-----------|------------|---------|-------------|
| `src/components/student/notes/NotesPanel.tsx` | NotesPanel | Panel for adding and viewing notes with file upload capabilities | Supabase, NoteItem, Lucide, Framer Motion |
| `src/components/student/notes/NoteItem.tsx` | NoteItem | Individual note display component with support for different note types (text, file, image, transcript) | Lucide, Framer Motion |
| `src/components/student/notes/NoteDetails.tsx` | NoteDetails | Full-screen editor for creating and editing notes | Supabase, Lucide, Framer Motion |

### Documentation Files

| File Path | Description | Purpose |
|-----------|-------------|---------|
| `docs/prd.md` | Product Requirements Document | Detailed specification of product features and requirements |
| `docs/db-schema.md` | Database Schema Documentation | SQL schema definition and documentation |
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

### Student Management

- **StudentView**: Main dashboard for a student with roadmap and notes
- **StudentHeader**: Displays student information and context summary
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
  - Transcript upload with preview and description
  - Error handling and loading indicators
  - Drag-and-drop interface for file uploads
- **NoteItem**: Display component for different note types with extended functionality
  - Text note display with proper formatting
  - Image display with lazy loading
  - File display with download and view options
  - Transcript display with specialized formatting
  - File name extraction and formatting
- **NoteDetails**: Full-screen editor for creating and editing notes
  - Rich text editing for text notes
  - File upload and preview
  - Image upload and preview
  - Metadata editing (title, description)
  - File replacement functionality

## Dependencies

### Core Dependencies

- **react**: UI library
- **react-dom**: React DOM rendering
- **react-router-dom**: Routing library
- **@supabase/supabase-js**: Supabase client for database/auth
- **framer-motion**: Animation library
- **lucide-react**: Icon library
- **typescript**: TypeScript language support

### Development Dependencies

- **vite**: Build tool
- **eslint**: Linting tool
- **typescript-eslint**: TypeScript ESLint integration
- **tailwindcss**: Utility-first CSS framework
- **autoprefixer**: PostCSS plugin
- **postcss**: CSS transformation tool
- **@vitejs/plugin-react**: Vite plugin for React

## Current State of Application

The application is a functional counsellor portal for managing student progress through a predefined roadmap of phases and tasks. It implements:

- Authentication system
- Student management (create, view, search)
- Roadmap navigation and tracking
- Custom subtask management with status tracking and remarks
- Enhanced notes system with multiple content types:
  - Text entry with canvas-style editing
  - File uploads with preview and description
  - Image uploads with preview and description
  - Transcript uploads with specialized formatting
- Responsive design with mobile adaptations
- Animations for UI interactions

The application is built on a Supabase backend with a React/TypeScript frontend, styled with Tailwind CSS, and deployed via Netlify.