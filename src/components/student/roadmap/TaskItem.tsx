/**
 * Task item component
 * Displays a task with expand/collapse functionality and subtask management
 */
import React, { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Task, Subtask } from '../../../types/types';
import SubtaskList from './SubtaskList';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  isExpanded: boolean;
  phaseId: string;
  studentId: string;
  subtasks: Subtask[];
  onToggleTask: () => void;
  onOpenSubtaskModal: (taskId: string) => void;
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
  onOpenSubtaskModal,
  onSubtaskUpdate,
  onOpenFab
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

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
        
        {/* Add Subtask button - visible on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenSubtaskModal(task.id);
              }}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 group relative"
              title="Add subtask"
            >
              <Plus className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700" />
              
              {/* Tooltip */}
              <span className="absolute right-full mr-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Add subtask
              </span>
            </motion.button>
          )}
        </AnimatePresence>
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
              <SubtaskList 
                subtasks={subtasks || []} 
                studentId={studentId} 
                taskId={task.id}
                onSubtaskUpdate={onSubtaskUpdate}
                onOpenFab={(subtaskId) => onOpenFab(phaseId, task.id, subtaskId)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}