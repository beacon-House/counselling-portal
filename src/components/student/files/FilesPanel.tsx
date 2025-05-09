/**
 * Files panel component
 * Displays and manages files associated with a student
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Search, Filter, Calendar, FileText, X, Download, 
  Trash2, Edit, CheckCircle, Loader, Info, FileType, AlertTriangle, 
  ExternalLink, Upload as UploadIcon, RefreshCw, FolderSearch, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { FileItem, Phase, Task, Student } from '../../../types/types';
import { useAuth } from '../../../context/AuthContext';
import FileUploadModal from './FileUploadModal';
import { format } from 'date-fns';

interface FilesPanelProps {
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
  student: Student;
}

export default function FilesPanel({ studentId, phaseId, taskId, student }: FilesPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPhaseId, setFilterPhaseId] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { counsellor } = useAuth();
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Store last fetch timestamp to help with debugging
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  // New state for the deep fetch operation
  const [isDeepFetching, setIsDeepFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [newFilesCount, setNewFilesCount] = useState(0);

  useEffect(() => {
    fetchFiles();
    fetchPhases();
    
    // Clear any existing timer when component unmounts
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, [studentId, phaseId, taskId, filterPhaseId, filterTaskId]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (uploadSuccess || fetchSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
        setFetchSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess, fetchSuccess]);

  // Setup a subscription to file changes for this student
  useEffect(() => {
    if (!studentId) return;
    
    // Set up real-time subscription for file changes
    const subscription = supabase
      .channel(`files-${studentId}`)
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'files',
        filter: `student_id=eq.${studentId}`
      }, () => {
        console.log('Files changed, refreshing data...');
        fetchFiles();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [studentId]);

  const fetchFiles = async () => {
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = null;
    }
    
    setLoading(true);
    setLastFetchTime(new Date().toISOString());
    try {
      console.log(`Fetching files for student ${studentId} at ${new Date().toISOString()}`);
      
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          counsellor:counsellor_id(name),
          phase:phase_id(name),
          task:task_id(name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} files for student ${studentId}`);
      
      // Apply URL cache-busting to ensure fresh file URLs
      const filesWithUpdatedUrls = (data || []).map(file => {
        // Add a timestamp to the URL to bust cache
        const cacheBuster = `?t=${Date.now()}`;
        const updatedFileUrl = file.file_url.includes('?') 
          ? `${file.file_url}&_cb=${Date.now()}`
          : `${file.file_url}${cacheBuster}`;
          
        return {
          ...file,
          file_url: updatedFileUrl
        };
      });
      
      setFiles(filesWithUpdatedUrls as FileItem[]);
      
      // Schedule a re-fetch after a short delay to ensure we get any newly uploaded files
      // This helps catch files that might have been uploaded but not yet fully processed
      fetchTimerRef.current = setTimeout(() => {
        if (refreshing) {
          console.log('Performing delayed re-fetch of files...');
          fetchFiles();
        }
      }, 2000);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // New deep fetch method to check storage bucket directly
  const deepFetchFiles = async () => {
    setIsDeepFetching(true);
    setError(null);
    setNewFilesCount(0);
    
    try {
      console.log(`Deep fetching files for student ${studentId} from storage bucket...`);
      
      // Step 1: Get current files in the database to avoid duplicates
      const { data: existingFiles, error: existingFilesError } = await supabase
        .from('files')
        .select('file_url')
        .eq('student_id', studentId);
      
      if (existingFilesError) throw existingFilesError;
      
      const existingFileUrls = new Set((existingFiles || []).map(f => 
        f.file_url.split('?')[0]  // Remove query params to do base URL comparison
      ));
      
      console.log(`Found ${existingFileUrls.size} existing file URLs in database`);
      
      // Step 2: List all files in the 'notes' bucket for this student
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('notes')
        .list(studentId, {
          limit: 1000,
          offset: 0,
        });
      
      if (storageError) throw storageError;
      
      console.log(`Found ${storageFiles?.length || 0} files in storage for student ${studentId}`);
      
      if (!storageFiles || storageFiles.length === 0) {
        setFetchSuccess(true);
        setNewFilesCount(0);
        return;
      }
      
      // Step 3: Create file records for any files found in storage but not in database
      const newFiles = [];
      
      for (const storageFile of storageFiles) {
        // Skip directories/folders
        if (storageFile.id.endsWith('/') || !storageFile.name) continue;
        
        // Generate public URL for the file
        const { data: urlData } = await supabase.storage
          .from('notes')
          .getPublicUrl(`${studentId}/${storageFile.name}`);
        
        if (!urlData || !urlData.publicUrl) continue;
        
        // Check if this file is already in our database
        if (!existingFileUrls.has(urlData.publicUrl.split('?')[0])) {
          // This is a new file that's not in our database - add it
          const fileType = storageFile.metadata?.mimetype || null;
          const fileSize = storageFile.metadata?.size || null;
          
          const newFileRecord = {
            student_id: studentId,
            file_name: storageFile.name,
            file_url: urlData.publicUrl,
            file_type: fileType,
            file_size: fileSize,
            counsellor_id: counsellor?.id || null,
            phase_id: null,
            task_id: null
          };
          
          newFiles.push(newFileRecord);
        }
      }
      
      // Step 4: Insert any new files into the database
      if (newFiles.length > 0) {
        console.log(`Inserting ${newFiles.length} new files into database`);
        const { error: insertError } = await supabase
          .from('files')
          .insert(newFiles);
        
        if (insertError) throw insertError;
        
        setNewFilesCount(newFiles.length);
      }
      
      // Step 5: Refresh the file list to show all files including newly added ones
      await fetchFiles();
      
      setFetchSuccess(true);
    } catch (err) {
      console.error('Error in deep fetch operation:', err);
      setError('Failed to fetch files from storage. Please try again.');
    } finally {
      setIsDeepFetching(false);
    }
  };

  const fetchPhases = async () => {
    try {
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .order('sequence');

      if (phasesError) throw phasesError;
      setPhases(phasesData as Phase[]);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('sequence');

      if (tasksError) throw tasksError;
      setTasks(tasksData as Task[]);
    } catch (err) {
      console.error('Error fetching phases and tasks:', err);
    }
  };

  const handleFileUploadComplete = (file: FileItem) => {
    console.log('File upload complete, updating UI:', file);
    // Add the new file to the list with a delay to ensure it's in the database
    setTimeout(() => {
      setFiles(prevFiles => [file, ...prevFiles]);
      setUploadSuccess(true);
      setIsUploadModalOpen(false);
      
      // Schedule a fetch to ensure all files are up to date
      setTimeout(() => {
        fetchFiles();
      }, 1000);
    }, 500);
  };

  const handleDeleteClick = (file: FileItem) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      console.log(`Deleting file: ${fileToDelete.id} - ${fileToDelete.file_name}`);
      
      // Extract file path from URL properly - improved extraction logic
      let filePath = '';
      try {
        const fileUrl = new URL(fileToDelete.file_url);
        // Match the pattern for Supabase storage URLs
        // Expected format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
        const storagePathRegex = /\/storage\/v1\/object\/public\/notes\/(.+?)(?:\?|$)/;
        const match = fileUrl.pathname.match(storagePathRegex);
        
        if (match && match[1]) {
          filePath = decodeURIComponent(match[1]);
          console.log(`Extracted file path: ${filePath}`);
        } else {
          // Fallback to old method if regex doesn't match
          const pathParts = fileUrl.pathname.split('/');
          filePath = pathParts[pathParts.length - 1];
          console.log(`Using fallback path extraction: ${filePath}`);
        }
      } catch (pathError) {
        console.error('Error parsing file URL:', pathError, fileToDelete.file_url);
        // Continue with file deletion even if path extraction fails
      }
      
      // First, delete the file from storage
      if (filePath) {
        console.log(`Removing file from storage: ${filePath}`);
        const { data: storageData, error: storageError } = await supabase.storage
          .from('notes') // Using existing bucket for storage
          .remove([filePath]);
        
        if (storageError) {
          console.error('Error removing file from storage:', storageError);
          // Log but continue with database deletion
          console.log('Continuing with database deletion despite storage error');
        } else {
          console.log(`Storage deletion response:`, storageData);
        }
      } else {
        console.warn('Could not extract file path from URL:', fileToDelete.file_url);
        // Still attempt to delete the database record
      }
      
      // Always delete the file metadata, even if storage deletion fails
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileToDelete.id);
      
      if (dbError) {
        console.error('Error deleting file from database:', dbError);
        throw dbError;
      }
      
      console.log(`File deleted from database successfully: ${fileToDelete.id}`);
      
      // Update the files list
      setFiles(files.filter(f => f.id !== fileToDelete.id));
      setIsDeleteModalOpen(false);
      
      // Re-fetch files after a short delay to ensure consistency
      setTimeout(() => {
        fetchFiles();
      }, 1000);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchFiles();
  };

  const filteredFiles = files.filter(file => {
    const searchContent = 
      (file.file_name || '') + 
      (file.description || '') +
      (file.phase?.name || '') +
      (file.task?.name || '');
    
    return searchContent.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const resetFilters = () => {
    setFilterPhaseId(null);
    setFilterTaskId(null);
  };

  // Filter tasks based on selected phase
  const filteredTasks = filterPhaseId
    ? tasks.filter(task => task.phase_id === filterPhaseId)
    : tasks;

  // Group files by phase and task
  const groupFilesByPhaseAndTask = () => {
    const grouped: Record<string, FileItem[]> = {};
    
    filteredFiles.forEach(file => {
      // Create a grouping key based on phase and task
      const phaseTaskKey = `${file.phase?.name || 'No Phase'}_${file.task?.name || 'No Task'}`;
      
      if (!grouped[phaseTaskKey]) {
        grouped[phaseTaskKey] = [];
      }
      
      grouped[phaseTaskKey].push(file);
    });
    
    return Object.entries(grouped).map(([key, files]) => {
      const [phaseName, taskName] = key.split('_');
      return {
        phaseName,
        taskName,
        files
      };
    });
  };

  // Format file size for display
  const formatFileSize = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return 'Unknown size';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string | null | undefined) => {
    if (!fileType) return <FileText className="h-10 w-10 text-gray-400" />;
    
    // Simplify file type to just the extension
    const extension = fileType.split('/').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-10 w-10 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-10 w-10 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-10 w-10 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileType className="h-10 w-10 text-purple-500" />;
      default:
        return <FileText className="h-10 w-10 text-gray-400" />;
    }
  };

  // Handle external file view
  const handleViewFile = (fileUrl: string) => {
    // Add a cache buster to the URL to ensure we get the latest version
    const cacheBustUrl = fileUrl.includes('?') 
      ? `${fileUrl}&_cb=${Date.now()}`
      : `${fileUrl}?_cb=${Date.now()}`;
      
    window.open(cacheBustUrl, '_blank', 'noopener,noreferrer');
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => (
    <AnimatePresence>
      {isDeleteModalOpen && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-5 md:p-6 max-w-md w-full"
          >
            <div className="mb-4 flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete File</h3>
                <p className="text-gray-600 mt-2">
                  Are you sure you want to delete <span className="font-medium">{fileToDelete.file_name}</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row justify-end space-y-3 xs:space-y-0 xs:space-x-4 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFile}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete File
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Success Message
  const SuccessMessage = () => (
    <AnimatePresence>
      {(uploadSuccess || fetchSuccess) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-md z-50 max-w-md"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {uploadSuccess ? 'File uploaded successfully!' : 
                 newFilesCount > 0 ? `Found ${newFilesCount} new files!` : 
                 'Files refreshed successfully!'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-light text-gray-800">Files for {student.name}</h2>
        
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            title="Refresh files list"
            aria-label="Refresh files list"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Success Message */}
      <SuccessMessage />
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search files..."
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
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-3 rounded-lg bg-gray-800 text-white flex items-center hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </motion.button>
        </div>
      </div>
      
      {/* Last Fetch Time */}
      <div className="mb-4 text-xs text-gray-500 flex items-center">
        <Clock className="h-3 w-3 mr-1 inline" />
        Last fetch: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : 'Never'}
      </div>
      
      {/* Deep Fetching Status */}
      {isDeepFetching && (
        <div className="mb-6 p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg flex items-center">
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          <span>Scanning storage for files... This may take a moment.</span>
        </div>
      )}
      
      {/* Files List */}
      <div>
        {(loading || isDeepFetching) ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-gray-300" />
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="space-y-8">
            {groupFilesByPhaseAndTask().map(group => (
              <div key={`${group.phaseName}_${group.taskName}`} className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.files.map(file => (
                    <motion.div
                      key={file.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-4 flex items-center">
                        <div className="mr-3 flex-shrink-0">
                          {getFileIcon(file.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 truncate">
                            {file.file_name}
                          </h4>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy') : 'Unknown date'}
                            </span>
                            {file.file_size && (
                              <span>{formatFileSize(file.file_size)}</span>
                            )}
                            <span className="flex items-center text-gray-600">
                              <span className="mr-1">•</span>
                              {file.phase?.name || 'No Phase'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between">
                        <a
                          href={file.file_url}
                          download={file.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            // Add cache buster to download URL
                            const cacheBustUrl = file.file_url.includes('?') 
                              ? `${file.file_url}&_cb=${Date.now()}`
                              : `${file.file_url}?_cb=${Date.now()}`;
                              
                            // Create a temporary anchor element to trigger download with cache buster
                            const a = document.createElement('a');
                            a.href = cacheBustUrl;
                            a.download = file.file_name;
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            a.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                        
                        <button
                          onClick={() => handleViewFile(file.file_url)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </button>
                        
                        <button
                          onClick={() => handleDeleteClick(file)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
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
            <div className="max-w-md mx-auto p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 rounded-full p-3">
                  <UploadIcon className="h-10 w-10 text-gray-400" />
                </div>
              </div>
              <h3 className="text-gray-600 font-medium mb-2">No files yet</h3>
              <p className="text-gray-500 mb-5">
                {searchTerm ? 
                  "No files match your search criteria. Try a different search term or clear your filters." : 
                  "Upload files to share with this student. Files can be associated with specific phases and tasks from the roadmap."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white flex items-center hover:bg-gray-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={deepFetchFiles}
                  disabled={isDeepFetching}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 flex items-center hover:bg-gray-50 transition-colors"
                >
                  <FolderSearch className="h-4 w-4 mr-2" />
                  Scan for Files
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* File Upload Modal */}
      {isUploadModalOpen && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleFileUploadComplete}
          studentId={studentId}
          phases={phases}
          tasks={tasks}
          phaseId={phaseId}
          taskId={taskId}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
}