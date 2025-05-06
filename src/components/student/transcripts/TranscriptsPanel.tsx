/**
 * Transcripts panel component
 * Displays and manages transcript notes for a student/phase/task with full-screen editing capability
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Note } from '../../../types/types';
import { Loader, X, Search, Calendar, Plus, MessageSquare } from 'lucide-react';
import NoteItem from '../notes/NoteItem';
import NoteDetails from '../notes/NoteDetails';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptsPanelProps {
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
  subtaskId?: string | null;
  isDetailView?: boolean;
  selectedNote?: Note | null;
  setIsDetailView?: (isDetailView: boolean) => void;
  setSelectedNote?: (note: Note | null) => void;
}

export default function TranscriptsPanel({ 
  studentId, 
  phaseId, 
  taskId,
  subtaskId = null,
  isDetailView = false,
  selectedNote = null,
  setIsDetailView = () => {},
  setSelectedNote = () => {}
}: TranscriptsPanelProps) {
  const [transcripts, setTranscripts] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localIsDetailView, setLocalIsDetailView] = useState(isDetailView);
  const [localSelectedNote, setLocalSelectedNote] = useState<Note | null>(selectedNote);
  
  useEffect(() => {
    fetchTranscripts();
  }, [studentId, phaseId, taskId, subtaskId]);

  // Sync local and parent state
  useEffect(() => {
    setLocalIsDetailView(isDetailView);
    setLocalSelectedNote(selectedNote);
  }, [isDetailView, selectedNote]);

  const fetchTranscripts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notes')
        .select(`
          *,
          editor:updated_by(name)
        `)
        .eq('student_id', studentId)
        .eq('type', 'transcript') // Only fetch transcript notes
        .order('created_at', { ascending: false });
      
      if (phaseId) {
        query = query.eq('phase_id', phaseId);
      }
      
      if (taskId) {
        query = query.eq('task_id', taskId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setTranscripts(data as Note[]);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      setError('Failed to load transcripts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTranscript = () => {
    setLocalSelectedNote(null);
    setLocalIsDetailView(true);
    setIsDetailView(true);
    setSelectedNote(null);
  };
  
  const handleViewTranscript = (transcript: Note) => {
    setLocalSelectedNote(transcript);
    setLocalIsDetailView(true);
    setIsDetailView(true);
    setSelectedNote(transcript);
  };
  
  const handleEditTranscript = (transcript: Note) => {
    setLocalSelectedNote(transcript);
    setLocalIsDetailView(true);
    setIsDetailView(true);
    setSelectedNote(transcript);
  };
  
  const handleCloseDetail = () => {
    setLocalIsDetailView(false);
    setLocalSelectedNote(null);
    setIsDetailView(false);
    setSelectedNote(null);
    
    // Refresh transcripts to get up-to-date task processing info
    fetchTranscripts();
  };
  
  const handleSaveTranscript = (transcript: Note) => {
    const isNewTranscript = !localSelectedNote?.id;
    
    if (isNewTranscript) {
      // Add new transcript to list
      setTranscripts([transcript, ...transcripts]);
    } else {
      // Update existing transcript in list
      setTranscripts(transcripts.map(t => t.id === transcript.id ? transcript : t));
    }
    
    // Don't automatically close the detail view for transcripts
    // Let the user decide to process or close
  };
  
  const handleDeleteTranscript = (transcriptId: string) => {
    setTranscripts(transcripts.filter(t => t.id !== transcriptId));
  };
  
  // Filter transcripts by search term
  const filteredTranscripts = transcripts.filter(transcript => {
    const matchesSearch = 
      (transcript.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transcript.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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
  
  // Group transcripts by date (today, yesterday, this week, earlier)
  const groupTranscriptsByDate = (transcripts: Note[]) => {
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
    
    transcripts.forEach(transcript => {
      const transcriptDate = new Date(transcript.created_at);
      transcriptDate.setHours(0, 0, 0, 0);
      
      if (transcriptDate.getTime() === today.getTime()) {
        grouped['Today'].push(transcript);
      } else if (transcriptDate.getTime() === yesterday.getTime()) {
        grouped['Yesterday'].push(transcript);
      } else if (transcriptDate > thisWeekStart) {
        grouped['This Week'].push(transcript);
      } else {
        grouped['Earlier'].push(transcript);
      }
    });
    
    return Object.entries(grouped).filter(([_, transcripts]) => transcripts.length > 0);
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
        onSave={handleSaveTranscript}
        onDelete={handleDeleteTranscript}
        isNewNote={!localSelectedNote?.id}
        isTranscript={true} // Always transcripts in this panel
      />
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-light text-gray-800">Transcripts {getContextText()}</h2>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search transcripts..."
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
            onClick={handleCreateTranscript}
            className="px-4 py-3 rounded-lg bg-gray-800 text-white flex items-center hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transcript
          </motion.button>
        </div>
      </div>
      
      {/* Transcripts Grid Layout */}
      <div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-gray-300" />
          </div>
        ) : filteredTranscripts.length > 0 ? (
          <div className="space-y-8">
            {groupTranscriptsByDate(filteredTranscripts).map(([dateGroup, groupTranscripts]) => (
              <div key={dateGroup}>
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateGroup}
                </h3>
                
                {/* Responsive grid layout for transcripts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupTranscripts.map((transcript) => (
                    <motion.div
                      key={transcript.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleViewTranscript(transcript)}
                      className="cursor-pointer h-full flex"
                    >
                      <NoteItem 
                        note={transcript} 
                        onEdit={handleEditTranscript}
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
            className="text-center py-10 md:py-12 bg-gray-50 rounded-lg border border-gray-100"
          >
            <h3 className="text-gray-600 font-medium mb-1">No transcripts yet</h3>
            <p className="text-gray-500 mb-5">
              Upload meeting transcripts to automatically extract action items and create subtasks.
            </p>
            <button
              onClick={handleCreateTranscript}
              className="mx-auto px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transcript
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}