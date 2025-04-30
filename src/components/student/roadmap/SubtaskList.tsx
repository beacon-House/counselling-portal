/**
 * Component to display and manage subtasks for a task
 */
import React, { useState, useRef, useEffect } from 'react';
import { Subtask } from '../../../types/types';
import { supabase } from '../../../lib/supabase';
import { Check, Clock, Play, AlertCircle, X, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useGenerateContext } from '../../../hooks/useGenerateContext';

interface SubtaskListProps {
  subtasks: Subtask[];
  studentId: string;
  taskId: string;
  onSubtaskUpdate: () => void;
  onOpenFab?: (subtaskId: string) => void;
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
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            ref={modalRef}
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-light text-gray-800">Add Remark</h3>
              <motion.button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                onChange={(e) => setRemark(e.target.value.slice(0, 50))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 resize-none"
                placeholder="Enter a brief remark (50 chars max)"
                rows={3}
                maxLength={50}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {remark.length}/50 characters
                </span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
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
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200"
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

// Dropdown Menu Component - This will be rendered via portal
const StatusDropdown = ({ 
  subtaskId, 
  position, 
  onStatusSelect, 
  currentRemark, 
  onClose 
}: { 
  subtaskId: string, 
  position: { top: number, left: number, width: number }, 
  onStatusSelect: (subtaskId: string, status: string, remark?: string) => void,
  currentRemark?: string,
  onClose: () => void
}) => {
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

  return createPortal(
    <div 
      ref={dropdownRef}
      className="fixed bg-white rounded-lg shadow-lg py-1 border border-gray-200"
      style={{
        top: position.top + 'px',
        left: position.left + 'px',
        width: position.width + 'px',
        zIndex: 9999,
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

export default function SubtaskList({ subtasks, studentId, taskId, onSubtaskUpdate, onOpenFab }: SubtaskListProps) {
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<{id: string, status: string, remark?: string} | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [hoveredSubtask, setHoveredSubtask] = useState<string | null>(null);
  const statusButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Get the context generation function from our custom hook
  const { generateContext } = useGenerateContext();
  
  const openRemarkModal = (subtaskId: string, newStatus: string, currentRemark?: string) => {
    setSelectedSubtask({ id: subtaskId, status: newStatus, remark: currentRemark });
    setIsRemarkModalOpen(true);
    setOpenDropdown(null);
  };
  
  const handleSaveRemark = async (remark: string) => {
    if (!selectedSubtask) return;
    
    try {
      const { error } = await supabase
        .from('student_subtasks')
        .update({ 
          status: selectedSubtask.status,
          remark: remark || null // Save empty string as null
        })
        .eq('id', selectedSubtask.id)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // If the status is now 'done', trigger student context update
      if (selectedSubtask.status === 'done') {
        console.log('Subtask marked as done, updating student context');
        
        // Update the context for this student
        await generateContext(studentId);
      }
      
      onSubtaskUpdate();
      setIsRemarkModalOpen(false);
      setSelectedSubtask(null);
    } catch (error) {
      console.error('Error updating subtask status:', error);
    }
  };
  
  const toggleSubtaskDetails = (subtaskId: string) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [subtaskId]: !prev[subtaskId]
    }));
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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'blocked':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'not_applicable':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default: // yet_to_start
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const toggleDropdown = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    
    if (openDropdown === subtaskId) {
      setOpenDropdown(null);
      return;
    }
    
    const buttonElement = statusButtonRefs.current[subtaskId];
    if (!buttonElement) return;
    
    const rect = buttonElement.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });
    
    setOpenDropdown(subtaskId);
  };

  const handleSubtaskClick = (subtaskId: string) => {
    // When clicking on a subtask, open the FAB with that subtask context
    if (onOpenFab) {
      onOpenFab(subtaskId);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (subtasks.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-3 pl-2">
        No subtasks yet. Create one to get started.
      </div>
    );
  }

  return (
    <>
      <motion.ul 
        className="space-y-3 py-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {subtasks.map(subtask => (
          <motion.li 
            key={subtask.id} 
            className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-visible"
            variants={item}
            onMouseEnter={() => setHoveredSubtask(subtask.id)}
            onMouseLeave={() => setHoveredSubtask(null)}
            onClick={() => handleSubtaskClick(subtask.id)}
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700 truncate">{subtask.name}</span>
                {subtask.remark && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtaskDetails(subtask.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="View remark"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  ref={el => statusButtonRefs.current[subtask.id] = el}
                  data-dropdown-trigger="true"
                  onClick={(e) => toggleDropdown(e, subtask.id)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm border ${getStatusColor(subtask.status)} min-w-[140px] hover:shadow-sm transition-all`}
                >
                  <span className="flex items-center">
                    <span className="mr-1.5">{getStatusIcon(subtask.status)}</span>
                    <span>{getStatusText(subtask.status)}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${openDropdown === subtask.id ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Expanded details section with remark */}
            <AnimatePresence>
              {expandedSubtasks[subtask.id] && subtask.remark && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-gray-50 border-t border-gray-100"
                >
                  <div className="p-3 text-xs text-gray-600">
                    <p className="italic">{subtask.remark}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </motion.ul>
      
      {/* Dropdown Menu - Rendered outside any container via portal */}
      {openDropdown && (
        <StatusDropdown
          subtaskId={openDropdown}
          position={dropdownPosition}
          onStatusSelect={openRemarkModal}
          currentRemark={subtasks.find(s => s.id === openDropdown)?.remark}
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
    </>
  );
}