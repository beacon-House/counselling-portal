/**
 * Student header component
 * Displays student information and context summary
 */
import React, { useState } from 'react';
import { Edit, Calendar, Book, GraduationCap, RefreshCw } from 'lucide-react';
import { Student } from '../../types/types';
import { supabase } from '../../lib/supabase';

interface StudentHeaderProps {
  student: Student;
}

export default function StudentHeader({ student }: StudentHeaderProps) {
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  
  const generateContextSummary = async () => {
    setIsGeneratingContext(true);
    try {
      // This is a placeholder for the actual AI context generation
      // In a real implementation, this would call a function to generate the context
      
      // For now, we'll just update the student_context field with a placeholder
      const contextSummary = `Generated context summary for ${student.name}. This student is in ${student.grade} following the ${student.curriculum} curriculum, targeting graduation in ${student.target_year}.`;
      
      const { error } = await supabase
        .from('students')
        .update({ student_context: contextSummary })
        .eq('id', student.id);
        
      if (error) throw error;
      
      // Update local state
      student.student_context = contextSummary;
    } catch (error) {
      console.error('Error generating context summary:', error);
    } finally {
      setIsGeneratingContext(false);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-1" />
              <span>{student.grade}</span>
            </div>
            <div className="flex items-center">
              <Book className="h-4 w-4 mr-1" />
              <span>{student.curriculum}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Class of {student.target_year}</span>
            </div>
          </div>
        </div>
        
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Edit className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <div className="mt-4 bg-gray-50 rounded-lg p-3 relative">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Student Context</h3>
          <button 
            onClick={generateContextSummary}
            disabled={isGeneratingContext}
            className="flex items-center text-xs text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isGeneratingContext ? 'animate-spin' : ''}`} />
            Generate
          </button>
        </div>
        <p className="text-sm text-gray-600">
          {student.student_context || 'No context available. Click "Generate" to create a summary.'}
        </p>
      </div>
    </div>
  );
}