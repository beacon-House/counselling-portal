/**
 * Student header component
 * Displays student information and context summary
 */
import React, { useState } from 'react';
import { Edit, Calendar, Book, GraduationCap, RefreshCw } from 'lucide-react';
import { Student } from '../../types/types';
import { motion } from 'framer-motion';
import { useGenerateContext } from '../../hooks/useGenerateContext';

interface StudentHeaderProps {
  student: Student;
}

export default function StudentHeader({ student }: StudentHeaderProps) {
  const { generateContext, isGenerating } = useGenerateContext();
  
  const handleGenerateContext = async () => {
    try {
      await generateContext(student.id);
    } catch (error) {
      console.error('Error generating context:', error);
    }
  };

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
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <Edit className="h-5 w-5 text-gray-400" />
        </motion.button>
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
    </motion.div>
  );
}