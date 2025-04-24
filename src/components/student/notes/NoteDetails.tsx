/**
 * Note details component
 * Provides a full-screen, immersive note-taking experience
 */
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Loader, X, FileText, Image, File, MessageSquare, Upload, Download, ExternalLink, Trash2 } from 'lucide-react';
import { Note } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface NoteDetailsProps {
  note?: Note | null;
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
  subtaskId: string | null;
  onClose: () => void;
  onSave: (newNote: Note) => void;
  onDelete?: (noteId: string) => void;
  isNewNote?: boolean;
  initialFileUpload?: boolean;
}

export default function NoteDetails({
  note,
  studentId,
  phaseId,
  taskId,
  subtaskId,
  onClose,
  onSave,
  onDelete,
  isNewNote = false,
  initialFileUpload = false
}: NoteDetailsProps) {
  const [title, setTitle] = useState<string>(note?.title || '');
  const [content, setContent] = useState<string>(note?.content || '');
  const [activeType, setActiveType] = useState<'text' | 'file' | 'image' | 'transcript'>(note?.type || 'text');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(note?.file_url || null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // Set initial values from the note
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setActiveType(note.type || 'text');
      setPreviewUrl(note.file_url || null);
    }
    
    // If initialFileUpload is true, set active type to file by default
    if (initialFileUpload) {
      setActiveType('file');
    }
  }, [note, initialFileUpload]);
  
  // Focus the content editable div when opening in text mode
  useEffect(() => {
    if (isNewNote && activeType === 'text' && contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  }, [isNewNote, activeType]);
  
  // Update contentEditable div when content changes
  useEffect(() => {
    if (contentEditableRef.current && activeType === 'text') {
      // Only update if different to avoid cursor jumps
      if (contentEditableRef.current.textContent !== content) {
        contentEditableRef.current.textContent = content;
      }
    }
  }, [content, activeType]);
  
  // Setup drag and drop event handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileSelection(file);
      }
    };
    
    const dropArea = dropAreaRef.current;
    if (dropArea && (activeType === 'file' || activeType === 'image')) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
      
      return () => {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      };
    }
  }, [activeType]);
  
  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.textContent || '');
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      if (activeType === 'text') {
        // Save text note
        const noteData: Partial<Note> = {
          id: note?.id, // Will be undefined for new notes
          student_id: studentId,
          phase_id: phaseId,
          task_id: taskId,
          subtask_id: subtaskId,
          title: title || null,
          content: content || '',
          type: activeType,
        };
        
        let savedNote: Note;
        
        if (note?.id) {
          // Update existing note
          const { data, error } = await supabase
            .from('notes')
            .update(noteData)
            .eq('id', note.id)
            .select()
            .single();
            
          if (error) throw error;
          savedNote = data as Note;
        } else {
          // Create new note
          const { data, error } = await supabase
            .from('notes')
            .insert(noteData)
            .select()
            .single();
            
          if (error) throw error;
          savedNote = data as Note;
        }
        
        onSave(savedNote);
      } else if (selectedFile) {
        // Upload and save file note
        await uploadFile();
      } else if (note?.id && !selectedFile) {
        // Update existing file note metadata (title and content)
        const noteData: Partial<Note> = {
          title: title || null,
          content: content || null,
        };
        
        const { data, error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', note.id)
          .select()
          .single();
          
        if (error) throw error;
        onSave(data as Note);
      } else if (activeType !== 'text' && !selectedFile && !previewUrl) {
        throw new Error('Please select a file to upload');
      }
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const uploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${studentId}/${fileName}`;
      
      // Determine if file is an image
      const isImage = selectedFile.type.startsWith('image/');
      const fileType = isImage ? 'image' : 'file';
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: note?.id ? true : false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('notes')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Create or update note record
      const noteData: Partial<Note> = {
        id: note?.id, // Will be undefined for new notes
        student_id: studentId,
        phase_id: phaseId,
        task_id: taskId,
        subtask_id: subtaskId,
        title: title || selectedFile.name, // Use filename as title if none provided
        content: content || null,
        type: fileType, // 'image' or 'file'
        file_url: publicUrl,
      };
      
      let savedNote: Note;
      
      if (note?.id) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', note.id)
          .select()
          .single();
          
        if (error) throw error;
        savedNote = data as Note;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert(noteData)
          .select()
          .single();
          
        if (error) throw error;
        savedNote = data as Note;
      }
      
      onSave(savedNote);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
      throw err;
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    handleFileSelection(file);
  };
  
  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    
    // Determine file type
    const isImage = file.type.startsWith('image/');
    setActiveType(isImage ? 'image' : 'file');
    
    // Set default title if empty
    if (!title) {
      setTitle(file.name);
    }
    
    // Create preview for images
    if (isImage) {
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
  
  const handleDelete = async () => {
    if (!note?.id || !onDelete) return;
    
    setIsSaving(true);
    try {
      // If it's a file note, delete the file from storage
      if (note.file_url) {
        // Extract the path from the URL
        const url = new URL(note.file_url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/notes\/(.*)/);
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1];
          // Attempt to delete the file - we don't throw on error as the note should be deleted anyway
          await supabase.storage
            .from('notes')
            .remove([filePath]);
        }
      }
      
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
  
  const clearFileSelection = () => {
    setSelectedFile(null);
    if (isNewNote) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(note?.file_url || null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-5 w-5" />;
      case 'file':
        return <File className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'transcript':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  // Get file name from URL
  const getFileName = (url: string) => {
    if (!url) return 'File';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Decode URL encoded characters and remove timestamp prefix
    try {
      const decodedName = decodeURIComponent(fileName);
      // Remove timestamp if present (timestamp_filename format)
      const withoutTimestamp = decodedName.replace(/^\d+_/, '');
      return withoutTimestamp;
    } catch (e) {
      return fileName;
    }
  };
  
  // Get file size in readable format
  const getFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
              {getTypeIcon(activeType)}
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
            disabled={
              isSaving || 
              (activeType === 'text' && !content.trim() && !title.trim()) ||
              (activeType !== 'text' && !selectedFile && !previewUrl)
            }
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
          
          {/* Content based on type */}
          {activeType === 'text' ? (
            <div
              ref={contentEditableRef}
              contentEditable="true"
              onInput={handleContentInput}
              className="prose prose-lg max-w-none min-h-[calc(100vh-250px)] focus:outline-none"
              placeholder="Start writing..."
              suppressContentEditableWarning={true}
            />
          ) : (
            <div className="mt-8">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept={activeType === 'image' ? 'image/*' : '*'}
              />
              
              {/* File preview or upload area */}
              {(selectedFile || previewUrl) ? (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">
                      {selectedFile ? 'Selected File:' : 'Current File:'}
                    </h3>
                    {selectedFile && (
                      <button 
                        onClick={clearFileSelection}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Image preview */}
                  {activeType === 'image' && previewUrl ? (
                    <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-[400px] mx-auto rounded"
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          {selectedFile.name} ({getFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                  ) : (
                    /* File preview */
                    <div className="flex items-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <File className="h-10 w-10 text-gray-400 mr-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-700">
                          {selectedFile ? selectedFile.name : previewUrl ? getFileName(previewUrl) : 'File'}
                        </p>
                        {selectedFile && (
                          <p className="text-sm text-gray-500 mt-1">
                            {getFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                          </p>
                        )}
                        {!selectedFile && previewUrl && (
                          <div className="flex mt-2 space-x-4">
                            <a 
                              href={previewUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              download
                              className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                            <a 
                              href={previewUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Replace file button */}
                  {!isNewNote && !selectedFile && (
                    <button
                      onClick={handleBrowseFiles}
                      className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace file
                    </button>
                  )}
                </div>
              ) : (
                /* Upload area */
                <div 
                  ref={dropAreaRef}
                  className={`border-2 border-dashed ${isDragging ? 'border-gray-400 bg-gray-100' : 'border-gray-200 bg-gray-50'} rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200`}
                  onClick={handleBrowseFiles}
                >
                  <div className="mb-4">
                    {activeType === 'file' && <File className="h-16 w-16 text-gray-300" />}
                    {activeType === 'image' && <Image className="h-16 w-16 text-gray-300" />}
                  </div>
                  <p className="text-lg text-gray-600 text-center mb-3">
                    {isDragging ? 'Drop your file here' : 'Drag & drop your file here or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    {activeType === 'image' 
                      ? 'Supports: JPG, PNG, GIF, SVG, WEBP' 
                      : 'Supports all file types including PDFs, documents, and more'}
                  </p>
                  <button 
                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse files
                  </button>
                </div>
              )}
              
              {/* Description textarea */}
              {(activeType !== 'text' && (selectedFile || previewUrl)) && (
                <div className="mt-6">
                  <label htmlFor="note-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="note-description"
                    rows={4}
                    placeholder="Add a description for this file..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-gray-700"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal />
    </div>
  );
}