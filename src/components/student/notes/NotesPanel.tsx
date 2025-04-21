/**
 * Notes panel component
 * Displays and manages notes for a student/phase/task
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Note } from '../../../types/types';
import { PlusCircle, FileText, Image, File, MessageSquare, Loader } from 'lucide-react';
import NoteItem from './NoteItem';

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

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'file':
        return <File className="h-4 w-4" />;
      case 'transcript':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Notes</h2>
      
      {/* Create Note Section */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveNoteType('text')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeNoteType === 'text' 
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-1" />
            Text
          </button>
          <button
            onClick={() => setActiveNoteType('file')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeNoteType === 'file' 
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <File className="h-4 w-4 inline mr-1" />
            File
          </button>
          <button
            onClick={() => setActiveNoteType('image')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeNoteType === 'image' 
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Image className="h-4 w-4 inline mr-1" />
            Image
          </button>
          <button
            onClick={() => setActiveNoteType('transcript')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeNoteType === 'transcript' 
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Transcript
          </button>
        </div>
        
        <div className="p-3">
          {activeNoteType === 'text' ? (
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Type your note here..."
              className="w-full p-2 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
              <div className="mb-2">
                {activeNoteType === 'file' && <File className="h-10 w-10 text-gray-400" />}
                {activeNoteType === 'image' && <Image className="h-10 w-10 text-gray-400" />}
                {activeNoteType === 'transcript' && <MessageSquare className="h-10 w-10 text-gray-400" />}
              </div>
              <p className="text-sm text-gray-500">
                Drop your {activeNoteType} here or click to browse
              </p>
              <button className="mt-3 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md">
                Browse files
              </button>
            </div>
          )}
          
          <div className="flex justify-end mt-3">
            <button
              onClick={createNote}
              disabled={isSaving || (activeNoteType === 'text' && !newNoteContent.trim())}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Note
            </button>
          </div>
        </div>
      </div>
      
      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        ) : notes.length > 0 ? (
          notes.map(note => (
            <NoteItem key={note.id} note={note} />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No notes yet. Create your first note above.</p>
          </div>
        )}
      </div>
    </div>
  );
}