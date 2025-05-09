/**
 * Student header component
 * Displays student information and context summary
 */
import React, { useState } from 'react';
import { Edit, Calendar, Book, GraduationCap, RefreshCw, Trash2, AlertTriangle, ExternalLink, X, School } from 'lucide-react';
import { Student } from '../../types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerateContext } from '../../hooks/useGenerateContext';
import { useNavigate } from 'react-router-dom';
import EditStudentModal from './EditStudentModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface StudentHeaderProps {
  student: Student;
}

export default function StudentHeader({ student }: StudentHeaderProps) {
  const { generateContext, isGenerating, error } = useGenerateContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student>(student);
  const [contextError, setContextError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleGenerateContext = async () => {
    try {
      setContextError(null);
      await generateContext(currentStudent.id);
    } catch (error: any) {
      console.error('Error generating context:', error);
      setContextError(error.message || 'Failed to generate context. Please try again.');
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const toggleContextModal = () => {
    setIsContextModalOpen(!isContextModalOpen);
  };

  // Handle keyboard events for modal accessibility
  const handleContextModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsContextModalOpen(false);
    }
  };

  const handleStudentUpdate = (updatedStudent: Student) => {
    setCurrentStudent(updatedStudent);
  };

  // Enhanced animation variants
  const buttonVariants = {
    hover: { 
      scale: 1.05, 
      y: -2, 
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)" 
    },
    tap: { 
      scale: 0.95, 
      y: 0, 
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)" 
    }
  };

  // Context Modal Component
  const ContextModal = () => (
    <AnimatePresence>
      {isContextModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsContextModalOpen(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-auto p-5 md:p-6"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleContextModalKeyDown}
            tabIndex={0}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-gray-800">Student Context</h3>
              <motion.button 
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsContextModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2 pb-2 custom-scrollbar">
              {contextError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-start"
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
                  <p>{contextError}</p>
                </motion.div>
              )}
              
              {isGenerating ? (
                <motion.div 
                  animate={{ 
                    opacity: [0.7, 1, 0.7], 
                    transition: { repeat: Infinity, duration: 1.5 } 
                  }}
                  className="space-y-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </motion.div>
              ) : currentStudent.student_context ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100"
                >
                  {currentStudent.student_context}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-yellow-50 text-yellow-700 rounded-lg flex items-center"
                >
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p>No context available. Generate a context to see a summary of this student's progress.</p>
                </motion.div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {currentStudent.student_context && 
                  "This context is AI-generated based on the student's tasks, notes, and progress."}
              </p>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGenerateContext}
                disabled={isGenerating}
                className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Regenerate Context'}
              </motion.button>
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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4 md:p-6 border-b border-gray-100 bg-white"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-start max-w-screen-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl md:text-2xl font-light text-gray-800">{currentStudent.name}</h1>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={toggleContextModal}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors shadow-sm"
            >
              <span>Context</span>
            </motion.button>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-wrap items-center mt-2 gap-3 md:gap-4 text-sm text-gray-500"
          >
            <motion.div 
              whileHover={{ y: -1 }}
              className="flex items-center"
            >
              <GraduationCap className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{currentStudent.grade}</span>
            </motion.div>
            <motion.div 
              whileHover={{ y: -1 }}
              className="flex items-center"
            >
              <Book className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{currentStudent.curriculum}</span>
            </motion.div>
            {currentStudent.school_name && (
              <motion.div 
                whileHover={{ y: -1 }}
                className="flex items-center"
              >
                <School className="h-4 w-4 mr-1.5 text-gray-400" />
                <span>{currentStudent.school_name}</span>
              </motion.div>
            )}
            <motion.div 
              whileHover={{ y: -1 }}
              className="flex items-center"
            >
              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>Class of {currentStudent.target_year}</span>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center space-x-2 mt-4 md:mt-0"
        >
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleDeleteClick}
            className="p-2 rounded-full hover:bg-red-50 transition-colors duration-200 text-gray-400 hover:text-red-500"
            aria-label="Delete student"
            title="Delete student"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>

          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleEditClick}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Edit student"
            title="Edit student"
          >
            <Edit className="h-5 w-5 text-gray-400" />
          </motion.button>
        </motion.div>
      </div>
      
      {/* Student Context Modal */}
      <ContextModal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        studentId={currentStudent.id}
        studentName={currentStudent.name}
      />

      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <EditStudentModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={currentStudent}
          onUpdateSuccess={handleStudentUpdate}
        />
      )}
    </motion.div>
  );
}