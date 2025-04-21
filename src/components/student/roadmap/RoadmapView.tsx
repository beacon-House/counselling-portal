/**
 * Roadmap view component
 * Displays the student's progress through the roadmap
 */
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Phase, Task, Subtask } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import CreateSubtaskModal from './CreateSubtaskModal';
import SubtaskList from './SubtaskList';

interface RoadmapViewProps {
  phases: Phase[];
  studentId: string;
  activePhaseId: string | null;
  activeTaskId: string | null;
  setActivePhaseId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
}

export default function RoadmapView({ 
  phases, 
  studentId,
  activePhaseId,
  activeTaskId, 
  setActivePhaseId,
  setActiveTaskId
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
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Roadmap Progress</h2>
      
      <div className="space-y-4">
        {phases.map(phase => (
          <div key={phase.id} className="border border-gray-200 rounded-md">
            <div 
              className={`flex justify-between items-center p-3 cursor-pointer ${
                activePhaseId === phase.id ? 'bg-gray-50' : 'bg-white'
              }`}
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-center">
                {expandedPhases[phase.id] ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                )}
                <span className="font-medium">{phase.sequence}. {phase.name}</span>
              </div>
            </div>
            
            {expandedPhases[phase.id] && phase.tasks && (
              <div className="pl-8 pr-3 pb-3">
                {phase.tasks.map(task => (
                  <div key={task.id} className="mt-2">
                    <div 
                      className={`flex justify-between items-center p-2 cursor-pointer rounded-md ${
                        activeTaskId === task.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleTask(task.id, phase.id)}
                    >
                      <div className="flex items-center">
                        {expandedTasks[task.id] ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                        )}
                        <span>{task.sequence}. {task.name}</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateSubtaskModal(task.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                    
                    {expandedTasks[task.id] && (
                      <div className="pl-6 mt-1">
                        <SubtaskList 
                          subtasks={subtasks[task.id] || []} 
                          studentId={studentId} 
                          taskId={task.id}
                          onSubtaskUpdate={fetchAllSubtasks}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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