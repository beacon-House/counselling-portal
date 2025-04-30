/**
 * Student header component
 * Displays student information and context summary
 */
import React, { useState } from 'react';
import { Edit, Calendar, Book, GraduationCap, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { Student } from '../../types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerateContext } from '../../hooks/useGenerateContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface StudentHeaderProps {
  student: Student;
}

export default function StudentHeader({ student }: StudentHeaderProps) {
  const { generateContext, isGenerating } = useGenerateContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleGenerateContext = async () => {
    try {
      await generateContext(student.id);
    } catch (error) {
      console.error('Error generating context:', error);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Delete the student record
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      // Close the modal and navigate back to dashboard
      setIsDeleteModalOpen(false);
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting student:', err);
      setDeleteError(err.message || 'Failed to delete student. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const DeleteConfirmationModal = () => (
    <AnimatePresence>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-4"
          >
            <div className="mb-4 flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Student</h3>
                <p className="text-gray-600 mt-2">
                  Are you sure you want to delete <span className="font-medium">{student.name}</span>? This action will permanently remove all student data including notes, subtasks, and progress. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 border-b border-gray-100 bg-white"
    >
      <div className="flex justify-between items-start max-w-screen-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-light text-gray-800">{student.name}</h1>
          <div className="flex flex-wrap items-center mt-2 space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{student.grade}</span>
            </div>
            <div className="flex items-center">
              <Book className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{student.curriculum}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>Class of {student.target_year}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDeleteClick}
            className="p-2 rounded-full hover:bg-red-50 transition-colors duration-200 text-gray-400 hover:text-red-500"
            aria-label="Delete student"
            title="Delete student"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Edit student"
            title="Edit student"
          >
            <Edit className="h-5 w-5 text-gray-400" />
          </motion.button>
        </div>
      </div>
      
      <div className="mt-6 bg-gray-50 rounded-lg p-4 max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Student Context</h3>
          <motion.button 
            onClick={handleGenerateContext}
            disabled={isGenerating}
            className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate
          </motion.button>
        </div>
        
        {isGenerating ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            {student.student_context || 'No context available. Click "Generate" to create a summary.'}
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </motion.div>
  );
}