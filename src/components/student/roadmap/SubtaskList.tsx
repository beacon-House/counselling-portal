/**
 * Component to display and manage subtasks for a task
 */
import React from 'react';
import { Subtask } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import { Check, Clock, Play, AlertCircle, X } from 'lucide-react';

interface SubtaskListProps {
  subtasks: Subtask[];
  studentId: string;
  taskId: string;
  onSubtaskUpdate: () => void;
}

export default function SubtaskList({ subtasks, studentId, taskId, onSubtaskUpdate }: SubtaskListProps) {
  const handleStatusChange = async (subtaskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('student_subtasks')
        .update({ status: newStatus })
        .eq('id', subtaskId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      onSubtaskUpdate();
    } catch (error) {
      console.error('Error updating subtask status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'not_applicable':
        return <X className="h-4 w-4 text-gray-500" />;
      default: // yet_to_start
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'yet_to_start':
        return 'Yet to Start';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      case 'blocked':
        return 'Blocked';
      case 'not_applicable':
        return 'Not Applicable';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      case 'not_applicable':
        return 'bg-gray-100 text-gray-500';
      default: // yet_to_start
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (subtasks.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No subtasks yet. Create one to get started.
      </div>
    );
  }

  return (
    <ul className="space-y-2 py-2">
      {subtasks.map(subtask => (
        <li key={subtask.id} className="flex items-center justify-between py-1">
          <span className="text-sm">{subtask.name}</span>
          
          <div className="relative group">
            <button 
              className={`flex items-center px-2 py-1 rounded-md text-xs ${getStatusColor(subtask.status)}`}
            >
              <span className="mr-1.5">{getStatusIcon(subtask.status)}</span>
              <span>{getStatusText(subtask.status)}</span>
            </button>
            
            {/* Status dropdown menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <button
                onClick={() => handleStatusChange(subtask.id, 'yet_to_start')}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                Yet to Start
              </button>
              <button
                onClick={() => handleStatusChange(subtask.id, 'in_progress')}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Play className="mr-2 h-4 w-4 text-blue-600" />
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange(subtask.id, 'done')}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Done
              </button>
              <button
                onClick={() => handleStatusChange(subtask.id, 'blocked')}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                Blocked
              </button>
              <button
                onClick={() => handleStatusChange(subtask.id, 'not_applicable')}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4 text-gray-500" />
                Not Applicable
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}