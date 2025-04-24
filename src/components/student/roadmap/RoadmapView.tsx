/**
 * Roadmap view component
 * Displays the student's progress through the roadmap
 */
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Phase, Task, Subtask } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import CreateSubtaskModal from './CreateSubtaskModal';
import SubtaskList from './SubtaskList';
import TaskItem from './TaskItem';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapViewProps {
  phases: Phase[];
  studentId: string;
  activePhaseId: string | null;
  activeTaskId: string | null;
  setActivePhaseId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
  onOpenFab: (phaseId: string | null, taskId: string | null, subtaskId?: string | null) => void;
}

export default function RoadmapView({ 
  phases, 
  studentId,
  activePhaseId,
  activeTaskId, 
  setActivePhaseId,
  setActiveTaskId,
  onOpenFab
}: RoadmapViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize expanded phases (first one open by default)
    const initialExpandedPhases: Record<string, boolean> = {};
    phases.forEach((phase, index) => {
      initialExpandedPhases[phase.id] = index === 0;
    });
    setExpandedPhases(initialExpandedPhases);

    // Load subtasks for all tasks
    fetchAllSubtasks();
  }, [phases, studentId]);

  const fetchAllSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('student_subtasks')
        .select('*')
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Group subtasks by task_id
      const groupedSubtasks: Record<string, Subtask[]> = {};
      (data as Subtask[]).forEach(subtask => {
        if (!groupedSubtasks[subtask.task_id]) {
          groupedSubtasks[subtask.task_id] = [];
        }
        groupedSubtasks[subtask.task_id].push(subtask);
      });
      
      setSubtasks(groupedSubtasks);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
    
    // Set active phase
    setActivePhaseId(phaseId);
    setActiveTaskId(null);
  };

  const toggleTask = (taskId: string, phaseId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
    
    // Set active task
    setActivePhaseId(phaseId);
    setActiveTaskId(taskId);
  };

  const openCreateSubtaskModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleSubtaskCreated = (newSubtask: Subtask) => {
    setSubtasks(prev => {
      const taskSubtasks = prev[newSubtask.task_id] || [];
      return {
        ...prev,
        [newSubtask.task_id]: [...taskSubtasks, newSubtask]
      };
    });
    
    // Expand the task to show the new subtask
    setExpandedTasks(prev => ({
      ...prev,
      [newSubtask.task_id]: true
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-light mb-6 text-gray-800">Roadmap Progress</h2>
      
      <div className="space-y-4">
        {phases.map(phase => (
          <motion.div 
            key={phase.id} 
            className="border border-gray-100 rounded-lg shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-200 ${
                activePhaseId === phase.id ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{ rotate: expandedPhases[phase.id] ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-5 w-5 text-gray-400 mr-3" />
                </motion.div>
                <span className="font-medium text-gray-700">{phase.sequence}. {phase.name}</span>
              </div>
            </div>
            
            <AnimatePresence>
              {expandedPhases[phase.id] && phase.tasks && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pl-10 pr-4 pb-4 pt-1">
                    {phase.tasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isActive={activeTaskId === task.id}
                        isExpanded={!!expandedTasks[task.id]}
                        phaseId={phase.id}
                        studentId={studentId}
                        subtasks={subtasks[task.id] || []}
                        onToggleTask={() => toggleTask(task.id, phase.id)}
                        onOpenSubtaskModal={openCreateSubtaskModal}
                        onSubtaskUpdate={fetchAllSubtasks}
                        onOpenFab={onOpenFab}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      {isModalOpen && selectedTaskId && (
        <CreateSubtaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTaskId(null);
          }}
          taskId={selectedTaskId}
          studentId={studentId}
          onSubtaskCreated={handleSubtaskCreated}
        />
      )}
    </div>
  );
}