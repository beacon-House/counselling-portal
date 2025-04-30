/**
 * Note details component
 * Provides a full-screen, immersive note-taking experience
 */
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Loader, X, FileText, Trash2 } from 'lucide-react';
import { Note } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

interface NoteDetailsProps {
  note?: Note | null;
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
  onClose: () => void;
  onSave: (newNote: Note) => void;
  onDelete?: (noteId: string) => void;
  isNewNote?: boolean;
}

export default function NoteDetails({
  note,
  studentId,
  phaseId,
  taskId,
  onClose,
  onSave,
  onDelete,
  isNewNote = false
}: NoteDetailsProps) {
  const [title, setTitle] = useState<string>(note?.title || '');
  const [content, setContent] = useState<string>(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { counsellor } = useAuth();
  
  const contentEditableRef = useRef<HTMLDivElement>(null);
  
  // Set initial values from the note
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    }
  }, [note]);
  
  // Focus the content editable div when opening in text mode
  useEffect(() => {
    if (isNewNote && contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  }, [isNewNote]);
  
  // Update contentEditable div when content changes
  useEffect(() => {
    if (contentEditableRef.current) {
      // Only update if different to avoid cursor jumps
      if (contentEditableRef.current.textContent !== content) {
        contentEditableRef.current.textContent = content;
      }
    }
  }, [content]);
  
  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.textContent || '');
  };
  
  const handleSave = async () => {
    if (!counsellor) {
      setError("You must be logged in to save notes");
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      // Save text note
      const noteData: Partial<Note> = {
        id: note?.id, // Will be undefined for new notes
        student_id: studentId,
        phase_id: phaseId,
        task_id: taskId,
        title: title || null,
        content: content || '',
        type: 'text',
        updated_by: counsellor.id, // Add counsellor ID for edit tracking
      };
      
      let savedNote: Note;
      
      if (note?.id) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', note.id)
          .select(`
            *,
            editor:updated_by(name)
          `)
          .single();
          
        if (error) throw error;
        savedNote = data as Note;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert(noteData)
          .select(`
            *,
            editor:updated_by(name)
          `)
          .single();
          
        if (error) throw error;
        savedNote = data as Note;
      }
      
      onSave(savedNote);
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!note?.id || !onDelete) return;
    
    setIsSaving(true);
    try {
      // Delete the note record
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);
        
      if (error) throw error;
      
      onDelete(note.id);
      onClose();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    } finally {
      setIsSaving(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  // Confirmation modal for delete
  const DeleteConfirmationModal = () => (
    <AnimatePresence>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-4"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Note</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="ml-4 flex items-center">
            <span className="mr-3 text-gray-500">
              <FileText className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-light text-gray-800">
              {isNewNote ? 'New Note' : title || 'Untitled Note'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {note?.id && onDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500"
              title="Delete note"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || (!content.trim() && !title.trim())}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <Loader className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-4">
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Title input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-medium placeholder-gray-300 border-0 border-b border-gray-100 pb-2 focus:outline-none focus:border-gray-300 transition-colors"
            />
          </div>
          
          {/* Content area */}
          <div
            ref={contentEditableRef}
            contentEditable="true"
            onInput={handleContentInput}
            className="prose prose-lg max-w-none min-h-[calc(100vh-250px)] focus:outline-none"
            placeholder="Start writing..."
            suppressContentEditableWarning={true}
          />
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal />
    </div>
  );
}