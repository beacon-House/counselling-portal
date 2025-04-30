/**
 * Task item component
 * Displays a task with expand/collapse functionality and subtask management
 */
import React, { useState } from 'react';
import { ChevronRight, Plus, Loader } from 'lucide-react';
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

  // Function to create a new subtask inline
  const createNewSubtask = async () => {
    setIsCreatingSubtask(true);
    try {
      const { data, error } = await supabase
        .from('student_subtasks')
        .insert({
          name: "New Subtask", // Default name
          student_id: studentId,
          task_id: task.id,
          status: 'yet_to_start'
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

  return (
    <div key={task.id} className="mt-2">
      <motion.div 
        className={`flex justify-between items-center p-3 cursor-pointer rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        onClick={onToggleTask}
        whileHover={{ backgroundColor: "rgb(243 244 246)" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center">
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
          </motion.div>
          <span className="text-gray-700">{task.sequence}. {task.name}</span>
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
            <div className="pl-9 mt-1 ml-2">
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