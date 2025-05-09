/**
 * Task item component
 * Displays a task with expand/collapse functionality and subtask management
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Plus, Loader, HelpCircle, ClipboardList, Sparkles } from 'lucide-react';
import { Task, Subtask } from '../../../types/types';
import SubtaskList from './SubtaskList';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  isExpanded: boolean;
  phaseId: string;
  studentId: string;
  subtasks: Subtask[];
  onToggleTask: () => void;
  onOpenSubtaskModal: (taskId: string) => void; // Keeping for backward compatibility
  onSubtaskUpdate: () => void;
  onOpenFab: (phaseId: string, taskId: string, subtaskId?: string | null) => void;
}

export default function TaskItem({
  task,
  isActive,
  isExpanded,
  phaseId,
  studentId,
  subtasks,
  onToggleTask,
  onSubtaskUpdate,
  onOpenFab
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasNewAISubtasks, setHasNewAISubtasks] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Memoize the function to check for AI-generated subtasks
  const checkForNewAISubtasks = useCallback(() => {
    const localStorageKey = `viewed_tasks_${studentId}`;
    const viewedTasksData = localStorage.getItem(localStorageKey);
    let viewedTasks: Record<string, boolean> = {};
    
    if (viewedTasksData) {
      try {
        viewedTasks = JSON.parse(viewedTasksData);
      } catch (e) {
        console.error("Error parsing viewed tasks:", e);
      }
    }
    
    // Check if this task has any AI-generated subtasks that haven't been viewed
    const hasAIGeneratedSubtasks = subtasks.some(subtask => 
      subtask.is_ai_generated === true && !viewedTasks[task.id]
    );
    
    // Only update state if there's a change, to avoid unnecessary re-renders
    if (hasAIGeneratedSubtasks !== hasNewAISubtasks) {
      setHasNewAISubtasks(hasAIGeneratedSubtasks);
    }
  }, [subtasks, task.id, studentId, hasNewAISubtasks]);
  
  // Check for AI-generated subtasks when subtasks or task changes
  useEffect(() => {
    checkForNewAISubtasks();
  }, [checkForNewAISubtasks]);
  
  // Function to create a new subtask inline
  const createNewSubtask = async () => {
    setIsCreatingSubtask(true);
    try {
      // Find the highest sequence number already in use
      const maxSequence = subtasks.length > 0 
        ? Math.max(...subtasks.filter(s => s.sequence !== undefined).map(s => s.sequence || 0)) 
        : 0;
      
      const { data, error } = await supabase
        .from('student_subtasks')
        .insert({
          name: "New Subtask", // Default name
          student_id: studentId,
          task_id: task.id,
          status: 'yet_to_start',
          sequence: maxSequence + 1, // Add to the end
          is_ai_generated: false // Mark as manually created
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh subtasks after creating a new one
      onSubtaskUpdate();
    } catch (err) {
      console.error('Error creating subtask:', err);
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  // Show tooltip with delay to prevent accidental triggers
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    if (task.subtask_suggestion) {
      tooltipTimeout.current = setTimeout(() => {
        setShowTooltip(true);
      }, 500); // 500ms delay before showing tooltip
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
    
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = null;
    }
  };

  // Calculate tooltip position to avoid edge cutoff
  const getTooltipPosition = () => {
    if (!tooltipRef.current) return {};
    
    const rect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Check if tooltip is going off the right edge of the screen
    if (rect.right > viewportWidth - 20) {
      return { right: '0', left: 'auto' };
    }
    
    return {};
  };
  
  // Handler for when the task is expanded/viewed
  const handleTaskToggle = () => {
    onToggleTask();
    
    // If this task has AI-generated subtasks, mark it as viewed
    if (hasNewAISubtasks) {
      const localStorageKey = `viewed_tasks_${studentId}`;
      const viewedTasksData = localStorage.getItem(localStorageKey);
      let viewedTasks: Record<string, boolean> = {};
      
      if (viewedTasksData) {
        try {
          viewedTasks = JSON.parse(viewedTasksData);
        } catch (e) {
          console.error("Error parsing viewed tasks:", e);
        }
      }
      
      // Update the viewed status for this task
      viewedTasks[task.id] = true;
      
      // Save to localStorage
      localStorage.setItem(localStorageKey, JSON.stringify(viewedTasks));
      
      // Update state
      setHasNewAISubtasks(false);
    }
  };

  return (
    <div key={task.id} className="mt-2">
      <motion.div 
        className={`flex flex-wrap md:flex-nowrap justify-between items-center p-2.5 md:p-3 cursor-pointer rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        onClick={handleTaskToggle}
        whileHover={{ backgroundColor: "rgb(243 244 246)" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center min-w-0 w-full md:w-auto">
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
          </motion.div>
          <div className="relative flex items-center flex-1 min-w-0">
            <span className="text-gray-700 truncate">{task.sequence}. {task.name}</span>
            
            {/* New Indicator for AI-generated subtasks */}
            {hasNewAISubtasks && (
              <span className="ml-2 relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-indigo-600 whitespace-nowrap hidden sm:block">
                  New AI tasks
                </span>
              </span>
            )}
            
            {/* Hover suggestion button (only when tooltip is not shown) */}
            {task.subtask_suggestion && !showTooltip && (
              <button 
                className="ml-1.5 text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center" 
                aria-label="Task suggestion"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            )}
            
            {/* Tooltip */}
            {showTooltip && task.subtask_suggestion && (
              <div 
                ref={tooltipRef}
                className="absolute z-[9999] bg-white text-gray-800 text-xs p-3 rounded-md shadow-md max-w-xs"
                style={{
                  top: '130%',
                  left: '0',
                  marginTop: '8px',
                  whiteSpace: 'normal',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  ...getTooltipPosition()
                }}
              >
                <div className="font-medium mb-1 text-gray-900">Task Suggestion:</div>
                {task.subtask_suggestion}
                <div 
                  className="absolute w-2 h-2 bg-white transform rotate-45 border-t border-l border-gray-200" 
                  style={{
                    top: '-5px',
                    left: '12px'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Subtask count indicator - simplified to just the number */}
        <div className="flex items-center mt-2 md:mt-0 ml-6 md:ml-0 w-full md:w-auto">
          <span className="flex items-center text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            {subtasks.length}
          </span>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-7 md:pl-9 mt-1 ml-2">
              {/* Subtasks List */}
              <SubtaskList 
                subtasks={subtasks || []} 
                studentId={studentId} 
                taskId={task.id}
                onSubtaskUpdate={onSubtaskUpdate}
                onOpenFab={(subtaskId) => onOpenFab(phaseId, task.id, subtaskId)}
              />
              
              {/* Add Subtask Button - Always visible within expanded task */}
              <div className="mt-3 flex justify-start">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNewSubtask();
                  }}
                  disabled={isCreatingSubtask}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors shadow-sm"
                >
                  {isCreatingSubtask ? (
                    <>
                      <Loader className="h-3.5 w-3.5 mr-1.5 text-white animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      <span>Add Subtask</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}