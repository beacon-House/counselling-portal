/**
 * Transcript Task Review component
 * Displays extracted tasks from a transcript and allows the counselor to review, edit, and create subtasks
 * Includes local storage backup to prevent data loss on page crashes
 */
import React, { useState, useEffect } from 'react';
import { 
  Calendar, X, Check, Trash2, Edit2, Plus, Save, AlertTriangle, 
  ArrowDownCircle, ArrowUpCircle, CheckCircle, XCircle, Loader
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Phase, Task, Student } from '../../../types/types';
import { useAuth } from '../../../context/AuthContext';

export interface ExtractedTask {
  description: string;
  suggestedPhaseId: string | null;
  suggestedPhaseName: string | null;
  suggestedTaskId: string | null;
  suggestedTaskName: string | null;
  owner: string | null;
  dueDate: string | null;
  priority: 'High' | 'Medium' | 'Low';
  notes: string | null;
  id?: string; // Client-side ID for tracking
  isNew?: boolean; // Flag for newly created tasks
  isDeleted?: boolean; // Flag for deleted tasks
}

interface TranscriptTaskReviewProps {
  noteId: string;
  transcriptText: string;
  studentId: string;
  onClose: () => void;
  onTasksCreated: () => void;
}

export default function TranscriptTaskReview({ 
  noteId, 
  transcriptText, 
  studentId, 
  onClose,
  onTasksCreated
}: TranscriptTaskReviewProps) {
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [creatingSubtasks, setCreatingSubtasks] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const { counsellor } = useAuth();
  
  // Local storage key for this session
  const localStorageKey = `transcript_tasks_${studentId}_${noteId}`;

  // Component did mount - fetch roadmap and process transcript or load from localStorage
  useEffect(() => {
    const initializeComponent = async () => {
      console.log("TranscriptTaskReview - Initializing with:", { noteId, studentId, textLength: transcriptText?.length });
      
      // Try to load saved data from localStorage first
      const savedData = localStorage.getItem(localStorageKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log("Loaded saved tasks from localStorage:", parsedData.length);
          setExtractedTasks(parsedData);
          
          // Still need to load phases and tasks even if we have saved data
          await fetchRoadmapData();
          await fetchStudentData();
          setLoading(false);
          return;
        } catch (err) {
          console.error("Error parsing saved tasks from localStorage:", err);
          // Continue with normal loading if local storage parsing fails
        }
      }
      
      await fetchRoadmapData();
      await fetchStudentData();
    };
    
    if (noteId && transcriptText && studentId) {
      initializeComponent();
    } else {
      console.error("Missing required data for transcript processing:", { noteId, studentId, textLength: transcriptText?.length });
      setProcessingError("Missing required data to process transcript");
      setLoading(false);
    }
  }, [noteId, transcriptText, studentId, localStorageKey]);

  // Once we have roadmap data, process the transcript if we didn't load from localStorage
  useEffect(() => {
    if (phases.length > 0 && tasks.length > 0 && transcriptText && extractedTasks.length === 0) {
      processTranscript();
    }
  }, [phases, tasks, transcriptText, extractedTasks.length]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (extractedTasks.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(extractedTasks));
      console.log("Saved tasks to localStorage:", extractedTasks.length);
    }
  }, [extractedTasks, localStorageKey]);

  // Clean up localStorage when closing or completing
  useEffect(() => {
    return () => {
      // Only clear when component unmounts, not on every render
      if (createSuccess) {
        localStorage.removeItem(localStorageKey);
        console.log("Cleared localStorage after successful creation");
      }
    };
  }, [createSuccess, localStorageKey]);

  const fetchStudentData = async () => {
    try {
      console.log('Fetching student data...');
      // Fetch student details
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      setStudent(data as Student);
      console.log('Student data fetched successfully', data);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      setProcessingError(`Failed to load student data: ${error.message || 'Unknown error'}`);
    }
  };

  const fetchRoadmapData = async () => {
    try {
      console.log('Fetching roadmap data...');
      // Fetch phases
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
      
      console.log('Roadmap data fetched successfully', { phases: phasesData.length, tasks: tasksData.length });
    } catch (error: any) {
      console.error('Error fetching roadmap data:', error);
      setProcessingError(`Failed to load roadmap data: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const processTranscript = async () => {
    setLoading(true);
    setProcessingError(null);
    
    try {
      console.log('Processing transcript...', { noteId, studentId, textLength: transcriptText.length });
      
      // Call the Edge Function to process the transcript
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          transcriptText,
          phases,
          tasks,
          studentId,
          openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from process-transcript function:', errorData);
        throw new Error(errorData.error || 'Failed to process transcript');
      }
      
      const data = await response.json();
      console.log('Transcript processed successfully', data);
      
      // Check if we have extractedTasks in the response
      if (!data.extractedTasks) {
        throw new Error('Invalid response format: No extracted tasks returned');
      }
      
      // Add client-side IDs to the extracted tasks
      const tasksWithIds = (Array.isArray(data.extractedTasks) ? data.extractedTasks : []).map((task: ExtractedTask) => ({
        ...task,
        id: crypto.randomUUID(),
        isNew: false,
        isDeleted: false
      }));
      
      // Ensure owner is either student or counsellor
      const validatedTasks = tasksWithIds.map((task: ExtractedTask) => {
        // If owner is not student or counsellor, set to null
        const studentName = student?.name || '';
        const counsellorName = counsellor?.name || '';
        
        let validOwner = null;
        if (task.owner) {
          // Check if owner matches student name
          if (task.owner.toLowerCase().includes(studentName.toLowerCase()) || 
              studentName.toLowerCase().includes(task.owner.toLowerCase())) {
            validOwner = studentName;
          }
          // Check if owner matches counsellor name
          else if (task.owner.toLowerCase().includes(counsellorName.toLowerCase()) || 
                   counsellorName.toLowerCase().includes(task.owner.toLowerCase())) {
            validOwner = counsellorName;
          }
          // Default to counsellor if no match
          else {
            validOwner = counsellorName;
          }
        }
        
        return {
          ...task,
          owner: validOwner
        };
      });
      
      setExtractedTasks(validatedTasks);
      console.log('Tasks extracted:', validatedTasks.length);
      
      // If no tasks were extracted, create a default one
      if (validatedTasks.length === 0) {
        handleAddTask();
      }
    } catch (error: any) {
      console.error('Error processing transcript:', error);
      
      // Enhanced error handling with detailed information
      const errorMessage = error.message || 'Failed to process transcript';
      const errorDetails = error.stack || JSON.stringify(error);
      console.error('Error details:', errorDetails);
      
      // Set a user-friendly error message with a hint to check console for details
      setProcessingError(`${errorMessage}. See console for more details.`);
      
      // Add a default task even if there's an error
      handleAddTask();
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    const newTask: ExtractedTask = {
      id: crypto.randomUUID(),
      description: '',
      suggestedPhaseId: phases.length > 0 ? phases[0].id : null,
      suggestedPhaseName: phases.length > 0 ? phases[0].name : null,
      suggestedTaskId: null,
      suggestedTaskName: null,
      owner: counsellor?.name || null,
      dueDate: null,
      priority: 'Medium',
      notes: null,
      isNew: true
    };
    
    setExtractedTasks(prev => [...prev, newTask]);
    setEditingTaskId(newTask.id);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleSaveTask = (taskId: string, updatedTask: Partial<ExtractedTask>) => {
    setExtractedTasks(tasks => tasks.map(task => 
      task.id === taskId ? { ...task, ...updatedTask } : task
    ));
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setExtractedTasks(tasks => tasks.map(task => 
      task.id === taskId ? { ...task, isDeleted: true } : task
    ));
  };

  const handleRestoreTask = (taskId: string) => {
    setExtractedTasks(tasks => tasks.map(task => 
      task.id === taskId ? { ...task, isDeleted: false } : task
    ));
  };

  const handleCreateSubtasks = async () => {
    setCreatingSubtasks(true);
    setProcessingError(null);
    try {
      console.log('Creating subtasks from transcript...');
      
      // Filter out deleted tasks
      const tasksToCreate = extractedTasks.filter(task => !task.isDeleted);
      
      // Return early if no tasks to create
      if (tasksToCreate.length === 0) {
        setCreateSuccess(true);
        // Clear localStorage upon successful creation
        localStorage.removeItem(localStorageKey);
        return;
      }
      
      // Create subtasks for each extracted task
      const createdSubtasks = [];
      
      for (const task of tasksToCreate) {
        if (!task.description.trim()) continue;
        
        // Determine which task_id to use
        const targetTaskId = task.suggestedTaskId || null;
        
        if (!targetTaskId) {
          console.warn('No task ID for subtask:', task.description);
          continue;
        }
        
        // Create the subtask
        const { data, error } = await supabase
          .from('student_subtasks')
          .insert({
            name: task.description,
            student_id: studentId,
            task_id: targetTaskId,
            status: 'yet_to_start',
            remark: task.notes || undefined,
            eta: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
            owner: task.owner || undefined
          })
          .select();
        
        if (error) throw error;
        createdSubtasks.push(data);
      }
      
      // Update the note to mark it as processed
      const { error: noteError } = await supabase
        .from('notes')
        .update({ 
          title: `Transcript (${tasksToCreate.length} tasks extracted)`
        })
        .eq('id', noteId);
      
      if (noteError) throw noteError;
      
      console.log('Created subtasks successfully:', createdSubtasks.length);
      setCreateSuccess(true);
      
      // Clear localStorage upon successful creation
      localStorage.removeItem(localStorageKey);
      
      setTimeout(() => {
        onTasksCreated();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating subtasks:', error);
      const errorMessage = error.message || 'Failed to create subtasks';
      const errorDetails = error.stack || JSON.stringify(error);
      console.error('Error details:', errorDetails);
      
      // Set user-friendly error message
      setProcessingError(`${errorMessage}. Please try again or check the console for more details.`);
    } finally {
      setCreatingSubtasks(false);
    }
  };
  
  // Handle cancellation - clear localStorage
  const handleCancel = () => {
    localStorage.removeItem(localStorageKey);
    console.log("Cleared localStorage on cancel");
    onClose();
  };

  // Task Editor component
  const TaskEditor = ({ task }: { task: ExtractedTask }) => {
    const [editedTask, setEditedTask] = useState<ExtractedTask>({ ...task });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setEditedTask({
        ...editedTask,
        [e.target.name]: e.target.value
      });
    };
    
    const handlePhaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const phaseId = e.target.value;
      const phase = phases.find(p => p.id === phaseId);
      
      setEditedTask({
        ...editedTask,
        suggestedPhaseId: phaseId,
        suggestedPhaseName: phase?.name || null,
        // Reset task when phase changes
        suggestedTaskId: null,
        suggestedTaskName: null
      });
    };
    
    const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const taskId = e.target.value;
      const task = tasks.find(t => t.id === taskId);
      
      setEditedTask({
        ...editedTask,
        suggestedTaskId: taskId,
        suggestedTaskName: task?.name || null
      });
    };
    
    const handleDateChange = (date: Date | null) => {
      setEditedTask({
        ...editedTask,
        dueDate: date ? date.toISOString().split('T')[0] : null
      });
    };
    
    const getPhaseTaskOptions = () => {
      if (!editedTask.suggestedPhaseId) return [];
      return tasks.filter(task => task.phase_id === editedTask.suggestedPhaseId);
    };
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtask Description
          </label>
          <textarea
            name="description"
            value={editedTask.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phase
            </label>
            <select
              name="suggestedPhaseId"
              value={editedTask.suggestedPhaseId || ''}
              onChange={handlePhaseChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select Phase</option>
              {phases.map(phase => (
                <option key={phase.id} value={phase.id}>
                  {phase.sequence}. {phase.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task
            </label>
            <select
              name="suggestedTaskId"
              value={editedTask.suggestedTaskId || ''}
              onChange={handleTaskChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={!editedTask.suggestedPhaseId}
            >
              <option value="">Select Task</option>
              {getPhaseTaskOptions().map(task => (
                <option key={task.id} value={task.id}>
                  {task.sequence}. {task.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner
            </label>
            <select
              name="owner"
              value={editedTask.owner || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select Owner</option>
              {student && (
                <option value={student.name}>{student.name} (Student)</option>
              )}
              {counsellor && (
                <option value={counsellor.name}>{counsellor.name} (Counsellor)</option>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <DatePicker
              selected={editedTask.dueDate ? new Date(editedTask.dueDate) : null}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholderText="Select date"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={editedTask.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={editedTask.notes || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows={2}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={() => setEditingTaskId(null)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={() => handleSaveTask(task.id!, editedTask)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>
      </div>
    );
  };

  // Task View component
  const TaskView = ({ task }: { task: ExtractedTask }) => {
    const priorityColors = {
      'High': 'text-red-600 bg-red-50 border-red-200',
      'Medium': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Low': 'text-green-600 bg-green-50 border-green-200'
    };
    
    const getPhaseTaskDisplay = () => {
      if (task.suggestedPhaseName && task.suggestedTaskName) {
        return `${task.suggestedPhaseName} > ${task.suggestedTaskName}`;
      } else if (task.suggestedPhaseName) {
        return task.suggestedPhaseName;
      } else if (task.suggestedTaskName) {
        return task.suggestedTaskName;
      }
      return 'Not assigned';
    };
    
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${task.isDeleted ? 'opacity-50' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex-1 line-clamp-2">
            {task.description}
          </h3>
          <div className="flex space-x-2">
            {task.isDeleted ? (
              <button
                onClick={() => handleRestoreTask(task.id!)}
                className="text-indigo-600 hover:text-indigo-800"
                title="Restore"
              >
                <ArrowUpCircle className="h-5 w-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleEditTask(task.id!)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Edit"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id!)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <div className="flex items-start flex-wrap">
            <span className="text-gray-500 mr-1 whitespace-nowrap">Phase/Task:</span>
            <span className="text-gray-800 font-medium break-words">
              {getPhaseTaskDisplay()}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">Owner:</span>
            <span className="text-gray-800 font-medium truncate max-w-[150px]">
              {task.owner || 'Unassigned'}
            </span>
          </div>
          
          {task.dueDate && (
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
              <span className="text-gray-800">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColors[task.priority]}`}>
              {task.priority} Priority
            </span>
          </div>
        </div>
        
        {task.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (createSuccess) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-xl p-5 md:p-6 max-w-lg w-full mx-auto text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Subtasks Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            {extractedTasks.filter(t => !t.isDeleted).length} subtasks have been added to the student's roadmap.
          </p>
          <button
            onClick={onTasksCreated}
            className="inline-flex items-center justify-center px-4 py-2 md:px-5 md:py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-3 md:p-0">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            Review Extracted Subtasks
          </h2>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
        
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Review the subtasks extracted from your transcript. You can edit, delete, or add new subtasks before creating them in the student's roadmap.
            {extractedTasks.length > 0 && ` Your work is automatically saved in case of a browser crash.`}
          </p>
        </div>
        
        {processingError && (
          <div className="px-4 md:px-6 py-3 md:py-4 bg-red-50 border-b border-red-100">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error processing transcript</h3>
                <p className="mt-1 text-sm text-red-700">{processingError}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-12">
              <Loader className="h-10 w-10 md:h-12 md:w-12 text-indigo-500 animate-spin" />
              <p className="mt-4 text-gray-600">Processing transcript...</p>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6">
              {extractedTasks.length === 0 ? (
                <div className="text-center py-10 md:py-12">
                  <p className="text-gray-500">No subtasks were extracted from this transcript.</p>
                  <button
                    onClick={handleAddTask}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subtask Manually
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {extractedTasks.filter(t => !t.isDeleted).length} Subtasks Found
                    </h3>
                    <button
                      onClick={handleAddTask}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subtask
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {extractedTasks.map(task => (
                      <AnimatePresence key={task.id} mode="wait">
                        {editingTaskId === task.id ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <TaskEditor task={task} />
                          </motion.div>
                        ) : !task.isDeleted || task.isDeleted === false ? (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <TaskView task={task} />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-col xs:flex-row justify-between items-center gap-3 xs:gap-0 bg-gray-50">
          <div>
            <span className="text-sm text-gray-500">
              {extractedTasks.filter(t => !t.isDeleted).length} subtasks will be created
            </span>
          </div>
          <div className="flex flex-col xs:flex-row space-y-3 xs:space-y-0 xs:space-x-3 w-full xs:w-auto">
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleCreateSubtasks}
              disabled={loading || creatingSubtasks || extractedTasks.filter(t => !t.isDeleted).length === 0}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading || creatingSubtasks || extractedTasks.filter(t => !t.isDeleted).length === 0 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {creatingSubtasks ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Creating Subtasks...
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Create Subtasks
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}