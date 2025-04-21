/**
 * Modal for creating a new subtask
 */
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Subtask } from '../../../types/types';

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
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add New Subtask</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subtask-name" className="block text-sm font-medium text-gray-700 mb-1">
              Subtask Name *
            </label>
            <input
              ref={inputRef}
              id="subtask-name"
              type="text"
              value={subtaskName}
              onChange={(e) => setSubtaskName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Enter subtask name"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !subtaskName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Subtask'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}