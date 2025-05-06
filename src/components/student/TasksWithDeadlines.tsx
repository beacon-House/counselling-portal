/**
 * Tasks with Deadlines component
 * Displays a list of tasks with deadlines and owners
 * Allows direct editing of status, owner, and deadline
 */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, User, AlertTriangle, Search, Clock, CheckCircle, AlertCircle, 
  X, Check, Play, Filter, ChevronDown, Loader, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isToday, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { createPortal } from 'react-dom';
import SubtaskOwnerSelect from './SubtaskOwnerSelect';
import { Student } from '../../types/types';

interface TasksWithDeadlinesProps {
  studentId: string;
}

interface TaskWithDeadline {
  id: string;
  name: string;
  task_name: string;
  phase_name: string;
  eta: string | null;
  owner: string[] | null;
  status: string;
  remark: string | null;
}

interface StatusDropdownProps {
  subtaskId: string;
  position: { top: number; left: number; width: number };
  onStatusSelect: (subtaskId: string, status: string, remark?: string) => void;
  currentRemark?: string;
  onClose: () => void;
}

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (remark: string) => void;
  currentRemark?: string;
}

// Remark Modal Component
const RemarkModal = ({ isOpen, onClose, onSave, currentRemark = '' }: RemarkModalProps) => {
  const [remark, setRemark] = useState(currentRemark);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setRemark(currentRemark);
  }, [currentRemark]);
  
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  const handleSave = () => {
    onSave(remark);
  };
  
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-light text-gray-800">Add Remark</h3>
              <motion.button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
            
            <div className="mb-5">
              <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                Add a brief note about this status change (optional):
              </label>
              <textarea
                ref={textareaRef}
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value.slice(0, 120))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 resize-none"
                placeholder="Enter a brief remark (120 chars max)"
                rows={3}
                maxLength={120}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {remark.length}/120 characters
                </span>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 order-2 xs:order-1"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 order-1 xs:order-2"
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Status Dropdown Component - Rendered via portal
const StatusDropdown = ({ subtaskId, position, onStatusSelect, currentRemark, onClose }: StatusDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position based on screen size to prevent off-screen rendering
  const calculatePosition = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const menuWidth = 160; // Approximate dropdown width
    const menuHeight = 175; // Approximate dropdown height
    
    let left = position.left;
    let top = position.top;
    
    // Ensure the dropdown stays within the screen horizontally
    if (left + menuWidth > screenWidth - 10) {
      left = screenWidth - menuWidth - 10;
    }
    
    // Make sure it's not positioned off the left edge
    if (left < 10) {
      left = 10;
    }
    
    // Ensure the dropdown stays within the screen vertically
    if (top + menuHeight > screenHeight - 10) {
      top = position.top - menuHeight - 10;
    }
    
    return {
      top,
      left,
    };
  };
  
  const adjustedPosition = calculatePosition();

  return createPortal(
    <div 
      ref={dropdownRef}
      className="fixed bg-white rounded-lg shadow-lg py-1 border border-gray-200 z-[9999] w-40"
      style={{
        top: adjustedPosition.top + 'px',
        left: adjustedPosition.left + 'px',
      }}
    >
      <button
        onClick={() => onStatusSelect(subtaskId, 'yet_to_start', currentRemark)}
        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Clock className="mr-2 h-4 w-4 text-gray-500" />
        Yet to Start
      </button>
      <button
        onClick={() => onStatusSelect(subtaskId, 'in_progress', currentRemark)}
        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Play className="mr-2 h-4 w-4 text-blue-600" />
        In Progress
      </button>
      <button
        onClick={() => onStatusSelect(subtaskId, 'done', currentRemark)}
        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Check className="mr-2 h-4 w-4 text-green-600" />
        Done
      </button>
      <button
        onClick={() => onStatusSelect(subtaskId, 'blocked', currentRemark)}
        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
        Blocked
      </button>
      <button
        onClick={() => onStatusSelect(subtaskId, 'not_applicable', currentRemark)}
        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <X className="mr-2 h-4 w-4 text-gray-500" />
        Not Applicable
      </button>
    </div>,
    document.body
  );
};

