/**
 * Custom hook for generating student context
 * Provides functionality for using Supabase Edge Functions to create and update student context
 */
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Track in-progress generation requests
const inProgressGenerations = new Set<string>();

export function useGenerateContext() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Generate and update the context for a specific student
   */
  const generateContext = useCallback(async (studentId: string) => {
    // Check if there's already a generation in progress for this student
    if (inProgressGenerations.has(studentId)) {
      console.log('Context generation already in progress for this student');
      return;
    }
    
    // Mark this student as having a generation in progress
    inProgressGenerations.add(studentId);
    setIsGenerating(true);
    setError(null);
    
    try {
      // Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;
      
      // Fetch student's notes
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (notesError) throw notesError;
      
      // Fetch student's subtasks
      const { data: subtasks, error: subtasksError } = await supabase
        .from('student_subtasks')
        .select(`
          *,
          tasks:task_id(
            *,
            phases:phase_id(*)
          )
        `)
        .eq('student_id', studentId);
      
      if (subtasksError) throw subtasksError;
      
      // Prepare the context data
      let promptData = `Generate a concise summary of the student's progress, strengths, and areas needing attention based on the following information.

Student Profile:
- Name: ${student.name}
- Grade: ${student.grade}
- Curriculum: ${student.curriculum}
- Target Year: ${student.target_year}

`;
      
      // Add subtask data
      if (subtasks && subtasks.length > 0) {
        promptData += `\nSubtasks and Progress:`;
        subtasks.forEach((subtask: any) => {
          const task = subtask.tasks || { name: 'Unknown Task' };
          const phase = task.phases || { name: 'Unknown Phase' };
          promptData += `\n- ${phase.name} > ${task.name} > ${subtask.name}: ${subtask.status}`;
          if (subtask.remark) {
            promptData += ` (Remark: ${subtask.remark})`;
          }
          if (subtask.eta) {
            promptData += ` (ETA: ${subtask.eta})`;
          }
          if (subtask.owner) {
            promptData += ` (Owner: ${subtask.owner})`;
          }
        });
      }
      
      // Add notes data (limit to 5 most recent for token management)
      if (notes && notes.length > 0) {
        promptData += `\n\nRecent Notes:`;
        notes.slice(0, 5).forEach((note: any) => {
          promptData += `\n- ${note.title || 'Untitled'}: ${note.content?.substring(0, 100)}${note.content?.length > 100 ? '...' : ''}`;
        });
      }
      
      // Token management - ensure we don't exceed limits
      if (promptData.length > 8000) {
        promptData = promptData.substring(0, 8000);
      }

      // Call Supabase Edge Function instead of OpenAI directly
      // Include the OpenAI API key in the request body for the Edge Function to use
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          promptData,
          openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY // Pass the OpenAI API key to the edge function
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate context');
      }
      
      const data = await response.json();
      const generatedContext = data.generatedContext;
      
      if (!generatedContext) {
        throw new Error('Failed to generate context: No content returned from API');
      }
      
      // Update the student record with the new context
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          student_context: generatedContext.trim()
        })
        .eq('id', studentId);
      
      if (updateError) throw updateError;
      
      // Return the generated context
      return generatedContext;
    } catch (err: any) {
      console.error('Error generating context:', err);
      setError(err.message || 'Failed to generate context');
      throw err;
    } finally {
      // Remove this student from the in-progress set
      inProgressGenerations.delete(studentId);
      setIsGenerating(false);
    }
  }, []);
  
  return { generateContext, isGenerating, error };
}