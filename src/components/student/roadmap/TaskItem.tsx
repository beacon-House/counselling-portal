/**
 * Task item component
 * Displays a task with expand/collapse functionality and subtask management
 */
import React, { useState, useRef } from 'react';
import { ChevronRight, Plus, Loader, HelpCircle, ClipboardList } from 'lucide-react';
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
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
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
          sequence: maxSequence + 1 // Add to the end
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

  return (
    <div key={task.id} className="mt-2">
      <motion.div 
        className={`flex justify-between items-center p-2.5 md:p-3 cursor-pointer rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        onClick={onToggleTask}
        whileHover={{ backgroundColor: "rgb(243 244 246)" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center min-w-0">
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
          </motion.div>
          <div className="relative">
            <span className="text-gray-700 truncate">{task.sequence}. {task.name}</span>
            
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
                className="absolute z-10 bg-gray-800 text-white text-xs p-2 rounded-md shadow-lg max-w-xs"
                style={{
                  top: '100%',
                  left: '0',
                  marginTop: '8px',
                  whiteSpace: 'normal',
                  ...getTooltipPosition()
                }}
              >
                {task.subtask_suggestion}
                <div 
                  className="absolute w-2 h-2 bg-gray-800 transform rotate-45" 
                  style={{
                    top: '-4px',
                    left: '12px'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Subtask count indicator - always visible */}
        <div className="flex items-center">
          <span className="flex items-center text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            {subtasks.length} subtasks
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