export default function TasksWithDeadlines({ studentId }: TasksWithDeadlinesProps) {
  const [tasks, setTasks] = useState<TaskWithDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  
  // State for status editing
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<{id: string, status: string, remark?: string} | null>(null);
  
  // Status refs
  const statusButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Loading states
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchStudent();
  }, [studentId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch subtasks with task and phase information
      const { data, error } = await supabase
        .from('student_subtasks')
        .select(`
          id,
          name,
          eta,
          owner,
          status,
          remark,
          tasks:task_id (
            name,
            phases:phase_id (
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .order('eta', { ascending: true, nullsLast: true });

      if (error) throw error;

      // Transform the data to a more usable format
      const transformedData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        task_name: item.tasks?.name || 'Unknown Task',
        phase_name: item.tasks?.phases?.name || 'Unknown Phase',
        eta: item.eta,
        owner: item.owner,
        status: item.status,
        remark: item.remark
      }));

      setTasks(transformedData);
    } catch (err) {
      console.error('Error fetching tasks with deadlines:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      setStudent(data as Student);
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

  // Filter tasks by search term
  const filteredTasks = tasks.filter(task => 
    (task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.task_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.phase_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.owner?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Group tasks by deadline status: Overdue, Today, Upcoming, No Deadline
  const groupedTasks = {
    overdue: filteredTasks.filter(task => task.eta && isPast(new Date(task.eta)) && !isToday(new Date(task.eta)) && task.status !== 'done'),
    today: filteredTasks.filter(task => task.eta && isToday(new Date(task.eta)) && task.status !== 'done'),
    upcoming: filteredTasks.filter(task => task.eta && !isPast(new Date(task.eta)) && !isToday(new Date(task.eta)) && task.status !== 'done'),
    noDeadline: filteredTasks.filter(task => !task.eta && task.status !== 'done'),
    completed: filteredTasks.filter(task => task.status === 'done')
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'not_applicable':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: // yet_to_start
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  // Get status icon
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

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'yet_to_start': return 'Yet to Start';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      case 'blocked': return 'Blocked';
      case 'not_applicable': return 'Not Applicable';
      default: return status;
    }
  };

  // Toggle status dropdown
  const toggleDropdown = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    
    if (openDropdown === subtaskId) {
      setOpenDropdown(null);
      return;
    }
    
    const buttonElement = statusButtonRefs.current[subtaskId];
    if (!buttonElement) return;
    
    const rect = buttonElement.getBoundingClientRect();
    
    // Position dropdown below the button
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left,
      width: rect.width
    });
    
    setOpenDropdown(subtaskId);
  };

  // Open remark modal when status is selected
  const openRemarkModal = (subtaskId: string, newStatus: string, currentRemark?: string) => {
    setSelectedSubtask({ id: subtaskId, status: newStatus, remark: currentRemark });
    setIsRemarkModalOpen(true);
    setOpenDropdown(null);
  };
  
  // Save remark and update task status
  const handleSaveRemark = async (remark: string) => {
    if (!selectedSubtask) return;
    
    try {
      setSavingTaskId(selectedSubtask.id);
      
      const { error } = await supabase
        .from('student_subtasks')
        .update({ 
          status: selectedSubtask.status,
          remark: remark || null // Save empty string as null
        })
        .eq('id', selectedSubtask.id)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Update local task state
      setTasks(tasks.map(task => {
        if (task.id === selectedSubtask.id) {
          return {
            ...task,
            status: selectedSubtask.status,
            remark: remark || null
          };
        }
        return task;
      }));
      
      setIsRemarkModalOpen(false);
      setSelectedSubtask(null);
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  };

  // Handle ETA date changes
  const handleEtaChange = async (subtaskId: string, date: Date | null) => {
    try {
      setSavingTaskId(subtaskId);
      
      const { error } = await supabase
        .from('student_subtasks')
        .update({
          eta: date ? date.toISOString() : null
        })
        .eq('id', subtaskId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Update local task state
      setTasks(tasks.map(task => {
        if (task.id === subtaskId) {
          return {
            ...task,
            eta: date ? date.toISOString() : null
          };
        }
        return task;
      }));
    } catch (error) {
      console.error('Error updating task deadline:', error);
      setError('Failed to update deadline. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  };

  // Handle owner changes
  const handleOwnersChange = async (subtaskId: string, owners: string[]) => {
    try {
      setSavingTaskId(subtaskId);
      
      const { error } = await supabase
        .from('student_subtasks')
        .update({
          owner: owners.length > 0 ? owners : null // Store as null if empty array
        })
        .eq('id', subtaskId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Update local task state
      setTasks(tasks.map(task => {
        if (task.id === subtaskId) {
          return {
            ...task,
            owner: owners.length > 0 ? owners : null
          };
        }
        return task;
      }));
    } catch (error) {
      console.error('Error updating task owners:', error);
      setError('Failed to update owners. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  // Render task group section
  const renderTaskGroup = (title: string, tasks: TaskWithDeadline[], icon: React.ReactNode, colorClass: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className={`text-sm font-medium ${colorClass} mb-4 flex items-center`}>
          {icon}
          <span className="ml-2">{title} ({tasks.length})</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase/Task</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{task.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.phase_name} &gt; {task.task_name}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <DatePicker 
                        selected={task.eta ? parseISO(task.eta) : null}
                        onChange={(date) => handleEtaChange(task.id, date)}
                        dateFormat="MMM d, yyyy"
                        className="text-sm rounded border border-gray-200 py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-gray-300 w-32"
                        placeholderText="Set date"
                        isClearable
                        disabled={savingTaskId === task.id}
                      />
                      {savingTaskId === task.id && (
                        <Loader className="ml-2 h-3 w-3 animate-spin text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <SubtaskOwnerSelect
                      currentOwners={task.owner}
                      student={student}
                      onOwnersChange={(owners) => handleOwnersChange(task.id, owners)}
                    />
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      ref={el => statusButtonRefs.current[task.id] = el}
                      onClick={(e) => toggleDropdown(e, task.id)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm border ${getStatusBadge(task.status)} hover:shadow-sm transition-all min-w-[140px]`}
                      disabled={savingTaskId === task.id}
                    >
                      <span className="flex items-center">
                        <span className="mr-1.5">{getStatusIcon(task.status)}</span>
                        <span>{getStatusText(task.status)}</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${openDropdown === task.id ? 'rotate-180' : ''}`} />
                    </button>
                    {task.remark && (
                      <div className="mt-1 text-xs text-gray-500 italic max-w-xs">
                        Note: {task.remark}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-light text-gray-800">Tasks with Deadlines</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          title="Refresh tasks"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="ml-auto text-red-500 hover:text-red-700 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tasks, phases, or owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      ) : (
        <div>
          {/* Render task groups */}
          {renderTaskGroup(
            "Overdue Tasks", 
            groupedTasks.overdue, 
            <AlertTriangle className="h-4 w-4 text-red-500" />, 
            "text-red-600"
          )}
          
          {renderTaskGroup(
            "Due Today", 
            groupedTasks.today, 
            <Calendar className="h-4 w-4 text-amber-500" />, 
            "text-amber-600"
          )}
          
          {renderTaskGroup(
            "Upcoming Tasks", 
            groupedTasks.upcoming, 
            <Calendar className="h-4 w-4 text-blue-500" />, 
            "text-blue-600"
          )}
          
          {renderTaskGroup(
            "Tasks without Deadline", 
            groupedTasks.noDeadline, 
            <Clock className="h-4 w-4 text-gray-500" />, 
            "text-gray-600"
          )}
          
          {renderTaskGroup(
            "Completed Tasks", 
            groupedTasks.completed, 
            <CheckCircle className="h-4 w-4 text-green-500" />, 
            "text-green-600"
          )}
          
          {/* No tasks message */}
          {filteredTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100"
            >
              <h3 className="text-gray-600 font-medium mb-1">No tasks found</h3>
              <p className="text-gray-500">
                {searchTerm ? 
                  "No tasks match your search. Try different keywords." : 
                  "There are no tasks with deadlines. Add ETA dates to tasks to see them here."}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Status Dropdown */}
      {openDropdown && (
        <StatusDropdown
          subtaskId={openDropdown}
          position={dropdownPosition}
          onStatusSelect={openRemarkModal}
          currentRemark={tasks.find(t => t.id === openDropdown)?.remark || ''}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      
      {/* Status Change Remark Modal */}
      <RemarkModal
        isOpen={isRemarkModalOpen}
        onClose={() => {
          setIsRemarkModalOpen(false);
          setSelectedSubtask(null);
        }}
        onSave={handleSaveRemark}
        currentRemark={selectedSubtask?.remark || ''}
      />
    </div>
  );
}