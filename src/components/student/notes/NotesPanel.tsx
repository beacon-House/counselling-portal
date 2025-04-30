/**
 * Notes panel component
 * Displays and manages notes for a student/phase/task with full-screen editing capability
 * Updated to properly handle subtaskId prop and prevent reference errors
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Note } from '../../../types/types';
import { Loader, X, Search, Calendar, Plus } from 'lucide-react';
import NoteItem from './NoteItem';
import NoteDetails from './NoteDetails';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesPanelProps {
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
  subtaskId?: string | null;
  isDetailView?: boolean;
  selectedNote?: Note | null;
  setIsDetailView?: (isDetailView: boolean) => void;
  setSelectedNote?: (note: Note | null) => void;
}

export default function NotesPanel({ 
  studentId, 
  phaseId, 
  taskId,
  subtaskId = null,
  isDetailView = false,
  selectedNote = null,
  setIsDetailView = () => {},
  setSelectedNote = () => {}
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localIsDetailView, setLocalIsDetailView] = useState(isDetailView);
  const [localSelectedNote, setLocalSelectedNote] = useState<Note | null>(selectedNote);
  
  useEffect(() => {
    fetchNotes();
  }, [studentId, phaseId, taskId, subtaskId]);

  // Sync local and parent state
  useEffect(() => {
    setLocalIsDetailView(isDetailView);
    setLocalSelectedNote(selectedNote);
  }, [isDetailView, selectedNote]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notes')
        .select(`
          *,
          editor:updated_by(name)
        `)
        .eq('student_id', studentId)
        .eq('type', 'text')
        .order('created_at', { ascending: false });
      
      if (phaseId) {
        query = query.eq('phase_id', phaseId);
      }
      
      if (taskId) {
        query = query.eq('task_id', taskId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setNotes(data as Note[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setLocalSelectedNote(null);
    setLocalIsDetailView(true);
    setIsDetailView(true);
    setSelectedNote(null);
  };
  
  const handleViewNote = (note: Note) => {
    setLocalSelectedNote(note);
    setLocalIsDetailView(true);
    setIsDetailView(true);
    setSelectedNote(note);
  };
  
  const handleEditNote = (note: Note) => {
    setLocalSelectedNote(note);
    setLocalIsDetailView(true);
    setIsDetailView(true);
    setSelectedNote(note);
  };
  
  const handleCloseDetail = () => {
    setLocalIsDetailView(false);
    setLocalSelectedNote(null);
    setIsDetailView(false);
    setSelectedNote(null);
  };
  
  const handleSaveNote = (note: Note) => {
    const isNewNote = !localSelectedNote?.id;
    
    if (isNewNote) {
      // Add new note to list
      setNotes([note, ...notes]);
    } else {
      // Update existing note in list
      setNotes(notes.map(n => n.id === note.id ? note : n));
    }
    
    setLocalIsDetailView(false);
    setLocalSelectedNote(null);
    setIsDetailView(false);
    setSelectedNote(null);
  };
  
  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };
  
  // Filter notes by search term
  const filteredNotes = notes.filter(note => {
    const searchContent = 
      (note.title || '') + 
      (note.content || '');
    
    return searchContent.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Helper to get contextual details
  const getContextText = () => {
    if (subtaskId) {
      return "for this subtask";
    } else if (taskId) {
      return "for this task";
    } else if (phaseId) {
      return "for this phase";
    } else {
      return "for this student";
    }
  };
  
  // Group notes by date (today, yesterday, this week, earlier)
  const groupNotesByDate = (notes: Note[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    const grouped: Record<string, Note[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': [],
    };
    
    notes.forEach(note => {
      const noteDate = new Date(note.created_at);
      noteDate.setHours(0, 0, 0, 0);
      
      if (noteDate.getTime() === today.getTime()) {
        grouped['Today'].push(note);
      } else if (noteDate.getTime() === yesterday.getTime()) {
        grouped['Yesterday'].push(note);
      } else if (noteDate > thisWeekStart) {
        grouped['This Week'].push(note);
      } else {
        grouped['Earlier'].push(note);
      }
    });
    
    return Object.entries(grouped).filter(([_, notes]) => notes.length > 0);
  };

  // If in detail view, render NoteDetails component
  if (localIsDetailView) {
    return (
      <NoteDetails
        note={localSelectedNote}
        studentId={studentId}
        phaseId={phaseId}
        taskId={taskId}
        onClose={handleCloseDetail}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        isNewNote={!localSelectedNote?.id}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-light text-gray-800">Notes {getContextText()}</h2>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Search and Create */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateNote}
            className="px-4 py-3 rounded-lg bg-gray-800 text-white flex items-center hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </motion.button>
        </div>
      </div>
      
      {/* Notes List */}
      <div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-gray-300" />
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="space-y-8">
            {groupNotesByDate(filteredNotes).map(([dateGroup, groupNotes]) => (
              <div key={dateGroup}>
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateGroup}
                </h3>
                <div className="space-y-4">
                  {groupNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleViewNote(note)}
                      className="cursor-pointer"
                    >
                      <NoteItem 
                        note={note} 
                        onEdit={handleEditNote}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100"
          >
            <h3 className="text-gray-600 font-medium mb-1">No notes yet</h3>
            <p className="text-gray-500 mb-5">Create your first note to get started</p>
            <button
              onClick={handleCreateNote}
              className="mx-auto px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}