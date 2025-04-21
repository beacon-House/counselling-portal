/**
 * Notes panel component
 * Displays and manages notes for a student/phase/task
 */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Note } from '../../../types/types';
import { PlusCircle, FileText, Image, File, MessageSquare, Loader, X, Upload } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [noteDescription, setNoteDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [studentId, phaseId, taskId]);

  // Clear preview and selected file when changing note type
  useEffect(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setNoteDescription('');
  }, [activeNoteType]);

  // Update contentEditable div when newNoteContent changes
  useEffect(() => {
    if (contentEditableRef.current && activeNoteType === 'text') {
      // Only update the DOM if content is different to avoid cursor jumps
      if (contentEditableRef.current.textContent !== newNoteContent) {
        contentEditableRef.current.textContent = newNoteContent;
      }
    }
  }, [newNoteContent, activeNoteType]);

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
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    setNewNoteContent(e.currentTarget.textContent || '');
  };

  const createNote = async () => {
    setError(null);
    
    if (activeNoteType === 'text') {
      if (!newNoteContent.trim()) return;
      
      setIsSaving(true);
      try {
        const noteData: Partial<Note> = {
          student_id: studentId,
          phase_id: phaseId || null,
          task_id: taskId || null,
          type: activeNoteType,
          content: newNoteContent,
        };
        
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
        if (contentEditableRef.current) {
          contentEditableRef.current.textContent = '';
        }
      } catch (error) {
        console.error('Error creating text note:', error);
        setError('Failed to create note. Please try again.');
      } finally {
        setIsSaving(false);
      }
    } else if (selectedFile) {
      await uploadFile(selectedFile);
    } else {
      setError('Please select a file to upload.');
    }
  };

  const uploadFile = async (file: File) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${studentId}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('notes')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Create note record
      const noteData: Partial<Note> = {
        student_id: studentId,
        phase_id: phaseId || null,
        task_id: taskId || null,
        type: activeNoteType,
        file_url: publicUrl,
        content: noteDescription || null, // Use description as content for file notes
      };
      
      const { data: newNoteData, error: noteError } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();
      
      if (noteError) throw noteError;
      
      // Add new note to the list
      setNotes([newNoteData as Note, ...notes]);
      
      // Clear the form
      setSelectedFile(null);
      setPreviewUrl(null);
      setNoteDescription('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview for images
    if (activeNoteType === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-light mb-6 text-gray-800">Notes</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
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
                <div
                  ref={contentEditableRef}
                  contentEditable="true"
                  className="w-full p-4 border border-gray-200 rounded-lg min-h-[120px] focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-gray-700 overflow-auto"
                  onInput={handleContentInput}
                  suppressContentEditableWarning={true}
                />
              ) : (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept={
                      activeNoteType === 'image' 
                        ? 'image/*' 
                        : activeNoteType === 'transcript' 
                          ? '.txt,.pdf,.doc,.docx' 
                          : '*'
                    }
                  />
                  
                  {selectedFile ? (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-700">Selected File:</h3>
                        <button 
                          onClick={clearFileSelection}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {activeNoteType === 'image' && previewUrl ? (
                        <div className="border rounded-lg overflow-hidden bg-gray-50 p-2">
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-h-[200px] mx-auto rounded"
                          />
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <File className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <input
                        type="text"
                        placeholder="Add a description..."
                        className="w-full p-3 mt-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-gray-700"
                        value={noteDescription}
                        onChange={(e) => setNoteDescription(e.target.value)}
                      />
                    </div>
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
                        onClick={handleBrowseFiles}
                        className="mt-2 text-sm text-gray-700 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-all duration-200 flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse files
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={createNote}
              disabled={
                isSaving || 
                (activeNoteType === 'text' && !newNoteContent.trim()) ||
                (activeNoteType !== 'text' && !selectedFile)
              }
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