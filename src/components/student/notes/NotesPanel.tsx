/**
 * Notes panel component
 * Displays and manages notes for a student/phase/task
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Note } from '../../../types/types';
import { PlusCircle, FileText, Image, File, MessageSquare, Loader } from 'lucide-react';
import NoteItem from './NoteItem';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesPanelProps {
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
}

export default function NotesPanel({ studentId, phaseId, taskId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeNoteType, setActiveNoteType] = useState<'text' | 'file' | 'image' | 'transcript'>('text');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [studentId, phaseId, taskId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('student_id', studentId)
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
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNoteContent.trim() && activeNoteType === 'text') return;
    
    setIsSaving(true);
    try {
      const noteData: Partial<Note> = {
        student_id: studentId,
        phase_id: phaseId || null,
        task_id: taskId || null,
        type: activeNoteType,
      };
      
      if (activeNoteType === 'text') {
        noteData.content = newNoteContent;
      }
      
      const { data, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add new note to the list
      setNotes([data as Note, ...notes]);
      
      // Clear the form
      setNewNoteContent('');
      setActiveNoteType('text');
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-light mb-6 text-gray-800">Notes</h2>
      
      {/* Create Note Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden"
      >
        <div className="flex border-b border-gray-100">
          {[
            { type: 'text', icon: FileText, label: 'Text' },
            { type: 'file', icon: File, label: 'File' },
            { type: 'image', icon: Image, label: 'Image' },
            { type: 'transcript', icon: MessageSquare, label: 'Transcript' },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => setActiveNoteType(item.type as any)}
              className={`flex-1 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                activeNoteType === item.type 
                  ? 'text-gray-900 border-b-2 border-gray-800 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-4 w-4 inline mr-2" />
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNoteType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeNoteType === 'text' ? (
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type your note here..."
                  className="w-full p-4 border border-gray-200 rounded-lg min-h-[120px] focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-gray-700"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center bg-gray-50">
                  <div className="mb-3">
                    {activeNoteType === 'file' && <File className="h-12 w-12 text-gray-300" />}
                    {activeNoteType === 'image' && <Image className="h-12 w-12 text-gray-300" />}
                    {activeNoteType === 'transcript' && <MessageSquare className="h-12 w-12 text-gray-300" />}
                  </div>
                  <p className="text-sm text-gray-500 text-center mb-3">
                    Drop your {activeNoteType} here or click to browse
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-2 text-sm text-gray-700 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-all duration-200"
                  >
                    Browse files
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={createNote}
              disabled={isSaving || (activeNoteType === 'text' && !newNoteContent.trim())}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSaving ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Note
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Notes List */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-gray-300" />
          </div>
        ) : notes.length > 0 ? (
          <AnimatePresence>
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <NoteItem note={note} />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400">No notes yet. Create your first note above.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}