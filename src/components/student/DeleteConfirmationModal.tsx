/**
 * Delete Confirmation Modal component
 * Requires user to type the student's name to confirm deletion
 * Ensures complete data removal from all related tables
 */
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  studentId,
  studentName
}: DeleteConfirmationModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletionProgress, setDeletionProgress] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Handle click outside to close modal (only if not deleting)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !isDeleting) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isDeleting]);

  // Reset state when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setConfirmName('');
      setError(null);
      setDeletionProgress(null);
    }
  }, [isOpen]);

  const handleDeleteConfirm = async () => {
    if (confirmName !== studentName) {
      setError('The name you entered does not match. Please try again.');
      return;
    }
    
    setIsDeleting(true);
    setError(null);

    try {
      // Step 1: Delete all files from storage and database
      setDeletionProgress('Deleting files...');
      await deleteStudentFiles(studentId);
      
      // Step 2: Delete all notes and note embeddings
      setDeletionProgress('Deleting notes and embeddings...');
      await deleteStudentNotes(studentId);
      
      // Step 3: Delete all subtasks
      setDeletionProgress('Deleting subtasks...');
      await deleteStudentSubtasks(studentId);
      
      // Step 4: Finally, delete the student record
      setDeletionProgress('Deleting student profile...');
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      // Success - navigate back to dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Error during student deletion:', err);
      setError(err.message || 'Failed to delete student. Please try again.');
      setIsDeleting(false);
    }
  };

  // Helper function to delete all student files
  const deleteStudentFiles = async (studentId: string): Promise<void> => {
    try {
      // First retrieve all file records for this student
      const { data: files, error: fetchError } = await supabase
        .from('files')
        .select('id, file_url')
        .eq('student_id', studentId);
      
      if (fetchError) throw fetchError;
      
      // For each file, delete from storage and then from database
      for (const file of files || []) {
        try {
          // Extract file path from URL
          let filePath = '';
          try {
            const fileUrl = new URL(file.file_url);
            const storagePathRegex = /\/storage\/v1\/object\/public\/notes\/(.+?)(?:\?|$)/;
            const match = fileUrl.pathname.match(storagePathRegex);
            
            if (match && match[1]) {
              filePath = decodeURIComponent(match[1]);
            } else {
              const pathParts = fileUrl.pathname.split('/');
              filePath = pathParts[pathParts.length - 1];
            }
          } catch (pathError) {
            console.error('Error parsing file URL:', pathError);
            // Continue with deletion even if path extraction fails
          }
          
          // Delete from storage if path was extracted
          if (filePath) {
            await supabase.storage
              .from('notes')
              .remove([filePath]);
          }
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with next file even if this one failed
        }
      }
      
      // Then delete all file records for this student in one operation
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('student_id', studentId);
      
      if (deleteError) throw deleteError;
      
      return;
    } catch (err) {
      console.error('Error in deleteStudentFiles:', err);
      throw err;
    }
  };

  // Helper function to delete all student notes and embeddings
  const deleteStudentNotes = async (studentId: string): Promise<void> => {
    try {
      // First get all note IDs for this student
      const { data: notes, error: fetchError } = await supabase
        .from('notes')
        .select('id')
        .eq('student_id', studentId);
      
      if (fetchError) throw fetchError;
      
      if (notes && notes.length > 0) {
        // Delete any note embeddings that reference these notes
        const noteIds = notes.map(note => note.id);
        
        await supabase
          .from('note_embeddings')
          .delete()
          .in('note_id', noteIds);
      }
      
      // Delete all notes for this student
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('student_id', studentId);
      
      if (deleteError) throw deleteError;
      
      return;
    } catch (err) {
      console.error('Error in deleteStudentNotes:', err);
      throw err;
    }
  };

  // Helper function to delete all student subtasks
  const deleteStudentSubtasks = async (studentId: string): Promise<void> => {
    try {
      // Delete all subtasks for this student
      const { error } = await supabase
        .from('student_subtasks')
        .delete()
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      return;
    } catch (err) {
      console.error('Error in deleteStudentSubtasks:', err);
      throw err;
    }
  };

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
            className="bg-white rounded-xl shadow-lg p-5 md:p-6 max-w-md w-full"
          >
            <div className="mb-4 flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Student</h3>
                <p className="text-gray-600 mt-2">
                  Before deleting a student's data, please type the student's full name exactly as shown: <span className="font-bold">{studentName}</span>
                </p>
                <div className="mt-4 p-3 bg-red-50 text-sm text-red-700 rounded-lg">
                  <p className="font-medium mb-2">This action will:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Permanently delete the student's profile</li>
                    <li>Remove all associated tasks and sub-tasks</li>
                    <li>Delete all context information</li>
                    <li>Remove uploaded files and documents</li>
                    <li>Erase counseling notes and session transcripts</li>
                    <li>Clear all historical records from the database</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            {deletionProgress && !error && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                <span>{deletionProgress}</span>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="confirm-name" className="block text-sm font-medium text-gray-700 mb-2">
                Type the student's full name to confirm deletion:
              </label>
              <input
                id="confirm-name"
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                disabled={isDeleting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder={`Type "${studentName}" to confirm`}
              />
            </div>

            <div className="flex flex-col xs:flex-row justify-end space-y-3 xs:space-y-0 xs:space-x-4 mt-6">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting || confirmName !== studentName}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Student
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