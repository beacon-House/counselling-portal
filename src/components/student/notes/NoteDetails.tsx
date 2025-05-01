/**
 * Note details component
 * Provides a full-screen, immersive note-taking experience
 */
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Loader, X, FileText, Trash2, MessageSquare, FileType, ExternalLink } from 'lucide-react';
import { Note } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import TranscriptTaskReview from './TranscriptTaskReview';

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
  const [noteType, setNoteType] = useState<string>(note?.type || 'text');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShowingTaskReview, setIsShowingTaskReview] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<Note | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);
  const { counsellor } = useAuth();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Set initial values from the note
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setNoteType(note.type || 'text');
    }
  }, [note]);
  
  // Focus the textarea when opening in text mode
  useEffect(() => {
    if (isNewNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isNewNote]);
  
  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleSave = async () => {
    if (!counsellor) {
      setError("You must be logged in to save notes");
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      // Validate for transcript type
      if (noteType === 'transcript' && !content.trim()) {
        throw new Error("Transcript content cannot be empty");
      }
      
      // Save note
      const noteData: Partial<Note> = {
        id: note?.id, // Will be undefined for new notes
        student_id: studentId,
        phase_id: phaseId,
        task_id: taskId,
        title: title || null,
        content: content || '',
        type: noteType as 'text' | 'transcript',
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
      
      // Call onSave to update the UI with the saved note
      onSave(savedNote);
      
      // Keep track of the saved note ID for the task review
      setSavedNoteId(savedNote.id);
      setSavedNote(savedNote);
      setNoteSaved(true);
      
      // For transcript type notes, we don't automatically show the task review anymore
      // We'll let the user trigger it manually
      console.log('Saved transcript note, showing task review modal:', savedNote.id);
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
  
  const handleProcessTranscript = () => {
    // Only allow processing if note is saved and is a transcript
    if (savedNoteId && noteType === 'transcript') {
      setIsShowingTaskReview(true);
    } else {
      setError('Please save the transcript first');
    }
  };
  
  const handleTasksCreated = () => {
    // Close task review
    setIsShowingTaskReview(false);
    // Close note details
    onClose();
  };
  
  // Confirmation modal for delete
  const DeleteConfirmationModal = () => (
    <AnimatePresence>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-5 md:p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Note</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex flex-col xs:flex-row justify-end space-y-3 xs:space-y-0 xs:space-x-4">
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
                  <span className="flex items-center justify-center">
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

  // Saved note confirmation for transcripts
  const SavedNoteConfirmation = () => {
    if (!noteSaved || noteType !== 'transcript') return null;
    
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pt-4">
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="mr-2">✅</span>
              <span className="font-medium">Transcript saved successfully!</span>
            </div>
            <button onClick={() => setNoteSaved(false)} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm mb-3">
            Your transcript has been saved. Would you like to process it to extract tasks?
          </p>
          <button
            onClick={handleProcessTranscript}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Process Transcript
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="ml-2 md:ml-4 flex items-center">
            <span className="mr-3 text-gray-500">
              {noteType === 'transcript' ? <MessageSquare className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </span>
            <h1 className="text-lg md:text-xl font-light text-gray-800 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {isNewNote ? 'New Note' : title || 'Untitled Note'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Note Type Selector */}
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="py-1.5 md:py-2 px-2 md:px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="text">Standard Note</option>
            <option value="transcript">Meeting Transcript</option>
          </select>
          
          {note?.id && onDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500"
              title="Delete note"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || (!content.trim() && !title.trim())}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <Loader className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span className="hidden xs:inline">Save</span>
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
      
      {/* Saved confirmation with process button for transcripts */}
      <SavedNoteConfirmation />
      
      {/* Note type explanation */}
      <div className="mx-auto w-full max-w-4xl px-4 pt-4">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            {noteType === 'transcript' ? (
              <>
                <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                Meeting Transcript
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Standard Note
              </>
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {noteType === 'transcript' 
              ? 'Enter meeting transcript text. After saving, we\'ll analyze it to extract action items that can be converted to subtasks.'
              : 'Standard note for documenting information, ideas, or observations.'}
          </p>
        </div>
      </div>
      
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
              className="w-full text-xl md:text-3xl font-medium placeholder-gray-300 border-0 border-b border-gray-100 pb-2 focus:outline-none focus:border-gray-300 transition-colors"
            />
          </div>
          
          {/* Content area - Replace contentEditable with textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            className="w-full prose prose-lg max-w-none min-h-[calc(100vh-300px)] focus:outline-none resize-none border-0 font-inherit"
            placeholder={noteType === 'transcript' ? 'Paste meeting transcript here...' : 'Start writing...'}
            style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.5', 
              fontFamily: 'inherit', 
              fontSize: 'inherit',
              backgroundColor: 'transparent'
            }}
          />
        </div>
      </div>
      
      {/* Task Review Modal */}
      {isShowingTaskReview && (
        <TranscriptTaskReview
          noteId={savedNoteId || note?.id || ''}
          transcriptText={content}
          studentId={studentId}
          onClose={() => setIsShowingTaskReview(false)}
          onTasksCreated={handleTasksCreated}
        />
      )}
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal />
    </div>
  );
}