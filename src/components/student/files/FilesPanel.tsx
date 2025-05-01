/**
 * Files panel component
 * Displays and manages files associated with a student
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Search, Filter, Calendar, FileText, X, Download, 
  Trash2, Edit, CheckCircle, Loader, Info, FileType, AlertTriangle, 
  ExternalLink, Upload as UploadIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { FileItem, Phase, Task, Student } from '../../../types/types';
import { useAuth } from '../../../context/AuthContext';
import FileUploadModal from './FileUploadModal';

interface FilesPanelProps {
  studentId: string;
  phaseId: string | null;
  taskId: string | null;
  student: Student;
}

export default function FilesPanel({ studentId, phaseId, taskId, student }: FilesPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchFiles();
    fetchPhases();
  }, [studentId, phaseId, taskId, filterPhaseId, filterTaskId]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      // Build the query
      let query = supabase
        .from('files')
        .select(`
          *,
          counsellor:counsellor_id(name),
          phase:phase_id(name),
          task:task_id(name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filterPhaseId) {
        query = query.eq('phase_id', filterPhaseId);
      } else if (phaseId) {
        query = query.eq('phase_id', phaseId);
      }
      
      if (filterTaskId) {
        query = query.eq('task_id', filterTaskId);
      } else if (taskId) {
        query = query.eq('task_id', taskId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setFiles(data as FileItem[]);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
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
    // Add the new file to the list
    setFiles([file, ...files]);
    setUploadSuccess(true);
    setIsUploadModalOpen(false);
  };

  const handleDeleteClick = (file: FileItem) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    try {
      // First, delete the file from storage
      const filePath = fileToDelete.file_url.split('/').pop(); // Extract file path from URL
      
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('notes') // Using the existing storage bucket
          .remove([filePath]);
        
        if (storageError) {
          console.error('Error removing file from storage:', storageError);
          // Continue anyway to delete the metadata
        }
      }
      
      // Delete the file metadata
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileToDelete.id);
      
      if (dbError) throw dbError;
      
      // Update the files list
      setFiles(files.filter(f => f.id !== fileToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(false);
    }
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
      {uploadSuccess && (
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
                File uploaded successfully!
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
        <h2 className="text-lg md:text-xl font-light text-gray-800">
          Files for {student.name}
        </h2>
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
      
      {/* Search, Filter and Upload */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
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
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Phase
          </label>
          <select
            value={filterPhaseId || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFilterPhaseId(value ? value : null);
              // Clear task filter when phase changes
              setFilterTaskId(null);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-sm"
          >
            <option value="">All Phases</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.sequence}. {phase.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Task
          </label>
          <select
            value={filterTaskId || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFilterTaskId(value ? value : null);
            }}
            disabled={!filterPhaseId}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Tasks</option>
            {filteredTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.sequence}. {task.name}
              </option>
            ))}
          </select>
        </div>
        
        {(filterPhaseId || filterTaskId) && (
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors flex items-center h-[38px]"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Files List */}
      <div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-gray-300" />
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="space-y-8">
            {groupFilesByPhaseAndTask().map(group => (
              <div key={`${group.phaseName}_${group.taskName}`} className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <span className="mr-2">
                    {group.phaseName} {group.taskName !== 'No Task' ? `> ${group.taskName}` : ''}
                  </span>
                </h3>
                
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
                          <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-1">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(file.created_at)}
                            </span>
                            {file.file_size && (
                              <span>{formatFileSize(file.file_size)}</span>
                            )}
                          </div>
                          {file.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between">
                        <a
                          href={file.file_url}
                          download={file.file_name}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                        
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                        
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
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mx-auto px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          studentId={studentId}
          initialPhaseId={phaseId || undefined}
          initialTaskId={taskId || undefined}
          phases={phases}
          tasks={tasks}
          onUploadComplete={handleFileUploadComplete}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
}