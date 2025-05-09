/**
 * File Upload Modal Component
 * Provides an interface for uploading files and associating them with phases and tasks
 * Enhanced with optimistic UI updates, better error handling, and improved state management
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Upload, AlertTriangle, File, Paperclip, FileText, 
  Check, Loader, CheckCircle2, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { Phase, Task, FileItem } from '../../../types/types';
import { useAuth } from '../../../context/AuthContext';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  initialPhaseId?: string;
  initialTaskId?: string;
  phases: Phase[];
  tasks: Task[];
  onUploadComplete: (file: FileItem) => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  studentId,
  initialPhaseId,
  initialTaskId,
  phases,
  tasks,
  onUploadComplete
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState('');
  const [phaseId, setPhaseId] = useState(initialPhaseId || '');
  const [taskId, setTaskId] = useState(initialTaskId || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { counsellor } = useAuth();
  const [uploadCompleteData, setUploadCompleteData] = useState<FileItem | null>(null);

  // Reset task when phase changes
  useEffect(() => {
    if (phaseId) {
      // Only set taskId to empty if the current taskId is not associated with the selected phase
      const taskBelongsToPhase = tasks.some(
        task => task.id === taskId && task.phase_id === phaseId
      );
      if (!taskBelongsToPhase) {
        setTaskId('');
      }
    } else {
      setTaskId('');
    }
  }, [phaseId, tasks, taskId]);

  // Set initial values
  useEffect(() => {
    if (initialPhaseId) setPhaseId(initialPhaseId);
    if (initialTaskId) setTaskId(initialTaskId);
  }, [initialPhaseId, initialTaskId]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !uploading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, uploading]);

  // If upload is complete and we have data, call the callback
  useEffect(() => {
    if (uploadCompleteData) {
      console.log('Upload complete, calling parent callback with data:', uploadCompleteData);
      onUploadComplete(uploadCompleteData);
      setUploadCompleteData(null); // Reset for future uploads
    }
  }, [uploadCompleteData, onUploadComplete]);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelect(file);
    }
  };

  // Process selected file
  const handleFileSelect = (file: File) => {
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit');
      return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);
    setSelectedFile(file);
    setError(null);
  };

  // Reset the form
  const resetForm = () => {
    setSelectedFile(null);
    setDescription('');
    setUploadProgress(0);
    setError(null);
    
    // Don't reset phase and task if they were provided initially
    if (!initialPhaseId) setPhaseId('');
    if (!initialTaskId) setTaskId('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Click the hidden file input
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload the file
  const handleUpload = async () => {
    if (!selectedFile || !counsellor) return;
    
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      console.log('Starting file upload process...');
      
      // Generate a unique file name to avoid collisions
      const fileExt = selectedFile.name.split('.').pop();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${randomId}_${selectedFile.name}`;
      const filePath = `${studentId}/${fileName}`;
      
      console.log('File path for upload:', filePath);
      
      // Generate a temporary ID for optimistic UI update
      const optimisticId = `temp-${Date.now()}`;
      
      // Create an optimistic file record for immediate UI update
      const optimisticFile: FileItem = {
        id: optimisticId,
        student_id: studentId,
        phase_id: phaseId || null,
        task_id: taskId || null,
        file_name: selectedFile.name,
        file_url: URL.createObjectURL(selectedFile), // Create temporary URL for preview
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        description: description || null,
        counsellor_id: counsellor.id,
        created_at: new Date().toISOString(),
        counsellor: {
          name: counsellor.name
        },
        phase: phaseId ? phases.find(p => p.id === phaseId) : undefined,
        task: taskId ? tasks.find(t => t.id === taskId) : undefined
      };
      
      // Upload file to Supabase storage
      console.log('Uploading file to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes') // Using existing bucket for storage
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('File uploaded successfully, getting public URL');
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('notes')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      // Set upload progress to 50%
      setUploadProgress(50);
      
      console.log('Got public URL:', urlData.publicUrl);
      
      // Create a record in the files table
      const fileRecord = {
        student_id: studentId,
        phase_id: phaseId || null,
        task_id: taskId || null,
        file_name: selectedFile.name,
        file_url: urlData.publicUrl,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        description: description || null,
        counsellor_id: counsellor.id
      };
      
      console.log('Creating file metadata record:', fileRecord);
      
      const { data: insertData, error: insertError } = await supabase
        .from('files')
        .insert(fileRecord)
        .select(`
          *,
          counsellor:counsellor_id(name),
          phase:phase_id(name),
          task:task_id(name)
        `)
        .single();
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }
      
      console.log('File metadata inserted successfully:', insertData);
      
      // Set upload progress to 100%
      setUploadProgress(100);
      
      // Store the complete data for the parent callback
      setUploadCompleteData(insertData as FileItem);
      
      // Reset the form
      resetForm();
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Filter tasks based on selected phase
  const filteredTasks = phaseId
    ? tasks.filter(task => task.phase_id === phaseId)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
              <button 
                onClick={onClose}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* File Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } transition-colors`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 p-3 rounded-full mb-2">
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon className="h-8 w-8 text-indigo-500" />
                      ) : (
                        <FileText className="h-8 w-8 text-indigo-500" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 mb-1">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
                      disabled={uploading}
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-3">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Click to browse</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel, PowerPoint, images, and other files (max 50MB)
                    </p>
                  </>
                )}
              </div>
              
              {/* File Details Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows={2}
                    disabled={uploading}
                    placeholder="Add a brief description for this file"
                  />
                </div>
                
                <div>
                  <label htmlFor="phase" className="block text-sm font-medium text-gray-700 mb-1">
                    Phase
                  </label>
                  <select
                    id="phase"
                    value={phaseId}
                    onChange={(e) => setPhaseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={uploading}
                  >
                    <option value="">Select Phase (optional)</option>
                    {phases.map(phase => (
                      <option key={phase.id} value={phase.id}>
                        {phase.sequence}. {phase.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
                    Task
                  </label>
                  <select
                    id="task"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={uploading || !phaseId}
                  >
                    <option value="">Select Task (optional)</option>
                    {filteredTasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.sequence}. {task.name}
                      </option>
                    ))}
                  </select>
                  {!phaseId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Select a phase first to choose a task
                    </p>
                  )}
                </div>
              </div>
              
              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {uploadProgress < 50 ? 'Uploading file...' : 'Saving information...'}
                    </span>
                    <span className="text-xs font-medium text-gray-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3">
              <button
                onClick={onClose}
                disabled={uploading}
                className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}