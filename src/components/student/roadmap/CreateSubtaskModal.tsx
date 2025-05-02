/**
 * Modal for creating a new subtask
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Subtask, Task } from '../../../types/types';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  studentId: string;
  onSubtaskCreated: (subtask: Subtask) => void;
}

export default function CreateSubtaskModal({
  isOpen,
  onClose,
  taskId,
  studentId,
  onSubtaskCreated
}: CreateSubtaskModalProps) {
  const [subtaskName, setSubtaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fetch task details to get the suggestion
  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      setTask(data as Task);
    } catch (err) {
      console.error('Error fetching task details:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('student_subtasks')
        .insert({
          name: subtaskName.trim(),
          student_id: studentId,
          task_id: taskId,
          status: 'yet_to_start'
        })
        .select()
        .single();

      if (error) throw error;
      
      onSubtaskCreated(data as Subtask);
      onClose();
    } catch (err) {
      console.error('Error creating subtask:', err);
      setError('Failed to create subtask. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            ref={modalRef}
            className="bg-white rounded-xl shadow-lg p-5 md:p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-light text-gray-800">Add New Subtask</h3>
              <motion.button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Task suggestion */}
            {task?.subtask_suggestion && (
              <div className="mb-5 bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Suggestion</h4>
                    <p className="text-sm text-gray-600">{task.subtask_suggestion}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="subtask-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Subtask Name *
                </label>
                <input
                  ref={inputRef}
                  id="subtask-name"
                  type="text"
                  value={subtaskName}
                  onChange={(e) => setSubtaskName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                  placeholder="Enter subtask name"
                />
              </div>

              <div className="flex flex-col xs:flex-row justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !subtaskName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Adding...' : 'Add Subtask'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}