/**
 * Custom hook for generating student context
 * Provides functionality for using Gemini API to create and update student context
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
        });
      }
      
      // Add notes data (limit to 5 most recent for token management)
      if (notes && notes.length > 0) {
        promptData += `\n\nRecent Notes:`;
        notes.slice(0, 5).forEach((note: any) => {
          promptData += `\n- ${note.title || 'Untitled'}: ${note.content?.substring(0, 100)}${note.content?.length > 100 ? '...' : ''}`;
        });
      }
      
      promptData += `
      
Format the summary as a paragraph of approximately 100-150 words. Focus on:
1. Overall progress in the roadmap
2. Key strengths based on completed tasks or counselor notes
3. Areas that need attention (blocked or delayed tasks)
4. Any specific action items or recommendations
      
Return ONLY the summary text with no additional comments or headers.`;
      
      // Token management - ensure we don't exceed limits
      if (promptData.length > 8000) {
        promptData = promptData.substring(0, 8000);
      }
      
      // Call the Gemini API
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file.');
      }
      
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptData }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 250,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Extract the generated context
      const generatedContext = responseData.candidates?.[0]?.content?.parts?.[0]?.text || null;
      
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